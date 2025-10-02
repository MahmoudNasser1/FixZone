# 🧪 منهجية الاختبار الكاملة - FixZone ERP System

**تاريخ الإعداد:** 2025-10-01  
**الإصدار:** 1.0  
**الحالة:** 📋 جاهز للتنفيذ

---

## 📑 جدول المحتويات

1. [تجهيز البيئة](#1-تجهيز-البيئة)
2. [أنواع الاختبارات وترتيب التنفيذ](#2-أنواع-الاختبارات-وترتيب-التنفيذ)
3. [إعداد بيانات الاختبار](#3-إعداد-بيانات-الاختبار)
4. [تشغيل أولي (Sanity)](#4-تشغيل-أولي-sanity)
5. [الاختبارات المنهجية لكل موديول](#5-الاختبارات-المنهجية-لكل-موديول)
6. [تسجيل الأخطاء والترياج](#6-تسجيل-الأخطاء-والترياج)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Post-Deploy Checks](#8-post-deploy-checks)

---

## 1. تجهيز البيئة

### 1.1 بيئة Staging

```bash
# Environment Setup
NODE_ENV=staging
DATABASE_URL=mysql://root@localhost:3306/fixzone_staging
PORT=3001
JWT_SECRET=staging_secret_key_2025

# External Integrations (Mocked/Sandbox)
WHATSAPP_MODE=mock
SMTP_MODE=sandbox
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525

# File Storage
UPLOAD_DIR=./uploads_staging
MAX_FILE_SIZE=10485760

# Frontend
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=staging
```

### 1.2 Database Setup

```bash
# Create staging database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS fixzone_staging;"
mysql -u root -e "GRANT ALL PRIVILEGES ON fixzone_staging.* TO 'root'@'localhost';"

# Run migrations
cd /opt/lampp/htdocs/FixZone/migrations
mysql -u root fixzone_staging < fixzone_erp_full_schema.sql

# Run seed script
node scripts/seed-staging-data.js
```

### 1.3 قائمة التحقق من البيئة

- [ ] Database connection عاملة
- [ ] Environment variables محملة
- [ ] Mock services جاهزة (WhatsApp, Email)
- [ ] File upload directory موجود
- [ ] Frontend متصل بـ Backend
- [ ] JWT authentication يعمل
- [ ] CORS settings صحيحة

---

## 2. أنواع الاختبارات وترتيب التنفيذ

### 2.1 Unit Tests (المرحلة الأولى)

**الهدف:** اختبار الدوال والخدمات المنفصلة

**الأدوات:** Jest

**الملفات المستهدفة:**
```
- backend/services/
- backend/utils/
- backend/middleware/
- frontend/src/utils/
- frontend/src/services/
```

**مثال:**
```javascript
// tests/unit/services/invoice.test.js
describe('Invoice Service', () => {
  test('calculateTotal should return correct amount', () => {
    const items = [
      { quantity: 2, price: 100 },
      { quantity: 1, price: 50 }
    ];
    expect(calculateTotal(items)).toBe(250);
  });
  
  test('generateInvoiceNumber should create unique number', () => {
    const number1 = generateInvoiceNumber();
    const number2 = generateInvoiceNumber();
    expect(number1).not.toBe(number2);
  });
});
```

**تشغيل:**
```bash
npm run test:unit
# أو
jest --testPathPattern=unit
```

---

### 2.2 Integration Tests (المرحلة الثانية)

**الهدف:** اختبار DB + Prisma + Endpoints

**الأدوات:** Jest + Supertest

**السيناريوهات:**
- CRUD operations لكل موديول
- Authentication & Authorization
- Data relationships (Foreign Keys)
- Transactions & Rollbacks

**مثال:**
```javascript
// tests/integration/api/repairs.test.js
const request = require('supertest');
const app = require('../../../backend/app');

describe('Repair Requests API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ loginIdentifier: 'admin@fixzone.com', password: 'password' });
    authToken = response.body.token;
  });
  
  test('POST /api/repairs should create new repair request', async () => {
    const response = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: 1,
        deviceId: 1,
        reportedProblem: 'Screen broken',
        priority: 'high'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
  
  test('GET /api/repairs/:id should return repair details', async () => {
    const response = await request(app)
      .get('/api/repairs/1')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reportedProblem');
  });
  
  test('PUT /api/repairs/:id should update status', async () => {
    const response = await request(app)
      .put('/api/repairs/1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in_progress' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('in_progress');
  });
});
```

**تشغيل:**
```bash
npm run test:integration
# أو
jest --testPathPattern=integration
```

---

### 2.3 API Contract Tests (المرحلة الثالثة)

**الهدوات:** Postman + Newman

**الإعداد:**
```bash
# Install Newman
npm install -g newman

# Export Postman collection
# testing/postman/FixZone-API.postman_collection.json

# Run tests
newman run testing/postman/FixZone-API.postman_collection.json \
  --environment testing/postman/staging.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export testing/results/newman-report.json
```

**التغطية:**
- Request/Response schema validation
- Status codes verification
- Headers validation
- Authentication flows
- Error responses

---

### 2.4 E2E Tests (المرحلة الرابعة)

**الهدف:** اختبار User Journeys الكاملة

**الأدوات:** Playwright

**السيناريوهات الرئيسية:**

#### 🎫 Journey 1: إنشاء تذكرة إصلاح كاملة
```javascript
// tests/e2e/create-repair-ticket.spec.js
const { test, expect } = require('@playwright/test');

test('Complete repair ticket creation flow', async ({ page }) => {
  // 1. Login as Reception
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'reception@fixzone.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // 2. Navigate to new ticket
  await page.click('text=طلب إصلاح جديد');
  
  // 3. Fill customer info
  await page.fill('[name="customerName"]', 'أحمد محمد');
  await page.fill('[name="customerPhone"]', '01012345678');
  
  // 4. Fill device info
  await page.fill('[name="deviceBrand"]', 'Samsung');
  await page.fill('[name="deviceModel"]', 'Galaxy S21');
  await page.fill('[name="reportedProblem"]', 'الشاشة مكسورة');
  
  // 5. Submit
  await page.click('button:has-text("حفظ")');
  
  // 6. Verify success
  await expect(page.locator('text=تم إنشاء التذكرة بنجاح')).toBeVisible();
  
  // 7. Verify receipt print
  const [receiptPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('button:has-text("طباعة الإيصال")')
  ]);
  await expect(receiptPage.locator('text=إيصال استلام')).toBeVisible();
});
```

#### 👤 Journey 2: تحديث حالة الإصلاح
```javascript
test('Update repair status flow', async ({ page }) => {
  // Login as Technician
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'tech1@fixzone.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Open repair ticket
  await page.click('text=التذاكر المفتوحة');
  await page.click('tr:first-child >> text=عرض');
  
  // Update status
  await page.selectOption('[name="status"]', 'in_progress');
  await page.fill('[name="notes"]', 'بدء الفحص الأولي');
  await page.click('button:has-text("حفظ التحديث")');
  
  // Verify notification sent
  await expect(page.locator('text=تم إرسال إشعار للعميل')).toBeVisible();
});
```

#### 💰 Journey 3: إنشاء فاتورة ودفع
```javascript
test('Invoice creation and payment flow', async ({ page }) => {
  // Login as Accountant
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'accountant@fixzone.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Create invoice
  await page.click('text=فاتورة جديدة');
  await page.selectOption('[name="repairRequestId"]', '1');
  await page.fill('[name="totalAmount"]', '500');
  await page.click('button:has-text("إنشاء الفاتورة")');
  
  // Add payment
  await page.click('button:has-text("إضافة دفعة")');
  await page.fill('[name="amount"]', '500');
  await page.selectOption('[name="paymentMethod"]', 'cash');
  await page.click('button:has-text("تسجيل الدفع")');
  
  // Verify invoice status
  await expect(page.locator('text=مدفوعة')).toBeVisible();
});
```

**تشغيل:**
```bash
npx playwright test
# أو مع UI
npx playwright test --ui
```

---

### 2.5 Manual Exploratory Testing

**السيناريوهات:**
- [ ] طباعة الإيصالات بجودة عالية
- [ ] مسح الباركود للتذاكر
- [ ] رفع الملفات (صور - مستندات)
- [ ] تصدير التقارير بصيغ مختلفة
- [ ] Responsive design على أجهزة مختلفة
- [ ] RTL support للعربية
- [ ] Dark mode (إذا وُجد)

---

### 2.6 Security Scans

#### A. Dependencies Scan (Snyk)
```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test dependencies
snyk test

# Fix vulnerabilities
snyk fix

# Monitor
snyk monitor
```

#### B. Application Scan (OWASP ZAP)
```bash
# Run ZAP Docker container
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html

# Review report
open zap-report.html
```

#### C. Manual Security Checks
- [ ] SQL Injection في كل input
- [ ] XSS في text fields
- [ ] CSRF tokens
- [ ] Authentication bypass attempts
- [ ] Authorization matrix (RBAC)
- [ ] File upload vulnerabilities
- [ ] API rate limiting
- [ ] Sensitive data exposure

---

### 2.7 Performance Tests

**الأدوات:** k6

**السيناريوهات:**

#### Load Test: Create Ticket
```javascript
// tests/performance/create-ticket.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function() {
  const url = 'http://localhost:3001/api/repairs';
  const payload = JSON.stringify({
    customerId: 1,
    deviceId: 1,
    reportedProblem: 'Test problem',
    priority: 'medium'
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
  };
  
  const res = http.post(url, payload, params);
  
  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**تشغيل:**
```bash
k6 run tests/performance/create-ticket.k6.js

# With output
k6 run --out json=results/k6-results.json tests/performance/create-ticket.k6.js
```

#### Endpoints للاختبار:
- `POST /api/repairs` (create ticket)
- `PUT /api/repairs/:id/status` (update status)
- `GET /api/dashboard/stats` (dashboard)
- `POST /api/invoices` (create invoice)
- `GET /api/reports/daily` (reports)

---

### 2.8 Regression Tests

**متى:** عند كل merge على main

**الإجراء:**
```bash
# Run all tests
npm run test:all

# Or CI pipeline
npm run test:unit && \
npm run test:integration && \
npm run test:e2e
```

---

## 3. إعداد بيانات الاختبار

### 3.1 Users & Roles

```sql
-- Admin
INSERT INTO User (email, password, firstName, lastName, role, isActive)
VALUES ('admin@fixzone.com', '$2b$10$hashedPassword', 'أحمد', 'الإداري', 'admin', 1);

-- Technician
INSERT INTO User (email, password, firstName, lastName, role, isActive)
VALUES ('tech1@fixzone.com', '$2b$10$hashedPassword', 'محمد', 'الفني', 'technician', 1);

-- Reception
INSERT INTO User (email, password, firstName, lastName, role, isActive)
VALUES ('reception@fixzone.com', '$2b$10$hashedPassword', 'فاطمة', 'الاستقبال', 'reception', 1);

-- Accountant
INSERT INTO User (email, password, firstName, lastName, role, isActive)
VALUES ('accountant@fixzone.com', '$2b$10$hashedPassword', 'خالد', 'المحاسب', 'accountant', 1);

-- Client
INSERT INTO Customer (firstName, lastName, phone, email, isActive)
VALUES ('عمر', 'العميل', '01012345678', 'client@example.com', 1);
```

### 3.2 Permission Matrix

| Role | Create Ticket | Update Status | Create Invoice | View Reports | Manage Users |
|------|--------------|---------------|----------------|--------------|--------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Technician | ❌ | ✅ | ❌ | ✅ | ❌ |
| Reception | ✅ | ✅ | ❌ | ✅ | ❌ |
| Accountant | ❌ | ❌ | ✅ | ✅ | ❌ |
| Client | ❌ | ❌ | ❌ | ❌ (own only) | ❌ |

### 3.3 Inventory Items

```sql
-- High stock
INSERT INTO InventoryItem (name, sku, quantity, minQuantity, price)
VALUES ('شاشة Samsung S21', 'SCR-SAM-S21', 100, 10, 500.00);

-- Low stock (alert)
INSERT INTO InventoryItem (name, sku, quantity, minQuantity, price)
VALUES ('بطارية iPhone 12', 'BAT-IPH-12', 5, 10, 150.00);

-- Out of stock
INSERT INTO InventoryItem (name, sku, quantity, minQuantity, price)
VALUES ('كاميرا Xiaomi Note 10', 'CAM-XIA-N10', 0, 5, 80.00);
```

### 3.4 Repair Requests (30 تذكرة)

```javascript
// scripts/seed-repair-requests.js
const statuses = [
  'received',           // 5 تذاكر
  'inspecting',         // 4 تذاكر
  'awaiting_parts',     // 3 تذاكر
  'in_repair',          // 6 تذاكر
  'ready',              // 4 تذاكر
  'delivered',          // 6 تذاكر
  'rejected'            // 2 تذاكر
];

const priorities = ['low', 'medium', 'high', 'urgent'];
const brands = ['Samsung', 'iPhone', 'Xiaomi', 'Huawei', 'Oppo'];

// Generate 30 tickets with varied data
```

### 3.5 Vendors

```sql
INSERT INTO Vendor (name, phone, email, address, isActive)
VALUES 
  ('شركة قطع الغيار المتحدة', '01012345678', 'vendor1@example.com', 'القاهرة', 1),
  ('موزع قطع أبل الرسمي', '01098765432', 'vendor2@example.com', 'الإسكندرية', 1),
  ('شركة الإلكترونيات الحديثة', '01055555555', 'vendor3@example.com', 'الجيزة', 1),
  ('مركز قطع سامسونج', '01044444444', 'vendor4@example.com', 'طنطا', 1),
  ('موزع شاومي الرسمي', '01033333333', 'vendor5@example.com', 'المنصورة', 1);
```

### 3.6 Financial Transactions

```javascript
// Generate invoices with different statuses
const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

// Generate payments with different methods
const paymentMethods = ['cash', 'card', 'bank_transfer'];

// Mix of full payments and partial payments
```

---

## 4. تشغيل أولي (Sanity)

### 4.1 Checklist

#### Authentication
- [ ] Login بكل دور (Admin, Tech, Reception, Accountant)
- [ ] Logout يعمل بشكل صحيح
- [ ] Session persistence (remember me)
- [ ] Password reset flow
- [ ] Invalid credentials handling

#### Core Flow: تذكرة كاملة
- [ ] **استلام:** إنشاء تذكرة جديدة + عميل جديد
- [ ] **فحص:** تحديث الحالة إلى "قيد الفحص"
- [ ] **تقدير:** إضافة تقدير التكلفة
- [ ] **موافقة:** موافقة العميل (محاكاة)
- [ ] **إصلاح:** بدء الإصلاح + تحديث الملاحظات
- [ ] **جاهز:** تحديث الحالة إلى "جاهز للتسليم"
- [ ] **فاتورة:** إنشاء فاتورة
- [ ] **دفع:** تسجيل الدفع
- [ ] **تسليم:** تسليم الجهاز للعميل

#### Notifications
- [ ] إرسال WhatsApp عند إنشاء تذكرة ✅
- [ ] إرسال Email عند تغيير الحالة ✅
- [ ] إرسال SMS عند جاهزية الجهاز ✅
- [ ] إشعارات داخل التطبيق ✅

#### Reports & Documents
- [ ] طباعة إيصال استلام PDF ✅
- [ ] طباعة فاتورة PDF ✅
- [ ] تصدير تقرير اليوم Excel ✅
- [ ] تصدير تقرير شهري Excel ✅
- [ ] طباعة ملصق باركود ✅

---

## 5. الاختبارات المنهجية لكل موديول

### 5.1 موديول: Authentication & Authorization

#### Positive Cases
```javascript
test('Login with valid credentials', async () => {
  const response = await login('admin@fixzone.com', 'password');
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('token');
});

test('Access protected route with valid token', async () => {
  const response = await getProtectedResource(validToken);
  expect(response.status).toBe(200);
});
```

#### Negative Cases
```javascript
test('Login with invalid credentials', async () => {
  const response = await login('admin@fixzone.com', 'wrong_password');
  expect(response.status).toBe(401);
  expect(response.body.error).toContain('Invalid credentials');
});

test('Access protected route without token', async () => {
  const response = await getProtectedResource(null);
  expect(response.status).toBe(401);
});

test('Access protected route with expired token', async () => {
  const response = await getProtectedResource(expiredToken);
  expect(response.status).toBe(401);
});
```

#### Edge Cases
```javascript
test('Login with SQL injection attempt', async () => {
  const response = await login("admin' OR '1'='1", "password");
  expect(response.status).toBe(401);
});

test('Login with XSS attempt', async () => {
  const response = await login('<script>alert("xss")</script>', 'password');
  expect(response.status).toBe(400);
});
```

#### Permission Tests
```javascript
test('Technician cannot access admin routes', async () => {
  const techToken = await loginAs('tech1@fixzone.com');
  const response = await deleteUser(1, techToken);
  expect(response.status).toBe(403);
});

test('Reception can create tickets', async () => {
  const receptionToken = await loginAs('reception@fixzone.com');
  const response = await createTicket(ticketData, receptionToken);
  expect(response.status).toBe(201);
});
```

---

### 5.2 موديول: Customers

#### Test Matrix

| Test Case | Method | Endpoint | Expected | Priority |
|-----------|--------|----------|----------|----------|
| Create customer with all fields | POST | /api/customers | 201 | P0 |
| Create customer with minimal fields | POST | /api/customers | 201 | P0 |
| Create customer with duplicate phone | POST | /api/customers | 400 | P1 |
| Get all customers | GET | /api/customers | 200 | P0 |
| Get customer by ID | GET | /api/customers/:id | 200 | P0 |
| Get non-existent customer | GET | /api/customers/9999 | 404 | P1 |
| Update customer info | PUT | /api/customers/:id | 200 | P0 |
| Delete customer (soft) | DELETE | /api/customers/:id | 200 | P1 |
| Search customers by name | GET | /api/customers?search= | 200 | P1 |
| Filter customers by status | GET | /api/customers?status= | 200 | P2 |

#### Data Integrity Tests
```javascript
test('Customer deletion should not delete related tickets', async () => {
  await deleteCustomer(customerId);
  const tickets = await getTicketsByCustomer(customerId);
  expect(tickets.length).toBeGreaterThan(0);
  expect(tickets[0].customer.deletedAt).not.toBeNull();
});
```

---

### 5.3 موديول: Repair Requests

#### Positive Cases
```javascript
describe('Repair Requests - Positive', () => {
  test('Create repair with existing customer', async () => {
    const response = await createRepair({
      customerId: 1,
      deviceBrand: 'Samsung',
      deviceModel: 'S21',
      reportedProblem: 'Screen broken'
    });
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('ticketNumber');
  });
  
  test('Create repair with new customer inline', async () => {
    const response = await createRepair({
      customer: {
        firstName: 'أحمد',
        lastName: 'محمد',
        phone: '01099887766'
      },
      deviceBrand: 'iPhone',
      deviceModel: '13',
      reportedProblem: 'Battery issue'
    });
    expect(response.status).toBe(201);
    expect(response.body.data.customer).toHaveProperty('id');
  });
  
  test('Update repair status', async () => {
    const response = await updateRepairStatus(1, {
      status: 'in_progress',
      notes: 'بدء الفحص'
    });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('in_progress');
  });
});
```

#### Negative Cases
```javascript
describe('Repair Requests - Negative', () => {
  test('Create repair without required fields', async () => {
    const response = await createRepair({});
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('required');
  });
  
  test('Update to invalid status', async () => {
    const response = await updateRepairStatus(1, {
      status: 'invalid_status'
    });
    expect(response.status).toBe(400);
  });
  
  test('Access repair by non-owner', async () => {
    const clientToken = await loginAsClient('client2@example.com');
    const response = await getRepair(1, clientToken);
    expect(response.status).toBe(403);
  });
});
```

#### Edge Cases
```javascript
test('Status transition validation', async () => {
  // Cannot go from 'delivered' back to 'received'
  await updateRepairStatus(1, { status: 'delivered' });
  const response = await updateRepairStatus(1, { status: 'received' });
  expect(response.status).toBe(400);
  expect(response.body.error).toContain('Invalid status transition');
});

test('Concurrent status updates', async () => {
  const [res1, res2] = await Promise.all([
    updateRepairStatus(1, { status: 'in_progress' }),
    updateRepairStatus(1, { status: 'ready' })
  ]);
  // Only one should succeed
  const succeeded = [res1, res2].filter(r => r.status === 200);
  expect(succeeded.length).toBe(1);
});
```

---

### 5.4 موديول: Invoices & Payments

#### Test Matrix

| Test Case | Expected Result | Priority |
|-----------|----------------|----------|
| Create invoice for completed repair | 201 Created | P0 |
| Create invoice for in-progress repair | 400 Bad Request | P1 |
| Add full payment | Invoice status = 'paid' | P0 |
| Add partial payment | Invoice status = 'partially_paid' | P0 |
| Add payment > remaining amount | 400 Bad Request | P0 |
| Generate PDF invoice | PDF file downloaded | P0 |
| Email invoice to customer | Email sent successfully | P1 |
| Apply discount | Total recalculated | P1 |
| Add tax | Total recalculated | P1 |
| Cancel invoice | Status = 'cancelled', payments refunded | P2 |

#### Data Integrity
```javascript
test('Payment amount should not exceed invoice total', async () => {
  const invoice = await createInvoice({ totalAmount: 500 });
  const payment1 = await addPayment(invoice.id, { amount: 300 });
  const payment2 = await addPayment(invoice.id, { amount: 300 });
  
  expect(payment1.status).toBe(200);
  expect(payment2.status).toBe(400);
});

test('Invoice deletion should soft-delete payments', async () => {
  const invoice = await createInvoice({ totalAmount: 500 });
  await addPayment(invoice.id, { amount: 500 });
  await deleteInvoice(invoice.id);
  
  const payments = await getPaymentsByInvoice(invoice.id);
  expect(payments.every(p => p.deletedAt !== null)).toBe(true);
});
```

---

### 5.5 موديول: Inventory

#### Test Cases
```javascript
describe('Inventory Management', () => {
  test('Low stock alert triggered', async () => {
    const item = await createInventoryItem({
      name: 'Screen',
      quantity: 5,
      minQuantity: 10
    });
    expect(item.isLowStock).toBe(true);
  });
  
  test('Stock deduction on repair part use', async () => {
    const initialQty = 100;
    await createInventoryItem({ id: 1, quantity: initialQty });
    await usePartInRepair(repairId, { itemId: 1, quantity: 2 });
    const item = await getInventoryItem(1);
    expect(item.quantity).toBe(initialQty - 2);
  });
  
  test('Cannot use more parts than available', async () => {
    await createInventoryItem({ id: 1, quantity: 5 });
    const response = await usePartInRepair(repairId, { itemId: 1, quantity: 10 });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Insufficient stock');
  });
});
```

---

## 6. تسجيل الأخطاء والترياج

### 6.1 Bug Report Template

```markdown
## 🐛 Bug Report

**Title:** [مختصر وواضح]

**ID:** BUG-XXX

**Module:** [Authentication / Customers / Repairs / Invoices / etc.]

**Priority:** [P0 / P1 / P2 / P3]

**Severity:** [Critical / High / Medium / Low]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Backend: Node.js 18.x
- Database: MySQL 8.0
- Build: staging-v1.2.3

**Steps to Reproduce:**
1. افتح الصفحة X
2. انقر على الزر Y
3. أدخل البيانات Z
4. انقر على حفظ

**Actual Result:**
يظهر خطأ "Error 500" ولا يتم حفظ البيانات

**Expected Result:**
يجب حفظ البيانات بنجاح وإظهار رسالة تأكيد

**Request Sample:**
\`\`\`json
POST /api/repairs
{
  "customerId": 1,
  "deviceBrand": "Samsung"
}
\`\`\`

**Response Sample:**
\`\`\`json
{
  "error": "Internal Server Error",
  "details": "Cannot read property 'id' of undefined"
}
\`\`\`

**Logs:**
\`\`\`
Error in createRepair: TypeError: Cannot read property 'id' of undefined
    at createRepair (/backend/controllers/repairs.js:45:23)
\`\`\`

**Screenshot:**
[Attach screenshot]

**Suggested Fix:**
إضافة validation للـ customerId قبل استخدامه

**Labels:**
#backend #validation #critical

**Root Cause Hypothesis:**
عدم وجود validation على الـ input قبل استخدامه في query

**Reproduction Steps (Reliable):**
- يحدث 100% عند عدم إرسال customerId

**Temporary Workaround:**
التأكد من إدخال customerId قبل الإرسال

**Code Area:**
- File: backend/controllers/repairs.js
- Function: createRepair()
- Lines: 40-50

**Tests to Add:**
- Unit test: createRepair with missing customerId should return 400
- Integration test: POST /api/repairs without customerId
\`\`\`

---

### 6.2 أولويات الإصلاح

| Priority | الوصف | SLA | أمثلة |
|----------|-------|-----|-------|
| **P0** | Critical - وقف العمل | 2 ساعة | - لا يمكن تسجيل الدخول<br>- النظام down<br>- فقدان البيانات |
| **P1** | High - وظيفة أساسية معطلة | 1 يوم | - لا يمكن إنشاء تذاكر<br>- لا يمكن طباعة الإيصالات<br>- خطأ في حساب المبالغ |
| **P2** | Medium - مؤثر لكن قابل للتجاوز | 1 أسبوع | - بطء في التحميل<br>- UI غير متسق<br>- خطأ في التنسيق |
| **P3** | Low - تحسين/UX | 1 شهر | - تحسينات UI<br>- رسائل خطأ أوضح<br>- shortcuts |

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: fixzone_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend/react-app && npm ci
      
      - name: Run linter
        run: |
          cd backend && npm run lint
          cd ../frontend/react-app && npm run lint
      
      - name: Run unit tests
        run: cd backend && npm run test:unit
      
      - name: Setup test database
        run: |
          mysql -h127.0.0.1 -uroot -proot fixzone_test < migrations/fixzone_erp_full_schema.sql
      
      - name: Run integration tests
        env:
          DATABASE_URL: mysql://root:root@127.0.0.1:3306/fixzone_test
          NODE_ENV: test
        run: cd backend && npm run test:integration
      
      - name: Build frontend
        run: cd frontend/react-app && npm run build
      
      - name: Run E2E tests (optional)
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          cd backend && npm start &
          cd frontend/react-app && npm start &
          npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            backend/test-results/
            playwright-report/
      
      - name: Build Docker image
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: docker build -t fixzone-erp:${{ github.sha }} .
      
      - name: Push Docker image
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push fixzone-erp:${{ github.sha }}
      
      - name: Deploy to staging
        if: github.ref == 'refs/heads/develop'
        run: |
          # Deploy to staging server
          ssh ${{ secrets.STAGING_SERVER }} "cd /app && docker-compose pull && docker-compose up -d"
      
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          # Deploy to production server (with approval)
          echo "Deployment to production requires manual approval"
```

---

## 8. Post-Deploy Checks

### 8.1 Smoke Tests

```javascript
// tests/smoke/post-deploy.test.js
describe('Post-Deploy Smoke Tests', () => {
  test('Health check endpoint responds', async () => {
    const response = await fetch('https://app.fixzone.com/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'OK' });
  });
  
  test('Database connection works', async () => {
    const response = await fetch('https://app.fixzone.com/api/health/db');
    expect(response.status).toBe(200);
  });
  
  test('Login flow works', async () => {
    const response = await login('admin@fixzone.com', 'password');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
  
  test('Create ticket works', async () => {
    const token = await getValidToken();
    const response = await createTicket(sampleTicket, token);
    expect(response.status).toBe(201);
  });
});
```

**تشغيل بعد كل deploy:**
```bash
npm run test:smoke
```

---

### 8.2 Monitoring Setup

#### A. Error Tracking (Sentry)

```javascript
// backend/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

#### B. Logging (Winston)

```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

#### C. Metrics (Prometheus)

```javascript
// backend/middleware/metrics.js
const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

module.exports = { register, httpRequestDuration };
```

---

### 8.3 Alerts Configuration

```yaml
# alerts/rules.yml
groups:
  - name: FixZone Alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} per second"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }} seconds"
      
      - alert: DatabaseDown
        expr: up{job="mysql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "MySQL database is not responding"
```

---

## 📋 Checklist النهائي

### قبل Release

- [ ] جميع Unit Tests تمر بنجاح
- [ ] جميع Integration Tests تمر بنجاح
- [ ] E2E Tests تمر بنجاح
- [ ] Security scan نظيف (no high/critical vulnerabilities)
- [ ] Performance tests ضمن المعايير المقبولة
- [ ] Code review مكتمل
- [ ] Documentation محدثة
- [ ] Database migrations tested
- [ ] Rollback plan جاهز
- [ ] Monitoring & Alerts مفعلة
- [ ] Smoke tests جاهزة

### بعد Deploy

- [ ] Smoke tests تمر بنجاح
- [ ] Health checks OK
- [ ] No errors in Sentry
- [ ] Logs نظيفة
- [ ] Metrics طبيعية
- [ ] User acceptance testing
- [ ] Documentation updated on wiki

---

## 9. JWT + RBAC Matrix (نماذج الفحص)

### 9.1 إنشاء Tokens للاختبار

```javascript
// tests/helpers/auth-tokens.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Create test tokens
const tokens = {
  adminToken: jwt.sign(
    { id: 1, email: 'admin@fixzone.com', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  ),
  
  techToken: jwt.sign(
    { id: 2, email: 'tech1@fixzone.com', role: 'technician' },
    JWT_SECRET,
    { expiresIn: '24h' }
  ),
  
  receptionToken: jwt.sign(
    { id: 3, email: 'reception@fixzone.com', role: 'reception' },
    JWT_SECRET,
    { expiresIn: '24h' }
  ),
  
  accountantToken: jwt.sign(
    { id: 4, email: 'accountant@fixzone.com', role: 'accountant' },
    JWT_SECRET,
    { expiresIn: '24h' }
  ),
  
  clientToken: jwt.sign(
    { id: 5, email: 'client@example.com', role: 'client', customerId: 1 },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
};

module.exports = tokens;
```

---

### 9.2 RBAC Authorization Matrix

| Endpoint | Admin | Technician | Reception | Accountant | Client |
|----------|-------|------------|-----------|------------|--------|
| **Tickets** |
| `POST /api/tickets/create` | ✅ | ❌ | ✅ | ❌ | ✅ (own) |
| `GET /api/tickets` | ✅ | ✅ | ✅ | ✅ | ✅ (own) |
| `PUT /api/tickets/:id/status` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `DELETE /api/tickets/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Inventory** |
| `GET /api/inventory` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `POST /api/inventory/create` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `PUT /api/inventory/adjust` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `DELETE /api/inventory/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Finance** |
| `GET /api/finance/invoices` | ✅ | ❌ | ✅ | ✅ | ✅ (own) |
| `POST /api/finance/invoice` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `POST /api/finance/payment` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `GET /api/finance/reports` | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Users** |
| `GET /api/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/users/create` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `PUT /api/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /api/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Customers** |
| `GET /api/customers` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `POST /api/customers` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `PUT /api/customers/:id` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `DELETE /api/customers/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 9.3 اختبارات RBAC

```javascript
// tests/integration/rbac/authorization.test.js
const request = require('supertest');
const app = require('../../../backend/app');
const tokens = require('../../helpers/auth-tokens');

describe('RBAC Authorization Tests', () => {
  
  describe('Tickets Module', () => {
    test('Admin can create ticket', async () => {
      const response = await request(app)
        .post('/api/tickets/create')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ customerId: 1, deviceId: 1, reportedProblem: 'Test' });
      
      expect(response.status).toBe(201);
    });
    
    test('Technician CANNOT create ticket', async () => {
      const response = await request(app)
        .post('/api/tickets/create')
        .set('Authorization', `Bearer ${tokens.techToken}`)
        .send({ customerId: 1, deviceId: 1, reportedProblem: 'Test' });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
    
    test('Reception can create ticket', async () => {
      const response = await request(app)
        .post('/api/tickets/create')
        .set('Authorization', `Bearer ${tokens.receptionToken}`)
        .send({ customerId: 1, deviceId: 1, reportedProblem: 'Test' });
      
      expect(response.status).toBe(201);
    });
    
    test('Client can create ticket for self', async () => {
      const response = await request(app)
        .post('/api/tickets/create')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .send({ deviceId: 1, reportedProblem: 'Test' });
      
      expect(response.status).toBe(201);
    });
  });
  
  describe('Inventory Module', () => {
    test('Admin can adjust inventory', async () => {
      const response = await request(app)
        .put('/api/inventory/adjust')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ itemId: 1, quantity: 10, reason: 'restock' });
      
      expect(response.status).toBe(200);
    });
    
    test('Accountant can adjust inventory', async () => {
      const response = await request(app)
        .put('/api/inventory/adjust')
        .set('Authorization', `Bearer ${tokens.accountantToken}`)
        .send({ itemId: 1, quantity: 10, reason: 'restock' });
      
      expect(response.status).toBe(200);
    });
    
    test('Technician CANNOT adjust inventory', async () => {
      const response = await request(app)
        .put('/api/inventory/adjust')
        .set('Authorization', `Bearer ${tokens.techToken}`)
        .send({ itemId: 1, quantity: 10, reason: 'restock' });
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Finance Module', () => {
    test('Accountant can create invoice', async () => {
      const response = await request(app)
        .post('/api/finance/invoice')
        .set('Authorization', `Bearer ${tokens.accountantToken}`)
        .send({ repairRequestId: 1, totalAmount: 500 });
      
      expect(response.status).toBe(201);
    });
    
    test('Technician CANNOT create invoice', async () => {
      const response = await request(app)
        .post('/api/finance/invoice')
        .set('Authorization', `Bearer ${tokens.techToken}`)
        .send({ repairRequestId: 1, totalAmount: 500 });
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('User Management', () => {
    test('Admin can manage users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokens.adminToken}`);
      
      expect(response.status).toBe(200);
    });
    
    test('Non-admin CANNOT manage users', async () => {
      const roles = [tokens.techToken, tokens.receptionToken, tokens.accountantToken];
      
      for (const token of roles) {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(403);
      }
    });
  });
});
```

---

## 10. أدوات موصى بها + تعليمات سريعة

### 10.1 Unit & Integration Tests

**الأدوات:** Jest + Supertest

```bash
# Install
npm install --save-dev jest supertest

