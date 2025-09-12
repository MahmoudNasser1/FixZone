-- تحديث شامل لنظام المتغيرات - النسخة النهائية
USE FZ;

-- إضافة فئات المتغيرات
INSERT IGNORE INTO VariableCategory (id, code, name, scope) VALUES
(1, 'BRAND', 'العلامات التجارية', 'DEVICE'),
(2, 'ACCESSORY', 'المتعلقات المستلمة', 'REPAIR'),
(3, 'DEVICE_TYPE', 'أنواع الأجهزة', 'GLOBAL');

-- إضافة أنواع الأجهزة
INSERT IGNORE INTO VariableOption (id, categoryId, label, value, deviceType, isActive, sortOrder) VALUES
(1, 3, 'هاتف ذكي', 'SMARTPHONE', NULL, TRUE, 1),
(2, 3, 'لابتوب', 'LAPTOP', NULL, TRUE, 2),
(3, 3, 'تابلت', 'TABLET', NULL, TRUE, 3),
(4, 3, 'ساعة ذكية', 'SMARTWATCH', NULL, TRUE, 4),
(5, 3, 'سماعات', 'HEADPHONES', NULL, TRUE, 5);

-- إضافة العلامات التجارية للهواتف
INSERT IGNORE INTO VariableOption (id, categoryId, label, value, deviceType, isActive, sortOrder) VALUES
(10, 1, 'Apple', 'APPLE', 'SMARTPHONE', TRUE, 1),
(11, 1, 'Samsung', 'SAMSUNG', 'SMARTPHONE', TRUE, 2),
(12, 1, 'Huawei', 'HUAWEI', 'SMARTPHONE', TRUE, 3),
(13, 1, 'Xiaomi', 'XIAOMI', 'SMARTPHONE', TRUE, 4),
(14, 1, 'OnePlus', 'ONEPLUS', 'SMARTPHONE', TRUE, 5),
(15, 1, 'Google', 'GOOGLE', 'SMARTPHONE', TRUE, 6);

-- إضافة العلامات التجارية للابتوب
INSERT IGNORE INTO VariableOption (id, categoryId, label, value, deviceType, isActive, sortOrder) VALUES
(20, 1, 'Dell', 'DELL', 'LAPTOP', TRUE, 1),
(21, 1, 'HP', 'HP', 'LAPTOP', TRUE, 2),
(22, 1, 'Lenovo', 'LENOVO', 'LAPTOP', TRUE, 3),
(23, 1, 'ASUS', 'ASUS', 'LAPTOP', TRUE, 4),
(24, 1, 'Acer', 'ACER', 'LAPTOP', TRUE, 5),
(25, 1, 'MSI', 'MSI', 'LAPTOP', TRUE, 6);

-- إضافة العلامات التجارية للتابلت
INSERT IGNORE INTO VariableOption (id, categoryId, label, value, deviceType, isActive, sortOrder) VALUES
(30, 1, 'iPad', 'IPAD', 'TABLET', TRUE, 1),
(31, 1, 'Samsung Galaxy Tab', 'SAMSUNG_TAB', 'TABLET', TRUE, 2),
(32, 1, 'Huawei MediaPad', 'HUAWEI_TAB', 'TABLET', TRUE, 3),
(33, 1, 'Lenovo Tab', 'LENOVO_TAB', 'TABLET', TRUE, 4);

-- إضافة المتعلقات المستلمة
INSERT IGNORE INTO VariableOption (id, categoryId, label, value, deviceType, isActive, sortOrder) VALUES
(100, 2, 'شاحن الجهاز', 'CHARGER', NULL, TRUE, 1),
(101, 2, 'كابل USB', 'USB_CABLE', NULL, TRUE, 2),
(102, 2, 'سماعات', 'EARPHONES', NULL, TRUE, 3),
(103, 2, 'حافظة', 'CASE', NULL, TRUE, 4),
(104, 2, 'حامي الشاشة', 'SCREEN_PROTECTOR', NULL, TRUE, 5),
(105, 2, 'قلم رقمي', 'STYLUS', NULL, TRUE, 6),
(106, 2, 'ماوس', 'MOUSE', NULL, TRUE, 7),
(107, 2, 'لوحة مفاتيح', 'KEYBOARD', NULL, TRUE, 8),
(108, 2, 'بطاقة ذاكرة', 'MEMORY_CARD', NULL, TRUE, 9),
(109, 2, 'بطارية خارجية', 'POWER_BANK', NULL, TRUE, 10);

-- التحقق من البيانات المضافة
SELECT 'VariableCategory added:' as status;
SELECT * FROM VariableCategory;

SELECT 'VariableOption added:' as status;
SELECT vo.id, vo.label, vo.value, vo.deviceType, vc.name as category_name 
FROM VariableOption vo 
JOIN VariableCategory vc ON vo.categoryId = vc.id 
ORDER BY vc.code, vo.sortOrder;

SELECT 'تم إضافة بيانات المتغيرات بنجاح!' as message;
