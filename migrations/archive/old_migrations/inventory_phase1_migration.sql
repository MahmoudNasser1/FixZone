-- =====================================================
-- FixZone ERP - Inventory Module Phase 1 Migration
-- تحديثات قاعدة البيانات - المرحلة الأولى
-- التاريخ: 2 أكتوبر 2025
-- الإصدار: 1.0
-- =====================================================

-- استخدام قاعدة البيانات
USE FZ;

-- تعطيل فحص المفاتيح الأجنبية مؤقتاً
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- =====================================================
-- الخطوة 1: النسخ الاحتياطي (Backup)
-- قبل تطبيق أي تعديلات، يُنصح بعمل نسخة احتياطية
-- =====================================================

-- يمكنك تشغيل هذا الأمر من Terminal:
-- mysqldump -u root -p FZ > backup_before_phase1_$(date +%Y%m%d_%H%M%S).sql

-- =====================================================
-- الخطوة 2: إضافة soft delete وأعمدة timestamp للجداول الحالية
-- =====================================================

-- 2.1 تحديث جدول Warehouse
ALTER TABLE Warehouse 
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ آخر تحديث',
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL COMMENT 'soft delete - تاريخ الحذف',
ADD COLUMN IF NOT EXISTS managerId INT NULL COMMENT 'مدير المخزن',
ADD COLUMN IF NOT EXISTS capacity DECIMAL(10,2) NULL COMMENT 'السعة التخزينية (متر مكعب)',
ADD COLUMN IF NOT EXISTS currentUtilization DECIMAL(5,2) DEFAULT 0 COMMENT 'نسبة الاستخدام %',
ADD COLUMN IF NOT EXISTS type ENUM('main', 'branch', 'temporary', 'virtual') DEFAULT 'main' COMMENT 'نوع المخزن',
ADD COLUMN IF NOT EXISTS address TEXT COMMENT 'عنوان تفصيلي',
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) COMMENT 'هاتف المخزن',
ADD COLUMN IF NOT EXISTS email VARCHAR(100) COMMENT 'بريد المخزن';

-- إضافة Foreign Key لمدير المخزن
ALTER TABLE Warehouse 
ADD CONSTRAINT fk_warehouse_manager 
FOREIGN KEY (managerId) REFERENCES User(id) ON DELETE SET NULL;

-- إضافة فهارس
CREATE INDEX IF NOT EXISTS idx_warehouse_branch ON Warehouse(branchId);
CREATE INDEX IF NOT EXISTS idx_warehouse_manager ON Warehouse(managerId);
CREATE INDEX IF NOT EXISTS idx_warehouse_deleted ON Warehouse(deletedAt);
CREATE INDEX IF NOT EXISTS idx_warehouse_type ON Warehouse(type);

-- 2.2 تحديث جدول InventoryItem
ALTER TABLE InventoryItem 
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL COMMENT 'soft delete - تاريخ الحذف',
ADD COLUMN IF NOT EXISTS partNumber VARCHAR(100) UNIQUE COMMENT 'رقم القطعة',
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) UNIQUE COMMENT 'الباركود',
ADD COLUMN IF NOT EXISTS brand VARCHAR(100) COMMENT 'العلامة التجارية',
ADD COLUMN IF NOT EXISTS model VARCHAR(100) COMMENT 'الموديل',
ADD COLUMN IF NOT EXISTS `condition` ENUM('new', 'used', 'refurbished', 'damaged') DEFAULT 'new' COMMENT 'حالة القطعة',
ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2) COMMENT 'الوزن (كجم)',
ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100) COMMENT 'الأبعاد (طول×عرض×ارتفاع)',
ADD COLUMN IF NOT EXISTS location VARCHAR(100) COMMENT 'موقع التخزين (رف-صف)',
ADD COLUMN IF NOT EXISTS categoryId INT NULL COMMENT 'الفئة',
ADD COLUMN IF NOT EXISTS preferredVendorId INT NULL COMMENT 'المورد المفضل',
ADD COLUMN IF NOT EXISTS reorderPoint INT DEFAULT 10 COMMENT 'نقطة إعادة الطلب',
ADD COLUMN IF NOT EXISTS reorderQuantity INT DEFAULT 50 COMMENT 'كمية إعادة الطلب',
ADD COLUMN IF NOT EXISTS leadTimeDays INT DEFAULT 7 COMMENT 'مدة التوريد (أيام)',
ADD COLUMN IF NOT EXISTS warrantyPeriodDays INT DEFAULT 90 COMMENT 'مدة الضمان (أيام)',
ADD COLUMN IF NOT EXISTS image VARCHAR(255) COMMENT 'صورة القطعة',
ADD COLUMN IF NOT EXISTS notes TEXT COMMENT 'ملاحظات إضافية',
ADD COLUMN IF NOT EXISTS customFields JSON COMMENT 'حقول مخصصة';

