-- ============================================
-- PRODUCTION MIGRATION: Add shippingAmount to Invoice
-- ============================================
-- Date: 2025-01-28
-- IMPORTANT: Run this ONLY on production database
-- ============================================

-- Step 1: Add shippingAmount column
ALTER TABLE Invoice 
ADD COLUMN shippingAmount DECIMAL(12,2) DEFAULT 0.00 
AFTER taxAmount;

-- Step 2: Update existing invoices (safety check)
UPDATE Invoice 
SET shippingAmount = 0.00 
WHERE shippingAmount IS NULL;

-- Step 3: Verify (optional - remove this SELECT before running on production)
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'shippingAmount';






