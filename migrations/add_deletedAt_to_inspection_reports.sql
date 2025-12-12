-- Migration: Add deletedAt column to InspectionReport table
-- Date: 2025-12-10
-- Description: Add soft delete support to InspectionReport table

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'InspectionReport';
SET @columnname = 'deletedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' datetime DEFAULT NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for better query performance
CREATE INDEX idx_inspection_report_deletedAt ON InspectionReport(deletedAt);



