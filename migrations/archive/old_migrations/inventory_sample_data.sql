-- =====================================================
-- FixZone ERP - Inventory Module Sample Data
-- بيانات تجريبية واقعية - نظام المخزون
-- التاريخ: 2 أكتوبر 2025
-- =====================================================

USE FZ;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- =====================================================
-- 1. موردين تجريبيين (8 موردين)
-- =====================================================

INSERT INTO Vendor (name, contactPerson, phone, email, address, taxNumber, paymentTerms, creditLimit, status, rating, country, city, website, createdAt) VALUES
('شركة الإلكترونيات المتقدمة', 'أحمد محمد علي', '01001234567', 'info@advanced-electronics.com', 'القاهرة - مدينة نصر - شارع عباس العقاد', '123-456-789', 'net30', 100000.00, 'active', 4.5, 'Egypt', 'Cairo', 'https://advanced-electronics.com', NOW()),

('شركة قطع الغيار الحديثة', 'خالد عبد الله', '01109876543', 'sales@modern-parts.com', 'الجيزة - المهندسين - شارع جامعة الدول', '234-567-890', 'net30', 75000.00, 'active', 4.2, 'Egypt', 'Giza', 'https://modern-parts.com', NOW()),

('الشركة العالمية للشاشات', 'محمد حسن', '01201234567', 'contact@global-screens.com', 'الإسكندرية - سموحة - شارع الجيش', '345-678-901', 'net45', 150000.00, 'active', 4.8, 'Egypt', 'Alexandria', 'https://global-screens.com', NOW()),

('مؤسسة النور للبطاريات', 'عمر السيد', '01151234567', 'info@alnoor-batteries.com', 'القاهرة - شبرا - شارع شبرا', '456-789-012', 'net30', 50000.00, 'active', 4.0, 'Egypt', 'Cairo', NULL, NOW()),

('شركة الأدوات والخامات', 'ياسر أحمد', '01001122334', 'sales@tools-supplies.com', 'القاهرة - وسط البلد - شارع طلعت حرب', '567-890-123', 'net15', 30000.00, 'active', 3.8, 'Egypt', 'Cairo', NULL, NOW()),

('الشركة المصرية للكابلات', 'سامي محمود', '01101122334', 'info@egypt-cables.com', 'القاهرة - العباسية - شارع رمسيس', '678-901-234', 'net30', 60000.00, 'active', 4.3, 'Egypt', 'Cairo', 'https://egypt-cables.com', NOW()),

('مستورد الاكسسوارات الذهبي', 'حسام الدين', '01201122334', 'contact@golden-accessories.com', 'القاهرة - الزمالك - شارع 26 يوليو', '789-012-345', 'cash', 40000.00, 'active', 3.9, 'Egypt', 'Cairo', NULL, NOW()),

('شركة التكنولوجيا المتطورة', 'وليد فتحي', '01151122334', 'info@advanced-tech.com', 'الإسكندرية - المنتزه - كورنيش المنتزه', '890-123-456', 'net30', 120000.00, 'active', 4.6, 'Egypt', 'Alexandria', 'https://advanced-tech.com', NOW());

-- =====================================================
-- 2. أصناف مخزنية متنوعة (30 صنف)
-- =====================================================

-- تحديث الأصناف الموجودة
UPDATE InventoryItem 
SET 
  barcode = CONCAT('BAR', LPAD(id, 10, '0')),
  partNumber = CONCAT('PN-', LPAD(id, 6, '0')),
  brand = CASE id
    WHEN 1 THEN 'Samsung'
    WHEN 2 THEN 'Panasonic'
    WHEN 3 THEN 'Generic'
    ELSE 'Generic'
  END,
  model = CASE id
    WHEN 1 THEN 'A50'
    WHEN 2 THEN 'Li-Ion 3.7V'
    WHEN 3 THEN 'Standard'
    ELSE NULL
  END,
  `condition` = 'new',
  reorderPoint = 10,
  reorderQuantity = 50,
  leadTimeDays = 7,
  warrantyPeriodDays = 90,
  preferredVendorId = CASE id
    WHEN 1 THEN 3  -- شركة الشاشات
    WHEN 2 THEN 4  -- شركة البطاريات
    WHEN 3 THEN 5  -- شركة الأدوات
    ELSE NULL
  END
WHERE id IN (1, 2, 3);

