#!/bin/bash

# FixZone ERP - Database Export Script
# This script exports the database for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
# Try to read from backend .env file
BACKEND_ENV="../backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    source "$BACKEND_ENV" 2>/dev/null || true
fi

DB_NAME="${DB_NAME:-FZ}"
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-localhost}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Use XAMPP MySQL if available
MYSQL_CMD="mysql"
MYSQLDUMP_CMD="mysqldump"
if [ -f "/opt/lampp/bin/mysql" ]; then
    MYSQL_CMD="/opt/lampp/bin/mysql"
    MYSQLDUMP_CMD="/opt/lampp/bin/mysqldump"
    export PATH="/opt/lampp/bin:$PATH"
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/fixzone_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo -e "${GREEN}🚀 FixZone Database Export Script${NC}"
echo "=================================="
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Prompt for database password if not set (only in interactive mode)
if [ -z "$DB_PASSWORD" ] && [ -t 0 ]; then
    read -sp "Enter MySQL password for user '$DB_USER' (press Enter if no password): " DB_PASSWORD
    echo ""
fi
# If still empty, use empty password (common for XAMPP)

# Check if database exists
echo -e "${YELLOW}📋 Checking database...${NC}"
if [ -z "$DB_PASSWORD" ]; then
    if ! $MYSQL_CMD -h "$DB_HOST" -u "$DB_USER" -e "USE $DB_NAME" 2>/dev/null; then
        echo -e "${RED}❌ Error: Database '$DB_NAME' does not exist or cannot be accessed${NC}"
        exit 1
    fi
else
    if ! $MYSQL_CMD -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME" 2>/dev/null; then
        echo -e "${RED}❌ Error: Database '$DB_NAME' does not exist or cannot be accessed${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Database found${NC}"
echo ""

# Export database
echo -e "${YELLOW}📦 Exporting database...${NC}"
if [ -z "$DB_PASSWORD" ]; then
    $MYSQLDUMP_CMD -h "$DB_HOST" -u "$DB_USER" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --skip-add-drop-table \
        --databases "$DB_NAME" > "$BACKUP_FILE" 2>&1 | grep -v "View.*references invalid" || true
else
    $MYSQLDUMP_CMD -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --skip-add-drop-table \
        --databases "$DB_NAME" > "$BACKUP_FILE" 2>&1 | grep -v "View.*references invalid" || true
fi

# Check if export was successful (ignore view errors)
if [ ! -s "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Database export failed or produced empty file${NC}"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database exported successfully${NC}"
else
    echo -e "${RED}❌ Error: Database export failed${NC}"
    exit 1
fi
echo ""

# Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
gzip "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup compressed successfully${NC}"
else
    echo -e "${RED}❌ Error: Compression failed${NC}"
    exit 1
fi
echo ""

# Get file size
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

# Display summary
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Export Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "📁 Backup File: $COMPRESSED_FILE"
echo "📊 File Size: $FILE_SIZE"
echo "🕐 Timestamp: $TIMESTAMP"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "   1. Upload this file to your server"
echo "   2. Import it using: mysql -u root -p $DB_NAME < backup_file.sql"
echo ""

