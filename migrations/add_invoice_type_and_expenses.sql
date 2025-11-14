-- Migration: إضافة invoiceType إلى Invoice وإنشاء Expense و ExpenseCategory tables
-- Date: 2025-10-27
-- Purpose: دعم فواتير الشراء وإنشاء نظام المصروفات

-- ============================================
-- 1. إضافة invoiceType و vendorId إلى Invoice table
-- ============================================
SET @col_exists_type = 0;
SELECT COUNT(*) INTO @col_exists_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'invoiceType';

SET @sql_type = IF(@col_exists_type = 0,
  'ALTER TABLE Invoice 
   ADD COLUMN invoiceType ENUM(''sale'', ''purchase'') DEFAULT ''sale'' COMMENT ''نوع الفاتورة: بيع أو شراء'',
   ADD INDEX idx_invoice_type (invoiceType)',
  'SELECT "Column invoiceType already exists" AS message'
);

PREPARE stmt_type FROM @sql_type;
EXECUTE stmt_type;
DEALLOCATE PREPARE stmt_type;

-- إضافة vendorId
SET @col_exists_vendor = 0;
SELECT COUNT(*) INTO @col_exists_vendor
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'vendorId';

SET @sql_vendor = IF(@col_exists_vendor = 0,
  'ALTER TABLE Invoice 
   ADD COLUMN vendorId INT NULL COMMENT ''معرف المورد - للفواتير من نوع purchase'',
   ADD INDEX idx_invoice_vendor (vendorId),
   ADD CONSTRAINT Invoice_ibfk_vendor FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL',
  'SELECT "Column vendorId already exists" AS message'
);

PREPARE stmt_vendor FROM @sql_vendor;
EXECUTE stmt_vendor;
DEALLOCATE PREPARE stmt_vendor;

