-- إضافة حقول المخازن المفقودة (ملف مبسط)
USE fz;

-- 1. إضافة حقول جديدة لجدول Warehouse
ALTER TABLE Warehouse 
ADD COLUMN IF NOT EXISTS location VARCHAR(255) COMMENT 'الموقع الجغرافي',
ADD COLUMN IF NOT EXISTS address TEXT COMMENT 'العنوان التفصيلي',
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) COMMENT 'رقم الهاتف',
ADD COLUMN IF NOT EXISTS email VARCHAR(100) COMMENT 'البريد الإلكتروني',
ADD COLUMN IF NOT EXISTS manager VARCHAR(100) COMMENT 'مدير المخزن',
ADD COLUMN IF NOT EXISTS capacity VARCHAR(100) COMMENT 'سعة المخزن',
ADD COLUMN IF NOT EXISTS description TEXT COMMENT 'وصف المخزن',
ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE COMMENT 'حالة المخزن (نشط/معطل)';

-- 2. إضافة بيانات تجريبية للمخازن إذا لم تكن موجودة
INSERT IGNORE INTO Warehouse (name, location, address, phone, email, manager, capacity, description, isActive) VALUES
('المخزن الرئيسي - القاهرة', 'القاهرة', 'شارع التحرير، القاهرة', '+20123456789', 'main@fixzone.com', 'أحمد محمد', '10000 قطعة', 'المخزن الرئيسي للشركة', TRUE),
('مخزن فرع الجيزة', 'الجيزة', 'شارع الهرم، الجيزة', '+20123456790', 'giza@fixzone.com', 'محمد علي', '5000 قطعة', 'مخزن فرع الجيزة', TRUE),
('مخزن فرع الإسكندرية', 'الإسكندرية', 'شارع البحر، الإسكندرية', '+20123456791', 'alex@fixzone.com', 'علي أحمد', '3000 قطعة', 'مخزن فرع الإسكندرية', TRUE);

-- 3. إضافة بيانات تجريبية للمخزون إذا لم تكن موجودة
INSERT IGNORE INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, isLowStock) VALUES
(1, 1, 15, 5, FALSE),
(1, 2, 6, 5, FALSE),
(1, 3, 0, 5, TRUE),
(2, 1, 25, 10, FALSE),
(2, 2, 8, 10, TRUE),
(2, 3, 12, 10, FALSE);

-- 4. التحقق من البيانات
SELECT 'Warehouse' as table_name, COUNT(*) as count FROM Warehouse
UNION ALL
SELECT 'StockLevel', COUNT(*) FROM StockLevel
UNION ALL
SELECT 'StockMovement', COUNT(*) FROM StockMovement
UNION ALL
SELECT 'InventoryItem', COUNT(*) FROM InventoryItem;

-- رسالة نجاح
SELECT 'تم إضافة حقول المخازن بنجاح!' as message;
