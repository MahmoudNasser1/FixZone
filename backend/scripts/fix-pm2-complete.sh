#!/bin/bash

# Complete PM2 fix script - removes cache and restarts properly
# This script completely removes the PM2 process and recreates it

set -e  # Exit on error

echo "=========================================="
echo "Complete PM2 Fix Script"
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

# Step 1: Verify exceljs is installed
echo "📦 Step 1: Verifying exceljs installation..."
cd "$BACKEND_DIR"

if [ ! -d "node_modules/exceljs" ]; then
    echo "⚠️  exceljs is missing. Installing..."
    npm install exceljs@^4.4.0 --save --production
    echo "✅ exceljs installed"
else
    echo "✅ exceljs is installed"
fi

# Verify it's actually there
if [ ! -d "node_modules/exceljs" ]; then
    echo "❌ ERROR: exceljs installation failed!"
    exit 1
fi

echo ""

# Step 2: Stop and delete PM2 process
echo "🛑 Step 2: Stopping and removing PM2 process..."
pm2 stop fixzone-api 2>/dev/null || echo "  (Process not running)"
pm2 delete fixzone-api 2>/dev/null || echo "  (Process not found)"
echo "✅ PM2 process removed"

echo ""

# Step 3: Clear PM2 cache (optional but recommended)
echo "🧹 Step 3: Clearing PM2 cache..."
pm2 kill 2>/dev/null || true
sleep 2
echo "✅ PM2 cache cleared"

echo ""

# Step 4: Verify node_modules path
echo "📂 Step 4: Verifying installation..."
cd "$BACKEND_DIR"
echo "Current directory: $(pwd)"
echo "node_modules exists: $([ -d "node_modules" ] && echo "Yes" || echo "No")"
echo "exceljs exists: $([ -d "node_modules/exceljs" ] && echo "Yes" || echo "No")"

if [ -d "node_modules/exceljs" ]; then
    echo "✅ exceljs path: $(realpath node_modules/exceljs)"
    echo "✅ exceljs package.json: $([ -f "node_modules/exceljs/package.json" ] && echo "Found" || echo "Missing")"
else
    echo "❌ ERROR: exceljs still not found after installation!"
    echo "Attempting full reinstall..."
    rm -rf node_modules
    npm install --production
fi

echo ""

# Step 5: Start PM2 with correct working directory
echo "🚀 Step 5: Starting PM2 process..."
cd "$PROJECT_ROOT"

# Start with explicit working directory
# Use relative path from project root
pm2 start backend/server.js \
    --name fixzone-api \
    --cwd "$BACKEND_DIR" \
    --env production \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
    --merge-logs \
    --max-memory-restart 1G \
    --node-args "--max-old-space-size=1024"

echo "✅ PM2 process started"

echo ""

# Step 6: Save PM2 configuration
echo "💾 Step 6: Saving PM2 configuration..."
pm2 save
echo "✅ PM2 configuration saved"

echo ""

# Step 7: Wait a moment and check status
echo "⏳ Step 7: Waiting 3 seconds for process to initialize..."
sleep 3

echo ""
echo "=========================================="
echo "✅ PM2 Fix Complete!"
echo "=========================================="
echo ""
echo "Current PM2 status:"
pm2 status

echo ""
echo "Checking for errors (last 10 lines):"
pm2 logs fixzone-api --err --lines 10 --nostream || echo "No errors found"

echo ""
echo "Next steps:"
echo "1. Monitor logs: pm2 logs fixzone-api --lines 50"
echo "2. Monitor resources: pm2 monit"
echo "3. Check status: pm2 status"
echo ""

