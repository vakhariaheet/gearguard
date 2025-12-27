#!/bin/bash

# DevOps CLI Setup Script
set -e

echo "🚀 Setting up DevOps CLI..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the scripts/devops directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file. Please review and update the configuration."
else
    echo "✅ .env file already exists."
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) is not installed."
    echo "   For PR creation functionality, install it from: https://cli.github.com/"
else
    echo "✅ GitHub CLI found."
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI is not installed."
    echo "   For deployment functionality, install it from: https://aws.amazon.com/cli/"
else
    echo "✅ AWS CLI found."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Usage:"
echo "  npm run dev          # Interactive mode"
echo "  npm run dev m n      # New module"
echo "  npm run dev m c      # Complete module"
echo "  npm run dev d f      # Deploy function"
echo "  npm run dev d a      # Deploy all"
echo ""
echo "From project root:"
echo "  npm run devops       # Interactive mode"
echo ""
echo "📝 Don't forget to review and update the .env file with your settings!"