#!/bin/bash

# 🚀 Script to start Frontend Server

echo "🎨 Starting Frontend Server..."

# Navigate to frontend directory
cd /opt/lampp/htdocs/FixZone/frontend/react-app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the frontend server
echo "🚀 Starting React development server..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo ""

npm start

