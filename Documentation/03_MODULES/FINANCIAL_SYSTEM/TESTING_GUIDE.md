# دليل الاختبار الشامل - نظام المالية
## Financial System - Comprehensive Testing Guide

**التاريخ:** 2025-01-28  
**الحالة:** جاهز للاختبار

---

## 📋 نظرة عامة على التغييرات

### 1. Database Changes (Migrations)

#### ✅ Migration 1: Invoice Table
**الأعمدة المضافة:**
- `discountAmount` - DECIMAL(12,2) - مبلغ الخصم
- `dueDate` - DATE - تاريخ الاستحقاق
- `companyId` - INT(11) - ربط بالشركة
- `branchId` - INT(11) - ربط بالفرع

**Indexes المضافة:**
- `idx_invoice_customer` - على customerId
- `idx_invoice_company` - على companyId
- `idx_invoice_branch` - على branchId
- `idx_invoice_dueDate` - على dueDate

#### ✅ Migration 2: Payment Table
**الأعمدة المضافة:**
- `paymentDate` - DATE - تاريخ الدفع

**Indexes المضافة:**
- `idx_payment_paymentDate` - على paymentDate
- `idx_payment_invoiceId` - على invoiceId

#### ✅ Migration 3: InvoiceItem Table
**الأعمدة المضافة:**
- `deletedAt` - DATETIME - للـ Soft Delete

**Indexes المضافة:**
- `idx_invoice_item_deletedAt` - على deletedAt
- `idx_invoice_item_invoiceId` - على invoiceId
- `idx_invoice_item_inventoryItemId` - على inventoryItemId

---

### 2. Backend Changes

#### ✅ New Architecture (Repository Pattern)
**الملفات الجديدة:**
- `repositories/financial/base.repository.js` - Base repository
- `repositories/financial/expenses.repository.js` - Expenses repository
- `repositories/financial/payments.repository.js` - Payments repository
- `repositories/financial/invoices.repository.js` - Invoices repository

**الميزات:**
- CRUD operations موحدة
- Soft delete support
- Pagination
- Filtering متقدم
- Backward compatibility

#### ✅ Service Layer
**الملفات الجديدة:**
- `services/financial/expenses.service.js`
- `services/financial/payments.service.js`
- `services/financial/invoices.service.js`
- `services/financial/customers.service.js`
- `services/financial/companies.service.js`
- `services/financial/branches.service.js`

**الميزات:**
- Business logic منفصلة
- Integration مع Modules أخرى
- WebSocket events
- Audit logging

#### ✅ Controller Layer
**الملفات الجديدة:**
- `controllers/financial/expenses.controller.js`
- `controllers/financial/payments.controller.js`
- `controllers/financial/invoices.controller.js`

**الميزات:**
- Request validation
- Error handling موحد
- Response format موحد

#### ✅ Routes & Middleware
**الملفات الجديدة:**
- `routes/financial/expenses.routes.js`
- `routes/financial/payments.routes.js`
- `routes/financial/invoices.routes.js`
- `middleware/financial/financialAuth.middleware.js`
- `middleware/financial/financialRateLimit.middleware.js`

**الميزات:**
- Authentication & Authorization
- Rate limiting (100 req/15min)
- CORS support

---

### 3. Frontend Changes

#### ✅ Services Layer
**الملفات الجديدة:**
- `services/financial/expensesService.js`
- `services/financial/paymentsService.js`
- `services/financial/invoicesService.js`

#### ✅ Custom Hooks
**الملفات الجديدة:**
- `hooks/financial/useExpenses.js`
- `hooks/financial/usePayments.js`
- `hooks/financial/useInvoices.js`

**الميزات:**
- State management
- Loading states
- Error handling
- Auto-refetch

#### ✅ Reusable Components
**الملفات الجديدة:**
- `components/financial/shared/FinancialSummaryCard.js`
- `components/financial/shared/FinancialFilters.js`
- `components/financial/expenses/ExpenseForm.js`
- `components/financial/payments/PaymentForm.js`
- `components/financial/invoices/InvoiceForm.js`
- `components/financial/invoices/InvoiceItemsForm.js`

#### ✅ Pages
**الملفات الجديدة:**
- `pages/financial/expenses/ExpensesListPage.js`
- `pages/financial/expenses/ExpenseCreatePage.js`
- `pages/financial/expenses/ExpenseEditPage.js`
- `pages/financial/expenses/ExpenseDetailsPage.js`
- `pages/financial/payments/PaymentsListPage.js`
- `pages/financial/payments/PaymentCreatePage.js`
- `pages/financial/invoices/InvoicesListPage.js`
- `pages/financial/invoices/InvoiceCreatePage.js`
- `pages/financial/invoices/InvoiceDetailsPage.js`

