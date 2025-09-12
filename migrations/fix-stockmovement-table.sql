-- إصلاح جدول StockMovement
USE fz;

-- 1. التحقق من هيكل الجدول الحالي
DESCRIBE StockMovement;

-- 2. إضافة عمود notes إذا لم يكن موجود
ALTER TABLE StockMovement 
ADD COLUMN IF NOT EXISTS notes TEXT COMMENT 'ملاحظات';

-- 3. إضافة عمود userId إذا لم يكن موجود
ALTER TABLE StockMovement 
ADD COLUMN IF NOT EXISTS userId INT COMMENT 'معرف المستخدم';

-- 4. إضافة Foreign Key لـ userId إذا لم يكن موجود
-- أولاً نتحقق من وجود العمود
SELECT COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'StockMovement' AND REFERENCED_TABLE_NAME = 'User';

-- 5. إضافة Foreign Key إذا لم يكن موجود
-- ALTER TABLE StockMovement ADD CONSTRAINT fk_stockmovement_user FOREIGN KEY (userId) REFERENCES User(id);

-- 6. إضافة بيانات تجريبية لحركة المخزون (بدون notes)
INSERT IGNORE INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId) VALUES
('TRANSFER', 3, 1, 1, 2, 1),
('IN', 10, 1, NULL, 1, 1),
('OUT', 2, 1, 1, NULL, 1);

-- 7. التحقق من البيانات
SELECT * FROM StockMovement;

-- رسالة نجاح
SELECT 'تم إصلاح جدول StockMovement بنجاح!' as message;