-- إضافة أصناف جديدة
INSERT INTO InventoryItem (name, sku, barcode, partNumber, brand, model, categoryId, `condition`, purchasePrice, sellingPrice, unit, minStockLevel, maxStockLevel, reorderPoint, reorderQuantity, leadTimeDays, warrantyPeriodDays, preferredVendorId, description, weight, dimensions, isActive) VALUES

-- شاشات (10 أصناف)
('شاشة LCD iPhone 12', 'PART-004', 'BAR0000000004', 'PN-000004', 'Apple', 'iPhone 12', 1, 'new', 280.00, 450.00, 'قطعة', 5, 100, 10, 30, 14, 90, 3, 'شاشة LCD أصلية لـ iPhone 12', 0.08, '15x7x0.5', TRUE),
('شاشة LCD iPhone 11', 'PART-005', 'BAR0000000005', 'PN-000005', 'Apple', 'iPhone 11', 1, 'new', 250.00, 400.00, 'قطعة', 5, 100, 10, 30, 14, 90, 3, 'شاشة LCD أصلية لـ iPhone 11', 0.08, '15x7x0.5', TRUE),
('شاشة OLED Samsung S21', 'PART-006', 'BAR0000000006', 'PN-000006', 'Samsung', 'S21', 1, 'new', 350.00, 550.00, 'قطعة', 3, 50, 8, 20, 14, 90, 3, 'شاشة OLED أصلية', 0.09, '15x7x0.5', TRUE),
('شاشة LCD Xiaomi Redmi Note 10', 'PART-007', 'BAR0000000007', 'PN-000007', 'Xiaomi', 'Redmi Note 10', 1, 'new', 120.00, 200.00, 'قطعة', 10, 150, 15, 50, 7, 60, 3, 'شاشة LCD كاملة', 0.07, '16x7x0.5', TRUE),
('شاشة LCD Oppo A53', 'PART-008', 'BAR0000000008', 'PN-000008', 'Oppo', 'A53', 1, 'new', 100.00, 170.00, 'قطعة', 10, 150, 15, 50, 7, 60, 3, 'شاشة LCD', 0.07, '16x7x0.5', TRUE),
('شاشة لابتوب HP 15.6"', 'PART-009', 'BAR0000000009', 'PN-000009', 'HP', '15.6 inch', 1, 'new', 450.00, 700.00, 'قطعة', 3, 30, 5, 15, 21, 180, 3, 'شاشة لابتوب HP 15.6 بوصة', 0.5, '35x25x0.5', TRUE),
('شاشة لابتوب Dell 14"', 'PART-010', 'BAR0000000010', 'PN-000010', 'Dell', '14 inch', 1, 'new', 420.00, 680.00, 'قطعة', 3, 30, 5, 15, 21, 180, 3, 'شاشة لابتوب Dell 14 بوصة', 0.45, '32x22x0.5', TRUE),
('شاشة iPad Pro 12.9"', 'PART-011', 'BAR0000000011', 'PN-000011', 'Apple', 'iPad Pro 12.9', 1, 'new', 1200.00, 1800.00, 'قطعة', 2, 20, 3, 10, 30, 180, 3, 'شاشة iPad Pro أصلية', 0.3, '28x19x0.5', TRUE),
('شاشة تاتش Samsung Tab A7', 'PART-012', 'BAR0000000012', 'PN-000012', 'Samsung', 'Tab A7', 1, 'new', 180.00, 300.00, 'قطعة', 5, 50, 8, 25, 14, 90, 3, 'شاشة تاتش للتابلت', 0.2, '25x16x0.5', TRUE),
('شاشة زجاج خارجي فقط', 'PART-013', 'BAR0000000013', 'PN-000013', 'Generic', 'Universal', 1, 'new', 30.00, 60.00, 'قطعة', 20, 200, 30, 100, 7, 30, 1, 'زجاج خارجي للهواتف', 0.02, '15x7x0.1', TRUE),

