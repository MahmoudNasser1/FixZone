-- Add missing columns to Invoice to align with controller usage
-- Safe/idempotent-ish: uses IF NOT EXISTS for columns. For older MySQL versions, run checks via INFORMATION_SCHEMA if needed.

ALTER TABLE Invoice
  ADD COLUMN IF NOT EXISTS discountAmount DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dueDate DATE NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL;
