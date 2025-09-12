-- إعادة تعيين بيانات الشركات بشكل نظيف
USE FZ;

-- حذف جميع العملاء المرتبطين بالشركات
DELETE FROM Customer WHERE companyId IS NOT NULL;

-- حذف جميع الشركات
DELETE FROM Company;

-- إعادة تعيين AUTO_INCREMENT
ALTER TABLE Company AUTO_INCREMENT = 1;
ALTER TABLE Customer AUTO_INCREMENT = 1;

-- إدراج بيانات نظيفة للشركات
INSERT INTO Company (name, email, phone, address, website, industry, description, status, taxNumber, customFields, createdAt, updatedAt) VALUES
('شركة التقنية المتقدمة', 'info@tech-advanced.com', '+20123456789', 'شارع التحرير، القاهرة', 'https://tech-advanced.com', 'تقنية المعلومات', 'شركة متخصصة في حلول تقنية المعلومات', 'active', '123456789', '{"founded": "2020", "employees": 50}', NOW(), NOW()),
('مؤسسة الإصلاح السريع', 'contact@quick-repair.com', '+20123456790', 'شارع الهرم، الجيزة', 'https://quick-repair.com', 'خدمات الإصلاح', 'مؤسسة متخصصة في إصلاح الأجهزة الإلكترونية', 'active', '987654321', '{"founded": "2018", "employees": 25}', NOW(), NOW()),
('شركة الإنشاءات الحديثة', 'info@modern-construction.com', '+20123456791', 'شارع النيل، الإسكندرية', 'https://modern-construction.com', 'الإنشاءات', 'شركة متخصصة في الإنشاءات والتطوير العقاري', 'active', '456789123', '{"founded": "2015", "employees": 100}', NOW(), NOW()),
('مجموعة الخليج التجارية', 'sales@gulf-trade.com', '+20123456792', 'شارع الملك فهد، الرياض', 'https://gulf-trade.com', 'التجارة', 'مجموعة تجارية متخصصة في الاستيراد والتصدير', 'inactive', '789123456', '{"founded": "2010", "employees": 75}', NOW(), NOW()),
('شركة النقل السريع', 'info@fast-transport.com', '+20123456793', 'شارع الملك عبدالعزيز، الدمام', 'https://fast-transport.com', 'النقل', 'شركة متخصصة في خدمات النقل والشحن', 'active', '321654987', '{"founded": "2019", "employees": 40}', NOW(), NOW());

-- إضافة عملاء مرتبطين بالشركات
INSERT INTO Customer (name, phone, email, address, companyId, customFields, createdAt, updatedAt) VALUES
('محمد أحمد - شركة التقنية', '+20123456793', 'mohamed@tech-advanced.com', 'القاهرة', 1, '{"position": "مدير تقني", "department": "IT"}', NOW(), NOW()),
('سارة محمد - مؤسسة الإصلاح', '+20123456794', 'sara@quick-repair.com', 'الجيزة', 2, '{"position": "مدير العمليات", "department": "Operations"}', NOW(), NOW()),
('أحمد علي - شركة الإنشاءات', '+20123456795', 'ahmed@modern-construction.com', 'الإسكندرية', 3, '{"position": "مهندس مشاريع", "department": "Engineering"}', NOW(), NOW()),
('فاطمة حسن - مجموعة الخليج', '+20123456796', 'fatima@gulf-trade.com', 'الرياض', 4, '{"position": "مدير مبيعات", "department": "Sales"}', NOW(), NOW()),
('خالد سعد - شركة النقل', '+20123456797', 'khalid@fast-transport.com', 'الدمام', 5, '{"position": "مدير العمليات", "department": "Logistics"}', NOW(), NOW());

-- التحقق من النتيجة
SELECT 'Companies and customers reset successfully!' as message;

-- عرض الشركات مع عدد العملاء
SELECT 
    c.id, c.name, c.email, c.phone, c.website, c.industry, c.status,
    COUNT(cust.id) as customersCount
FROM Company c
LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
WHERE c.deletedAt IS NULL
GROUP BY c.id
ORDER BY c.createdAt DESC;
