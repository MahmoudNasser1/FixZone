# 🔧 **المرجع التقني - Phase 1**

## 📚 **دليل المطور**

هذا الملف يوفر مرجع تقني شامل لجميع التغييرات في Phase 1.

---

## 🗄️ **قاعدة البيانات**

### **الجداول المحدثة**

#### **1. Warehouse**
```sql
-- Columns المضافة
deletedAt TIMESTAMP NULL
managerId INT NULL
capacity INT NULL
type ENUM('main', 'branch', 'returns', 'damaged') DEFAULT 'main'
phone VARCHAR(20)
email VARCHAR(100)
notes TEXT
```

#### **2. Vendor**
```sql
-- Columns المضافة
deletedAt TIMESTAMP NULL
contactPerson VARCHAR(100)
taxNumber VARCHAR(50)
paymentTerms VARCHAR(50) DEFAULT 'نقدي'
creditLimit DECIMAL(10,2) DEFAULT 0
notes TEXT
status ENUM('active', 'inactive', 'on_hold') DEFAULT 'active'
rating DECIMAL(3,2) CHECK (rating >= 1 AND rating <= 5)
category VARCHAR(100)
```

#### **3. InventoryItem**
```sql
-- Columns المضافة
deletedAt TIMESTAMP NULL
partNumber VARCHAR(100) UNIQUE
barcode VARCHAR(100) UNIQUE
brand VARCHAR(100)
model VARCHAR(100)
`condition` ENUM('new', 'used', 'refurbished', 'damaged') DEFAULT 'new'
categoryId INT NULL
preferredVendorId INT NULL
reorderPoint INT DEFAULT 10
reorderQuantity INT DEFAULT 50
```

#### **4. StockMovement**
```sql
-- Columns المضافة
fromWarehouseId INT NULL
toWarehouseId INT NULL
referenceType VARCHAR(50)
referenceId INT NULL
notes TEXT
createdBy INT NULL
```

### **SQL Views**

#### **v_inventory_summary**
```sql
CREATE VIEW v_inventory_summary AS
SELECT 
  i.id, i.name, i.sku, i.barcode, i.categoryId,
  c.name as categoryName,
  COALESCE(SUM(sl.currentQuantity), 0) as totalQuantity,
  COALESCE(SUM(sl.reservedQuantity), 0) as totalReserved,
  COALESCE(SUM(sl.availableQuantity), 0) as totalAvailable,
  i.purchasePrice * COALESCE(SUM(sl.currentQuantity), 0) as totalCostValue,
  i.sellingPrice * COALESCE(SUM(sl.currentQuantity), 0) as totalSellingValue
FROM InventoryItem i
LEFT JOIN InventoryItemCategory c ON i.categoryId = c.id
LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
WHERE i.deletedAt IS NULL
GROUP BY i.id;
```

#### **v_low_stock_items**
```sql
CREATE VIEW v_low_stock_items AS
SELECT 
  i.id, i.name, i.sku,
  COALESCE(SUM(sl.currentQuantity), 0) as totalQuantity,
  i.minStockLevel,
  i.reorderPoint
FROM InventoryItem i
LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
WHERE i.deletedAt IS NULL
GROUP BY i.id
HAVING totalQuantity <= i.minStockLevel OR totalQuantity <= i.reorderPoint;
```

---

## 🔌 **Backend APIs**

### **Enhanced Inventory Endpoints**

#### **GET /api/inventory-enhanced/items**
**الوصف:** قائمة الأصناف مع فلترة وترتيب متقدم

**Query Parameters:**
```javascript
{
  page: 1,              // رقم الصفحة
  limit: 20,            // عدد العناصر في الصفحة
  search: '',           // البحث (name, sku, barcode, partNumber)
  category: '',         // الفئة
  status: '',           // الحالة (active/inactive)
  condition: '',        // الحالة (new/used/refurbished/damaged)
  lowStock: false,      // فقط الأصناف المنخفضة
  warehouseId: '',      // المخزن المحدد
  sortBy: 'name',       // الحقل للترتيب
  sortOrder: 'ASC'      // اتجاه الترتيب
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "شاشة LCD هاتف",
        "sku": "PART-001",
        "categoryName": "شاشات",
        "totalStock": 100,
        "totalReserved": 0,
        "purchasePrice": "150.00",
        "sellingPrice": "250.00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 33,
      "totalPages": 2
    }
  }
}
```

