# 🚀 **Phase 2 - Core Enhancements**

## 📋 **نظرة عامة**

**المدة:** 4 أسابيع  
**الهدف:** بناء الوظائف الأساسية المتقدمة  
**التركيز:** ربط المخزون بالصيانة والمالية  

---

## 🎯 **الأهداف الرئيسية**

### **1. ربط المخزون بنظام الصيانة**
- ربط استهلاك القطع بتذاكر الصيانة
- إنشاء PartsUsed تلقائياً عند إضافة قطع للصيانة
- تحديث المخزون تلقائياً عند استهلاك قطع

### **2. نظام جرد المخزون**
- إنشاء StockCount للجرد الدوري
- واجهة إدخال سريع للجرد
- مقارنة الجرد الفعلي بالنظام

### **3. نظام الباركود**
- مسح باركود للقطع
- تسريع عمليات الاستلام والصرف
- طباعة باركود للقطع

### **4. ربط المصروفات بالمالية**
- ربط المشتريات بالمالية
- إنشاء Expenses تلقائياً
- تحديث Vendor balances

### **5. إدارة المخازن المتعددة**
- نقل بين المخازن
- StockTransfer system
- تتبع المخزون لكل مخزن

---

## 📅 **الجدول الزمني**

### **الأسبوع 1: ربط المخزون بالصيانة**
- إنشاء PartsUsed table
- APIs للربط مع الصيانة
- Frontend للتكامل

### **الأسبوع 2: نظام جرد المخزون**
- StockCount tables
- APIs للجرد
- Frontend للجرد

### **الأسبوع 3: نظام الباركود**
- BarcodeScan table
- APIs للباركود
- Frontend للمسح

### **الأسبوع 4: ربط المالية والمخازن المتعددة**
- Finance integration
- Multi-warehouse management
- StockTransfer system

---

## 🗄️ **قاعدة البيانات - الجداول الجديدة**

### **1. PartsUsed (استهلاك القطع في الصيانة)**
```sql
CREATE TABLE PartsUsed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  warehouseId INT NOT NULL,
  usedBy INT NOT NULL,
  usedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (usedBy) REFERENCES User(id)
);
```

### **2. StockCount (جرد المخزون)**
```sql
CREATE TABLE StockCount (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouseId INT NOT NULL,
  countDate DATE NOT NULL,
  status ENUM('draft', 'in_progress', 'completed', 'approved') DEFAULT 'draft',
  totalItems INT DEFAULT 0,
  countedItems INT DEFAULT 0,
  discrepancies INT DEFAULT 0,
  createdBy INT NOT NULL,
  completedBy INT NULL,
  approvedBy INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  FOREIGN KEY (completedBy) REFERENCES User(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id)
);
```

### **3. StockCountItem (عناصر الجرد)**
```sql
CREATE TABLE StockCountItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockCountId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  systemQuantity INT NOT NULL,
  countedQuantity INT NOT NULL,
  variance INT NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (stockCountId) REFERENCES StockCount(id),
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  UNIQUE KEY unique_count_item (stockCountId, inventoryItemId)
);
```

### **4. StockTransfer (نقل بين المخازن)**
```sql
CREATE TABLE StockTransfer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fromWarehouseId INT NOT NULL,
  toWarehouseId INT NOT NULL,
  transferDate DATE NOT NULL,
  status ENUM('draft', 'approved', 'shipped', 'received', 'completed') DEFAULT 'draft',
  totalItems INT DEFAULT 0,
  totalQuantity INT DEFAULT 0,
  referenceNumber VARCHAR(50) UNIQUE,
  notes TEXT,
  createdBy INT NOT NULL,
  approvedBy INT NULL,
  shippedBy INT NULL,
  receivedBy INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (fromWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  FOREIGN KEY (shippedBy) REFERENCES User(id),
  FOREIGN KEY (receivedBy) REFERENCES User(id)
);
```

### **5. StockTransferItem (عناصر النقل)**
```sql
CREATE TABLE StockTransferItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockTransferId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (stockTransferId) REFERENCES StockTransfer(id),
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  UNIQUE KEY unique_transfer_item (stockTransferId, inventoryItemId)
);
```

---

## 🔌 **APIs الجديدة**

