-- =====================================================
-- إضافة بيانات test لنظام المخزون
-- =====================================================

-- 1. إضافة مخازن
INSERT INTO Warehouse (id, name, location, isActive) VALUES
(1, 'المستودع الرئيسي', 'القاهرة - المقر الرئيسي', 1),
(2, 'مستودع الجيزة', 'الجيزة - فرع الهرم', 1),
(3, 'مستودع الإسكندرية', 'الإسكندرية - فرع الكورنيش', 1),
(4, 'مركز البستان', 'مول البستان', 1);

-- 2. إضافة أصناف مخزون
INSERT INTO InventoryItem (id, sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields) VALUES
(1, 'BAT-IPH12-001', 'بطارية iPhone 12', 'batteries', 200.00, 350.00, NULL, NULL),
(2, 'BAT-IPH13-001', 'بطارية iPhone 13', 'batteries', 220.00, 380.00, NULL, NULL),
(3, 'BAT-SAM-S21', 'بطارية Samsung S21', 'batteries', 180.00, 320.00, NULL, NULL),
(4, 'SCR-IPH12-001', 'شاشة iPhone 12', 'screens', 450.00, 750.00, NULL, NULL),
(5, 'SCR-IPH13-001', 'شاشة iPhone 13', 'screens', 500.00, 850.00, NULL, NULL),
(6, 'CASE-SIL-001', 'جراب سيليكون عادي', 'accessories', 15.00, 35.00, NULL, NULL),
(7, 'CHARGE-USB-C', 'شاحن USB-C سريع', 'accessories', 80.00, 150.00, NULL, NULL),
(8, 'CABLE-LIGHT-1M', 'كابل Lightning 1 متر', 'accessories', 25.00, 50.00, NULL, NULL),
(9, 'BAT-IPAD-AIR', 'بطارية iPad Air', 'batteries', 350.00, 600.00, NULL, NULL),
(10, 'SCR-SAM-S22', 'شاشة Samsung S22', 'screens', 550.00, 900.00, NULL, NULL);

-- 3. إضافة مستويات المخزون
INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, isLowStock) VALUES
-- المستودع الرئيسي
(1, 1, 50, 10, 0),
(2, 1, 30, 10, 0),
(3, 1, 25, 10, 0),
(4, 1, 15, 5, 0),
(5, 1, 20, 5, 0),
-- مستودع الجيزة
(1, 2, 20, 5, 0),
(2, 2, 15, 5, 0),
(6, 2, 100, 20, 0),
(7, 2, 40, 10, 0),
-- مستودع الإسكندرية
(1, 3, 15, 5, 0),
(8, 3, 50, 10, 0),
(9, 3, 10, 5, 0),
-- مركز البستان
(10, 4, 12, 5, 0);

-- 4. إضافة حركات مخزون
INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId) VALUES
('in', 50, 1, NULL, 1, 1),
('in', 30, 2, NULL, 1, 1),
('out', 10, 1, 1, NULL, 1),
('transfer', 5, 1, 1, 2, 1),
('in', 100, 6, NULL, 2, 1),
('out', 5, 6, 2, NULL, 1);

SELECT '✅ تم إضافة البيانات بنجاح!' as result;
SELECT 
  'InventoryItem' as 'الجدول', 
  COUNT(*) as 'عدد السجلات' 
FROM InventoryItem
UNION ALL
SELECT 'Warehouse', COUNT(*) FROM Warehouse
UNION ALL
SELECT 'StockLevel', COUNT(*) FROM StockLevel  
UNION ALL
SELECT 'StockMovement', COUNT(*) FROM StockMovement;


