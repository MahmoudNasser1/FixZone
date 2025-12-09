# 📋 خطة التنفيذ التفصيلية للمهام المتبقية
## Detailed Implementation Plan for Remaining Tasks

**التاريخ:** 2025-10-27  
**الحالة:** تخطيط شامل  
**المهام المتبقية:** 4 مهام (2.3, 3.1, 3.2, 3.3)

---

## 🎯 نظرة عامة

| المهمة | الأولوية | التعقيد | الوقت المقدر | الحالة |
|--------|----------|---------|--------------|--------|
| **2.3** هيكلة إدارة المخزون الكاملة | 🔴 عالية | ⭐⭐⭐⭐⭐ | 3-4 أيام | ⏳ مخطط |
| **3.1** ربط الفواتير بالشراء والمصروفات | 🔴 عالية | ⭐⭐⭐⭐ | 2-3 أيام | ⏳ مخطط |
| **3.2** ربط أصناف المخزون بالفواتير | 🟡 متوسطة | ⭐⭐⭐ | 1-2 أيام | ⏳ مخطط |
| **3.3** ربط العملاء بالفواتير | 🟡 متوسطة | ⭐⭐ | 0.5-1 يوم | ⏳ مخطط |

---

## 📦 المهمة 2.3: هيكلة إدارة المخزون الكاملة

### 🎯 الهدف
بناء نظام إدارة مخزون متكامل يدعم:
- إدارة متعددة المخازن
- إضافة/تعديل الكميات
- نقل المخزون بين المخازن
- تسجيل حركات المخزون
- عرض شامل للمخزون

### 🔍 التحليل الحالي

#### البنية التحتية الموجودة:
1. **Database Tables:**
   - ✅ `Warehouse` - المخازن
   - ✅ `InventoryItem` - الأصناف
   - ✅ `StockLevel` - مستويات المخزون (لكل صنف في كل مخزن)
   - ✅ `StockMovement` - حركات المخزون
   - ✅ `StockTransfer` - نقل المخزون

2. **Backend Routes الموجودة:**
   - `backend/routes/warehouses.js`
   - `backend/routes/stockLevels.js`
   - `backend/routes/stockMovements.js`
   - `backend/routes/stockTransfer.js`
   - `backend/routes/inventory.js`

3. **Frontend Pages الموجودة:**
   - `InventoryPageEnhanced.js` - الصفحة الرئيسية
   - `WarehouseManagementPage.js` - إدارة المخازن
   - `StockMovementPage.js` - حركات المخزون
   - `StockTransferPage.js` - نقل المخزون

#### المشاكل الحالية:
1. ❌ لا يمكن التعديل على الكمية المتاحة حالياً
2. ❌ لا يمكن إضافة كميات جديدة لنفس العنصر
3. ❌ لا يوجد اختيار لتوضيح الصنف موجود في أي مخزن
4. ❌ صفحة نقل المخزون لا تعمل
5. ❌ صفحة حركة المخزون لا تعمل

---

### 📐 خطة التنفيذ التفصيلية

#### **المرحلة 1: إصلاح Backend APIs** (اليوم - 4-6 ساعات)

##### 1.1 إصلاح StockLevel API ✅
**الملفات:**
- `backend/routes/stockLevels.js`
- `backend/controllers/inventoryEnhanced.js` (إذا موجود)

**المهام:**
- [ ] **GET /api/stocklevels** - جلب جميع مستويات المخزون
  - إضافة فلترة بـ `warehouseId`, `inventoryItemId`
  - إضافة pagination
  - إضافة sorting
  
- [ ] **GET /api/stocklevels/:id** - جلب مستويات مخزون لصنف معين
  - إرجاع جميع المخازن التي يوجد فيها الصنف
  - إرجاع الإجمالي العام
  
- [ ] **POST /api/stocklevels** - إضافة/تحديث مستوى مخزون
  - إنشاء StockLevel جديد إذا لم يوجد
  - تحديث الكمية إذا كان موجود
  - تسجيل StockMovement تلقائياً
  
