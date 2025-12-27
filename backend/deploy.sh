#!/bin/bash

# ============================================
# Deployment Script for Serverless Backend
# ============================================
# Usage:
#   ./deploy.sh heet          - Deploy to Heet's environment
#   ./deploy.sh test          - Deploy to test environment
#   ./deploy.sh prod          - Deploy to production
#   ./deploy.sh heet --skip-dns - Skip Cloudflare DNS update
#   ./deploy.sh heet --domain-only - Only create/update custom domain
# ============================================

set -e  # Exit on error
# Ensure pipeline failures are detected when commands are piped to `tee`
# Note: pipefail may not work in older Git Bash versions on Windows
set -o pipefail 2>/dev/null || true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Default values
INPUT_STAGE="${1:-heet}"
SKIP_DNS=false
DOMAIN_ONLY=false

# Parse additional arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-dns)
            SKIP_DNS=true
            shift
            ;;
        --domain-only)
            DOMAIN_ONLY=true
            shift
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Normalize stage name - accept both "heet" and "dev-heet" formats
case "$INPUT_STAGE" in
    dhruv|dev-dhruv|devdhruv)
        STAGE="dev-dhruv"
        ;;
    tirth|dev-tirth|devtirth)
        STAGE="dev-tirth"
        ;;
    pooja|dev-pooja|devpooja)
        STAGE="dev-pooja"
        ;;
    heet|dev-heet|devheet)
        STAGE="dev-heet"
        ;;
    test)
        STAGE="test"
        ;;
    prod|production)
        STAGE="prod"
        ;;
    *)
        echo -e "${RED}❌ Invalid stage: $INPUT_STAGE${NC}"
        echo "Usage: ./deploy.sh [dhruv|tirth|pooja|heet|test|prod] [--skip-dns] [--domain-only]"
        echo ""
        echo "Available stages:"
        echo "  dhruv (or dev-dhruv):  Dhruv's development environment"
        echo "  tirth (or dev-tirth):  Tirth's development environment"
        echo "  pooja (or dev-pooja):  Pooja's development environment"
        echo "  heet  (or dev-heet):   Heet's development environment"
        echo "  test:                  Integration/testing environment"
        echo "  prod:                  Production environment"
        exit 1
        ;;
esac

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  🚀 ${CYAN}Deploying to ${YELLOW}$STAGE${CYAN} environment${NC}                          ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for required tools
command -v npx >/dev/null 2>&1 || { echo -e "${RED}❌ npx is required but not installed.${NC}" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}❌ jq is required but not installed.${NC}" >&2; echo -e "${YELLOW}Install with: brew install jq (macOS) or download from https://jqlang.github.io/jq/download/${NC}" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo -e "${RED}❌ curl is required but not installed.${NC}" >&2; exit 1; }

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for environment file
if [[ "$STAGE" == "prod" ]]; then
    ENV_FILE=".env.prod"
    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}❌ Production environment file not found: $ENV_FILE${NC}"
        echo -e "${YELLOW}Please create .env.prod from .env.example${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Using production environment file: $ENV_FILE${NC}"
    # Copy prod env to .env (serverless-dotenv-plugin uses .env)
    cp "$ENV_FILE" .env