-- بطاريات (7 أصناف)
('بطارية iPhone 12', 'PART-014', 'BAR0000000014', 'PN-000014', 'Apple', 'iPhone 12', 2, 'new', 150.00, 250.00, 'قطعة', 10, 150, 15, 50, 10, 90, 4, 'بطارية أصلية 2815 mAh', 0.04, '10x5x0.3', TRUE),
('بطارية iPhone 11', 'PART-015', 'BAR0000000015', 'PN-000015', 'Apple', 'iPhone 11', 2, 'new', 140.00, 230.00, 'قطعة', 10, 150, 15, 50, 10, 90, 4, 'بطارية أصلية 3110 mAh', 0.04, '10x5x0.3', TRUE),
('بطارية Samsung S21', 'PART-016', 'BAR0000000016', 'PN-000016', 'Samsung', 'S21', 2, 'new', 120.00, 200.00, 'قطعة', 10, 150, 15, 50, 10, 90, 4, 'بطارية أصلية 4000 mAh', 0.045, '11x5x0.3', TRUE),
('بطارية لابتوب HP', 'PART-017', 'BAR0000000017', 'PN-000017', 'HP', 'ProBook', 2, 'new', 350.00, 550.00, 'قطعة', 5, 50, 8, 20, 21, 180, 4, 'بطارية لابتوب HP أصلية', 0.3, '20x10x2', TRUE),
('بطارية لابتوب Dell', 'PART-018', 'BAR0000000018', 'PN-000018', 'Dell', 'Latitude', 2, 'new', 380.00, 600.00, 'قطعة', 5, 50, 8, 20, 21, 180, 4, 'بطارية لابتوب Dell أصلية', 0.32, '21x10x2', TRUE),
('بطارية iPad', 'PART-019', 'BAR0000000019', 'PN-000019', 'Apple', 'iPad 9th Gen', 2, 'new', 200.00, 350.00, 'قطعة', 8, 80, 12, 30, 14, 120, 4, 'بطارية iPad أصلية', 0.15, '18x13x0.5', TRUE),
('بطارية عامة Smartphone', 'PART-020', 'BAR0000000020', 'PN-000020', 'Generic', 'Universal', 2, 'new', 60.00, 120.00, 'قطعة', 20, 200, 30, 100, 7, 60, 4, 'بطارية متوافقة', 0.03, '9x5x0.3', TRUE),

-- أدوات وخامات (5 أصناف)
('مكينة لحام هواتف', 'PART-021', 'BAR0000000021', 'PN-000021', 'QUICK', '861DW', 3, 'new', 1500.00, 2300.00, 'قطعة', 2, 10, 3, 5, 30, 365, 5, 'محطة لحام احترافية', 5.0, '40x30x30', TRUE),
('سلك قصدير', 'PART-022', 'BAR0000000022', 'PN-000022', 'Generic', '0.8mm', 3, 'new', 50.00, 90.00, 'بكرة', 10, 100, 15, 50, 7, 0, 5, 'سلك قصدير للحام', 0.5, '10x10x5', TRUE),
('فلكس لحام (Flux)', 'PART-023', 'BAR0000000023', 'PN-000023', 'AMTECH', 'NC-559', 3, 'new', 80.00, 150.00, 'علبة', 10, 80, 15, 40, 14, 0, 5, 'فلكس لحام احترافي', 0.1, '5x5x5', TRUE),
('مفكات دقيقة (طقم)', 'PART-024', 'BAR0000000024', 'PN-000024', 'Jakemy', 'JM-8166', 3, 'new', 120.00, 200.00, 'طقم', 5, 50, 8, 20, 14, 180, 5, 'طقم مفكات احترافي 45 قطعة', 0.8, '20x10x5', TRUE),
('سبراي تنظيف', 'PART-025', 'BAR0000000025', 'PN-000025', 'CRC', '2-26', 3, 'new', 40.00, 80.00, 'علبة', 15, 100, 20, 50, 10, 0, 5, 'سبراي تنظيف للإلكترونيات', 0.3, '15x5x5', TRUE),

-- كابلات (4 أصناف)
('كابل شحن Type-C', 'PART-026', 'BAR0000000026', 'PN-000026', 'Anker', 'PowerLine', 4, 'new', 30.00, 60.00, 'قطعة', 30, 300, 50, 150, 7, 180, 6, 'كابل شحن سريع Type-C', 0.05, '20x10x2', TRUE),
('كابل Lightning', 'PART-027', 'BAR0000000027', 'PN-000027', 'Apple', 'Original', 4, 'new', 80.00, 150.00, 'قطعة', 20, 200, 30, 100, 10, 365, 6, 'كابل Lightning أصلي', 0.04, '15x10x2', TRUE),
('كابل Micro USB', 'PART-028', 'BAR0000000028', 'PN-000028', 'Samsung', 'Original', 4, 'new', 20.00, 45.00, 'قطعة', 30, 300, 50, 150, 7, 90, 6, 'كابل Micro USB أصلي', 0.03, '15x10x2', TRUE),
('كابل HDMI', 'PART-029', 'BAR0000000029', 'PN-000029', 'Generic', '2.0', 4, 'new', 35.00, 70.00, 'قطعة', 15, 150, 25, 80, 7, 90, 6, 'كابل HDMI 2.0 - 2 متر', 0.15, '25x15x3', TRUE),

