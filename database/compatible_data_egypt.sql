-- بيانات تجريبية متوافقة مع مخطط قاعدة البيانات - مصر
USE FZ;

-- حذف البيانات الموجودة (إن وجدت)
DELETE FROM RepairRequest WHERE id > 0;
DELETE FROM Device WHERE id > 0;
DELETE FROM Customer WHERE id > 0;
DELETE FROM Company WHERE id > 0;
DELETE FROM Branch WHERE id > 0;
DELETE FROM City WHERE id > 0;

-- إعادة تعيين AUTO_INCREMENT
ALTER TABLE RepairRequest AUTO_INCREMENT = 1;
ALTER TABLE Device AUTO_INCREMENT = 1;
ALTER TABLE Customer AUTO_INCREMENT = 1;
ALTER TABLE Company AUTO_INCREMENT = 1;
ALTER TABLE Branch AUTO_INCREMENT = 1;
ALTER TABLE City AUTO_INCREMENT = 1;

-- إضافة مدن مصرية
INSERT INTO City (name) VALUES 
('القاهرة'),
('الجيزة'),
('الإسكندرية'),
('الشرقية'),
('القليوبية');

-- إضافة فروع في مصر
INSERT INTO Branch (name, address, phone, cityId) VALUES 
('فرع القاهرة الرئيسي', 'شارع التحرير، وسط البلد، القاهرة', '0223456789', 1),
('فرع مدينة نصر', 'شارع عباس العقاد، مدينة نصر، القاهرة', '0226789012', 1),
('فرع الجيزة', 'شارع الهرم، الجيزة', '0233456789', 2),
('فرع الإسكندرية', 'شارع فؤاد، الإسكندرية', '0334567890', 3);

-- إضافة شركات مصرية
INSERT INTO Company (name, email, phone, address, taxNumber) VALUES 
('شركة التقنيات المتقدمة', 'info@advanced-tech.eg', '0223456789', 'شارع التحرير، القاهرة', '123456789'),
('مجموعة الإلكترونيات الحديثة', 'contact@modern-electronics.com', '0226789012', 'مدينة نصر، القاهرة', '234567890'),
('شركة الحلول الذكية', 'info@smart-solutions.eg', '0233456789', 'شارع الهرم، الجيزة', '345678901'),
('مؤسسة الاتصالات المصرية', 'info@egypt-telecom.com', '0334567890', 'شارع فؤاد، الإسكندرية', '456789012'),
('شركة المعلومات والتكنولوجيا', 'info@info-tech.eg', '0245678901', 'شارع الجمهورية، الشرقية', '567890123');

-- إضافة عملاء مصريين
INSERT INTO Customer (name, phone, email, address, companyId) VALUES 
('أحمد محمد علي', '01012345678', 'ahmed.mohamed@gmail.com', 'شارع التحرير، القاهرة', 1),
('فاطمة أحمد حسن', '01098765432', 'fatima.ahmed@gmail.com', 'مدينة نصر، القاهرة', 2),
('محمد علي إبراهيم', '01123456789', 'mohamed.ali@gmail.com', 'شارع الهرم، الجيزة', 3),
('سارة خالد محمود', '01234567890', 'sara.khaled@gmail.com', 'شارع فؤاد، الإسكندرية', 4),
('عبدالله سعد أحمد', '01156789012', 'abdullah.saad@gmail.com', 'شارع الجمهورية، الشرقية', 5),
('مريم حسام الدين', '01267890123', 'mariam.hossam@gmail.com', 'شارع النيل، القليوبية', 1),
('يوسف محمد سالم', '01178901234', 'youssef.mohamed@gmail.com', 'شارع الجلاء، الدقهلية', 2),
('نورا أحمد فتحي', '01289012345', 'nora.ahmed@gmail.com', 'شارع المحطة، البحيرة', 3);

-- إضافة أجهزة تجريبية
INSERT INTO Device (serialNumber, brand, model, type, customerId) VALUES 
('LP001EG2024', 'Dell', 'Inspiron 15 3000', 'لابتوب', 1),
('IP002EG2024', 'Apple', 'iPhone 13', 'هاتف ذكي', 2),
('SM003EG2024', 'Samsung', 'Galaxy Tab S8', 'تابلت', 3),
('HP004EG2024', 'HP', 'Pavilion Desktop', 'كمبيوتر مكتبي', 4),
('LN005EG2024', 'Lenovo', 'ThinkPad X1', 'لابتوب', 5),
('AP006EG2024', 'Apple', 'MacBook Air M1', 'لابتوب', 6),
('SS007EG2024', 'Samsung', 'Galaxy S21', 'هاتف ذكي', 7),
('DL008EG2024', 'Dell', 'OptiPlex 7090', 'كمبيوتر مكتبي', 8);

-- إضافة طلبات إصلاح تجريبية
INSERT INTO RepairRequest (
    deviceId, reportedProblem, status, customerId, branchId
) VALUES 
(1, 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل', 'RECEIVED', 1, 1),
(2, 'الشاشة مكسورة والهاتف لا يستجيب للمس في بعض المناطق', 'UNDER_REPAIR', 2, 1),
(3, 'البطارية لا تشحن والجهاز يتوقف فجأة حتى مع الشاحن متصل', 'DELIVERED', 3, 2),
(4, 'الجهاز لا يبدأ التشغيل ولا توجد إشارة على الشاشة', 'INSPECTION', 4, 3),
(5, 'لوحة المفاتيح لا تعمل وبعض الأزرار عالقة', 'REJECTED', 5, 1),
(6, 'الجهاز يسخن بشكل مفرط ومروحة التبريد تعمل بصوت عالي', 'UNDER_REPAIR', 6, 2),
(7, 'الكاميرا الخلفية لا تعمل وتطبيق الكاميرا يتوقف', 'DELIVERED', 7, 3),
(8, 'الصوت لا يعمل وكارت الصوت يحتاج تحديث تعريفات', 'AWAITING_APPROVAL', 8, 1);

COMMIT;
