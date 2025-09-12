-- اختبار بيانات الخدمات
USE FZ;

-- إضافة خدمات تجريبية
INSERT IGNORE INTO Service (id, name, description, basePrice, isActive) VALUES
(1, 'إصلاح الشاشة', 'إصلاح شاشة الهاتف المكسورة', 100.00, TRUE),
(2, 'استبدال البطارية', 'استبدال بطارية الهاتف', 50.00, TRUE),
(3, 'إصلاح الكاميرا', 'إصلاح كاميرا الهاتف', 80.00, TRUE);

-- إضافة خدمات لطلب الإصلاح رقم 3
INSERT IGNORE INTO RepairRequestService (id, repairRequestId, serviceId, technicianId, price, notes) VALUES
(1, 3, 1, 1, 100.00, 'إصلاح شاشة مكسورة'),
(2, 3, 2, 1, 50.00, 'استبدال بطارية قديمة');

-- التحقق من البيانات
SELECT 'Services:' as table_name;
SELECT * FROM Service;

SELECT 'RepairRequestServices:' as table_name;
SELECT rrs.*, s.name as serviceName 
FROM RepairRequestService rrs 
LEFT JOIN Service s ON rrs.serviceId = s.id 
WHERE rrs.repairRequestId = 3;
