# 📚 **دليل APIs - Phase 1**

## 🎯 **نظرة عامة**

هذا الدليل يوفر معلومات تفصيلية عن جميع الـ APIs المتاحة في Phase 1.

**Base URL:** `http://localhost:3001/api`

---

## 📦 **Inventory Items APIs**

### **1. قائمة الأصناف**

```http
GET /api/inventory-enhanced/items
```

**Query Parameters:**
| Parameter | Type | Default | الوصف |
|-----------|------|---------|-------|
| page | number | 1 | رقم الصفحة |
| limit | number | 20 | عدد العناصر |
| search | string | '' | البحث (name, sku, barcode) |
| category | string | '' | اسم الفئة |
| status | string | '' | الحالة |
| condition | string | '' | الحالة (new/used/...) |
| lowStock | boolean | false | فقط المنخفضة |
| warehouseId | number | - | المخزن المحدد |
| sortBy | string | 'name' | الحقل للترتيب |
| sortOrder | string | 'ASC' | اتجاه الترتيب |

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
        "barcode": "123456789",
        "categoryName": "شاشات",
        "preferredVendorName": "مورد الشاشات",
        "totalStock": 100,
        "totalReserved": 0,
        "purchasePrice": "150.00",
        "sellingPrice": "250.00",
        "unit": "قطعة",
        "minStockLevel": 10,
        "maxStockLevel": 1000,
        "isActive": true
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

**مثال - cURL:**
```bash
curl http://localhost:3001/api/inventory-enhanced/items?page=1&limit=5
```

**مثال - JavaScript:**
```javascript
const response = await inventoryService.listItems({
  page: 1,
  limit: 20,
  search: 'iPad',
  lowStock: true
});
```

---

### **2. تفاصيل صنف محدد**

```http
GET /api/inventory-enhanced/items/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "name": "شاشة LCD هاتف",
      "sku": "PART-001",
      "description": "شاشة LCD للهواتف الذكية",
      "categoryName": "شاشات",
      "totalQuantity": 100,
      "totalReserved": 0,
      "totalAvailable": 100,
      "purchasePrice": "150.00",
      "sellingPrice": "250.00"
    },
    "stockLevels": [
      {
        "warehouseId": 1,
        "warehouseName": "المستودع الرئيسي",
        "currentQuantity": 80,
        "reservedQuantity": 0,
        "availableQuantity": 80
      }
    ],
    "recentMovements": [
      {
        "id": 1,
        "movementType": "in",
        "quantity": 100,
        "createdAt": "2025-10-03T03:32:00.000Z"
      }
    ]
  }
}
```

---

### **3. إضافة صنف جديد**

```http
POST /api/inventory-enhanced/items
```

**Request Body:**
```json
{
  "name": "شاشة iPhone 13",
  "sku": "PART-034",
  "barcode": "8850123456789",
  "brand": "Apple",
  "model": "iPhone 13",
  "categoryId": 1,
  "condition": "new",
  "purchasePrice": 300.00,
  "sellingPrice": 500.00,
  "unit": "قطعة",
  "minStockLevel": 5,
  "maxStockLevel": 50,
  "preferredVendorId": 1,
  "description": "شاشة iPhone 13 أصلية"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إضافة الصنف بنجاح",
  "data": {
    "id": 34,
    "name": "شاشة iPhone 13",
    "sku": "PART-034"
  }
}
```

---

### **4. تحديث صنف**

```http
PUT /api/inventory-enhanced/items/:id
```

**Request Body:** (أي حقل من الحقول المتاحة)
```json
{
  "purchasePrice": 320.00,
  "sellingPrice": 520.00,
  "minStockLevel": 10
}
```

---

### **5. حذف صنف (Soft Delete)**

```http
DELETE /api/inventory-enhanced/items/:id
```

**Response:**
```json
{
  "success": true,
  "message": "تم حذف الصنف بنجاح"
}
```

---

## 📊 **Statistics APIs**

### **إحصائيات المخزون**

