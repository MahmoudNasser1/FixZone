#!/bin/bash

###############################################################################
# Fix Zone ERP - Backup Script
# هذا السكريبت يقوم بعمل نسخة احتياطية كاملة للنظام
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/fixzone"
BACKEND_DIR="$APP_DIR/backend"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fixzone_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Retention (عدد النسخ الاحتياطية المحفوظة)
RETENTION_DAYS=30

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Zone ERP - Backup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create backup directory
mkdir -p "$BACKUP_PATH"

# 1. Backup Database
echo -e "${YELLOW}[1/4] Backing up database...${NC}"
if [ -f "$BACKEND_DIR/.env" ]; then
    source "$BACKEND_DIR/.env" 2>/dev/null || true
fi

DB_USER=${DB_USER:-fixzone_user}
DB_NAME=${DB_NAME:-FZ}
DB_PASSWORD=${DB_PASSWORD:-}

if [ -z "$DB_PASSWORD" ]; then
    read -sp "Enter MySQL password for $DB_USER: " DB_PASSWORD
    echo
fi

if mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_PATH/database.sql" 2>/dev/null; then
    echo -e "${GREEN}✓ Database backed up${NC}"
    # Compress database backup
    gzip "$BACKUP_PATH/database.sql"
else
    echo -e "${RED}✗ Database backup failed${NC}"
    exit 1
fi

# 2. Backup Application Files
echo -e "${YELLOW}[2/4] Backing up application files...${NC}"
cd "$APP_DIR"

tar -czf "$BACKUP_PATH/application.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='build' \
    --exclude='backups' \
    --exclude='logs' \
    --exclude='*.log' \
    backend frontend migrations

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Application files backed up${NC}"
else
    echo -e "${RED}✗ Application backup failed${NC}"
    exit 1
fi

# 3. Backup Uploads
echo -e "${YELLOW}[3/4] Backing up uploads...${NC}"
if [ -d "$BACKEND_DIR/uploads" ]; then
    tar -czf "$BACKUP_PATH/uploads.tar.gz" -C "$BACKEND_DIR" uploads
    echo -e "${GREEN}✓ Uploads backed up${NC}"
else
    echo -e "${YELLOW}⚠ Uploads directory not found${NC}"
fi

# 4. Create Backup Info File
echo -e "${YELLOW}[4/4] Creating backup info...${NC}"
cat > "$BACKUP_PATH/backup_info.txt" << EOF
Fix Zone ERP Backup Information
===============================
Date: $(date)
Timestamp: $TIMESTAMP
Backup Name: $BACKUP_NAME

Contents:
- database.sql.gz (Database dump)
- application.tar.gz (Application files)
- uploads.tar.gz (Uploaded files)

System Information:
- Node.js: $(node --version 2>/dev/null || echo "N/A")
- MySQL: $(mysql --version 2>/dev/null | awk '{print $5}' || echo "N/A")
- Disk Usage: $(df -h "$APP_DIR" | tail -1 | awk '{print $5}')

To restore:
1. Extract: tar -xzf application.tar.gz
2. Import database: gunzip -c database.sql.gz | mysql -u user -p database
3. Extract uploads: tar -xzf uploads.tar.gz
EOF

echo -e "${GREEN}✓ Backup info created${NC}"

# Create single archive
echo -e "${YELLOW}Creating final archive...${NC}"
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"

# Get file size
FILE_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo -e "Size: $FILE_SIZE"
echo ""

# Cleanup old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "fixzone_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}✓ Cleanup complete${NC}"

# List remaining backups
echo ""
echo -e "${BLUE}Remaining backups:${NC}"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}' || echo "No backups found"

echo ""







