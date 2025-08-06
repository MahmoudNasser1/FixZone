-- بيانات تجريبية مبسطة لنظام Fix Zone ERP - مصر
USE FZ;

-- حذف البيانات الموجودة (إن وجدت)
DELETE FROM RepairRequest WHERE id > 0;
DELETE FROM Customer WHERE id > 0;
DELETE FROM Company WHERE id > 0;

-- إعادة تعيين AUTO_INCREMENT
ALTER TABLE RepairRequest AUTO_INCREMENT = 1;
ALTER TABLE Customer AUTO_INCREMENT = 1;
ALTER TABLE Company AUTO_INCREMENT = 1;

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

-- إضافة طلبات إصلاح تجريبية
INSERT INTO RepairRequest (
    requestNumber, customerId, customerName, customerPhone, customerEmail,
    deviceType, deviceBrand, deviceModel, 
    problemDescription, priority, estimatedCost, status
) VALUES 
('REP-20241203-001', 1, 'أحمد محمد علي', '01012345678', 'ahmed.mohamed@gmail.com',
 'لابتوب', 'Dell', 'Inspiron 15 3000',
 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل', 'high', 450.00, 'pending'),

('REP-20241203-002', 2, 'فاطمة أحمد حسن', '01098765432', 'fatima.ahmed@gmail.com',
 'هاتف ذكي', 'Apple', 'iPhone 13',
 'الشاشة مكسورة والهاتف لا يستجيب للمس في بعض المناطق', 'medium', 800.00, 'in_progress'),

('REP-20241202-003', 3, 'محمد علي إبراهيم', '01123456789', 'mohamed.ali@gmail.com',
 'تابلت', 'Samsung', 'Galaxy Tab S8',
 'البطارية لا تشحن والجهاز يتوقف فجأة حتى مع الشاحن متصل', 'low', 320.00, 'completed'),

('REP-20241202-004', 4, 'سارة خالد محمود', '01234567890', 'sara.khaled@gmail.com',
 'كمبيوتر مكتبي', 'HP', 'Pavilion Desktop',
 'الجهاز لا يبدأ التشغيل ولا توجد إشارة على الشاشة', 'high', 380.00, 'pending'),

('REP-20241201-005', 5, 'عبدالله سعد أحمد', '01156789012', 'abdullah.saad@gmail.com',
 'لابتوب', 'Lenovo', 'ThinkPad X1',
 'لوحة المفاتيح لا تعمل وبعض الأزرار عالقة', 'medium', 250.00, 'cancelled'),

('REP-20241201-006', 6, 'مريم حسام الدين', '01267890123', 'mariam.hossam@gmail.com',
 'لابتوب', 'Apple', 'MacBook Air M1',
 'الجهاز يسخن بشكل مفرط ومروحة التبريد تعمل بصوت عالي', 'medium', 520.00, 'in_progress'),

('REP-20241130-007', 7, 'يوسف محمد سالم', '01178901234', 'youssef.mohamed@gmail.com',
 'هاتف ذكي', 'Samsung', 'Galaxy S21',
 'الكاميرا الخلفية لا تعمل وتطبيق الكاميرا يتوقف', 'low', 180.00, 'completed'),

('REP-20241130-008', 8, 'نورا أحمد فتحي', '01289012345', 'nora.ahmed@gmail.com',
 'كمبيوتر مكتبي', 'Dell', 'OptiPlex 7090',
 'الصوت لا يعمل وكارت الصوت يحتاج تحديث تعريفات', 'low', 120.00, 'pending');

COMMIT;
