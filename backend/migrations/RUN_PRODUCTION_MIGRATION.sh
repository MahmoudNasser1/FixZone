#!/bin/bash

# =====================================================
# Production Migration Script for Inspection Reports
# =====================================================
# 
# Usage:
#   ./RUN_PRODUCTION_MIGRATION.sh [database_name] [mysql_user] [mysql_password]
#
# Example:
#   ./RUN_PRODUCTION_MIGRATION.sh FZ root mypassword
#   OR (will prompt for password):
#   ./RUN_PRODUCTION_MIGRATION.sh FZ root
#
# =====================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get parameters
DB_NAME=${1:-FZ}
DB_USER=${2:-root}
DB_PASS=${3:-}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="$SCRIPT_DIR/PRODUCTION_inspection_reports_enhancement.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Starting Production Migration: Inspection Reports Enhancement${NC}"
echo "=================================================="
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Migration File: $MIGRATION_FILE"
echo "=================================================="
echo ""

# Confirm before proceeding
read -p "⚠️  Are you sure you want to run this migration on PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ Migration cancelled by user${NC}"
    exit 0
fi

# Run migration
if [ -z "$DB_PASS" ]; then
    echo "Enter MySQL password when prompted:"
    mysql -u "$DB_USER" -p "$DB_NAME" < "$MIGRATION_FILE"
else
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$MIGRATION_FILE"
fi

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo ""
    echo "Verification:"
    mysql -u "$DB_USER" ${DB_PASS:+-p"$DB_PASS"} "$DB_NAME" -e "
        SELECT 'Inspection Types' as 'Table', COUNT(*) as 'Count' 
        FROM InspectionType 
        WHERE deletedAt IS NULL
        UNION ALL
        SELECT 'FinalInspectionComponentTemplate' as 'Table', COUNT(*) as 'Count' 
        FROM FinalInspectionComponentTemplate;
    "
else
    echo ""
    echo -e "${RED}❌ Migration failed! Please check the error messages above.${NC}"
    exit 1
fi