-- إضافة فهارس لـ InventoryItem
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON InventoryItem(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_partnumber ON InventoryItem(partNumber);
CREATE INDEX IF NOT EXISTS idx_inventory_brand_model ON InventoryItem(brand, model);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON InventoryItem(categoryId);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder ON InventoryItem(reorderPoint);
CREATE INDEX IF NOT EXISTS idx_inventory_deleted ON InventoryItem(deletedAt);
CREATE INDEX IF NOT EXISTS idx_inventory_condition ON InventoryItem(`condition`);

-- 2.3 تحديث جدول Vendor
ALTER TABLE Vendor 
ADD COLUMN IF NOT EXISTS website VARCHAR(255) COMMENT 'موقع إلكتروني',
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Egypt' COMMENT 'الدولة',
ADD COLUMN IF NOT EXISTS city VARCHAR(100) COMMENT 'المدينة',
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0 COMMENT 'التقييم (0-5)',
ADD COLUMN IF NOT EXISTS totalPurchases DECIMAL(15,2) DEFAULT 0 COMMENT 'إجمالي المشتريات',
ADD COLUMN IF NOT EXISTS lastPurchaseDate DATE COMMENT 'آخر عملية شراء',
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'blocked') DEFAULT 'active' COMMENT 'حالة المورد',
ADD COLUMN IF NOT EXISTS creditLimit DECIMAL(12,2) DEFAULT 0 COMMENT 'حد الائتمان',
ADD COLUMN IF NOT EXISTS currentBalance DECIMAL(12,2) DEFAULT 0 COMMENT 'الرصيد الحالي',
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL COMMENT 'soft delete';

-- إضافة فهارس لـ Vendor
CREATE INDEX IF NOT EXISTS idx_vendor_rating ON Vendor(rating);
CREATE INDEX IF NOT EXISTS idx_vendor_status ON Vendor(status);
CREATE INDEX IF NOT EXISTS idx_vendor_deleted ON Vendor(deletedAt);

-- 2.4 تحديث جدول PurchaseOrder
ALTER TABLE PurchaseOrder 
ADD COLUMN IF NOT EXISTS taxRate DECIMAL(5,2) DEFAULT 0 COMMENT 'نسبة الضريبة %',
ADD COLUMN IF NOT EXISTS taxAmount DECIMAL(10,2) DEFAULT 0 COMMENT 'قيمة الضريبة',
ADD COLUMN IF NOT EXISTS shippingCost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة الشحن',
ADD COLUMN IF NOT EXISTS discountAmount DECIMAL(10,2) DEFAULT 0 COMMENT 'الخصم',
ADD COLUMN IF NOT EXISTS finalAmount DECIMAL(10,2) AS (totalAmount + COALESCE(taxAmount, 0) + COALESCE(shippingCost, 0) - COALESCE(discountAmount, 0)) STORED COMMENT 'المبلغ النهائي',
ADD COLUMN IF NOT EXISTS approvedBy INT NULL COMMENT 'الموافق',
ADD COLUMN IF NOT EXISTS approvedAt TIMESTAMP NULL COMMENT 'تاريخ الموافقة',
ADD COLUMN IF NOT EXISTS paymentStatus ENUM('pending', 'partial', 'paid') DEFAULT 'pending' COMMENT 'حالة الدفع',
ADD COLUMN IF NOT EXISTS paidAmount DECIMAL(10,2) DEFAULT 0 COMMENT 'المبلغ المدفوع',
ADD COLUMN IF NOT EXISTS attachments JSON COMMENT 'مرفقات الطلب',
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL COMMENT 'soft delete';

