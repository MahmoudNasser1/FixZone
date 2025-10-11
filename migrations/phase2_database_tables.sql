-- =====================================================
-- Phase 2 Database Migration - Core Enhancements
-- تاريخ الإنشاء: 3 أكتوبر 2025
-- الغرض: إنشاء جداول Phase 2 الجديدة
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
  isInvoiced BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id) ON DELETE CASCADE,
  FOREIGN KEY (usedBy) REFERENCES User(id) ON DELETE CASCADE,
  
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
  
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (completedBy) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
  
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
  
  FOREIGN KEY (stockCountId) REFERENCES StockCount(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id) ON DELETE CASCADE,
  
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
  
  FOREIGN KEY (fromWarehouseId) REFERENCES Warehouse(id) ON DELETE CASCADE,
  FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (shippedBy) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (receivedBy) REFERENCES User(id) ON DELETE SET NULL,
  
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
  
  FOREIGN KEY (stockTransferId) REFERENCES StockTransfer(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_transfer_item (stockTransferId, inventoryItemId),
  INDEX idx_stocktransferitem_transfer (stockTransferId),
  INDEX idx_stocktransferitem_item (inventoryItemId),
  INDEX idx_stocktransferitem_deleted (deletedAt)
);

-- 6. تحديث جدول BarcodeScan (موجود من Phase 1)
-- =====================================================
ALTER TABLE BarcodeScan 
ADD COLUMN IF NOT EXISTS action ENUM('scan', 'issue', 'receive', 'count', 'transfer') DEFAULT 'scan',
ADD COLUMN IF NOT EXISTS repairRequestId INT NULL,
ADD COLUMN IF NOT EXISTS stockCountId INT NULL,
ADD COLUMN IF NOT EXISTS stockTransferId INT NULL,
ADD COLUMN IF NOT EXISTS result JSON NULL;

-- إضافة Indexes (بدون Foreign Keys لتجنب التعارض)
ALTER TABLE BarcodeScan 
ADD INDEX IF NOT EXISTS idx_barcodescan_action (action),
ADD INDEX IF NOT EXISTS idx_barcodescan_repair (repairRequestId),
ADD INDEX IF NOT EXISTS idx_barcodescan_count (stockCountId),
ADD INDEX IF NOT EXISTS idx_barcodescan_transfer (stockTransferId);

-- 7. إنشاء Views جديدة
-- =====================================================

-- View: PartsUsed Summary
CREATE OR REPLACE VIEW v_parts_used_summary AS
SELECT 
  pu.id,
  pu.repairRequestId,
  pu.inventoryItemId,
  ii.name as itemName,
  ii.sku,
  pu.quantity,
  pu.unitPrice,
  pu.totalPrice,
  pu.warehouseId,
  w.name as warehouseName,
  pu.usedBy,
  pu.usedAt,
  pu.createdAt
FROM PartsUsed pu
LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
LEFT JOIN Warehouse w ON pu.warehouseId = w.id
WHERE pu.deletedAt IS NULL;

-- View: Stock Count Summary
CREATE OR REPLACE VIEW v_stock_count_summary AS
SELECT 
  sc.id,
  sc.warehouseId,
  w.name as warehouseName,
  sc.countDate,
  sc.status,
  sc.totalItems,
  sc.countedItems,
  sc.discrepancies,
  sc.totalVariance,
  sc.referenceNumber,
  sc.createdBy,
  sc.completedBy,
  sc.approvedBy,
  sc.createdAt,
  sc.completedAt,
  sc.approvedAt
FROM StockCount sc
LEFT JOIN Warehouse w ON sc.warehouseId = w.id
WHERE sc.deletedAt IS NULL;

-- View: Stock Transfer Summary
CREATE OR REPLACE VIEW v_stock_transfer_summary AS
SELECT 
  st.id,
  st.fromWarehouseId,
  w1.name as fromWarehouseName,
  st.toWarehouseId,
  w2.name as toWarehouseName,
  st.transferDate,
  st.status,
  st.totalItems,
  st.totalQuantity,
  st.totalValue,
  st.referenceNumber,
  st.reason,
  st.createdBy,
  st.approvedBy,
  st.shippedBy,
  st.receivedBy,
  st.createdAt,
  st.shippedAt,
  st.receivedAt
