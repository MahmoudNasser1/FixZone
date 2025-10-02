# 🗄️ تصميم قاعدة البيانات المحسّن - نظام المخزون
## Enhanced Database Schema - Inventory Module

**التاريخ:** 2 أكتوبر 2025  
**الهدف:** تصميم قاعدة بيانات محسنة تدعم جميع الميزات المتقدمة

---

## 📊 نظرة شاملة على الجداول

### الجداول الحالية (للتحسين):
1. ✅ `Warehouse` - المخازن
2. ✅ `InventoryItem` - الأصناف
3. ✅ `StockLevel` - مستويات المخزون
4. ✅ `StockMovement` - حركات المخزون
5. ✅ `Vendor` - الموردين
6. ✅ `PurchaseOrder` - أوامر الشراء
7. ✅ `PurchaseOrderItem` - عناصر أمر الشراء
8. ✅ `PartsUsed` - القطع المستخدمة

### الجداول الجديدة المقترحة:
9. 🆕 `StockTransfer` - نقل المخزون بين الفروع
10. 🆕 `StockTransferItem` - عناصر النقل
11. 🆕 `StockCount` - الجرد
12. 🆕 `StockCountItem` - عناصر الجرد
13. 🆕 `VendorPayment` - مدفوعات الموردين
14. 🆕 `InventoryItemCategory` - فئات الأصناف
15. 🆕 `InventoryItemVendor` - موردين كل صنف
16. 🆕 `StockAlert` - تنبيهات المخزون
17. 🆕 `BarcodeScan` - مسح الباركود

---

## 🔧 التعديلات على الجداول الحالية

### 1. جدول Warehouse (المخازن) - تحديثات

```sql
-- إضافة أعمدة جديدة
ALTER TABLE Warehouse 
ADD COLUMN managerId INT NULL COMMENT 'مدير المخزن',
ADD COLUMN capacity DECIMAL(10,2) NULL COMMENT 'السعة التخزينية (متر مكعب)',
ADD COLUMN currentUtilization DECIMAL(5,2) DEFAULT 0 COMMENT 'نسبة الاستخدام %',
ADD COLUMN type ENUM('main', 'branch', 'temporary', 'virtual') DEFAULT 'main' COMMENT 'نوع المخزن',
ADD COLUMN address TEXT COMMENT 'عنوان تفصيلي',
ADD COLUMN phone VARCHAR(20) COMMENT 'هاتف المخزن',
ADD COLUMN email VARCHAR(100) COMMENT 'بريد المخزن',
ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deletedAt TIMESTAMP NULL COMMENT 'soft delete',
ADD FOREIGN KEY (managerId) REFERENCES User(id) ON DELETE SET NULL;

-- إضافة فهرس
CREATE INDEX idx_warehouse_branch ON Warehouse(branchId);
CREATE INDEX idx_warehouse_manager ON Warehouse(managerId);
CREATE INDEX idx_warehouse_deleted ON Warehouse(deletedAt);
```

---

### 2. جدول InventoryItem (الأصناف) - تحسينات كبيرة

