-- ============================================
-- فحص حالة المايجريشنز يدوياً
-- ============================================
-- استخدم هذا الملف للتحقق من حالة المايجريشنز قبل تشغيلها
-- Usage: mysql -u root -p FZ < check_migrations_status.sql

USE FZ;

-- ============================================
-- 1. فحص عمود shippingAmount في جدول Invoice
-- ============================================
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود - shippingAmount موجود في Invoice'
        ELSE '❌ غير موجود - shippingAmount غير موجود في Invoice'
    END AS shipping_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'shippingAmount';

-- ============================================
-- 2. فحص جداول الفنيين
-- ============================================

-- جدول technician_performance
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود - technician_performance'
        ELSE '❌ غير موجود - technician_performance'
    END AS tech_perf_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_performance';

-- جدول technician_repairs
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود - technician_repairs'
        ELSE '❌ غير موجود - technician_repairs'
    END AS tech_repairs_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_repairs';

-- جدول technician_schedules
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود - technician_schedules'
        ELSE '❌ غير موجود - technician_schedules'
    END AS tech_schedules_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_schedules';

-- جدول technician_skills
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود - technician_skills'
        ELSE '❌ غير موجود - technician_skills'
    END AS tech_skills_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_skills';

-- جدول technician_wages
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود - technician_wages'
        ELSE '❌ غير موجود - technician_wages'
    END AS tech_wages_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_wages';

-- ============================================
-- 3. عرض جميع الأعمدة في جدول Invoice (للتحقق)
-- ============================================
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'Invoice'
ORDER BY ORDINAL_POSITION;

