-- بيانات تجريبية لنظام Fix Zone ERP - مصر
-- استخدام قاعدة البيانات الصحيحة
USE FZ;

-- إضافة مدن مصرية
INSERT INTO City (name) VALUES 
('القاهرة'),
('الجيزة'),
('الإسكندرية'),
('الشرقية'),
('القليوبية'),
('الدقهلية'),
('البحيرة'),
('الفيوم'),
('بني سويف'),
('المنيا');

-- إضافة فروع في مصر
INSERT INTO Branch (name, address, phone, cityId) VALUES 
('فرع القاهرة الرئيسي', 'شارع التحرير، وسط البلد، القاهرة', '0223456789', 1),
('فرع مدينة نصر', 'شارع عباس العقاد، مدينة نصر، القاهرة', '0226789012', 1),
('فرع الجيزة', 'شارع الهرم، الجيزة', '0233456789', 2),
('فرع الإسكندرية', 'شارع فؤاد، الإسكندرية', '0334567890', 3);

-- إضافة أدوار المستخدمين
INSERT INTO Role (name, permissions) VALUES 
('مدير عام', '["all"]'),
('مدير فرع', '["branch_management", "repair_requests", "customers", "reports"]'),
('فني', '["repair_requests", "device_diagnostics"]'),
('موظف استقبال', '["customers", "repair_requests_create", "repair_requests_view"]'),
('محاسب', '["invoices", "payments", "financial_reports"]');

-- إضافة مستخدمين تجريبيين
INSERT INTO User (name, email, password, phone, roleId) VALUES 
('أحمد محمد', 'ahmed@fixzone.com', '$2b$10$hash', '01012345678', 1),
('فاطمة علي', 'fatima@fixzone.com', '$2b$10$hash', '01098765432', 2),
('محمد حسن', 'mohamed@fixzone.com', '$2b$10$hash', '01123456789', 3),
('سارة أحمد', 'sara@fixzone.com', '$2b$10$hash', '01234567890', 4),
('عبدالله سعد', 'abdullah@fixzone.com', '$2b$10$hash', '01156789012', 5);

-- إضافة شركات مصرية
INSERT INTO Company (name, email, phone, address, taxNumber) VALUES 
('شركة التقنيات المتقدمة', 'info@advanced-tech.eg', '0223456789', 'شارع التحرير، القاهرة', '123456789'),
('مجموعة الإلكترونيات الحديثة', 'contact@modern-electronics.com', '0226789012', 'مدينة نصر، القاهرة', '234567890'),
('شركة الحلول الذكية', 'info@smart-solutions.eg', '0233456789', 'شارع الهرم، الجيزة', '345678901'),
('مؤسسة الاتصالات المصرية', 'info@egypt-telecom.com', '0334567890', 'شارع فؤاد، الإسكندرية', '456789012'),
('شركة المعلومات والتكنولوجيا', 'info@info-tech.eg', '0245678901', 'شارع الجمهورية، الشرقية', '567890123'),
('مركز الصيانة المتخصص', 'info@maintenance-center.com', '0256789012', 'شارع النيل، القليوبية', '678901234'),
('شركة الأجهزة الطبية', 'info@medical-devices.eg', '0267890123', 'شارع الجلاء، الدقهلية', '789012345'),
('مجموعة التجارة الإلكترونية', 'info@e-commerce.com', '0278901234', 'شارع المحطة، البحيرة', '890123456');

-- إضافة عملاء مصريين
INSERT INTO Customer (name, phone, email, address, companyId) VALUES 
('أحمد محمد علي', '01012345678', 'ahmed.mohamed@gmail.com', 'شارع التحرير، القاهرة', 1),
('فاطمة أحمد حسن', '01098765432', 'fatima.ahmed@gmail.com', 'مدينة نصر، القاهرة', 2),
('محمد علي إبراهيم', '01123456789', 'mohamed.ali@gmail.com', 'شارع الهرم، الجيزة', 3),
('سارة خالد محمود', '01234567890', 'sara.khaled@gmail.com', 'شارع فؤاد، الإسكندرية', 4),
('عبدالله سعد أحمد', '01156789012', 'abdullah.saad@gmail.com', 'شارع الجمهورية، الشرقية', 5),
('مريم حسام الدين', '01267890123', 'mariam.hossam@gmail.com', 'شارع النيل، القليوبية', 6),
('يوسف محمد سالم', '01178901234', 'youssef.mohamed@gmail.com', 'شارع الجلاء، الدقهلية', 7),
('نورا أحمد فتحي', '01289012345', 'nora.ahmed@gmail.com', 'شارع المحطة، البحيرة', 8),
('كريم عبدالرحمن', '01190123456', 'karim.abdelrahman@gmail.com', 'شارع السلام، الفيوم', 1),
('هدى محمد رضا', '01201234567', 'hoda.mohamed@gmail.com', 'شارع الثورة، بني سويف', 2);

-- إضافة أجهزة تجريبية
INSERT INTO Device (serialNumber, brand, model, type, customerId) VALUES 
('LP001EG2024', 'Dell', 'Inspiron 15 3000', 'لابتوب', 1),
('IP002EG2024', 'Apple', 'iPhone 13', 'هاتف ذكي', 2),
('SM003EG2024', 'Samsung', 'Galaxy Tab S8', 'تابلت', 3),
('HP004EG2024', 'HP', 'Pavilion Desktop', 'كمبيوتر مكتبي', 4),
('LN005EG2024', 'Lenovo', 'ThinkPad X1', 'لابتوب', 5),
('AP006EG2024', 'Apple', 'MacBook Air M1', 'لابتوب', 6),
('SS007EG2024', 'Samsung', 'Galaxy S21', 'هاتف ذكي', 7),
('DL008EG2024', 'Dell', 'OptiPlex 7090', 'كمبيوتر مكتبي', 8),
('HW009EG2024', 'Huawei', 'MateBook D15', 'لابتوب', 9),
('AS010EG2024', 'Asus', 'VivoBook 15', 'لابتوب', 10);

