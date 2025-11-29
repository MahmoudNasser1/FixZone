-- Migration: Add Missing Columns to Invoice Table
-- Date: 2025-01-28
-- Description: Add discountAmount, dueDate, notes, customerId, companyId, branchId to Invoice table
-- Phase: Phase 1 - Critical Fixes

-- Note: This migration checks if columns exist before adding them to avoid errors

-- Step 1: Add discountAmount column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND COLUMN_NAME = 'discountAmount');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE Invoice ADD COLUMN discountAmount DECIMAL(12,2) DEFAULT 0.00 AFTER taxAmount', 
  'SELECT "Column discountAmount already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add dueDate column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND COLUMN_NAME = 'dueDate');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE Invoice ADD COLUMN dueDate DATE NULL AFTER currency', 
  'SELECT "Column dueDate already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add notes column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND COLUMN_NAME = 'notes');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE Invoice ADD COLUMN notes TEXT NULL AFTER status', 
  'SELECT "Column notes already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add customerId column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND COLUMN_NAME = 'customerId');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE Invoice ADD COLUMN customerId INT(11) NULL AFTER id', 
  'SELECT "Column customerId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add companyId column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND COLUMN_NAME = 'companyId');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE Invoice ADD COLUMN companyId INT(11) NULL AFTER customerId', 
  'SELECT "Column companyId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add branchId column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND COLUMN_NAME = 'branchId');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE Invoice ADD COLUMN branchId INT(11) NULL AFTER companyId', 
  'SELECT "Column branchId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add indexes for better performance
-- Note: MariaDB doesn't support IF NOT EXISTS in CREATE INDEX, so we check first
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND INDEX_NAME = 'idx_invoice_customer');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_customer ON Invoice(customerId)', 
  'SELECT "Index idx_invoice_customer already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND INDEX_NAME = 'idx_invoice_company');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_company ON Invoice(companyId)', 
  'SELECT "Index idx_invoice_company already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND INDEX_NAME = 'idx_invoice_branch');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_branch ON Invoice(branchId)', 
  'SELECT "Index idx_invoice_branch already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND INDEX_NAME = 'idx_invoice_dueDate');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_dueDate ON Invoice(dueDate)', 
  'SELECT "Index idx_invoice_dueDate already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Invoice' 
  AND INDEX_NAME = 'idx_invoice_status');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_status ON Invoice(status)', 
  'SELECT "Index idx_invoice_status already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