```sql
-- إضافة أعمدة جديدة
ALTER TABLE InventoryItem 
ADD COLUMN partNumber VARCHAR(100) UNIQUE COMMENT 'رقم القطعة',
ADD COLUMN barcode VARCHAR(100) UNIQUE COMMENT 'الباركود',
ADD COLUMN brand VARCHAR(100) COMMENT 'العلامة التجارية',
ADD COLUMN model VARCHAR(100) COMMENT 'الموديل',
ADD COLUMN condition ENUM('new', 'used', 'refurbished', 'damaged') DEFAULT 'new' COMMENT 'حالة القطعة',
ADD COLUMN weight DECIMAL(8,2) COMMENT 'الوزن (كجم)',
ADD COLUMN dimensions VARCHAR(100) COMMENT 'الأبعاد (طول×عرض×ارتفاع)',
ADD COLUMN location VARCHAR(100) COMMENT 'موقع التخزين (رف-صف)',
ADD COLUMN categoryId INT NULL COMMENT 'الفئة',
ADD COLUMN preferredVendorId INT NULL COMMENT 'المورد المفضل',
ADD COLUMN reorderPoint INT DEFAULT 10 COMMENT 'نقطة إعادة الطلب',
ADD COLUMN reorderQuantity INT DEFAULT 50 COMMENT 'كمية إعادة الطلب',
ADD COLUMN leadTimeDays INT DEFAULT 7 COMMENT 'مدة التوريد (أيام)',
ADD COLUMN warrantyPeriodDays INT DEFAULT 90 COMMENT 'مدة الضمان (أيام)',
ADD COLUMN image VARCHAR(255) COMMENT 'صورة القطعة',
ADD COLUMN notes TEXT COMMENT 'ملاحظات إضافية',
ADD COLUMN customFields JSON COMMENT 'حقول مخصصة',
ADD COLUMN deletedAt TIMESTAMP NULL COMMENT 'soft delete',
ADD FOREIGN KEY (categoryId) REFERENCES InventoryItemCategory(id) ON DELETE SET NULL,
ADD FOREIGN KEY (preferredVendorId) REFERENCES Vendor(id) ON DELETE SET NULL;

-- إضافة فهارس
CREATE INDEX idx_inventory_barcode ON InventoryItem(barcode);
CREATE INDEX idx_inventory_partnumber ON InventoryItem(partNumber);
CREATE INDEX idx_inventory_brand_model ON InventoryItem(brand, model);
CREATE INDEX idx_inventory_category ON InventoryItem(categoryId);
CREATE INDEX idx_inventory_reorder ON InventoryItem(reorderPoint);
CREATE INDEX idx_inventory_deleted ON InventoryItem(deletedAt);
```

---

### 3. جدول StockMovement (الحركات) - توسيع الأنواع

```sql
-- تحديث ENUM لإضافة أنواع جديدة
ALTER TABLE StockMovement 
MODIFY COLUMN movementType ENUM(
  'in',              -- إدخال
  'out',             -- صرف
  'transfer_out',    -- نقل - خروج
  'transfer_in',     -- نقل - دخول
  'adjustment',      -- تسوية
  'reserve',         -- حجز
  'unreserve',       -- إلغاء حجز
  'write_off',       -- شطب/إتلاف
  'return_from_customer',  -- إرجاع من عميل
  'return_to_vendor'       -- إرجاع لمورد
) NOT NULL;

-- إضافة أعمدة
ALTER TABLE StockMovement 
ADD COLUMN toWarehouseId INT NULL COMMENT 'المخزن المستقبل (للنقل)',
ADD COLUMN batchNumber VARCHAR(50) COMMENT 'رقم الدفعة',
ADD COLUMN expiryDate DATE COMMENT 'تاريخ الانتهاء',
ADD COLUMN relatedMovementId INT NULL COMMENT 'حركة مرتبطة (للنقل)',
ADD FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id),
ADD FOREIGN KEY (relatedMovementId) REFERENCES StockMovement(id);

-- فهارس إضافية
CREATE INDEX idx_movement_reference ON StockMovement(referenceType, referenceId);
CREATE INDEX idx_movement_date_range ON StockMovement(createdAt);
CREATE INDEX idx_movement_batch ON StockMovement(batchNumber);
```

---

### 4. جدول Vendor (الموردين) - إضافات

```sql
-- إضافة أعمدة جديدة
ALTER TABLE Vendor 
ADD COLUMN website VARCHAR(255) COMMENT 'موقع إلكتروني',
ADD COLUMN country VARCHAR(100) DEFAULT 'Egypt' COMMENT 'الدولة',
ADD COLUMN city VARCHAR(100) COMMENT 'المدينة',
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0 COMMENT 'التقييم (0-5)',
ADD COLUMN totalPurchases DECIMAL(15,2) DEFAULT 0 COMMENT 'إجمالي المشتريات',
ADD COLUMN lastPurchaseDate DATE COMMENT 'آخر عملية شراء',
ADD COLUMN status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
ADD COLUMN creditLimit DECIMAL(12,2) DEFAULT 0 COMMENT 'حد الائتمان',
ADD COLUMN currentBalance DECIMAL(12,2) DEFAULT 0 COMMENT 'الرصيد الحالي',
ADD COLUMN deletedAt TIMESTAMP NULL;

-- فهارس
CREATE INDEX idx_vendor_rating ON Vendor(rating);
CREATE INDEX idx_vendor_status ON Vendor(status);
CREATE INDEX idx_vendor_deleted ON Vendor(deletedAt);
```