-- إضافة طلبات إصلاح تجريبية
INSERT INTO RepairRequest (
    requestNumber, customerId, customerName, customerPhone, customerEmail,
    deviceType, deviceBrand, deviceModel, serialNumber,
    problemDescription, priority, estimatedCost, status
) VALUES 
('REP-20241203-001', 1, 'أحمد محمد علي', '01012345678', 'ahmed.mohamed@gmail.com',
 'لابتوب', 'Dell', 'Inspiron 15 3000', 'LP001EG2024',
 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل', 'high', 450.00, 'pending'),

('REP-20241203-002', 2, 'فاطمة أحمد حسن', '01098765432', 'fatima.ahmed@gmail.com',
 'هاتف ذكي', 'Apple', 'iPhone 13', 'IP002EG2024',
 'الشاشة مكسورة والهاتف لا يستجيب للمس في بعض المناطق', 'medium', 800.00, 'in_progress'),

('REP-20241202-003', 3, 'محمد علي إبراهيم', '01123456789', 'mohamed.ali@gmail.com',
 'تابلت', 'Samsung', 'Galaxy Tab S8', 'SM003EG2024',
 'البطارية لا تشحن والجهاز يتوقف فجأة حتى مع الشاحن متصل', 'low', 320.00, 'completed'),

('REP-20241202-004', 4, 'سارة خالد محمود', '01234567890', 'sara.khaled@gmail.com',
 'كمبيوتر مكتبي', 'HP', 'Pavilion Desktop', 'HP004EG2024',
 'الجهاز لا يبدأ التشغيل ولا توجد إشارة على الشاشة', 'high', 380.00, 'pending'),

('REP-20241201-005', 5, 'عبدالله سعد أحمد', '01156789012', 'abdullah.saad@gmail.com',
 'لابتوب', 'Lenovo', 'ThinkPad X1', 'LN005EG2024',
 'لوحة المفاتيح لا تعمل وبعض الأزرار عالقة', 'medium', 250.00, 'cancelled'),

('REP-20241201-006', 6, 'مريم حسام الدين', '01267890123', 'mariam.hossam@gmail.com',
 'لابتوب', 'Apple', 'MacBook Air M1', 'AP006EG2024',
 'الجهاز يسخن بشكل مفرط ومروحة التبريد تعمل بصوت عالي', 'medium', 520.00, 'in_progress'),

('REP-20241130-007', 7, 'يوسف محمد سالم', '01178901234', 'youssef.mohamed@gmail.com',
 'هاتف ذكي', 'Samsung', 'Galaxy S21', 'SS007EG2024',
 'الكاميرا الخلفية لا تعمل وتطبيق الكاميرا يتوقف', 'low', 180.00, 'completed'),

('REP-20241130-008', 8, 'نورا أحمد فتحي', '01289012345', 'nora.ahmed@gmail.com',
 'كمبيوتر مكتبي', 'Dell', 'OptiPlex 7090', 'DL008EG2024',
 'الصوت لا يعمل وكارت الصوت يحتاج تحديث تعريفات', 'low', 120.00, 'pending'),

('REP-20241129-009', 9, 'كريم عبدالرحمن', '01190123456', 'karim.abdelrahman@gmail.com',
 'لابتوب', 'Huawei', 'MateBook D15', 'HW009EG2024',
 'الواي فاي لا يعمل وكارت الشبكة يحتاج إصلاح', 'medium', 200.00, 'in_progress'),

('REP-20241129-010', 10, 'هدى محمد رضا', '01201234567', 'hoda.mohamed@gmail.com',
 'لابتوب', 'Asus', 'VivoBook 15', 'AS010EG2024',
 'الهارد ديسك يصدر أصوات غريبة والنظام بطيء جداً', 'high', 350.00, 'pending');

-- إضافة فواتير تجريبية
INSERT INTO Invoice (
    repairRequestId, totalAmount, amountPaid, status, 
    taxAmount, discountAmount, notes
) VALUES 
(3, 320.00, 320.00, 'paid', 48.00, 0.00, 'تم الدفع كاملاً - إصلاح البطارية'),
(7, 180.00, 180.00, 'paid', 27.00, 20.00, 'خصم 20 جنيه - عميل دائم');

-- إضافة مدفوعات تجريبية
INSERT INTO Payment (
    invoiceId, amount, method, status, 
    transactionReference, notes
) VALUES 
(1, 320.00, 'cash', 'completed', 'CASH-001-2024', 'دفع نقدي'),
(2, 180.00, 'card', 'completed', 'CARD-002-2024', 'دفع بالبطاقة الائتمانية');

-- تخطي قطع الغيار مؤقتاً لعدم وجود الجدول

-- إضافة إشعارات تجريبية
INSERT INTO Notification (type, message, userId, isRead) VALUES 
('repair_status', 'تم تحديث حالة طلب الإصلاح REP-20241203-002 إلى "قيد التنفيذ"', 1, FALSE),
('new_repair', 'طلب إصلاح جديد REP-20241203-001 من العميل أحمد محمد علي', 2, FALSE),
('payment_received', 'تم استلام دفعة 320 جنيه للفاتورة رقم 1', 5, TRUE),
('low_stock', 'تنبيه: مخزون مروحة تبريد MacBook Air منخفض (5 قطع متبقية)', 1, FALSE),
('repair_completed', 'تم إكمال إصلاح الجهاز REP-20241130-007 بنجاح', 3, TRUE);

COMMIT;
