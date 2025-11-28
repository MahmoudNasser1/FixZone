# 🔌 مواصفات APIs - نظام المخزون
## API Specifications - Inventory System

**التاريخ:** 2025-01-27  
**الحالة:** Production API Documentation  
**Base URL:** `/api/v1/inventory`

---

## 📋 نظرة عامة

هذا الملف يحتوي على مواصفات كاملة لجميع APIs في نظام المخزون.

**ملاحظة:** للحصول على التفاصيل الكاملة، راجع [InventoryModulePlan/04_API_SPECIFICATIONS.md](../../../InventoryModulePlan/04_API_SPECIFICATIONS.md)

---

## 🔐 Authentication

جميع APIs تتطلب Authentication:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 📦 Inventory Items APIs

### GET /api/v1/inventory/items
جلب جميع الأصناف مع البحث والفلترة

**Query Parameters:**
```javascript
{
  page: 1,
  limit: 20,
  search: "lcd",
  category: "screens",
  status: "active",
  lowStock: true,
  warehouseId: 1,
  sortBy: "name",
  sortOrder: "asc"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### POST /api/v1/inventory/items
إنشاء صنف جديد

**Request Body:**
```json
{
  "sku": "BAT-IPH12",
  "name": "بطارية iPhone 12",
  "type": "batteries",
  "purchasePrice": 200.00,
  "sellingPrice": 350.00,
  "minStockLevel": 10,
  "barcode": "1234567890123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "sku": "BAT-IPH12",
    "name": "بطارية iPhone 12",
    ...
  }
}
```

---

## 📊 Stock Management APIs

### POST /api/v1/inventory/items/:id/adjust
تعديل الكمية

**Request Body:**
```json
{
  "warehouseId": 1,
  "quantity": 10,
  "type": "add",
  "reason": "استلام من مورد",
  "notes": ""
}
```

---

## 🔄 Stock Movements APIs

### GET /api/v1/inventory/movements
جلب حركات المخزون

### POST /api/v1/inventory/movements
تسجيل حركة جديدة

---

## 📈 Reports APIs

### GET /api/v1/inventory/reports/overview
نظرة عامة

### GET /api/v1/inventory/reports/low-stock
الأصناف المنخفضة

---

**ملاحظة:** هذا ملخص. للحصول على التفاصيل الكاملة، راجع [InventoryModulePlan/04_API_SPECIFICATIONS.md](../../../InventoryModulePlan/04_API_SPECIFICATIONS.md)

---

**الخطوة التالية:** راجع [05_INTEGRATION_PLAN.md](./05_INTEGRATION_PLAN.md)