---

## 🧪 دليل الاختبار التفصيلي

### Phase 1: اختبار Database Migrations

#### 1.1 التحقق من الأعمدة

```sql
-- التحقق من Invoice table
DESCRIBE Invoice;
-- يجب أن ترى: discountAmount, dueDate, companyId, branchId

-- التحقق من Payment table
DESCRIBE Payment;
-- يجب أن ترى: paymentDate

-- التحقق من InvoiceItem table
DESCRIBE InvoiceItem;
-- يجب أن ترى: deletedAt
```

**الاختبار:**
```bash
# استخدام script الاختبار
node backend/scripts/test_migrations_safely.js

# يجب أن ترى:
# ✅ جميع الأعمدة موجودة
# ✅ جميع Indexes موجودة
```

#### 1.2 التحقق من البيانات

```sql
-- التحقق من عدد السجلات
SELECT COUNT(*) FROM Invoice;      -- يجب أن يكون 1406
SELECT COUNT(*) FROM Payment;       -- يجب أن يكون 1405
SELECT COUNT(*) FROM InvoiceItem;   -- يجب أن يكون 1857

-- التحقق من paymentDate في Payment
SELECT COUNT(*) FROM Payment WHERE paymentDate IS NOT NULL;
-- يجب أن يكون 1405 (جميع المدفوعات لها paymentDate)
```

---

### Phase 2: اختبار Backend APIs

#### 2.1 اختبار Expenses API

**Endpoint:** `GET /api/financial/expenses`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/financial/expenses \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "totalPages": 0
  }
}
```

**اختبارات إضافية:**
- [ ] Filtering by categoryId
- [ ] Filtering by branchId
- [ ] Filtering by date range
- [ ] Pagination
- [ ] Search (q parameter)

**Endpoint:** `POST /api/financial/expenses`

**الاختبار:**
```bash
curl -X POST http://localhost:4000/api/financial/expenses \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "amount": 100.50,
    "description": "نفقة اختبار",
    "date": "2025-01-28",
    "branchId": 1
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "categoryId": 1,
    "amount": 100.50,
    "description": "نفقة اختبار",
    "date": "2025-01-28",
    "branchId": 1,
    "createdAt": "..."
  }
}
```

**Endpoint:** `GET /api/financial/expenses/stats`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/financial/expenses/stats \
  -H "Cookie: token=YOUR_TOKEN"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "totalExpenses": 0,
    "totalAmount": 0,
    "averageAmount": 0,
    "byCategory": [],
    "byMonth": []
  }
}
```

---

#### 2.2 اختبار Payments API

**Endpoint:** `GET /api/financial/payments`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/financial/payments?page=1&limit=10 \
  -H "Cookie: token=YOUR_TOKEN"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1405,
    "totalPages": 141
  }
}
```

**اختبارات إضافية:**
- [ ] Filtering by invoiceId
- [ ] Filtering by companyId
- [ ] Filtering by branchId
- [ ] Sorting by paymentDate
- [ ] Pagination

**Endpoint:** `POST /api/financial/payments`

**الاختبار:**
```bash
curl -X POST http://localhost:4000/api/financial/payments \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 1,
    "amount": 500.00,
    "paymentMethod": "cash",
    "paymentDate": "2025-01-28"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceId": 1,
    "amount": 500.00,
    "paymentMethod": "cash",
    "paymentDate": "2025-01-28",
    "createdAt": "..."
  }
}
```

**التحقق من Integration:**
- [ ] Invoice status updated to 'paid' if fully paid
- [ ] Inventory items deducted (if applicable)
- [ ] Stock movement created
- [ ] WebSocket event sent

---

#### 2.3 اختبار Invoices API

**Endpoint:** `GET /api/financial/invoices`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/financial/invoices?page=1&limit=10 \
  -H "Cookie: token=YOUR_TOKEN"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1406,
    "totalPages": 141
  }
}
```

**اختبارات إضافية:**
- [ ] Filtering by customerId
- [ ] Filtering by companyId
- [ ] Filtering by branchId
- [ ] Filtering by status
- [ ] Filtering by repairRequestId
- [ ] Search functionality

**Endpoint:** `POST /api/financial/invoices`

