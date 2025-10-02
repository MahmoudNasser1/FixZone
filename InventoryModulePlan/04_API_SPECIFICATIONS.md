# 🔌 مواصفات الـ APIs - نظام المخزون
## API Specifications - Inventory Module

**التاريخ:** 2 أكتوبر 2025  
**الهدف:** توثيق كامل لجميع الـ APIs المطلوبة

---

## 📋 جدول محتويات الـ APIs

### 1. Inventory Items APIs
### 2. Warehouses APIs
### 3. Stock Levels APIs
### 4. Stock Movements APIs
### 5. Vendors APIs
### 6. Purchase Orders APIs
### 7. Stock Transfers APIs
### 8. Stock Count APIs
### 9. Stock Alerts APIs
### 10. Reports APIs
### 11. Barcode APIs

---

## 1️⃣ Inventory Items APIs

### GET /api/inventory
**الوصف:** جلب جميع الأصناف مع البحث والفلترة

**Parameters (Query):**
```javascript
{
  page: 1,                    // رقم الصفحة
  limit: 20,                  // عدد النتائج
  search: "lcd",              // بحث في الاسم/SKU/Barcode
  category: 1,                // تصنيف محدد
  status: "active",           // active, inactive
  condition: "new",           // new, used, refurbished, damaged
  lowStock: true,             // فقط الأصناف المنخفضة
  warehouseId: 1,             // حسب مخزن محدد
  sortBy: "name",             // name, sku, quantity, price
  sortOrder: "asc"            // asc, desc
}
```

**Response (200):**
```javascript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 10,
        "name": "شاشة LCD Samsung A50",
        "sku": "PART-001",
        "barcode": "1234567890123",
        "partNumber": "SM-A50-LCD-001",
        "brand": "Samsung",
        "model": "A50",
        "category": "شاشات",
        "categoryId": 1,
        "condition": "new",
        "purchasePrice": 150.00,
        "sellingPrice": 250.00,
        "unit": "قطعة",
        "reorderPoint": 10,
        "reorderQuantity": 50,
        "totalQuantity": 45,          // مجموع الكميات في جميع المخازن
        "totalReserved": 5,
        "totalAvailable": 40,
        "warehouses": [
          {
            "warehouseId": 1,
            "warehouseName": "المستودع الرئيسي",
            "quantity": 30,
            "reserved": 3,
            "available": 27
          },
          {
            "warehouseId": 2,
            "warehouseName": "مستودع الجيزة",
            "quantity": 15,
            "reserved": 2,
            "available": 13
          }
        ],
        "preferredVendor": {
          "id": 5,
          "name": "شركة الإلكترونيات المتقدمة"
        },
        "image": "/uploads/inventory/item-10.jpg",
        "isActive": true,
        "createdAt": "2025-09-15T10:30:00Z",
        "updatedAt": "2025-10-01T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 156,
      "totalPages": 8
    },
    "summary": {
      "totalItems": 156,
      "activeItems": 145,
      "lowStockItems": 12,
      "outOfStockItems": 3,
      "totalValue": 125000.00
    }
  }
}
```

---

### GET /api/inventory/:id
**الوصف:** جلب تفاصيل صنف واحد

**Response (200):**
```javascript
{
  "success": true,
  "data": {
    "item": {
      "id": 10,
      "name": "شاشة LCD Samsung A50",
      "sku": "PART-001",
      "barcode": "1234567890123",
      // ... جميع التفاصيل
    },
    "stockHistory": [
      {
        "date": "2025-10-01",
        "movementType": "out",
        "quantity": -2,
        "referenceType": "repair_request",
        "referenceId": 456,
        "warehouse": "المستودع الرئيسي",
        "user": "أحمد محمد"
      }
    ],
    "vendors": [
      {
        "vendorId": 5,
        "vendorName": "شركة الإلكترونيات",
        "unitPrice": 145.00,
        "isPrimary": true,
        "leadTimeDays": 7,
        "lastPurchaseDate": "2025-09-20"
      }
    ],
    "alerts": [
      {
        "type": "low_stock",
        "severity": "warning",
        "message": "المخزون أقل من الحد الأدنى",
        "createdAt": "2025-10-01T08:00:00Z"
      }
    ]
  }
}
```