# Configuration (jest.config.js)
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/tests/**'
  ]
};

# Run
npm test
npm test -- --coverage
npm test -- --watch
```

---

### 10.2 E2E Frontend Tests

**الأدوات:** Playwright (headless & headed)

```bash
# Install
npm install --save-dev @playwright/test

# Init
npx playwright install

# Configuration (playwright.config.js)
module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};

# Run
npx playwright test
npx playwright test --ui              # UI mode
npx playwright test --headed          # Headed mode
npx playwright test --debug           # Debug mode
npx playwright test --project=chromium # Specific browser
```

---

### 10.3 API Contract Tests

**الأدوات:** Postman + Newman

```bash
# Install Newman
npm install -g newman

# Export collection from Postman
# Save as: testing/postman/FixZone-API.postman_collection.json

# Create environment
# Save as: testing/postman/staging.postman_environment.json
{
  "name": "Staging",
  "values": [
    { "key": "base_url", "value": "http://localhost:3001/api" },
    { "key": "admin_token", "value": "" }
  ]
}

# Run
newman run testing/postman/FixZone-API.postman_collection.json \
  --environment testing/postman/staging.postman_environment.json \
  --reporters cli,json,htmlextra \
  --reporter-htmlextra-export testing/results/newman-report.html

# CI Integration
npm install --save-dev newman newman-reporter-htmlextra
```

---

### 10.4 Security Testing

#### A. Snyk (Dependencies Scan)

```bash
# Install
npm install -g snyk

# Authenticate
snyk auth

# Test dependencies
snyk test

# Fix vulnerabilities
snyk fix

# Monitor project
snyk monitor

# CI Integration
snyk test --json > snyk-results.json
```

#### B. OWASP ZAP (Dynamic Scan)

```bash
# Run with Docker
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html \
  -J zap-report.json

# With authentication
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable \
  zap-full-scan.py \
  -t http://localhost:3000 \
  -r zap-full-report.html \
  -c zap-config.conf
```

---

### 10.5 Performance Testing

**الأدوات:** k6 أو Artillery

#### k6
```bash
# Install
brew install k6  # macOS
# أو
wget https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz

# Run
k6 run tests/performance/load-test.js

# With output
k6 run --out json=results.json tests/performance/load-test.js

# Thresholds
k6 run --threshold http_req_duration=p(95)<500 tests/performance/load-test.js
```

#### Artillery
```bash
# Install
npm install -g artillery

# Create config (load-test.yml)
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: '/api/repairs'
          json:
            customerId: 1
            deviceId: 1

# Run
artillery run load-test.yml
artillery run --output report.json load-test.yml
```

---

### 10.6 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: fixzone_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Setup test DB
        run: mysql -h127.0.0.1 -uroot -proot fixzone_test < migrations/schema.sql
      
      - name: Integration tests
        env:
          DATABASE_URL: mysql://root:root@127.0.0.1:3306/fixzone_test
        run: npm run test:integration
      
      - name: Build
        run: npm run build
      
      - name: E2E tests (optional)
        run: npx playwright test
      
      - name: Docker build
        run: docker build -t fixzone-erp:${{ github.sha }} .
```

---

### 10.7 Monitoring & Logging

#### Sentry (Exception Tracking)
```bash
npm install @sentry/node

# backend/server.js
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

#### Prometheus + Grafana (Metrics)
```bash
npm install prom-client

# backend/middleware/metrics.js
const promClient = require('prom-client');
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });
```

#### ELK / Papertrail / Loggly (Logs)
```bash
npm install winston

# backend/utils/logger.js
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

### 10.8 Database Schema Management

**الأدوات:** Prisma (إذا تم الترحيل) أو Migration scripts

```bash
# Prisma setup
npm install -D prisma
npx prisma init

# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_feature

# Deploy to staging
npx prisma migrate deploy

# Check schema drift
npx prisma migrate status
```

---

## 11. سيناريوهات حرجة (Edge / Security / Data)

### 11.1 File Upload Security

```javascript
describe('File Upload Security', () => {
  test('Reject file larger than limit', async () => {
    const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11 MB
    const response = await request(app)
      .post('/api/upload')
      .attach('file', largeFile, 'large.jpg');
    
    expect(response.status).toBe(413); // Payload Too Large
  });
  
  test('Reject disallowed file types', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', './malicious.exe', 'file.exe');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('File type not allowed');
  });
  
  test('Path traversal protection', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('filename', '../../../etc/passwd');
    
    expect(response.status).toBe(400);
  });
  
  test('Virus scan integration', async () => {
    // Mock virus scanner
    const response = await request(app)
      .post('/api/upload')
      .attach('file', './eicar-test-file.txt');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('virus detected');
  });
});
```

---

### 11.2 Race Conditions

```javascript
describe('Race Condition Tests', () => {
  test('Concurrent inventory decrement', async () => {
    // Setup: Item with quantity 10
    await db.query('UPDATE InventoryItem SET quantity = 10 WHERE id = 1');
    
    // Simulate 12 concurrent requests to use 1 item each
    const requests = Array(12).fill().map(() =>
      request(app)
        .post('/api/repairs/use-part')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ itemId: 1, quantity: 1 })
    );
    
    const results = await Promise.all(requests);
    
    // Only 10 should succeed
    const succeeded = results.filter(r => r.status === 200);
    expect(succeeded.length).toBe(10);
    
    // 2 should fail with out of stock
    const failed = results.filter(r => r.status === 400);
    expect(failed.length).toBe(2);
    
    // Final quantity should be 0
    const [item] = await db.query('SELECT quantity FROM InventoryItem WHERE id = 1');
    expect(item[0].quantity).toBe(0);
  });
  
  test('Concurrent invoice number generation', async () => {
    const requests = Array(100).fill().map(() =>
      request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${tokens.accountantToken}`)
        .send({ repairRequestId: 1, totalAmount: 100 })
    );
    
    const results = await Promise.all(requests);
    const invoiceNumbers = results.map(r => r.body.invoiceNumber);
    
    // All invoice numbers should be unique
    const uniqueNumbers = new Set(invoiceNumbers);
    expect(uniqueNumbers.size).toBe(100);
  });
});
```

---

### 11.3 Data Integrity

```javascript
describe('Data Integrity Tests', () => {
  test('Delete vendor - check orphaned purchase orders', async () => {
    // Create vendor and purchase order
    const vendor = await createVendor({ name: 'Test Vendor' });
    await createPurchaseOrder({ vendorId: vendor.id });
    
    // Delete vendor
    await deleteVendor(vendor.id);
    
    // Purchase orders should still exist but marked with deleted vendor
    const [orders] = await db.query(
      'SELECT * FROM PurchaseOrder WHERE vendorId = ?',
      [vendor.id]
    );
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].vendorDeletedAt).not.toBeNull();
  });
  
  test('Cascade delete behavior', async () => {
    const customer = await createCustomer({ name: 'Test' });
    const ticket = await createTicket({ customerId: customer.id });
    
    // Delete customer (soft delete)
    await deleteCustomer(customer.id);
    
    // Ticket should still exist
    const ticketExists = await getTicket(ticket.id);
    expect(ticketExists).not.toBeNull();
    
    // But customer should be marked deleted
    expect(ticketExists.customer.deletedAt).not.toBeNull();
  });
});
```

---

### 11.4 Payment Flow Edge Cases

```javascript
describe('Payment Flow Edge Cases', () => {
  test('Partial payment then full payment', async () => {
    const invoice = await createInvoice({ totalAmount: 1000 });
    
    // First partial payment
    await addPayment(invoice.id, { amount: 400 });
    let updated = await getInvoice(invoice.id);
    expect(updated.status).toBe('partially_paid');
    
    // Second payment to complete
    await addPayment(invoice.id, { amount: 600 });
    updated = await getInvoice(invoice.id);
    expect(updated.status).toBe('paid');
  });
  
  test('Refund scenario', async () => {
    const invoice = await createInvoice({ totalAmount: 500 });
    await addPayment(invoice.id, { amount: 500 });
    
    // Issue refund
    const response = await request(app)
      .post(`/api/payments/refund`)
      .set('Authorization', `Bearer ${tokens.accountantToken}`)
      .send({ invoiceId: invoice.id, amount: 200, reason: 'Partial refund' });
    
    expect(response.status).toBe(200);
    
    const updated = await getInvoice(invoice.id);
    expect(updated.status).toBe('partially_paid');
    expect(updated.amountPaid).toBe(300);
  });
  
  test('Invoice numbering with concurrent creation', async () => {
    // Already tested in race conditions
  });
});
```

---

### 11.5 JWT & Authentication Edge Cases

```javascript
describe('JWT & Auth Edge Cases', () => {
  test('Expired token rejection', async () => {
    const expiredToken = jwt.sign(
      { id: 1, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '0s' }
    );
    
    const response = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('expired');
  });
  
  test('Token refresh flow', async () => {
    // Login to get refresh token
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@fixzone.com', password: 'password' });
    
    const refreshToken = login.body.refreshToken;
    
    // Use refresh token to get new access token
    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeDefined();
  });
  
  test('Logout everywhere (revoke all tokens)', async () => {
    // Login multiple times
    await loginMultipleTimes('admin@fixzone.com', 3);
    
    // Logout everywhere
    const response = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${tokens.adminToken}`);
    
    expect(response.status).toBe(200);
    
    // All previous tokens should be invalid
    const testAccess = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tokens.adminToken}`);
    
    expect(testAccess.status).toBe(401);
  });
});
```

---

### 11.6 SQL Injection Tests

```javascript
describe('SQL Injection Protection', () => {
  test('SQL injection in search field', async () => {
    const payload = "'; DROP TABLE User; --";
    const response = await request(app)
      .get('/api/customers')
      .query({ search: payload });
    
    // Should not crash and User table should still exist
    expect(response.status).toBe(200);
    
    const [users] = await db.query('SELECT COUNT(*) as count FROM User');
    expect(users[0].count).toBeGreaterThan(0);
  });
  
  test('SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: "admin' OR '1'='1", password: 'anything' });
    
    expect(response.status).toBe(401);
  });
});
```

---

### 11.7 Rate Limiting

```javascript
describe('Rate Limiting', () => {
  test('Brute force login protection', async () => {
    const attempts = Array(10).fill().map(() =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@fixzone.com', password: 'wrong' })
    );
    
    const results = await Promise.all(attempts);
    
    // After 5 attempts, should get rate limited
    const rateLimited = results.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
  
  test('API rate limiting per user', async () => {
    const requests = Array(150).fill().map(() =>
      request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
    );
    
    const results = await Promise.all(requests);
    
    // Should have some 429 responses
    const rateLimited = results.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

### 11.8 Backup & Restore Test

```bash
# tests/manual/backup-restore.sh

# 1. Take backup
mysqldump -u root fixzone_staging > backup_$(date +%Y%m%d).sql

# 2. Make some changes
mysql -u root fixzone_staging -e "INSERT INTO Customer ..."

# 3. Restore from backup
mysql -u root fixzone_staging < backup_$(date +%Y%m%d).sql

# 4. Validate data consistency
node scripts/validate-db-integrity.js
```

```javascript
// scripts/validate-db-integrity.js
async function validateIntegrity() {
  // Check foreign key constraints
  const [violations] = await db.query(`
    SELECT 'RepairRequest' as table_name, COUNT(*) as count
    FROM RepairRequest rr
    LEFT JOIN Customer c ON rr.customerId = c.id
    WHERE c.id IS NULL AND rr.customerId IS NOT NULL
  `);
  
  if (violations[0].count > 0) {
    throw new Error('Foreign key violations detected!');
  }
  
  // Check for orphaned records
  // ... more checks
  
  console.log('✅ Database integrity validated');
}
```

---

## 12. خطة ترياج سريعة + أولويات الإصلاح

### 12.1 نظام الأولويات المُحسّن

| Priority | SLA | الوصف | أمثلة | الإجراء |
|----------|-----|-------|-------|---------|
| **P0** | 2 ساعة | Critical - يوقف العمل بالكامل | - لا يمكن تسجيل الدخول<br>- النظام down<br>- فقدان البيانات<br>- DB corruption | Hotfix فوري → Deploy |
| **P1** | 24 ساعة | High - ميزة أساسية معطلة | - لا يمكن إنشاء تذاكر<br>- خطأ في حساب الفواتير<br>- الطباعة لا تعمل | Hotfix release |
| **P2** | 1 أسبوع | Medium - مُزعج لكن له workaround | - بطء في الأداء<br>- UI غير متسق<br>- تصدير Excel خطأ | Scheduled patch |
| **P3** | 1 شهر | Low - تحسينات | - تحسينات UX<br>- رسائل خطأ أوضح<br>- Keyboard shortcuts | Next sprint |

---

### 12.2 خطوات الترياج (Triage Workflow)

```mermaid
graph TD
    A[Bug Reported] --> B{Can Reproduce?}
    B -->|Yes| C[Assign Priority]
    B -->|No| D[Request More Info]
    D --> A
    
    C --> E{P0/P1?}
    E -->|Yes| F[Create Hotfix Branch]
    E -->|No| G[Add to Backlog]
    
    F --> H[Fix + Tests]
    H --> I[Code Review]
    I --> J[QA Verify on Staging]
    J --> K{Pass?}
    K -->|Yes| L[Deploy to Production]
    K -->|No| H
    
    L --> M[Monitor]
    M --> N[Close Bug]
```

#### خطوات تفصيلية:

1. **استلام البلاغ**
   - تسجيل في Bug Tracker (GitHub Issues / Jira)
   - إضافة Labels: module, severity, priority

2. **التحقق (Reproduce)**
   - محاولة إعادة إنتاج الخطأ على staging
   - نفس الـ commit/version
   - جمع Logs + HAR file + Screenshots

3. **التصنيف (Classify)**
   - تحديد Priority (P0-P3)
   - تحديد Severity (Critical/High/Medium/Low)
   - تحديد Module المتأثر

4. **التعيين (Assign)**
   - Backend team للأخطاء في API
   - Frontend team للأخطاء في UI
   - DevOps للأخطاء في Infrastructure
   - DB team للمشاكل في Schema

5. **الإصلاح (Fix)**
   - إنشاء Branch: `hotfix/BUG-XXX` أو `fix/BUG-XXX`
   - كتابة الإصلاح + Unit tests
   - كتابة Integration test للتأكد من عدم التكرار

6. **المراجعة (Review)**
   - Code Review من 1-2 developers
   - Security review للـ P0/P1 bugs
   - Performance check إذا كان له تأثير

7. **الاختبار (QA Verify)**
   - QA تختبر الإصلاح على staging
   - Regression tests للتأكد من عدم كسر شيء
   - Manual exploratory testing حول الـ bug

8. **النشر (Deploy)**
   - Merge إلى main/develop
   - CI/CD pipeline
   - Deploy to production (P0/P1 فوري، P2/P3 مع release)

9. **المراقبة (Monitor)**
   - مراقبة Sentry لمدة 24 ساعة
   - فحص Logs
   - جمع User feedback

10. **الإغلاق (Close)**
    - تأكيد أن الخطأ اختفى
    - تحديث Documentation إذا لزم
    - إغلاق Bug ticket

---

### 12.3 نموذج Bug Report مُحسّن

```markdown
## 🐛 Bug Report

**ID:** BUG-XXX  
**Title:** [مختصر وواضح - 50 حرف max]  
**Status:** 🔴 Open / 🟡 In Progress / 🟢 Fixed / ⚫ Closed

---

### 📋 التصنيف

**Module:** [Auth / Customers / Repairs / Invoices / Inventory / Finance / Reports]  
**Priority:** [P0 / P1 / P2 / P3]  
**Severity:** [Critical / High / Medium / Low]  
**Type:** [Bug / Security / Performance / UX]

---

### 🖥️ البيئة

- **Environment:** Staging / Production
- **Browser:** Chrome 120 / Firefox 118 / Safari 16
- **OS:** Windows 11 / macOS 14 / Linux
- **Backend:** Node.js 18.x
- **Database:** MySQL 8.0
- **Build/Commit:** staging-v1.2.3 / abc123def

---

### 🔄 خطوات إعادة الإنتاج

1. افتح الصفحة `/tickets/new`
2. أدخل customer name: "أحمد"
3. اترك phone فارغاً
4. انقر "حفظ"

**التكرار:** يحدث 100% من الوقت

---

### ❌ النتيجة الفعلية

```
Error 500: Internal Server Error
```

لا يتم حفظ التذكرة والصفحة تظهر خطأ

---

### ✅ النتيجة المتوقعة

يجب إظهار رسالة validation: "رقم الهاتف مطلوب"

---

### 📊 Technical Details

**Request:**
\`\`\`json
POST /api/tickets
{
  "customerName": "أحمد",
  "phone": "",
  "deviceBrand": "Samsung"
}
\`\`\`

**Response:**
\`\`\`json
{
  "error": "Internal Server Error",
  "details": "Cannot read property 'replace' of undefined"
}
\`\`\`

**Server Logs:**
\`\`\`
2025-10-01 10:15:23 ERROR: TypeError: Cannot read property 'replace' of undefined
    at validatePhone (/backend/utils/validation.js:23:15)
    at createTicket (/backend/controllers/tickets.js:45:23)
\`\`\`

---

### 🔍 Root Cause Analysis

**Hypothesis:** 
دالة `validatePhone()` لا تتحقق من null/undefined قبل استدعاء `.replace()`

**Code Location:**
- File: `backend/utils/validation.js`
- Function: `validatePhone()`
- Lines: 20-30

---

### 💡 Suggested Fix

\`\`\`javascript
function validatePhone(phone) {
  // Before
  return phone.replace(/\s/g, '');
  
  // After
  if (!phone || phone.trim() === '') {
    throw new Error('Phone number is required');
  }
  return phone.replace(/\s/g, '');
}
\`\`\`

---

### 🧪 Tests to Add

1. **Unit Test:**
\`\`\`javascript
test('validatePhone with empty string', () => {
  expect(() => validatePhone('')).toThrow('Phone number is required');
});
\`\`\`

2. **Integration Test:**
\`\`\`javascript
test('POST /api/tickets without phone', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({ customerName: 'Test', phone: '' });
  expect(response.status).toBe(400);
});
\`\`\`

---

### 🛠️ Temporary Workaround

تأكد من إدخال رقم هاتف قبل الحفظ

---

### 📎 Attachments

- Screenshot: `bug-xxx-screenshot.png`
- HAR file: `bug-xxx-network.har`
- Video: `bug-xxx-recording.mp4`

---

### 📝 Additional Notes

تم اكتشافه أثناء اختبارات Sanity بعد release v1.2.3

---

### ✅ Resolution

**Fixed in:** `hotfix/BUG-XXX`  
**Commit:** `abc123def`  
**Deployed:** 2025-10-01 15:00  
**Verified by:** QA Team
```

---

## 13. ملاحظات تطويرية (Development Recommendations)

### 13.1 Request Validation

**استخدام Zod أو Joi للـ Validation**

```javascript
// Using Zod
const { z } = require('zod');

const createTicketSchema = z.object({
  customerId: z.number().int().positive(),
  deviceId: z.number().int().positive(),
  reportedProblem: z.string().min(10).max(500),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedCost: z.number().positive().optional()
});

// Middleware
const validateRequest = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Usage
router.post('/tickets', validateRequest(createTicketSchema), createTicket);
```

**أو باستخدام Joi:**

```javascript
const Joi = require('joi');

const createTicketSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  deviceId: Joi.number().integer().positive().required(),
  reportedProblem: Joi.string().min(10).max(500).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});
```

---

### 13.2 Centralized Error Handling

```javascript
// backend/middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes
const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK'
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message, code } = err;
  
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    code,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Usage
router.post('/tickets', async (req, res, next) => {
  try {
    // ... logic
  } catch (error) {
    next(new AppError('Failed to create ticket', 500, ErrorCodes.DATABASE_ERROR));
  }
});

module.exports = { AppError, ErrorCodes, errorHandler };
```

---

### 13.3 Database Transactions

```javascript
// Using MySQL2 Transactions
async function createInvoiceWithPayment(invoiceData, paymentData) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Create invoice
    const [invoiceResult] = await connection.query(
      'INSERT INTO Invoice (totalAmount, customerId) VALUES (?, ?)',
      [invoiceData.totalAmount, invoiceData.customerId]
    );
    
    // Create payment
    await connection.query(
      'INSERT INTO Payment (invoiceId, amount, method) VALUES (?, ?, ?)',
      [invoiceResult.insertId, paymentData.amount, paymentData.method]
    );
    
    // Update inventory
    await connection.query(
      'UPDATE InventoryItem SET quantity = quantity - ? WHERE id = ?',
      [invoiceData.usedQuantity, invoiceData.itemId]
    );
    
    await connection.commit();
    return invoiceResult.insertId;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

### 13.4 Idempotency Keys

```javascript
// backend/middleware/idempotency.js
const idempotencyCache = new Map();

const idempotencyMiddleware = (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (!idempotencyKey) {
    return next();
  }
  
  // Check if request was already processed
  if (idempotencyCache.has(idempotencyKey)) {
    const cachedResponse = idempotencyCache.get(idempotencyKey);
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }
  
  // Store original res.json
  const originalJson = res.json.bind(res);
  
  res.json = (body) => {
    // Cache response
    idempotencyCache.set(idempotencyKey, {
      status: res.statusCode,
      body
    });
    
    // Set expiry (1 hour)
    setTimeout(() => {
      idempotencyCache.delete(idempotencyKey);
    }, 3600000);
    
    return originalJson(body);
  };
  
  next();
};

// Usage on critical endpoints
router.post('/invoices', idempotencyMiddleware, createInvoice);
router.post('/payments', idempotencyMiddleware, createPayment);
```

---

### 13.5 Feature Flags

```javascript
// backend/config/features.js
const features = {
  NEW_DASHBOARD: process.env.FEATURE_NEW_DASHBOARD === 'true',
  WHATSAPP_INTEGRATION: process.env.FEATURE_WHATSAPP === 'true',
  ADVANCED_REPORTS: process.env.FEATURE_ADVANCED_REPORTS === 'true',
  AI_DIAGNOSTICS: process.env.FEATURE_AI_DIAGNOSTICS === 'true'
};

const isFeatureEnabled = (featureName) => {
  return features[featureName] === true;
};

// Usage
router.get('/dashboard', (req, res) => {
  if (isFeatureEnabled('NEW_DASHBOARD')) {
    return res.render('dashboard-v2');
  }
  return res.render('dashboard-v1');
});
```

---

### 13.6 Test Data Builder (Factory Pattern)

```javascript
// tests/factories/ticketFactory.js
class TicketFactory {
  constructor() {
    this.defaults = {
      customerId: 1,
      deviceId: 1,
      reportedProblem: 'Default problem',
      priority: 'medium',
      status: 'received'
    };
  }
  
  create(overrides = {}) {
    return { ...this.defaults, ...overrides };
  }
  
  createMany(count, overrides = {}) {
    return Array(count).fill().map((_, i) => 
      this.create({ ...overrides, id: i + 1 })
    );
  }
  
  withPriority(priority) {
    return this.create({ priority });
  }
  
  urgent() {
    return this.create({ priority: 'urgent' });
  }
  
  completed() {
    return this.create({ status: 'delivered' });
  }
}

// Usage
const ticketFactory = new TicketFactory();

test('Create urgent ticket', async () => {
  const ticket = ticketFactory.urgent();
  const response = await createTicket(ticket);
  expect(response.data.priority).toBe('urgent');
});
```

---

### 13.7 Pluggable Integrations (Mock-able)

```javascript
// backend/services/notificationService.js
class NotificationService {
  constructor(provider) {
    this.provider = provider; // WhatsApp, Email, SMS, Mock
  }
  
  async send(recipient, message) {
    return this.provider.send(recipient, message);
  }
}

// Providers
class WhatsAppProvider {
  async send(phone, message) {
    // Actual WhatsApp API call
  }
}

class MockProvider {
  async send(recipient, message) {
    console.log(`[MOCK] Sending to ${recipient}: ${message}`);
    return { success: true, messageId: 'mock-123' };
  }
}

// Factory
const createNotificationService = () => {
  const provider = process.env.NOTIFICATION_MODE === 'mock' 
    ? new MockProvider()
    : new WhatsAppProvider();
  
  return new NotificationService(provider);
};

module.exports = createNotificationService();
```

---

### 13.8 Schema Versioning & Migration Tests

```javascript
// tests/migrations/schema-version.test.js
describe('Schema Migration Tests', () => {
  test('All migrations run successfully', async () => {
    // Run all migrations on clean DB
    const migrations = fs.readdirSync('./migrations').sort();
    
    for (const migration of migrations) {
      const sql = fs.readFileSync(`./migrations/${migration}`, 'utf8');
      await db.query(sql);
    }
    
    // Verify schema version
    const [version] = await db.query('SELECT MAX(version) as v FROM schema_migrations');
    expect(version[0].v).toBe(migrations.length);
  });
  
  test('Rollback migrations', async () => {
    // Test rollback scripts
  });
  
  test('No schema drift between environments', async () => {
    // Compare staging vs production schema
  });
});

// CI Integration
// .github/workflows/ci.yml
- name: Test migrations
  run: |
    mysql -u root test_db < migrations/*.sql
    npm run test:migrations
```

---

## 📞 جهات الاتصال

| الدور | المسؤول | Contact |
|-------|---------|---------|
| QA Lead | [الاسم] | qa-lead@fixzone.com |
| Dev Lead | [الاسم] | dev-lead@fixzone.com |
| DevOps | [الاسم] | devops@fixzone.com |
| Product Owner | [الاسم] | po@fixzone.com |

---

**آخر تحديث:** 2025-10-01  
**الإصدار:** 1.1  
**الحالة:** ✅ معتمد ومُحدّث

