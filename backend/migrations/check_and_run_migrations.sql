-- Check which migrations have already been applied
-- Run this first to see what's already done

USE FZ;

-- Check for shippingAmount column
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ shippingAmount column EXISTS'
        ELSE '❌ shippingAmount column NOT FOUND'
    END AS shipping_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'shippingAmount';

-- Check for technician tables
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ technician_performance table EXISTS'
        ELSE '❌ technician_performance table NOT FOUND'
    END AS tech_perf_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_performance';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ technician_repairs table EXISTS'
        ELSE '❌ technician_repairs table NOT FOUND'
    END AS tech_repairs_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_repairs';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ technician_schedules table EXISTS'
        ELSE '❌ technician_schedules table NOT FOUND'
    END AS tech_schedules_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_schedules';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ technician_skills table EXISTS'
        ELSE '❌ technician_skills table NOT FOUND'
    END AS tech_skills_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_skills';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ technician_wages table EXISTS'
        ELSE '❌ technician_wages table NOT FOUND'
    END AS tech_wages_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'FZ'
  AND TABLE_NAME = 'technician_wages';

