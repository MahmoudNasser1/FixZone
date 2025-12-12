-- Migration: Add deletedAt column to StockLevel and StockCount tables
-- Date: 2025-11-20
-- Purpose: Enable soft delete functionality

USE fixzone;

-- Add deletedAt to StockLevel table
ALTER TABLE StockLevel 
ADD COLUMN IF NOT EXISTS deletedAt DATETIME NULL DEFAULT NULL;

-- Add index for soft delete queries
ALTER TABLE StockLevel 
ADD INDEX IF NOT EXISTS idx_stocklevel_deleted (deletedAt);

-- Add deletedAt to StockCount table (if not exists)
ALTER TABLE StockCount 
ADD COLUMN IF NOT EXISTS deletedAt DATETIME NULL DEFAULT NULL;

-- Add index for soft delete queries
ALTER TABLE StockCount 
ADD INDEX IF NOT EXISTS idx_stockcount_deleted (deletedAt);