else
    # All dev and test stages use .env
    ENV_FILE=".env"
    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}❌ No .env file found. Please create one from .env.example${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Using environment file: $ENV_FILE${NC}"
fi

# Load environment variables for Cloudflare (export them for subshells)
set -a  # automatically export all variables
source .env
set +a  # stop auto-exporting

# Validate required environment variables
validate_env() {
    local missing=()
    
    if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
        missing+=("CLOUDFLARE_API_TOKEN")
    fi
    if [[ -z "$CLOUDFLARE_ZONE_ID" ]]; then
        missing+=("CLOUDFLARE_ZONE_ID")
    fi
    if [[ -z "$BASE_DOMAIN" ]]; then
        missing+=("BASE_DOMAIN")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Missing environment variables for Cloudflare DNS: ${missing[*]}${NC}"
        echo -e "${YELLOW}   DNS record update will be skipped.${NC}"
        SKIP_DNS=true
    fi
}

validate_env

# Production confirmation
if [[ "$STAGE" == "prod" ]]; then
    echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION!${NC}"
    read -p "Are you sure? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 0
    fi
fi

# Install dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    if command -v bun >/dev/null 2>&1; then
        bun install
    else
        npm install
    fi
fi

# Type check
echo -e "${BLUE}🔍 Running type check...${NC}"
npx tsc --noEmit || {
    echo -e "${YELLOW}⚠️  TypeScript warnings found (continuing anyway)${NC}"
}

# Check if running in CI environment
if [[ -n "$CI" || -n "$GITHUB_ACTIONS" ]]; then
    echo -e "${BLUE}🔍 Running in CI environment${NC}"
    echo -e "${GREEN}✓ Using credentials from CI environment${NC}"
    
    # Verify credentials work
    echo -e "${BLUE}🔍 Verifying credentials...${NC}"
    CALLER_IDENTITY=$(aws sts get-caller-identity --output json 2>&1)
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Credential verification failed: $CALLER_IDENTITY${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Credentials verified: $(echo "$CALLER_IDENTITY" | jq -r '.Arn')${NC}"
else
    # Local development - assume DevRole
    AWS_PROFILE=${AWS_PROFILE:-heetvakharia}
    echo -e "${GREEN}✓ Using AWS Profile: $AWS_PROFILE${NC}"

    # Assume DevRole for deployment
    echo -e "${BLUE}🔐 Assuming DevRole...${NC}"
    DEV_ROLE_ARN="arn:aws:iam::739689500485:role/DevRole"

    # Get temporary credentials by assuming the role
    ASSUME_ROLE_OUTPUT=$(aws sts assume-role \
        --role-arn "$DEV_ROLE_ARN" \
        --role-session-name "serverless-deploy-$STAGE-$(date +%s)" \
        --profile "$AWS_PROFILE" \
        --output json 2>&1)

    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Failed to assume DevRole: $ASSUME_ROLE_OUTPUT${NC}"
        exit 1
    fi

    # Parse credentials using jq (faster and more reliable)
    export AWS_ACCESS_KEY_ID=$(echo "$ASSUME_ROLE_OUTPUT" | jq -r '.Credentials.AccessKeyId')
    export AWS_SECRET_ACCESS_KEY=$(echo "$ASSUME_ROLE_OUTPUT" | jq -r '.Credentials.SecretAccessKey')
    export AWS_SESSION_TOKEN=$(echo "$ASSUME_ROLE_OUTPUT" | jq -r '.Credentials.SessionToken')

    # Unset AWS_PROFILE to ensure we use the exported credentials
    unset AWS_PROFILE

    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" || -z "$AWS_SESSION_TOKEN" ]]; then
        echo -e "${RED}❌ Failed to parse assumed role credentials${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Successfully assumed DevRole${NC}"

    # Verify credentials work
    echo -e "${BLUE}🔍 Verifying credentials...${NC}"
    CALLER_IDENTITY=$(aws sts get-caller-identity --output json 2>&1)
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Credential verification failed: $CALLER_IDENTITY${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Credentials verified: $(echo "$CALLER_IDENTITY" | jq -r '.Arn')${NC}"
fi

# Domain only mode
if [[ "$DOMAIN_ONLY" == true ]]; then
    echo -e "${BLUE}🌐 Creating/updating custom domain...${NC}"
    npx serverless create_domain --stage "$STAGE"
    echo -e "${GREEN}✓ Custom domain configured${NC}"
    exit 0
fi

# ============================================
# DEPLOYMENT
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  📦 ${CYAN}Starting Serverless Deployment${NC}                          ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Deploy with full output
# Use TMPDIR if set, otherwise fallback to /tmp (works on Windows Git Bash)
TMPDIR="${TMPDIR:-/tmp}"
mkdir -p "$TMPDIR"
DEPLOY_START=$(date +%s)
npx serverless deploy --stage "$STAGE" --verbose 2>&1 | tee "$TMPDIR/serverless-deploy-$STAGE.log"
# Capture the exit code of the serverless command (PIPESTATUS[0]) because of the pipe
DEPLOY_EXIT=${PIPESTATUS[0]:-0}
DEPLOY_END=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END - DEPLOY_START))

if [[ $DEPLOY_EXIT -ne 0 ]]; then
    echo ""
    echo -e "${RED}❌ Serverless deployment failed (exit code: ${DEPLOY_EXIT}).${NC}"
    echo -e "${YELLOW}-- Begin last 200 lines of serverless log --${NC}"
    tail -n 200 "$TMPDIR/serverless-deploy-$STAGE.log" || true
    echo -e "${YELLOW}-- End of serverless log --${NC}"
    exit $DEPLOY_EXIT
fi

echo ""
echo -e "${GREEN}✓ Deployment completed in ${DEPLOY_DURATION}s${NC}"

# ============================================
# GET DEPLOYMENT INFO
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  📡 ${CYAN}Deployment Information${NC}                                   ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get full deployment info
DEPLOY_INFO=$(npx serverless info --stage "$STAGE" --verbose 2>&1)
echo "$DEPLOY_INFO"

# Extract the HTTP API endpoint URL
API_URL=$(echo "$DEPLOY_INFO" | grep -E "HttpApiUrl:" | sed 's/HttpApiUrl: //' | tr -d ' ')
if [[ -z "$API_URL" ]]; then
    # Fallback: try to get from endpoints
    API_URL=$(echo "$DEPLOY_INFO" | grep -E "https://.*execute-api" | head -1 | grep -oE "https://[a-zA-Z0-9.-]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com" | head -1)
fi

# Extract the WebSocket API endpoint URL
WEBSOCKET_URL=$(echo "$DEPLOY_INFO" | grep -E "WebSocketApiUrl:" | sed 's/WebSocketApiUrl: //' | tr -d ' ')
if [[ -z "$WEBSOCKET_URL" ]]; then
    # Fallback: try to extract WebSocket API ID and construct URL
    WEBSOCKET_API_ID=$(echo "$DEPLOY_INFO" | grep -E "WebSocketApiId:" | sed 's/WebSocketApiId: //' | tr -d ' ')
    if [[ -n "$WEBSOCKET_API_ID" ]]; then
        WEBSOCKET_URL="wss://${WEBSOCKET_API_ID}.execute-api.${AWS_REGION:-ap-south-1}.amazonaws.com/${STAGE}"
    fi
fi

if [[ -z "$API_URL" ]]; then
    echo -e "${YELLOW}⚠️  Could not extract HTTP API URL from deployment output${NC}"
else
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📌 HTTP API URL: ${CYAN}$API_URL${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

if [[ -n "$WEBSOCKET_URL" ]]; then
    echo -e "${GREEN}📌 WebSocket API URL: ${CYAN}$WEBSOCKET_URL${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${YELLOW}⚠️  Could not extract WebSocket API URL from deployment output${NC}"
fi

# ============================================
# CUSTOM DOMAIN SETUP
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  🌐 ${CYAN}Custom Domain Configuration${NC}                              ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Determine custom domain names based on stage
case "$STAGE" in
    prod)
        HTTP_CUSTOM_DOMAIN="api.${BASE_DOMAIN:-yourdomain.com}"
        WS_CUSTOM_DOMAIN="ws.${BASE_DOMAIN:-yourdomain.com}"
        ;;
    test)
        HTTP_CUSTOM_DOMAIN="api-test.${BASE_DOMAIN:-yourdomain.com}"
        WS_CUSTOM_DOMAIN="ws-test.${BASE_DOMAIN:-yourdomain.com}"
        ;;
    dev-dhruv|dev-tirth|dev-pooja|dev-heet)
        HTTP_CUSTOM_DOMAIN="api-${STAGE}.${BASE_DOMAIN:-yourdomain.com}"
        WS_CUSTOM_DOMAIN="ws-${STAGE}.${BASE_DOMAIN:-yourdomain.com}"
        ;;