---

### 5. جدول PurchaseOrder - تحسينات

```sql
-- إضافة أعمدة
ALTER TABLE PurchaseOrder 
ADD COLUMN taxRate DECIMAL(5,2) DEFAULT 0 COMMENT 'نسبة الضريبة %',
ADD COLUMN taxAmount DECIMAL(10,2) DEFAULT 0 COMMENT 'قيمة الضريبة',
ADD COLUMN shippingCost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة الشحن',
ADD COLUMN discountAmount DECIMAL(10,2) DEFAULT 0 COMMENT 'الخصم',
ADD COLUMN finalAmount DECIMAL(10,2) AS (totalAmount + taxAmount + shippingCost - discountAmount) STORED,
ADD COLUMN approvedBy INT NULL COMMENT 'الموافق',
ADD COLUMN approvedAt TIMESTAMP NULL COMMENT 'تاريخ الموافقة',
ADD COLUMN paymentStatus ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
ADD COLUMN paidAmount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN attachments JSON COMMENT 'مرفقات الطلب',
ADD COLUMN deletedAt TIMESTAMP NULL,
ADD FOREIGN KEY (approvedBy) REFERENCES User(id);

-- فهارس
CREATE INDEX idx_po_vendor ON PurchaseOrder(vendorId);
CREATE INDEX idx_po_status ON PurchaseOrder(status);
CREATE INDEX idx_po_dates ON PurchaseOrder(orderDate, expectedDelivery);
CREATE INDEX idx_po_deleted ON PurchaseOrder(deletedAt);
```

---

## 🆕 الجداول الجديدة

### 1. InventoryItemCategory (فئات الأصناف)

```sql
CREATE TABLE InventoryItemCategory (
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
  INDEX idx_category_order (displayOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- بيانات أساسية
INSERT INTO InventoryItemCategory (name, description, icon) VALUES
('شاشات (Screens)', 'شاشات الهواتف واللابتوب', 'screen'),
('بطاريات (Batteries)', 'بطاريات ليثيوم', 'battery'),
('أدوات (Tools)', 'أدوات وخامات الصيانة', 'tools'),
('كابلات (Cables)', 'كابلات وموصلات', 'cable'),
('قطع غيار (Spare Parts)', 'قطع غيار متنوعة', 'parts'),
('اكسسوارات (Accessories)', 'جرابات وشواحن', 'accessories');
```

---

### 2. InventoryItemVendor (موردين كل صنف)