---

### POST /api/inventory
**الوصف:** إضافة صنف جديد

**Request Body:**
```javascript
{
  "name": "بطارية iPhone 12",
  "sku": "PART-150",              // اختياري (يُنشأ تلقائياً)
  "barcode": "9876543210987",     // اختياري
  "partNumber": "IP12-BAT-001",
  "brand": "Apple",
  "model": "iPhone 12",
  "categoryId": 2,
  "condition": "new",
  "purchasePrice": 200.00,
  "sellingPrice": 350.00,
  "unit": "قطعة",
  "reorderPoint": 15,
  "reorderQuantity": 50,
  "leadTimeDays": 14,
  "warrantyPeriodDays": 90,
  "preferredVendorId": 8,
  "description": "بطارية أصلية سعة 2815 mAh",
  "weight": 0.05,
  "dimensions": "10x5x0.3",
  "location": "A-12-3",           // موقع التخزين
  "image": "base64_encoded_image_or_url",
  "notes": "يجب التخزين في مكان جاف",
  "customFields": {
    "capacity": "2815 mAh",
    "voltage": "3.83V"
  }
}
```

**Response (201):**
```javascript
{
  "success": true,
  "message": "تم إضافة الصنف بنجاح",
  "data": {
    "id": 160,
    "sku": "PART-150"
  }
}
```

**Errors:**
- `400` - بيانات غير صحيحة
- `409` - SKU أو Barcode موجود مسبقاً

---

### PUT /api/inventory/:id
**الوصف:** تحديث صنف

**Request Body:** (نفس POST لكن جميع الحقول اختيارية)

---

### DELETE /api/inventory/:id
**الوصف:** حذف صنف (soft delete)

**Response (200):**
```javascript
{
  "success": true,
  "message": "تم حذف الصنف بنجاح"
}
```

**Errors:**
- `400` - لا يمكن الحذف (يوجد مخزون أو حركات مرتبطة)

---

## 2️⃣ Warehouses APIs

### GET /api/warehouses
**الوصف:** جلب جميع المخازن

**Response (200):**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "المستودع الرئيسي",
      "location": "القاهرة - مدينة نصر",
      "address": "15 شارع عباس العقاد",
      "type": "main",
      "branchId": 1,
      "branchName": "الفرع الرئيسي",
      "managerId": 5,
      "managerName": "محمد أحمد",
      "capacity": 500.00,
      "currentUtilization": 65.5,
      "totalItems": 85,
      "totalValue": 85000.00,
      "isActive": true
    }
  ]
}
```

---

### POST /api/warehouses
**الوصف:** إضافة مخزن جديد

**Request Body:**
```javascript
{
  "name": "مستودع أكتوبر",
  "location": "6 أكتوبر - الحي الثاني",
  "address": "شارع الجامعة، بجوار المول",
  "type": "branch",
  "branchId": 4,
  "managerId": 12,
  "capacity": 300.00,
  "phone": "0101234567",
  "email": "warehouse.october@fixzone.com"
}
```

---

## 3️⃣ Stock Levels APIs

### GET /api/stock-levels
**الوصف:** جلب مستويات المخزون

**Parameters:**
```javascript
{
  warehouseId: 1,         // مخزن محدد
  itemId: 10,             // صنف محدد
  lowStock: true,         // فقط المنخفضة
  outOfStock: true        // فقط المنتهية
}
```

**Response (200):**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 25,
      "inventoryItemId": 10,
      "itemName": "شاشة LCD Samsung A50",
      "itemSku": "PART-001",
      "warehouseId": 1,
      "warehouseName": "المستودع الرئيسي",
      "currentQuantity": 30,
      "reservedQuantity": 3,
      "availableQuantity": 27,
      "reorderPoint": 10,
      "status": "adequate",        // adequate, low, out_of_stock
      "lastMovementDate": "2025-10-01T14:30:00Z",
      "lastUpdated": "2025-10-01T14:30:00Z"
    }
  ]
}
```

