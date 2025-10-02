# 🔄 Matrix التدفقات المخزنية والتكامل بين الموديولات
## Inventory Flow Matrix & Module Integration

**التاريخ:** 2 أكتوبر 2025  
**الهدف:** رسم خريطة شاملة لجميع التدفقات المخزنية وتكاملها مع الموديولات الأخرى

---

## 📊 Matrix الترابط الرئيسية

### جدول التدفقات الكاملة

| # | العملية | من → إلى | الموديولات المرتبطة | بيانات متداخلة | نوع الحركة | آثار مالية |
|---|---------|----------|---------------------|----------------|-----------|-----------|
| 1 | استلام أمر شراء | Vendors → Inventory | Vendors, Purchases, Inventory, Finance | PurchaseID, VendorID, StockUpdate | **IN** | مصروف |
| 2 | صرف قطعة لصيانة | Inventory → Repairs | Inventory, Repairs, Finance | PartID, RepairID, ExpenseRecord | **OUT** | تكلفة + إيراد |
| 3 | إرجاع قطعة من صيانة | Repairs → Inventory | Repairs, Inventory | PartID, RepairID, RestockQty | **IN** | تسوية تكلفة |
| 4 | بيع مباشر (فاتورة) | Inventory → Invoices | Inventory, Invoices, Finance | InvoiceID, ItemID, CustomerID | **OUT** | إيراد |
| 5 | إرجاع من عميل | Invoices → Inventory | Invoices, Inventory, Finance | InvoiceID, ItemID, RefundAmount | **IN** | استرجاع |
| 6 | نقل بين فروع | Warehouse A → Warehouse B | Inventory (Multi-Warehouse) | ItemID, FromWarehouse, ToWarehouse | **TRANSFER** | - |
| 7 | جرد المخزون | Manual → Inventory | Inventory, Reports | ItemID, ActualQty, SystemQty, Difference | **ADJUSTMENT** | تسوية |
| 8 | إتلاف/شطب | Inventory → Write-Off | Inventory, Finance | ItemID, Qty, Reason, Cost | **OUT** | خسارة |
| 9 | استلام من مرتجع مورد | Vendors → Inventory | Vendors, Purchases, Inventory | ReturnID, VendorID, ItemID | **IN** | استرجاع |
| 10 | حجز قطعة لطلب | Inventory (Reserve) | Repairs, Inventory | RepairID, ItemID, ReservedQty | **RESERVE** | - |

---

## 🔄 السيناريوهات التفصيلية

### 📥 **السيناريو 1: استلام أمر شراء من مورد**

#### المسار الكامل:
```
[مورد] → [أمر شراء] → [استلام] → [تحديث المخزون] → [فاتورة شراء] → [دفع] → [تسجيل مصروف]
```

#### الخطوات التفصيلية:

**الخطوة 1: إنشاء أمر شراء (Purchase Order)**
```javascript
POST /api/purchase-orders
{
  "vendorId": 5,
  "orderNumber": "PO-2025-001",
  "orderDate": "2025-10-02",
  "expectedDelivery": "2025-10-10",
  "status": "draft",
  "items": [
    {
      "inventoryItemId": 10,
      "quantity": 50,
      "unitPrice": 150.00,
      "totalPrice": 7500.00
    },
    {
      "inventoryItemId": 12,
      "quantity": 100,
      "unitPrice": 80.00,
      "totalPrice": 8000.00
    }
  ],
  "totalAmount": 15500.00,
  "notes": "طلب عاجل - شاشات وبطاريات"
}
```

**النتيجة:**
- ✅ سجل في `PurchaseOrder`
- ✅ سجلات في `PurchaseOrderItem`
- ✅ حالة: `draft`

---

**الخطوة 2: إرسال أمر الشراء للمورد**
```javascript
PUT /api/purchase-orders/123/status
{
  "status": "sent",
  "sentBy": 1,
  "sentAt": "2025-10-02 14:30:00"
}
```

**النتيجة:**
- ✅ تحديث حالة PO → `sent`
- 📧 إرسال إشعار للمورد (اختياري)
- 📝 تسجيل في AuditLog

---

**الخطوة 3: استلام البضاعة (Receive Goods)**
```javascript
POST /api/purchase-orders/123/receive
{
  "warehouseId": 1,  // المستودع الرئيسي
  "receivedBy": 1,   // المستخدم المستلم
  "receivedDate": "2025-10-08",
  "items": [
    {
      "purchaseOrderItemId": 450,
      "inventoryItemId": 10,
      "orderedQuantity": 50,
      "receivedQuantity": 48,  // ⚠️ استلمنا 48 بدلاً من 50
      "notes": "قطعتان تالفتان"
    },
    {
      "purchaseOrderItemId": 451,
      "inventoryItemId": 12,
      "orderedQuantity": 100,
      "receivedQuantity": 100  // ✅ استلام كامل
    }
  ]
}
```