**الاختبار:**
```bash
curl -X POST http://localhost:4000/api/financial/invoices \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "currency": "EGP",
    "discountAmount": 0,
    "dueDate": "2025-02-28",
    "notes": "فاتورة اختبار",
    "items": [
      {
        "description": "خدمة إصلاح",
        "quantity": 1,
        "unitPrice": 200.00
      }
    ]
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2025-001",
    "customerId": 1,
    "subtotal": 200.00,
    "taxAmount": 28.00,
    "discountAmount": 0,
    "totalAmount": 228.00,
    "status": "draft",
    "items": [...]
  }
}
```

**Endpoint:** `POST /api/financial/invoices/create-from-repair/:repairId`

**الاختبار:**
```bash
curl -X POST http://localhost:4000/api/financial/invoices/create-from-repair/1 \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "discountAmount": 0,
    "notes": "فاتورة من طلب إصلاح"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "repairRequestId": 1,
    "customerId": 1,
    "items": [
      {
        "description": "خدمة إصلاح",
        "quantity": 1,
        "unitPrice": 100.00
      },
      {
        "description": "قطعة غيار",
        "quantity": 1,
        "unitPrice": 50.00
      }
    ],
    "totalAmount": 171.00
  }
}
```

**التحقق من Integration:**
- [ ] Repair status updated to 'invoiced'
- [ ] Invoice items created from repair services/parts
- [ ] Labor cost included
- [ ] WebSocket event sent

**Endpoint:** `GET /api/financial/invoices/stats`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/financial/invoices/stats \
  -H "Cookie: token=YOUR_TOKEN"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "totalInvoices": 1406,
    "totalInvoiced": 500000.00,
    "totalPaid": 450000.00,
    "outstandingBalance": 50000.00,
    "overdueAmount": 10000.00,
    "byStatus": {...},
    "byMonth": [...]
  }
}
```

---

#### 2.4 اختبار Integration APIs

**Endpoint:** `GET /api/customers/:id/balance`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/customers/1/balance \
  -H "Cookie: token=YOUR_TOKEN"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "customerId": 1,
    "totalInvoiced": 10000.00,
    "totalPaid": 8000.00,
    "outstandingBalance": 2000.00
  }
}
```

**Endpoint:** `GET /api/companies/:id/financial-summary`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/companies/1/financial-summary \
  -H "Cookie: token=YOUR_TOKEN"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "companyId": 1,
    "totalInvoiced": 50000.00,
    "totalPaid": 45000.00,
    "outstandingBalance": 5000.00,
    "totalExpenses": 10000.00,
    "netProfit": 40000.00
  }
}
```

**Endpoint:** `GET /api/branches/:id/financial-summary`

**الاختبار:**
```bash
curl -X GET http://localhost:4000/api/branches/1/financial-summary \
  -H "Cookie: token=YOUR_TOKEN"
