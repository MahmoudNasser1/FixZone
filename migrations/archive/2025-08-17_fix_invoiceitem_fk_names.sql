-- Fix duplicate FK name issues on InvoiceItem
-- Safe, idempotent migration to ensure FKs exist with unique names

-- 1) Ensure required columns exist (safe if already exist)
ALTER TABLE InvoiceItem ADD COLUMN IF NOT EXISTS serviceId INT NULL;
ALTER TABLE InvoiceItem ADD COLUMN IF NOT EXISTS inventoryItemId INT NULL;

-- 2) Drop conflicting FK constraints if they exist (old names)
SET @fk1 := (
  SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'InvoiceItem'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_invoiceitem_serviceId'
);
SET @sql1 := IF(@fk1 IS NOT NULL,
  CONCAT('ALTER TABLE InvoiceItem DROP FOREIGN KEY ', @fk1),
  'SELECT 1');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @fk2 := (
  SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'InvoiceItem'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_invoiceitem_inventoryItemId'
);
SET @sql2 := IF(@fk2 IS NOT NULL,
  CONCAT('ALTER TABLE InvoiceItem DROP FOREIGN KEY ', @fk2),
  'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- 3) Ensure indexes exist on FK columns (required by InnoDB)
SET @idx1 := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'InvoiceItem' AND INDEX_NAME = 'idx_invoiceitem_serviceId'
);
SET @sql3 := IF(@idx1 = 0,
  'ALTER TABLE InvoiceItem ADD INDEX idx_invoiceitem_serviceId (serviceId)',
  'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @idx2 := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'InvoiceItem' AND INDEX_NAME = 'idx_invoiceitem_inventoryItemId'
);
SET @sql4 := IF(@idx2 = 0,
  'ALTER TABLE InvoiceItem ADD INDEX idx_invoiceitem_inventoryItemId (inventoryItemId)',
  'SELECT 1');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

-- 4) Add FKs with unique, descriptive names if not already present on same columns
SET @has_fk_service := (
  SELECT COUNT(1)
  FROM information_schema.KEY_COLUMN_USAGE kcu
  JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
    ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
  WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.TABLE_NAME = 'InvoiceItem' AND kcu.COLUMN_NAME = 'serviceId'
);
SET @sql5 := IF(@has_fk_service = 0,
  'ALTER TABLE InvoiceItem\n   ADD CONSTRAINT fk_InvoiceItem_serviceId_Service_id\n   FOREIGN KEY (serviceId) REFERENCES Service(id)',
  'SELECT 1');
PREPARE stmt5 FROM @sql5; EXECUTE stmt5; DEALLOCATE PREPARE stmt5;

SET @has_fk_inventory := (
  SELECT COUNT(1)
  FROM information_schema.KEY_COLUMN_USAGE kcu
  JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
    ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
  WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.TABLE_NAME = 'InvoiceItem' AND kcu.COLUMN_NAME = 'inventoryItemId'
);
SET @sql6 := IF(@has_fk_inventory = 0,
  'ALTER TABLE InvoiceItem\n   ADD CONSTRAINT fk_InvoiceItem_inventoryItemId_InventoryItem_id\n   FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id)',
  'SELECT 1');
PREPARE stmt6 FROM @sql6; EXECUTE stmt6; DEALLOCATE PREPARE stmt6;
