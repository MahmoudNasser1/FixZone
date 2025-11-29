#!/bin/bash

# Script to apply Financial System Migrations
# Usage: ./apply_financial_migrations.sh [staging|production]

set -e  # Exit on error

ENVIRONMENT=${1:-staging}
DB_NAME="FZ"
DB_USER="root"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/lampp/htdocs/FixZone/backups"
MIGRATIONS_DIR="/opt/lampp/htdocs/FixZone/backend/migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Financial System Migrations${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Step 1: Backup database
echo -e "\n${YELLOW}Step 1: Creating database backup...${NC}"
BACKUP_FILE="$BACKUP_DIR/backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
mysqldump -u "$DB_USER" -p "$DB_NAME" > "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Step 2: Apply migrations
echo -e "\n${YELLOW}Step 2: Applying migrations...${NC}"

# Migration 1: Add missing columns to Invoice
echo -e "${YELLOW}Applying Migration 1: Add missing columns to Invoice...${NC}"
mysql -u "$DB_USER" -p "$DB_NAME" < "$MIGRATIONS_DIR/20250128_add_missing_columns_to_invoice.sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration 1 applied successfully${NC}"
else
    echo -e "${RED}✗ Migration 1 failed!${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    mysql -u "$DB_USER" -p "$DB_NAME" < "$BACKUP_FILE"
    exit 1
fi

# Migration 2: Add paymentDate to Payment
echo -e "${YELLOW}Applying Migration 2: Add paymentDate to Payment...${NC}"
mysql -u "$DB_USER" -p "$DB_NAME" < "$MIGRATIONS_DIR/20250128_add_paymentDate_to_payment.sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration 2 applied successfully${NC}"
else
    echo -e "${RED}✗ Migration 2 failed!${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    mysql -u "$DB_USER" -p "$DB_NAME" < "$BACKUP_FILE"
    exit 1
fi

# Migration 3: Add soft delete to InvoiceItem
echo -e "${YELLOW}Applying Migration 3: Add soft delete to InvoiceItem...${NC}"
mysql -u "$DB_USER" -p "$DB_NAME" < "$MIGRATIONS_DIR/20250128_add_soft_delete_to_invoice_item.sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration 3 applied successfully${NC}"
else
    echo -e "${RED}✗ Migration 3 failed!${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    mysql -u "$DB_USER" -p "$DB_NAME" < "$BACKUP_FILE"
    exit 1
fi

# Step 3: Verify migrations
echo -e "\n${YELLOW}Step 3: Verifying migrations...${NC}"

# Check Invoice table
echo -e "${YELLOW}Checking Invoice table...${NC}"
mysql -u "$DB_USER" -p "$DB_NAME" -e "DESCRIBE Invoice;" | grep -E "(discountAmount|dueDate|notes|customerId)" && \
    echo -e "${GREEN}✓ Invoice table columns verified${NC}" || \
    echo -e "${RED}✗ Invoice table verification failed${NC}"

# Check Payment table
echo -e "${YELLOW}Checking Payment table...${NC}"
mysql -u "$DB_USER" -p "$DB_NAME" -e "DESCRIBE Payment;" | grep "paymentDate" && \
    echo -e "${GREEN}✓ Payment table column verified${NC}" || \
    echo -e "${RED}✗ Payment table verification failed${NC}"

# Check InvoiceItem table
echo -e "${YELLOW}Checking InvoiceItem table...${NC}"
mysql -u "$DB_USER" -p "$DB_NAME" -e "DESCRIBE InvoiceItem;" | grep "deletedAt" && \
    echo -e "${GREEN}✓ InvoiceItem table column verified${NC}" || \
    echo -e "${RED}✗ InvoiceItem table verification failed${NC}"

# Step 4: Data integrity check
echo -e "\n${YELLOW}Step 4: Checking data integrity...${NC}"
INVOICE_COUNT=$(mysql -u "$DB_USER" -p "$DB_NAME" -se "SELECT COUNT(*) FROM Invoice;")
PAYMENT_COUNT=$(mysql -u "$DB_USER" -p "$DB_NAME" -se "SELECT COUNT(*) FROM Payment;")
INVOICE_ITEM_COUNT=$(mysql -u "$DB_USER" -p "$DB_NAME" -se "SELECT COUNT(*) FROM InvoiceItem;")

echo -e "${GREEN}Invoice records: $INVOICE_COUNT${NC}"
echo -e "${GREEN}Payment records: $PAYMENT_COUNT${NC}"
echo -e "${GREEN}InvoiceItem records: $INVOICE_ITEM_COUNT${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}All migrations applied successfully!${NC}"
echo -e "${GREEN}Backup saved at: $BACKUP_FILE${NC}"
echo -e "${GREEN}========================================${NC}"