### **1. PartsUsed APIs**
```javascript
// إضافة قطع لطلب صيانة
POST /api/repairs/:id/parts
{
  "inventoryItemId": 10,
  "quantity": 1,
  "warehouseId": 1,
  "addToInvoice": true
}

// جلب قطع مستخدمة في طلب صيانة
GET /api/repairs/:id/parts

// حذف قطع مستخدمة
DELETE /api/repairs/:id/parts/:partId
```

### **2. StockCount APIs**
```javascript
// إنشاء جرد جديد
POST /api/stock-counts
{
  "warehouseId": 1,
  "countDate": "2025-10-03"
}

// إضافة عناصر للجرد
POST /api/stock-counts/:id/items
{
  "inventoryItemId": 10,
  "countedQuantity": 50
}

// إكمال الجرد
PUT /api/stock-counts/:id/complete

// الموافقة على الجرد
PUT /api/stock-counts/:id/approve
```

### **3. StockTransfer APIs**
```javascript
// إنشاء نقل جديد
POST /api/stock-transfers
{
  "fromWarehouseId": 1,
  "toWarehouseId": 2,
  "items": [
    {
      "inventoryItemId": 10,
      "quantity": 20
    }
  ]
}

// الموافقة على النقل
PUT /api/stock-transfers/:id/approve

// شحن النقل
PUT /api/stock-transfers/:id/ship

// استلام النقل
PUT /api/stock-transfers/:id/receive
```

### **4. Barcode APIs**
```javascript
// البحث عن قطعة بالباركود
GET /api/barcode/lookup/:barcode

// مسح باركود
POST /api/barcode/scan
{
  "barcode": "123456789",
  "action": "issue", // issue, receive, count
  "warehouseId": 1,
  "repairRequestId": 5 // optional
}

// توليد باركود
POST /api/barcode/generate/:itemId
```

---

## 🎨 **Frontend Components الجديدة**

### **1. PartsUsedManager**
```javascript
const PartsUsedManager = ({ repairRequestId }) => {
  const [parts, setParts] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  
  const addPart = async (item) => {
    // إضافة قطعة للصيانة
    // تحديث المخزون تلقائياً
    // إضافة للفاتورة إذا مطلوب
  };
  
  return (
    <Box>
      <Typography variant="h6">القطع المستخدمة</Typography>
      <PartsList parts={parts} onRemove={removePart} />
      <AddPartDialog onAdd={addPart} />
    </Box>
  );
};
```

### **2. StockCountForm**
```javascript
const StockCountForm = ({ warehouseId }) => {
  const [countItems, setCountItems] = useState([]);
  
  const addItem = (item, countedQuantity) => {
    // إضافة عنصر للجرد
  };
  
  const completeCount = () => {
    // إكمال الجرد وحساب الفروقات
  };
  
  return (
    <Box>
      <BarcodeScanner onScan={handleBarcodeScan} />
      <CountItemsList items={countItems} onChange={updateCount} />
      <Button onClick={completeCount}>إكمال الجرد</Button>
    </Box>
  );
};
```

### **3. StockTransferForm**
```javascript
const StockTransferForm = () => {
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [items, setItems] = useState([]);
  
  const createTransfer = () => {
    // إنشاء نقل بين المخازن
  };
  
  return (
    <Box>
      <WarehouseSelector 
        from={fromWarehouse}
        to={toWarehouse}
        onChange={handleWarehouseChange}
      />
      <TransferItemsList items={items} onChange={updateItems} />
      <Button onClick={createTransfer}>إنشاء النقل</Button>
    </Box>
  );
};
```

### **4. BarcodeScanner**
```javascript
const BarcodeScanner = ({ onScan }) => {
  const [scanner, setScanner] = useState(null);
  
  useEffect(() => {
    // إعداد ماسح الباركود
    const codeReader = new BrowserMultiFormatReader();
    setScanner(codeReader);
  }, []);
  
  const startScanning = () => {
    // بدء المسح
    scanner.decodeOnceFromVideoDevice()
      .then(result => onScan(result.text))
      .catch(err => console.error(err));
  };
  
  return (
    <Box>
      <video ref={videoRef} />
      <Button onClick={startScanning}>بدء المسح</Button>
    </Box>
  );
};
```

---

## 🔄 **التكامل مع النظم الأخرى**