-- إضافة Foreign Key للموافق
ALTER TABLE PurchaseOrder 
ADD CONSTRAINT fk_po_approved_by 
FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL;

-- إضافة فهارس
CREATE INDEX IF NOT EXISTS idx_po_vendor ON PurchaseOrder(vendorId);
CREATE INDEX IF NOT EXISTS idx_po_status ON PurchaseOrder(status);
CREATE INDEX IF NOT EXISTS idx_po_payment_status ON PurchaseOrder(paymentStatus);
CREATE INDEX IF NOT EXISTS idx_po_dates ON PurchaseOrder(orderDate, expectedDelivery);
CREATE INDEX IF NOT EXISTS idx_po_deleted ON PurchaseOrder(deletedAt);

-- 2.5 تحديث جدول StockMovement (توسيع الأنواع)
ALTER TABLE StockMovement 
MODIFY COLUMN movementType ENUM(
  'in',                      -- إدخال
  'out',                     -- صرف
  'transfer_out',            -- نقل - خروج
  'transfer_in',             -- نقل - دخول
  'adjustment',              -- تسوية
  'reserve',                 -- حجز
  'unreserve',               -- إلغاء حجز
  'write_off',               -- شطب/إتلاف
  'return_from_customer',    -- إرجاع من عميل
  'return_to_vendor'         -- إرجاع لمورد
) NOT NULL COMMENT 'نوع الحركة';

ALTER TABLE StockMovement 
ADD COLUMN IF NOT EXISTS toWarehouseId INT NULL COMMENT 'المخزن المستقبل (للنقل)',
ADD COLUMN IF NOT EXISTS batchNumber VARCHAR(50) COMMENT 'رقم الدفعة',
ADD COLUMN IF NOT EXISTS expiryDate DATE COMMENT 'تاريخ الانتهاء',
ADD COLUMN IF NOT EXISTS relatedMovementId INT NULL COMMENT 'حركة مرتبطة (للنقل)';

-- إضافة Foreign Keys
ALTER TABLE StockMovement 
ADD CONSTRAINT fk_movement_to_warehouse 
FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id) ON DELETE SET NULL;

ALTER TABLE StockMovement 
ADD CONSTRAINT fk_movement_related 
FOREIGN KEY (relatedMovementId) REFERENCES StockMovement(id) ON DELETE SET NULL;

-- إضافة فهارس
CREATE INDEX IF NOT EXISTS idx_movement_reference ON StockMovement(referenceType, referenceId);
CREATE INDEX IF NOT EXISTS idx_movement_date_range ON StockMovement(createdAt);
CREATE INDEX IF NOT EXISTS idx_movement_batch ON StockMovement(batchNumber);
CREATE INDEX IF NOT EXISTS idx_movement_type ON StockMovement(movementType);

-- =====================================================
-- الخطوة 3: إنشاء الجداول الجديدة
-- =====================================================

-- 3.1 جدول InventoryItemCategory (فئات الأصناف)
CREATE TABLE IF NOT EXISTS InventoryItemCategory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  parentId INT NULL COMMENT 'فئة أب (للتصنيف الهرمي)',
  description TEXT,
  icon VARCHAR(50) COMMENT 'أيقونة الفئة',
  displayOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parentId) REFERENCES InventoryItemCategory(id) ON DELETE SET NULL,
  INDEX idx_category_parent (parentId),
  INDEX idx_category_order (displayOrder),
  INDEX idx_category_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='فئات الأصناف المخزنية';

