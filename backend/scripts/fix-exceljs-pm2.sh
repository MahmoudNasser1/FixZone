#!/bin/bash

# Script to fix exceljs module resolution issue with PM2
# This ensures PM2 can find exceljs correctly

set -e

echo "=========================================="
echo "Fix exceljs Module Resolution for PM2"
echo "=========================================="
echo ""

BACKEND_DIR="/home/deploy/FixZone/backend"
cd "$BACKEND_DIR"

# Step 1: Verify exceljs exists
echo "🔍 Step 1: Verifying exceljs installation..."
if [ ! -d "node_modules/exceljs" ]; then
    echo "❌ exceljs NOT found! Installing..."
    npm install exceljs@^4.4.0 --save --production
else
    echo "✅ exceljs directory exists"
fi

# Step 2: Test require from Node.js
echo ""
echo "🔍 Step 2: Testing exceljs from Node.js..."
if node -e "require('exceljs'); console.log('✅ exceljs works from Node.js')"; then
    echo "✅ Node.js can require exceljs"
else
    echo "❌ Node.js cannot require exceljs!"
    echo "Reinstalling exceljs..."
    npm uninstall exceljs
    npm install exceljs@^4.4.0 --save --production
    exit 1
fi

# Step 3: Check node_modules path
echo ""
echo "📂 Step 3: Checking node_modules path..."
NODE_MODULES_PATH="$(cd node_modules && pwd)"
echo "node_modules path: $NODE_MODULES_PATH"
echo "exceljs path: $NODE_MODULES_PATH/exceljs"

if [ ! -d "$NODE_MODULES_PATH/exceljs" ]; then
    echo "❌ exceljs not found in expected path!"
    exit 1
fi

# Step 4: Stop PM2 process
echo ""
echo "🛑 Step 4: Stopping PM2 process..."
pm2 stop fixzone-api || echo "Process already stopped"
pm2 delete fixzone-api || echo "Process already deleted"

# Step 5: Set NODE_PATH and restart
echo ""
echo "🚀 Step 5: Starting PM2 with explicit NODE_PATH..."

# Get absolute path to node_modules
cd "$BACKEND_DIR"
NODE_MODULES_ABS="$(pwd)/node_modules"

# Start PM2 with explicit NODE_PATH
NODE_PATH="$NODE_MODULES_ABS" pm2 start server.js \
    --name fixzone-api \
    --cwd "$BACKEND_DIR" \
    --env production \
    --update-env \
    --node-args="--require-module=$NODE_MODULES_ABS/exceljs"

# Alternative: Start without node-args but with NODE_PATH
# NODE_PATH="$NODE_MODULES_ABS" pm2 start server.js \
#     --name fixzone-api \
#     --cwd "$BACKEND_DIR" \
#     --env production \
#     --update-env

pm2 save

echo ""
echo "⏳ Waiting 5 seconds for server to start..."
sleep 5

# Step 6: Check logs
echo ""
echo "📝 Step 6: Checking error logs..."
pm2 logs fixzone-api --err --lines 15 --nostream

# Step 7: Check status
echo ""
echo "📋 Step 7: PM2 status:"
pm2 status

echo ""
echo "=========================================="
echo "✅ Fix complete!"
echo "=========================================="
echo ""

# If still errors, try alternative approach
if pm2 logs fixzone-api --err --lines 1 --nostream | grep -q "exceljs"; then
    echo "⚠️  Still seeing exceljs errors. Trying alternative fix..."
    echo ""
    echo "Alternative: Using ecosystem.config.js with NODE_PATH..."
    
    # Create temporary ecosystem config
    cat > /tmp/pm2-ecosystem-temp.json <<EOF
{
  "apps": [{
    "name": "fixzone-api",
    "script": "server.js",
    "cwd": "$BACKEND_DIR",
    "env": {
      "NODE_ENV": "production",
      "NODE_PATH": "$NODE_MODULES_ABS"
    },
    "node_args": "--require=$NODE_MODULES_ABS/exceljs"
  }]
}
EOF
    
    pm2 delete fixzone-api || true
    pm2 start /tmp/pm2-ecosystem-temp.json
    pm2 save
    
    sleep 5
    pm2 logs fixzone-api --err --lines 10 --nostream
fi

echo ""
echo "Monitor with: pm2 logs fixzone-api --err"
echo ""

