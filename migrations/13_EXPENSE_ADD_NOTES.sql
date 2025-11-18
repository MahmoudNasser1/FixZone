-- Migration: إضافة عمود notes إلى Expense table
-- Date: 2025-11-18
-- Purpose: إضافة حقل الملاحظات لجدول المصروفات

-- ============================================
-- 1. إضافة notes إلى Expense table
-- ============================================
SET @col_exists_notes = 0;
SELECT COUNT(*) INTO @col_exists_notes
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'notes';

SET @sql_notes = IF(@col_exists_notes = 0,
  'ALTER TABLE Expense 
   ADD COLUMN notes TEXT NULL COMMENT ''ملاحظات'' AFTER receiptUrl',
  'SELECT "Column notes already exists" AS message'
);

PREPARE stmt_notes FROM @sql_notes;
EXECUTE stmt_notes;
DEALLOCATE PREPARE stmt_notes;

-- التحقق من النتائج
SELECT 'Migration completed successfully!' AS status;
SELECT 'Expense table columns after migration:' AS info;
DESCRIBE Expense;

