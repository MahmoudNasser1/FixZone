# 🔧 API Test Examples with curl

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Tickets (Repair Requests)](#tickets-repair-requests)
3. [Customers](#customers)
4. [Invoices](#invoices)
5. [Payments](#payments)
6. [Inventory](#inventory)
7. [Reports](#reports)
8. [RBAC Permission Tests](#rbac-permission-tests)

---

## Authentication

### 1. Login (Success)

```bash
curl -X POST https://staging.api.fixzone.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginIdentifier": "reception@fixzone.com",
    "password": "password"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": 3,
    "email": "reception@fixzone.com",
    "firstName": "فاطمة",
    "lastName": "الاستقبال",
    "role": "reception",
    "isActive": true
  },
  "message": "تم تسجيل الدخول بنجاح"
}
```

**Status:** `200 OK`

**Note:** JWT token is set in `httpOnly` cookie named `token`

---

### 2. Login (Invalid Credentials)

```bash
curl -X POST https://staging.api.fixzone.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginIdentifier": "reception@fixzone.com",
    "password": "wrong_password"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Status:** `401 Unauthorized`

---

### 3. Access Protected Route (Without Token)

```bash
curl -X GET https://staging.api.fixzone.com/api/tickets \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Status:** `401 Unauthorized`

---

### 4. Access Protected Route (With Valid Token)

```bash
# Store token from login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET https://staging.api.fixzone.com/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticketNumber": "TKT-2025-001",
      "status": "received",
      "customer": { "firstName": "أحمد", "phone": "01012345678" },
      "createdAt": "2025-10-01T10:00:00.000Z"
    },
    // ... more tickets
  ]
}
```

**Status:** `200 OK`

---

### 5. Logout

```bash
curl -X POST https://staging.api.fixzone.com/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

**Status:** `200 OK`

---

## Tickets (Repair Requests)

### 1. Create Ticket (With Existing Customer)

```bash
curl -X POST https://staging.api.fixzone.com/api/repairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "customerId": 1,
    "deviceBrand": "Samsung",
    "deviceModel": "Galaxy S21",
    "deviceSerial": "SN123456789",
    "reportedProblem": "الشاشة مكسورة ولا تعمل اللمس",
    "accessories": ["شاحن", "سماعات"],
    "priority": "high",
    "estimatedCost": 500
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "ticketNumber": "TKT-2025-015",
    "status": "received",
    "customerId": 1,
    "deviceBrand": "Samsung",
    "deviceModel": "Galaxy S21",
    "reportedProblem": "الشاشة مكسورة ولا تعمل اللمس",
    "priority": "high",
    "estimatedCost": 500,
    "createdAt": "2025-10-01T12:30:00.000Z",
    "customer": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "محمد",
      "phone": "01012345678"
    }
  },
  "message": "تم إنشاء التذكرة بنجاح"
}
```

**Status:** `201 Created`

---

### 2. Create Ticket (With Inline Customer Creation)

```bash
curl -X POST https://staging.api.fixzone.com/api/repairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "customer": {
      "firstName": "علي",
      "lastName": "أحمد",
      "phone": "01098765432",
      "email": "ali@example.com"
    },
    "deviceBrand": "iPhone",
    "deviceModel": "13 Pro",
    "reportedProblem": "البطارية تنفذ بسرعة",
    "priority": "medium"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 16,
    "ticketNumber": "TKT-2025-016",
    "status": "received",
    "customerId": 8,
    "deviceBrand": "iPhone",
    "deviceModel": "13 Pro",
    "reportedProblem": "البطارية تنفذ بسرعة",
    "priority": "medium",
    "createdAt": "2025-10-01T12:35:00.000Z",
    "customer": {
      "id": 8,
      "firstName": "علي",
      "lastName": "أحمد",
      "phone": "01098765432",
      "email": "ali@example.com"
    }
  },
  "message": "تم إنشاء التذكرة والعميل بنجاح"
}
```

**Status:** `201 Created`

---

### 3. Get All Tickets

```bash
curl -X GET https://staging.api.fixzone.com/api/repairs \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticketNumber": "TKT-2025-001",
      "status": "completed",
      "customer": { "firstName": "أحمد", "phone": "01012345678" },
      "deviceBrand": "Samsung",
      "deviceModel": "S21",
      "priority": "high",
      "createdAt": "2025-09-25T10:00:00.000Z"
    },
    // ... more tickets
  ],
  "total": 45
}
```

**Status:** `200 OK`

---

### 4. Get Single Ticket

```bash
curl -X GET https://staging.api.fixzone.com/api/repairs/1 \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketNumber": "TKT-2025-001",
    "status": "completed",
    "customerId": 1,
    "deviceId": 1,
    "reportedProblem": "الشاشة مكسورة",
    "diagnosedProblem": "شاشة تالفة تحتاج استبدال كامل",
    "priority": "high",
    "estimatedCost": 500,
    "finalCost": 480,
    "createdAt": "2025-09-25T10:00:00.000Z",
    "completedAt": "2025-09-27T14:30:00.000Z",
    "customer": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "محمد",
      "phone": "01012345678",
      "email": "ahmed@example.com"
    },
    "device": {
      "id": 1,
      "deviceBrand": "Samsung",
      "deviceModel": "S21",
      "deviceSerial": "SN123456789"
    },
    "technician": {
      "id": 2,
      "firstName": "محمد",
      "lastName": "الفني"
    },
    "statusHistory": [
      {
        "status": "received",
        "timestamp": "2025-09-25T10:00:00.000Z",
        "notes": "تم استلام الجهاز"
      },
      {
        "status": "in_progress",
        "timestamp": "2025-09-25T11:30:00.000Z",
        "notes": "بدء الفحص والإصلاح"
      },
      {
        "status": "completed",
        "timestamp": "2025-09-27T14:30:00.000Z",
        "notes": "تم الانتهاء من الإصلاح بنجاح"
      }
    ]
  }
}
```

**Status:** `200 OK`

---

### 5. Update Ticket Status

```bash
curl -X PUT https://staging.api.fixzone.com/api/repairs/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "in_progress",
    "notes": "بدء الفحص الأولي للجهاز",
    "technicianId": 2
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketNumber": "TKT-2025-001",
    "status": "in_progress",
    "notes": "بدء الفحص الأولي للجهاز",
    "technicianId": 2,
    "updatedAt": "2025-10-01T13:00:00.000Z"
  },
  "message": "تم تحديث حالة التذكرة وإرسال إشعار للعميل"
}
```

**Status:** `200 OK`

---

### 6. Search Tickets

```bash
curl -X GET "https://staging.api.fixzone.com/api/repairs?search=أحمد&status=in_progress&priority=high" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "ticketNumber": "TKT-2025-005",
      "status": "in_progress",
      "priority": "high",
      "customer": { "firstName": "أحمد", "phone": "01012345678" },
      "deviceBrand": "Samsung",
      "createdAt": "2025-09-28T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Status:** `200 OK`

