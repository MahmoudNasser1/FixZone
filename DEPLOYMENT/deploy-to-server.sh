#!/bin/bash

# FixZone ERP - Server Deployment Script
# Run this script on your production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/var/www/fixzone}"
GIT_REPO="${GIT_REPO:-https://github.com/yourusername/fixzone-erp.git}"
BRANCH="${BRANCH:-main}"

echo -e "${GREEN}🚀 FixZone ERP - Server Deployment Script${NC}"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run as root${NC}"
   exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Check if serve is installed
if ! command -v serve &> /dev/null; then
    echo -e "${YELLOW}📦 Installing serve...${NC}"
    sudo npm install -g serve
fi

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}📁 Creating project directory...${NC}"
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown -R $USER:$USER "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Clone or pull repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git pull origin "$BRANCH"
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone "$GIT_REPO" .
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install --production
cd ..

# Install frontend dependencies and build
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend/react-app
npm install --production
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build
cd "$PROJECT_DIR"

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found${NC}"
    echo -e "${YELLOW}💡 Please create backend/.env from backend/.env.example${NC}"
    exit 1
fi

# Set permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chmod -R 755 .
chmod -R 777 uploads/ 2>/dev/null || true
chmod -R 777 backend/uploads/ 2>/dev/null || true

# Create logs directory
mkdir -p logs

# Stop existing PM2 processes
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
pm2 delete fixzone-backend 2>/dev/null || true
pm2 delete fixzone-frontend 2>/dev/null || true

# Start with PM2
echo -e "${YELLOW}🚀 Starting applications with PM2...${NC}"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Display status
echo ""
echo -e "${GREEN}=============================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}=============================================="
echo ""
echo -e "${BLUE}📊 PM2 Status:${NC}"
pm2 status
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo "   pm2 logs fixzone-backend"
echo "   pm2 logs fixzone-frontend"
echo "   pm2 monit"
echo "   pm2 restart all"
echo ""

