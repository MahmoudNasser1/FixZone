-- Migration: Add shippingAmount column to Invoice table
-- Date: 2025-01-28
-- Description: Adds shippingAmount column to support shipping costs in invoices

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'Invoice';
SET @columnname = 'shippingAmount';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(12,2) DEFAULT 0.00 AFTER taxAmount')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;







