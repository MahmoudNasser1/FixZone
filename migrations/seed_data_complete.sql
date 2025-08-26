-- Fix Zone ERP - البيانات التجريبية الكاملة المحدثة
-- ملف شامل للبيانات التجريبية المصرية
-- يجب تطبيقه بعد ملف fixzone_erp_full_schema.sql

USE FZ;

-- تعطيل فحص المفاتيح الأجنبية مؤقتاً
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------
-- 1. المدن والفروع
-- ----------------------

INSERT INTO City (name) VALUES 
('القاهرة'),
('الجيزة'),
('الإسكندرية'),
('أسوان'),
('الأقصر'),
('طنطا'),
('المنصورة'),
('أسيوط'),
('بني سويف'),
('الفيوم');

INSERT INTO Branch (name, address, phone, cityId) VALUES 
('فرع القاهرة الرئيسي', 'شارع التحرير، وسط البلد، القاهرة', '01012345678', 1),
('فرع الجيزة', 'شارع الهرم، الجيزة', '01023456789', 2),
('فرع الإسكندرية', 'شارع الكورنيش، الإسكندرية', '01034567890', 3);

-- ----------------------
-- 2. الأدوار والمستخدمين
-- ----------------------

INSERT INTO Role (name, permissions) VALUES 
('مدير النظام', '{"all": true}'),
('مدير الفرع', '{"repairs": true, "customers": true, "inventory": true}'),
('فني إصلاح', '{"repairs": true, "view_customers": true}'),
('موظف استقبال', '{"customers": true, "create_repairs": true}'),
('محاسب', '{"invoices": true, "payments": true, "reports": true}');

INSERT INTO User (name, email, password, phone, roleId) VALUES 
('أحمد محمد', 'ahmed@fixzone.eg', '$2b$10$hash1', '01012345678', 1),
('فاطمة علي', 'fatma@fixzone.eg', '$2b$10$hash2', '01023456789', 2),
('محمد حسن', 'mohamed@fixzone.eg', '$2b$10$hash3', '01034567890', 3),
('نورا أحمد', 'nora@fixzone.eg', '$2b$10$hash4', '01045678901', 4),
('خالد عبدالله', 'khaled@fixzone.eg', '$2b$10$hash5', '01056789012', 5);

-- ----------------------
-- 3. فئات المتغيرات والخيارات (Variables)
-- ----------------------

-- إدراج فئات المتغيرات
INSERT INTO VariableCategory (code, name, scope) VALUES
('BRAND', 'الماركات', 'DEVICE'),
('ACCESSORY', 'الملحقات', 'REPAIR'),
('DEVICE_TYPE', 'أنواع الأجهزة', 'DEVICE'),
('REPAIR_STATUS', 'حالات الإصلاح', 'REPAIR'),
('PAYMENT_METHOD', 'طرق الدفع', 'PAYMENT');

-- إدراج خيارات الماركات
INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder) VALUES
-- ماركات اللابتوب
(1, 'Apple', 'apple', 'Laptop', 1, 1),
(1, 'Dell', 'dell', 'Laptop', 1, 2),
(1, 'HP', 'hp', 'Laptop', 1, 3),
(1, 'Lenovo', 'lenovo', 'Laptop', 1, 4),
(1, 'Asus', 'asus', 'Laptop', 1, 5),
-- ماركات الهواتف
(1, 'Samsung', 'samsung', 'Mobile', 1, 6),
(1, 'Apple', 'apple', 'Mobile', 1, 7),
(1, 'Huawei', 'huawei', 'Mobile', 1, 8),
(1, 'Xiaomi', 'xiaomi', 'Mobile', 1, 9),
(1, 'Oppo', 'oppo', 'Mobile', 1, 10);

-- إدراج خيارات الملحقات
INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder) VALUES
(2, 'شاحن', 'charger', NULL, 1, 1),
(2, 'سماعات', 'headphones', NULL, 1, 2),
(2, 'كيبورد', 'keyboard', NULL, 1, 3),
(2, 'ماوس', 'mouse', NULL, 1, 4),
(2, 'كابل USB', 'usb_cable', NULL, 1, 5),
(2, 'حقيبة', 'bag', NULL, 1, 6);

-- ----------------------
-- 4. الشركات والعملاء
-- ----------------------

INSERT INTO Company (name, email, phone, address, taxNumber) VALUES 
('شركة التكنولوجيا المتقدمة', 'info@techadvanced.eg', '01012345678', 'القاهرة الجديدة، القاهرة', '123-456-789'),
('مؤسسة الحاسوب الحديث', 'contact@modernpc.eg', '01023456789', 'المعادي، القاهرة', '234-567-890'),
('شركة الأنظمة الذكية', 'hello@smartsystems.eg', '01034567890', 'الدقي، الجيزة', '345-678-901');

