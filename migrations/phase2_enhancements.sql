-- =====================================================
-- Phase 2.5 - Database Enhancements
-- تاريخ الإنشاء: 3 أكتوبر 2025
-- الغرض: إضافة الميزات المتقدمة لـ Phase 2
-- =====================================================

-- 1. تحسين جدول StockCount (إضافة الأعمدة الناقصة)
-- =====================================================
ALTER TABLE StockCount 
ADD COLUMN IF NOT EXISTS completedBy INT NULL AFTER countedBy,
ADD COLUMN IF NOT EXISTS approvedBy INT NULL AFTER completedBy,
ADD COLUMN IF NOT EXISTS completedAt TIMESTAMP NULL AFTER updatedAt,
ADD COLUMN IF NOT EXISTS approvedAt TIMESTAMP NULL AFTER completedAt,
ADD INDEX IF NOT EXISTS idx_stockcount_completed (completedBy),
ADD INDEX IF NOT EXISTS idx_stockcount_approved (approvedBy);

-- 2. تحسين جدول StockTransfer (إضافة الأعمدة الناقصة)
-- =====================================================
ALTER TABLE StockTransfer 
ADD COLUMN IF NOT EXISTS totalQuantity INT DEFAULT 0 AFTER totalItems,
ADD COLUMN IF NOT EXISTS totalValue DECIMAL(10,2) DEFAULT 0.00 AFTER totalQuantity,
ADD COLUMN IF NOT EXISTS approvedBy INT NULL AFTER countedBy,
ADD COLUMN IF NOT EXISTS shippedBy INT NULL AFTER approvedBy,
ADD COLUMN IF NOT EXISTS receivedBy INT NULL AFTER shippedBy,
ADD COLUMN IF NOT EXISTS shippedAt TIMESTAMP NULL AFTER receivedAt,
ADD INDEX IF NOT EXISTS idx_stocktransfer_approved (approvedBy),
ADD INDEX IF NOT EXISTS idx_stocktransfer_shipped (shippedBy),
ADD INDEX IF NOT EXISTS idx_stocktransfer_received (receivedBy);

-- 3. تحسين جدول PartsUsed (إضافة الأعمدة الناقصة)
-- =====================================================
ALTER TABLE PartsUsed 
ADD COLUMN IF NOT EXISTS unitPrice DECIMAL(10,2) DEFAULT 0.00 AFTER quantity,
ADD COLUMN IF NOT EXISTS totalPrice DECIMAL(10,2) DEFAULT 0.00 AFTER unitPrice,
ADD COLUMN IF NOT EXISTS warehouseId INT NULL AFTER totalPrice,
ADD COLUMN IF NOT EXISTS usedBy INT NULL AFTER warehouseId,
ADD COLUMN IF NOT EXISTS usedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER usedBy,
ADD COLUMN IF NOT EXISTS notes TEXT AFTER usedAt,
ADD COLUMN IF NOT EXISTS isInvoiced BOOLEAN DEFAULT FALSE AFTER notes,
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL AFTER updatedAt,
ADD INDEX IF NOT EXISTS idx_partsused_warehouse (warehouseId),
ADD INDEX IF NOT EXISTS idx_partsused_user (usedBy),
ADD INDEX IF NOT EXISTS idx_partsused_date (usedAt),
ADD INDEX IF NOT EXISTS idx_partsused_deleted (deletedAt);

-- تحديث البيانات الموجودة
UPDATE PartsUsed 
SET usedAt = createdAt 
WHERE usedAt IS NULL;

-- 4. إنشاء Views للتقارير
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
  pu.isInvoiced,
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
  sc.discrepancies,
  sc.referenceNumber,
  sc.countedBy,
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
  st.countedBy,
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

-- View: Inventory Summary (موحد)
CREATE OR REPLACE VIEW v_inventory_summary_enhanced AS
SELECT 
  ii.id,
  ii.name,
  ii.sku,
  ii.purchasePrice,
  ii.sellingPrice,
  ic.name as categoryName,
  COALESCE(SUM(sl.currentQuantity), 0) as totalQuantity,
  COALESCE(SUM(sl.availableQuantity), 0) as availableQuantity,
  COUNT(DISTINCT sl.warehouseId) as warehouseCount,
  ii.reorderPoint,
  CASE 
    WHEN COALESCE(SUM(sl.currentQuantity), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(sl.currentQuantity), 0) <= ii.reorderPoint THEN 'low_stock'
    ELSE 'in_stock'
  END as stockStatus,
  ii.isActive,
  ii.createdAt,
  ii.updatedAt
FROM InventoryItem ii
LEFT JOIN InventoryItemCategory ic ON ii.categoryId = ic.id
LEFT JOIN StockLevel sl ON ii.id = sl.inventoryItemId
WHERE ii.deletedAt IS NULL
GROUP BY ii.id, ii.name, ii.sku, ii.purchasePrice, ii.sellingPrice, 
         ic.name, ii.reorderPoint, ii.isActive, ii.createdAt, ii.updatedAt;

