-- Migration: إصلاحات SystemSetting table
-- Date: 2025-11-14
-- Purpose: إضافة indexes و constraints لتحسين الأداء والأمان

-- إضافة unique constraint على key (إذا لم يكن موجوداً)
SET @constraint_exists = 0;
SELECT COUNT(*) INTO @constraint_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'SystemSetting'
  AND CONSTRAINT_TYPE = 'UNIQUE'
  AND CONSTRAINT_NAME LIKE '%key%';

SET @sql_unique = IF(@constraint_exists = 0,
  'ALTER TABLE SystemSetting ADD UNIQUE KEY unique_key (`key`)',
  'SELECT "Unique constraint on key already exists" AS message'
);

PREPARE stmt_unique FROM @sql_unique;
EXECUTE stmt_unique;
DEALLOCATE PREPARE stmt_unique;

-- إضافة index على key (إذا لم يكن موجوداً)
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'SystemSetting'
  AND INDEX_NAME = 'idx_setting_key'
  AND COLUMN_NAME = 'key';

SET @sql_index = IF(@index_exists = 0,
  'ALTER TABLE SystemSetting ADD INDEX idx_setting_key (`key`)',
  'SELECT "Index idx_setting_key already exists" AS message'
);

PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

