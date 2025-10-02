# 🗺️ خارطة الطريق المرحلية التفصيلية
## Phased Development Roadmap - Inventory Module

**التاريخ:** 2 أكتوبر 2025  
**المدة الإجمالية:** 3.5 شهر (14 أسبوع)

---

## 📊 نظرة عامة على المراحل

```
┌─────────────────────────────────────────────────────────────┐
│ Timeline الخطة الكاملة - 14 أسبوع                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🟢 Phase 1: Quick Wins          ██████ (2 أسابيع)          │
│ 🟡 Phase 2: Core Enhancements   ████████████ (4 أسابيع)     │
│ 🔵 Phase 3: Advanced Features   ████████████████ (6 أسابيع) │
│ 🟣 Phase 4: Finalization        ████ (2 أسبوع)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🟢 المرحلة 1: Quick Wins (أسبوعان)
**الأهداف:** إصلاحات سريعة، تحسينات فورية، قاعدة صلبة

### 📅 الأسبوع 1: إصلاح القاعدة

#### اليوم 1-2: تحديثات قاعدة البيانات

**المهام:**
```sql
-- 1. إضافة soft delete
ALTER TABLE Warehouse ADD COLUMN deletedAt TIMESTAMP NULL;
ALTER TABLE InventoryItem ADD COLUMN deletedAt TIMESTAMP NULL;

-- 2. إضافة الأعمدة المهمة الناقصة
ALTER TABLE Warehouse ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE Warehouse ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3. إضافة أعمدة محسنة لـ InventoryItem
ALTER TABLE InventoryItem 
ADD COLUMN brand VARCHAR(100),
ADD COLUMN model VARCHAR(100),
ADD COLUMN barcode VARCHAR(100) UNIQUE,
ADD COLUMN partNumber VARCHAR(100) UNIQUE,
ADD COLUMN reorderPoint INT DEFAULT 10,
ADD COLUMN reorderQuantity INT DEFAULT 50;

-- 4. تحديث Vendor
ALTER TABLE Vendor 
ADD COLUMN status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN deletedAt TIMESTAMP NULL;

-- 5. تحسين PurchaseOrder
ALTER TABLE PurchaseOrder 
ADD COLUMN taxRate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN taxAmount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN deletedAt TIMESTAMP NULL;
```

**المخرجات:**
- ✅ جداول محدثة ومحسنة
- ✅ Soft delete يعمل
- ✅ Migration script موثق

**الوقت المقدر:** 2 أيام  
**المسؤول:** Backend Developer

---

#### اليوم 3-4: تنظيف البيانات وإنشاء بيانات تجريبية

**المهام:**
```sql
-- 1. حذف البيانات التجريبية القديمة
DELETE FROM InventoryItem WHERE sku LIKE 'TEST-%';
DELETE FROM StockLevel WHERE inventoryItemId IN (
  SELECT id FROM InventoryItem WHERE sku LIKE 'TEST-%'
);

-- 2. إنشاء فئات أساسية
INSERT INTO InventoryItemCategory (name, description) VALUES
('شاشات', 'شاشات الهواتف واللابتوب'),
('بطاريات', 'بطاريات ليثيوم'),
('أدوات', 'أدوات وخامات الصيانة'),
('كابلات', 'كابلات وموصلات'),
('قطع غيار', 'قطع غيار متنوعة');

-- 3. تحديث الأصناف الموجودة
UPDATE InventoryItem SET categoryId = 1 WHERE name LIKE '%شاشة%';
UPDATE InventoryItem SET categoryId = 2 WHERE name LIKE '%بطارية%';

