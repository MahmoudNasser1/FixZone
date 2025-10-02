# 📦 مراجعة شاملة لنظام المخازن والمخزون - FixZone

## 🗃️ هيكل قاعدة البيانات

### 1. جدول Warehouse (المخازن)
```sql
CREATE TABLE Warehouse (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,           -- اسم المخزن
  location VARCHAR(255),                -- الموقع
  branchId INT,                         -- ربط بالفرع
  isActive TINYINT(1) DEFAULT 1         -- نشط/غير نشط
)
```

**البيانات الحالية:** 3 مخازن
1. المستودع الرئيسي - القاهرة
2. مستودع الجيزة - فرع الهرم
3. مستودع الإسكندرية - فرع الكورنيش

---

### 2. جدول InventoryItem (الأصناف/القطع)
```sql
CREATE TABLE InventoryItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,           -- اسم الصنف
  sku VARCHAR(50) UNIQUE,               -- رمز الصنف
  description TEXT,                     -- الوصف
  category VARCHAR(50),                 -- الفئة
  purchasePrice DECIMAL(10,2),          -- سعر الشراء
  sellingPrice DECIMAL(10,2),           -- سعر البيع
  minStockLevel INT DEFAULT 0,          -- الحد الأدنى للمخزون
  maxStockLevel INT DEFAULT 1000,       -- الحد الأقصى للمخزون
  unit VARCHAR(20) DEFAULT 'قطعة',      -- الوحدة
  isActive TINYINT(1) DEFAULT 1,        -- نشط/غير نشط
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**البيانات الحالية:** 6 أصناف
1. شاشة LCD هاتف (PART-001) - شراء: 150 ج.م، بيع: 250 ج.م
2. بطارية ليثيوم (PART-002) - شراء: 80 ج.م، بيع: 120 ج.م
3. خامات لحام (PART-003) - شراء: 200 ج.م، بيع: 300 ج.م
4-6. قطع تجريبية (للحذف)

---

### 3. جدول StockLevel (مستويات المخزون)
```sql
CREATE TABLE StockLevel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inventoryItemId INT NOT NULL,        -- الصنف
  warehouseId INT NOT NULL,            -- المخزن
  currentQuantity INT DEFAULT 0,       -- الكمية الحالية
  reservedQuantity INT DEFAULT 0,      -- الكمية المحجوزة
  availableQuantity INT GENERATED,     -- الكمية المتاحة (محسوبة)
  lastUpdated TIMESTAMP,
  UNIQUE KEY (inventoryItemId, warehouseId)
)
```

**البيانات الحالية:** 6 مستويات مخزون

**مثال:**
- شاشة LCD في المستودع الرئيسي: 50 كلي، 5 محجوز، 45 متاح
- بطارية ليثيوم في المستودع الرئيسي: 100 كلي، 10 محجوز، 90 متاح

---

### 4. جدول StockMovement (حركات المخزون)
```sql
CREATE TABLE StockMovement (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inventoryItemId INT NOT NULL,        -- الصنف
  warehouseId INT NOT NULL,            -- المخزن
  movementType ENUM('in','out','transfer','adjustment'),
  quantity INT NOT NULL,               -- الكمية
  unitCost DECIMAL(10,2),              -- سعر الوحدة
  totalCost DECIMAL(10,2),             -- التكلفة الإجمالية
  referenceType VARCHAR(50),           -- نوع المرجع
  referenceId INT,                     -- معرف المرجع
  notes TEXT,                          -- ملاحظات
  createdBy INT,                       -- المستخدم
  createdAt TIMESTAMP
)
```

**أنواع الحركات:**
- `in` - إدخال للمخزن
- `out` - صرف من المخزن
- `transfer` - نقل بين المخازن
- `adjustment` - تسوية

**البيانات الحالية:** 3 حركات

---

## 🔗 الترابطات (Relations)

### 1. Warehouse → Branch
```
Warehouse.branchId → Branch.id
```
- كل مخزن ينتمي لفرع واحد

### 2. StockLevel
```
StockLevel.inventoryItemId → InventoryItem.id
StockLevel.warehouseId → Warehouse.id
```
- مستوى المخزون يربط بين الصنف والمخزن
- UNIQUE KEY على (inventoryItemId, warehouseId)

### 3. StockMovement
```
StockMovement.inventoryItemId → InventoryItem.id
StockMovement.warehouseId → Warehouse.id
StockMovement.createdBy → User.id
```
- كل حركة تسجل:
  - الصنف
  - المخزن
  - نوع الحركة
  - المرجع (طلب إصلاح، فاتورة، إلخ)

### 4. Repair Integration
```
StockMovement.referenceType = 'repair_request'
StockMovement.referenceId → RepairRequest.id
```
- عند صرف قطعة لطلب إصلاح

### 5. Invoice Integration
```
InvoiceItem.inventoryItemId → InventoryItem.id
```
- الفاتورة تحتوي على أصناف من المخزون

---

## 📡 APIs المتاحة

### Warehouses APIs
```
GET    /api/warehouses              - جلب جميع المخازن ✅
GET    /api/warehouses/:id          - جلب مخزن محدد
POST   /api/warehouses              - إنشاء مخزن جديد
PUT    /api/warehouses/:id          - تحديث مخزن
DELETE /api/warehouses/:id          - حذف مخزن
```

### Inventory Items APIs
```
GET    /api/inventory               - جلب جميع الأصناف ✅
GET    /api/inventory/:id           - جلب صنف محدد
POST   /api/inventory               - إنشاء صنف جديد
PUT    /api/inventory/:id           - تحديث صنف
DELETE /api/inventory/:id           - حذف صنف
```

### Stock Levels APIs
```
GET    /api/stock-levels            - جلب مستويات المخزون
GET    /api/stock-levels/:warehouseId/:itemId - جلب مستوى محدد
PUT    /api/stock-levels/:warehouseId/:itemId - تحديث مستوى
```

### Stock Movements APIs
```
GET    /api/stock-movements         - جلب حركات المخزون
POST   /api/stock-movements         - تسجيل حركة جديدة
GET    /api/stock-movements/item/:itemId - حركات صنف محدد
GET    /api/stock-movements/warehouse/:warehouseId - حركات مخزن محدد
```

### Inventory Issue API (صرف القطع)
```
POST   /api/inventory/issue         - صرف قطع لطلب إصلاح
```

---

## 🔍 المشاكل المكتشفة

### ❌ **مشكلة 1: API Route غير صحيح**
```javascript
// خطأ في Frontend
const items = await apiService.request('/inventory/items');

