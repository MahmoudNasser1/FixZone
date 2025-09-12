-- تحديث قاعدة البيانات لتطابق الملف الجديد
USE FZ;

-- إضافة الحقول المفقودة لجدول Warehouse
ALTER TABLE Warehouse 
ADD COLUMN IF NOT EXISTS location VARCHAR(255) COMMENT 'الموقع الجغرافي',
ADD COLUMN IF NOT EXISTS address TEXT COMMENT 'العنوان التفصيلي',
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) COMMENT 'رقم الهاتف',
ADD COLUMN IF NOT EXISTS email VARCHAR(100) COMMENT 'البريد الإلكتروني',
ADD COLUMN IF NOT EXISTS manager VARCHAR(100) COMMENT 'مدير المخزن',
ADD COLUMN IF NOT EXISTS capacity VARCHAR(100) COMMENT 'سعة المخزن',
ADD COLUMN IF NOT EXISTS description TEXT COMMENT 'وصف المخزن',
ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE COMMENT 'حالة المخزن (نشط/معطل)';

-- إضافة الحقول المفقودة لجدول StockLevel
ALTER TABLE StockLevel 
ADD COLUMN IF NOT EXISTS maxLevel INT DEFAULT NULL COMMENT 'الحد الأقصى للمخزون';

-- تحديث جدول StockMovement
ALTER TABLE StockMovement 
ADD COLUMN IF NOT EXISTS notes TEXT COMMENT 'ملاحظات';

-- تحديث ENUM في StockMovement لإضافة ADJUSTMENT
ALTER TABLE StockMovement 
MODIFY COLUMN type ENUM('IN','OUT','TRANSFER','ADJUSTMENT') NOT NULL COMMENT 'نوع الحركة';

-- إضافة بيانات تجريبية للمخازن مع الحقول الجديدة
UPDATE Warehouse SET 
    location = 'القاهرة',
    address = 'شارع التحرير، القاهرة',
    phone = '+20123456789',
    email = 'main@fixzone.com',
    manager = 'مدير النظام',
    capacity = '10000 قطعة',
    description = 'المخزن الرئيسي للشركة',
    isActive = TRUE
WHERE id = 1;

UPDATE Warehouse SET 
    location = 'الجيزة',
    address = 'شارع الهرم، الجيزة',
    phone = '+20123456790',
    email = 'giza@fixzone.com',
    manager = 'مدير النظام',
    capacity = '5000 قطعة',
    description = 'مخزن فرع الجيزة',
    isActive = TRUE
WHERE id = 2;

-- إضافة maxLevel للـ StockLevels الموجودة
UPDATE StockLevel SET maxLevel = 100 WHERE id = 1;
UPDATE StockLevel SET maxLevel = 50 WHERE id = 2;
UPDATE StockLevel SET maxLevel = 200 WHERE id = 3;
UPDATE StockLevel SET maxLevel = 100 WHERE id = 4;

-- التحقق من التحديثات
SELECT 'Warehouse updated:' as status;
SELECT id, name, location, address, phone, email, manager, capacity, description, isActive FROM Warehouse;

SELECT 'StockLevel updated:' as status;
SELECT id, inventoryItemId, warehouseId, quantity, minLevel, maxLevel, isLowStock FROM StockLevel;

SELECT 'StockMovement updated:' as status;
SELECT id, type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes, userId FROM StockMovement LIMIT 5;