#### **GET /api/inventory-enhanced/stats**
**الوصف:** إحصائيات شاملة للمخزون

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalItems": 33,
      "activeItems": 33,
      "lowStockItems": 0,
      "outOfStockItems": 0,
      "totalQuantity": "270",
      "totalCostValue": "30800.00",
      "totalSellingValue": "48200.00",
      "totalCategories": 5
    },
    "byCategory": [...],
    "byWarehouse": [...],
    "topItems": [...],
    "recentMovements": [...]
  }
}
```

#### **POST /api/inventory-enhanced/movements**
**الوصف:** إضافة حركة مخزنية جديدة

**Request Body:**
```json
{
  "inventoryItemId": 1,
  "warehouseId": 1,
  "movementType": "in",
  "quantity": 50,
  "unitCost": 150.00,
  "totalCost": 7500.00,
  "referenceType": "purchase_order",
  "referenceId": 1,
  "notes": "استلام من المورد",
  "createdBy": 1
}
```

**Movement Types:**
- `in` - دخول
- `out` - خروج
- `transfer` - نقل
- `adjustment` - تسوية
- `repair_consumption` - استهلاك في صيانة
- `sale` - بيع
- `return_from_repair` - إرجاع من صيانة
- `return_to_vendor` - إرجاع للمورد
- `initial_stock` - مخزون افتتاحي
- `write_off` - شطب
- `reserve` - حجز
- `unreserve` - إلغاء حجز

---

## 🎨 **Frontend Components**

### **1. StatsDashboard**

**الموقع:** `src/components/inventory/StatsDashboard.js`

**Props:**
```typescript
interface StatsDashboardProps {
  stats: {
    overview: {
      totalItems: number;
      totalCostValue: number;
      totalQuantity: number;
    };
    alerts: {
      lowStockItems: number;
      outOfStockItems: number;
    };
  };
  loading?: boolean;
}
```

**الاستخدام:**
```jsx
import StatsDashboard from '../../components/inventory/StatsDashboard';

