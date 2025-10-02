# 📋 خطة اختبار Module by Module

**التاريخ:** 2025-10-02  
**الحالة:** 🔄 قيد التنفيذ

---

## 🎯 الترتيب حسب الأولوية

### ✅ Module 1: Authentication (P0 - Critical)
**الحالة:** ✅ مُكتمل  
**النتيجة:** 100% نجاح

**الاختبارات:**
- [x] Login with valid credentials
- [x] Login with invalid credentials
- [x] Access protected route without token
- [x] Access protected route with valid token
- [x] Token expiration handling

---

### ✅ Module 2: Tickets/Repairs (P0 - Core Business)
**الحالة:** ✅ مُكتمل  
**النتيجة:** 100% نجاح (9/9)

**الاختبارات المطلوبة:**
- [x] GET /api/repairs - Get all tickets
- [x] GET /api/repairs/:id - Get single ticket
- [x] POST /api/repairs - Create ticket (existing customer)
- [x] POST /api/repairs - Create ticket (new customer inline)
- [x] PUT /api/repairs/:id - Update ticket status
- [x] POST /api/repairs - Validation (missing fields)
- [x] GET /api/repairs?search=... - Search tickets
- [x] GET /api/repairs?status=... - Filter by status
- [x] GET /api/repairs/99999 - Non-existent (404)

**Test Data:**
```json
{
  "validTicket": {
    "customerId": 1,
    "deviceBrand": "Samsung",
    "deviceModel": "S21",
    "reportedProblem": "الشاشة مكسورة",
    "priority": "high"
  },
  "ticketWithNewCustomer": {
    "customer": {
      "firstName": "محمد",
      "lastName": "علي",
      "phone": "01099887766"
    },
    "deviceBrand": "iPhone",
    "deviceModel": "13",
    "reportedProblem": "البطارية تنفذ بسرعة"
  }
}
```

---

### 🟡 Module 3: Payments & Invoices (P0 - Financial)
**الحالة:** 🟡 مُكتمل جزئياً
**النتيجة:** 81.8% نجاح (9/11)

**الاختبارات المطلوبة:**

#### A. Invoices
- [x] GET /api/invoices - Get all invoices ✅
- [ ] GET /api/invoices/:id - Get single invoice ❌ (Route 404)
- [x] POST /api/invoices - Create invoice ✅
- [x] POST /api/invoices - Validation (missing fields) ✅

#### B. Payments
- [x] GET /api/payments - Get all payments ✅
- [x] GET /api/payments?invoiceId=:id - Get payments for invoice ✅
- [x] POST /api/payments - Full payment ✅
- [x] POST /api/payments - Partial payment ✅
- [x] POST /api/payments - Validation (missing fields) ✅
- [ ] GET /api/payments/stats - Payment statistics ❌ (Route 404)
- [x] GET /api/payments/overdue/list - Overdue payments ✅

---

### 👥 Module 4: Customers (P1 - Important)
**الحالة:** ⏳ في الانتظار

**الاختبارات المطلوبة:**
- [ ] GET /api/customers - Get all customers
- [ ] GET /api/customers/:id - Get single customer
- [ ] POST /api/customers - Create customer (all fields)
- [ ] POST /api/customers - Create customer (minimal fields)
- [ ] PUT /api/customers/:id - Update customer
- [ ] POST /api/customers - Duplicate phone (validation)
- [ ] GET /api/customers?search=... - Search customers
- [ ] DELETE /api/customers/:id - Soft delete

---

### 📦 Module 5: Inventory (P1 - Important)
**الحالة:** ⏳ في الانتظار

**الاختبارات المطلوبة:**
- [ ] GET /api/inventory - Get all items
- [ ] GET /api/inventory/:id - Get single item
- [ ] POST /api/inventory - Create item
- [ ] PUT /api/inventory/adjust - Adjust quantity (restock)
- [ ] PUT /api/inventory/adjust - Adjust quantity (use)
- [ ] POST /api/repairs/:id/use-part - Use part in repair
- [ ] PUT /api/inventory/adjust - Insufficient stock (validation)
- [ ] GET /api/inventory?lowStock=true - Low stock items