```

---

### Phase 3: اختبار Frontend

#### 3.1 اختبار Expenses Pages

**الصفحة:** `/financial/expenses`

**الاختبارات:**
1. **فتح الصفحة**
   - [ ] الصفحة تفتح بدون أخطاء
   - [ ] البيانات تظهر في الجدول
   - [ ] Loading state يعمل
   - [ ] Error handling يعمل

2. **الفلاتر**
   - [ ] Filter by category
   - [ ] Filter by branch
   - [ ] Filter by date range
   - [ ] Reset filters

3. **Pagination**
   - [ ] Next page
   - [ ] Previous page
   - [ ] Change items per page

4. **إنشاء نفقة جديدة**
   - [ ] Navigate to `/financial/expenses/create`
   - [ ] Fill form (category, amount, description, date)
   - [ ] Submit form
   - [ ] Success notification appears
   - [ ] Redirect to list page
   - [ ] New expense appears in list

5. **تعديل نفقة**
   - [ ] Click edit button
   - [ ] Form pre-filled with data
   - [ ] Update data
   - [ ] Submit
   - [ ] Changes reflected in list

6. **حذف نفقة**
   - [ ] Click delete button
   - [ ] Confirm dialog appears
   - [ ] Confirm deletion
   - [ ] Expense removed from list

---

#### 3.2 اختبار Payments Pages

**الصفحة:** `/financial/payments`

**الاختبارات:**
1. **فتح الصفحة**
   - [ ] الصفحة تفتح بدون أخطاء
   - [ ] البيانات تظهر في الجدول
   - [ ] PaymentDate column visible
   - [ ] Sorting by paymentDate works

2. **إنشاء دفعة جديدة**
   - [ ] Navigate to `/financial/payments/create`
   - [ ] Select invoice
   - [ ] Fill amount
   - [ ] Select payment method
   - [ ] Set payment date
   - [ ] Submit
   - [ ] Success notification
   - [ ] Invoice status updated (if fully paid)

3. **Integration Test**
   - [ ] Create payment for invoice
   - [ ] Check invoice status updated
   - [ ] Check inventory deducted (if applicable)
   - [ ] Check stock movement created

---

#### 3.3 اختبار Invoices Pages

**الصفحة:** `/financial/invoices`

**الاختبارات:**
1. **فتح الصفحة**
   - [ ] الصفحة تفتح بدون أخطاء
   - [ ] البيانات تظهر في الجدول
   - [ ] New columns visible (discountAmount, dueDate, companyId, branchId)
   - [ ] Filtering works

2. **إنشاء فاتورة جديدة**
   - [ ] Navigate to `/financial/invoices/create`
   - [ ] Select customer or repair
   - [ ] Add invoice items
   - [ ] Set discount amount
   - [ ] Set due date
   - [ ] Tax calculated automatically
   - [ ] Final total calculated correctly
   - [ ] Submit
   - [ ] Success notification
   - [ ] Invoice created with correct totals

3. **إنشاء فاتورة من طلب إصلاح**
   - [ ] Navigate to `/financial/invoices/create?repairId=1`
   - [ ] Repair data auto-loaded
   - [ ] Customer auto-selected
   - [ ] Items auto-generated from repair
   - [ ] Submit
   - [ ] Invoice created
   - [ ] Repair status updated to 'invoiced'

4. **إدارة عناصر الفاتورة**
   - [ ] Add item
   - [ ] Edit item
   - [ ] Remove item (soft delete)
   - [ ] Total recalculated

5. **تفاصيل الفاتورة**
   - [ ] Navigate to `/financial/invoices/:id`
   - [ ] All invoice data visible
   - [ ] Items list visible
   - [ ] Payments list visible
   - [ ] Totals correct

---

### Phase 4: اختبار Integration

#### 4.1 Repairs Integration

**الاختبار:**
1. **Create Invoice from Repair**
   ```bash
   # 1. Create a repair request
   # 2. Add services and parts
   # 3. Complete repair
   # 4. Create invoice from repair
   # 5. Verify:
   #    - Invoice created
   #    - Items generated from repair
   #    - Repair status = 'invoiced'
   #    - WebSocket event sent
   ```

2. **Payment Updates Repair Status**
   ```bash
   # 1. Create invoice from repair
   # 2. Create payment for full amount
   # 3. Verify:
   #    - Invoice status = 'paid'
   #    - Repair status = 'paid'
   #    - WebSocket event sent
   ```

---

#### 4.2 Inventory Integration

**الاختبار:**
1. **Stock Deduction on Payment**
   ```bash
   # 1. Create invoice with inventory items
   # 2. Create payment for full amount
   # 3. Verify:
   #    - Inventory items deducted
   #    - Stock movement created
   #    - Stock level updated
   ```

---

#### 4.3 Customers Integration

**الاختبار:**
1. **Customer Balance**
   ```bash
   # 1. Create invoices for customer
   # 2. Create payments
   # 3. Check balance:
   #    GET /api/customers/:id/balance
   # 4. Verify:
   #    - Total invoiced correct
   #    - Total paid correct
   #    - Outstanding balance correct
   ```

2. **Customer Invoices & Payments**
   ```bash
   # GET /api/customers/:id/invoices
   # GET /api/customers/:id/payments
   # Verify:
   #    - All customer invoices returned
   #    - All customer payments returned
   ```

---

#### 4.4 Companies & Branches Integration

**الاختبار:**
1. **Company Financial Summary**
   ```bash
   # GET /api/companies/:id/financial-summary
   # Verify:
   #    - Total invoiced
   #    - Total paid
   #    - Outstanding balance
   #    - Total expenses
   #    - Net profit
   ```

2. **Branch Financial Summary**
   ```bash
   # GET /api/branches/:id/financial-summary
   # Similar to company
   ```

3. **Filtering by Company/Branch**
   ```bash
   # GET /api/financial/invoices?companyId=1
   # GET /api/financial/invoices?branchId=1
   # Verify:
   #    - Only invoices for company/branch returned
   ```

---

### Phase 5: اختبار Security

#### 5.1 Authentication

**الاختبار:**
```bash
# Try to access without token
curl -X GET http://localhost:4000/api/financial/expenses