// الصحيح
const items = await apiService.request('/inventory');
```

### ❌ **مشكلة 2: بيانات تجريبية**
```sql
-- قطع تجريبية للحذف
DELETE FROM InventoryItem WHERE sku LIKE 'TEST-%';
```

### ❌ **مشكلة 3: عدم وجود deletedAt في Warehouse**
```sql
-- الجدول لا يدعم soft delete
-- يحتاج إضافة: deletedAt TIMESTAMP NULL
```

### ❌ **مشكلة 4: عدم وجود deletedAt في InventoryItem**
```sql
-- الجدول لا يدعم soft delete  
-- يحتاج إضافة: deletedAt TIMESTAMP NULL
```

---

## ✅ الإصلاحات المقترحة

### 1. إضافة Soft Delete للمخازن والأصناف
```sql
ALTER TABLE Warehouse 
ADD COLUMN deletedAt TIMESTAMP NULL,
ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE InventoryItem 
ADD COLUMN deletedAt TIMESTAMP NULL;
```

### 2. حذف البيانات التجريبية
```sql
DELETE FROM InventoryItem WHERE sku LIKE 'TEST-%';
DELETE FROM StockLevel WHERE inventoryItemId IN (
  SELECT id FROM InventoryItem WHERE sku LIKE 'TEST-%'
);
```

### 3. تحديث Frontend APIs
```javascript
// في api.js
async getInventoryItems(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return this.request(`/inventory${qs ? `?${qs}` : ''}`);
}

async getStockLevels(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return this.request(`/stock-levels${qs ? `?${qs}` : ''}`);
}
```

### 4. إضافة صفحة مخزون محسنة
- إحصائيات شاملة
- بحث وفلترة متقدمة
- عرض مستويات المخزون
- تنبيهات للأصناف المنخفضة
- حركات المخزون
- تقارير

---

## 📊 حالة النظام الحالية

### ✅ موجود ويعمل:
- ✅ جداول قاعدة البيانات (4 جداول رئيسية)
- ✅ APIs الأساسية للمخازن
- ✅ APIs الأساسية للأصناف
- ✅ APIs مستويات المخزون
- ✅ APIs حركات المخزون
- ✅ صفحات Frontend (7 صفحات)

### ⚠️ يحتاج تحسين:
- ⚠️ إضافة soft delete للمخازن والأصناف
- ⚠️ حذف البيانات التجريبية
- ⚠️ تحسين صفحات Frontend
- ⚠️ إضافة إحصائيات شاملة
- ⚠️ تحسين تنبيهات المخزون المنخفض
- ⚠️ إضافة تقارير المخزون

---

## 📁 الملفات ذات الصلة

### Frontend:
```
frontend/react-app/src/pages/inventory/
  - InventoryPage.js                    - الصفحة الرئيسية
  - InventoryManagementPage.js          - إدارة الأصناف
  - WarehouseManagementPage.js          - إدارة المخازن
  - StockMovementPage.js                - حركات المخزون
  - StockAlertsPage.js                  - تنبيهات المخزون
  - InventoryTransferPage.js            - نقل المخزون
  - InventoryReportsPage.js             - تقارير المخزون
```

### Backend:
```
backend/routes/
  - inventory.js                        - إدارة الأصناف
  - warehouses.js                       - إدارة المخازن
  - stockLevels.js                      - مستويات المخزون
  - stockMovements.js                   - حركات المخزون
  - inventoryIssue.js                   - صرف القطع
  - inventoryIntegration.js             - التكامل مع الأنظمة الأخرى
```

### Services:
```
frontend/react-app/src/services/
  - inventoryService.js                 - خدمات المخزون
```

---

## 🎯 خطة التحسين

### المرحلة 1: إصلاح قاعدة البيانات
- [ ] إضافة soft delete للجداول
- [ ] حذف البيانات التجريبية
- [ ] إضافة indexes للأداء

### المرحلة 2: تحسين Backend
- [ ] توحيد معالجة الأخطاء
- [ ] إضافة validation شامل
- [ ] تحسين queries

### المرحلة 3: تحسين Frontend
- [ ] صفحة مخزون محسنة مع إحصائيات
- [ ] تحسين صفحة إدارة المخازن
- [ ] تحسين صفحة حركات المخزون
- [ ] إضافة لوحة تحكم للمخزون

### المرحلة 4: التكامل
- [ ] التكامل مع طلبات الإصلاح
- [ ] التكامل مع الفواتير
- [ ] التكامل مع المشتريات

---

**آخر مراجعة:** 2 أكتوبر 2025  
**الحالة:** قيد التحسين  
**الأولوية:** عالية