---

## Customers

### 1. Create Customer

```bash
curl -X POST https://staging.api.fixzone.com/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "firstName": "خالد",
    "lastName": "عبدالله",
    "phone": "01055555555",
    "email": "khaled@example.com",
    "address": "القاهرة - مصر الجديدة",
    "notes": "عميل VIP"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "firstName": "خالد",
    "lastName": "عبدالله",
    "phone": "01055555555",
    "email": "khaled@example.com",
    "address": "القاهرة - مصر الجديدة",
    "notes": "عميل VIP",
    "isActive": true,
    "createdAt": "2025-10-01T13:15:00.000Z"
  },
  "message": "تم إنشاء العميل بنجاح"
}
```

**Status:** `201 Created`

---

### 2. Get All Customers

```bash
curl -X GET https://staging.api.fixzone.com/api/customers \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "محمد",
      "phone": "01012345678",
      "email": "ahmed@example.com",
      "totalTickets": 5,
      "totalSpent": 2500,
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    // ... more customers
  ],
  "total": 45
}
```

**Status:** `200 OK`

---

### 3. Get Customer by ID

```bash
curl -X GET https://staging.api.fixzone.com/api/customers/1 \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "أحمد",
    "lastName": "محمد",
    "phone": "01012345678",
    "email": "ahmed@example.com",
    "address": "القاهرة - المعادي",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "tickets": [
      {
        "id": 1,
        "ticketNumber": "TKT-2025-001",
        "status": "completed",
        "createdAt": "2025-09-25T10:00:00.000Z"
      },
      // ... more tickets
    ],
    "totalTickets": 5,
    "totalSpent": 2500
  }
}
```

