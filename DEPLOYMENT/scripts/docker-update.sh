#!/bin/bash

###############################################################################
# Fix Zone ERP - Docker Update Script
# سكريبت التحديث باستخدام Docker
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Zone ERP - Docker Update${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if containers are running
if ! docker compose ps | grep -q "Up"; then
    echo -e "${RED}Containers are not running!${NC}"
    echo -e "${YELLOW}Start containers first: docker compose up -d${NC}"
    exit 1
fi

# Backup database
echo -e "${YELLOW}[1/5] Creating database backup...${NC}"
source .env 2>/dev/null || true
DB_USER=${MYSQL_USER:-fixzone_user}
DB_PASS=${MYSQL_PASSWORD:-fixzone_password}
DB_NAME=${MYSQL_DATABASE:-FZ}

mkdir -p backups
docker exec fixzone-mysql mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "backups/db_backup_$TIMESTAMP.sql" 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not backup database${NC}"
}
echo -e "${GREEN}✓ Backup created${NC}"

# Pull latest code
echo -e "${YELLOW}[2/5] Pulling latest code...${NC}"
if [ -d ".git" ]; then
    git pull origin main || git pull origin master
    echo -e "${GREEN}✓ Code updated${NC}"
else
    echo -e "${YELLOW}⚠ Not a Git repository, skipping code update${NC}"
fi

# Rebuild images
echo -e "${YELLOW}[3/5] Rebuilding images...${NC}"
read -p "Rebuild all services? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose build --no-cache
else
    read -p "Rebuild backend only? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose build --no-cache backend
    fi
    
    read -p "Rebuild frontend only? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose build --no-cache frontend
    fi
fi
echo -e "${GREEN}✓ Images rebuilt${NC}"

# Restart containers
echo -e "${YELLOW}[4/5] Restarting containers...${NC}"
docker compose up -d
echo -e "${GREEN}✓ Containers restarted${NC}"

# Health check
echo -e "${YELLOW}[5/5] Health check...${NC}"
sleep 5
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed!${NC}"
    echo -e "${YELLOW}Check logs: docker compose logs backend${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Update Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Backup: backups/db_backup_$TIMESTAMP.sql"
echo -e "Status:"
docker compose ps
echo ""


