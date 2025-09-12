-- إضافة بيانات تجريبية للشركات
USE FZ;

-- حذف البيانات القديمة إذا كانت موجودة
DELETE FROM Company WHERE id IN (1, 2, 3, 4, 5);

-- إضافة بيانات تجريبية جديدة
INSERT INTO Company (id, name, email, phone, address, website, industry, description, status, taxNumber, customFields, createdAt, updatedAt) VALUES
(1, 'شركة التقنية المتقدمة', 'info@tech-advanced.com', '+20123456789', 'شارع التحرير، القاهرة', 'https://tech-advanced.com', 'تقنية المعلومات', 'شركة متخصصة في حلول تقنية المعلومات', 'active', '123456789', '{"founded": "2020", "employees": 50}', NOW(), NOW()),
(2, 'مؤسسة الإصلاح السريع', 'contact@quick-repair.com', '+20123456790', 'شارع الهرم، الجيزة', 'https://quick-repair.com', 'خدمات الإصلاح', 'مؤسسة متخصصة في إصلاح الأجهزة الإلكترونية', 'active', '987654321', '{"founded": "2018", "employees": 25}', NOW(), NOW()),
(3, 'شركة الإنشاءات الحديثة', 'info@modern-construction.com', '+20123456791', 'شارع النيل، الإسكندرية', 'https://modern-construction.com', 'الإنشاءات', 'شركة متخصصة في الإنشاءات والتطوير العقاري', 'active', '456789123', '{"founded": "2015", "employees": 100}', NOW(), NOW()),
(4, 'مجموعة الخليج التجارية', 'sales@gulf-trade.com', '+20123456792', 'شارع الملك فهد، الرياض', 'https://gulf-trade.com', 'التجارة', 'مجموعة تجارية متخصصة في الاستيراد والتصدير', 'inactive', '789123456', '{"founded": "2010", "employees": 75}', NOW(), NOW()),
(5, 'شركة النقل السريع', 'info@fast-transport.com', '+20123456793', 'شارع الملك عبدالعزيز، الدمام', 'https://fast-transport.com', 'النقل', 'شركة متخصصة في خدمات النقل والشحن', 'active', '321654987', '{"founded": "2019", "employees": 40}', NOW(), NOW());

-- التحقق من البيانات المضافة
SELECT 'Test companies added successfully!' as message;
SELECT id, name, email, phone, website, industry, status FROM Company WHERE deletedAt IS NULL ORDER BY id;