**ما يحدث تلقائياً:**

1. **تحديث PurchaseOrderItem:**
   ```sql
   UPDATE PurchaseOrderItem 
   SET receivedQuantity = 48 
   WHERE id = 450;
   
   UPDATE PurchaseOrderItem 
   SET receivedQuantity = 100 
   WHERE id = 451;
   ```

2. **تحديث حالة PO:**
   ```sql
   UPDATE PurchaseOrder 
   SET status = 'received', 
       actualDelivery = '2025-10-08'
   WHERE id = 123;
   ```

3. **إنشاء حركات مخزنية (Stock Movements):**
   ```sql
   INSERT INTO StockMovement 
   (inventoryItemId, warehouseId, movementType, quantity, unitCost, totalCost, referenceType, referenceId, createdBy)
   VALUES
   (10, 1, 'in', 48, 150.00, 7200.00, 'purchase_order', 123, 1),
   (12, 1, 'in', 100, 80.00, 8000.00, 'purchase_order', 123, 1);
   ```

4. **تحديث مستويات المخزون (Stock Levels):**
   ```sql
   -- للشاشات (48 قطعة)
   INSERT INTO StockLevel (inventoryItemId, warehouseId, currentQuantity)
   VALUES (10, 1, 48)
   ON DUPLICATE KEY UPDATE 
     currentQuantity = currentQuantity + 48;
   
   -- للبطاريات (100 قطعة)
   INSERT INTO StockLevel (inventoryItemId, warehouseId, currentQuantity)
   VALUES (12, 1, 100)
   ON DUPLICATE KEY UPDATE 
     currentQuantity = currentQuantity + 100;
   ```

5. **إنشاء مصروف في المالية (Expense):**
   ```sql
   INSERT INTO Expense 
   (categoryId, amount, description, referenceType, referenceId, date, status)
   VALUES
   (3, 15200.00, 'استلام أمر شراء PO-2025-001', 'purchase_order', 123, '2025-10-08', 'pending');
   ```

6. **تسجيل في AuditLog:**
   ```sql
   INSERT INTO AuditLog 
   (userId, action, tableName, recordId, changes, timestamp)
   VALUES
   (1, 'PO_RECEIVED', 'PurchaseOrder', 123, '{"received": 148, "expected": 150}', NOW());
   ```

**النتيجة النهائية:**
- ✅ المخزون مُحدث
- ✅ حركات مسجلة
- ✅ مصروف مسجل
- ✅ سجل تدقيق كامل

---

### 🔧 **السيناريو 2: صرف قطعة لطلب صيانة**

#### المسار الكامل:
```
[طلب صيانة] → [اختيار قطعة] → [حجز] → [صرف] → [تحديث المخزون] → [إضافة لفاتورة] → [تسجيل تكلفة]
```

#### الخطوات التفصيلية:

**الخطوة 1: إضافة قطعة لطلب صيانة**
```javascript
POST /api/repairs/456/parts
{
  "inventoryItemId": 10,  // شاشة LCD
  "quantity": 1,
  "warehouseId": 1,
  "addToInvoice": true,   // إضافة للفاتورة تلقائياً
  "sellingPrice": 250.00,
  "notes": "استبدال شاشة تالفة"
}
```

**ما يحدث تلقائياً:**

1. **حجز القطعة (Reserve):**
   ```sql
   UPDATE StockLevel 
   SET reservedQuantity = reservedQuantity + 1
   WHERE inventoryItemId = 10 AND warehouseId = 1;
   ```

2. **تسجيل في PartsUsed:**
   ```sql
   INSERT INTO PartsUsed 
   (repairRequestId, inventoryItemId, quantity, unitCost, createdAt)
   VALUES
   (456, 10, 1, 150.00, NOW());
   ```

3. **تسجيل حركة مخزنية:**
   ```sql
   INSERT INTO StockMovement 
   (inventoryItemId, warehouseId, movementType, quantity, unitCost, totalCost, referenceType, referenceId, createdBy, notes)
   VALUES
   (10, 1, 'out', 1, 150.00, 150.00, 'repair_request', 456, 5, 'صرف لطلب صيانة #456');
   ```

