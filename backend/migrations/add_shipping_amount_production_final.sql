-- Migration: Add shippingAmount column to Invoice table (PRODUCTION - FINAL)
-- Date: 2025-01-28
-- Description: Adds shippingAmount column to support shipping costs in invoices
-- IMPORTANT: Run this on production database

-- Step 1: Add the column
ALTER TABLE Invoice 
ADD COLUMN shippingAmount DECIMAL(12,2) DEFAULT 0.00 
AFTER taxAmount;

-- Step 2: Update any existing NULL values (safety check)
UPDATE Invoice 
SET shippingAmount = 0.00 
WHERE shippingAmount IS NULL;

-- Step 3: Verify the column was added successfully
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    IS_NULLABLE,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'shippingAmount';