FROM StockTransfer st
LEFT JOIN Warehouse w1 ON st.fromWarehouseId = w1.id
LEFT JOIN Warehouse w2 ON st.toWarehouseId = w2.id
WHERE st.deletedAt IS NULL;

-- 8. إنشاء Triggers للربط التلقائي
-- =====================================================

-- Trigger: تحديث StockMovement عند إضافة PartsUsed
DELIMITER //
CREATE TRIGGER tr_partsused_stock_movement
AFTER INSERT ON PartsUsed
FOR EACH ROW
BEGIN
  INSERT INTO StockMovement (
    inventoryItemId,
    warehouseId,
    movementType,
    quantity,
    unitPrice,
    totalPrice,
    referenceType,
    referenceId,
    notes,
    createdBy,
    createdAt
  ) VALUES (
    NEW.inventoryItemId,
    NEW.warehouseId,
    'out',
    -NEW.quantity,
    NEW.unitPrice,
    NEW.totalPrice,
    'repair',
    NEW.repairRequestId,
    CONCAT('استهلاك قطعة في الصيانة #', NEW.repairRequestId),
    NEW.usedBy,
    NEW.createdAt
  );
END//
DELIMITER ;

-- Trigger: تحديث StockLevel عند إضافة PartsUsed
DELIMITER //
CREATE TRIGGER tr_partsused_stock_level
AFTER INSERT ON PartsUsed
FOR EACH ROW
BEGIN
  UPDATE StockLevel 
  SET 
    currentQuantity = currentQuantity - NEW.quantity,
    availableQuantity = availableQuantity - NEW.quantity,
    updatedAt = CURRENT_TIMESTAMP
  WHERE 
    inventoryItemId = NEW.inventoryItemId 
    AND warehouseId = NEW.warehouseId;
END//
DELIMITER ;

-- Trigger: تحديث StockLevel عند إضافة StockTransferItem
DELIMITER //
CREATE TRIGGER tr_transfer_stock_level
AFTER UPDATE ON StockTransfer
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- تحديث المخزون في المخزن المرسل
    UPDATE StockLevel sl
    JOIN StockTransferItem sti ON sl.inventoryItemId = sti.inventoryItemId
    SET 
      sl.currentQuantity = sl.currentQuantity - sti.quantity,
      sl.availableQuantity = sl.availableQuantity - sti.quantity,
      sl.updatedAt = CURRENT_TIMESTAMP
    WHERE 
      sti.stockTransferId = NEW.id 
      AND sl.warehouseId = NEW.fromWarehouseId;
    
    -- تحديث المخزون في المخزن المستقبل
    UPDATE StockLevel sl
    JOIN StockTransferItem sti ON sl.inventoryItemId = sti.inventoryItemId
    SET 
      sl.currentQuantity = sl.currentQuantity + sti.quantity,
      sl.availableQuantity = sl.availableQuantity + sti.quantity,
      sl.updatedAt = CURRENT_TIMESTAMP
    WHERE 
      sti.stockTransferId = NEW.id 
      AND sl.warehouseId = NEW.toWarehouseId;
  END IF;
END//
DELIMITER ;

-- 9. إضافة بيانات تجريبية
-- =====================================================

-- إضافة PartsUsed تجريبية
INSERT INTO PartsUsed (repairRequestId, inventoryItemId, quantity, unitPrice, totalPrice, warehouseId, usedBy, notes) VALUES
(1, 1, 1, 150.00, 150.00, 1, 1, 'استبدال شاشة iPhone'),
(1, 2, 1, 80.00, 80.00, 1, 1, 'استبدال بطارية iPhone'),
(2, 3, 1, 200.00, 200.00, 1, 1, 'استبدال شاشة Samsung'),
(3, 4, 1, 120.00, 120.00, 1, 1, 'استبدال لوحة مفاتيح لابتوب'),
(4, 5, 2, 30.00, 60.00, 1, 1, 'كابل USB-C');

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

-- إضافة StockTransferItems تجريبية
INSERT INTO StockTransferItem (stockTransferId, inventoryItemId, quantity, unitPrice, totalPrice) VALUES
(1, 1, 20, 150.00, 3000.00),
(1, 2, 15, 80.00, 1200.00),
(1, 3, 15, 200.00, 3000.00),
(2, 4, 20, 120.00, 2400.00),
(2, 5, 10, 30.00, 300.00);

