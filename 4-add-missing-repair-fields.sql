-- إضافة الحقول المفقودة لطلبات الإصلاح
USE FZ;

-- إضافة حقول مفقودة لجدول RepairRequest
ALTER TABLE RepairRequest 
ADD COLUMN IF NOT EXISTS estimatedCost DECIMAL(12,2) DEFAULT 0 COMMENT 'التكلفة المقدرة',
ADD COLUMN IF NOT EXISTS actualCost DECIMAL(12,2) DEFAULT NULL COMMENT 'التكلفة الفعلية',
ADD COLUMN IF NOT EXISTS priority ENUM('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM' COMMENT 'الأولوية',
ADD COLUMN IF NOT EXISTS expectedDeliveryDate DATETIME DEFAULT NULL COMMENT 'موعد التسليم المتوقع',
ADD COLUMN IF NOT EXISTS notes TEXT COMMENT 'ملاحظات إضافية';

-- إضافة بيانات تجريبية لطلبات الإصلاح
UPDATE RepairRequest SET 
    estimatedCost = 450.00,
    actualCost = NULL,
    priority = 'HIGH',
    expectedDeliveryDate = DATE_ADD(createdAt, INTERVAL 7 DAY),
    notes = 'طلب إصلاح عاجل'
WHERE id = 1;

UPDATE RepairRequest SET 
    estimatedCost = 200.00,
    actualCost = 180.00,
    priority = 'MEDIUM',
    expectedDeliveryDate = DATE_ADD(createdAt, INTERVAL 5 DAY),
    notes = 'إصلاح بسيط'
WHERE id = 2;

UPDATE RepairRequest SET 
    estimatedCost = 300.00,
    actualCost = NULL,
    priority = 'HIGH',
    expectedDeliveryDate = DATE_ADD(createdAt, INTERVAL 10 DAY),
    notes = 'استبدال قطع غيار'
WHERE id = 3;

-- التحقق من التحديثات
SELECT 'RepairRequest updated:' as status;
SELECT id, estimatedCost, actualCost, priority, expectedDeliveryDate, notes FROM RepairRequest;
