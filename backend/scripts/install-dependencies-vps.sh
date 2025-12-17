#!/bin/bash

# Script to install missing dependencies on VPS
# Run this on the VPS server: /home/deploy/FixZone/backend

set -e

echo "=========================================="
echo "Installing Dependencies on VPS"
echo "=========================================="
echo ""

# Check if we're on VPS
if [ ! -d "/home/deploy/FixZone" ]; then
    echo "⚠️  Warning: This script is designed for VPS (/home/deploy/FixZone)"
    echo "Current directory: $(pwd)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to backend directory
BACKEND_DIR="/home/deploy/FixZone/backend"
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"
echo "📂 Working directory: $(pwd)"
echo ""

# Stop PM2 process first
echo "🛑 Stopping PM2 process..."
pm2 stop fixzone-api || echo "⚠️  Process not running or already stopped"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing all dependencies..."
    npm install --production
else
    echo "📋 Checking for missing packages..."
    
    # Check for exceljs specifically
    if [ ! -d "node_modules/exceljs" ]; then
        echo "⚠️  exceljs is missing. Installing..."
        npm install exceljs@^4.4.0 --save --production
    else
        echo "✅ exceljs is already installed"
    fi
    
    # Install all missing dependencies
    echo ""
    echo "🔍 Installing all missing dependencies..."
    npm install --production
fi

echo ""
echo "=========================================="
echo "✅ Dependencies installed successfully!"
echo "=========================================="
echo ""

# Verify exceljs installation
if [ -d "node_modules/exceljs" ]; then
    echo "✅ Verified: exceljs is installed"
    ls -la node_modules/exceljs | head -3
else
    echo "❌ Error: exceljs installation failed!"
    exit 1
fi

echo ""
echo "🚀 Restarting PM2 process..."
pm2 restart fixzone-api

echo ""
echo "⏳ Waiting 3 seconds for server to start..."
sleep 3

echo ""
echo "📋 Checking PM2 status..."
pm2 status

echo ""
echo "📝 Checking error logs..."
pm2 logs fixzone-api --err --lines 10 --nostream

echo ""
echo "=========================================="
echo "✅ Installation complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Monitor logs: pm2 logs fixzone-api --err"
echo "2. Check CPU usage: pm2 monit"
echo "3. If errors persist, check: pm2 logs fixzone-api --err --lines 50"
echo ""

