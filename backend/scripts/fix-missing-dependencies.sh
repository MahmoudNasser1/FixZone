#!/bin/bash

# Script to fix missing dependencies in production
# This script installs missing npm packages that are required but not installed

set -e  # Exit on error

echo "=========================================="
echo "Fix Missing Dependencies Script"
echo "=========================================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$BACKEND_DIR")"

echo "Backend directory: $BACKEND_DIR"
echo "Project root: $PROJECT_ROOT"
echo ""

# Check if we're in the right directory
if [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $BACKEND_DIR"
    exit 1
fi

echo "📦 Checking for missing dependencies..."
echo ""

# Navigate to backend directory
cd "$BACKEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules directory not found. Installing all dependencies..."
    npm install --production
    echo "✅ Dependencies installed successfully"
else
    echo "📋 Checking for specific missing packages..."
    
    # Check for exceljs specifically (the reported missing module)
    if [ ! -d "node_modules/exceljs" ]; then
        echo "⚠️  exceljs is missing. Installing..."
        npm install exceljs@^4.4.0 --save
        echo "✅ exceljs installed successfully"
    else
        echo "✅ exceljs is already installed"
    fi
    
    # Verify all dependencies from package.json are installed
    echo ""
    echo "🔍 Verifying all dependencies..."
    if npm install --production --dry-run 2>&1 | grep -q "up to date\|added 0 packages"; then
        echo "✅ All dependencies are up to date"
    else
        echo "⚠️  Some dependencies are missing. Installing..."
        npm install --production
        echo "✅ All dependencies installed successfully"
    fi
fi

echo ""
echo "=========================================="
echo "✅ Dependency check complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart the PM2 process: pm2 restart fixzone-api"
echo "2. Check logs: pm2 logs fixzone-api --lines 50"
echo "3. Monitor CPU usage: pm2 monit"
echo ""

