-- إضافة حقول المخازن المفقودة
-- هذا الملف يضيف الحقول المطلوبة لإدارة المخازن

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
ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE COMMENT 'حالة المخزن (نشط/معطل)',
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث';

-- 2. إضافة حقول جديدة لجدول StockLevel
ALTER TABLE StockLevel 
ADD COLUMN IF NOT EXISTS isLowStock BOOLEAN DEFAULT FALSE COMMENT 'مخزون منخفض',
ADD COLUMN IF NOT EXISTS lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'آخر تحديث';

-- 3. إنشاء جدول StockMovement إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS StockMovement (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT') NOT NULL COMMENT 'نوع الحركة',
  quantity INT NOT NULL COMMENT 'الكمية',
  inventoryItemId INT NOT NULL COMMENT 'معرف قطعة المخزون',
  fromWarehouseId INT NULL COMMENT 'معرف المخزن المصدر (للنقل)',
  toWarehouseId INT NULL COMMENT 'معرف المخزن الهدف (للنقل)',
  notes TEXT COMMENT 'ملاحظات',
  userId INT NOT NULL COMMENT 'معرف المستخدم',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id) ON DELETE CASCADE,
  FOREIGN KEY (fromWarehouseId) REFERENCES Warehouse(id) ON DELETE SET NULL,
  FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
) COMMENT='حركة المخزون';

-- 4. إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_stockmovement_type ON StockMovement(type);
CREATE INDEX IF NOT EXISTS idx_stockmovement_item ON StockMovement(inventoryItemId);
CREATE INDEX IF NOT EXISTS idx_stockmovement_warehouse ON StockMovement(fromWarehouseId, toWarehouseId);
CREATE INDEX IF NOT EXISTS idx_stockmovement_date ON StockMovement(createdAt);

-- 5. إضافة بيانات تجريبية للمخازن إذا لم تكن موجودة
INSERT IGNORE INTO Warehouse (name, location, address, phone, email, manager, capacity, description, isActive) VALUES
('المخزن الرئيسي - القاهرة', 'القاهرة', 'شارع التحرير، القاهرة', '+20123456789', 'main@fixzone.com', 'أحمد محمد', '10000 قطعة', 'المخزن الرئيسي للشركة', TRUE),
('مخزن فرع الجيزة', 'الجيزة', 'شارع الهرم، الجيزة', '+20123456790', 'giza@fixzone.com', 'محمد علي', '5000 قطعة', 'مخزن فرع الجيزة', TRUE),
('مخزن فرع الإسكندرية', 'الإسكندرية', 'شارع البحر، الإسكندرية', '+20123456791', 'alex@fixzone.com', 'علي أحمد', '3000 قطعة', 'مخزن فرع الإسكندرية', TRUE);

-- 6. إضافة بيانات تجريبية للمخزون إذا لم تكن موجودة
INSERT IGNORE INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, isLowStock) VALUES
(1, 1, 15, 5, FALSE),
(1, 2, 6, 5, FALSE),
(1, 3, 0, 5, TRUE),
(2, 1, 25, 10, FALSE),
(2, 2, 8, 10, TRUE),
(2, 3, 12, 10, FALSE);

-- 7. إضافة بيانات تجريبية لحركة المخزون
INSERT IGNORE INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes, userId) VALUES
('TRANSFER', 3, 1, 1, 2, 'نقل مخزون بين المخازن', 1),
('IN', 10, 1, NULL, 1, 'إضافة مخزون جديد', 1),
('OUT', 2, 1, 1, NULL, 'صرف للعميل', 1);

-- 8. تحديث الإحصائيات
UPDATE StockLevel SET isLowStock = (quantity <= minLevel) WHERE isLowStock IS NULL;

-- 9. إضافة تعليقات للجداول
ALTER TABLE Warehouse COMMENT='المخازن';
ALTER TABLE StockLevel COMMENT='مستويات المخزون في المخازن';
ALTER TABLE InventoryItem COMMENT='قطع المخزون';

-- 10. التحقق من البيانات
SELECT 'Warehouse' as table_name, COUNT(*) as count FROM Warehouse
UNION ALL
SELECT 'StockLevel', COUNT(*) FROM StockLevel
UNION ALL
SELECT 'StockMovement', COUNT(*) FROM StockMovement
UNION ALL
SELECT 'InventoryItem', COUNT(*) FROM InventoryItem;

-- رسالة نجاح
SELECT 'تم إضافة حقول المخازن بنجاح!' as message;
