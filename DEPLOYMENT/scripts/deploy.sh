#!/bin/bash

###############################################################################
# Fix Zone ERP - Initial Deployment Script
# هذا السكريبت يقوم بالنشر الأولي للنظام على VPS
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/fixzone"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend/react-app"
LOG_DIR="$APP_DIR/logs"
BACKUP_DIR="$APP_DIR/backups"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Fix Zone ERP - Initial Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Create directories
echo -e "${YELLOW}[1/10] Creating directories...${NC}"
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKEND_DIR/uploads"
echo -e "${GREEN}✓ Directories created${NC}"

# Check Node.js
echo -e "${YELLOW}[2/10] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"

# Check MySQL
echo -e "${YELLOW}[3/10] Checking MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL is not installed. Please install MySQL first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MySQL is installed${NC}"

# Check if .env files exist
echo -e "${YELLOW}[4/10] Checking environment files...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}Backend .env file not found!${NC}"
    echo -e "${YELLOW}Please create $BACKEND_DIR/.env${NC}"
    exit 1
fi
if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
    echo -e "${YELLOW}Frontend .env.production not found, creating from template...${NC}"
    cat > "$FRONTEND_DIR/.env.production" << EOF
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/api
REACT_APP_ENV=production
EOF
    echo -e "${YELLOW}Please update $FRONTEND_DIR/.env.production with your domain${NC}"
fi
echo -e "${GREEN}✓ Environment files checked${NC}"

# Install Backend Dependencies
echo -e "${YELLOW}[5/10] Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --production
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install Frontend Dependencies
echo -e "${YELLOW}[6/10] Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Build Frontend
echo -e "${YELLOW}[7/10] Building frontend...${NC}"
npm run build
if [ ! -d "$FRONTEND_DIR/build" ]; then
    echo -e "${RED}Frontend build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Database Setup
echo -e "${YELLOW}[8/10] Setting up database...${NC}"
read -p "Do you want to import the database schema? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter MySQL username: " DB_USER
    read -sp "Enter MySQL password: " DB_PASS
    echo
    
    if [ -f "$APP_DIR/migrations/01_COMPLETE_SCHEMA.sql" ]; then
        mysql -u "$DB_USER" -p"$DB_PASS" FZ < "$APP_DIR/migrations/01_COMPLETE_SCHEMA.sql"
        echo -e "${GREEN}✓ Database schema imported${NC}"
    else
        echo -e "${YELLOW}⚠ Database schema file not found, skipping...${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Database import skipped${NC}"
fi

# Setup PM2
echo -e "${YELLOW}[9/10] Setting up PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found, installing...${NC}"
    sudo npm install -g pm2
fi

cd "$APP_DIR"
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✓ PM2 started${NC}"
else
    echo -e "${RED}ecosystem.config.js not found!${NC}"
    exit 1
fi

# Final Checks
echo -e "${YELLOW}[10/10] Final checks...${NC}"
sleep 2
pm2 status
echo ""

# Check if backend is running
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo -e "${YELLOW}Check logs: pm2 logs fixzone-backend${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Configure Nginx (see DEPLOYMENT/nginx.conf)"
echo -e "2. Setup SSL certificate: sudo certbot --nginx -d yourdomain.com"
echo -e "3. Test the application: https://yourdomain.com"
echo ""

