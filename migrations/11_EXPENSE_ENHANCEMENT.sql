-- Migration: إضافة vendorId, invoiceId, receiptUrl إلى Expense table
-- Date: 2025-11-17
-- Purpose: إضافة الأعمدة المفقودة لدعم ربط المصروفات بالموردين والفواتير

-- ============================================
-- 1. إضافة vendorId إلى Expense table
-- ============================================
SET @col_exists_vendor = 0;
SELECT COUNT(*) INTO @col_exists_vendor
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'vendorId';

SET @sql_vendor = IF(@col_exists_vendor = 0,
  'ALTER TABLE Expense 
   ADD COLUMN vendorId INT NULL COMMENT ''معرف المورد'',
   ADD INDEX idx_expense_vendor (vendorId),
   ADD CONSTRAINT Expense_ibfk_vendor FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL',
  'SELECT "Column vendorId already exists" AS message'
);

PREPARE stmt_vendor FROM @sql_vendor;
EXECUTE stmt_vendor;
DEALLOCATE PREPARE stmt_vendor;

-- ============================================
-- 2. إضافة invoiceId إلى Expense table
-- ============================================
SET @col_exists_invoice = 0;
SELECT COUNT(*) INTO @col_exists_invoice
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'invoiceId';

SET @sql_invoice = IF(@col_exists_invoice = 0,
  'ALTER TABLE Expense 
   ADD COLUMN invoiceId INT NULL COMMENT ''فاتورة الشراء المرتبطة'',
   ADD INDEX idx_expense_invoice (invoiceId),
   ADD CONSTRAINT Expense_ibfk_invoice FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE SET NULL',
  'SELECT "Column invoiceId already exists" AS message'
);

PREPARE stmt_invoice FROM @sql_invoice;
EXECUTE stmt_invoice;
DEALLOCATE PREPARE stmt_invoice;

-- ============================================
-- 3. إضافة receiptUrl إلى Expense table
-- ============================================
SET @col_exists_receipt = 0;
SELECT COUNT(*) INTO @col_exists_receipt
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'receiptUrl';

SET @sql_receipt = IF(@col_exists_receipt = 0,
  'ALTER TABLE Expense ADD COLUMN receiptUrl VARCHAR(500) NULL COMMENT ''رابط الإيصال''',
  'SELECT "Column receiptUrl already exists" AS message'
);

PREPARE stmt_receipt FROM @sql_receipt;
EXECUTE stmt_receipt;
DEALLOCATE PREPARE stmt_receipt;

-- ============================================
-- 4. إضافة createdBy إذا لم يكن موجوداً (تحويل من userId)
-- ============================================
SET @col_exists_createdBy = 0;
SELECT COUNT(*) INTO @col_exists_createdBy
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'createdBy';

SET @col_exists_userId = 0;
SELECT COUNT(*) INTO @col_exists_userId
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Expense'
  AND COLUMN_NAME = 'userId';

SET @sql_createdBy = IF(@col_exists_createdBy = 0 AND @col_exists_userId > 0,
  'ALTER TABLE Expense 
   ADD COLUMN createdBy INT NULL COMMENT ''أنشئ بواسطة'',
   ADD INDEX idx_expense_createdBy (createdBy),
   ADD CONSTRAINT Expense_ibfk_createdBy FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL,
   UPDATE Expense SET createdBy = userId WHERE userId IS NOT NULL',
  IF(@col_exists_createdBy = 0 AND @col_exists_userId = 0,
    'ALTER TABLE Expense 
     ADD COLUMN createdBy INT NULL COMMENT ''أنشئ بواسطة'',
     ADD INDEX idx_expense_createdBy (createdBy),
     ADD CONSTRAINT Expense_ibfk_createdBy FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL',
    'SELECT "Column createdBy already exists or userId not found" AS message'
  )
);

PREPARE stmt_createdBy FROM @sql_createdBy;
EXECUTE stmt_createdBy;
DEALLOCATE PREPARE stmt_createdBy;

-- التحقق من النتائج
SELECT 'Migration completed successfully!' AS status;
SELECT 'Expense table columns after migration:' AS info;
DESCRIBE Expense;

