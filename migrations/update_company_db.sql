-- تحديث جدول Company لإضافة الحقول المفقودة
USE FZ;

-- إضافة الحقول المفقودة
ALTER TABLE Company 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100) AFTER address,
ADD COLUMN IF NOT EXISTS website VARCHAR(200) AFTER industry,
ADD COLUMN IF NOT EXISTS description TEXT AFTER website;

-- التحقق من وجود حقل الحالة وإضافته إذا لم يكن موجوداً
-- (isActive موجود بالفعل في الجدول الأصلي، لكن نتأكد من أنه يعمل بشكل صحيح)

-- التأكد من أن الحقل موجود بالشكل الصحيح
ALTER TABLE Company 
MODIFY COLUMN isActive BOOLEAN DEFAULT TRUE;

-- تحديث القيم الافتراضية للحالة
UPDATE Company SET isActive = 1 WHERE isActive IS NULL;

-- التأكد من أن القيم صحيحة (1 = نشط، 0 = غير نشط)
UPDATE Company SET isActive = 0 WHERE isActive = '0' OR isActive = 'false' OR isActive = 0;
UPDATE Company SET isActive = 1 WHERE isActive = '1' OR isActive = 'true' OR isActive = 1;

-- عرض هيكل الجدول للتأكد
DESCRIBE Company;

-- عرض بعض البيانات للتأكد
SELECT id, name, isActive, industry, website FROM Company LIMIT 5;