<StatsDashboard stats={stats} loading={loading} />
```

### **2. SearchAndFilter**

**الموقع:** `src/components/inventory/SearchAndFilter.js`

**Props:**
```typescript
interface SearchAndFilterProps {
  onSearch: (term: string) => void;
  onFilter: (filters: object) => void;
  onSort: (field: string, order: string) => void;
  onViewChange: (mode: 'grid' | 'list') => void;
  categories?: Array<{id: number, name: string}>;
  warehouses?: Array<{id: number, name: string}>;
  vendors?: Array<{id: number, name: string}>;
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### **3. EnhancedInventoryTable**

**الموقع:** `src/components/inventory/EnhancedInventoryTable.js`

**Props:**
```typescript
interface EnhancedInventoryTableProps {
  items: Array<any>;
  loading?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: number) => void;
  onView?: (item: any) => void;
  viewMode?: 'grid' | 'list';
}
```

**المميزات:**
- عرض Grid و List
- مؤشرات حالة المخزون
- تنسيق الأسعار والأرقام
- أزرار إجراءات محسنة

---

## 🧪 **الاختبار**

### **1. APIs Testing**

**ملف:** `testing/test-frontend-apis.js`

**الاختبارات:**
1. Enhanced Inventory Items API
2. Enhanced Stock Movements API
3. Enhanced Statistics API
4. Vendors API
5. Warehouses API
6. Create Item Validation

**التشغيل:**
```bash
cd /opt/lampp/htdocs/FixZone
node testing/test-frontend-apis.js
```

### **2. Enhanced UI Testing**

**ملف:** `testing/test-enhanced-ui.js`

**الاختبارات:**
1. Enhanced Statistics API
2. Enhanced Items with Pagination
3. Enhanced Items with Search
4. Enhanced Stock Movements
5. Vendors Data
6. Warehouses Data

**التشغيل:**
```bash
node testing/test-enhanced-ui.js
```

### **3. Browser Testing (Playwright)**

**الصفحات المختبرة:**
- `/inventory` - صفحة المخزون الرئيسية
- `/inventory/stock-movements` - صفحة الحركات المخزنية
- `/inventory/warehouses` - صفحة إدارة المخازن

**الاختبارات:**
- تسجيل الدخول
- التنقل بين الصفحات
- عرض البيانات
- البحث والفلترة
- أزرار الإجراءات

---

## 🔐 **أمان وصلاحيات**

### **Validation Rules**

#### **Inventory Item:**
```javascript
{
  name: required, max 100 chars
  sku: optional, max 50 chars
  purchasePrice: required, min 0
  sellingPrice: required, min 0
  minStockLevel: optional, min 0, default 0
  maxStockLevel: optional, min 0, default 1000
  categoryId: optional, positive integer
  preferredVendorId: optional, positive integer
}
```

#### **Stock Movement:**
```javascript
{
  inventoryItemId: required, positive integer
  warehouseId: required, positive integer
  movementType: required, enum (in|out|transfer|adjustment|...)
  quantity: required, min 1
  unitCost: optional, min 0
  referenceType: optional, max 50 chars
  referenceId: optional, positive integer
}
```

### **Error Handling**

**Error Response Format:**
```json
{
  "success": false,
  "message": "خطأ في البيانات المدخلة",
  "errors": [
    {
      "field": "purchasePrice",
      "message": "سعر الشراء مطلوب"
    }
  ]
}
```

**HTTP Status Codes:**
- `200` - نجاح
- `201` - تم الإنشاء بنجاح
- `400` - بيانات غير صالحة
- `401` - غير مصرح
- `404` - غير موجود
- `409` - تكرار (Duplicate)
- `500` - خطأ في السيرفر

---

## 📊 **أداء النظام**

### **Database Indexes**

```sql
-- InventoryItem
CREATE INDEX idx_inventory_item_sku ON InventoryItem(sku);
CREATE INDEX idx_inventory_item_barcode ON InventoryItem(barcode);
CREATE INDEX idx_inventory_item_category ON InventoryItem(categoryId);
CREATE INDEX idx_inventory_item_vendor ON InventoryItem(preferredVendorId);
CREATE INDEX idx_inventory_item_deleted ON InventoryItem(deletedAt);

-- StockMovement
CREATE INDEX idx_stock_movement_item ON StockMovement(inventoryItemId);
CREATE INDEX idx_stock_movement_warehouse ON StockMovement(warehouseId);
CREATE INDEX idx_stock_movement_type ON StockMovement(movementType);
CREATE INDEX idx_stock_movement_date ON StockMovement(createdAt);

-- StockLevel
CREATE INDEX idx_stock_level_item ON StockLevel(inventoryItemId);
CREATE INDEX idx_stock_level_warehouse ON StockLevel(warehouseId);
```

### **SQL Views Performance**

| View | الوصف | الأداء |
|------|-------|--------|
| v_inventory_summary | ملخص المخزون | سريع (مع indexes) |
| v_low_stock_items | الأصناف المنخفضة | سريع جداً |
| v_stock_movements_detailed | الحركات التفصيلية | متوسط |

---

## 🔄 **Integration مع Modules أخرى**

### **1. Repairs Module**

**التكامل:**
- استهلاك القطع من المخزون عند الصيانة
- إرجاع القطع المرتجعة للمخزون
- تسجيل التكلفة في الفاتورة

**API:**
```javascript
POST /api/inventory/issue
{
  repairRequestId: 1,
  inventoryItemId: 1,
  warehouseId: 1,
  quantity: 1,
  userId: 1
}
```

### **2. Finance Module**

**التكامل:**
- ربط أوامر الشراء بالفواتير
- تسجيل المدفوعات للموردين
- تتبع المصروفات

### **3. Reports Module**

**التقارير المتاحة:**
- تقرير حركة المخزون
- تقرير الأصناف الأكثر استهلاكاً
- تقرير الموردين
- تقرير قيمة المخزون

---

## 🛠️ **Development Guidelines**

### **1. إضافة API Endpoint جديد**

```javascript
// 1. تعريف الـ Schema في validation.js
const mySchema = Joi.object({
  field1: Joi.string().required(),
  field2: Joi.number().optional()
});

// 2. إضافة Controller في inventoryEnhanced.js
exports.myFunction = asyncHandler(async (req, res) => {
  const data = req.body;
  // Logic here
  res.json({ success: true, data });
});

// 3. إضافة Route في inventoryEnhanced.js
router.post('/my-endpoint', validate(mySchema), controller.myFunction);
```

### **2. إضافة Frontend Component**

```jsx
// 1. إنشاء Component
import React from 'react';

const MyComponent = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;
  return <div>{data}</div>;
};

export default MyComponent;

// 2. استخدام Component
import MyComponent from './components/MyComponent';

<MyComponent data={myData} loading={isLoading} />
```

### **3. إضافة Service Function**

```javascript
// في inventoryService.js
myNewFunction(params) {
  const qs = new URLSearchParams(params).toString();
  return apiService.request(`/my-endpoint${qs ? `?${qs}` : ''}`);
}
```

---

## 📦 **البيانات التجريبية**

### **الموردين (26 مورد)**

| المورد | الفئة | الحالة | التقييم |
|--------|-------|--------|----------|
| مورد قطع الغيار الأول | قطع غيار | نشط | 4.8 |
| شركة الشاشات المتقدمة | شاشات | نشط | 4.6 |
| مورد البطاريات الذكية | بطاريات | نشط | 4.7 |
| ... | ... | ... | ... |

### **الأصناف (33 صنف)**

| الفئة | عدد الأصناف | قيمة المخزون |
|-------|-------------|--------------|
| شاشات | 10 | 12,000 ج.م |
| بطاريات | 8 | 5,500 ج.م |
| أدوات | 6 | 3,200 ج.م |
| كابلات | 5 | 800 ج.م |
| اكسسوارات | 4 | 900 ج.م |

### **الحركات المخزنية (19 حركة)**

| النوع | العدد | القيمة |
|-------|------|--------|
| دخول (in) | 12 | 25,000 ج.م |
| خروج (out) | 4 | 2,500 ج.م |
| نقل (transfer) | 2 | - |
| تسوية (adjustment) | 1 | 300 ج.م |

---

## 🔧 **المشاكل الشائعة والحلول**

### **مشكلة 1: "Cannot find module 'axios'"**
```bash
# الحل
cd /opt/lampp/htdocs/FixZone
npm install axios
```

### **مشكلة 2: "db.promise is not a function"**
```javascript
// ❌ خطأ
await db.promise().execute(sql, params);

// ✅ صحيح
await db.execute(sql, params);
```

### **مشكلة 3: "Unknown column 'u.name' in 'field list'"**
```javascript
// ❌ خطأ
LEFT JOIN User u ON sm.createdBy = u.id

// ✅ صحيح (User table غير موجود)
// إزالة الـ LEFT JOIN واستخدام sm.createdBy مباشرة
```

### **مشكلة 4: "Bind parameters must not contain undefined"**
```javascript
// ❌ خطأ
const params = [data.field1, data.field2];

// ✅ صحيح
const params = [data.field1 || null, data.field2 || null];
```

---

## 📝 **Best Practices**

### **Backend**

1. **استخدام asyncHandler دائماً:**
```javascript
exports.myFunction = asyncHandler(async (req, res) => {
  // Code here
});
```

2. **استخدام Joi للـ Validation:**
```javascript
router.post('/endpoint', validate(mySchema), controller.myFunction);
```

3. **استخدام AppError للأخطاء المخصصة:**
```javascript
throw new AppError('رسالة الخطأ', 404);
```

4. **استخدام NULL بدلاً من undefined:**
```javascript
const value = data.field || null; // ✅ صحيح
const value = data.field || undefined; // ❌ خطأ
```

### **Frontend**

1. **استخدام LoadingSpinner دائماً:**
```jsx
{loading && <LoadingSpinner message="جاري التحميل..." />}
```

2. **استخدام ErrorHandler للأخطاء:**
```jsx
{error && <ErrorHandler error={error} onRetry={reload} />}
```

3. **استخدام inventoryService للـ APIs:**
```javascript
const items = await inventoryService.listItems();
```

4. **معالجة الاستجابات بشكل صحيح:**
```javascript
if (response && response.success) {
  setData(response.data?.items || response.data || []);
} else if (Array.isArray(response)) {
  setData(response);
}
```

---

## 🔗 **روابط مفيدة**

- **التوثيق الكامل:** [PHASE1_COMPLETE_DOCUMENTATION.md](./PHASE1_COMPLETE_DOCUMENTATION.md)
- **دليل سريع:** [PHASE1_README.md](./PHASE1_README.md)
- **خطة المشروع:** [InventoryModulePlan/](./InventoryModulePlan/)
- **تعليمات الاختبار:** [testing/QUICK_TEST_INSTRUCTIONS.md](./testing/QUICK_TEST_INSTRUCTIONS.md)

---

**آخر تحديث:** 3 أكتوبر 2025  
**الإصدار:** 1.0  
**المطور:** FixZone Team

