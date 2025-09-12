-- إدراج بيانات الشركات مباشرة
USE FZ;

-- حذف البيانات القديمة
DELETE FROM Company WHERE id IN (1, 2, 3, 4, 5);

-- إدراج بيانات جديدة
INSERT INTO Company (id, name, email, phone, address, website, industry, description, status, taxNumber, customFields, createdAt, updatedAt) VALUES
(1, 'شركة التقنية المتقدمة', 'info@tech-advanced.com', '+20123456789', 'شارع التحرير، القاهرة', 'https://tech-advanced.com', 'تقنية المعلومات', 'شركة متخصصة في حلول تقنية المعلومات', 'active', '123456789', '{"founded": "2020", "employees": 50}', NOW(), NOW()),
(2, 'مؤسسة الإصلاح السريع', 'contact@quick-repair.com', '+20123456790', 'شارع الهرم، الجيزة', 'https://quick-repair.com', 'خدمات الإصلاح', 'مؤسسة متخصصة في إصلاح الأجهزة الإلكترونية', 'active', '987654321', '{"founded": "2018", "employees": 25}', NOW(), NOW()),
(3, 'شركة الإنشاءات الحديثة', 'info@modern-construction.com', '+20123456791', 'شارع النيل، الإسكندرية', 'https://modern-construction.com', 'الإنشاءات', 'شركة متخصصة في الإنشاءات والتطوير العقاري', 'active', '456789123', '{"founded": "2015", "employees": 100}', NOW(), NOW());

-- التحقق من النتيجة
SELECT 'Companies inserted successfully!' as message;
SELECT id, name, email, phone, website, industry, status FROM Company WHERE deletedAt IS NULL ORDER BY id;
