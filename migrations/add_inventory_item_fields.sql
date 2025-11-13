-- ============================================
-- Migration: Add missing fields to InventoryItem table
-- Date: 2025-01-21
-- Description: Add description, category, minStockLevel, maxStockLevel, and unit fields
-- ============================================

USE FZ;

-- Add missing columns to InventoryItem table
ALTER TABLE InventoryItem 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'قطعة';

-- Verify the changes
DESCRIBE InventoryItem;
