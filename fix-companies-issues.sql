-- إصلاح مشاكل جدول الشركات
USE FZ;

-- التحقق من الحقول الموجودة
SELECT 'Checking existing columns...' as message;
DESCRIBE Company;

-- التحقق من البيانات الموجودة
SELECT 'Checking existing data...' as message;
SELECT id, name, email, phone, address, website, industry, description, status, taxNumber, customFields 
FROM Company 
WHERE deletedAt IS NULL 
LIMIT 5;

-- إضافة البيانات التجريبية فقط (إذا لم تكن موجودة)
INSERT IGNORE INTO Company (id, name, email, phone, address, website, industry, description, status, taxNumber, customFields) VALUES
(1, 'شركة التقنية المتقدمة', 'info@tech-advanced.com', '+20123456789', 'شارع التحرير، القاهرة', 'https://tech-advanced.com', 'تقنية المعلومات', 'شركة متخصصة في حلول تقنية المعلومات', 'active', '123456789', '{"founded": "2020", "employees": 50}'),
(2, 'مؤسسة الإصلاح السريع', 'contact@quick-repair.com', '+20123456790', 'شارع الهرم، الجيزة', 'https://quick-repair.com', 'خدمات الإصلاح', 'مؤسسة متخصصة في إصلاح الأجهزة الإلكترونية', 'active', '987654321', '{"founded": "2018", "employees": 25}'),
(3, 'شركة الإنشاءات الحديثة', 'info@modern-construction.com', '+20123456791', 'شارع النيل، الإسكندرية', 'https://modern-construction.com', 'الإنشاءات', 'شركة متخصصة في الإنشاءات والتطوير العقاري', 'active', '456789123', '{"founded": "2015", "employees": 100}'),
(4, 'مجموعة الخليج التجارية', 'sales@gulf-trade.com', '+20123456792', 'شارع الملك فهد، الرياض', 'https://gulf-trade.com', 'التجارة', 'مجموعة تجارية متخصصة في الاستيراد والتصدير', 'inactive', '789123456', '{"founded": "2010", "employees": 75}');

-- إضافة عملاء مرتبطين بالشركات
INSERT IGNORE INTO Customer (id, name, phone, email, address, companyId, customFields) VALUES
(3, 'محمد أحمد - شركة التقنية', '+20123456793', 'mohamed@tech-advanced.com', 'القاهرة', 1, '{"position": "مدير تقني", "department": "IT"}'),
(4, 'سارة محمد - مؤسسة الإصلاح', '+20123456794', 'sara@quick-repair.com', 'الجيزة', 2, '{"position": "مدير العمليات", "department": "Operations"}'),
(5, 'أحمد علي - شركة الإنشاءات', '+20123456795', 'ahmed@modern-construction.com', 'الإسكندرية', 3, '{"position": "مهندس مشاريع", "department": "Engineering"}'),
(6, 'فاطمة حسن - مجموعة الخليج', '+20123456796', 'fatima@gulf-trade.com', 'الرياض', 4, '{"position": "مدير مبيعات", "department": "Sales"}');

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