---

### 📊 Module 6: Reports (P2 - Nice to have)
**الحالة:** ⏳ في الانتظار

**الاختبارات المطلوبة:**
- [ ] GET /api/reports/daily?date=... - Daily report
- [ ] GET /api/reports/monthly?year=...&month=... - Monthly report
- [ ] GET /api/reports/daily/export - Export to Excel
- [ ] GET /api/reports/technicians - Technician performance
- [ ] GET /api/reports/* as non-admin (RBAC test)

---

### 👤 Module 7: Users (P2 - Admin only)
**الحالة:** ⏳ في الانتظار

**الاختبارات المطلوبة:**
- [ ] GET /api/users - Get all users (admin only)
- [ ] GET /api/users as non-admin - Should be 403
- [ ] POST /api/users - Create user
- [ ] PUT /api/users/:id - Update user
- [ ] DELETE /api/users/:id - Soft delete
- [ ] PUT /api/users/me/password - Change own password

---

## 🔒 RBAC Tests (Cross-Module)

### Priority: P0

- [ ] **Technician → Create Ticket:** Should be 403
- [ ] **Reception → Create Ticket:** Should be 201
- [ ] **Client → View own tickets:** Should be 200
- [ ] **Client → View other's tickets:** Should be 403
- [ ] **Accountant → Create Invoice:** Should be 201
- [ ] **Reception → Create Invoice:** Should be 403
- [ ] **Technician → Adjust Inventory:** Should be 403
- [ ] **Admin → Adjust Inventory:** Should be 200
- [ ] **Non-admin → Get Users:** Should be 403
- [ ] **Admin → Get Users:** Should be 200

---

## 🛡️ Security Tests (Cross-Module)

### Priority: P0

- [ ] **SQL Injection in search:** `?search='; DROP TABLE User; --`
- [ ] **SQL Injection in login:** `email: "admin' OR '1'='1"`
- [ ] **XSS in text fields:** `<script>alert('xss')</script>`
- [ ] **File upload > 10MB:** Should be 413
- [ ] **File upload .exe:** Should be 400
- [ ] **Path traversal:** `../../../etc/passwd`
- [ ] **Rate limiting - login:** 10 attempts → 429
- [ ] **Rate limiting - API:** 150 requests → 429

---

## ⚡ Performance Tests

### Priority: P1

- [ ] **Load test - Create Ticket:** 50 concurrent users, p95 < 500ms
- [ ] **Load test - Dashboard:** 100 concurrent users, p95 < 1000ms
- [ ] **Database queries:** Check for missing indexes
- [ ] **Large dataset pagination:** 10,000+ tickets, response < 500ms

---

## 📝 Test Execution Log

### Session 1: 2025-10-02

**Time:** 01:00 - ...

| Module | Test | Status | Time | Notes |
|--------|------|--------|------|-------|
| Auth | Login success | ✅ Pass | 0.2s | OK |
| Auth | Login failure | ✅ Pass | 0.2s | OK |
| Auth | Protected route | ✅ Pass | 0.1s | OK |
| Tickets | Get all | 🔄 Running | - | - |

---

## 🐛 Bugs Found

### Bug #1
- **Module:** -
- **Status:** -
- **Priority:** -
- **Description:** -

---

## 📊 Summary Statistics

**Total Modules:** 7  
**Completed:** 2 (29%)  
**Partially Done:** 1 (14%)  
**Pending:** 4 (57%)  

**Total Test Cases:** ~103  
**Passed:** 29  
**Failed:** 2  
**Not Run:** 72  

**Success Rate:** 93.5% (of executed tests)

---

**Last Updated:** 2025-10-02 01:57

