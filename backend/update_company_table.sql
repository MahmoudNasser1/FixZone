-- تحديث جدول Company لإضافة الحقول المفقودة
USE fixzone_erp;

-- إضافة الحقول المفقودة
ALTER TABLE Company 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100) AFTER address,
ADD COLUMN IF NOT EXISTS website VARCHAR(200) AFTER industry,
ADD COLUMN IF NOT EXISTS description TEXT AFTER website;

-- عرض هيكل الجدول للتأكد
DESCRIBE Company;
