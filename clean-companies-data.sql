-- تنظيف بيانات الشركات
USE FZ;

-- حذف الشركات التي لا تحتوي على بيانات مفيدة
DELETE FROM Company WHERE 
    (name IS NULL OR name = '' OR name = 'N/A') 
    OR (email IS NULL OR email = '' OR email = 'N/A')
    OR (phone IS NULL OR phone = '' OR phone = 'N/A');

-- حذف العملاء المرتبطين بالشركات المحذوفة
DELETE FROM Customer WHERE companyId NOT IN (SELECT id FROM Company);

-- عرض الشركات المتبقية
SELECT 'Remaining companies after cleanup:' as message;
SELECT id, name, email, phone, address, website, industry, description, status, taxNumber 
FROM Company 
WHERE deletedAt IS NULL
ORDER BY id;

-- إضافة بيانات تجريبية نظيفة
INSERT IGNORE INTO Company (id, name, email, phone, address, website, industry, description, status, taxNumber, customFields, createdAt, updatedAt) VALUES
(1, 'شركة التقنية المتقدمة', 'info@tech-advanced.com', '+20123456789', 'شارع التحرير، القاهرة', 'https://tech-advanced.com', 'تقنية المعلومات', 'شركة متخصصة في حلول تقنية المعلومات', 'active', '123456789', '{"founded": "2020", "employees": 50}', NOW(), NOW()),
(2, 'مؤسسة الإصلاح السريع', 'contact@quick-repair.com', '+20123456790', 'شارع الهرم، الجيزة', 'https://quick-repair.com', 'خدمات الإصلاح', 'مؤسسة متخصصة في إصلاح الأجهزة الإلكترونية', 'active', '987654321', '{"founded": "2018", "employees": 25}', NOW(), NOW()),
(3, 'شركة الإنشاءات الحديثة', 'info@modern-construction.com', '+20123456791', 'شارع النيل، الإسكندرية', 'https://modern-construction.com', 'الإنشاءات', 'شركة متخصصة في الإنشاءات والتطوير العقاري', 'active', '456789123', '{"founded": "2015", "employees": 100}', NOW(), NOW());

-- التحقق من النتيجة النهائية
SELECT 'Final companies list:' as message;
SELECT 
    c.id, c.name, c.email, c.phone, c.website, c.industry, c.status,
    COUNT(cust.id) as customersCount
FROM Company c
LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
WHERE c.deletedAt IS NULL
GROUP BY c.id
ORDER BY c.createdAt DESC;
