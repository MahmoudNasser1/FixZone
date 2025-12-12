#!/bin/bash

# ============================================================================
# Apply Technician Migrations Script
# Usage: ./apply_technician_migrations.sh
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

# Try to load .env file if exists
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    print_info "Loading environment variables from backend/.env..."
    export $(cat "$PROJECT_DIR/backend/.env" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_DIR/.env" ]; then
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
echo ""

# Check if mysql command exists
MYSQL_CMD="mysql"
if ! command -v mysql &> /dev/null; then
    # Try XAMPP MySQL path
    if [ -f "/opt/lampp/bin/mysql" ]; then
        MYSQL_CMD="/opt/lampp/bin/mysql"
        print_info "Using XAMPP MySQL: $MYSQL_CMD"
    else
        print_error "MySQL client not found. Please install it or set MYSQL_CMD path."
        exit 1
    fi
fi

# Migration files
MIGRATIONS=(
    "create_technician_notes_PRODUCTION.sql"
    "create_technician_reports_PRODUCTION.sql"
    "create_technician_tasks_PRODUCTION.sql"
    "create_technician_time_tracking_PRODUCTION.sql"
)

print_info "Found ${#MIGRATIONS[@]} migration files to apply"
echo ""

# Ask for confirmation
read -p "Do you want to proceed? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Migration cancelled."
    exit 0
fi

# Apply each migration
SUCCESS_COUNT=0
FAILED_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    MIGRATION_FILE="$SCRIPT_DIR/$migration"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        print_error "Migration file not found: $migration"
        ((FAILED_COUNT++))
        continue
    fi
    
    print_info "Applying: $migration"
    
    # Run migration
    $MYSQL_CMD -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < "$MIGRATION_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "✅ $migration applied successfully!"
        ((SUCCESS_COUNT++))
    else
        print_error "❌ $migration failed!"
        ((FAILED_COUNT++))
    fi
    echo ""
done

# Summary
echo "=========================================="
if [ $FAILED_COUNT -eq 0 ]; then
    print_success "All migrations completed successfully!"
    echo "  Success: $SUCCESS_COUNT"
    echo "  Failed: $FAILED_COUNT"
else
    print_warning "Some migrations failed!"
    echo "  Success: $SUCCESS_COUNT"
    echo "  Failed: $FAILED_COUNT"
fi
echo "=========================================="

# Verify tables
print_info "Verifying created tables..."
$MYSQL_CMD -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" -e "
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = '$DB_NAME' 
    AND TABLE_NAME IN ('Notes', 'NoteAttachments', 'TechnicianReports', 'Tasks', 'TimeTracking', 'TimeAdjustments')
    ORDER BY TABLE_NAME;
" 2>/dev/null

exit $FAILED_COUNT

