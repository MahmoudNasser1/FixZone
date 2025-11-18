-- Migration: إضافة repairId و branchId إلى Expense table
-- Date: 2025-11-18
-- Purpose: ربط المصروفات بطلبات الإصلاح والفروع

-- ============================================
-- 1. إضافة repairId إلى Expense table
-- ============================================
SET @col_exists_repair = 0;
SELECT COUNT(*) INTO @col_exists_repair
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'repairId';

SET @sql_repair = IF(@col_exists_repair = 0,
  'ALTER TABLE Expense 
   ADD COLUMN repairId INT NULL COMMENT ''معرف طلب الإصلاح المرتبط'',
   ADD INDEX idx_expense_repair (repairId),
   ADD CONSTRAINT Expense_ibfk_repair FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL',
  'SELECT "Column repairId already exists" AS message'
);

PREPARE stmt_repair FROM @sql_repair;
EXECUTE stmt_repair;
DEALLOCATE PREPARE stmt_repair;

-- ============================================
-- 2. إضافة branchId إلى Expense table
-- ============================================
SET @col_exists_branch = 0;
SELECT COUNT(*) INTO @col_exists_branch
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'branchId';

SET @sql_branch = IF(@col_exists_branch = 0,
  'ALTER TABLE Expense 
   ADD COLUMN branchId INT NULL COMMENT ''معرف الفرع'',
   ADD INDEX idx_expense_branch (branchId),
   ADD CONSTRAINT Expense_ibfk_branch FOREIGN KEY (branchId) REFERENCES Branch(id) ON DELETE SET NULL',
  'SELECT "Column branchId already exists" AS message'
);

PREPARE stmt_branch FROM @sql_branch;
EXECUTE stmt_branch;
DEALLOCATE PREPARE stmt_branch;

-- التحقق من النتائج
SELECT 'Migration completed successfully!' AS status;
SELECT 'Expense table columns after migration:' AS info;
DESCRIBE Expense;