- [ ] **PUT /api/stocklevels/:id** - تعديل مستوى المخزون
  - تحديث `currentQuantity`
  - تحديث `reservedQuantity`
  - تسجيل StockMovement
  
- [ ] **DELETE /api/stocklevels/:id** - حذف مستوى مخزون (soft delete)

**الكود المقترح:**
```javascript
// POST /api/stocklevels - إضافة/تحديث مستوى مخزون
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { inventoryItemId, warehouseId, quantity, notes } = req.body;
    
    // التحقق من وجود الصنف والمخزن
    const [item] = await db.query('SELECT id FROM InventoryItem WHERE id = ?', [inventoryItemId]);
    const [warehouse] = await db.query('SELECT id FROM Warehouse WHERE id = ?', [warehouseId]);
    
    if (!item.length || !warehouse.length) {
      return res.status(400).json({ error: 'الصنف أو المخزن غير موجود' });
    }
    
    // البحث عن StockLevel موجود
    const [existing] = await db.query(
      'SELECT * FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
      [inventoryItemId, warehouseId]
    );
    
    let stockLevel;
    if (existing.length > 0) {
      // تحديث الكمية الموجودة
      const oldQuantity = existing[0].currentQuantity;
      const newQuantity = oldQuantity + (quantity || 0);
      
      await db.execute(
        'UPDATE StockLevel SET currentQuantity = ?, lastUpdated = NOW() WHERE id = ?',
        [newQuantity, existing[0].id]
      );
      
      // تسجيل StockMovement
      await db.execute(
        `INSERT INTO StockMovement 
         (inventoryItemId, warehouseId, movementType, quantity, notes, createdBy, createdAt)
         VALUES (?, ?, 'in', ?, ?, ?, NOW())`,
        [inventoryItemId, warehouseId, quantity, notes, req.user.id]
      );
      
      [stockLevel] = await db.query('SELECT * FROM StockLevel WHERE id = ?', [existing[0].id]);
    } else {
      // إنشاء StockLevel جديد
      const [result] = await db.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, currentQuantity, reservedQuantity, lastUpdated)
         VALUES (?, ?, ?, 0, NOW())`,
        [inventoryItemId, warehouseId, quantity || 0]
      );
      
      // تسجيل StockMovement
      await db.execute(
        `INSERT INTO StockMovement 
         (inventoryItemId, warehouseId, movementType, quantity, notes, createdBy, createdAt)
         VALUES (?, ?, 'in', ?, ?, ?, NOW())`,
        [inventoryItemId, warehouseId, quantity, notes, req.user.id]
      );
      
      [stockLevel] = await db.query('SELECT * FROM StockLevel WHERE id = ?', [result.insertId]);
    }
    
    res.json({ success: true, data: stockLevel[0] });
  } catch (error) {
    console.error('Error managing stock level:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
```

##### 1.2 إصلاح StockTransfer API ✅
**الملفات:**
- `backend/routes/stockTransfer.js`

**المهام:**
- [ ] **GET /api/stocktransfers** - جلب جميع عمليات النقل
- [ ] **GET /api/stocktransfers/:id** - جلب تفاصيل نقل معين
- [ ] **POST /api/stocktransfers** - إنشاء نقل جديد
  - خصم من المخزن المصدر
  - إضافة للمخزن الهدف
  - تسجيل StockMovement (نوع transfer)
  - تحديث StockLevel لكلا المخزنين
  
- [ ] **PUT /api/stocktransfers/:id** - تحديث حالة النقل
- [ ] **DELETE /api/stocktransfers/:id** - إلغاء نقل (مع إرجاع الكميات)

**المنطق:**
```javascript
// POST /api/stocktransfers
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, items, notes } = req.body;
    
    // التحقق من المخازن
    // التحقق من وجود الكمية الكافية في المخزن المصدر
    // بدء transaction
    // خصم من fromWarehouse
    // إضافة إلى toWarehouse
    // تسجيل StockMovement لكل عنصر
    // حفظ النقل في StockTransfer
    // commit transaction
    
  } catch (error) {
    // rollback transaction
  }
});
```

##### 1.3 إصلاح StockMovement API ✅
**الملفات:**
- `backend/routes/stockMovements.js`

**المهام:**
- [ ] **GET /api/stockmovements** - جلب جميع الحركات
  - فلترة بـ `inventoryItemId`, `warehouseId`, `movementType`
  - فلترة بتاريخ
  - sorting و pagination
  
- [ ] **GET /api/stockmovements/:id** - جلب تفاصيل حركة
- [ ] **POST /api/stockmovements** - تسجيل حركة جديدة
  - تحديث StockLevel تلقائياً
  - التحقق من الكمية المتاحة للحركات من نوع 'out'
  
- [ ] **GET /api/stockmovements/inventory/:itemId** - جلب حركات صنف معين

---

#### **المرحلة 2: تحديث الواجهة الأمامية** (اليوم - 5-7 ساعات)

##### 2.1 تحديث InventoryPageEnhanced ✅
**الملفات:**
- `frontend/react-app/src/pages/inventory/InventoryPageEnhanced.js`

**المهام:**
- [ ] **إضافة زر "إضافة كمية" لكل صنف**
  - فتح modal لإضافة كمية
  - اختيار المخزن
  - إدخال الكمية
  - إضافة ملاحظات
  
- [ ] **إضافة زر "تعديل الكمية"**
  - عرض الكميات لكل مخزن
  - إمكانية تعديل الكمية مباشرة
  
- [ ] **عرض المخازن لكل صنف**
  - عرض قائمة المخازن التي يوجد فيها الصنف
  - عرض الكمية في كل مخزن
  
- [ ] **تحسين عرض StockLevel**
  - إظهار الكمية الإجمالية
  - إظهار الكمية المتاحة
  - إظهار الكمية المحجوزة

**Component الجديد:**
```jsx
// AddStockModal.jsx
const AddStockModal = ({ item, onClose, onSuccess }) => {
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  
  const handleSubmit = async () => {
    await apiService.post('/stocklevels', {
      inventoryItemId: item.id,
      warehouseId,
      quantity,
      notes
    });
    onSuccess();
  };
  
  // JSX...
};
```

##### 2.2 إصلاح StockTransferPage ✅
**الملفات:**
- `frontend/react-app/src/pages/inventory/StockTransferPage.js`

**المهام:**
- [ ] **فحص API integration**
  - التأكد من استخدام endpoints الصحيحة
  - إصلاح أي أخطاء في API calls
  
- [ ] **تحسين الواجهة**
  - إضافة اختيار المخزن المصدر
  - إضافة اختيار المخزن الهدف
  - إضافة جدول العناصر المراد نقلها
  - إضافة validation
  
- [ ] **إضافة عرض تاريخ النقل**
  - قائمة بعمليات النقل السابقة
  - تفاصيل كل نقل

##### 2.3 إصلاح StockMovementPage ✅
**الملفات:**
- `frontend/react-app/src/pages/inventory/StockMovementPage.js`

**المهام:**
- [ ] **فحص API integration**
- [ ] **إضافة filters**
  - فلترة بالصنف
  - فلترة بالمخزن
  - فلترة بنوع الحركة
  - فلترة بتاريخ
  
- [ ] **تحسين عرض الحركات**
  - جدول تفصيلي
  - ألوان حسب نوع الحركة
  - عرض المستخدم الذي قام بالحركة

##### 2.4 إنشاء StockManagementModal ✅
**ملف جديد:**
- `frontend/react-app/src/components/inventory/StockManagementModal.jsx`

**المهام:**
- [ ] **Modal لإدارة المخزون**
  - عرض الكميات الحالية لكل مخزن
  - إضافة كمية جديدة
  - تعديل كمية موجودة
  - حذف كمية من مخزن

---

#### **المرحلة 3: الاختبار والتكامل** (غداً - 3-4 ساعات)

##### 3.1 اختبار Backend APIs
- [ ] اختبار جميع endpoints بـ curl/Postman
- [ ] اختبار transactions
- [ ] اختبار edge cases (كميات سالبة، مخازن غير موجودة، إلخ)

##### 3.2 اختبار Frontend
- [ ] اختبار إضافة كمية
- [ ] اختبار تعديل كمية
- [ ] اختبار نقل مخزون
- [ ] اختبار عرض الحركات

##### 3.3 اختبار التكامل
- [ ] workflow كامل: إضافة صنف → إضافة كمية → نقل → صرف
- [ ] التحقق من تحديث StockLevel
- [ ] التحقق من تسجيل StockMovement

---

### 📊 المخرجات المتوقعة

بعد إكمال المهمة 2.3:
- ✅ يمكن إضافة كميات جديدة لأي صنف في أي مخزن
- ✅ يمكن تعديل الكميات الموجودة
- ✅ يعمل نقل المخزون بين المخازن
- ✅ تعمل صفحة حركات المخزون
- ✅ عرض واضح للمخزون في كل مخزن
- ✅ تسجيل تلقائي لجميع الحركات

---

## 💰 المهمة 3.1: ربط الفواتير بعمليات الشراء والمصروفات

### 🎯 الهدف
إضافة دعم لفواتير الشراء وصفحة المصروفات

### 📐 خطة التنفيذ التفصيلية

#### **المرحلة 1: Database Changes** (2-3 ساعات)

##### 1.1 تحديث Invoice Table
```sql
-- إضافة عمود type للفاتورة
ALTER TABLE Invoice 
ADD COLUMN invoiceType ENUM('sale', 'purchase') DEFAULT 'sale' COMMENT 'نوع الفاتورة: بيع أو شراء',
ADD INDEX idx_invoice_type (invoiceType);

