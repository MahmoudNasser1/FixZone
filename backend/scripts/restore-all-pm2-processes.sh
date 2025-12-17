#!/bin/bash

# Script to restore all PM2 processes after fixing cache issue
# This restores fixzone-api and other processes

set -e

echo "=========================================="
echo "Restoring All PM2 Processes"
echo "=========================================="
echo ""

# Check current PM2 status
echo "📋 Current PM2 status:"
pm2 status
echo ""

# Start fixzone-api
echo "🚀 Starting fixzone-api..."
cd /home/deploy/FixZone/backend
pm2 start server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production \
    --update-env

echo ""

# Check if there's an ecosystem file or other processes to restore
if [ -f "/home/deploy/FixZone/ecosystem.config.js" ]; then
    echo "📋 Found ecosystem.config.js, checking for other processes..."
    cd /home/deploy/FixZone
    pm2 start ecosystem.config.js --update-env || echo "⚠️  Could not start from ecosystem file"
fi

# Save PM2 configuration
pm2 save

echo ""
echo "⏳ Waiting 3 seconds..."
sleep 3

echo ""
echo "📋 Final PM2 status:"
pm2 status

echo ""
echo "📝 Checking fixzone-api error logs:"
pm2 logs fixzone-api --err --lines 10 --nostream

echo ""
echo "=========================================="
echo "✅ All processes restored!"
echo "=========================================="
echo ""

