#!/bin/bash

# Script to fix PM2 cache issue with missing modules
# This happens when PM2 caches old module resolution

set -e

echo "=========================================="
echo "Fix PM2 Cache Issue for Missing Modules"
echo "=========================================="
echo ""

BACKEND_DIR="/home/deploy/FixZone/backend"
cd "$BACKEND_DIR"

# Step 1: Verify exceljs is actually installed
echo "🔍 Step 1: Verifying exceljs installation..."
if [ -d "node_modules/exceljs" ]; then
    echo "✅ exceljs directory exists"
    ls -la node_modules/exceljs | head -3
else
    echo "❌ exceljs directory NOT found!"
    echo "Installing exceljs..."
    npm install exceljs@^4.4.0 --save --production
fi

# Verify it's in package.json
if grep -q "exceljs" package.json; then
    echo "✅ exceljs found in package.json"
else
    echo "❌ exceljs NOT in package.json!"
    exit 1
fi

echo ""

# Step 2: Stop and delete PM2 process completely
echo "🛑 Step 2: Stopping and deleting PM2 process..."
pm2 stop fixzone-api || echo "Process already stopped"
pm2 delete fixzone-api || echo "Process already deleted"

# Step 3: Clear PM2 cache
echo ""
echo "🧹 Step 3: Clearing PM2 cache..."
pm2 kill
sleep 2

# Step 4: Verify node_modules path
echo ""
echo "📂 Step 4: Verifying installation..."
cd "$BACKEND_DIR"
pwd
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

# Check if exceljs is accessible from Node
echo "🔍 Testing exceljs module resolution..."
node -e "try { require('exceljs'); console.log('✅ exceljs can be required successfully'); } catch(e) { console.log('❌ Error:', e.message); process.exit(1); }"

echo ""

# Step 5: Restart PM2 with fresh process
echo "🚀 Step 5: Starting PM2 with fresh process..."

# Start PM2 daemon (it will start automatically if not running)
pm2 ping || sleep 1

# Start the application (we're already in backend directory)
cd /home/deploy/FixZone/backend
pm2 start server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production \
    --update-env

# Save PM2 configuration
pm2 save

echo ""
echo "⏳ Waiting 5 seconds for server to initialize..."
sleep 5

# Step 6: Check status
echo ""
echo "📋 Step 6: Checking PM2 status..."
pm2 status

echo ""
echo "📝 Step 7: Checking error logs..."
pm2 logs fixzone-api --err --lines 10 --nostream

echo ""
echo "=========================================="
echo "✅ PM2 cache fix complete!"
echo "=========================================="
echo ""
echo "Monitor with:"
echo "  pm2 logs fixzone-api --err"
echo "  pm2 monit"
echo ""