---

### PUT /api/stock-levels/:warehouseId/:itemId/reserve
**الوصف:** حجز كمية من المخزون

**Request Body:**
```javascript
{
  "quantity": 2,
  "referenceType": "repair_request",
  "referenceId": 456,
  "notes": "حجز لطلب صيانة #456"
}
```

**Response (200):**
```javascript
{
  "success": true,
  "message": "تم حجز 2 قطعة بنجاح",
  "data": {
    "currentQuantity": 30,
    "reservedQuantity": 5,    // كان 3 أصبح 5
    "availableQuantity": 25   // كان 27 أصبح 25
  }
}
```

---

## 4️⃣ Stock Movements APIs

### GET /api/stock-movements
**الوصف:** جلب حركات المخزون

**Parameters:**
```javascript
{
  page: 1,
  limit: 50,
  warehouseId: 1,
  itemId: 10,
  movementType: "out",           // in, out, transfer_in, transfer_out, adjustment, etc.
  dateFrom: "2025-10-01",
  dateTo: "2025-10-31",
  referenceType: "repair_request"
}
```

**Response (200):**
```javascript
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": 1250,
        "movementType": "out",
        "inventoryItemId": 10,
        "itemName": "شاشة LCD Samsung A50",
        "warehouseId": 1,
        "warehouseName": "المستودع الرئيسي",
        "quantity": 2,
        "unitCost": 150.00,
        "totalCost": 300.00,
        "referenceType": "repair_request",
        "referenceId": 456,
        "referenceNumber": "REP-2025-456",
        "notes": "صرف لطلب صيانة",
        "createdBy": 5,
        "userName": "أحمد محمد",
        "createdAt": "2025-10-01T14:30:00Z"
      }
    ],
    "pagination": { /* ... */ },
    "summary": {
      "totalIn": 150,
      "totalOut": 85,
      "netMovement": 65,
      "totalValue": 15000.00
    }
  }
}
```

---

### POST /api/stock-movements
**الوصف:** تسجيل حركة مخزنية جديدة

**Request Body:**
```javascript
{
  "movementType": "in",
  "inventoryItemId": 10,
  "warehouseId": 1,
  "quantity": 50,
  "unitCost": 145.00,
  "totalCost": 7250.00,
  "referenceType": "purchase_order",
  "referenceId": 123,
  "notes": "استلام أمر شراء PO-2025-001"
}
```

**Response (201):**
```javascript
{
  "success": true,
  "message": "تم تسجيل الحركة بنجاح",
  "data": {
    "movementId": 1251,
    "newStockLevel": {
      "currentQuantity": 80,    // كان 30 أصبح 80
      "availableQuantity": 75
    }
  }
}
```

---

## 5️⃣ Vendors APIs

### GET /api/vendors
**الوصف:** جلب جميع الموردين

**Parameters:**
```javascript
{
  page: 1,
  limit: 20,
  search: "electronics",
  status: "active",
  sortBy: "totalPurchases",
  sortOrder: "desc"
}
```

