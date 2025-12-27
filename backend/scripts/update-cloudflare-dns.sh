#!/bin/bash

# ============================================
# Cloudflare DNS Update Script
# ============================================
# Updates or creates a CNAME record in Cloudflare
# Usage: ./update-cloudflare-dns.sh <subdomain> <target>
# Example: ./update-cloudflare-dns.sh api-dev.example.com d-abc123.execute-api.ap-south-1.amazonaws.com
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Arguments
RECORD_NAME="${1}"
RECORD_CONTENT="${2}"

# Validate arguments
if [[ -z "$RECORD_NAME" || -z "$RECORD_CONTENT" ]]; then
    echo -e "${RED}❌ Usage: $0 <subdomain> <target>${NC}"
    echo -e "   Example: $0 api-dev.example.com d-abc123.execute-api.ap-south-1.amazonaws.com"
    exit 1
fi

# Validate environment variables
if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
    echo -e "${RED}❌ CLOUDFLARE_API_TOKEN environment variable is required${NC}"
    exit 1
fi

if [[ -z "$CLOUDFLARE_ZONE_ID" ]]; then
    echo -e "${RED}❌ CLOUDFLARE_ZONE_ID environment variable is required${NC}"
    exit 1
fi

# Cloudflare API base URL
CF_API_BASE="https://api.cloudflare.com/client/v4"

echo -e "${BLUE}🔍 Checking existing DNS record for: ${CYAN}$RECORD_NAME${NC}"

# Check if record already exists
EXISTING_RECORD=$(curl -s -X GET "${CF_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${RECORD_NAME}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")

# Check for API errors
SUCCESS=$(echo "$EXISTING_RECORD" | jq -r '.success')
if [[ "$SUCCESS" != "true" ]]; then
    ERROR_MSG=$(echo "$EXISTING_RECORD" | jq -r '.errors[0].message // "Unknown error"')
    echo -e "${RED}❌ Cloudflare API error: $ERROR_MSG${NC}"
    exit 1
fi

RECORD_COUNT=$(echo "$EXISTING_RECORD" | jq -r '.result | length')
RECORD_ID=$(echo "$EXISTING_RECORD" | jq -r '.result[0].id // empty')

# Prepare the DNS record payload
# Using proxied: false for API Gateway (SSL passthrough required)
DNS_PAYLOAD=$(cat <<EOF
{
    "type": "CNAME",
    "name": "${RECORD_NAME}",
    "content": "${RECORD_CONTENT}",
    "ttl": 1,
    "proxied": false,
    "comment": "Auto-managed by deploy script - $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

if [[ -n "$RECORD_ID" && "$RECORD_COUNT" -gt 0 ]]; then
    # Update existing record
    echo -e "${BLUE}📝 Updating existing DNS record (ID: $RECORD_ID)${NC}"
    
    RESPONSE=$(curl -s -X PUT "${CF_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${RECORD_ID}" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "$DNS_PAYLOAD")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    if [[ "$SUCCESS" == "true" ]]; then
        echo -e "${GREEN}✓ DNS record updated successfully!${NC}"
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.errors[0].message // "Unknown error"')
        echo -e "${RED}❌ Failed to update DNS record: $ERROR_MSG${NC}"
        exit 1
    fi
else
    # Create new record
    echo -e "${BLUE}📝 Creating new DNS record${NC}"
    
    RESPONSE=$(curl -s -X POST "${CF_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "$DNS_PAYLOAD")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    if [[ "$SUCCESS" == "true" ]]; then
        NEW_RECORD_ID=$(echo "$RESPONSE" | jq -r '.result.id')
        echo -e "${GREEN}✓ DNS record created successfully! (ID: $NEW_RECORD_ID)${NC}"
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.errors[0].message // "Unknown error"')
        echo -e "${RED}❌ Failed to create DNS record: $ERROR_MSG${NC}"
        exit 1
    fi
fi

# Display record details
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 DNS Record Details:${NC}"
echo -e "   Type:     ${CYAN}CNAME${NC}"
echo -e "   Name:     ${CYAN}$RECORD_NAME${NC}"
echo -e "   Content:  ${CYAN}$RECORD_CONTENT${NC}"
echo -e "   Proxied:  ${YELLOW}No${NC} (SSL passthrough for API Gateway)"
echo -e "   TTL:      ${CYAN}Auto${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
