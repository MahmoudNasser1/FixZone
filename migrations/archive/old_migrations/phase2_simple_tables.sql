-- =====================================================
-- Phase 2 Simple Migration - Core Tables Only
-- تاريخ الإنشاء: 3 أكتوبر 2025
-- الغرض: إنشاء الجداول الأساسية لـ Phase 2
-- =====================================================

-- 1. جدول PartsUsed (استهلاك القطع في الصيانة)
-- =====================================================
CREATE TABLE IF NOT EXISTS PartsUsed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unitPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  totalPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  warehouseId INT NOT NULL,
  usedBy INT NOT NULL,
  usedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  INDEX idx_partsused_repair (repairRequestId),
  INDEX idx_partsused_item (inventoryItemId),
  INDEX idx_partsused_warehouse (warehouseId),
  INDEX idx_partsused_user (usedBy),
  INDEX idx_partsused_date (usedAt),
  INDEX idx_partsused_deleted (deletedAt)
);

-- 2. جدول StockCount (جرد المخزون)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockCount (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouseId INT NOT NULL,
  countDate DATE NOT NULL,
  status ENUM('draft', 'in_progress', 'completed', 'approved', 'cancelled') DEFAULT 'draft',
  totalItems INT DEFAULT 0,
  countedItems INT DEFAULT 0,
  discrepancies INT DEFAULT 0,
  totalVariance DECIMAL(10,2) DEFAULT 0.00,
  referenceNumber VARCHAR(50) UNIQUE,
  notes TEXT,
  createdBy INT NOT NULL,
  completedBy INT NULL,
  approvedBy INT NULL,
  completedAt TIMESTAMP NULL,
  approvedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  INDEX idx_stockcount_warehouse (warehouseId),
  INDEX idx_stockcount_status (status),
  INDEX idx_stockcount_date (countDate),
  INDEX idx_stockcount_created (createdBy),
  INDEX idx_stockcount_reference (referenceNumber),
  INDEX idx_stockcount_deleted (deletedAt)
);

-- 3. جدول StockCountItem (عناصر الجرد)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockCountItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockCountId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  systemQuantity INT NOT NULL DEFAULT 0,
  countedQuantity INT NOT NULL DEFAULT 0,
  variance INT NOT NULL DEFAULT 0,
  varianceValue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  countedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  UNIQUE KEY unique_count_item (stockCountId, inventoryItemId),
  INDEX idx_stockcountitem_count (stockCountId),
  INDEX idx_stockcountitem_item (inventoryItemId),
  INDEX idx_stockcountitem_variance (variance),
  INDEX idx_stockcountitem_deleted (deletedAt)
);

-- 4. جدول StockTransfer (نقل بين المخازن)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockTransfer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fromWarehouseId INT NOT NULL,
  toWarehouseId INT NOT NULL,
  transferDate DATE NOT NULL,
  status ENUM('draft', 'approved', 'shipped', 'received', 'completed', 'cancelled') DEFAULT 'draft',
  totalItems INT DEFAULT 0,
  totalQuantity INT DEFAULT 0,
  totalValue DECIMAL(10,2) DEFAULT 0.00,
  referenceNumber VARCHAR(50) UNIQUE,
  notes TEXT,
  reason VARCHAR(255),
  createdBy INT NOT NULL,
  approvedBy INT NULL,
  shippedBy INT NULL,
  receivedBy INT NULL,
  shippedAt TIMESTAMP NULL,
  receivedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  INDEX idx_stocktransfer_from (fromWarehouseId),
  INDEX idx_stocktransfer_to (toWarehouseId),
  INDEX idx_stocktransfer_status (status),
  INDEX idx_stocktransfer_date (transferDate),
  INDEX idx_stocktransfer_reference (referenceNumber),
  INDEX idx_stocktransfer_created (createdBy),
  INDEX idx_stocktransfer_deleted (deletedAt)
);

