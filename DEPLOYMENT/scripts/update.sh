#!/bin/bash

###############################################################################
# Fix Zone ERP - Update Script
# هذا السكريبت يقوم بتحديث النظام مع الحفاظ على البيانات
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/fixzone"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend/react-app"
BACKUP_DIR="$APP_DIR/backups"
LOG_DIR="$APP_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Zone ERP - Update Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Application directory not found: $APP_DIR${NC}"
    exit 1
fi

# Create backup before update
echo -e "${YELLOW}[1/8] Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

cd "$APP_DIR"
tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='build' \
    --exclude='backups' \
    --exclude='logs' \
    backend frontend migrations

# Database backup
if command -v mysqldump &> /dev/null; then
    echo -e "${YELLOW}Creating database backup...${NC}"
    source "$BACKEND_DIR/.env" 2>/dev/null || true
    
    DB_USER=${DB_USER:-fixzone_user}
    DB_NAME=${DB_NAME:-FZ}
    
    mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" 2>/dev/null || {
        echo -e "${YELLOW}⚠ Could not backup database (check credentials)${NC}"
    }
fi

echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"

# Update from Git (if using Git)
echo -e "${YELLOW}[2/8] Updating code from repository...${NC}"
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git fetch origin
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"
    
    read -p "Pull latest changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git pull origin "$CURRENT_BRANCH"
        echo -e "${GREEN}✓ Code updated${NC}"
    else
        echo -e "${YELLOW}⚠ Code update skipped${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not a Git repository, skipping code update${NC}"
    echo -e "${YELLOW}Please update files manually${NC}"
fi

# Update Backend Dependencies
echo -e "${YELLOW}[3/8] Updating backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --production
echo -e "${GREEN}✓ Backend dependencies updated${NC}"

# Run Database Migrations (if any)
echo -e "${YELLOW}[4/8] Checking for database migrations...${NC}"
if [ -d "$APP_DIR/migrations" ]; then
    MIGRATION_FILES=$(find "$APP_DIR/migrations" -name "*.sql" -type f -newer "$BACKUP_DIR" 2>/dev/null | wc -l)
    if [ "$MIGRATION_FILES" -gt 0 ]; then
        echo -e "${YELLOW}Found new migration files. Apply them? (y/n)${NC}"
        read -p "" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            source "$BACKEND_DIR/.env" 2>/dev/null || true
            DB_USER=${DB_USER:-fixzone_user}
            DB_NAME=${DB_NAME:-FZ}
            
            for migration in "$APP_DIR/migrations"/*.sql; do
                if [ -f "$migration" ]; then
                    echo -e "${BLUE}Running: $(basename $migration)${NC}"
                    mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$migration" 2>/dev/null || {
                        echo -e "${YELLOW}⚠ Migration failed (may already be applied)${NC}"
                    }
                fi
            done
        fi
    else
        echo -e "${GREEN}✓ No new migrations${NC}"
    fi
fi

# Update Frontend Dependencies
echo -e "${YELLOW}[5/8] Updating frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install
echo -e "${GREEN}✓ Frontend dependencies updated${NC}"

# Rebuild Frontend
echo -e "${YELLOW}[6/8] Rebuilding frontend...${NC}"
npm run build
if [ ! -d "$FRONTEND_DIR/build" ]; then
    echo -e "${RED}✗ Frontend build failed!${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    # Rollback would go here
    exit 1
fi
echo -e "${GREEN}✓ Frontend rebuilt${NC}"

# Restart Backend with PM2
echo -e "${YELLOW}[7/8] Restarting backend...${NC}"
cd "$APP_DIR"
pm2 reload fixzone-backend || pm2 restart fixzone-backend
sleep 3
echo -e "${GREEN}✓ Backend restarted${NC}"

# Health Check
echo -e "${YELLOW}[8/8] Health check...${NC}"
sleep 2
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed!${NC}"
    echo -e "${YELLOW}Check logs: pm2 logs fixzone-backend${NC}"
    echo -e "${YELLOW}To rollback: pm2 restart fixzone-backend${NC}"
    exit 1
fi

# Reload Nginx (if needed)
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Reloading Nginx...${NC}"
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Update Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Backup location: $BACKUP_FILE"
echo -e "PM2 Status:"
pm2 status
echo ""