### **1. تكامل مع الصيانة**
```javascript
// عند إضافة قطعة لطلب صيانة
const addPartToRepair = async (repairId, itemData) => {
  // 1. إنشاء PartsUsed
  const partsUsed = await createPartsUsed(repairId, itemData);
  
  // 2. تحديث StockMovement
  await createStockMovement({
    type: 'out',
    inventoryItemId: itemData.inventoryItemId,
    quantity: itemData.quantity,
    referenceType: 'repair',
    referenceId: repairId,
    warehouseId: itemData.warehouseId
  });
  
  // 3. تحديث StockLevel
  await updateStockLevel(itemData.inventoryItemId, itemData.warehouseId, -itemData.quantity);
  
  // 4. إضافة للفاتورة إذا مطلوب
  if (itemData.addToInvoice) {
    await addToInvoice(repairId, partsUsed);
  }
};
```

### **2. تكامل مع المالية**
```javascript
// عند استلام مشتريات
const receivePurchaseOrder = async (poId) => {
  const po = await getPurchaseOrder(poId);
  
  // 1. تحديث StockMovements
  for (const item of po.items) {
    await createStockMovement({
      type: 'in',
      inventoryItemId: item.inventoryItemId,
      quantity: item.receivedQuantity,
      referenceType: 'purchase',
      referenceId: poId,
      warehouseId: po.warehouseId
    });
  }
  
  // 2. إنشاء Expense
  await createExpense({
    type: 'purchase',
    amount: po.totalAmount,
    vendorId: po.vendorId,
    referenceId: poId
  });
  
  // 3. تحديث Vendor balance
  await updateVendorBalance(po.vendorId, po.totalAmount);
};
```

---

## 📊 **التقارير الجديدة**

### **1. تقرير استهلاك القطع**
```javascript
GET /api/reports/parts-consumption
{
  "period": "month",
  "warehouseId": 1,
  "categoryId": 2
}

// النتيجة
{
  "totalParts": 150,
  "totalValue": 15000,
  "topConsumedItems": [...],
  "consumptionByCategory": [...],
  "consumptionByRepair": [...]
}
```

### **2. تقرير الجرد**
```javascript
GET /api/reports/stock-count/:id
{
  "discrepancies": 5,
  "totalVariance": -200,
  "items": [
    {
      "itemName": "شاشة iPhone",
      "systemQuantity": 50,
      "countedQuantity": 48,
      "variance": -2
    }
  ]
}
```

### **3. تقرير النقل**
```javascript
GET /api/reports/stock-transfers
{
  "period": "month",
  "totalTransfers": 25,
  "totalItems": 500,
  "transfersByWarehouse": [...]
}
```

---

## 🧪 **خطة الاختبار**

### **Unit Tests**
- PartsUsed creation and validation
- StockCount calculations
- StockTransfer workflows
- Barcode lookup functionality

### **Integration Tests**
- Repair-Inventory integration
- Finance-Inventory integration
- Multi-warehouse operations
- End-to-end workflows

### **E2E Tests**
- Complete repair workflow with parts
- Stock counting process
- Transfer between warehouses
- Barcode scanning operations

---

## 📈 **المقاييس المستهدفة**

| المقياس | الهدف | الوضع الحالي |
|---------|-------|---------------|
| دقة المخزون | 95%+ | 85% |
| سرعة العمليات | +40% | Baseline |
| تكامل النظم | 100% | 60% |
| رضا المستخدم | 4.5/5 | 3.5/5 |

---

## 🚀 **البدء في Phase 2**

### **الخطوة 1: إنشاء الجداول**
```bash
cd /opt/lampp/htdocs/FixZone
mysql -u root -p fixzone_db < migrations/phase2_database_tables.sql
```

### **الخطوة 2: تطوير Backend APIs**
```bash
cd backend
# إنشاء controllers جديدة
# إنشاء routes جديدة
# تحديث middleware
```

### **الخطوة 3: تطوير Frontend Components**
```bash
cd frontend/react-app/src
# إنشاء components جديدة
# تحديث pages موجودة
# إضافة routing جديد
```

### **الخطوة 4: الاختبار والتكامل**
```bash
# اختبار APIs
# اختبار Frontend
# اختبار التكامل
# اختبار الأداء
```

---

## ✅ **النتائج المتوقعة**

بعد إكمال Phase 2:

1. **نظام مخزون متكامل 100%** مع الصيانة والمالية
2. **دقة مخزون 95%+** مع الجرد الدوري
3. **سرعة عمليات +40%** مع نظام الباركود
4. **إدارة مخازن متعددة** كاملة
5. **تقارير تحليلية** شاملة

**النظام سيكون جاهز للاستخدام في الإنتاج!** 🎯