4. **خصم من المخزون:**
   ```sql
   UPDATE StockLevel 
   SET currentQuantity = currentQuantity - 1,
       reservedQuantity = reservedQuantity - 1
   WHERE inventoryItemId = 10 AND warehouseId = 1;
   ```

5. **إضافة لفاتورة الصيانة (إذا كانت موجودة):**
   ```sql
   INSERT INTO InvoiceItem 
   (invoiceId, inventoryItemId, description, quantity, unitPrice, totalPrice)
   VALUES
   (789, 10, 'شاشة LCD أصلية', 1, 250.00, 250.00);
   
   -- تحديث مجموع الفاتورة
   UPDATE Invoice 
   SET totalAmount = totalAmount + 250.00,
       finalAmount = totalAmount + taxAmount - discountAmount
   WHERE id = 789;
   ```

6. **تحديث PartsUsed بـ invoiceItemId:**
   ```sql
   UPDATE PartsUsed 
   SET invoiceItemId = LAST_INSERT_ID()
   WHERE repairRequestId = 456 AND inventoryItemId = 10;
   ```

**النتيجة النهائية:**
- ✅ القطعة مخصومة من المخزون
- ✅ مضافة للفاتورة
- ✅ حركة مخزنية مسجلة
- ✅ التكلفة والإيراد مسجلين

---

### 🔄 **السيناريو 3: نقل قطع بين الفروع (Transfer)**

#### المسار الكامل:
```
[فرع A] → [طلب نقل] → [موافقة] → [شحن] → [استلام في فرع B] → [تحديث المخزون]
```

#### الخطوات التفصيلية:

**الخطوة 1: إنشاء طلب نقل**
```javascript
POST /api/inventory/transfers
{
  "fromWarehouseId": 1,  // المستودع الرئيسي
  "toWarehouseId": 2,    // مستودع الجيزة
  "requestedBy": 7,
  "transferDate": "2025-10-05",
  "items": [
    {
      "inventoryItemId": 10,
      "quantity": 10,
      "reason": "نقص مخزون في فرع الجيزة"
    }
  ],
  "notes": "عاجل - نقص شديد"
}
```

**النتيجة:**
```sql
INSERT INTO StockTransfer 
(fromWarehouseId, toWarehouseId, transferNumber, status, requestedBy, transferDate)
VALUES
(1, 2, 'TRF-2025-010', 'pending', 7, '2025-10-05');

INSERT INTO StockTransferItem 
(transferId, inventoryItemId, quantity)
VALUES
(100, 10, 10);
```

---

**الخطوة 2: موافقة على النقل**
```javascript
PUT /api/inventory/transfers/100/approve
{
  "approvedBy": 1,  // المدير
  "approvalNotes": "موافق - الكمية متوفرة"
}
```

---

**الخطوة 3: شحن القطع**
```javascript
PUT /api/inventory/transfers/100/ship
{
  "shippedBy": 3,
  "shippedDate": "2025-10-05 15:00:00",
  "carrier": "شركة النقل السريع",
  "trackingNumber": "TRK-123456"
}
```

**ما يحدث:**
```sql
-- حجز الكمية في المخزن المُرسِل
UPDATE StockLevel 
SET reservedQuantity = reservedQuantity + 10
WHERE inventoryItemId = 10 AND warehouseId = 1;

-- تحديث حالة النقل
UPDATE StockTransfer 
SET status = 'in_transit', shippedAt = NOW()
WHERE id = 100;
```

---

**الخطوة 4: استلام في الفرع المستقبِل**
```javascript
POST /api/inventory/transfers/100/receive
{
  "receivedBy": 8,
  "receivedDate": "2025-10-06 10:00:00",
  "items": [
    {
      "transferItemId": 250,
      "inventoryItemId": 10,
      "requestedQuantity": 10,
      "receivedQuantity": 10,  // ✅ استلام كامل
      "condition": "good"
    }
  ]
}
```

**ما يحدث:**

1. **خصم من المخزن المُرسِل:**
   ```sql
   UPDATE StockLevel 
   SET currentQuantity = currentQuantity - 10,
       reservedQuantity = reservedQuantity - 10
   WHERE inventoryItemId = 10 AND warehouseId = 1;
   ```

2. **إضافة للمخزن المستقبِل:**
   ```sql
   INSERT INTO StockLevel (inventoryItemId, warehouseId, currentQuantity)
   VALUES (10, 2, 10)
   ON DUPLICATE KEY UPDATE 
     currentQuantity = currentQuantity + 10;
   ```