```sql
CREATE TABLE InventoryItemVendor (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3. StockTransfer (نقل المخزون)

```sql
CREATE TABLE StockTransfer (
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
  INDEX idx_transfer_dates (transferDate, expectedArrivalDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4. StockTransferItem (عناصر النقل)

```sql
CREATE TABLE StockTransferItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transferId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  requestedQuantity INT NOT NULL,
  shippedQuantity INT DEFAULT 0,
  receivedQuantity INT DEFAULT 0,
  damagedQuantity INT DEFAULT 0,
  condition ENUM('good', 'damaged', 'missing') DEFAULT 'good',
  notes TEXT,
  FOREIGN KEY (transferId) REFERENCES StockTransfer(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  INDEX idx_transfer_item (transferId, inventoryItemId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 5. StockCount (الجرد)

```sql
CREATE TABLE StockCount (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 6. StockCountItem (عناصر الجرد)

```sql
CREATE TABLE StockCountItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockCountId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  systemQuantity INT NOT NULL COMMENT 'الكمية في النظام',
  actualQuantity INT NULL COMMENT 'الكمية الفعلية',
  difference INT GENERATED ALWAYS AS (COALESCE(actualQuantity, 0) - systemQuantity) STORED,
  valueDifference DECIMAL(10,2) AS (
    (COALESCE(actualQuantity, 0) - systemQuantity) * 
    (SELECT purchasePrice FROM InventoryItem WHERE id = inventoryItemId)
  ) STORED COMMENT 'قيمة الفرق',
  status ENUM('pending', 'counted', 'verified', 'adjusted') DEFAULT 'pending',
  countedAt TIMESTAMP NULL,
  notes TEXT,
  scannedBarcode VARCHAR(100),
  FOREIGN KEY (stockCountId) REFERENCES StockCount(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  UNIQUE KEY unique_count_item (stockCountId, inventoryItemId),
  INDEX idx_count_item_status (status),
  INDEX idx_count_item_difference (difference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 7. VendorPayment (مدفوعات الموردين)

```sql
CREATE TABLE VendorPayment (
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
  INDEX idx_payment_date (paymentDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 8. StockAlert (تنبيهات المخزون)

```sql
CREATE TABLE StockAlert (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 9. BarcodeScan (سجل مسح الباركود)

```sql
CREATE TABLE BarcodeScan (
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
  INDEX idx_scan_date (scannedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 📊 العلاقات (Relationships) - ERD

```
InventoryItemCategory
  ├── InventoryItem (categoryId)
  └── InventoryItemCategory (parentId) [self-reference]

InventoryItem
  ├── StockLevel (inventoryItemId)
  ├── StockMovement (inventoryItemId)
  ├── PurchaseOrderItem (inventoryItemId)
  ├── PartsUsed (inventoryItemId)
  ├── InventoryItemVendor (inventoryItemId)
  ├── StockTransferItem (inventoryItemId)
  ├── StockCountItem (inventoryItemId)
  ├── StockAlert (inventoryItemId)
  └── BarcodeScan (inventoryItemId)

Warehouse
  ├── StockLevel (warehouseId)
  ├── StockMovement (warehouseId)
  ├── StockTransfer (fromWarehouseId, toWarehouseId)
  ├── StockCount (warehouseId)
  ├── StockAlert (warehouseId)
  └── BarcodeScan (warehouseId)

Vendor
  ├── PurchaseOrder (vendorId)
  ├── InventoryItemVendor (vendorId)
  └── VendorPayment (vendorId)

PurchaseOrder
  ├── PurchaseOrderItem (purchaseOrderId)
  ├── VendorPayment (purchaseOrderId)
  └── StockMovement (referenceType='purchase_order')

RepairRequest
  ├── PartsUsed (repairRequestId)
  └── StockMovement (referenceType='repair_request')

StockTransfer
  ├── StockTransferItem (transferId)
  └── StockMovement (referenceType='stock_transfer')

StockCount
  ├── StockCountItem (stockCountId)
  └── StockMovement (referenceType='stock_count')
```

---

## 🔒 Triggers المقترحة

### 1. تحديث إجمالي PO عند تغيير عناصره

```sql
DELIMITER //
CREATE TRIGGER update_po_total_after_item_insert
AFTER INSERT ON PurchaseOrderItem
FOR EACH ROW
BEGIN
  UPDATE PurchaseOrder 
  SET totalAmount = (
    SELECT SUM(totalPrice) 
    FROM PurchaseOrderItem 
    WHERE purchaseOrderId = NEW.purchaseOrderId
  )
  WHERE id = NEW.purchaseOrderId;
END//

CREATE TRIGGER update_po_total_after_item_update
AFTER UPDATE ON PurchaseOrderItem
FOR EACH ROW
BEGIN
  UPDATE PurchaseOrder 
  SET totalAmount = (
    SELECT SUM(totalPrice) 
    FROM PurchaseOrderItem 
    WHERE purchaseOrderId = NEW.purchaseOrderId
  )
  WHERE id = NEW.purchaseOrderId;
END//
DELIMITER ;
```

---

### 2. إنشاء تنبيه عند انخفاض المخزون

```sql
DELIMITER //
CREATE TRIGGER check_low_stock_after_movement
AFTER INSERT ON StockMovement
FOR EACH ROW
BEGIN
  DECLARE current_qty INT;
  DECLARE reorder_point INT;
  DECLARE item_name VARCHAR(100);
  
  -- جلب المعلومات
  SELECT 
    sl.currentQuantity, 
    i.reorderPoint,
    i.name
  INTO current_qty, reorder_point, item_name
  FROM StockLevel sl
  JOIN InventoryItem i ON i.id = sl.inventoryItemId
  WHERE sl.inventoryItemId = NEW.inventoryItemId 
    AND sl.warehouseId = NEW.warehouseId;
  
  -- إنشاء تنبيه إذا كان المخزون منخفض
  IF current_qty <= reorder_point THEN
    INSERT INTO StockAlert 
    (inventoryItemId, warehouseId, alertType, currentQuantity, threshold, severity, message)
    VALUES
    (NEW.inventoryItemId, NEW.warehouseId, 'low_stock', current_qty, reorder_point, 
     IF(current_qty = 0, 'critical', 'warning'),
     CONCAT('الصنف ', item_name, ' انخفض إلى ', current_qty, ' (الحد: ', reorder_point, ')'));
  END IF;
END//
DELIMITER ;
```

---

## 📝 Views المقترحة

### 1. عرض المخزون الشامل

```sql
CREATE OR REPLACE VIEW v_inventory_summary AS
SELECT 
  i.id,
  i.name,
  i.sku,
  i.barcode,
  i.partNumber,
  i.brand,
  i.model,
  i.category,
  c.name as categoryName,
  i.purchasePrice,
  i.sellingPrice,
  i.reorderPoint,
  i.condition,
  SUM(sl.currentQuantity) as totalQuantity,
  SUM(sl.reservedQuantity) as totalReserved,
  SUM(sl.availableQuantity) as totalAvailable,
  SUM(sl.currentQuantity * i.purchasePrice) as totalValue,
  COUNT(DISTINCT sl.warehouseId) as warehouseCount,
  v.name as preferredVendorName
FROM InventoryItem i
LEFT JOIN InventoryItemCategory c ON i.categoryId = c.id
LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
LEFT JOIN Vendor v ON i.preferredVendorId = v.id
WHERE i.deletedAt IS NULL
GROUP BY i.id;
```

---

### 2. عرض الأصناف المنخفضة

```sql
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
  i.id,
  i.name,
  i.sku,
  w.id as warehouseId,
  w.name as warehouseName,
  sl.currentQuantity,
  sl.reservedQuantity,
  sl.availableQuantity,
  i.reorderPoint,
  i.reorderQuantity,
  (i.reorderPoint - sl.availableQuantity) as deficit
FROM InventoryItem i
JOIN StockLevel sl ON i.id = sl.inventoryItemId
JOIN Warehouse w ON sl.warehouseId = w.id
WHERE sl.availableQuantity <= i.reorderPoint
  AND i.isActive = TRUE
  AND i.deletedAt IS NULL
ORDER BY deficit DESC;
```

---

## ✅ ملخص التحسينات

### ما تم إضافته:
- ✅ 9 جداول جديدة لدعم الميزات المتقدمة
- ✅ تحسينات كبيرة على الجداول الحالية
- ✅ Soft delete لجميع الجداول الرئيسية
- ✅ فهارس محسنة للأداء
- ✅ Triggers تلقائية
- ✅ Views مفيدة للتقارير

### الميزات المدعومة الآن:
- ✅ نظام باركود كامل
- ✅ نقل بين الفروع (Multi-Warehouse)
- ✅ جرد إلكتروني متقدم
- ✅ تنبيهات ذكية
- ✅ موردين متعددين لكل صنف
- ✅ تتبع مدفوعات الموردين
- ✅ تصنيف هرمي للأصناف

---

**للانتقال للوثيقة التالية:**
- [← Matrix التدفقات](./02_INVENTORY_FLOW_MATRIX.md)
- [→ مواصفات الـ APIs](./04_API_SPECIFICATIONS.md)

