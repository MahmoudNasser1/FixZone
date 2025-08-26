-- Fix InvoiceItem table to match controller expectations
-- Add missing fields for proper invoice item tracking

-- Add serviceId field to link invoice items to services
ALTER TABLE InvoiceItem ADD COLUMN IF NOT EXISTS serviceId INT DEFAULT NULL;
-- Optional FK (may already exist); add with a consistent name
ALTER TABLE InvoiceItem 
  ADD CONSTRAINT fk_invoiceitem_serviceId 
  FOREIGN KEY (serviceId) REFERENCES Service(id);

-- Add inventoryItemId field to link invoice items to inventory
ALTER TABLE InvoiceItem ADD COLUMN IF NOT EXISTS inventoryItemId INT DEFAULT NULL;
-- Optional FK (may already exist); add with a consistent name
ALTER TABLE InvoiceItem 
  ADD CONSTRAINT fk_invoiceitem_inventoryItemId 
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id);

-- Add description field for better item identification
ALTER TABLE InvoiceItem ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Add itemType field to distinguish between parts and services
ALTER TABLE InvoiceItem ADD COLUMN IF NOT EXISTS itemType ENUM('part', 'service') DEFAULT 'part';

-- Update existing records to set itemType based on existing data
UPDATE InvoiceItem SET itemType = 'part' WHERE partsUsedId IS NOT NULL;
UPDATE InvoiceItem SET itemType = 'service' WHERE serviceId IS NOT NULL;