3. **تسجيل حركة مخزنية (2 حركات):**
   ```sql
   -- حركة خروج من المخزن المُرسِل
   INSERT INTO StockMovement 
   (inventoryItemId, warehouseId, movementType, quantity, referenceType, referenceId)
   VALUES
   (10, 1, 'transfer_out', 10, 'stock_transfer', 100);
   
   -- حركة دخول للمخزن المستقبِل
   INSERT INTO StockMovement 
   (inventoryItemId, warehouseId, movementType, quantity, referenceType, referenceId)
   VALUES
   (10, 2, 'transfer_in', 10, 'stock_transfer', 100);
   ```

4. **تحديث حالة النقل:**
   ```sql
   UPDATE StockTransfer 
   SET status = 'completed', receivedAt = NOW()
   WHERE id = 100;
   ```

**النتيجة النهائية:**
- ✅ المخزن الأول: -10
- ✅ المخزن الثاني: +10
- ✅ حركتان مسجلتان
- ✅ سجل نقل كامل

---

### 📊 **السيناريو 4: جرد المخزون (Stock Count)**

#### المسار الكامل:
```
[إنشاء جرد] → [إدخال الكميات الفعلية] → [مقارنة مع النظام] → [تسوية الفروقات] → [تسجيل الخسائر/الزيادات]
```

#### الخطوات التفصيلية:

**الخطوة 1: إنشاء جرد جديد**
```javascript
POST /api/inventory/stock-counts
{
  "warehouseId": 1,
  "countDate": "2025-10-01",
  "countedBy": 5,
  "type": "full",  // full, partial, cycle
  "notes": "جرد نهاية الشهر"
}
```

**النتيجة:**
```sql
INSERT INTO StockCount 
(warehouseId, countNumber, countDate, status, countedBy, type)
VALUES
(1, 'CNT-2025-09', '2025-10-01', 'in_progress', 5, 'full');
```

---

**الخطوة 2: إدخال الكميات الفعلية**
```javascript
POST /api/inventory/stock-counts/50/items
{
  "items": [
    {
      "inventoryItemId": 10,
      "systemQuantity": 45,      // الكمية في النظام
      "actualQuantity": 43,      // الكمية الفعلية
      "difference": -2,          // ⚠️ نقص قطعتان
      "notes": "2 قطعة مفقودة"
    },
    {
      "inventoryItemId": 12,
      "systemQuantity": 90,
      "actualQuantity": 92,      // ✅ زيادة قطعتان
      "difference": +2
    }
  ]
}
```

**النتيجة:**
```sql
INSERT INTO StockCountItem 
(stockCountId, inventoryItemId, systemQuantity, actualQuantity, difference, notes)
VALUES
(50, 10, 45, 43, -2, '2 قطعة مفقودة'),
(50, 12, 90, 92, +2, NULL);
```

---

**الخطوة 3: إتمام ومراجعة الجرد**
```javascript
PUT /api/inventory/stock-counts/50/review
{
  "reviewedBy": 1,  // المدير
  "approvalStatus": "approved",
  "approvalNotes": "تمت الموافقة - تسوية الفروقات"
}
```

---

**الخطوة 4: تسوية الفروقات**
```javascript
POST /api/inventory/stock-counts/50/adjust
{
  "adjustedBy": 1,
  "adjustmentDate": "2025-10-02"
}
```

**ما يحدث:**

1. **لكل صنف به فرق:**
   ```sql
   -- للشاشات (نقص -2)
   UPDATE StockLevel 
   SET currentQuantity = 43  -- تحديث للكمية الفعلية
   WHERE inventoryItemId = 10 AND warehouseId = 1;
   
   INSERT INTO StockMovement 
   (inventoryItemId, warehouseId, movementType, quantity, referenceType, referenceId, notes)
   VALUES
   (10, 1, 'adjustment', -2, 'stock_count', 50, 'تسوية جرد - نقص');
   
   -- للبطاريات (زيادة +2)
   UPDATE StockLevel 
   SET currentQuantity = 92
   WHERE inventoryItemId = 12 AND warehouseId = 1;
   
   INSERT INTO StockMovement 
   (inventoryItemId, warehouseId, movementType, quantity, referenceType, referenceId, notes)
   VALUES
   (12, 1, 'adjustment', +2, 'stock_count', 50, 'تسوية جرد - زيادة');
   ```

2. **تسجيل الخسائر في المالية (للنواقص فقط):**
   ```sql
   INSERT INTO Expense 
   (categoryId, amount, description, referenceType, referenceId, date)
   VALUES
   (10, 300.00, 'خسارة جرد - 2 شاشة LCD (تكلفة: 150 × 2)', 'stock_count', 50, '2025-10-02');
   ```

