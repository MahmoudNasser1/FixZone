-- تحديث شامل لنظام طلبات الإصلاح
USE FZ;

-- إضافة الحقول المفقودة لجدول RepairRequest
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
    notes = 'طلب إصلاح عاجل - شاشة مكسورة'
WHERE id = 1;

UPDATE RepairRequest SET 
    estimatedCost = 200.00,
    actualCost = 180.00,
    priority = 'MEDIUM',
    expectedDeliveryDate = DATE_ADD(createdAt, INTERVAL 5 DAY),
    notes = 'إصلاح بسيط - استبدال بطارية'
WHERE id = 2;

UPDATE RepairRequest SET 
    estimatedCost = 300.00,
    actualCost = NULL,
    priority = 'HIGH',
    expectedDeliveryDate = DATE_ADD(createdAt, INTERVAL 10 DAY),
    notes = 'استبدال قطع غيار - مشكلة في الشحن'
WHERE id = 3;

-- إضافة طلبات إصلاح إضافية للاختبار
INSERT IGNORE INTO RepairRequest (
    id, deviceId, customerId, branchId, technicianId, status, 
    reportedProblem, estimatedCost, priority, expectedDeliveryDate, notes
) VALUES
(4, 1, 1, 1, 1, 'UNDER_REPAIR', 'مشكلة في الكاميرا', 150.00, 'MEDIUM', DATE_ADD(NOW(), INTERVAL 3 DAY), 'إصلاح كاميرا خلفية'),
(5, 2, 2, 1, 1, 'READY_FOR_DELIVERY', 'إصلاح ميكروفون', 80.00, 'LOW', DATE_ADD(NOW(), INTERVAL 1 DAY), 'إصلاح ميكروفون الجهاز');

-- إضافة خدمات لطلبات الإصلاح
INSERT IGNORE INTO RepairRequestService (repairRequestId, serviceId, technicianId, price, notes) VALUES
(1, 1, 1, 120.00, 'تم تغيير شاشة الجهاز'),
(1, 2, 1, 60.00, 'تم استبدال البطارية'),
(2, 2, 1, 50.00, 'استبدال بطارية الجهاز'),
(3, 1, 1, 100.00, 'إصلاح شاشة الجهاز'),
(4, 1, 1, 80.00, 'إصلاح كاميرا الجهاز'),
(5, 2, 1, 40.00, 'إصلاح ميكروفون الجهاز');

-- إضافة قطع مستخدمة لطلبات الإصلاح
INSERT IGNORE INTO PartsUsed (repairRequestId, inventoryItemId, quantity) VALUES
(1, 1, 1), -- شاشة LCD للهاتف
(1, 2, 1), -- بطارية ليثيوم
(2, 2, 1), -- بطارية ليثيوم
(3, 1, 1), -- شاشة LCD للهاتف
(4, 1, 1), -- شاشة LCD للهاتف
(5, 2, 1); -- بطارية ليثيوم

-- التحقق من التحديثات
SELECT 'RepairRequest updated:' as status;
SELECT id, estimatedCost, actualCost, priority, expectedDeliveryDate, notes, status FROM RepairRequest;

SELECT 'RepairRequestService updated:' as status;
SELECT repairRequestId, serviceId, price, notes FROM RepairRequestService;

SELECT 'PartsUsed updated:' as status;
SELECT repairRequestId, inventoryItemId, quantity FROM PartsUsed;