**Status:** `200 OK`

---

### 4. Update Customer

```bash
curl -X PUT https://staging.api.fixzone.com/api/customers/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "phone": "01012345679",
    "address": "القاهرة - النزهة الجديدة",
    "notes": "تم تحديث رقم الهاتف"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "أحمد",
    "lastName": "محمد",
    "phone": "01012345679",
    "address": "القاهرة - النزهة الجديدة",
    "updatedAt": "2025-10-01T13:20:00.000Z"
  },
  "message": "تم تحديث بيانات العميل بنجاح"
}
```

**Status:** `200 OK`

---

## Invoices

### 1. Create Invoice

```bash
curl -X POST https://staging.api.fixzone.com/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "repairRequestId": 1,
    "totalAmount": 500,
    "taxAmount": 75,
    "currency": "EGP",
    "status": "draft"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "invoiceNumber": "INV-2025-008",
    "repairRequestId": 1,
    "totalAmount": 500,
    "taxAmount": 75,
    "finalAmount": 575,
    "currency": "EGP",
    "status": "draft",
    "issueDate": "2025-10-01",
    "dueDate": "2025-10-31",
    "createdAt": "2025-10-01T13:30:00.000Z"
  },
  "message": "تم إنشاء الفاتورة بنجاح"
}
```

**Status:** `201 Created`

---

### 2. Get All Invoices

```bash
curl -X GET https://staging.api.fixzone.com/api/invoices \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoiceNumber": "INV-2025-001",
      "totalAmount": 500,
      "finalAmount": 575,
      "status": "paid",
      "customer": { "firstName": "أحمد", "phone": "01012345678" },
      "issueDate": "2025-09-27",
      "createdAt": "2025-09-27T14:30:00.000Z"
    },
    // ... more invoices
  ],
  "total": 25
}
```

**Status:** `200 OK`

---

### 3. Get Invoice by ID

```bash
curl -X GET https://staging.api.fixzone.com/api/invoices/1 \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2025-001",
    "repairRequestId": 1,
    "totalAmount": 500,
    "taxAmount": 75,
    "finalAmount": 575,
    "amountPaid": 575,
    "currency": "EGP",
    "status": "paid",
    "issueDate": "2025-09-27",
    "dueDate": "2025-10-27",
    "customer": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "محمد",
      "phone": "01012345678"
    },
    "repairRequest": {
      "id": 1,
      "ticketNumber": "TKT-2025-001",
      "deviceBrand": "Samsung",
      "deviceModel": "S21"
    },
    "payments": [
      {
        "id": 1,
        "amount": 575,
        "paymentMethod": "cash",
        "paymentDate": "2025-09-27",
        "createdBy": "accountant@fixzone.com"
      }
    ]
  }
}
```

**Status:** `200 OK`

---

## Payments

### 1. Create Full Payment

```bash
curl -X POST https://staging.api.fixzone.com/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "invoiceId": 8,
    "amount": 575,
    "paymentMethod": "cash",
    "currency": "EGP"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "invoiceId": 8,
    "amount": 575,
    "paymentMethod": "cash",
    "currency": "EGP",
    "paymentDate": "2025-10-01",
    "createdBy": 4,
    "createdAt": "2025-10-01T13:45:00.000Z",
    "invoice": {
      "id": 8,
      "invoiceNumber": "INV-2025-008",
      "status": "paid",
      "amountPaid": 575,
      "finalAmount": 575
    }
  },
  "message": "تم تسجيل الدفعة بنجاح وتحديث حالة الفاتورة إلى مدفوعة"
}
```

**Status:** `201 Created`

---

### 2. Create Partial Payment

