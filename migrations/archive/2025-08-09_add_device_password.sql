-- Migration: Add devicePassword to Device table
-- Created at 2025-08-09 17:08:20+03:00

USE FZ;

-- Add column if not exists (MariaDB/MySQL workaround using INFORMATION_SCHEMA)
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Device'
    AND COLUMN_NAME = 'devicePassword'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE Device ADD COLUMN devicePassword VARCHAR(100) NULL AFTER serialNumber;',
  'SELECT "Column devicePassword already exists on Device";'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
