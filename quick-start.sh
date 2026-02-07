#!/bin/bash

# PULSE Quick Start Script
# One command to get everything running

set -e

echo ""
echo "🚀 PULSE Monitoring Platform - Quick Start"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+ first."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop first."
    echo "   Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ Docker $(docker --version)"
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 5

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd apps/api

# Make setup script executable
chmod +x scripts/setup.sh
chmod +x scripts/verify-setup.sh

# Run setup
./scripts/setup.sh

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 IMPORTANT: Configure Resend for email notifications"
echo "   1. Get free API key: https://resend.com"
echo "   2. Open: apps/api/.env"
echo "   3. Set RESEND_API_KEY=re_your_key_here"
echo "   4. See RESEND-SETUP.md for detailed guide"
echo ""
echo "🚀 To start the backend:"
echo "   cd apps/api"
echo "   npm run dev"
echo ""
echo "🌐 To start the frontend (optional):"
echo "   cd apps/web"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "📖 Next steps: See GETTING-STARTED.md"
echo ""