**Response (200):**
```javascript
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": 5,
        "name": "شركة الإلكترونيات المتقدمة",
        "contactPerson": "خالد عبد الله",
        "phone": "0123456789",
        "email": "info@advanced-electronics.com",
        "address": "القاهرة - مدينة نصر",
        "taxNumber": "123-456-789",
        "rating": 4.5,
        "status": "active",
        "paymentTerms": "net30",
        "creditLimit": 100000.00,
        "currentBalance": 25000.00,
        "totalOrders": 45,
        "totalPurchases": 450000.00,
        "lastPurchaseDate": "2025-09-28",
        "createdAt": "2024-05-10T00:00:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### GET /api/vendors/:id
**الوصف:** تفاصيل مورد محدد

**Response (200):**
```javascript
{
  "success": true,
  "data": {
    "vendor": {
      // جميع بيانات المورد
    },
    "purchaseOrders": [
      {
        "id": 123,
        "orderNumber": "PO-2025-001",
        "orderDate": "2025-09-20",
        "totalAmount": 15500.00,
        "status": "received",
        "paidAmount": 10000.00,
        "remainingAmount": 5500.00
      }
    ],
    "payments": [
      {
        "id": 50,
        "paymentNumber": "PAY-2025-050",
        "amount": 10000.00,
        "paymentDate": "2025-09-25",
        "paymentMethod": "bank_transfer",
        "status": "completed"
      }
    ],
    "suppliedItems": [
      {
        "itemId": 10,
        "itemName": "شاشة LCD Samsung A50",
        "unitPrice": 145.00,
        "isPrimary": true,
        "totalPurchased": 500,
        "lastPurchaseDate": "2025-09-20"
      }
    ],
    "statistics": {
      "totalOrders": 45,
      "completedOrders": 42,
      "totalValue": 450000.00,
      "averageOrderValue": 10000.00,
      "onTimeDeliveryRate": 92.5
    }
  }
}
```

---

### POST /api/vendors
**الوصف:** إضافة مورد جديد

**Request Body:**
```javascript
{
  "name": "شركة قطع الغيار الحديثة",
  "contactPerson": "أحمد محمود",
  "phone": "0109876543",
  "email": "info@modern-parts.com",
  "address": "الجيزة - الهرم - شارع الأهرامات",
  "taxNumber": "987-654-321",
  "paymentTerms": "net30",
  "creditLimit": 50000.00,
  "website": "https://modern-parts.com",
  "country": "Egypt",
  "city": "Giza",
  "notes": "مورد موثوق للشاشات"
}
```

---

## 6️⃣ Purchase Orders APIs

### GET /api/purchase-orders
**الوصف:** جلب جميع أوامر الشراء

**Parameters:**
```javascript
{
  page: 1,
  limit: 20,
  vendorId: 5,
  status: "received",         // draft, sent, confirmed, received, cancelled
  paymentStatus: "partial",   // pending, partial, paid
  dateFrom: "2025-09-01",
  dateTo: "2025-09-30"
}
```

---

### POST /api/purchase-orders
**الوصف:** إنشاء أمر شراء جديد

**Request Body:**
```javascript
{
  "vendorId": 5,
  "orderDate": "2025-10-02",
  "expectedDelivery": "2025-10-10",
  "warehouseId": 1,               // المخزن المستقبل
  "taxRate": 14,                  // نسبة الضريبة
  "shippingCost": 500.00,
  "discountAmount": 200.00,
  "items": [
    {
      "inventoryItemId": 10,
      "quantity": 50,
      "unitPrice": 145.00,
      "notes": "يفضل موديل 2025"
    },
    {
      "inventoryItemId": 12,
      "quantity": 100,
      "unitPrice": 78.00
    }
  ],
  "notes": "طلب عاجل - يرجى التسليم السريع"
}
```

**Response (201):**
```javascript
{
  "success": true,
  "message": "تم إنشاء أمر الشراء بنجاح",
  "data": {
    "id": 125,
    "orderNumber": "PO-2025-125",
    "totalAmount": 15050.00,
    "taxAmount": 2107.00,
    "shippingCost": 500.00,
    "discountAmount": 200.00,
    "finalAmount": 17457.00,
    "status": "draft"
  }
}
```

---

### PUT /api/purchase-orders/:id/status
**الوصف:** تحديث حالة أمر الشراء

**Request Body:**
```javascript
{
  "status": "sent",             // draft → sent → confirmed → received
  "notes": "تم إرسال الطلب للمورد"
}
```

---

### POST /api/purchase-orders/:id/receive
**الوصف:** استلام أمر شراء (تحديث المخزون تلقائياً)

**Request Body:**
```javascript
{
  "warehouseId": 1,
  "receivedDate": "2025-10-08",
  "items": [
    {
      "purchaseOrderItemId": 450,
      "inventoryItemId": 10,
      "receivedQuantity": 48,    // من أصل 50 مطلوبة
      "condition": "good",
      "notes": "قطعتان تالفتان"
    },
    {
      "purchaseOrderItemId": 451,
      "inventoryItemId": 12,
      "receivedQuantity": 100,   // كامل
      "condition": "good"
    }
  ],
  "notes": "تم الاستلام بنجاح"
}
```

**ما يحدث تلقائياً:**
1. ✅ تحديث `receivedQuantity` في `PurchaseOrderItem`
2. ✅ تحديث حالة PO → `received`
3. ✅ إنشاء حركات مخزنية (StockMovement)
4. ✅ تحديث مستويات المخزون (StockLevel)
5. ✅ إنشاء مصروف في المالية (Expense)
6. ✅ تسجيل في AuditLog

**Response (200):**
```javascript
{
  "success": true,
  "message": "تم استلام الطلب وتحديث المخزون بنجاح",
  "data": {
    "receivedItems": 2,
    "totalQuantityReceived": 148,
    "stockMovementsCreated": 2,
    "newStockLevels": [
      {
        "itemId": 10,
        "warehouse": "المستودع الرئيسي",
        "newQuantity": 78    // كان 30 أصبح 78
      },
      {
        "itemId": 12,
        "warehouse": "المستودع الرئيسي",
        "newQuantity": 190   // كان 90 أصبح 190
      }
    ]
  }
}
```

---

## 7️⃣ Stock Transfers APIs

### GET /api/stock-transfers
**الوصف:** جلب طلبات النقل بين الفروع

**Parameters:**
```javascript
{
  status: "in_transit",
  fromWarehouseId: 1,
  toWarehouseId: 2,
  dateFrom: "2025-10-01"
}
```

---

### POST /api/stock-transfers
**الوصف:** إنشاء طلب نقل

**Request Body:**
```javascript
{
  "fromWarehouseId": 1,
  "toWarehouseId": 2,
  "transferDate": "2025-10-05",
  "expectedArrivalDate": "2025-10-06",
  "reason": "نقص في فرع الجيزة",
  "items": [
    {
      "inventoryItemId": 10,
      "quantity": 10,
      "notes": "شاشات عاجلة"
    }
  ]
}
```

---

### POST /api/stock-transfers/:id/receive
**الوصف:** استلام نقل (تحديث المخزون تلقائياً)

**Request Body:**
```javascript
{
  "receivedDate": "2025-10-06 10:30:00",
  "items": [
    {
      "transferItemId": 250,
      "receivedQuantity": 10,
      "damagedQuantity": 0,
      "condition": "good"
    }
  ]
}
```

---

## 8️⃣ Stock Count APIs

### POST /api/stock-counts
**الوصف:** إنشاء جرد جديد

**Request Body:**
```javascript
{
  "warehouseId": 1,
  "countDate": "2025-10-01",
  "type": "full",              // full, partial, cycle, spot
  "notes": "جرد نهاية الشهر"
}
```

---

### POST /api/stock-counts/:id/items
**الوصف:** إدخال نتائج الجرد

**Request Body:**
```javascript
{
  "items": [
    {
      "inventoryItemId": 10,
      "systemQuantity": 45,
      "actualQuantity": 43,
      "notes": "2 قطعة مفقودة"
    },
    {
      "inventoryItemId": 12,
      "systemQuantity": 90,
      "actualQuantity": 92
    }
  ]
}
```

---

### POST /api/stock-counts/:id/adjust
**الوصف:** تسوية الفروقات (تحديث المخزون)

**Response (200):**
```javascript
{
  "success": true,
  "message": "تم تسوية الجرد وتحديث المخزون",
  "data": {
    "totalItems": 85,
    "itemsWithDiscrepancies": 12,
    "adjustmentsMade": 12,
    "totalValueDifference": -450.00,    // خسارة
    "expenseRecordCreated": true
  }
}
```

---

## 9️⃣ Stock Alerts APIs

### GET /api/stock-alerts
**الوصف:** جلب التنبيهات

**Parameters:**
```javascript
{
  status: "active",           // active, acknowledged, resolved
  alertType: "low_stock",     // low_stock, out_of_stock, overstock, expiring_soon
  severity: "critical",       // info, warning, critical
  warehouseId: 1
}
```

**Response (200):**
```javascript
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 45,
        "inventoryItemId": 15,
        "itemName": "بطارية iPhone 11",
        "warehouseId": 1,
        "warehouseName": "المستودع الرئيسي",
        "alertType": "low_stock",
        "currentQuantity": 8,
        "threshold": 15,
        "severity": "warning",
        "status": "active",
        "message": "الصنف بطارية iPhone 11 انخفض إلى 8 قطع (الحد: 15)",
        "createdAt": "2025-10-02T08:00:00Z"
      }
    ],
    "summary": {
      "totalActive": 12,
      "critical": 3,
      "warning": 7,
      "info": 2
    }
  }
}
```

---

### PUT /api/stock-alerts/:id/acknowledge
**الوصف:** الإقرار بالتنبيه

---

## 🔟 Reports APIs

### GET /api/reports/inventory-summary
**الوصف:** تقرير ملخص المخزون

**Response:** بيانات شاملة عن المخزون الحالي

---

### GET /api/reports/stock-valuation
**الوصف:** تقرير تقييم المخزون

**Response:**
```javascript
{
  "totalItems": 156,
  "totalQuantity": 8500,
  "totalCostValue": 1250000.00,
  "totalSellingValue": 2125000.00,
  "potentialProfit": 875000.00,
  "byCategory": [
    {
      "category": "شاشات",
      "items": 45,
      "quantity": 2500,
      "costValue": 500000.00,
      "sellingValue": 850000.00
    }
  ]
}
```

---

### GET /api/reports/movement-history
**الوصف:** تقرير حركة المخزون

---

### GET /api/reports/vendor-performance
**الوصف:** تقرير أداء الموردين

---

## 1️⃣1️⃣ Barcode APIs

### GET /api/barcode/lookup/:barcode
**الوصف:** البحث عن صنف بالباركود

**Response (200):**
```javascript
{
  "success": true,
  "data": {
    "id": 10,
    "name": "شاشة LCD Samsung A50",
    "sku": "PART-001",
    "barcode": "1234567890123",
    "availableStock": [
      {
        "warehouseId": 1,
        "warehouseName": "المستودع الرئيسي",
        "availableQuantity": 27
      }
    ]
  }
}
```

---

### POST /api/barcode/scan
**الوصف:** تسجيل عملية مسح باركود

**Request Body:**
```javascript
{
  "barcode": "1234567890123",
  "scanType": "issue",        // receive, issue, transfer, count, lookup
  "warehouseId": 1,
  "referenceType": "repair_request",
  "referenceId": 456
}
```

---

## ✅ ملاحظات عامة

### Authentication:
جميع الـ APIs تتطلب Authentication Header:
```
Authorization: Bearer <jwt_token>
```

### Error Responses:
```javascript
{
  "success": false,
  "message": "رسالة الخطأ بالعربية",
  "error": "ERROR_CODE",
  "details": { /* تفاصيل إضافية */ }
}
```

### Error Codes:
- `400` - Bad Request (بيانات غير صحيحة)
- `401` - Unauthorized (غير مصرح)
- `403` - Forbidden (ممنوع)
- `404` - Not Found (غير موجود)
- `409` - Conflict (تعارض - مثل SKU مكرر)
- `422` - Validation Error (خطأ في التحقق)
- `500` - Server Error (خطأ في الخادم)

---

**للانتقال للوثيقة التالية:**
- [← تصميم قاعدة البيانات](./03_DATABASE_SCHEMA_ENHANCED.md)
- [→ خارطة الطريق المرحلية](./05_PHASED_ROADMAP.md)