INSERT INTO Customer (name, phone, email, address, companyId) VALUES 
('علي محمد أحمد', '01012345678', 'ali.mohamed@gmail.com', 'شارع النيل، القاهرة', 1),
('مريم حسن علي', '01023456789', 'mariam.hassan@gmail.com', 'شارع الجمهورية، الإسكندرية', NULL),
('يوسف عبدالرحمن', '01034567890', 'yousef.abdelrahman@gmail.com', 'شارع الهرم، الجيزة', 2),
('نادية محمود', '01045678901', 'nadia.mahmoud@gmail.com', 'شارع الكورنيش، الإسكندرية', NULL),
('حسام الدين طارق', '01056789012', 'hossam.tarek@gmail.com', 'شارع الجامعة، القاهرة', 3),
('سارة أحمد محمد', '01067890123', 'sara.ahmed@gmail.com', 'شارع الملك فيصل، الجيزة', NULL),
('محمد عبدالله حسن', '01078901234', 'mohamed.abdullah@gmail.com', 'شارع السلام، القاهرة', 1),
('ليلى إبراهيم', '01089012345', 'laila.ibrahim@gmail.com', 'شارع المحطة، الإسكندرية', NULL);


-- ----------------------
-- 5. الأجهزة مع كلمات المرور
-- ----------------------

INSERT INTO Device (customerId, deviceType, brand, model, cpu, gpu, ram, storage, serialNumber, devicePassword) VALUES
(1, 'Laptop', 'Dell', 'Inspiron 15 3000', 'Intel Core i5-1035G1', 'Intel UHD Graphics', '8GB', '256GB SSD', 'DL123456789', 'password123'),
(2, 'Phone', 'Samsung', 'Galaxy A52', 'Snapdragon 720G', 'Adreno 618', '6GB', '128GB', 'SM987654321', '1234'),
(3, 'Laptop', 'HP', 'Pavilion 15', 'AMD Ryzen 5 4600H', 'GTX 1650', '16GB', '512GB SSD', 'HP456789123', 'hp2023'),
(4, 'Phone', 'Apple', 'iPhone 12', 'A14 Bionic', 'Apple GPU', '4GB', '128GB', 'IP789123456', '0000'),
(5, 'Laptop', 'Lenovo', 'ThinkPad E15', 'Intel Core i7-1165G7', 'Intel Iris Xe', '16GB', '1TB SSD', 'LN321654987', 'lenovo456'),
(6, 'Phone', 'Xiaomi', 'Redmi Note 10', 'Snapdragon 678', 'Adreno 612', '4GB', '64GB', 'MI654987321', '9999'),
(7, 'Laptop', 'Asus', 'VivoBook 15', 'Intel Core i3-1115G4', 'Intel UHD Graphics', '8GB', '256GB SSD', 'AS147258369', 'asus789'),
(8, 'Phone', 'Oppo', 'A74', 'Snapdragon 662', 'Adreno 610', '6GB', '128GB', 'OP963852741', '1111');

-- ----------------------
-- 6. طلبات الإصلاح
-- ----------------------

INSERT INTO RepairRequest (deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, trackingToken) VALUES
(1, 'الجهاز لا يعمل عند الضغط على زر التشغيل', 'تم فحص الجهاز - مشكلة في البطارية', 'UNDER_REPAIR', 1, 1, 3, 'rq001abc123def456'),
(2, 'الشاشة مكسورة والهاتف لا يستجيب للمس', 'يحتاج استبدال شاشة كاملة', 'AWAITING_APPROVAL', 2, 1, 3, 'rq002def456ghi789'),
(3, 'الجهاز بطيء جداً ويتعلق كثيراً', 'تم تنظيف النظام وإعادة تثبيت Windows', 'READY_FOR_DELIVERY', 3, 2, 3, 'rq003ghi789jkl012'),
(4, 'الهاتف لا يشحن', 'مشكلة في منفذ الشحن', 'INSPECTION', 4, 1, 3, 'rq004jkl012mno345'),
(5, 'الكيبورد لا يعمل', 'تم استبدال الكيبورد', 'DELIVERED', 5, 1, 3, 'rq005mno345pqr678'),
(6, 'الهاتف يعيد التشغيل تلقائياً', 'مشكلة في البرمجيات - تم إصلاحها', 'READY_FOR_DELIVERY', 6, 2, 3, 'rq006pqr678stu901'),
(7, 'الشاشة تظهر خطوط ملونة', 'يحتاج استبدال شاشة LCD', 'AWAITING_APPROVAL', 7, 1, 3, 'rq007stu901vwx234'),
(8, 'الكاميرا لا تعمل', 'تم إصلاح مشكلة الكاميرا', 'UNDER_REPAIR', 8, 2, 3, 'rq008vwx234yzab567');

-- ----------------------
-- 7. المخازن والمخزون
-- ----------------------

