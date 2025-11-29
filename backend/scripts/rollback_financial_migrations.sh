#!/bin/bash

# Script to rollback Financial System Migrations
# Usage: ./rollback_financial_migrations.sh <backup_file>

set -e  # Exit on error

BACKUP_FILE=$1
DB_NAME="FZ"
DB_USER="root"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file is required${NC}"
    echo "Usage: ./rollback_financial_migrations.sh <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Rolling back Financial System Migrations${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo -e "${YELLOW}========================================${NC}"

# Confirm rollback
read -p "Are you sure you want to rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Restore from backup
echo -e "\n${YELLOW}Restoring database from backup...${NC}"
mysql -u "$DB_USER" -p "$DB_NAME" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Database restore failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Rollback completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"