```bash
curl -X POST https://staging.api.fixzone.com/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "invoiceId": 9,
    "amount": 300,
    "paymentMethod": "card",
    "currency": "EGP"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 16,
    "invoiceId": 9,
    "amount": 300,
    "paymentMethod": "card",
    "currency": "EGP",
    "paymentDate": "2025-10-01",
    "createdBy": 4,
    "createdAt": "2025-10-01T13:50:00.000Z",
    "invoice": {
      "id": 9,
      "invoiceNumber": "INV-2025-009",
      "status": "partially_paid",
      "amountPaid": 300,
      "finalAmount": 600,
      "remainingAmount": 300
    }
  },
  "message": "تم تسجيل الدفعة بنجاح - المبلغ المتبقي: 300 جنيه"
}
```

**Status:** `201 Created`

---

### 3. Get Payment Statistics

```bash
curl -X GET "https://staging.api.fixzone.com/api/payments/stats?startDate=2025-09-01&endDate=2025-09-30" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalCollected": 45000,
    "currency": "EGP",
    "totalPayments": 120,
    "byMethod": {
      "cash": 30000,
      "card": 12000,
      "bank_transfer": 3000
    },
    "byDate": [
      { "date": "2025-09-01", "amount": 1500, "count": 4 },
      { "date": "2025-09-02", "amount": 2000, "count": 5 },
      // ... more dates
    ],
    "period": {
      "startDate": "2025-09-01",
      "endDate": "2025-09-30"
    }
  }
}
```

**Status:** `200 OK`

---

## Inventory

### 1. Get All Inventory Items

```bash
curl -X GET https://staging.api.fixzone.com/api/inventory \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "شاشة Samsung S21",
      "sku": "SCR-SAM-S21",
      "quantity": 95,
      "minQuantity": 10,
      "price": 500,
      "isLowStock": false,
      "lastRestocked": "2025-09-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "بطارية iPhone 12",
      "sku": "BAT-IPH-12",
      "quantity": 3,
      "minQuantity": 10,
      "price": 150,
      "isLowStock": true,
      "lastRestocked": "2025-08-20T10:00:00.000Z"
    },
    // ... more items
  ],
  "total": 50,
  "lowStockCount": 5
}
```

**Status:** `200 OK`

---

### 2. Adjust Inventory (Restock)

```bash
curl -X PUT https://staging.api.fixzone.com/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "itemId": 2,
    "quantity": 20,
    "reason": "restock",
    "notes": "توريد دفعة جديدة من البطاريات"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "بطارية iPhone 12",
    "sku": "BAT-IPH-12",
    "previousQuantity": 3,
    "newQuantity": 23,
    "adjustment": 20,
    "reason": "restock",
    "isLowStock": false,
    "updatedAt": "2025-10-01T14:00:00.000Z"
  },
  "message": "تم تحديث المخزون بنجاح"
}
```

**Status:** `200 OK`

---

## Reports

### 1. Get Daily Report

```bash
curl -X GET "https://staging.api.fixzone.com/api/reports/daily?date=2025-10-01" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-10-01",
    "ticketsCreated": 8,
    "ticketsCompleted": 5,
    "ticketsInProgress": 12,
    "revenue": 4500,
    "paymentsCollected": 3800,
    "currency": "EGP",
    "topTechnician": {
      "id": 2,
      "name": "محمد الفني",
      "ticketsCompleted": 3
    },
    "topIssue": "شاشة مكسورة"
  }
}
```

**Status:** `200 OK`

---

## RBAC Permission Tests

### 1. Technician Tries to Create Ticket (Forbidden)

```bash
# Login as technician
TECH_TOKEN=$(curl -X POST https://staging.api.fixzone.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"tech1@fixzone.com","password":"password"}' \
  | jq -r '.token')

# Try to create ticket
curl -X POST https://staging.api.fixzone.com/api/repairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TECH_TOKEN}" \
  -d '{
    "customerId": 1,
    "deviceBrand": "Samsung",
    "deviceModel": "S21",
    "reportedProblem": "Test"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Forbidden: You do not have permission to perform this action",
  "requiredRole": "reception or admin"
}
```

**Status:** `403 Forbidden`

---

### 2. Client Tries to Access Other Client's Ticket (Forbidden)

```bash
# Login as client
CLIENT_TOKEN=$(curl -X POST https://staging.api.fixzone.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"client@example.com","password":"password"}' \
  | jq -r '.token')

# Try to access ticket belonging to another customer
curl -X GET https://staging.api.fixzone.com/api/repairs/99 \
  -H "Authorization: Bearer ${CLIENT_TOKEN}"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Forbidden: You can only access your own tickets"
}
```

