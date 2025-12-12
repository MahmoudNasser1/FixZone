-- Migration: Stock Movement Enhancements
-- Date: 2025-11-19
-- Description: Add notes and deletedAt columns to StockMovement table

-- Check if notes column exists, if not add it
SET @notes_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'FZ' 
    AND TABLE_NAME = 'StockMovement' 
    AND COLUMN_NAME = 'notes'
);

SET @sql_notes = IF(@notes_exists = 0,
  'ALTER TABLE StockMovement ADD COLUMN notes TEXT NULL COMMENT "ملاحظات الحركة" AFTER userId',
  'SELECT "notes column already exists" AS message'
);

PREPARE stmt FROM @sql_notes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if deletedAt column exists, if not add it
SET @deletedat_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'FZ' 
    AND TABLE_NAME = 'StockMovement' 
    AND COLUMN_NAME = 'deletedAt'
);

SET @sql_deletedat = IF(@deletedat_exists = 0,
  'ALTER TABLE StockMovement ADD COLUMN deletedAt DATETIME NULL COMMENT "Soft delete timestamp" AFTER updatedAt',
  'SELECT "deletedAt column already exists" AS message'
);

PREPARE stmt FROM @sql_deletedat;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on deletedAt for better query performance
CREATE INDEX IF NOT EXISTS idx_stockmovement_deleted ON StockMovement(deletedAt);

-- Success message
SELECT 'Migration 14_STOCK_MOVEMENT_ENHANCEMENT completed successfully' AS result;