-- التحقق من وجود العمود
-- SELECT * FROM Invoice LIMIT 1;
```

##### 1.2 إنشاء Expenses Table (إذا لم يكن موجود)
```sql
CREATE TABLE IF NOT EXISTS Expense (
  id INT NOT NULL AUTO_INCREMENT,
  categoryId INT,
  vendorId INT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expenseDate DATE NOT NULL,
  invoiceId INT NULL COMMENT 'فاتورة الشراء المرتبطة',
  receiptUrl VARCHAR(500),
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (categoryId) REFERENCES ExpenseCategory(id),
  FOREIGN KEY (vendorId) REFERENCES Vendor(id),
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_expense_date (expenseDate),
  INDEX idx_expense_category (categoryId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### 1.3 التحقق من ExpenseCategory Table
```sql
-- التحقق من وجود الجدول
CREATE TABLE IF NOT EXISTS ExpenseCategory (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- إضافة فئات أساسية
INSERT INTO ExpenseCategory (name) VALUES
  ('إيجار'),
  ('مرتبات'),
  ('مرافق (كهرباء، ماء)'),
  ('صيانة'),
  ('نقل'),
  ('إعلانات'),
  ('أخرى')
ON DUPLICATE KEY UPDATE name=name;
```

---

#### **المرحلة 2: Backend APIs** (4-5 ساعات)

##### 2.1 تحديث Invoice Controller
**الملفات:**
- `backend/controllers/invoicesController.js`
- `backend/routes/invoices.js`

**المهام:**
- [ ] **تحديث createInvoice**
  - دعم `invoiceType` (sale/purchase)
  - ربط بـ `vendorId` إذا كانت فاتورة شراء
  
- [ ] **تحديث getAllInvoices**
  - إضافة فلترة بـ `invoiceType`
  
- [ ] **إضافة getPurchaseInvoices**
  - جلب فواتير الشراء فقط

##### 2.2 إنشاء Expenses API
**ملف جديد:**
- `backend/routes/expenses.js`

**المهام:**
- [ ] **GET /api/expenses** - جلب جميع المصروفات
  - فلترة بـ `categoryId`, `vendorId`, `dateFrom`, `dateTo`
  - pagination
  
- [ ] **GET /api/expenses/:id** - جلب مصروف معين
- [ ] **POST /api/expenses** - إنشاء مصروف جديد
- [ ] **PUT /api/expenses/:id** - تحديث مصروف
- [ ] **DELETE /api/expenses/:id** - حذف مصروف (soft delete)
- [ ] **GET /api/expenses/stats** - إحصائيات المصروفات

**الكود المقترح:**
```javascript
// POST /api/expenses
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { categoryId, vendorId, amount, description, expenseDate, invoiceId, notes } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO Expense 
       (categoryId, vendorId, amount, description, expenseDate, invoiceId, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, vendorId, amount, description, expenseDate, invoiceId, notes, req.user.id]
    );
    
    const [expense] = await db.query('SELECT * FROM Expense WHERE id = ?', [result.insertId]);
    res.json({ success: true, data: expense[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
```

##### 2.3 إنشاء ExpenseCategory API
**ملف جديد:**
- `backend/routes/expenseCategories.js`

**المهام:**
- [ ] **GET /api/expensecategories** - جلب جميع الفئات
- [ ] **POST /api/expensecategories** - إنشاء فئة جديدة
- [ ] **PUT /api/expensecategories/:id** - تحديث فئة
- [ ] **DELETE /api/expensecategories/:id** - حذف فئة

---

#### **المرحلة 3: Frontend Pages** (5-6 ساعات)

##### 3.1 تحديث CreateInvoicePage
**الملفات:**
- `frontend/react-app/src/pages/invoices/CreateInvoicePage.js`

**المهام:**
- [ ] **إضافة radio buttons لاختيار نوع الفاتورة**
  - Sale (بيع)
  - Purchase (شراء)
  
- [ ] **إضافة Vendor selector (عند اختيار Purchase)**
  - dropdown لاختيار المورد
  - API: `GET /api/vendors`
  
- [ ] **تحديث API call**
  - إرسال `invoiceType` و `vendorId` عند الإنشاء

##### 3.2 تحديث InvoicesPage
**الملفات:**
- `frontend/react-app/src/pages/invoices/InvoicesPage.js`

**المهام:**
- [ ] **إضافة filter للنوع**
  - All / Sale / Purchase
  
- [ ] **تحديث عرض الفواتير**
  - إظهار نوع الفاتورة
  - لون مختلف لفواتير الشراء

##### 3.3 إنشاء ExpensesPage
**ملف جديد:**
- `frontend/react-app/src/pages/expenses/ExpensesPage.js`

**المهام:**
- [ ] **صفحة قائمة المصروفات**
  - جدول المصروفات
  - filters (فئة، مورد، تاريخ)
  - زر "إضافة مصروف"
  
- [ ] **صفحة إضافة مصروف**
  - form لإدخال البيانات
  - اختيار الفئة
  - اختيار المورد (اختياري)
  - ربط بفاتورة شراء (اختياري)

##### 3.4 تحديث App.js Routes
**الملفات:**
- `frontend/react-app/src/App.js`

**المهام:**
- [ ] إضافة route `/expenses`
- [ ] إضافة route `/expenses/new`
- [ ] إضافة route `/expenses/:id/edit`

---

#### **المرحلة 4: الاختبار** (2-3 ساعات)

- [ ] اختبار إنشاء فاتورة شراء
- [ ] اختبار إنشاء مصروف
- [ ] اختبار ربط مصروف بفاتورة شراء
- [ ] اختبار filters

---

## 🔗 المهمة 3.2: ربط أصناف المخزون بالفواتير

### 🎯 الهدف
إضافة إمكانية إضافة أصناف من المخزون مباشرة إلى الفاتورة

### 📐 خطة التنفيذ التفصيلية

#### **المرحلة 1: Backend** (2-3 ساعات)

##### 1.1 التحقق من InvoiceItem Table
```sql
-- التحقق من وجود عمود inventoryItemId
DESCRIBE InvoiceItem;

-- إذا لم يكن موجود:
ALTER TABLE InvoiceItem 
ADD COLUMN inventoryItemId INT NULL,
ADD FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
ADD INDEX idx_invoice_item_inventory (inventoryItemId);
```

##### 1.2 تحديث Invoice Controller
**الملفات:**
- `backend/controllers/invoicesController.js`

**المهام:**
- [ ] **تحديث addInvoiceItem**
  - دعم `inventoryItemId`
  - جلب بيانات الصنف من InventoryItem
  - استخدام `name` و `sellingPrice` من InventoryItem إذا لم يتم تحديدها
  
- [ ] **إضافة endpoint لجلب أصناف المخزون**
  - `GET /api/inventory/items/available` - جلب الأصناف المتاحة

**الكود المقترح:**
```javascript
// POST /api/invoices/:id/items
async addInvoiceItem(req, res) {
  try {
    const { invoiceId } = req.params;
    const { inventoryItemId, serviceId, quantity, unitPrice, description } = req.body;
    
    // إذا كان inventoryItemId محدد، جلب بيانات الصنف
    let itemName = description;
    let finalPrice = unitPrice;
    
    if (inventoryItemId) {
      const [item] = await db.query(
        'SELECT name, sellingPrice FROM InventoryItem WHERE id = ?',
        [inventoryItemId]
      );
      if (item.length > 0) {
        itemName = item[0].name;
        finalPrice = unitPrice || item[0].sellingPrice;
      }
    }
    
    const [result] = await db.execute(
      `INSERT INTO InvoiceItem 
       (invoiceId, inventoryItemId, serviceId, quantity, unitPrice, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, inventoryItemId, serviceId, quantity, finalPrice, itemName]
    );
    
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}
```

---

#### **المرحلة 2: Frontend** (3-4 ساعات)

##### 2.1 تحديث CreateInvoicePage
**الملفات:**
- `frontend/react-app/src/pages/invoices/CreateInvoicePage.js`

**المهام:**
- [ ] **إضافة tab/selector لاختيار نوع العنصر**
  - Service (خدمة)
  - Inventory Item (صنف من المخزون)
  
- [ ] **عند اختيار Inventory Item:**
  - dropdown لاختيار الصنف
  - عرض الكمية المتاحة
  - auto-fill للاسم والسعر
  - إمكانية تعديل الكمية والسعر

**Component الجديد:**
```jsx
const AddInvoiceItemForm = ({ onAdd }) => {
  const [itemType, setItemType] = useState('service'); // 'service' or 'inventory'
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  
  useEffect(() => {
    // جلب الأصناف المتاحة
    apiService.get('/inventory/items/available').then(setInventoryItems);
  }, []);
  
  const handleInventoryItemSelect = (itemId) => {
    const item = inventoryItems.find(i => i.id === itemId);
    setSelectedItem(item);
    // auto-fill name and price
  };
  
  // JSX...
};
```

##### 2.2 تحديث EditInvoicePage
- [ ] نفس التحديثات

---

## 👤 المهمة 3.3: ربط العملاء بالفواتير

### 🎯 الهدف
إضافة إمكانية اختيار عميل عند إنشاء فاتورة جديدة بدون طلب إصلاح

### 📐 خطة التنفيذ التفصيلية

#### **المرحلة 1: Database** (30 دقيقة)

##### 1.1 التحقق من Invoice Table
```sql
-- التحقق من وجود customerId
DESCRIBE Invoice;