-- اكسسوارات (4 أصناف)
('جراب سيليكون', 'PART-030', 'BAR0000000030', 'PN-000030', 'Generic', 'Universal', 6, 'new', 10.00, 25.00, 'قطعة', 50, 500, 80, 200, 5, 30, 7, 'جراب سيليكون متنوع', 0.02, '15x8x1', TRUE),
('واقي شاشة زجاج', 'PART-031', 'BAR0000000031', 'PN-000031', 'Generic', '9H', 6, 'new', 8.00, 20.00, 'قطعة', 100, 1000, 150, 500, 5, 0, 7, 'واقي شاشة زجاجي', 0.01, '15x8x0.5', TRUE),
('شاحن حائط سريع', 'PART-032', 'BAR0000000032', 'PN-000032', 'Anker', 'PowerPort', 6, 'new', 80.00, 150.00, 'قطعة', 20, 200, 30, 100, 7, 365, 7, 'شاحن سريع 20W', 0.1, '10x5x3', TRUE),
('سماعات Bluetooth', 'PART-033', 'BAR0000000033', 'PN-000033', 'Generic', 'TWS', 6, 'new', 50.00, 120.00, 'قطعة', 15, 150, 25, 80, 10, 180, 7, 'سماعات لاسلكية', 0.05, '8x8x3', TRUE);

-- =====================================================
-- 3. مستويات المخزون (StockLevel)
-- =====================================================

-- توزيع الأصناف على المخازن الثلاثة
INSERT INTO StockLevel (inventoryItemId, warehouseId, currentQuantity, reservedQuantity) VALUES
-- المستودع الرئيسي (القاهرة) - معظم الأصناف
(1, 1, 45, 5),   -- شاشة LCD Samsung A50
(2, 1, 90, 10),  -- بطارية ليثيوم
(3, 1, 30, 0),   -- خامات لحام
(4, 1, 35, 3),   -- iPhone 12 LCD
(5, 1, 28, 2),   -- iPhone 11 LCD
(6, 1, 20, 1),   -- Samsung S21 OLED
(7, 1, 42, 5),   -- Xiaomi LCD
(8, 1, 38, 4),   -- Oppo LCD
(9, 1, 8, 1),    -- HP Laptop Screen
(10, 1, 6, 0),   -- Dell Laptop Screen
(11, 1, 3, 0),   -- iPad Pro Screen
(12, 1, 15, 2),  -- Samsung Tab Screen
(13, 1, 85, 10), -- زجاج خارجي
(14, 1, 48, 6),  -- iPhone 12 Battery
(15, 1, 44, 5),  -- iPhone 11 Battery
(16, 1, 52, 7),  -- Samsung S21 Battery
(17, 1, 12, 1),  -- HP Laptop Battery
(18, 1, 10, 1),  -- Dell Laptop Battery
(19, 1, 18, 2),  -- iPad Battery
(20, 1, 95, 12), -- بطارية عامة
(21, 1, 4, 0),   -- مكينة لحام
(22, 1, 38, 5),  -- سلك قصدير
(23, 1, 32, 4),  -- فلكس
(24, 1, 18, 2),  -- مفكات
(25, 1, 45, 6),  -- سبراي تنظيف
(26, 1, 145, 20),-- Type-C Cable
(27, 1, 88, 12), -- Lightning Cable
(28, 1, 135, 18),-- Micro USB
(29, 1, 52, 7),  -- HDMI
(30, 1, 280, 35),-- جراب
(31, 1, 520, 65),-- واقي شاشة
(32, 1, 65, 8),  -- شاحن سريع
(33, 1, 42, 5),  -- سماعات