INSERT INTO Warehouse (name) VALUES 
('المخزن الرئيسي - القاهرة'),
('مخزن فرع الجيزة'),
('مخزن فرع الإسكندرية');

INSERT INTO InventoryItem (sku, name, type, purchasePrice, sellingPrice, serialNumber) VALUES
('LCD-IP12-001', 'شاشة iPhone 12', 'Screen', 800.00, 1200.00, 'LCD123456'),
('BAT-DL-001', 'بطارية Dell Inspiron', 'Battery', 150.00, 250.00, 'BAT789123'),
('KB-HP-001', 'كيبورد HP Pavilion', 'Keyboard', 80.00, 150.00, 'KB456789'),
('CHG-SAM-001', 'شاحن Samsung الأصلي', 'Charger', 50.00, 100.00, 'CHG456123'),
('SCR-IP12-001', 'واقي شاشة iPhone 12', 'Screen Protector', 20.00, 50.00, 'SCR789456'),
('MEM-8GB-001', 'ذاكرة RAM 8GB DDR4', 'Memory', 200.00, 350.00, 'MEM123789'),
('SSD-256-001', 'قرص SSD 256GB', 'Storage', 300.00, 500.00, 'SSD456123'),
('FAN-LP-001', 'مروحة تبريد لابتوب', 'Cooling Fan', 80.00, 150.00, 'FAN789123'),
('CHG-SAM-002', 'منفذ شحن Samsung', 'Charging Port', 50.00, 100.00, 'CHG321654'),
('LCD-SAM-A52', 'شاشة Samsung A52', 'Screen', 400.00, 700.00, 'LCD987654'),
('CAM-OP-001', 'كاميرا Oppo A74', 'Camera', 120.00, 200.00, 'CAM147258'),
('SSD-256-002', 'SSD 256GB', 'Storage', 300.00, 500.00, 'SSD369258'),
('RAM-8GB-DDR4', 'رام 8GB DDR4', 'Memory', 200.00, 350.00, 'RAM741852');

INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel) VALUES
(1, 1, 15, 5),
(2, 1, 8, 3),
(3, 1, 12, 4),
(4, 1, 20, 5),
(5, 2, 10, 3),
(6, 2, 6, 2),
(7, 1, 25, 8),
(8, 1, 18, 6);

-- ----------------------
-- 8. الخدمات
-- ----------------------

INSERT INTO Service (name, description, basePrice, isActive) VALUES
('تنظيف الجهاز', 'تنظيف شامل للجهاز من الداخل والخارج', 50.00, 1),
('إعادة تثبيت النظام', 'فورمات وإعادة تثبيت نظام التشغيل', 100.00, 1),
('استبدال الشاشة', 'استبدال شاشة الجهاز بشاشة جديدة', 200.00, 1),
('إصلاح الكيبورد', 'إصلاح أو استبدال الكيبورد', 80.00, 1),
('إصلاح البطارية', 'استبدال البطارية القديمة', 150.00, 1),
('إصلاح منفذ الشحن', 'إصلاح أو استبدال منفذ الشحن', 75.00, 1),
('إصلاح الكاميرا', 'إصلاح مشاكل الكاميرا', 120.00, 1),
('ترقية الذاكرة', 'إضافة أو استبدال الرام', 180.00, 1);

-- ----------------------
-- 9. الفواتير والمدفوعات
-- ----------------------

INSERT INTO Invoice (totalAmount, amountPaid, status, repairRequestId, currency, taxAmount) VALUES
(350.00, 350.00, 'PAID', 5, 'EGP', 50.00),
(750.00, 400.00, 'PARTIALLY_PAID', 3, 'EGP', 100.00),
(1400.00, 0.00, 'PENDING', 2, 'EGP', 200.00),
(900.00, 900.00, 'PAID', 6, 'EGP', 130.00);

INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, serviceId, inventoryItemId, description, itemType) VALUES
(1, 150.00, 150.00, 1, 5, 2, 'استبدال بطارية Dell', 'part'),
(1, 80.00, 80.00, 1, 4, 3, 'إصلاح الكيبورد', 'service'),
(1, 100.00, 100.00, 2, 2, NULL, 'إعادة تثبيت النظام', 'service'),
(1, 500.00, 500.00, 2, NULL, 7, 'ترقية SSD', 'part'),
(1, 1200.00, 1200.00, 3, 3, 1, 'استبدال شاشة iPhone', 'part'),
(1, 120.00, 120.00, 4, 7, 6, 'إصلاح الكاميرا', 'service');

INSERT INTO Payment (amount, paymentMethod, invoiceId, userId, currency) VALUES
(350.00, 'CASH', 1, 4, 'EGP'),
(400.00, 'CARD', 2, 4, 'EGP'),
(900.00, 'CASH', 4, 4, 'EGP');

