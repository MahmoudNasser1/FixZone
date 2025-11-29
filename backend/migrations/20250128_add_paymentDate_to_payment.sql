-- Migration: Add paymentDate column to Payment table
-- Date: 2025-01-28
-- Description: Add paymentDate column to Payment table for better date tracking
-- Phase: Phase 1 - Critical Fixes

-- Step 1: Add paymentDate column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Payment' 
  AND COLUMN_NAME = 'paymentDate');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE Payment ADD COLUMN paymentDate DATE NULL AFTER amount', 
  'SELECT "Column paymentDate already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Update existing records to use createdAt date as paymentDate
UPDATE Payment 
SET paymentDate = DATE(createdAt) 
WHERE paymentDate IS NULL AND createdAt IS NOT NULL;

-- Step 3: Add index for better performance
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Payment' 
  AND INDEX_NAME = 'idx_payment_paymentDate');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_payment_paymentDate ON Payment(paymentDate)', 
  'SELECT "Index idx_payment_paymentDate already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add index for invoiceId
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Payment' 
  AND INDEX_NAME = 'idx_payment_invoiceId');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_payment_invoiceId ON Payment(invoiceId)', 
  'SELECT "Index idx_payment_invoiceId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