-- مستودع الجيزة - مخزون أقل
(1, 2, 20, 2),
(2, 2, 40, 5),
(4, 2, 15, 1),
(5, 2, 12, 1),
(7, 2, 18, 2),
(13, 2, 35, 4),
(14, 2, 22, 3),
(15, 2, 20, 2),
(20, 2, 45, 6),
(26, 2, 60, 8),
(27, 2, 35, 4),
(28, 2, 55, 7),
(30, 2, 120, 15),
(31, 2, 200, 25),

-- مستودع الإسكندرية - مخزون محدود
(1, 3, 15, 1),
(2, 3, 30, 3),
(4, 3, 10, 1),
(7, 3, 15, 2),
(13, 3, 25, 3),
(14, 3, 18, 2),
(20, 3, 35, 4),
(26, 3, 45, 6),
(28, 3, 40, 5),
(30, 3, 90, 10),
(31, 3, 150, 18);

-- =====================================================
-- 4. حركات مخزنية تجريبية (StockMovement)
-- =====================================================

-- حركات إدخال (استلام من موردين)
INSERT INTO StockMovement (inventoryItemId, warehouseId, movementType, quantity, unitCost, totalCost, referenceType, referenceId, notes, createdBy, createdAt) VALUES
(4, 1, 'in', 50, 280.00, 14000.00, 'purchase_order', 1, 'استلام أمر شراء PO-001', 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(5, 1, 'in', 40, 250.00, 10000.00, 'purchase_order', 1, 'استلام أمر شراء PO-001', 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(14, 1, 'in', 60, 150.00, 9000.00, 'purchase_order', 2, 'استلام أمر شراء PO-002', 1, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(15, 1, 'in', 55, 140.00, 7700.00, 'purchase_order', 2, 'استلام أمر شراء PO-002', 1, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(26, 1, 'in', 200, 30.00, 6000.00, 'purchase_order', 3, 'استلام كابلات Type-C', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(27, 1, 'in', 120, 80.00, 9600.00, 'purchase_order', 3, 'استلام كابلات Lightning', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(30, 1, 'in', 350, 10.00, 3500.00, 'purchase_order', 4, 'استلام جرابات', 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(31, 1, 'in', 600, 8.00, 4800.00, 'purchase_order', 4, 'استلام واقيات شاشة', 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),

-- حركات صرف (لطلبات صيانة)
(1, 1, 'out', 5, 150.00, 750.00, 'repair_request', 1, 'صرف لطلب صيانة', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 1, 'out', 10, 80.00, 800.00, 'repair_request', 2, 'صرف لطلب صيانة', 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(4, 1, 'out', 12, 280.00, 3360.00, 'repair_request', 3, 'صرف شاشات iPhone 12', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(14, 1, 'out', 6, 150.00, 900.00, 'repair_request', 4, 'صرف بطاريات iPhone 12', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- حركات نقل بين المخازن
(1, 1, 'transfer_out', 10, 150.00, 1500.00, 'stock_transfer', 1, 'نقل للجيزة', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 1, 'transfer_out', 15, 80.00, 1200.00, 'stock_transfer', 1, 'نقل للجيزة', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- حركات تسوية (جرد)
(13, 1, 'adjustment', -5, 30.00, -150.00, 'stock_count', 1, 'تسوية جرد - نقص', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(20, 1, 'adjustment', 3, 60.00, 180.00, 'stock_count', 1, 'تسوية جرد - زيادة', 1, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- =====================================================
-- 5. ربط الموردين بالأصناف (InventoryItemVendor)
-- =====================================================

INSERT INTO InventoryItemVendor (inventoryItemId, vendorId, vendorPartNumber, unitPrice, minOrderQuantity, leadTimeDays, isPrimary, lastPurchaseDate, lastPurchasePrice) VALUES
-- شاشات
(1, 3, 'SCR-SAM-A50', 145.00, 10, 7, TRUE, DATE_SUB(NOW(), INTERVAL 20 DAY), 145.00),
(4, 3, 'SCR-APL-IP12', 275.00, 5, 14, TRUE, DATE_SUB(NOW(), INTERVAL 15 DAY), 280.00),
(5, 3, 'SCR-APL-IP11', 245.00, 5, 14, TRUE, DATE_SUB(NOW(), INTERVAL 15 DAY), 250.00),
(6, 3, 'SCR-SAM-S21', 340.00, 3, 14, TRUE, NULL, NULL),
(7, 1, 'SCR-XIA-RN10', 115.00, 10, 7, TRUE, NULL, NULL),
(9, 1, 'SCR-HP-156', 440.00, 3, 21, TRUE, NULL, NULL),
(10, 1, 'SCR-DELL-14', 410.00, 3, 21, TRUE, NULL, NULL),

-- بطاريات
(2, 4, 'BAT-LI-37V', 75.00, 20, 10, TRUE, DATE_SUB(NOW(), INTERVAL 25 DAY), 80.00),
(14, 4, 'BAT-APL-IP12', 145.00, 10, 10, TRUE, DATE_SUB(NOW(), INTERVAL 12 DAY), 150.00),
(15, 4, 'BAT-APL-IP11', 135.00, 10, 10, TRUE, DATE_SUB(NOW(), INTERVAL 12 DAY), 140.00),
(16, 4, 'BAT-SAM-S21', 115.00, 10, 10, TRUE, NULL, NULL),
(17, 4, 'BAT-HP-PRO', 340.00, 5, 21, TRUE, NULL, NULL),
(19, 4, 'BAT-APL-IPAD', 195.00, 8, 14, TRUE, NULL, NULL),

-- أدوات
(3, 5, 'TOOL-SOLD-STD', 195.00, 5, 7, TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY), 200.00),
(21, 5, 'TOOL-QUICK-861', 1480.00, 1, 30, TRUE, NULL, NULL),
(22, 5, 'TOOL-SOLDER-08', 48.00, 10, 7, TRUE, NULL, NULL),
(24, 5, 'TOOL-JAKEMY-8166', 115.00, 5, 14, TRUE, NULL, NULL),

-- كابلات
(26, 6, 'CAB-TYPEC-ANK', 28.00, 30, 7, TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY), 30.00),
(27, 6, 'CAB-LIGHT-APL', 75.00, 20, 10, TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY), 80.00),
(28, 6, 'CAB-MICRO-SAM', 18.00, 30, 7, TRUE, NULL, NULL),
(29, 6, 'CAB-HDMI-20', 32.00, 15, 7, TRUE, NULL, NULL),

-- اكسسوارات
(30, 7, 'ACC-CASE-SIL', 9.00, 50, 5, TRUE, DATE_SUB(NOW(), INTERVAL 8 DAY), 10.00),
(31, 7, 'ACC-GLASS-9H', 7.00, 100, 5, TRUE, DATE_SUB(NOW(), INTERVAL 8 DAY), 8.00),
(32, 7, 'ACC-CHRG-20W', 75.00, 20, 7, TRUE, NULL, NULL),
(33, 7, 'ACC-TWS-BT', 48.00, 15, 10, TRUE, NULL, NULL);

-- =====================================================
-- 6. تحديث إحصائيات الموردين
-- =====================================================

-- تحديث إجمالي المشتريات وآخر تاريخ شراء
UPDATE Vendor v
SET 
  totalPurchases = COALESCE((
    SELECT SUM(unitPrice * minOrderQuantity)
    FROM InventoryItemVendor 
    WHERE vendorId = v.id
  ), 0),
  lastPurchaseDate = (
    SELECT MAX(lastPurchaseDate)
    FROM InventoryItemVendor 
    WHERE vendorId = v.id
  );

-- =====================================================
-- النهاية - التحقق
-- =====================================================

-- عرض الإحصائيات
SELECT 
  'إحصائيات البيانات التجريبية' as info,
  (SELECT COUNT(*) FROM Vendor WHERE deletedAt IS NULL) as total_vendors,
  (SELECT COUNT(*) FROM InventoryItem WHERE deletedAt IS NULL) as total_items,
  (SELECT COUNT(DISTINCT inventoryItemId) FROM StockLevel) as items_with_stock,
  (SELECT COUNT(*) FROM StockLevel) as stock_levels,
  (SELECT COUNT(*) FROM StockMovement) as stock_movements,
  (SELECT COUNT(*) FROM InventoryItemVendor) as item_vendor_links,
  (SELECT SUM(currentQuantity * purchasePrice) FROM StockLevel sl JOIN InventoryItem i ON sl.inventoryItemId = i.id) as total_stock_value;

SET FOREIGN_KEY_CHECKS = 1;

-- ✅ تم إنشاء البيانات التجريبية بنجاح!
SELECT '✅ البيانات التجريبية تم إضافتها بنجاح!' as status, NOW() as completed_at;