```http
GET /api/inventory-enhanced/stats
```

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
    "byCategory": [
      {
        "categoryId": 1,
        "categoryName": "شاشات (Screens)",
        "totalItems": 10,
        "totalQuantity": "50",
        "totalValue": "12000.00"
      }
    ],
    "byWarehouse": [
      {
        "warehouseId": 1,
        "warehouseName": "المستودع الرئيسي",
        "totalItems": 25,
        "totalQuantity": "200",
        "totalValue": "25000.00"
      }
    ],
    "topItems": [
      {
        "id": 1,
        "name": "شاشة LCD هاتف",
        "sku": "PART-001",
        "totalQuantity": "100",
        "totalValue": "15000.00"
      }
    ],
    "recentMovements": [
      {
        "id": 1,
        "movementType": "in",
        "quantity": 100,
        "itemName": "شاشة LCD هاتف",
        "warehouseName": "المستودع الرئيسي",
        "createdAt": "2025-10-03T03:32:00.000Z"
      }
    ]
  }
}
```

---

## 📈 **Stock Movements APIs**

### **1. قائمة الحركات المخزنية**

```http
GET /api/inventory-enhanced/movements
```

**Query Parameters:**
| Parameter | Type | الوصف |
|-----------|------|-------|
| page | number | رقم الصفحة |
| limit | number | عدد العناصر |
| itemId | number | الصنف المحدد |
| warehouseId | number | المخزن المحدد |
| movementType | string | نوع الحركة |
| dateFrom | date | من تاريخ |
| dateTo | date | إلى تاريخ |

**Response:**
```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": 1,
        "inventoryItemId": 1,
        "itemName": "شاشة LCD هاتف",
        "itemSku": "PART-001",
        "warehouseId": 1,
        "warehouseName": "المستودع الرئيسي",
        "movementType": "in",
        "quantity": 100,
        "unitCost": "150.00",
        "totalCost": "15000.00",
        "referenceType": "purchase_order",
        "referenceId": 1,
        "notes": "استلام من المورد",
        "createdBy": 1,
        "createdByName": "1",
        "createdAt": "2025-10-03T03:32:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalMovements": 19,
      "totalPages": 1
    }
  }
}
```

---

### **2. إضافة حركة مخزنية**

```http
POST /api/inventory-enhanced/movements
```

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
- `in` - دخول (استلام من مورد)
- `out` - خروج (بيع أو استهلاك)
- `transfer` - نقل (بين مخازن)
- `adjustment` - تسوية (جرد)
- `repair_consumption` - استهلاك في صيانة
- `sale` - بيع مباشر
- `return_from_repair` - إرجاع من صيانة
- `return_to_vendor` - إرجاع للمورد
- `initial_stock` - مخزون افتتاحي
- `write_off` - شطب
- `reserve` - حجز
- `unreserve` - إلغاء حجز

**Response:**
```json
{
  "success": true,
  "message": "تمت إضافة الحركة وتحديث المخزون بنجاح",
  "data": {
    "movementId": 20,
    "newStockLevel": {
      "currentQuantity": 150,
      "reservedQuantity": 0,
      "availableQuantity": 150
    }
  }
}
```

---

## 🏪 **Stock Levels APIs**

### **1. قائمة مستويات المخزون**

```http
GET /api/inventory-enhanced/stock-levels
```

**Query Parameters:**
| Parameter | Type | الوصف |
|-----------|------|-------|
| page | number | رقم الصفحة |
| limit | number | عدد العناصر |
| itemId | number | الصنف المحدد |
| warehouseId | number | المخزن المحدد |
| lowStock | boolean | فقط المنخفضة |

**Response:**
```json
{
  "success": true,
  "data": {
    "levels": [
      {
        "id": 1,
        "inventoryItemId": 1,
        "itemName": "شاشة LCD هاتف",
        "itemSku": "PART-001",
        "warehouseId": 1,
        "warehouseName": "المستودع الرئيسي",
        "currentQuantity": 80,
        "reservedQuantity": 0,
        "availableQuantity": 80,
        "minStockLevel": 10,
        "maxStockLevel": 1000,
        "isLow": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalLevels": 58
    }
  }
}
```

---

## 🏢 **Vendors APIs**

### **1. قائمة الموردين**

```http
GET /api/vendors
```

**Query Parameters:**
- `search` - البحث في الاسم
- `status` - الحالة (active/inactive/on_hold)
- `category` - الفئة

**Response:**
```json
[
  {
    "id": 1,
    "name": "مورد قطع الغيار الأول",
    "contactPerson": "أحمد محمد",
    "phone": "01012345678",
    "email": "vendor1@example.com",
    "address": "القاهرة - مصر الجديدة",
    "status": "active",
    "rating": "4.80",
    "category": "قطع غيار"
  }
]
```

---

## 🏪 **Warehouses APIs**

### **1. قائمة المخازن**

```http
GET /api/warehouses
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "المستودع الرئيسي",
    "location": "القاهرة - المقر الرئيسي",
    "managerId": null,
    "type": "main",
    "capacity": 10000,
    "phone": "0225551234",
    "email": "warehouse1@fixzone.com",
    "isActive": true
  }
]
```

---

## 🔍 **أمثلة الاستخدام**

### **مثال 1: البحث عن أصناف تحتوي على "iPad"**

```bash
curl "http://localhost:3001/api/inventory-enhanced/items?search=iPad"
```

**النتيجة:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 82,
        "name": "بطارية iPad",
        "sku": "PART-019"
      }
    ],
    "pagination": {
      "totalItems": 2
    }
  }
}
```

---

### **مثال 2: إضافة حركة دخول**

```bash
curl -X POST http://localhost:3001/api/inventory-enhanced/movements \
  -H "Content-Type: application/json" \
  -d '{
    "inventoryItemId": 1,
    "warehouseId": 1,
    "movementType": "in",
    "quantity": 50,
    "unitCost": 150.00,
    "notes": "استلام من المورد"
  }'
```

---

### **مثال 3: الحصول على إحصائيات المخزون**

```bash
curl http://localhost:3001/api/inventory-enhanced/stats
```

**النتيجة:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalItems": 33,
      "totalCostValue": "30800.00",
      "totalSellingValue": "48200.00"
    }
  }
}
```

---

## ⚠️ **Error Handling**

### **Error Response Format**

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

### **HTTP Status Codes**

| Code | الوصف |
|------|-------|
| 200 | نجاح |
| 201 | تم الإنشاء بنجاح |
| 400 | بيانات غير صالحة |
| 401 | غير مصرح |
| 404 | غير موجود |
| 409 | تكرار (Duplicate) |
| 500 | خطأ في السيرفر |

---

## 🧪 **اختبار APIs**

### **Postman Collection**

يمكنك استيراد الـ Collection التالي في Postman:

```json
{
  "info": {
    "name": "FixZone - Inventory APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Items",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/inventory-enhanced/items",
          "host": ["{{baseUrl}}"],
          "path": ["inventory-enhanced", "items"]
        }
      }
    }
  ]
}
```

### **Variables:**
```
baseUrl = http://localhost:3001/api
```

---

## 📝 **Notes**

1. جميع الـ timestamps بصيغة ISO 8601
2. جميع الأسعار بـ 2 decimal places
3. Soft Delete: الحذف يضبط `deletedAt` فقط
4. Pagination: الصفحة الأولى = 1 (ليس 0)
5. Arabic Support: جميع الرسائل بالعربية

---

**آخر تحديث:** 3 أكتوبر 2025  
**الإصدار:** 1.0