-- ----------------------
-- 10. قوالب الفواتير
-- ----------------------

INSERT INTO InvoiceTemplate (name, type, description, isDefault, headerHTML, footerHTML, stylesCSS, settings) VALUES 
(
  'القالب الأساسي', 
  'standard', 
  'قالب فاتورة أساسي للاستخدام العام',
  TRUE,
  '<div class="company-info"><h1>{{companyName}}</h1><p>{{companyAddress}}</p><p>هاتف: {{companyPhone}} | إيميل: {{companyEmail}}</p></div>',
  '<p>شكرًا لتعاملكم معنا</p><p>{{footerText}}</p>',
  '.invoice-container { max-width: 800px; margin: 0 auto; } .header { border-bottom: 2px solid #333; padding-bottom: 20px; }',
  JSON_OBJECT(
    'companyName', 'شركة فيكس زون',
    'companyAddress', 'القاهرة، جمهورية مصر العربية',
    'companyPhone', '+20-10-1234567',
    'companyEmail', 'info@fixzone.eg',
    'currency', 'ج.م',
    'footerText', 'جميع الحقوق محفوظة © 2025'
  )
),
(
  'قالب ضريبي', 
  'tax', 
  'قالب فاتورة ضريبية متوافق مع متطلبات الضريبة المصرية',
  TRUE,
  '<div class="company-info"><h1>{{companyName}}</h1><p>الرقم الضريبي: {{taxNumber}}</p><p>{{companyAddress}}</p></div>',
  '<p>فاتورة ضريبية معتمدة</p><p>{{footerText}}</p>',
  '.tax-info { background: #f0f8ff; padding: 10px; border: 1px solid #0066cc; margin: 10px 0; }',
  JSON_OBJECT(
    'companyName', 'شركة فيكس زون',
    'taxNumber', '123-456-789',
    'companyAddress', 'القاهرة، جمهورية مصر العربية',
    'currency', 'ج.م',
    'showTaxDetails', true,
    'footerText', 'فاتورة ضريبية معتمدة'
  )
),
(
  'إيصال بسيط', 
  'receipt', 
  'إيصال بسيط للمدفوعات السريعة',
  TRUE,
  '<div class="receipt-header"><h2>إيصال استلام</h2><p>{{companyName}}</p></div>',
  '<p>تم الاستلام بتاريخ: {{currentDate}}</p>',
  '.receipt-header { text-align: center; border-bottom: 1px dashed #333; } .receipt-container { max-width: 400px; font-size: 14px; }',
  JSON_OBJECT(
    'companyName', 'فيكس زون',
    'currency', 'ج.م',
    'showMinimalInfo', true
  )
);

-- ----------------------
-- 11. الموردين وأوامر الشراء
-- ----------------------

INSERT INTO Vendor (name, email, phone) VALUES
('شركة قطع الغيار المتقدمة', 'sales@advancedparts.eg', '01012345678'),
('مؤسسة التكنولوجيا الحديثة', 'info@moderntech.eg', '01023456789'),
('شركة الإلكترونيات المصرية', 'contact@egyptelectronics.eg', '01034567890');

INSERT INTO PurchaseOrder (status, vendorId, approvalStatus, approvedById) VALUES
('PENDING', 1, 'APPROVED', 1),
('COMPLETED', 2, 'APPROVED', 1),
('PENDING', 3, 'PENDING', NULL);

INSERT INTO PurchaseOrderItem (quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId) VALUES
(10, 800.00, 8000.00, 1, 1),
(5, 150.00, 750.00, 1, 2),
(15, 400.00, 6000.00, 2, 5),
(8, 120.00, 960.00, 2, 6),
(20, 300.00, 6000.00, 3, 7);

-- ----------------------
-- 12. الإعدادات العامة
-- ----------------------

INSERT INTO SystemSetting (`key`, value, type, description) VALUES
('company_name', 'شركة فيكس زون', 'STRING', 'اسم الشركة'),
('company_address', 'القاهرة، جمهورية مصر العربية', 'STRING', 'عنوان الشركة'),
('company_phone', '+20-10-1234567', 'STRING', 'هاتف الشركة'),
('company_email', 'info@fixzone.eg', 'STRING', 'إيميل الشركة'),
('default_currency', 'EGP', 'STRING', 'العملة الافتراضية'),
('tax_rate', '14', 'NUMBER', 'معدل الضريبة بالنسبة المئوية'),
('low_stock_threshold', '5', 'NUMBER', 'حد التنبيه لنقص المخزون'),
('auto_generate_invoice', 'true', 'BOOLEAN', 'إنشاء فاتورة تلقائياً عند اكتمال الإصلاح');

-- إعادة تفعيل فحص المفاتيح الأجنبية
SET FOREIGN_KEY_CHECKS = 1;

-- End of seed data