-- 5. إنشاء Stored Procedures
-- =====================================================

-- Procedure: حساب استهلاك القطع
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GetPartsConsumption(
  IN p_itemId INT,
  IN p_startDate DATE,
  IN p_endDate DATE
)
BEGIN
  SELECT 
    ii.id,
    ii.name as itemName,
    ii.sku,
    COUNT(pu.id) as usageCount,
    SUM(pu.quantity) as totalConsumed,
    SUM(pu.totalPrice) as totalValue,
    AVG(pu.unitPrice) as avgPrice,
    MIN(pu.usedAt) as firstUsed,
    MAX(pu.usedAt) as lastUsed
  FROM InventoryItem ii
  LEFT JOIN PartsUsed pu ON ii.id = pu.inventoryItemId 
    AND pu.deletedAt IS NULL
    AND pu.usedAt BETWEEN p_startDate AND p_endDate
  WHERE ii.id = p_itemId
  GROUP BY ii.id, ii.name, ii.sku;
END//
DELIMITER ;

-- Procedure: تقرير جرد المخزون
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GetStockCountReport(IN p_countId INT)
BEGIN
  SELECT 
    sc.referenceNumber,
    w.name as warehouseName,
    sc.countDate,
    sc.status,
    sc.totalItems,
    sc.discrepancies,
    COUNT(CASE WHEN sci.variance < 0 THEN 1 END) as itemsShort,
    COUNT(CASE WHEN sci.variance > 0 THEN 1 END) as itemsExcess,
    COUNT(CASE WHEN sci.variance = 0 THEN 1 END) as itemsAccurate,
    SUM(CASE WHEN sci.variance < 0 THEN sci.varianceValue END) as totalShortValue,
    SUM(CASE WHEN sci.variance > 0 THEN sci.varianceValue END) as totalExcessValue,
    sc.createdAt
  FROM StockCount sc
  LEFT JOIN Warehouse w ON sc.warehouseId = w.id
  LEFT JOIN StockCountItem sci ON sc.id = sci.stockCountId
  WHERE sc.id = p_countId
  GROUP BY sc.id, sc.referenceNumber, w.name, sc.countDate, sc.status, 
           sc.totalItems, sc.discrepancies, sc.createdAt;
END//
DELIMITER ;

-- Procedure: تقرير النقل بين المخازن
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GetStockTransferReport(
  IN p_startDate DATE,
  IN p_endDate DATE
)
BEGIN
  SELECT 
    st.referenceNumber,
    w1.name as fromWarehouse,
    w2.name as toWarehouse,
    st.transferDate,
    st.status,
    st.totalItems,
    st.totalQuantity,
    st.totalValue,
    st.createdAt,
    st.shippedAt,
    st.receivedAt,
    CASE 
      WHEN st.receivedAt IS NOT NULL AND st.shippedAt IS NOT NULL 
      THEN TIMESTAMPDIFF(DAY, st.shippedAt, st.receivedAt)
      ELSE NULL
    END as daysInTransit
  FROM StockTransfer st
  LEFT JOIN Warehouse w1 ON st.fromWarehouseId = w1.id
  LEFT JOIN Warehouse w2 ON st.toWarehouseId = w2.id
  WHERE st.deletedAt IS NULL
    AND st.transferDate BETWEEN p_startDate AND p_endDate
  ORDER BY st.transferDate DESC;
END//
DELIMITER ;

-- 6. إنشاء Triggers للتحديث التلقائي
-- =====================================================

-- Trigger: تحديث إحصائيات StockCount عند إضافة/تحديث عناصر
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_update_stockcount_stats
AFTER INSERT ON StockCountItem
FOR EACH ROW
BEGIN
  UPDATE StockCount 
  SET 
    totalItems = (
      SELECT COUNT(*) 
      FROM StockCountItem 
      WHERE stockCountId = NEW.stockCountId AND deletedAt IS NULL
    ),
    discrepancies = (
      SELECT COUNT(*) 
      FROM StockCountItem 
      WHERE stockCountId = NEW.stockCountId AND variance != 0 AND deletedAt IS NULL
    ),
    updatedAt = CURRENT_TIMESTAMP
  WHERE id = NEW.stockCountId;
END//
DELIMITER ;

-- Trigger: تحديث إحصائيات StockTransfer عند إضافة عناصر
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_update_stocktransfer_stats
AFTER INSERT ON StockTransferItem
FOR EACH ROW
BEGIN
  UPDATE StockTransfer 
  SET 
    totalItems = (
      SELECT COUNT(*) 
      FROM StockTransferItem 
      WHERE stockTransferId = NEW.stockTransferId AND deletedAt IS NULL
    ),
    totalQuantity = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM StockTransferItem 
      WHERE stockTransferId = NEW.stockTransferId AND deletedAt IS NULL
    ),
    totalValue = (
      SELECT COALESCE(SUM(totalPrice), 0)
      FROM StockTransferItem 
      WHERE stockTransferId = NEW.stockTransferId AND deletedAt IS NULL
    ),
    updatedAt = CURRENT_TIMESTAMP
  WHERE id = NEW.stockTransferId;