# Expected: 401 Unauthorized
```

#### 5.2 Authorization

**الاختبار:**
```bash
# Try with different roles
# - Admin: should have full access
# - Accountant: should have financial access
# - Technician: should be restricted
```

#### 5.3 Rate Limiting

**الاختبار:**
```bash
# Make 101 requests in 15 minutes
# Expected: 429 Too Many Requests after 100 requests
```

---

### Phase 6: اختبار Performance

#### 6.1 Response Time

**الاختبار:**
```bash
# Test response times
time curl -X GET http://localhost:4000/api/financial/invoices?page=1&limit=10

# Expected: < 200ms
```

#### 6.2 Database Queries

**الاختبار:**
```sql
-- Check slow queries
SHOW FULL PROCESSLIST;

-- Check indexes usage
EXPLAIN SELECT * FROM Invoice WHERE customerId = 1;
```

---

## 📝 Checklist للاختبار الكامل

### Database
- [ ] جميع Migrations تم تطبيقها
- [ ] جميع الأعمدة موجودة
- [ ] جميع Indexes موجودة
- [ ] البيانات سليمة
- [ ] Row counts صحيحة

### Backend APIs
- [ ] Expenses API - جميع Endpoints
- [ ] Payments API - جميع Endpoints
- [ ] Invoices API - جميع Endpoints
- [ ] Integration APIs - Customers, Companies, Branches
- [ ] Authentication & Authorization
- [ ] Rate Limiting
- [ ] Error Handling

### Frontend Pages
- [ ] Expenses Pages - List, Create, Edit, Details
- [ ] Payments Pages - List, Create
- [ ] Invoices Pages - List, Create, Details
- [ ] Forms validation
- [ ] Error messages
- [ ] Loading states
- [ ] Notifications

### Integration
- [ ] Repairs Integration
- [ ] Inventory Integration
- [ ] Customers Integration
- [ ] Companies Integration
- [ ] Branches Integration
- [ ] WebSocket Events

### Security
- [ ] Authentication required
- [ ] Authorization working
- [ ] Rate limiting active
- [ ] Input validation
- [ ] SQL injection prevention

### Performance
- [ ] Response times < 200ms
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Pagination working

---

## 🐛 Troubleshooting

### مشكلة: Migration failed
**الحل:**
```bash
# 1. Check database connection
node -e "const db = require('./backend/db'); db.query('SELECT 1').then(() => console.log('OK')).catch(e => console.error(e));"

# 2. Check if columns already exist
node backend/scripts/test_migrations_safely.js

# 3. Apply migrations manually
node backend/scripts/apply_migrations_final.js
```

### مشكلة: API returns 401
**الحل:**
- تأكد من وجود token في Cookie
- تأكد من أن token صالح
- تأكد من أن user له صلاحيات

### مشكلة: Frontend not loading data
**الحل:**
- Check browser console for errors
- Check network tab for API calls
- Verify API endpoints are correct
- Check CORS settings

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

Database Migrations:
- [ ] Migration 1: ✅ / ❌
- [ ] Migration 2: ✅ / ❌
- [ ] Migration 3: ✅ / ❌

Backend APIs:
- [ ] Expenses: ✅ / ❌
- [ ] Payments: ✅ / ❌
- [ ] Invoices: ✅ / ❌
- [ ] Integration: ✅ / ❌

Frontend:
- [ ] Expenses Pages: ✅ / ❌
- [ ] Payments Pages: ✅ / ❌
- [ ] Invoices Pages: ✅ / ❌

Integration:
- [ ] Repairs: ✅ / ❌
- [ ] Inventory: ✅ / ❌
- [ ] Customers: ✅ / ❌

Security:
- [ ] Authentication: ✅ / ❌
- [ ] Authorization: ✅ / ❌
- [ ] Rate Limiting: ✅ / ❌

Performance:
- [ ] Response Time: ✅ / ❌
- [ ] Database Queries: ✅ / ❌

Issues Found:
1. _______________
2. _______________

Notes:
_______________
```

---

## 🎯 الخطوات التالية بعد الاختبار

1. **إذا كانت جميع الاختبارات ناجحة:**
   - ✅ جاهز للـ Production Deployment
   - اتباع `DEPLOYMENT_CHECKLIST.md`

2. **إذا كانت هناك مشاكل:**
   - توثيق المشاكل
   - إصلاح المشاكل
   - إعادة الاختبار

---

**آخر تحديث:** 2025-01-28

