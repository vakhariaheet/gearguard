#!/bin/bash

# ============================================
# Project Setup Script
# ============================================
# This script sets up the development environment
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  🚀 ${CYAN}Odoo Xadani - Project Setup${NC}                             ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js version
echo -e "${BLUE}📋 Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js 20 or higher is required${NC}"
    echo -e "${YELLOW}Current version: $(node -v)${NC}"
    echo -e "${YELLOW}Please install Node.js 20+ from https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check for package manager
if command -v bun >/dev/null 2>&1; then
    PKG_MANAGER="bun"
    echo -e "${GREEN}✓ Using Bun as package manager${NC}"
elif command -v npm >/dev/null 2>&1; then
    PKG_MANAGER="npm"
    echo -e "${GREEN}✓ Using npm as package manager${NC}"
else
    echo -e "${RED}❌ No package manager found${NC}"
    exit 1
fi

# Install root dependencies
echo ""
echo -e "${BLUE}📦 Installing root dependencies...${NC}"
$PKG_MANAGER install

# Setup Husky
echo ""
echo -e "${BLUE}🪝 Setting up Git hooks...${NC}"
npx husky install
chmod +x .husky/commit-msg
chmod +x .husky/pre-commit
echo -e "${GREEN}✓ Git hooks configured${NC}"

# Backend setup
echo ""
echo -e "${BLUE}📦 Setting up backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env from .env.example${NC}"
    cp .env.example .env
    echo -e "${CYAN}📝 Please update backend/.env with your credentials${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
$PKG_MANAGER install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

cd ..

# Client setup
echo ""
echo -e "${BLUE}📦 Setting up client...${NC}"
cd client

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local${NC}"
    cat > .env.local << EOF
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
EOF
    echo -e "${CYAN}📝 Please update client/.env.local with your credentials${NC}"
else
    echo -e "${GREEN}✓ .env.local file already exists${NC}"
fi

echo -e "${BLUE}📦 Installing client dependencies...${NC}"
$PKG_MANAGER install
echo -e "${GREEN}✓ Client dependencies installed${NC}"

cd ..

# Check for AWS CLI
echo ""
echo -e "${BLUE}🔍 Checking for AWS CLI...${NC}"
if command -v aws >/dev/null 2>&1; then
    echo -e "${GREEN}✓ AWS CLI installed: $(aws --version)${NC}"
else
    echo -e "${YELLOW}⚠️  AWS CLI not found${NC}"
    echo -e "${YELLOW}   Install from: https://aws.amazon.com/cli/${NC}"
fi

# Check for jq
echo ""
echo -e "${BLUE}🔍 Checking for jq...${NC}"
if command -v jq >/dev/null 2>&1; then
    echo -e "${GREEN}✓ jq installed${NC}"
else
    echo -e "${YELLOW}⚠️  jq not found (required for deployment)${NC}"
    echo -e "${YELLOW}   Install with: brew install jq${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ✅ ${CYAN}Setup Complete!${NC}                                          ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo -e "1. ${CYAN}Configure environment variables:${NC}"
echo -e "   ${YELLOW}backend/.env${NC} - Backend configuration"
echo -e "   ${YELLOW}client/.env.local${NC} - Client configuration"
echo ""
echo -e "2. ${CYAN}Start development:${NC}"
echo -e "   ${YELLOW}cd backend && npm run dev${NC}  # Start backend"
echo -e "   ${YELLOW}cd client && npm run dev${NC}   # Start client"
echo ""
echo -e "3. ${CYAN}Deploy to your dev stage:${NC}"
echo -e "   ${YELLOW}cd backend && ./deploy.sh heet${NC}  # or dhruv, tirth, pooja"
echo ""
echo -e "4. ${CYAN}Read the documentation:${NC}"
echo -e "   ${YELLOW}README.md${NC} - Project overview"
echo -e "   ${YELLOW}CONTRIBUTING.md${NC} - Contribution guidelines"
echo -e "   ${YELLOW}backend/DEPLOYMENT.md${NC} - Deployment guide"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
echo ""
