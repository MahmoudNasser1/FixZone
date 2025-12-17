#!/bin/bash

# Final fix for exceljs with PM2 using ecosystem.config.js

set -e

echo "=========================================="
echo "Final Fix for exceljs with PM2"
echo "=========================================="
echo ""

cd /home/deploy/FixZone/backend

# Step 1: Verify exceljs
echo "🔍 Step 1: Verifying exceljs..."
if [ ! -d "node_modules/exceljs" ]; then
    echo "❌ exceljs not found! Installing..."
    npm install exceljs@^4.4.0 --save --production
fi

# Test require
if ! node -e "require('exceljs'); console.log('✅ exceljs works')" 2>/dev/null; then
    echo "❌ Node.js cannot require exceljs!"
    exit 1
fi

echo "✅ exceljs verified"
echo ""

# Step 2: Stop and delete PM2 process
echo "🛑 Step 2: Stopping PM2 process..."
pm2 stop fixzone-api 2>/dev/null || true
pm2 delete fixzone-api 2>/dev/null || true

# Step 3: Start using ecosystem.config.js
echo ""
echo "🚀 Step 3: Starting PM2 with ecosystem.config.js..."
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js not found!"
    exit 1
fi

pm2 start ecosystem.config.js --update-env
pm2 save

# Step 4: Wait and check
echo ""
echo "⏳ Waiting 5 seconds..."
sleep 5

echo ""
echo "📋 PM2 Status:"
pm2 status

echo ""
echo "📝 Error logs (last 15 lines):"
pm2 logs fixzone-api --err --lines 15 --nostream

echo ""
if pm2 logs fixzone-api --err --lines 1 --nostream 2>/dev/null | grep -q "exceljs"; then
    echo "❌ Still seeing exceljs errors!"
    echo ""
    echo "Trying alternative: Check if NODE_PATH is being set correctly..."
    pm2 env 0 | grep NODE_PATH || echo "⚠️  NODE_PATH not found in PM2 env"
    exit 1
else
    echo "✅ No exceljs errors found! Problem solved!"
fi

echo ""
echo "=========================================="
echo "✅ Fix complete!"
echo "=========================================="
echo ""

