-- Migration: Add discountPercent column to Invoice table
-- Date: 2025-01-12
-- Description: Adds discountPercent column to support percentage-based discounts in invoices

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'Invoice';
SET @columnname = 'discountPercent';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(5,2) DEFAULT 0.00 AFTER discountAmount')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

