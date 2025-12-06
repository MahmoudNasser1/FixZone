-- Migration: Add shippingAmount column to Invoice table (LOCAL)
-- Date: 2025-01-28
-- Description: Adds shippingAmount column to support shipping costs in invoices
-- Usage: Run this on local database

-- Add shippingAmount column if it doesn't exist
ALTER TABLE Invoice 
ADD COLUMN IF NOT EXISTS shippingAmount DECIMAL(12,2) DEFAULT 0.00 
AFTER taxAmount;

-- Update existing invoices to have 0.00 shippingAmount if NULL
UPDATE Invoice 
SET shippingAmount = 0.00 
WHERE shippingAmount IS NULL;

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'shippingAmount';



