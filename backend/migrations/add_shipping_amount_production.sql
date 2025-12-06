-- Migration: Add shippingAmount column to Invoice table (PRODUCTION)
-- Date: 2025-01-28
-- Description: Adds shippingAmount column to support shipping costs in invoices
-- Usage: Run this on production database

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

-- Update existing invoices to have 0.00 shippingAmount if NULL
UPDATE Invoice 
SET shippingAmount = 0.00 
WHERE shippingAmount IS NULL;

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'shippingAmount';