-- إذا لم يكن موجود (يجب أن يكون موجوداً بالفعل):
-- ALTER TABLE Invoice ADD COLUMN customerId INT NULL;
```

#### **المرحلة 2: Backend** (1-2 ساعات)

##### 2.1 تحديث Invoice Controller
**الملفات:**
- `backend/controllers/invoicesController.js`

**المهام:**
- [ ] **تحديث createInvoice**
  - دعم `customerId` (يمكن أن يكون null إذا كان من repairRequestId)
  - التحقق من وجود العميل إذا تم تحديده
  
- [ ] **تحديث getAllInvoices**
  - JOIN مع Customer حتى لو لم يكن من RepairRequest

**الكود المقترح:**
```javascript
async createInvoice(req, res) {
  try {
    const { repairRequestId, customerId, totalAmount, items, ...other } = req.body;
    
    // التحقق من customerId إذا تم تحديده
    if (customerId) {
      const [customer] = await db.query('SELECT id FROM Customer WHERE id = ?', [customerId]);
      if (customer.length === 0) {
        return res.status(400).json({ error: 'العميل غير موجود' });
      }
    }
    
    // إنشاء الفاتورة
    const [result] = await db.execute(
      `INSERT INTO Invoice (repairRequestId, customerId, totalAmount, ...)
       VALUES (?, ?, ?, ...)`,
      [repairRequestId, customerId, totalAmount, ...]
    );
    
    // إضافة العناصر...
    
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}
```

#### **المرحلة 3: Frontend** (2-3 ساعات)

##### 3.1 تحديث CreateInvoicePage
**الملفات:**
- `frontend/react-app/src/pages/invoices/CreateInvoicePage.js`

**المهام:**
- [ ] **إضافة Customer selector**
  - إذا لم يكن `repairRequestId` محدد
  - dropdown لاختيار العميل
  - بحث في العملاء
  - عرض معلومات العميل المختار

**الكود المقترح:**
```jsx
const CustomerSelector = ({ value, onChange }) => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    apiService.getCustomers({ search }).then(setCustomers);
  }, [search]);
  
  return (
    <Select value={value} onChange={onChange}>
      <Input placeholder="ابحث عن عميل..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {customers.map(customer => (
        <Option key={customer.id} value={customer.id}>
          {customer.name} - {customer.phone}
        </Option>
      ))}
    </Select>
  );
};
```

---

## 📅 الجدول الزمني المقترح

### الأسبوع 1 (3-4 أيام)

**اليوم 1-2: المهمة 2.3 (المرحلة 1-2)**
- ✅ إصلاح Backend APIs
- ✅ تحديث الواجهة الأساسية

**اليوم 3: المهمة 2.3 (المرحلة 3) + المهمة 3.3**
- ✅ اختبار المخزون
- ✅ ربط العملاء بالفواتير

**اليوم 4: المهمة 3.1 + 3.2**
- ✅ فواتير الشراء
- ✅ صفحة المصروفات
- ✅ ربط المخزون بالفواتير

---

## ✅ Checklist النهائي

### قبل البدء:
- [ ] Backup للـ database
- [ ] Backup للـ code
- [ ] إنشاء branch جديد في Git
- [ ] قراءة جميع الملفات المرتبطة

### أثناء التنفيذ:
- [ ] كتابة unit tests لكل API endpoint
- [ ] اختبار كل feature فور إكماله
- [ ] توثيق التغييرات

### بعد الإكمال:
- [ ] اختبار شامل لجميع الميزات
- [ ] مراجعة الكود
- [ ] تحديث الوثائق
- [ ] Deploy للـ staging environment

---

## 📝 ملاحظات مهمة

1. **الترتيب المقترح:**
   - البدء بالمهمة 3.3 (الأسهل) لبناء momentum
   - ثم المهمة 3.2
   - ثم المهمة 3.1
   - وأخيراً المهمة 2.3 (الأصعب)

2. **Database Transactions:**
   - استخدام transactions في جميع عمليات تحديث المخزون
   - التأكد من rollback عند الأخطاء

3. **Error Handling:**
   - معالجة شاملة للأخطاء
   - رسائل واضحة للمستخدم
   - logging مفصل

4. **Performance:**
   - استخدام indexes في جميع الاستعلامات
   - pagination في جميع القوائم
   - caching حيثما أمكن

---

**آخر تحديث:** 2025-10-27  
**الحالة:** ✅ جاهز للتنفيذ

