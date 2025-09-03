-- Migration: Add trackingToken to RepairRequest for public tracking links
-- Date: 2025-08-10

START TRANSACTION;

-- 1) Add column (nullable initially) and unique index
ALTER TABLE RepairRequest
  ADD COLUMN trackingToken VARCHAR(64) NULL AFTER status;

-- 2) Backfill existing rows with unique tokens (32 hex chars from UUID)
UPDATE RepairRequest
SET trackingToken = LOWER(REPLACE(UUID(), '-', ''))
WHERE trackingToken IS NULL;

-- 3) Add a unique constraint (MySQL will ensure uniqueness)
ALTER TABLE RepairRequest
  ADD CONSTRAINT uq_repair_trackingToken UNIQUE (trackingToken);

COMMIT;
