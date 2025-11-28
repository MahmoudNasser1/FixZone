# 🔗 خطة التكامل - نظام المخزون
## Integration Plan - Inventory System

**التاريخ:** 2025-01-27  
**الحالة:** Production Integration Requirements

---

## 📋 نظرة عامة

هذا الملف يغطي خطة التكامل بين نظام المخزون والموديولات الأخرى في FixZone ERP.

**ملاحظة:** للحصول على التفاصيل الكاملة للتكامل، راجع [InventoryModulePlan/02_INVENTORY_FLOW_MATRIX.md](../../../InventoryModulePlan/02_INVENTORY_FLOW_MATRIX.md)

---

## 🔄 التكامل مع الموديولات

### 1️⃣ Repairs Module (الصيانة)

#### التكامل الحالي:
- ✅ خصم القطع عند الاستخدام
- ✅ تسجيل في PartsUsed

#### التطويرات المطلوبة:

**أ) Reserve/Unreserve System:**
```javascript
// عند إضافة قطعة للطلب - حجز
POST /api/inventory/items/:id/reserve
{
  repairId: 123,
  quantity: 1,
  warehouseId: 1
}

// عند إلغاء الطلب - إلغاء الحجز
POST /api/inventory/items/:id/unreserve
{
  repairId: 123
}

// عند تأكيد الاستخدام - خصم فعلي
POST /api/inventory/items/:id/use
{
  repairId: 123,
  quantity: 1,
  warehouseId: 1
}
```

**ب) Real-time Stock Check:**
- التحقق من التوفر قبل إضافة القطعة
- تحديث فوري للكميات المتاحة

**ج) Auto Return:**
- إرجاع تلقائي للقطع غير المستخدمة
- تسوية تلقائية للتكاليف

---

### 2️⃣ Invoices Module (الفواتير)

#### التكامل الحالي:
- ⚠️ InvoiceItem يحتوي على inventoryItemId

#### التطويرات المطلوبة:

**أ) Auto Deduction:**
```javascript
// عند إنشاء Invoice مع قطع من المخزون
POST /api/invoices
{
  items: [
    {
      inventoryItemId: 10,
      quantity: 2
    }
  ]
}
// يتم خصم تلقائي + تسجيل StockMovement
```

**ب) Validation:**
- التحقق من الكمية المتاحة قبل البيع
- منع البيع إذا كانت الكمية غير كافية

**ج) Returns Handling:**
- إرجاع القطع للمخزون عند الإرجاع
- تسجيل حركة إرجاع

---

### 3️⃣ Finance Module (المالية)

#### التكامل الحالي:
- ⚠️ تكامل محدود

#### التطويرات المطلوبة:

**أ) Cost Tracking:**
- تتبع جميع التكاليف (شراء، نقل، إتلاف)
- حساب الربح لكل صنف

**ب) Expense Recording:**
- تسجيل مصروفات الشراء تلقائياً
- تسجيل خسائر الجرد
- تسجيل تكاليف النقل

**ج) Reports:**
- تقارير الربحية
- تحليل التكاليف
- تقارير القيمة

---

### 4️⃣ Vendors Module (الموردين)

#### التكامل الحالي:
- ✅ Purchase Orders موجودة
- ✅ Vendor Payments موجودة

#### التطويرات المطلوبة:

**أ) Auto Receive:**
```javascript
// استلام تلقائي من PO
POST /api/purchase-orders/:id/receive
{
  warehouseId: 1,
  items: [...]
}
// تحديث المخزون + إنشاء StockMovement + تسجيل Expense
```

**ب) Vendor Performance:**
- تتبع أداء الموردين
- حساب Lead Time
- حساب نسبة النقص/التلف

---

### 5️⃣ Branches Module (الفروع)

#### التكامل المطلوب:

**أ) Multi-Warehouse Support:**
- دعم مخازن متعددة لكل فرع
- صلاحيات حسب الفرع

**ب) Transfer Between Branches:**
- نقل بين فروع
- تتبع النقل

---

## 📡 Event-Driven Integration

### Events System:

```javascript
// Events to emit
const InventoryEvents = {
  ITEM_CREATED: 'inventory.item.created',
  ITEM_UPDATED: 'inventory.item.updated',
  STOCK_ADJUSTED: 'inventory.stock.adjusted',
  LOW_STOCK: 'inventory.stock.low',
  OUT_OF_STOCK: 'inventory.stock.out',
  MOVEMENT_CREATED: 'inventory.movement.created'
};

// Event listeners in other modules
eventBus.on('inventory.stock.adjusted', async (data) => {
  // Update repair costs if item used in repair
  // Update invoice if item in invoice
});
```

---

## 🔄 API Integration Points

### Internal APIs:

```javascript
// Call from Repairs Module
POST /api/inventory/items/:id/reserve
POST /api/inventory/items/:id/use
POST /api/inventory/items/:id/return

// Call from Invoices Module
POST /api/inventory/items/:id/sell
POST /api/inventory/items/:id/return-from-sale

// Call from Finance Module
GET /api/inventory/costs/:itemId
GET /api/inventory/profit-analysis
```

---

## ✅ Checklist التكامل

### Repairs Integration:
- [ ] Reserve/Unreserve system
- [ ] Real-time stock check
- [ ] Auto deduction
- [ ] Auto return

### Invoices Integration:
- [ ] Auto deduction on sale
- [ ] Validation before sale
- [ ] Return handling

### Finance Integration:
- [ ] Cost tracking
- [ ] Expense recording
- [ ] Profit reports

### Vendors Integration:
- [ ] Auto receive from PO
- [ ] Vendor performance tracking

---

**للتفاصيل الكاملة:** راجع [InventoryModulePlan/02_INVENTORY_FLOW_MATRIX.md](../../../InventoryModulePlan/02_INVENTORY_FLOW_MATRIX.md)

**الخطوة التالية:** راجع [06_SECURITY_PLAN.md](./06_SECURITY_PLAN.md)

---

**آخر تحديث:** 2025-01-27