-- ============================================
-- 2. إنشاء ExpenseCategory table
-- ============================================
CREATE TABLE IF NOT EXISTS ExpenseCategory (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- إضافة فئات أساسية
INSERT INTO ExpenseCategory (name) VALUES
  ('إيجار'),
  ('مرتبات'),
  ('مرافق'),
  ('صيانة'),
  ('نقل'),
  ('إعلانات'),
  ('أخرى')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- 3. إنشاء Expense table
-- ============================================
CREATE TABLE IF NOT EXISTS Expense (
  id INT NOT NULL AUTO_INCREMENT,
  categoryId INT,
  vendorId INT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expenseDate DATE NOT NULL,
  invoiceId INT NULL COMMENT 'فاتورة الشراء المرتبطة',
  receiptUrl VARCHAR(500) NULL,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (categoryId) REFERENCES ExpenseCategory(id) ON DELETE SET NULL,
  FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL,
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL,
  INDEX idx_expense_date (expenseDate),
  INDEX idx_expense_category (categoryId),
  INDEX idx_expense_vendor (vendorId),
  INDEX idx_expense_invoice (invoiceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- التحقق من النتائج
SELECT 'Migration completed successfully!' AS status;
SELECT 'Invoice table columns:' AS info;
DESCRIBE Invoice;
SELECT 'ExpenseCategory table created' AS info;
SELECT COUNT(*) as category_count FROM ExpenseCategory;
SELECT 'Expense table created' AS info;


-- Purpose: دعم فواتير الشراء وإنشاء نظام المصروفات

-- ============================================
-- 1. إضافة invoiceType و vendorId إلى Invoice table
-- ============================================
SET @col_exists_type = 0;
SELECT COUNT(*) INTO @col_exists_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'invoiceType';

SET @sql_type = IF(@col_exists_type = 0,
  'ALTER TABLE Invoice 
   ADD COLUMN invoiceType ENUM(''sale'', ''purchase'') DEFAULT ''sale'' COMMENT ''نوع الفاتورة: بيع أو شراء'',
   ADD INDEX idx_invoice_type (invoiceType)',
  'SELECT "Column invoiceType already exists" AS message'
);

PREPARE stmt_type FROM @sql_type;
EXECUTE stmt_type;
DEALLOCATE PREPARE stmt_type;

-- إضافة vendorId
SET @col_exists_vendor = 0;
SELECT COUNT(*) INTO @col_exists_vendor
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'vendorId';

SET @sql_vendor = IF(@col_exists_vendor = 0,
  'ALTER TABLE Invoice 
   ADD COLUMN vendorId INT NULL COMMENT ''معرف المورد - للفواتير من نوع purchase'',
   ADD INDEX idx_invoice_vendor (vendorId),
   ADD CONSTRAINT Invoice_ibfk_vendor FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL',
  'SELECT "Column vendorId already exists" AS message'
);

PREPARE stmt_vendor FROM @sql_vendor;
EXECUTE stmt_vendor;
DEALLOCATE PREPARE stmt_vendor;

-- ============================================
-- 2. إنشاء ExpenseCategory table
-- ============================================
CREATE TABLE IF NOT EXISTS ExpenseCategory (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- إضافة فئات أساسية
INSERT INTO ExpenseCategory (name) VALUES
  ('إيجار'),
  ('مرتبات'),
  ('مرافق'),
  ('صيانة'),
  ('نقل'),
  ('إعلانات'),
  ('أخرى')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- 3. إنشاء Expense table
-- ============================================
CREATE TABLE IF NOT EXISTS Expense (
  id INT NOT NULL AUTO_INCREMENT,
  categoryId INT,
  vendorId INT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expenseDate DATE NOT NULL,
  invoiceId INT NULL COMMENT 'فاتورة الشراء المرتبطة',
  receiptUrl VARCHAR(500) NULL,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (categoryId) REFERENCES ExpenseCategory(id) ON DELETE SET NULL,
  FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL,
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL,
  INDEX idx_expense_date (expenseDate),
  INDEX idx_expense_category (categoryId),
  INDEX idx_expense_vendor (vendorId),
  INDEX idx_expense_invoice (invoiceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- التحقق من النتائج
SELECT 'Migration completed successfully!' AS status;
SELECT 'Invoice table columns:' AS info;
DESCRIBE Invoice;
SELECT 'ExpenseCategory table created' AS info;
SELECT COUNT(*) as category_count FROM ExpenseCategory;
SELECT 'Expense table created' AS info;


-- Purpose: دعم فواتير الشراء وإنشاء نظام المصروفات

-- ============================================
-- 1. إضافة invoiceType و vendorId إلى Invoice table
-- ============================================
SET @col_exists_type = 0;
SELECT COUNT(*) INTO @col_exists_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'invoiceType';

SET @sql_type = IF(@col_exists_type = 0,
  'ALTER TABLE Invoice 
   ADD COLUMN invoiceType ENUM(''sale'', ''purchase'') DEFAULT ''sale'' COMMENT ''نوع الفاتورة: بيع أو شراء'',
   ADD INDEX idx_invoice_type (invoiceType)',
  'SELECT "Column invoiceType already exists" AS message'
);

PREPARE stmt_type FROM @sql_type;
EXECUTE stmt_type;
DEALLOCATE PREPARE stmt_type;

-- إضافة vendorId
SET @col_exists_vendor = 0;
SELECT COUNT(*) INTO @col_exists_vendor
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'vendorId';

SET @sql_vendor = IF(@col_exists_vendor = 0,
  'ALTER TABLE Invoice 
   ADD COLUMN vendorId INT NULL COMMENT ''معرف المورد - للفواتير من نوع purchase'',
   ADD INDEX idx_invoice_vendor (vendorId),
   ADD CONSTRAINT Invoice_ibfk_vendor FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL',
  'SELECT "Column vendorId already exists" AS message'
);

PREPARE stmt_vendor FROM @sql_vendor;
EXECUTE stmt_vendor;
DEALLOCATE PREPARE stmt_vendor;

-- ============================================
-- 2. إنشاء ExpenseCategory table
-- ============================================
CREATE TABLE IF NOT EXISTS ExpenseCategory (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- إضافة فئات أساسية
INSERT INTO ExpenseCategory (name) VALUES
  ('إيجار'),
  ('مرتبات'),
  ('مرافق'),
  ('صيانة'),
  ('نقل'),
  ('إعلانات'),
  ('أخرى')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- 3. إنشاء Expense table
-- ============================================
CREATE TABLE IF NOT EXISTS Expense (
  id INT NOT NULL AUTO_INCREMENT,
  categoryId INT,
  vendorId INT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expenseDate DATE NOT NULL,
  invoiceId INT NULL COMMENT 'فاتورة الشراء المرتبطة',
  receiptUrl VARCHAR(500) NULL,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (categoryId) REFERENCES ExpenseCategory(id) ON DELETE SET NULL,
  FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL,
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL,
  INDEX idx_expense_date (expenseDate),
  INDEX idx_expense_category (categoryId),
  INDEX idx_expense_vendor (vendorId),
  INDEX idx_expense_invoice (invoiceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- التحقق من النتائج
SELECT 'Migration completed successfully!' AS status;
SELECT 'Invoice table columns:' AS info;
DESCRIBE Invoice;
SELECT 'ExpenseCategory table created' AS info;
SELECT COUNT(*) as category_count FROM ExpenseCategory;
SELECT 'Expense table created' AS info;

