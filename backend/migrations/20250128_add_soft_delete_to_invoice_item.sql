-- Migration: Add soft delete to InvoiceItem table
-- Date: 2025-01-28
-- Description: Add deletedAt column to InvoiceItem for soft delete functionality
-- Phase: Phase 1 - Critical Fixes

-- Step 1: Add deletedAt column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'InvoiceItem' 
  AND COLUMN_NAME = 'deletedAt');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE InvoiceItem ADD COLUMN deletedAt DATETIME NULL AFTER updatedAt', 
  'SELECT "Column deletedAt already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add index for better performance
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'InvoiceItem' 
  AND INDEX_NAME = 'idx_invoice_item_deletedAt');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_item_deletedAt ON InvoiceItem(deletedAt)', 
  'SELECT "Index idx_invoice_item_deletedAt already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add index for invoiceId
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'InvoiceItem' 
  AND INDEX_NAME = 'idx_invoice_item_invoiceId');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_item_invoiceId ON InvoiceItem(invoiceId)', 
  'SELECT "Index idx_invoice_item_invoiceId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add index for inventoryItemId
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'InvoiceItem' 
  AND INDEX_NAME = 'idx_invoice_item_inventoryItemId');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX idx_invoice_item_inventoryItemId ON InvoiceItem(inventoryItemId)', 
  'SELECT "Index idx_invoice_item_inventoryItemId already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
