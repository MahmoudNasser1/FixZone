# مواصفات API - نظام المالية
## Financial System - API Development Plan

**تاريخ الإنشاء:** 2025-01-27  
**الحالة:** Production System - مواصفات API كاملة  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [API Overview](#1-api-overview)
2. [Expenses API](#2-expenses-api)
3. [Payments API](#3-payments-api)
4. [Invoices API](#4-invoices-api)
5. [Financial Reports API](#5-financial-reports-api)
6. [Error Handling](#6-error-handling)
7. [API Versioning](#7-api-versioning)
8. [Rate Limiting](#8-rate-limiting)

---

## 1. API Overview

### 1.1 Base URL

```
Production: https://api.fixzzone.com/api/financial
Development: http://localhost:5000/api/financial
```

### 1.2 Authentication

جميع الـ APIs تتطلب Authentication:

```
Authorization: Bearer <token>
```

### 1.3 Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... } // إذا كان موجود
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "details": { ... } // في Development فقط
}
```

### 1.4 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 2. Expenses API

### 2.1 Get All Expenses

```http
GET /api/financial/expenses
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryId | number | No | Filter by category |
| vendorId | number | No | Filter by vendor |
| branchId | number | No | Filter by branch |
| dateFrom | date | No | Start date (YYYY-MM-DD) |
| dateTo | date | No | End date (YYYY-MM-DD) |
| q | string | No | Search query |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 50, max: 100) |

**Response:**

```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "data": [
    {
      "id": 1,
      "categoryId": 5,
      "categoryName": "مصروفات تشغيلية",
      "amount": 1500.00,
      "description": "فاتورة كهرباء",
      "date": "2025-01-27",
      "branchId": 1,
      "branchName": "الفرع الرئيسي",
      "createdBy": 10,
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### 2.2 Get Expense by ID

```http
GET /api/financial/expenses/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Expense retrieved successfully",
  "data": {
    "id": 1,
    "categoryId": 5,
    "categoryName": "مصروفات تشغيلية",
    "amount": 1500.00,
    "description": "فاتورة كهرباء",
    "date": "2025-01-27",
    "branchId": 1,
    "branchName": "الفرع الرئيسي",
    "createdBy": 10,
    "createdAt": "2025-01-27T10:00:00Z",
    "updatedAt": "2025-01-27T10:00:00Z"
  }
}
```

### 2.3 Create Expense

```http
POST /api/financial/expenses
```

**Request Body:**

```json
{
  "categoryId": 5,
  "amount": 1500.00,
  "description": "فاتورة كهرباء",
  "date": "2025-01-27",
  "vendorId": 10,
  "branchId": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "id": 1,
    "categoryId": 5,
    "amount": 1500.00,
    "description": "فاتورة كهرباء",
    "date": "2025-01-27",
    "createdBy": 10,
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

### 2.4 Update Expense

```http
PUT /api/financial/expenses/:id
```

**Request Body:**

```json
{
  "amount": 1600.00,
  "description": "فاتورة كهرباء محدثة"
}
```

### 2.5 Delete Expense

```http
DELETE /api/financial/expenses/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

### 2.6 Get Expense Statistics

```http
GET /api/financial/expenses/stats
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateFrom | date | No | Start date |
| dateTo | date | No | End date |
| branchId | number | No | Filter by branch |

**Response:**

```json
{
  "success": true,
  "message": "Expense stats retrieved successfully",
  "data": {
    "totalCount": 150,
    "totalAmount": 50000.00,
    "averageAmount": 333.33,
    "minAmount": 50.00,
    "maxAmount": 5000.00,
    "categoryCount": 10
  }
}
```

### 2.7 Bulk Operations

```http
POST /api/financial/expenses/bulk
```

**Request Body:**

```json
{
  "operations": [
    {
      "action": "delete",
      "id": 1
    },
    {
      "action": "update",
      "id": 2,
      "data": {
        "amount": 2000.00
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk operation completed",
  "data": [
    { "id": 1, "success": true },
    { "id": 2, "success": true, "result": { ... } }
  ]
}
```

### 2.8 Export to Excel

```http
GET /api/financial/expenses/export/excel
```

**Query Parameters:** Same as Get All Expenses

**Response:** Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

## 3. Payments API

### 3.1 Get All Payments

```http
GET /api/financial/payments
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| invoiceId | number | No | Filter by invoice |
| customerId | number | No | Filter by customer |
| paymentMethod | string | No | Filter by method (cash, card, bank_transfer, check, other) |
| dateFrom | date | No | Start date |
| dateTo | date | No | End date |
| page | number | No | Page number |
| limit | number | No | Items per page |

**Response:**

```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": [
    {
      "id": 1,
      "invoiceId": 10,
      "invoiceNumber": "INV-2025-00001",
      "amount": 5000.00,
      "paymentMethod": "cash",
      "paymentDate": "2025-01-27",
      "referenceNumber": "REF-001",
      "notes": "دفعة جزئية",
      "createdBy": 10,
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### 3.2 Get Payment by ID

```http
GET /api/financial/payments/:id
```

### 3.3 Create Payment

```http
POST /api/financial/payments
```

**Request Body:**

```json
{
  "invoiceId": 10,
  "amount": 5000.00,
  "paymentMethod": "cash",
  "paymentDate": "2025-01-27",
  "referenceNumber": "REF-001",
  "notes": "دفعة جزئية"
}
```

**Validation:**
- `amount` must be positive
- `amount` must not exceed remaining invoice balance
- `paymentMethod` must be valid

### 3.4 Get Payments by Invoice

```http
GET /api/financial/payments/invoice/:invoiceId
```

**Response:**

```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": [
    {
      "id": 1,
      "amount": 5000.00,
      "paymentMethod": "cash",
      "paymentDate": "2025-01-27",
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ],
  "summary": {
    "totalPaid": 5000.00,
    "remaining": 3000.00,
    "totalAmount": 8000.00
  }
}
```

### 3.5 Get Overdue Payments

```http
GET /api/financial/payments/overdue
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Days overdue (default: 0) |
| page | number | No | Page number |
| limit | number | No | Items per page |

### 3.6 Get Payment Statistics

```http
GET /api/financial/payments/stats/summary
```

**Response:**

```json
{
  "success": true,
  "message": "Payment stats retrieved successfully",
  "data": {
    "totalPayments": 100,
    "totalAmount": 500000.00,
    "byMethod": {
      "cash": 200000.00,
      "card": 150000.00,
      "bank_transfer": 100000.00,
      "check": 50000.00
    },
    "today": {
      "count": 10,
      "amount": 50000.00
    },
    "thisMonth": {
      "count": 50,
      "amount": 250000.00
    }
  }
}
```

---

## 4. Invoices API

### 4.1 Get All Invoices

```http
GET /api/financial/invoices
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (draft, sent, paid, overdue, cancelled) |
| customerId | number | No | Filter by customer |
| repairRequestId | number | No | Filter by repair request |
| dateFrom | date | No | Start date |
| dateTo | date | No | End date |
| page | number | No | Page number |
| limit | number | No | Items per page |

**Response:**

```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "data": [
    {
      "id": 1,
      "invoiceNumber": "INV-2025-00001",
      "customerId": 5,
      "customerName": "أحمد محمد",
      "repairRequestId": 10,
      "subtotal": 7000.00,
      "taxAmount": 980.00,
      "discountAmount": 0.00,
      "totalAmount": 7980.00,
      "currency": "EGP",
      "status": "sent",
      "issueDate": "2025-01-27",
      "dueDate": "2025-02-10",
      "amountPaid": 5000.00,
      "amountRemaining": 2980.00,
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 200,
    "totalPages": 4
  }
}
```

### 4.2 Get Invoice by ID

```http
GET /api/financial/invoices/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice retrieved successfully",
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2025-00001",
    "customerId": 5,
    "customerName": "أحمد محمد",
    "repairRequestId": 10,
    "repairRequestNumber": "REP-2025-00010",
    "items": [
      {
        "id": 1,
        "description": "إصلاح شاشة",
        "quantity": 1,
        "unitPrice": 5000.00,
        "totalPrice": 5000.00
      }
    ],
    "subtotal": 7000.00,
    "taxAmount": 980.00,
    "discountAmount": 0.00,
    "totalAmount": 7980.00,
    "currency": "EGP",
    "status": "sent",
    "issueDate": "2025-01-27",
    "dueDate": "2025-02-10",
    "notes": "ملاحظات",
    "payments": [
      {
        "id": 1,
        "amount": 5000.00,
        "paymentMethod": "cash",
        "paymentDate": "2025-01-27"
      }
    ],
    "amountPaid": 5000.00,
    "amountRemaining": 2980.00,
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

### 4.3 Create Invoice

```http
POST /api/financial/invoices
```

**Request Body:**

```json
{
  "customerId": 5,
  "repairRequestId": 10,
  "items": [
    {
      "description": "إصلاح شاشة",
      "quantity": 1,
      "unitPrice": 5000.00,
      "inventoryItemId": 20,
      "serviceId": 15
    }
  ],
  "discountAmount": 0.00,
  "dueDate": "2025-02-10",
  "notes": "ملاحظات"
}
```

**Validation:**
- `items` must have at least one item
- `items[].quantity` must be positive
- `items[].unitPrice` must be positive
- `discountAmount` must not exceed subtotal

### 4.4 Create Invoice from Repair

```http
POST /api/financial/invoices/create-from-repair/:repairId
```

**Request Body:**

```json
{
  "discountAmount": 0.00,
  "dueDate": "2025-02-10",
  "notes": "ملاحظات"
}
```

### 4.5 Update Invoice

```http
PUT /api/financial/invoices/:id
```

**Request Body:**

```json
{
  "items": [
    {
      "id": 1,
      "description": "إصلاح شاشة محدث",
      "quantity": 1,
      "unitPrice": 5500.00
    }
  ],
  "discountAmount": 100.00,
  "dueDate": "2025-02-15",
  "notes": "ملاحظات محدثة"
}
```

### 4.6 Delete Invoice

```http
DELETE /api/financial/invoices/:id
```

**Validation:**
- Cannot delete paid invoices
- Cannot delete invoices with payments

### 4.7 Generate Invoice PDF

```http
GET /api/financial/invoices/:id/pdf
```

**Response:** PDF file (application/pdf)

### 4.8 Send Invoice

```http
POST /api/financial/invoices/:id/send
```

**Request Body:**

```json
{
  "email": "customer@example.com",
  "method": "email" // email, sms, both
}
```

### 4.9 Mark Invoice as Paid

```http
POST /api/financial/invoices/:id/mark-paid
```

### 4.10 Get Invoice by Repair

```http
GET /api/financial/invoices/by-repair/:repairId
```

### 4.11 Bulk Actions

```http
POST /api/financial/invoices/bulk-action
```

**Request Body:**

```json
{
  "action": "delete", // delete, update_status, send
  "ids": [1, 2, 3],
  "data": { // for update_status
    "status": "sent"
  }
}
```

### 4.12 Get Invoice Statistics

```http
GET /api/financial/invoices/stats
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice stats retrieved successfully",
  "data": {
    "total": 200,
    "byStatus": {
      "draft": 10,
      "sent": 50,
      "paid": 100,
      "overdue": 30,
      "cancelled": 10
    },
    "totalAmount": 1000000.00,
    "paidAmount": 600000.00,
    "unpaidAmount": 400000.00,
    "overdueAmount": 150000.00
  }
}
```

---

## 5. Financial Reports API

### 5.1 Get Financial Dashboard

```http
GET /api/financial/reports/dashboard
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateFrom | date | No | Start date |
| dateTo | date | No | End date |
| branchId | number | No | Filter by branch |

**Response:**

```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "summary": {
      "totalRevenue": 1000000.00,
      "totalExpenses": 500000.00,
      "netProfit": 500000.00,
      "totalInvoices": 200,
      "paidInvoices": 150,
      "unpaidInvoices": 50
    },
    "chartData": {
      "revenue": [...],
      "expenses": [...],
      "profit": [...]
    },
    "recentTransactions": [...]
  }
}
```

### 5.2 Get Profit & Loss Report

```http
GET /api/financial/reports/profit-loss
```

### 5.3 Get Cash Flow Report

```http
GET /api/financial/reports/cash-flow
```

---

## 6. Error Handling

### 6.1 Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Validation failed |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `DUPLICATE_ENTRY` | Duplicate entry |
| `INSUFFICIENT_BALANCE` | Insufficient balance |
| `INVALID_AMOUNT` | Invalid amount |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

### 6.2 Error Response Example

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "amount": "Amount must be positive",
    "categoryId": "Category is required"
  }
}
```

---

## 7. API Versioning

### 7.1 Version Strategy

```
/api/v1/financial/expenses
/api/v2/financial/expenses
```

### 7.2 Version Header

```
API-Version: 1.0
```

---

## 8. Rate Limiting

### 8.1 Limits

- **General:** 100 requests per 15 minutes
- **Financial Operations:** 50 requests per 15 minutes
- **Reports:** 20 requests per 15 minutes

### 8.2 Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## 📚 المراجع

- [خطة Backend](./02_BACKEND_DEVELOPMENT_PLAN.md)
- [خطة Frontend](./03_FRONTEND_DEVELOPMENT_PLAN.md)
- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)

---

**آخر تحديث:** 2025-01-27

