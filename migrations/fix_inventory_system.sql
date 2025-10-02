-- إصلاح وتحسين نظام المخازن والمخزون
-- Fix Zone ERP - Inventory System Enhancement
-- Date: 2025-10-02

USE FZ;

-- ════════════════════════════════════════════════════════════════
-- المرحلة 1: إضافة Soft Delete للجداول
-- ════════════════════════════════════════════════════════════════

-- إضافة soft delete لجدول Warehouse
ALTER TABLE Warehouse 
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- إضافة soft delete لجدول InventoryItem
ALTER TABLE InventoryItem 
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL;

-- ════════════════════════════════════════════════════════════════
-- المرحلة 2: حذف البيانات التجريبية
-- ════════════════════════════════════════════════════════════════

-- حذف القطع التجريبية
DELETE FROM StockLevel WHERE inventoryItemId IN (
  SELECT id FROM InventoryItem WHERE sku LIKE 'TEST-%'
);

DELETE FROM InventoryItem WHERE sku LIKE 'TEST-%';

-- ════════════════════════════════════════════════════════════════
-- المرحلة 3: تحسين الأداء بإضافة Indexes
-- ════════════════════════════════════════════════════════════════

-- Indexes لجدول StockLevel
CREATE INDEX IF NOT EXISTS idx_stocklevel_warehouse ON StockLevel(warehouseId);
CREATE INDEX IF NOT EXISTS idx_stocklevel_item ON StockLevel(inventoryItemId);

-- Indexes لجدول StockMovement
CREATE INDEX IF NOT EXISTS idx_stockmovement_warehouse ON StockMovement(warehouseId);
CREATE INDEX IF NOT EXISTS idx_stockmovement_item ON StockMovement(inventoryItemId);
CREATE INDEX IF NOT EXISTS idx_stockmovement_type ON StockMovement(movementType);
CREATE INDEX IF NOT EXISTS idx_stockmovement_reference ON StockMovement(referenceType, referenceId);
CREATE INDEX IF NOT EXISTS idx_stockmovement_date ON StockMovement(createdAt);

-- Indexes لجدول InventoryItem
CREATE INDEX IF NOT EXISTS idx_inventoryitem_category ON InventoryItem(category);
CREATE INDEX IF NOT EXISTS idx_inventoryitem_active ON InventoryItem(isActive);

-- ════════════════════════════════════════════════════════════════
-- المرحلة 4: إضافة Views للاستعلامات الشائعة
-- ════════════════════════════════════════════════════════════════

-- View: مستويات المخزون الحالية مع تفاصيل
CREATE OR REPLACE VIEW v_current_stock AS
SELECT 
  sl.id,
  ii.id as itemId,
  ii.name as itemName,
  ii.sku,
  ii.category,
  w.id as warehouseId,
  w.name as warehouseName,
  w.location as warehouseLocation,
  sl.currentQuantity,
  sl.reservedQuantity,
  sl.availableQuantity,
  ii.minStockLevel,
  ii.maxStockLevel,
  ii.purchasePrice,
  ii.sellingPrice,
  ii.unit,
  CASE 
    WHEN sl.availableQuantity <= ii.minStockLevel THEN 'low'
    WHEN sl.availableQuantity > ii.maxStockLevel THEN 'high'
    ELSE 'normal'
  END as stockStatus,
  sl.lastUpdated
FROM StockLevel sl
JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
JOIN Warehouse w ON sl.warehouseId = w.id
WHERE ii.deletedAt IS NULL;

-- View: تنبيهات المخزون المنخفض
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT 
  ii.id as itemId,
  ii.name as itemName,
  ii.sku,
  ii.category,
  w.id as warehouseId,
  w.name as warehouseName,
  sl.availableQuantity,
  ii.minStockLevel,
  (ii.minStockLevel - sl.availableQuantity) as shortage,
  ii.purchasePrice,
  (ii.purchasePrice * (ii.minStockLevel - sl.availableQuantity)) as estimatedCostToRestock
FROM StockLevel sl
JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
JOIN Warehouse w ON sl.warehouseId = w.id
WHERE sl.availableQuantity <= ii.minStockLevel
  AND ii.isActive = 1
  AND w.isActive = 1
  AND ii.deletedAt IS NULL
ORDER BY shortage DESC;

-- View: قيمة المخزون حسب المخزن
CREATE OR REPLACE VIEW v_warehouse_inventory_value AS
SELECT 
  w.id as warehouseId,
  w.name as warehouseName,
  COUNT(DISTINCT sl.inventoryItemId) as totalItems,
  SUM(sl.currentQuantity) as totalQuantity,
  SUM(sl.currentQuantity * ii.purchasePrice) as totalPurchaseValue,
  SUM(sl.currentQuantity * ii.sellingPrice) as totalSellingValue,
  SUM(sl.currentQuantity * ii.sellingPrice) - SUM(sl.currentQuantity * ii.purchasePrice) as potentialProfit
FROM Warehouse w
LEFT JOIN StockLevel sl ON w.id = sl.warehouseId
LEFT JOIN InventoryItem ii ON sl.inventoryItemId = ii.id AND ii.deletedAt IS NULL
WHERE w.isActive = 1
GROUP BY w.id, w.name;

-- ════════════════════════════════════════════════════════════════
-- المرحلة 5: التحقق من النتائج
-- ════════════════════════════════════════════════════════════════

-- عرض ملخص المخازن
SELECT '═══ ملخص المخازن ═══' as '';
SELECT 
  id,
  name,
  location,
  branchId,
  isActive,
  createdAt,
  deletedAt
FROM Warehouse;

-- عرض ملخص الأصناف (بعد حذف التجريبية)
SELECT '═══ ملخص الأصناف ═══' as '';
SELECT 
  id,
  name,
  sku,
  category,
  purchasePrice,
  sellingPrice,
  minStockLevel,
  isActive
FROM InventoryItem
WHERE deletedAt IS NULL;

-- عرض مستويات المخزون
SELECT '═══ مستويات المخزون ═══' as '';
SELECT * FROM v_current_stock;

-- عرض تنبيهات المخزون المنخفض
SELECT '═══ تنبيهات المخزون المنخفض ═══' as '';
SELECT * FROM v_low_stock_alerts;

-- عرض قيمة المخزون حسب المخزن
SELECT '═══ قيمة المخزون حسب المخزن ═══' as '';
SELECT * FROM v_warehouse_inventory_value;

SELECT 'تم تطبيق جميع الإصلاحات بنجاح! ✅' as status;

