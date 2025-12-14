-- Migration: Add Inspection Type "فحص أثناء الإصلاح"
-- Date: 2025-01-13
-- Description: Add new inspection type for inspection during repair process

-- إضافة نوع فحص جديد: "فحص أثناء الإصلاح"
INSERT INTO InspectionType (name, description, isActive) 
VALUES ('فحص أثناء الإصلاح', 'تقرير فحص بعد الفك والفحص التفصيلي', 1)
ON DUPLICATE KEY UPDATE description = 'تقرير فحص بعد الفك والفحص التفصيلي';

-- التأكد من وجود نوع "فحص نهائي"
INSERT INTO InspectionType (name, description, isActive) 
VALUES ('فحص نهائي', 'تقرير فحص نهائي شامل قبل التسليم', 1)
ON DUPLICATE KEY UPDATE description = 'تقرير فحص نهائي شامل قبل التسليم';

-- التأكد من وجود نوع "فحص مبدئي"
INSERT INTO InspectionType (name, description, isActive) 
VALUES ('فحص مبدئي', 'تقرير فحص عند الاستلام', 1)
ON DUPLICATE KEY UPDATE description = 'تقرير فحص عند الاستلام';

