#!/bin/bash

# Simple script to fix exceljs issue with PM2
# This reinstalls exceljs and restarts PM2 with NODE_PATH

set -e

echo "=========================================="
echo "Simple exceljs Fix for PM2"
echo "=========================================="
echo ""

cd /home/deploy/FixZone/backend

# Step 1: Reinstall exceljs
echo "📦 Step 1: Reinstalling exceljs..."
npm uninstall exceljs 2>/dev/null || true
npm install exceljs@^4.4.0 --save --production

# Step 2: Verify installation
echo ""
echo "🔍 Step 2: Verifying exceljs..."
if [ ! -d "node_modules/exceljs" ]; then
    echo "❌ exceljs still not found!"
    exit 1
fi
echo "✅ exceljs installed at: $(pwd)/node_modules/exceljs"

# Step 3: Test require
echo ""
echo "🧪 Step 3: Testing require from Node.js..."
if ! node -e "require('exceljs'); console.log('✅ exceljs works')" 2>/dev/null; then
    echo "❌ Node.js cannot require exceljs!"
    exit 1
fi

# Step 4: Stop and delete PM2 process
echo ""
echo "🛑 Step 4: Stopping PM2 process..."
pm2 stop fixzone-api 2>/dev/null || true
pm2 delete fixzone-api 2>/dev/null || true

# Step 5: Get absolute path to node_modules
NODE_MODULES_ABS="$(pwd)/node_modules"
echo "📂 node_modules path: $NODE_MODULES_ABS"

# Step 6: Start PM2 with NODE_PATH
echo ""
echo "🚀 Step 5: Starting PM2 with NODE_PATH..."
NODE_PATH="$NODE_MODULES_ABS" pm2 start server.js \
    --name fixzone-api \
    --cwd "$(pwd)" \
    --env production \
    --update-env

pm2 save

# Step 7: Wait and check
echo ""
echo "⏳ Waiting 5 seconds..."
sleep 5

echo ""
echo "📋 PM2 Status:"
pm2 status

echo ""
echo "📝 Error logs (last 10 lines):"
pm2 logs fixzone-api --err --lines 10 --nostream

echo ""
if pm2 logs fixzone-api --err --lines 1 --nostream 2>/dev/null | grep -q "exceljs"; then
    echo "⚠️  Still seeing exceljs errors!"
    echo ""
    echo "Trying alternative: Creating ecosystem config..."
    
    # Create ecosystem config with NODE_PATH
    cat > /tmp/fixzone-api-ecosystem.js <<EOF
module.exports = {
  apps: [{
    name: 'fixzone-api',
    script: 'server.js',
    cwd: '$(pwd)',
    env: {
      NODE_ENV: 'production',
      NODE_PATH: '$NODE_MODULES_ABS'
    }
  }]
};
EOF
    
    pm2 delete fixzone-api || true
    pm2 start /tmp/fixzone-api-ecosystem.js
    pm2 save
    
    sleep 5
    pm2 logs fixzone-api --err --lines 10 --nostream
else
    echo "✅ No exceljs errors found!"
fi

echo ""
echo "=========================================="
echo "✅ Fix complete!"
echo "=========================================="
echo ""