esac

echo -e "${BLUE}🔧 Setting up HTTP API custom domain: ${YELLOW}$HTTP_CUSTOM_DOMAIN${NC}"

# Create HTTP API custom domain (will be idempotent if already exists)
DOMAIN_OUTPUT=$(npx serverless create_domain --stage "$STAGE" 2>&1)
DOMAIN_EXIT=$?
echo "$DOMAIN_OUTPUT"
if [[ $DOMAIN_EXIT -ne 0 ]]; then
    echo -e "${YELLOW}⚠️  serverless create_domain returned non-zero (${DOMAIN_EXIT}). Review output above.${NC}"
fi

# Extract the regional domain name from the DEPLOY_INFO (already captured above)
# The "Target Domain:" appears in the "Serverless Domain Manager:" section
# First try: Look for "Target Domain:" (Serverless Domain Manager format)
REGIONAL_DOMAIN=$(echo "$DEPLOY_INFO" | grep -E "Target Domain:" | sed 's/.*Target Domain: *//' | tr -d ' ')

if [[ -z "$REGIONAL_DOMAIN" ]]; then
    # Second try: Look for "DistributionDomainNameHttp:" in Stack Outputs
    REGIONAL_DOMAIN=$(echo "$DEPLOY_INFO" | grep -E "DistributionDomainNameHttp:" | sed 's/.*DistributionDomainNameHttp: *//' | tr -d ' ')
fi

if [[ -z "$REGIONAL_DOMAIN" ]]; then
    # Third try: Extract any execute-api domain that starts with "d-" (API Gateway custom domain format)
    REGIONAL_DOMAIN=$(echo "$DEPLOY_INFO" | grep -oE "d-[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com" | head -1)
fi

# Extract WebSocket regional domain from API URL
WS_REGIONAL_DOMAIN=""
if [[ -n "$WEBSOCKET_URL" ]]; then
    # Extract domain from wss://abc123.execute-api.region.amazonaws.com/stage
    WS_REGIONAL_DOMAIN=$(echo "$WEBSOCKET_URL" | sed 's|wss://||' | sed 's|/.*||')
fi