-- 4. إنشاء موردين تجريبيين
INSERT INTO Vendor (name, phone, email, contactPerson, status) VALUES
('شركة الإلكترونيات المتقدمة', '0123456789', 'info@advanced.com', 'أحمد محمد', 'active'),
('شركة قطع الغيار الحديثة', '0109876543', 'info@modern.com', 'خالد عبدالله', 'active');
```

**المخرجات:**
- ✅ قاعدة بيانات نظيفة
- ✅ بيانات تجريبية واقعية
- ✅ فئات منظمة

**الوقت المقدر:** 2 أيام  
**المسؤول:** Backend Developer

---

#### اليوم 5-7: تحسين APIs الحالية

**المهام:**

**1. تحديث Inventory Controller:**
```javascript
// backend/controllers/inventory.js
const inventoryController = {
  async getAllItems(req, res) {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      category = '',
      lowStock = false 
    } = req.query;
    
    try {
      let query = `
        SELECT 
          i.*,
          c.name as categoryName,
          SUM(sl.currentQuantity) as totalQuantity,
          SUM(sl.availableQuantity) as totalAvailable
        FROM InventoryItem i
        LEFT JOIN InventoryItemCategory c ON i.categoryId = c.id
        LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
        WHERE i.deletedAt IS NULL
      `;
      
      // إضافة filters
      // إضافة pagination
      // تنفيذ Query
      
      res.json({ success: true, data: { items, pagination } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // باقي الدوال...
};
```

**2. إضافة Validation:**
```javascript
// backend/middleware/validation.js
const { body, param, query } = require('express-validator');

const inventoryValidation = {
  create: [
    body('name').notEmpty().withMessage('اسم الصنف مطلوب'),
    body('purchasePrice').isFloat({ min: 0 }).withMessage('سعر الشراء يجب أن يكون رقم موجب'),
    body('sellingPrice').isFloat({ min: 0 }).withMessage('سعر البيع يجب أن يكون رقم موجب'),
    // ...
  ],
  update: [
    // ...
  ]
};
```

**3. توحيد Error Handling:**
```javascript
// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'خطأ في البيانات المدخلة',
      errors: err.errors
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
```

**المخرجات:**
- ✅ Inventory Controller محسن
- ✅ Validation شاملة
- ✅ Error handling موحد
- ✅ Warehouses & Vendors APIs محسنة

**الوقت المقدر:** 3 أيام  
**المسؤول:** Backend Developer

---

### 📅 الأسبوع 2: تحسين Frontend

#### اليوم 8-10: إصلاح API Routes

**المهام:**

**1. تصحيح API Calls:**
```javascript
// frontend/react-app/src/services/inventoryService.js
class InventoryService {
  async getItems(params = {}) {
    // ❌ خطأ: return apiService.request('/inventory/items');
    // ✅ صحيح:
    const queryString = new URLSearchParams(params).toString();
    return apiService.request(`/inventory${queryString ? '?' + queryString : ''}`);
  }
  
  async getItem(id) {
    return apiService.request(`/inventory/${id}`);
  }
  
  async createItem(data) {
    return apiService.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async updateItem(id, data) {
    return apiService.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async deleteItem(id) {
    return apiService.request(`/inventory/${id}`, {
      method: 'DELETE'
    });
  }
  
  // Stock Levels
  async getStockLevels(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiService.request(`/stock-levels${queryString ? '?' + queryString : ''}`);
  }
  
  // Stock Movements
  async getStockMovements(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiService.request(`/stock-movements${queryString ? '?' + queryString : ''}`);
  }
}

export default new InventoryService();
```

**2. تحديث جميع الصفحات:**
- InventoryManagementPage.js
- StockMovementPage.js
- WarehouseManagementPage.js
- StockAlertsPage.js

**المخرجات:**
- ✅ جميع API calls صحيحة
- ✅ inventoryService موحد ومنظم
- ✅ Loading & Error states

**الوقت المقدر:** 3 أيام  
**المسؤول:** Frontend Developer

---

#### اليوم 11-14: تحسين واجهات المستخدم

**المهام:**

**1. تحسين InventoryPage.js:**
```javascript
// إضافة إحصائيات في الأعلى
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="إجمالي الأصناف"
      value={stats.totalItems}
      icon={<Inventory />}
      color="primary"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="قيمة المخزون"
      value={formatCurrency(stats.totalValue)}
      icon={<AttachMoney />}
      color="success"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="أصناف منخفضة"
      value={stats.lowStockItems}
      icon={<Warning />}
      color="warning"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="نفذت من المخزون"
      value={stats.outOfStockItems}
      icon={<Error />}
      color="error"
    />
  </Grid>
</Grid>

// إضافة فلاتر متقدمة
<Box sx={{ mb: 2 }}>
  <Grid container spacing={2}>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        label="بحث"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon />
        }}
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <FormControl fullWidth>
        <InputLabel>الفئة</InputLabel>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <MenuItem value="">الكل</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} md={3}>
      <FormControl fullWidth>
        <InputLabel>الحالة</InputLabel>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="">الكل</MenuItem>
          <MenuItem value="active">نشط</MenuItem>
          <MenuItem value="inactive">غير نشط</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} md={2}>
      <Button
        fullWidth
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
      >
        إضافة صنف
      </Button>
    </Grid>
  </Grid>
</Box>
```

**2. إضافة Dialogs محسنة:**
- AddItemDialog.js
- EditItemDialog.js
- ViewItemDetailsDialog.js

**3. تحسين الجداول:**
- إضافة pagination
- إضافة sorting
- تحسين التصميم

**المخرجات:**
- ✅ واجهات محسنة بشكل كبير
- ✅ UX أفضل
- ✅ إحصائيات واضحة
- ✅ Responsive design

**الوقت المقدر:** 4 أيام  
**المسؤول:** Frontend Developer

---

### 📊 مخرجات المرحلة 1 (Quick Wins)

**ما تم إنجازه:**
- ✅ قاعدة بيانات محسنة مع soft delete
- ✅ بيانات نظيفة ومنظمة
- ✅ فئات للأصناف
- ✅ APIs محسنة مع validation
- ✅ Error handling موحد
- ✅ Frontend APIs صحيحة
- ✅ واجهات محسنة
- ✅ تقارير أساسية (3 تقارير)

**المقاييس:**
- دقة APIs: 100% ✅
- تحسين سرعة التحميل: 35% ⬆️
- رضا المستخدم: +40% ⬆️

**الحالة:** ✅ **جاهز للإطلاق**

---

## 🟡 المرحلة 2: Core Enhancements (4 أسابيع)
**الأهداف:** بناء الوظائف الأساسية المتقدمة

### 📅 الأسبوع 3-4: نظام حركات المخزون المتقدم

#### المهام الرئيسية:

**1. إنشاء جداول جديدة:**
```sql
-- StockTransfer, StockTransferItem
-- StockCount, StockCountItem
-- InventoryItemCategory
-- StockAlert
```

**2. تحديث StockMovement:**
```sql
ALTER TABLE StockMovement 
MODIFY COLUMN movementType ENUM(
  'in', 'out', 
  'transfer_out', 'transfer_in',
  'adjustment', 'reserve', 'unreserve',
  'write_off', 'return_from_customer', 'return_to_vendor'
);
```

**3. بناء Stock Transfer APIs:**
```javascript
// POST /api/stock-transfers
// GET /api/stock-transfers
// PUT /api/stock-transfers/:id/approve
// POST /api/stock-transfers/:id/ship
// POST /api/stock-transfers/:id/receive
```

**4. بناء Stock Count APIs:**
```javascript
// POST /api/stock-counts
// POST /api/stock-counts/:id/items
// PUT /api/stock-counts/:id/review
// POST /api/stock-counts/:id/adjust
```

**5. Frontend Pages:**
- StockTransferPage.js (نقل بين الفروع)
- StockCountPage.js (الجرد)
- StockCountFormPage.js (نموذج الجرد)

**المخرجات:**
- ✅ نظام نقل بين الفروع كامل
- ✅ نظام جرد إلكتروني
- ✅ حركات مخزنية موثقة
- ✅ تقارير حركات المخزون

**الوقت المقدر:** أسبوعان  
**المسؤول:** Full Team

---

### 📅 الأسبوع 5-6: التكامل مع الصيانة والمالية

#### المهام:

**1. ربط تلقائي مع الصيانة:**
```javascript
// عند إضافة قطعة لتذكرة صيانة
POST /api/repairs/:id/parts
{
  "inventoryItemId": 10,
  "quantity": 1,
  "warehouseId": 1,
  "addToInvoice": true
}

// ما يحدث تلقائياً:
// 1. حجز الكمية (reserve)
// 2. إنشاء PartsUsed
// 3. StockMovement (out)
// 4. خصم من StockLevel
// 5. إضافة لـ Invoice
```

**2. ربط تلقائي مع PurchaseOrder:**
```javascript
// عند استلام PO
POST /api/purchase-orders/:id/receive

// ما يحدث:
// 1. تحديث receivedQuantity
// 2. StockMovement (in)
// 3. تحديث StockLevel
// 4. إنشاء Expense
// 5. تحديث Vendor balance
```

**3. APIs للتكامل:**
```javascript
// POST /api/inventory/issue  (صرف لصيانة)
// POST /api/inventory/return (إرجاع من صيانة)
// GET /api/repairs/:id/parts-used
// GET /api/purchase-orders/:id/received-items
```

**4. Webhooks/Events:**
```javascript
// Event: 'repair.part.added'
// Event: 'purchase_order.received'
// Event: 'stock.low_level'
```

**المخرجات:**
- ✅ ربط تلقائي 100% مع الصيانة
- ✅ ربط تلقائي مع المشتريات
- ✅ ربط مع المالية (مصروفات)
- ✅ Event-driven architecture

**الوقت المقدر:** أسبوعان  
**المسؤول:** Backend Developer + Integration

---

### 📊 مخرجات المرحلة 2 (Core Enhancements)

**ما تم إنجازه:**
- ✅ نظام نقل بين الفروع (Multi-Warehouse)
- ✅ جرد إلكتروني كامل
- ✅ تكامل 100% مع الصيانة
- ✅ تكامل مع PO والمالية
- ✅ Event-driven system
- ✅ 10+ تقارير تحليلية

**المقاييس:**
- دقة المخزون: 95%+ ✅
- التكامل: 100% ✅
- تسريع العمليات: 40% ⬆️

**الحالة:** ✅ **جاهز للإطلاق**

---

## 🔵 المرحلة 3: Advanced Features (6 أسابيع)
**الأهداف:** الميزات المتقدمة والذكاء

### 📅 الأسبوع 7-8: نظام الباركود

**المهام:**

**1. جدول BarcodeScan:**
```sql
CREATE TABLE BarcodeScan ( /* ... */ );
```

**2. Backend APIs:**
```javascript
GET  /api/barcode/lookup/:barcode
POST /api/barcode/scan
POST /api/barcode/generate/:itemId
```

**3. Frontend - Barcode Scanner:**
```javascript
import { BrowserMultiFormatReader } from '@zxing/library';

const BarcodeScanner = () => {
  const scanBarcode = async () => {
    const codeReader = new BrowserMultiFormatReader();
    const result = await codeReader.decodeOnceFromVideoDevice();
    // معالجة النتيجة
  };
  
  return <video ref={videoRef} />;
};
```

**4. تكامل مع الحركات:**
- مسح باركود عند الاستلام
- مسح باركود عند الصرف
- مسح باركود في الجرد

**المخرجات:**
- ✅ نظام باركود كامل
- ✅ مسح من الكاميرا
- ✅ طباعة باركود
- ✅ تسريع 60% في العمليات

**الوقت المقدر:** أسبوعان

---

### 📅 الأسبوع 9-10: التنبيهات الذكية

**المهام:**

**1. جدول StockAlert:**
```sql
CREATE TABLE StockAlert ( /* ... */ );
```

**2. Triggers تلقائية:**
```sql
CREATE TRIGGER check_low_stock_after_movement
AFTER INSERT ON StockMovement
FOR EACH ROW
BEGIN
  -- فحص المستوى
  -- إنشاء تنبيه إذا لزم
END;
```

**3. Backend Job (Cron):**
```javascript
// كل ساعة - فحص المخزون المنخفض
cron.schedule('0 * * * *', async () => {
  await checkLowStockLevels();
  await checkExpiringItems();
  await sendAlertNotifications();
});
```

**4. Frontend - Alerts Dashboard:**
```javascript
<AlertsDashboard>
  <AlertCard type="critical" count={3} />
  <AlertCard type="warning" count={7} />
  <AlertCard type="info" count={2} />
  <AlertsList />
</AlertsDashboard>
```

**5. إشعارات:**
- بريد إلكتروني
- إشعار في النظام
- رسالة SMS (اختياري)

**المخرجات:**
- ✅ تنبيهات ذكية تلقائية
- ✅ 5 أنواع تنبيهات
- ✅ إشعارات فورية
- ✅ تقليل نفاد المخزون 80%

**الوقت المقدر:** أسبوعان

---

### 📅 الأسبوع 11-12: داشبورد تحليلي

**المهام:**

**1. Backend - Analytics APIs:**
```javascript
GET /api/analytics/inventory-trends
GET /api/analytics/top-items
GET /api/analytics/vendor-performance
GET /api/analytics/stock-turnover
```

**2. Frontend - Dashboard:**
```javascript
import { LineChart, BarChart, PieChart } from 'recharts';

<Dashboard>
  <ChartCard title="اتجاه المخزون">
    <LineChart data={inventoryTrend} />
  </ChartCard>
  
  <ChartCard title="الأصناف الأكثر استخداماً">
    <BarChart data={topItems} />
  </ChartCard>
  
  <ChartCard title="توزيع الفئات">
    <PieChart data={categoryDistribution} />
  </ChartCard>
  
  <ChartCard title="أداء الموردين">
    <BarChart data={vendorPerformance} />
  </ChartCard>
</Dashboard>
```

**3. تقارير متقدمة:**
- تقرير ABC Analysis
- تقرير Turnover Rate
- تقرير الربحية
- تقرير Vendor Performance

**المخرجات:**
- ✅ داشبورد تحليلي شامل
- ✅ رسوم بيانية تفاعلية
- ✅ 15+ تقرير متقدم
- ✅ قرارات مبنية على بيانات

**الوقت المقدر:** أسبوعان

---

### 📊 مخرجات المرحلة 3 (Advanced Features)

**ما تم إنجازه:**
- ✅ نظام باركود احترافي
- ✅ تنبيهات ذكية تلقائية
- ✅ داشبورد تحليلي
- ✅ تقارير متقدمة (15+)
- ✅ نظام ذكي قائم على البيانات

**المقاييس:**
- دقة المخزون: 98%+ ✅
- سرعة العمليات: +60% ⬆️
- نفاد المخزون: -80% ⬇️
- رضا المستخدم: 4.8/5 ⭐

**الحالة:** ✅ **Production Ready**

---

## 🟣 المرحلة 4: Finalization (أسبوعان)

### الأسبوع 13: الاختبارات النهائية

**المهام:**
- ✅ Unit Tests (100 test)
- ✅ Integration Tests (50 test)
- ✅ E2E Tests (20 scenario)
- ✅ Performance Testing
- ✅ Security Audit
- ✅ Bug Fixes

---

### الأسبوع 14: التوثيق والإطلاق

**المهام:**
- ✅ توثيق APIs كامل
- ✅ دليل المستخدم
- ✅ فيديوهات تعليمية
- ✅ Training للمستخدمين
- ✅ Deployment Production
- ✅ Monitoring Setup

---

## ✅ الخلاصة

**إجمالي المدة:** 14 أسبوع (3.5 شهر)  
**إجمالي ساعات العمل المقدرة:** 480 ساعة  
**الفريق المطلوب:** 2 Backend + 1 Frontend + 1 QA

**المخرجات النهائية:**
- ✅ نظام مخزون متكامل 100%
- ✅ دقة 98%+
- ✅ سرعة +60%
- ✅ توفير 15-20% في التكاليف
- ✅ نظام ذكي وقابل للتطوير

---

**للانتقال للوثيقة التالية:**
- [← مواصفات APIs](./04_API_SPECIFICATIONS.md)
- [→ تصميم UI/UX](./06_UI_UX_DESIGN.md)