**Status:** `403 Forbidden`

---

### 3. Accountant Can Create Invoice (Allowed)

```bash
# Login as accountant
ACCOUNTANT_TOKEN=$(curl -X POST https://staging.api.fixzone.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"accountant@fixzone.com","password":"password"}' \
  | jq -r '.token')

# Create invoice
curl -X POST https://staging.api.fixzone.com/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCOUNTANT_TOKEN}" \
  -d '{
    "repairRequestId": 5,
    "totalAmount": 800
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "invoiceNumber": "INV-2025-010",
    "totalAmount": 800,
    "status": "draft",
    "createdAt": "2025-10-01T14:15:00.000Z"
  },
  "message": "تم إنشاء الفاتورة بنجاح"
}
```

**Status:** `201 Created`

---

### 4. Reception Tries to Create Invoice (Forbidden)

```bash
# Login as reception
RECEPTION_TOKEN=$(curl -X POST https://staging.api.fixzone.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"reception@fixzone.com","password":"password"}' \
  | jq -r '.token')

# Try to create invoice
curl -X POST https://staging.api.fixzone.com/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${RECEPTION_TOKEN}" \
  -d '{
    "repairRequestId": 5,
    "totalAmount": 800
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Forbidden: Only accountant or admin can create invoices",
  "requiredRole": "accountant or admin",
  "userRole": "reception"
}
```

**Status:** `403 Forbidden`

---

### 5. Admin Can Manage Users (Allowed)

```bash
# Login as admin
ADMIN_TOKEN=$(curl -X POST https://staging.api.fixzone.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"password"}' \
  | jq -r '.token')

# Get all users
curl -X GET https://staging.api.fixzone.com/api/users \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "admin@fixzone.com",
      "firstName": "أحمد",
      "lastName": "الإداري",
      "role": "admin",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    // ... more users
  ],
  "total": 8
}
```

**Status:** `200 OK`

---

### 6. Non-Admin Tries to Manage Users (Forbidden)

```bash
# Try to get users as technician
curl -X GET https://staging.api.fixzone.com/api/users \
  -H "Authorization: Bearer ${TECH_TOKEN}"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Forbidden: Only admin can manage users",
  "requiredRole": "admin",
  "userRole": "technician"
}
```

**Status:** `403 Forbidden`

---

## 🔒 Security Tests

### 1. SQL Injection Attempt

```bash
curl -X GET "https://staging.api.fixzone.com/api/customers?search='; DROP TABLE User; --" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [],
  "total": 0
}
```

**Status:** `200 OK` (No SQL injection occurred, User table intact)

---

### 2. XSS Attempt

```bash
curl -X POST https://staging.api.fixzone.com/api/repairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "customerId": 1,
    "deviceBrand": "Samsung",
    "deviceModel": "S21",
    "reportedProblem": "<script>alert('XSS')</script>"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Validation failed: reportedProblem contains invalid characters",
  "details": "HTML tags and scripts are not allowed"
}
```

**Status:** `400 Bad Request`

---

### 3. Rate Limiting Test

```bash
# Attempt 10 rapid requests
for i in {1..10}; do
  curl -X POST https://staging.api.fixzone.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"loginIdentifier":"admin@fixzone.com","password":"wrong"}' &
done
wait
```

**Expected Response (after 5th attempt):**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 300
}
```

**Status:** `429 Too Many Requests`

---

## 📝 Notes

1. **Base URL:** Replace `https://staging.api.fixzone.com` with actual staging/production URL
2. **Authentication:** All protected routes require valid JWT token in `Authorization: Bearer` header or `httpOnly` cookie
3. **CORS:** Ensure CORS is properly configured for frontend domain
4. **Rate Limiting:** Requests are limited to 100 per 15 minutes per IP/user
5. **Error Format:** All errors follow consistent JSON format with `success: false` and `error` message
6. **Success Format:** All successful responses include `success: true` and `data` object

---

**Version:** 1.0  
**Last Updated:** 2025-10-01  
**Environment:** Staging