3. **تحديث حالة الجرد:**
   ```sql
   UPDATE StockCount 
   SET status = 'completed', completedAt = NOW()
   WHERE id = 50;
   ```

**النتيجة النهائية:**
- ✅ المخزون مُطابق للواقع
- ✅ الفروقات مسجلة
- ✅ الخسائر مسجلة في المالية
- ✅ سجل جرد كامل

---

## 📋 جداول مقترحة إضافية

### 1. جدول StockTransfer (نقل بين الفروع)
```sql
CREATE TABLE StockTransfer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transferNumber VARCHAR(50) UNIQUE NOT NULL,
  fromWarehouseId INT NOT NULL,
  toWarehouseId INT NOT NULL,
  status ENUM('pending', 'approved', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
  requestedBy INT NOT NULL,
  approvedBy INT,
  shippedBy INT,
  receivedBy INT,
  transferDate DATE NOT NULL,
  shippedAt TIMESTAMP NULL,
  receivedAt TIMESTAMP NULL,
  carrier VARCHAR(100),
  trackingNumber VARCHAR(100),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fromWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (requestedBy) REFERENCES User(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  FOREIGN KEY (shippedBy) REFERENCES User(id),
  FOREIGN KEY (receivedBy) REFERENCES User(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. جدول StockTransferItem
```sql
CREATE TABLE StockTransferItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transferId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  requestedQuantity INT NOT NULL,
  shippedQuantity INT DEFAULT 0,
  receivedQuantity INT DEFAULT 0,
  condition VARCHAR(50),
  notes TEXT,
  FOREIGN KEY (transferId) REFERENCES StockTransfer(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. جدول StockCount (الجرد)
```sql
CREATE TABLE StockCount (
  id INT PRIMARY KEY AUTO_INCREMENT,
  countNumber VARCHAR(50) UNIQUE NOT NULL,
  warehouseId INT NOT NULL,
  countDate DATE NOT NULL,
  status ENUM('in_progress', 'pending_review', 'approved', 'completed') DEFAULT 'in_progress',
  type ENUM('full', 'partial', 'cycle') DEFAULT 'full',
  countedBy INT NOT NULL,
  reviewedBy INT,
  adjustedBy INT,
  completedAt TIMESTAMP NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (countedBy) REFERENCES User(id),
  FOREIGN KEY (reviewedBy) REFERENCES User(id),
  FOREIGN KEY (adjustedBy) REFERENCES User(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4. جدول StockCountItem
```sql
CREATE TABLE StockCountItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockCountId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  systemQuantity INT NOT NULL,
  actualQuantity INT NOT NULL,
  difference INT GENERATED ALWAYS AS (actualQuantity - systemQuantity) STORED,
  notes TEXT,
  FOREIGN KEY (stockCountId) REFERENCES StockCount(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🎯 ملخص التدفقات

### أنواع الحركات المخزنية:

| النوع | الوصف | مثال | التأثير على المخزون |
|------|-------|------|---------------------|
| **in** | إدخال للمخزن | استلام PO، إرجاع من عميل | ⬆️ زيادة |
| **out** | صرف من المخزن | صرف لصيانة، بيع مباشر | ⬇️ نقص |
| **transfer_out** | خروج للنقل | نقل لفرع آخر | ⬇️ نقص |
| **transfer_in** | دخول من نقل | استلام من فرع آخر | ⬆️ زيادة |
| **adjustment** | تسوية | جرد، تصحيح خطأ | ⬆️⬇️ حسب الفرق |
| **reserve** | حجز | حجز لطلب صيانة | 🔒 حجز فقط |
| **unreserve** | إلغاء حجز | إلغاء طلب صيانة | 🔓 تحرير |
| **write_off** | شطب/إتلاف | قطع تالفة/منتهية | ⬇️ نقص + خسارة |

---

## ✅ الخلاصة

تم تغطية جميع السيناريوهات الأساسية:
- ✅ استلام من موردين
- ✅ صرف للصيانة
- ✅ نقل بين الفروع
- ✅ جرد وتسوية
- ✅ بيع مباشر
- ✅ مرتجعات

**جميع التدفقات مربوطة تلقائياً:**
- المخزون ← → الصيانة
- المخزون ← → الفواتير
- المخزون ← → المالية
- المخزون ← → الموردين

---

**للانتقال للوثيقة التالية:**
- [← تحليل الوضع الحالي](./01_CURRENT_STATE_ANALYSIS.md)
- [→ تصميم قاعدة البيانات المحسن](./03_DATABASE_SCHEMA_ENHANCED.md)

