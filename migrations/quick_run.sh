#!/bin/bash

# ============================================================================
# Quick Migration Runner Script
# Usage: ./quick_run.sh
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$SCRIPT_DIR/add_deletedAt_to_inspection_reports_PRODUCTION.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    print_error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

print_info "Migration file found: $MIGRATION_FILE"

# Try to load .env file if exists
if [ -f "$PROJECT_DIR/.env" ]; then
    print_info "Loading environment variables from .env..."
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# Set default values
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_NAME=${DB_NAME:-FZ}
DB_PORT=${DB_PORT:-3306}

print_info "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Port: $DB_PORT"

# Check if mysql command exists
if ! command -v mysql &> /dev/null; then
    print_error "MySQL client not found. Please install it:"
    echo "  sudo apt install mysql-client"
    exit 1
fi

print_warning "⚠️  You will be prompted for MySQL password"
print_info "Running migration..."

# Run migration
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    print_success "Migration completed successfully!"
    
    # Verify migration
    print_info "Verifying migration..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" -e "
        SELECT 'Column deletedAt exists' AS status 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '$DB_NAME' 
        AND TABLE_NAME = 'InspectionReport' 
        AND COLUMN_NAME = 'deletedAt';
        
        SELECT COUNT(*) as total_reports, COUNT(deletedAt) as deleted_reports 
        FROM InspectionReport;
    " 2>/dev/null
    
    print_success "Migration verification completed!"
else
    print_error "Migration failed!"
    exit 1
fi