-- 5. جدول StockTransferItem (عناصر النقل)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockTransferItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockTransferId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unitPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  totalPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  UNIQUE KEY unique_transfer_item (stockTransferId, inventoryItemId),
  INDEX idx_stocktransferitem_transfer (stockTransferId),
  INDEX idx_stocktransferitem_item (inventoryItemId),
  INDEX idx_stocktransferitem_deleted (deletedAt)
);

-- 6. إضافة بيانات تجريبية
-- =====================================================

-- إضافة PartsUsed تجريبية (باستخدام purchasePrice من InventoryItem)
INSERT INTO PartsUsed (repairRequestId, inventoryItemId, quantity, unitPrice, totalPrice, warehouseId, usedBy, notes) 
SELECT 
  1 as repairRequestId, 
  id as inventoryItemId, 
  1 as quantity, 
  COALESCE(purchasePrice, 0) as unitPrice,
  COALESCE(purchasePrice, 0) as totalPrice,
  1 as warehouseId,
  1 as usedBy,
  CONCAT('استهلاك قطعة: ', name) as notes
FROM InventoryItem 
WHERE id IN (1, 2, 3, 4, 5) 
LIMIT 5;

-- إنشاء StockCount تجريبي
INSERT INTO StockCount (warehouseId, countDate, status, totalItems, countedItems, discrepancies, referenceNumber, createdBy) VALUES
(1, '2025-10-03', 'completed', 10, 10, 2, 'SC-2025-001', 1),
(2, '2025-10-02', 'in_progress', 5, 3, 0, 'SC-2025-002', 1);

-- إضافة StockCountItems تجريبية
INSERT INTO StockCountItem (stockCountId, inventoryItemId, systemQuantity, countedQuantity, variance, varianceValue) VALUES
(1, 1, 50, 48, -2, -300.00),
(1, 2, 30, 30, 0, 0.00),
(1, 3, 25, 26, 1, 200.00),
(2, 4, 15, 15, 0, 0.00),
(2, 5, 20, 18, -2, -60.00);

-- إنشاء StockTransfer تجريبي
INSERT INTO StockTransfer (fromWarehouseId, toWarehouseId, transferDate, status, totalItems, totalQuantity, totalValue, referenceNumber, reason, createdBy) VALUES
(1, 2, '2025-10-03', 'completed', 3, 50, 1500.00, 'ST-2025-001', 'نقل مخزون للفرع الجديد', 1),
(2, 1, '2025-10-02', 'approved', 2, 30, 900.00, 'ST-2025-002', 'إرجاع فائض مخزون', 1);

-- إضافة StockTransferItems تجريبية (باستخدام purchasePrice من InventoryItem)
INSERT INTO StockTransferItem (stockTransferId, inventoryItemId, quantity, unitPrice, totalPrice) 
SELECT 
  1 as stockTransferId,
  id as inventoryItemId,
  FLOOR(RAND() * 20) + 10 as quantity,
  COALESCE(purchasePrice, 0) as unitPrice,
  (FLOOR(RAND() * 20) + 10) * COALESCE(purchasePrice, 0) as totalPrice
FROM InventoryItem 
WHERE id IN (1, 2, 3) 
LIMIT 3;

INSERT INTO StockTransferItem (stockTransferId, inventoryItemId, quantity, unitPrice, totalPrice) 
SELECT 
  2 as stockTransferId,
  id as inventoryItemId,
  FLOOR(RAND() * 15) + 5 as quantity,
  COALESCE(purchasePrice, 0) as unitPrice,
  (FLOOR(RAND() * 15) + 5) * COALESCE(purchasePrice, 0) as totalPrice
FROM InventoryItem 
WHERE id IN (4, 5) 
LIMIT 2;

-- =====================================================
-- انتهاء Migration Phase 2
-- =====================================================

SELECT 'Phase 2 Simple Migration completed successfully!' as message;
SELECT COUNT(*) as partsUsedCount FROM PartsUsed;
SELECT COUNT(*) as stockCountCount FROM StockCount;
SELECT COUNT(*) as stockTransferCount FROM StockTransfer;
