-- ============================================================================
-- Migration: Add deletedAt column to InspectionReport table
-- Date: 2025-12-10
-- Description: Add soft delete support to InspectionReport table
-- Production Safe: Can be run multiple times without errors
-- ============================================================================

-- Step 1: Add deletedAt column (if not exists)
-- This will safely add the column only if it doesn't already exist
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
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' datetime DEFAULT NULL COMMENT ''Soft delete timestamp''')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 2: Add index (if not exists)
-- This will safely create the index only if it doesn't already exist
SET @indexname = 'idx_inspection_report_deletedAt';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1 AS index_already_exists',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(', @columnname, ')')
));

PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- Step 3: Verification queries (optional - for checking results)
-- Uncomment these lines to verify the migration:

-- SELECT 'Migration completed successfully!' AS status;
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'InspectionReport' 
-- AND COLUMN_NAME = 'deletedAt';
-- 
-- SELECT INDEX_NAME, COLUMN_NAME 
-- FROM INFORMATION_SCHEMA.STATISTICS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'InspectionReport' 
-- AND INDEX_NAME = 'idx_inspection_report_deletedAt';
-- 
-- SELECT COUNT(*) as total_reports, COUNT(deletedAt) as deleted_reports 
-- FROM InspectionReport;



