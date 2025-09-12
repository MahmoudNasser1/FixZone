-- اختبار بيانات المخزون
USE FZ;

-- إضافة عناصر مخزون تجريبية
INSERT IGNORE INTO InventoryItem (id, sku, name, type, purchasePrice, sellingPrice) VALUES
(1, 'PART-001', 'شاشة LCD للهاتف', 'شاشة', 150.00, 250.00),
(2, 'PART-002', 'بطارية ليثيوم', 'بطارية', 80.00, 120.00),
(3, 'PART-003', 'كاميرا خلفية', 'كاميرا', 200.00, 300.00);

-- إضافة مستويات مخزون
INSERT IGNORE INTO StockLevel (id, inventoryItemId, warehouseId, quantity, minLevel, isLowStock) VALUES
(1, 1, 1, 15, 5, FALSE),
(2, 1, 2, 6, 5, FALSE),
(3, 2, 1, 25, 10, FALSE),
(4, 2, 2, 8, 10, TRUE),
(5, 3, 1, 10, 3, FALSE);

-- التحقق من البيانات
SELECT 'InventoryItems:' as table_name;
SELECT * FROM InventoryItem;

SELECT 'StockLevels:' as table_name;
SELECT sl.*, ii.name as itemName, w.name as warehouseName
FROM StockLevel sl
LEFT JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
LEFT JOIN Warehouse w ON sl.warehouseId = w.id;
