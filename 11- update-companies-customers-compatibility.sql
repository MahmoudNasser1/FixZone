-- تحديث شامل لضمان توافق جداول العملاء والشركات مع الباك إند
USE FZ;

-- إضافة الحقول المفقودة لجدول Company
ALTER TABLE Company 
ADD COLUMN website VARCHAR(255) DEFAULT NULL COMMENT 'موقع الشركة الإلكتروني' AFTER address,
ADD COLUMN industry VARCHAR(100) DEFAULT NULL COMMENT 'قطاع الصناعة' AFTER website,
ADD COLUMN description TEXT DEFAULT NULL COMMENT 'وصف الشركة' AFTER industry,
ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT 'حالة الشركة' AFTER description;

-- التحقق من التحديث
SELECT 'Company table updated successfully!' as message;

-- عرض هيكل الجدول المحدث
DESCRIBE Company;

-- إضافة بيانات تجريبية للشركات مع الحقول الجديدة
INSERT IGNORE INTO Company (id, name, email, phone, address, website, industry, description, status, taxNumber, customFields) VALUES
(1, 'شركة التقنية المتقدمة', 'info@tech-advanced.com', '+20123456789', 'شارع التحرير، القاهرة', 'https://tech-advanced.com', 'تقنية المعلومات', 'شركة متخصصة في حلول تقنية المعلومات', 'active', '123456789', '{"founded": "2020", "employees": 50}'),
(2, 'مؤسسة الإصلاح السريع', 'contact@quick-repair.com', '+20123456790', 'شارع الهرم، الجيزة', 'https://quick-repair.com', 'خدمات الإصلاح', 'مؤسسة متخصصة في إصلاح الأجهزة الإلكترونية', 'active', '987654321', '{"founded": "2018", "employees": 25}');

-- إضافة عملاء مرتبطين بالشركات
INSERT IGNORE INTO Customer (id, name, phone, email, address, companyId, customFields) VALUES
(3, 'محمد أحمد - شركة التقنية', '+20123456791', 'mohamed@tech-advanced.com', 'القاهرة', 1, '{"position": "مدير تقني", "department": "IT"}'),
(4, 'سارة محمد - مؤسسة الإصلاح', '+20123456792', 'sara@quick-repair.com', 'الجيزة', 2, '{"position": "مدير العمليات", "department": "Operations"}');

-- التحقق من البيانات المضافة
SELECT 'Sample data added successfully!' as message;

-- عرض الشركات مع عدد العملاء
SELECT 
    c.id, c.name, c.email, c.phone, c.website, c.industry, c.status,
    COUNT(cust.id) as customersCount
FROM Company c
LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
WHERE c.deletedAt IS NULL
GROUP BY c.id
ORDER BY c.createdAt DESC;

-- عرض العملاء مع معلومات الشركات
SELECT 
    cust.id, cust.name, cust.phone, cust.email, cust.address,
    c.name as companyName, c.industry as companyIndustry
FROM Customer cust
LEFT JOIN Company c ON cust.companyId = c.id
WHERE cust.deletedAt IS NULL
ORDER BY cust.createdAt DESC;