-- 10. إنشاء Indexes إضافية للأداء
-- =====================================================

-- Indexes للبحث السريع
CREATE INDEX idx_partsused_repair_date ON PartsUsed(repairRequestId, usedAt);
CREATE INDEX idx_partsused_item_date ON PartsUsed(inventoryItemId, usedAt);
CREATE INDEX idx_stockcount_warehouse_date ON StockCount(warehouseId, countDate);
CREATE INDEX idx_stocktransfer_warehouses ON StockTransfer(fromWarehouseId, toWarehouseId);
CREATE INDEX idx_stocktransfer_status_date ON StockTransfer(status, transferDate);

-- 11. إضافة Constraints للتأكد من صحة البيانات
-- =====================================================

-- التأكد من أن الكمية موجبة
ALTER TABLE PartsUsed ADD CONSTRAINT chk_partsused_quantity CHECK (quantity > 0);
ALTER TABLE StockTransferItem ADD CONSTRAINT chk_transfer_quantity CHECK (quantity > 0);

-- التأكد من أن الأسعار موجبة
ALTER TABLE PartsUsed ADD CONSTRAINT chk_partsused_prices CHECK (unitPrice >= 0 AND totalPrice >= 0);
ALTER TABLE StockTransferItem ADD CONSTRAINT chk_transfer_prices CHECK (unitPrice >= 0 AND totalPrice >= 0);

-- التأكد من أن المخزن المرسل مختلف عن المستقبل
ALTER TABLE StockTransfer ADD CONSTRAINT chk_transfer_warehouses CHECK (fromWarehouseId != toWarehouseId);

-- 12. إنشاء Stored Procedures مفيدة
-- =====================================================

-- Procedure: حساب إجمالي استهلاك قطعة
DELIMITER //
CREATE PROCEDURE GetItemConsumption(IN itemId INT, IN startDate DATE, IN endDate DATE)
BEGIN
  SELECT 
    ii.name as itemName,
    ii.sku,
    SUM(pu.quantity) as totalConsumed,
    SUM(pu.totalPrice) as totalValue,
    COUNT(pu.id) as usageCount
  FROM PartsUsed pu
  JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
  WHERE 
    pu.inventoryItemId = itemId
    AND pu.usedAt BETWEEN startDate AND endDate
    AND pu.deletedAt IS NULL
  GROUP BY pu.inventoryItemId, ii.name, ii.sku;
END//
DELIMITER ;

-- Procedure: إنشاء تقرير جرد
DELIMITER //
CREATE PROCEDURE GenerateStockCountReport(IN countId INT)
BEGIN
  SELECT 
    sc.referenceNumber,
    w.name as warehouseName,
    sc.countDate,
    sc.status,
    sc.totalItems,
    sc.countedItems,
    sc.discrepancies,
    sc.totalVariance,
    COUNT(sci.id) as itemsWithVariance
  FROM StockCount sc
  JOIN Warehouse w ON sc.warehouseId = w.id
  LEFT JOIN StockCountItem sci ON sc.id = sci.stockCountId AND sci.variance != 0
  WHERE sc.id = countId
  GROUP BY sc.id, sc.referenceNumber, w.name, sc.countDate, sc.status, 
           sc.totalItems, sc.countedItems, sc.discrepancies, sc.totalVariance;
END//
DELIMITER ;

-- 13. إنشاء Events للصيانة التلقائية
-- =====================================================

-- Event: تنظيف البيانات المحذوفة (شهرياً)
CREATE EVENT IF NOT EXISTS cleanup_deleted_data
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  -- حذف البيانات المحذوفة لأكثر من 6 أشهر
  DELETE FROM PartsUsed WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
  DELETE FROM StockCount WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
  DELETE FROM StockTransfer WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END;

-- تفعيل Event Scheduler
SET GLOBAL event_scheduler = ON;

-- =====================================================
-- انتهاء Migration Phase 2
-- =====================================================

SELECT 'Phase 2 Database Migration completed successfully!' as message;
SELECT COUNT(*) as partsUsedCount FROM PartsUsed;
SELECT COUNT(*) as stockCountCount FROM StockCount;
SELECT COUNT(*) as stockTransferCount FROM StockTransfer;
SELECT COUNT(*) as viewsCount FROM information_schema.views WHERE table_schema = DATABASE() AND table_name LIKE 'v_%';