if [[ -n "$REGIONAL_DOMAIN" ]]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📌 HTTP Custom Domain: ${CYAN}$HTTP_CUSTOM_DOMAIN${NC}"
    echo -e "${GREEN}📌 HTTP Target (CNAME): ${CYAN}$REGIONAL_DOMAIN${NC}"
    if [[ -n "$WS_REGIONAL_DOMAIN" ]]; then
        echo -e "${GREEN}📌 WebSocket Custom Domain: ${CYAN}$WS_CUSTOM_DOMAIN${NC}"
        echo -e "${GREEN}📌 WebSocket Target (CNAME): ${CYAN}$WS_REGIONAL_DOMAIN${NC}"
    fi
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}❌ Could not extract HTTP regional domain name (Target Domain)${NC}"
    echo -e "${YELLOW}⚠️  The 'serverless domain-info' command did not return the expected Target Domain.${NC}"
    echo -e "${YELLOW}⚠️  Make sure the custom domain is properly created before deployment.${NC}"
    echo -e "${YELLOW}⚠️  You can run: ./deploy.sh $STAGE --domain-only${NC}"
fi

# ============================================
# CLOUDFLARE DNS UPDATE
# ============================================
if [[ "$SKIP_DNS" == false && -n "$CLOUDFLARE_API_TOKEN" && -n "$CLOUDFLARE_ZONE_ID" ]]; then
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ☁️  ${CYAN}Cloudflare DNS Update${NC}                                   ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Update HTTP API DNS record
    if [[ -n "$REGIONAL_DOMAIN" ]]; then
        echo -e "${CYAN}🌐 Updating HTTP API DNS record...${NC}"
        ./scripts/update-cloudflare-dns.sh "$HTTP_CUSTOM_DOMAIN" "$REGIONAL_DOMAIN"
    else
        echo -e "${YELLOW}⚠️  Skipping HTTP API DNS update (no regional domain found)${NC}"
    fi
    
    # Update WebSocket API DNS record
    if [[ -n "$WS_REGIONAL_DOMAIN" ]]; then
        echo ""
        echo -e "${CYAN}🌐 Updating WebSocket API DNS record...${NC}"
        ./scripts/update-cloudflare-dns.sh "$WS_CUSTOM_DOMAIN" "$WS_REGIONAL_DOMAIN"
    else
        echo -e "${YELLOW}⚠️  Skipping WebSocket API DNS update (no WebSocket domain found)${NC}"
    fi
else
    if [[ "$SKIP_DNS" == true ]]; then
        echo -e "${YELLOW}⚠️  DNS update skipped (--skip-dns flag)${NC}"
    elif [[ -z "$CLOUDFLARE_API_TOKEN" || -z "$CLOUDFLARE_ZONE_ID" ]]; then
        echo -e "${YELLOW}⚠️  DNS update skipped (Cloudflare credentials not configured)${NC}"
    fi
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ✅ ${CYAN}Deployment Complete!${NC}                                     ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "   Stage:           ${YELLOW}$STAGE${NC}"
echo -e "   Duration:        ${YELLOW}${DEPLOY_DURATION}s${NC}"
if [[ -n "$API_URL" ]]; then
    echo -e "   HTTP API:        ${CYAN}$API_URL${NC}"
fi
if [[ -n "$WEBSOCKET_URL" ]]; then
    echo -e "   WebSocket API:   ${CYAN}$WEBSOCKET_URL${NC}"
fi
if [[ -n "$HTTP_CUSTOM_DOMAIN" ]]; then
    echo -e "   HTTP Custom:     ${CYAN}https://$HTTP_CUSTOM_DOMAIN${NC}"
fi
if [[ -n "$WS_CUSTOM_DOMAIN" && -n "$WS_REGIONAL_DOMAIN" ]]; then
    echo -e "   WebSocket Custom: ${CYAN}wss://$WS_CUSTOM_DOMAIN${NC}"
fi
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo -e "   View logs:       ${YELLOW}npx serverless logs -f <functionName> --stage $STAGE --tail${NC}"
echo -e "   Remove stack:    ${YELLOW}npx serverless remove --stage $STAGE${NC}"
echo -e "   View info:       ${YELLOW}npx serverless info --stage $STAGE${NC}"
echo -e "   Domain info:     ${YELLOW}npx serverless domain-info --stage $STAGE${NC}"
echo -e "   Delete domain:   ${YELLOW}npx serverless delete_domain --stage $STAGE${NC}"
echo ""

# Save deployment info to file for CI/CD or other scripts
DEPLOY_RESULT_FILE="$TMPDIR/deploy-result-$STAGE.json"
cat > "$DEPLOY_RESULT_FILE" << EOF
{
  "stage": "$STAGE",
  "apiUrl": "$API_URL",
  "customDomain": "$CUSTOM_DOMAIN",
  "regionalDomain": "$REGIONAL_DOMAIN",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "duration": $DEPLOY_DURATION
}
EOF

echo -e "${GREEN}📄 Deployment result saved to: $DEPLOY_RESULT_FILE${NC}"
