-- بيانات تجريبية صحيحة لطلبات الإصلاح
-- تتوافق مع مخطط قاعدة البيانات الفعلي
USE FZ;

-- أولاً: إضافة بيانات العملاء إذا لم تكن موجودة
INSERT IGNORE INTO Customer (name, phone, email, address) VALUES 
('أحمد محمد علي', '01012345678', 'ahmed.mohamed@gmail.com', 'شارع التحرير، القاهرة'),
('فاطمة أحمد حسن', '01098765432', 'fatima.ahmed@gmail.com', 'مدينة نصر، القاهرة'),
('محمد علي إبراهيم', '01123456789', 'mohamed.ali@gmail.com', 'شارع الهرم، الجيزة'),
('سارة خالد محمود', '01234567890', 'sara.khaled@gmail.com', 'شارع فؤاد، الإسكندرية'),
('عبدالله سعد أحمد', '01156789012', 'abdullah.saad@gmail.com', 'الشرقية'),
('مريم حسام الدين', '01267890123', 'mariam.hossam@gmail.com', 'القليوبية'),
('يوسف محمد سالم', '01178901234', 'youssef.mohamed@gmail.com', 'الدقهلية'),
('نورا أحمد فتحي', '01289012345', 'nora.ahmed@gmail.com', 'البحيرة'),
('كريم عبدالرحمن', '01190123456', 'karim.abdelrahman@gmail.com', 'الفيوم'),
('هدى محمد رضا', '01201234567', 'hoda.mohamed@gmail.com', 'بني سويف');

-- ثانياً: إضافة الأجهزة
INSERT IGNORE INTO Device (customerId, deviceType, brand, model, serialNumber) VALUES 
(1, 'لابتوب', 'Dell', 'Inspiron 15 3000', 'LP001EG2024'),
(2, 'هاتف ذكي', 'Apple', 'iPhone 13', 'IP002EG2024'),
(3, 'تابلت', 'Samsung', 'Galaxy Tab S8', 'SM003EG2024'),
(4, 'كمبيوتر مكتبي', 'HP', 'Pavilion Desktop', 'HP004EG2024'),
(5, 'لابتوب', 'Lenovo', 'ThinkPad X1', 'LN005EG2024'),
(6, 'لابتوب', 'Apple', 'MacBook Air M1', 'AP006EG2024'),
(7, 'هاتف ذكي', 'Samsung', 'Galaxy S21', 'SS007EG2024'),
(8, 'كمبيوتر مكتبي', 'Dell', 'OptiPlex 7090', 'DL008EG2024'),
(9, 'لابتوب', 'Huawei', 'MateBook D15', 'HW009EG2024'),
(10, 'لابتوب', 'Asus', 'VivoBook 15', 'AS010EG2024');

-- ثالثاً: إضافة طلبات الإصلاح بالحقول الصحيحة
INSERT INTO RepairRequest (
    deviceId, reportedProblem, status, customerId, branchId, technicianId
) VALUES 
(1, 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل', 'RECEIVED', 1, 1, 3),
(2, 'الشاشة مكسورة والهاتف لا يستجيب للمس في بعض المناطق', 'UNDER_REPAIR', 2, 1, 3),
(3, 'البطارية لا تشحن والجهاز يتوقف فجأة حتى مع الشاحن متصل', 'DELIVERED', 3, 2, 3),
(4, 'الجهاز لا يبدأ التشغيل ولا توجد إشارة على الشاشة', 'INSPECTION', 4, 1, 3),
(5, 'لوحة المفاتيح لا تعمل وبعض الأزرار عالقة', 'REJECTED', 5, 2, 3),
(6, 'الجهاز يسخن بشكل مفرط ومروحة التبريد تعمل بصوت عالي', 'UNDER_REPAIR', 6, 1, 3),
(7, 'الكاميرا الخلفية لا تعمل وتطبيق الكاميرا يتوقف', 'READY_FOR_DELIVERY', 7, 3, 3),
(8, 'الصوت لا يعمل وكارت الصوت يحتاج تحديث تعريفات', 'RECEIVED', 8, 1, 3),
(9, 'الواي فاي لا يعمل وكارت الشبكة يحتاج إصلاح', 'AWAITING_APPROVAL', 9, 2, 3),
(10, 'الهارد ديسك يصدر أصوات غريبة والنظام بطيء جداً', 'WAITING_PARTS', 10, 1, 3);

COMMIT;