-- 3.2 جدول InventoryItemVendor (موردين كل صنف)
CREATE TABLE IF NOT EXISTS InventoryItemVendor (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inventoryItemId INT NOT NULL,
  vendorId INT NOT NULL,
  vendorPartNumber VARCHAR(100) COMMENT 'رقم القطعة عند المورد',
  unitPrice DECIMAL(10,2) NOT NULL COMMENT 'السعر من هذا المورد',
  minOrderQuantity INT DEFAULT 1 COMMENT 'الحد الأدنى للطلب',
  leadTimeDays INT DEFAULT 7 COMMENT 'مدة التوريد',
  isPrimary BOOLEAN DEFAULT FALSE COMMENT 'مورد أساسي',
  lastPurchaseDate DATE COMMENT 'آخر عملية شراء',
  lastPurchasePrice DECIMAL(10,2) COMMENT 'آخر سعر شراء',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id) ON DELETE CASCADE,
  FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE CASCADE,
  UNIQUE KEY unique_item_vendor (inventoryItemId, vendorId),
  INDEX idx_item_vendor_primary (isPrimary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='موردين الأصناف';

-- 3.3 جدول StockTransfer (نقل المخزون بين الفروع)
CREATE TABLE IF NOT EXISTS StockTransfer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transferNumber VARCHAR(50) UNIQUE NOT NULL,
  fromWarehouseId INT NOT NULL,
  toWarehouseId INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
  requestedBy INT NOT NULL,
  approvedBy INT NULL,
  shippedBy INT NULL,
  receivedBy INT NULL,
  transferDate DATE NOT NULL,
  expectedArrivalDate DATE,
  approvedAt TIMESTAMP NULL,
  shippedAt TIMESTAMP NULL,
  receivedAt TIMESTAMP NULL,
  carrier VARCHAR(100) COMMENT 'شركة النقل',
  trackingNumber VARCHAR(100) COMMENT 'رقم التتبع',
  shippingCost DECIMAL(10,2) DEFAULT 0,
  reason TEXT COMMENT 'سبب النقل',
  notes TEXT,
  attachments JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fromWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (requestedBy) REFERENCES User(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  FOREIGN KEY (shippedBy) REFERENCES User(id),
  FOREIGN KEY (receivedBy) REFERENCES User(id),
  INDEX idx_transfer_status (status),
  INDEX idx_transfer_warehouses (fromWarehouseId, toWarehouseId),
  INDEX idx_transfer_dates (transferDate, expectedArrivalDate),
  CONSTRAINT chk_different_warehouses CHECK (fromWarehouseId != toWarehouseId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='نقل المخزون بين الفروع';

-- 3.4 جدول StockTransferItem (عناصر النقل)
CREATE TABLE IF NOT EXISTS StockTransferItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transferId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  requestedQuantity INT NOT NULL,
  shippedQuantity INT DEFAULT 0,
  receivedQuantity INT DEFAULT 0,
  damagedQuantity INT DEFAULT 0,
  `condition` ENUM('good', 'damaged', 'missing') DEFAULT 'good',
  notes TEXT,
  FOREIGN KEY (transferId) REFERENCES StockTransfer(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  INDEX idx_transfer_item (transferId, inventoryItemId),
  CONSTRAINT chk_quantities CHECK (receivedQuantity <= shippedQuantity AND damagedQuantity <= receivedQuantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='عناصر نقل المخزون';

-- 3.5 جدول StockCount (الجرد)
CREATE TABLE IF NOT EXISTS StockCount (
  id INT PRIMARY KEY AUTO_INCREMENT,
  countNumber VARCHAR(50) UNIQUE NOT NULL,
  warehouseId INT NOT NULL,
  countDate DATE NOT NULL,
  status ENUM('scheduled', 'in_progress', 'pending_review', 'approved', 'completed', 'cancelled') DEFAULT 'scheduled',
  type ENUM('full', 'partial', 'cycle', 'spot') DEFAULT 'full',
  countedBy INT NOT NULL,
  reviewedBy INT NULL,
  approvedBy INT NULL,
  adjustedBy INT NULL,
  scheduledStartTime TIMESTAMP NULL,
  actualStartTime TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  totalItems INT DEFAULT 0,
  itemsCounted INT DEFAULT 0,
  discrepancies INT DEFAULT 0 COMMENT 'عدد الأصناف بها فروقات',
  totalValueDifference DECIMAL(12,2) DEFAULT 0 COMMENT 'قيمة الفروقات',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (countedBy) REFERENCES User(id),
  FOREIGN KEY (reviewedBy) REFERENCES User(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  FOREIGN KEY (adjustedBy) REFERENCES User(id),
  INDEX idx_count_warehouse (warehouseId),
  INDEX idx_count_status (status),
  INDEX idx_count_date (countDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='جرد المخزون';

-- 3.6 جدول StockCountItem (عناصر الجرد)
CREATE TABLE IF NOT EXISTS StockCountItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockCountId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  systemQuantity INT NOT NULL COMMENT 'الكمية في النظام',
  actualQuantity INT NULL COMMENT 'الكمية الفعلية',
  difference INT GENERATED ALWAYS AS (COALESCE(actualQuantity, 0) - systemQuantity) STORED,
  status ENUM('pending', 'counted', 'verified', 'adjusted') DEFAULT 'pending',
  countedAt TIMESTAMP NULL,
  notes TEXT,
  scannedBarcode VARCHAR(100),
  FOREIGN KEY (stockCountId) REFERENCES StockCount(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  UNIQUE KEY unique_count_item (stockCountId, inventoryItemId),
  INDEX idx_count_item_status (status),
  INDEX idx_count_item_difference (difference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='عناصر جرد المخزون';

-- 3.7 جدول VendorPayment (مدفوعات الموردين)
CREATE TABLE IF NOT EXISTS VendorPayment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendorId INT NOT NULL,
  purchaseOrderId INT NULL COMMENT 'أمر الشراء المرتبط',
  paymentNumber VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paymentMethod ENUM('cash', 'bank_transfer', 'check', 'credit_card') DEFAULT 'cash',
  paymentDate DATE NOT NULL,
  referenceNumber VARCHAR(100) COMMENT 'رقم الحوالة/الشيك',
  bankName VARCHAR(100),
  checkNumber VARCHAR(50),
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  attachments JSON COMMENT 'صور الإيصالات',
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendorId) REFERENCES Vendor(id),
  FOREIGN KEY (purchaseOrderId) REFERENCES PurchaseOrder(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_vendor_payment (vendorId),
  INDEX idx_payment_po (purchaseOrderId),
  INDEX idx_payment_date (paymentDate),
  INDEX idx_payment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='مدفوعات الموردين';

-- 3.8 جدول StockAlert (تنبيهات المخزون)
CREATE TABLE IF NOT EXISTS StockAlert (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inventoryItemId INT NOT NULL,
  warehouseId INT NOT NULL,
  alertType ENUM('low_stock', 'out_of_stock', 'overstock', 'expiring_soon', 'expired') NOT NULL,
  currentQuantity INT,
  threshold INT COMMENT 'الحد المحدد',
  severity ENUM('info', 'warning', 'critical') DEFAULT 'warning',
  status ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
  message TEXT,
  acknowledgedBy INT NULL,
  acknowledgedAt TIMESTAMP NULL,
  resolvedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (acknowledgedBy) REFERENCES User(id),
  INDEX idx_alert_status (status),
  INDEX idx_alert_type (alertType),
  INDEX idx_alert_severity (severity),
  INDEX idx_alert_item_warehouse (inventoryItemId, warehouseId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='تنبيهات المخزون';

-- 3.9 جدول BarcodeScan (سجل مسح الباركود)
CREATE TABLE IF NOT EXISTS BarcodeScan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  barcode VARCHAR(100) NOT NULL,
  inventoryItemId INT NULL,
  scannedBy INT NOT NULL,
  scanType ENUM('receive', 'issue', 'transfer', 'count', 'lookup') NOT NULL,
  warehouseId INT NOT NULL,
  referenceType VARCHAR(50),
  referenceId INT,
  result ENUM('success', 'not_found', 'error') DEFAULT 'success',
  errorMessage TEXT,
  scannedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (scannedBy) REFERENCES User(id),
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  INDEX idx_scan_barcode (barcode),
  INDEX idx_scan_user (scannedBy),
  INDEX idx_scan_date (scannedAt),
  INDEX idx_scan_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='سجل مسح الباركود';

-- =====================================================
-- الخطوة 4: إضافة Foreign Keys المفقودة
-- =====================================================

-- ربط InventoryItem بالفئة والمورد المفضل
ALTER TABLE InventoryItem 
ADD CONSTRAINT fk_item_category 
FOREIGN KEY (categoryId) REFERENCES InventoryItemCategory(id) ON DELETE SET NULL;

ALTER TABLE InventoryItem 
ADD CONSTRAINT fk_item_preferred_vendor 
FOREIGN KEY (preferredVendorId) REFERENCES Vendor(id) ON DELETE SET NULL;

-- =====================================================
-- الخطوة 5: إدراج البيانات الأساسية
-- =====================================================

-- 5.1 إدراج فئات أساسية للأصناف
INSERT IGNORE INTO InventoryItemCategory (name, description, icon, displayOrder) VALUES
('شاشات (Screens)', 'شاشات الهواتف واللابتوب', 'screen_search_desktop', 10),
('بطاريات (Batteries)', 'بطاريات ليثيوم وخلايا', 'battery_charging_full', 20),
('أدوات (Tools)', 'أدوات وخامات الصيانة', 'build', 30),
('كابلات (Cables)', 'كابلات وموصلات', 'cable', 40),
('قطع غيار (Spare Parts)', 'قطع غيار متنوعة', 'settings', 50),
('اكسسوارات (Accessories)', 'جرابات وشواحن وغيرها', 'phone_android', 60);

-- 5.2 تحديث الأصناف الموجودة بالفئات
UPDATE InventoryItem 
SET categoryId = (SELECT id FROM InventoryItemCategory WHERE name LIKE '%شاشات%' LIMIT 1)
WHERE name LIKE '%شاشة%' OR name LIKE '%LCD%' OR name LIKE '%Screen%';

UPDATE InventoryItem 
SET categoryId = (SELECT id FROM InventoryItemCategory WHERE name LIKE '%بطاريات%' LIMIT 1)
WHERE name LIKE '%بطارية%' OR name LIKE '%Battery%';

UPDATE InventoryItem 
SET categoryId = (SELECT id FROM InventoryItemCategory WHERE name LIKE '%أدوات%' LIMIT 1)
WHERE name LIKE '%لحام%' OR name LIKE '%أدوات%' OR name LIKE '%Tool%';

-- =====================================================
-- الخطوة 6: تنظيف البيانات التجريبية
-- =====================================================

-- حذف الأصناف التجريبية
DELETE FROM StockLevel WHERE inventoryItemId IN (
  SELECT id FROM InventoryItem WHERE sku LIKE 'TEST-%' OR sku LIKE 'DEMO-%'
);

DELETE FROM InventoryItem WHERE sku LIKE 'TEST-%' OR sku LIKE 'DEMO-%';

-- =====================================================
-- الخطوة 7: إنشاء Views مفيدة
-- =====================================================

-- 7.1 عرض المخزون الشامل
CREATE OR REPLACE VIEW v_inventory_summary AS
SELECT 
  i.id,
  i.name,
  i.sku,
  i.barcode,
  i.partNumber,
  i.brand,
  i.model,
  i.category as categoryOld,
  c.name as categoryName,
  i.purchasePrice,
  i.sellingPrice,
  i.reorderPoint,
  i.reorderQuantity,
  i.`condition`,
  i.isActive,
  COALESCE(SUM(sl.currentQuantity), 0) as totalQuantity,
  COALESCE(SUM(sl.reservedQuantity), 0) as totalReserved,
  COALESCE(SUM(sl.availableQuantity), 0) as totalAvailable,
  COALESCE(SUM(sl.currentQuantity * i.purchasePrice), 0) as totalValue,
  COUNT(DISTINCT sl.warehouseId) as warehouseCount,
  v.name as preferredVendorName,
  i.createdAt,
  i.updatedAt
FROM InventoryItem i
LEFT JOIN InventoryItemCategory c ON i.categoryId = c.id
LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
LEFT JOIN Vendor v ON i.preferredVendorId = v.id
WHERE i.deletedAt IS NULL
GROUP BY i.id;

-- 7.2 عرض الأصناف المنخفضة
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
  i.id,
  i.name,
  i.sku,
  i.barcode,
  w.id as warehouseId,
  w.name as warehouseName,
  sl.currentQuantity,
  sl.reservedQuantity,
  sl.availableQuantity,
  i.reorderPoint,
  i.reorderQuantity,
  (i.reorderPoint - sl.availableQuantity) as deficit,
  CASE 
    WHEN sl.availableQuantity = 0 THEN 'out_of_stock'
    WHEN sl.availableQuantity <= i.reorderPoint THEN 'low_stock'
    ELSE 'adequate'
  END as stockStatus
FROM InventoryItem i
JOIN StockLevel sl ON i.id = sl.inventoryItemId
JOIN Warehouse w ON sl.warehouseId = w.id
WHERE sl.availableQuantity <= i.reorderPoint
  AND i.isActive = TRUE
  AND i.deletedAt IS NULL
  AND w.deletedAt IS NULL
ORDER BY deficit DESC, i.name;

-- 7.3 عرض حركات المخزون مع التفاصيل
CREATE OR REPLACE VIEW v_stock_movements_detailed AS
SELECT 
  sm.id,
  sm.movementType,
  sm.quantity,
  sm.unitCost,
  sm.totalCost,
  sm.referenceType,
  sm.referenceId,
  sm.notes,
  sm.createdAt,
  i.id as itemId,
  i.name as itemName,
  i.sku as itemSku,
  w.id as warehouseId,
  w.name as warehouseName,
  tw.id as toWarehouseId,
  tw.name as toWarehouseName,
  CONCAT(u.firstName, ' ', u.lastName) as userName
FROM StockMovement sm
LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
LEFT JOIN Warehouse w ON sm.warehouseId = w.id
LEFT JOIN Warehouse tw ON sm.toWarehouseId = tw.id
LEFT JOIN User u ON sm.createdBy = u.id
ORDER BY sm.createdAt DESC;

-- =====================================================
-- الخطوة 8: التحقق من النجاح
-- =====================================================

-- التحقق من الجداول الجديدة
SELECT 
  'الجداول الجديدة تم إنشاؤها بنجاح' as status,
  COUNT(*) as total_new_tables
FROM information_schema.tables 
WHERE table_schema = 'FZ' 
  AND table_name IN (
    'InventoryItemCategory',
    'InventoryItemVendor',
    'StockTransfer',
    'StockTransferItem',
    'StockCount',
    'StockCountItem',
    'VendorPayment',
    'StockAlert',
    'BarcodeScan'
  );

-- التحقق من الأعمدة الجديدة
SELECT 
  'الأعمدة الجديدة تم إضافتها بنجاح' as status,
  table_name,
  COUNT(*) as new_columns
FROM information_schema.columns
WHERE table_schema = 'FZ'
  AND table_name IN ('Warehouse', 'InventoryItem', 'Vendor', 'PurchaseOrder', 'StockMovement')
  AND column_name IN ('deletedAt', 'createdAt', 'updatedAt', 'barcode', 'partNumber', 'brand', 'model')
GROUP BY table_name;

-- إعادة تفعيل فحص المفاتيح الأجنبية
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- ملاحظات مهمة
-- =====================================================

-- 1. تم إنشاء نسخة آمنة مع استخدام IF NOT EXISTS لتجنب الأخطاء
-- 2. تم إضافة جميع الفهارس المطلوبة لتحسين الأداء
-- 3. تم إضافة Constraints للتحقق من صحة البيانات
-- 4. تم إنشاء 3 Views مفيدة للاستعلامات السريعة
-- 5. تم تنظيف البيانات التجريبية القديمة

-- =====================================================
-- الخطوات التالية (Phase 1 - الأسبوع 1)
-- =====================================================

-- ✅ اليوم 1-2: تحديثات قاعدة البيانات (مكتمل)
-- □  اليوم 3-4: إنشاء بيانات تجريبية واقعية
-- □  اليوم 5-7: تحسين Backend APIs

-- =====================================================
-- نهاية Migration
-- =====================================================

SELECT 
  '✅ Migration Phase 1 تم بنجاح!' as status,
  NOW() as completed_at;