END//
DELIMITER ;

-- Trigger: تحديث PartsUsed prices تلقائياً من InventoryItem
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_partsused_prices
BEFORE INSERT ON PartsUsed
FOR EACH ROW
BEGIN
  IF NEW.unitPrice IS NULL OR NEW.unitPrice = 0 THEN
    SELECT COALESCE(purchasePrice, 0) INTO NEW.unitPrice
    FROM InventoryItem 
    WHERE id = NEW.inventoryItemId;
  END IF;
  
  SET NEW.totalPrice = NEW.quantity * NEW.unitPrice;
END//
DELIMITER ;

-- 7. إضافة Indexes إضافية للأداء
-- =====================================================

-- Indexes للبحث والفلترة
CREATE INDEX IF NOT EXISTS idx_partsused_repair_date ON PartsUsed(repairRequestId, usedAt);
CREATE INDEX IF NOT EXISTS idx_partsused_item_date ON PartsUsed(inventoryItemId, usedAt);
CREATE INDEX IF NOT EXISTS idx_stockcount_warehouse_date ON StockCount(warehouseId, countDate);
CREATE INDEX IF NOT EXISTS idx_stockcount_status_date ON StockCount(status, countDate);
CREATE INDEX IF NOT EXISTS idx_stocktransfer_warehouses ON StockTransfer(fromWarehouseId, toWarehouseId);
CREATE INDEX IF NOT EXISTS idx_stocktransfer_status_date ON StockTransfer(status, transferDate);

-- Composite Indexes للـ Joins
CREATE INDEX IF NOT EXISTS idx_stockcountitem_composite ON StockCountItem(stockCountId, inventoryItemId, deletedAt);
CREATE INDEX IF NOT EXISTS idx_stocktransferitem_composite ON StockTransferItem(stockTransferId, inventoryItemId, deletedAt);

-- 8. إضافة Constraints للتأكد من صحة البيانات
-- =====================================================

-- التأكد من أن الكمية موجبة في PartsUsed
ALTER TABLE PartsUsed ADD CONSTRAINT IF NOT EXISTS chk_partsused_quantity CHECK (quantity > 0);

-- التأكد من أن الأسعار موجبة في PartsUsed
ALTER TABLE PartsUsed ADD CONSTRAINT IF NOT EXISTS chk_partsused_prices CHECK (unitPrice >= 0 AND totalPrice >= 0);

-- التأكد من أن المخزن المرسل مختلف عن المستقبل في StockTransfer
ALTER TABLE StockTransfer ADD CONSTRAINT IF NOT EXISTS chk_transfer_warehouses CHECK (fromWarehouseId != toWarehouseId);

-- 9. إنشاء Event للصيانة التلقائية
-- =====================================================

-- تفعيل Event Scheduler
SET GLOBAL event_scheduler = ON;

-- Event: تنظيف البيانات المحذوفة القديمة (شهرياً)
CREATE EVENT IF NOT EXISTS cleanup_old_deleted_data
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  -- حذف البيانات المحذوفة لأكثر من 6 أشهر
  DELETE FROM PartsUsed WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
  DELETE FROM StockCountItem WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
  DELETE FROM StockCount WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
  DELETE FROM StockTransferItem WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
  DELETE FROM StockTransfer WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
  DELETE FROM StockMovement WHERE deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END;

-- 10. إنشاء Function مساعدة
-- =====================================================

-- Function: حساب قيمة المخزون
DELIMITER //
CREATE FUNCTION IF NOT EXISTS CalculateInventoryValue(p_itemId INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
  DECLARE totalValue DECIMAL(10,2);
  
  SELECT COALESCE(SUM(sl.currentQuantity * ii.purchasePrice), 0)
  INTO totalValue
  FROM StockLevel sl
  JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
  WHERE sl.inventoryItemId = p_itemId
    AND ii.deletedAt IS NULL;
  
  RETURN totalValue;
END//
DELIMITER ;

-- =====================================================
-- انتهاء Enhancement Migration
-- =====================================================

SELECT 'Phase 2.5 Enhancements completed successfully!' as message;
SELECT COUNT(*) as viewsCount FROM information_schema.views 
WHERE table_schema = DATABASE() AND table_name LIKE 'v_%';
SELECT COUNT(*) as proceduresCount FROM information_schema.routines 
WHERE routine_schema = DATABASE() AND routine_type = 'PROCEDURE';
SELECT COUNT(*) as triggersCount FROM information_schema.triggers 
WHERE trigger_schema = DATABASE();
