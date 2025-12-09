#!/bin/bash

# Script to start Backend Server properly

echo "🔧 Starting Backend Server..."

# Kill any existing Node processes on port 4000
cd /opt/lampp/htdocs/FixZone
ps aux | grep -E "node.*server.js|node.*app.js" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null
sleep 2

# Start Backend Server
cd /opt/lampp/htdocs/FixZone/backend
node server.js > /tmp/backend_server.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend Server started (PID: $BACKEND_PID)"
echo "📊 Log file: /tmp/backend_server.log"
echo "🔍 Checking server status..."

sleep 8

# Check if server is running
if curl -s "http://localhost:4000/health" > /dev/null 2>&1; then
    echo "✅ Backend Server is running on port 4000"
    echo "📊 API Base URL: http://localhost:4000/api"
    echo "🏥 Health Check: http://localhost:4000/health"
else
    echo "⚠️ Backend Server may not be responding"
    echo "📋 Check logs: tail -f /tmp/backend_server.log"
fi

echo ""
echo "📝 To stop the server: kill $BACKEND_PID"
echo "📝 To view logs: tail -f /tmp/backend_server.log"

