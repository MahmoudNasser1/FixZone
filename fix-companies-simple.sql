-- إصلاح بسيط لمشاكل الشركات
USE FZ;

-- التحقق من هيكل الجدول
SELECT 'Company table structure:' as message;
DESCRIBE Company;

-- التحقق من البيانات الموجودة
SELECT 'Existing companies:' as message;
SELECT id, name, email, phone, address, website, industry, description, status, taxNumber 
FROM Company 
WHERE deletedAt IS NULL 
LIMIT 10;

-- إضافة بيانات تجريبية (إذا لم تكن موجودة)
INSERT IGNORE INTO Company (id, name, email, phone, address, website, industry, description, status, taxNumber, customFields) VALUES
(1, 'شركة التقنية المتقدمة', 'info@tech-advanced.com', '+20123456789', 'شارع التحرير، القاهرة', 'https://tech-advanced.com', 'تقنية المعلومات', 'شركة متخصصة في حلول تقنية المعلومات', 'active', '123456789', '{"founded": "2020", "employees": 50}'),
(2, 'مؤسسة الإصلاح السريع', 'contact@quick-repair.com', '+20123456790', 'شارع الهرم، الجيزة', 'https://quick-repair.com', 'خدمات الإصلاح', 'مؤسسة متخصصة في إصلاح الأجهزة الإلكترونية', 'active', '987654321', '{"founded": "2018", "employees": 25}'),
(3, 'شركة الإنشاءات الحديثة', 'info@modern-construction.com', '+20123456791', 'شارع النيل، الإسكندرية', 'https://modern-construction.com', 'الإنشاءات', 'شركة متخصصة في الإنشاءات والتطوير العقاري', 'active', '456789123', '{"founded": "2015", "employees": 100}');

-- التحقق من النتيجة
SELECT 'Companies added successfully!' as message;
SELECT COUNT(*) as totalCompanies FROM Company WHERE deletedAt IS NULL;
