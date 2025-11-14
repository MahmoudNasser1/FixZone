-- Migration: إضافة indexes على User table لتحسين الأداء
-- Date: 2025-11-14
-- Purpose: تحسين أداء البحث في User table

-- إضافة index على phone (إذا لم يكن موجوداً)
-- ملاحظة: email له UNIQUE KEY بالفعل (يحتوي على index)

SET @index_exists_phone = 0;
SELECT COUNT(*) INTO @index_exists_phone
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'User'
  AND INDEX_NAME = 'idx_user_phone'
  AND COLUMN_NAME = 'phone';

SET @sql_phone = IF(@index_exists_phone = 0,
  'ALTER TABLE User ADD INDEX idx_user_phone (phone)',
  'SELECT "Index idx_user_phone already exists" AS message'
);

PREPARE stmt_phone FROM @sql_phone;
EXECUTE stmt_phone;
DEALLOCATE PREPARE stmt_phone;

-- إضافة index على deletedAt لتحسين أداء soft delete queries
SET @index_exists_deleted = 0;
SELECT COUNT(*) INTO @index_exists_deleted
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'User'
  AND INDEX_NAME = 'idx_user_deleted'
  AND COLUMN_NAME = 'deletedAt';

SET @sql_deleted = IF(@index_exists_deleted = 0,
  'ALTER TABLE User ADD INDEX idx_user_deleted (deletedAt)',
  'SELECT "Index idx_user_deleted already exists" AS message'
);

PREPARE stmt_deleted FROM @sql_deleted;
EXECUTE stmt_deleted;
DEALLOCATE PREPARE stmt_deleted;
