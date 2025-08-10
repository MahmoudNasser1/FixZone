-- Migration: Rotate all tracking tokens for RepairRequest
-- Date: 2025-08-10

START TRANSACTION;

-- Overwrite all existing tokens with fresh ones
UPDATE RepairRequest
SET trackingToken = LOWER(REPLACE(UUID(), '-', ''));

COMMIT;
