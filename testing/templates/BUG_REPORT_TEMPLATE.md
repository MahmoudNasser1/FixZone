# 🐛 Bug Report Template

## 📋 معلومات أساسية

**Title:** [MODULE] موجز المشكلة - خطأ واضح

**ID:** BR-YYYYMMDD-XXX

**Module:** e.g., Repair Requests / Invoices / Payments / Inventory / Auth

**Environment:** staging / production

**Version/Commit:** `<git sha>` (e.g., `abc123def`)

**Priority:** P0 / P1 / P2 / P3

**Severity:** Critical / High / Medium / Low

**Reported by:** `<name/agent>`

**Date:** YYYY-MM-DD

---

## 🔧 Preconditions (الشروط المسبقة)

مثال:
- المستخدم مسجل دخول كـ `receptionist`
- يوجد صنف X بكمية 0 في المخزون
- Database staging يحتوي على بيانات seed
- Feature flag `NEW_DASHBOARD` enabled

---

## 🔄 Steps to Reproduce (خطوات إعادة الإنتاج)

1. Login as `reception@fixzone.com`
2. Go to `/tickets/new`
3. Fill fields:
   - Customer: "أحمد محمد"
   - Phone: "01012345678"
   - Device Brand: "Samsung"
   - Device Model: "S21"
   - Reported Problem: "الشاشة مكسورة"
4. Click "Submit"
5. Observe error message

**Frequency:** Always / Sometimes / Rarely (%)

---

## ❌ Actual Result (النتيجة الفعلية)

**وصف دقيق:**
- Error 500: Internal Server Error
- Toast message: "حدث خطأ غير متوقع"
- Form doesn't submit
- Console shows: `TypeError: Cannot read property 'id' of undefined`

**Response Body:**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "details": "Cannot read property 'id' of undefined"
}
```

**Console Errors:**
```
TypeError: Cannot read property 'id' of undefined
    at createTicket (webpack-internal:///./src/pages/Tickets/New.js:45:23)
```

---

## ✅ Expected Result (النتيجة المتوقعة)

**بعد التصحيح:**
- Ticket should be created successfully
- Status: 201 Created
- Response contains ticket ID
- User is redirected to ticket details page
- Success message: "تم إنشاء التذكرة بنجاح"
- Receipt PDF is generated and available for download

---

## 📡 Request (if API)

**Endpoint:** `POST /api/tickets`

**Method:** POST

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "customerId": null,
  "customer": {
    "firstName": "أحمد",
    "lastName": "محمد",
    "phone": "01012345678"
  },
  "deviceBrand": "Samsung",
  "deviceModel": "S21",
  "reportedProblem": "الشاشة مكسورة",
  "priority": "medium"
}
```

---

## 📨 Response

**Status:** `500 Internal Server Error`

**Headers:**
```
Content-Type: application/json
X-Request-ID: req-abc123
```

**Body:**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "details": "Cannot read property 'id' of undefined",
  "timestamp": "2025-10-01T10:15:23.456Z"
}
```

---

## 📄 Logs

**Server Error Stack:**
```
Error in createTicket: TypeError: Cannot read property 'id' of undefined
    at createTicket (/backend/controllers/tickets.js:67:32)
    at Layer.handle [as handle_request] (/backend/node_modules/express/lib/router/layer.js:95:5)
    at next (/backend/node_modules/express/lib/router/route.js:137:13)
    at authenticate (/backend/middleware/authMiddleware.js:23:7)
    ...
```

**Prisma Error (if applicable):**
```
PrismaClientKnownRequestError: 
Invalid `prisma.ticket.create()` invocation:
Foreign key constraint failed on the field: `customerId`
```

**Database Query:**
```sql
INSERT INTO RepairRequest (customerId, deviceId, reportedProblem, status)
VALUES (NULL, 5, 'الشاشة مكسورة', 'received')
-- Error: customerId cannot be NULL
```

---

## 📎 Screenshot/Attachment

- Screenshot: `bug-br-20251001-001-screenshot.png`
- Network HAR file: `bug-br-20251001-001-network.har`
- Screen recording: `bug-br-20251001-001-video.mp4`
- Database dump: `bug-br-20251001-001-db-state.sql`

**Links:**
- https://drive.google.com/file/d/...
- https://imgur.com/...

---

## 🔍 Root Cause Hypothesis

**السبب المحتمل:**
- Controller `createTicket` يحاول الوصول إلى `customer.id` قبل التأكد من وجود العميل
- لا يوجد validation على `customerId` قبل استخدامه في query
- عند إنشاء عميل جديد inline، لا يتم انتظار نتيجة `createCustomer()` بشكل صحيح
- Null pointer exception بسبب missing `await` على async function

**Code Location:**
- File: `backend/controllers/tickets.js`
- Function: `createTicket()`
- Lines: 60-75

**Suspected Code:**
```javascript
// Line 67 - Bug here
const customerId = customer.id; // customer might be undefined

// Should be:
const customerId = customer?.id || req.body.customerId;
```

---

## 💡 Suggested Fix

**الإصلاح المقترح:**

### 1. Add Input Validation
```javascript
// At the start of createTicket()
const { customerId, customer, deviceBrand, deviceModel, reportedProblem } = req.body;

// Validate: either customerId OR customer object must be provided
if (!customerId && !customer) {
  return res.status(400).json({
    success: false,
    error: 'Either customerId or customer object is required'
  });
}

if (customer && (!customer.firstName || !customer.phone)) {
  return res.status(400).json({
    success: false,
    error: 'Customer firstName and phone are required'
  });
}
```

### 2. Handle Customer Creation Properly
```javascript
let finalCustomerId = customerId;

if (!finalCustomerId && customer) {
  // Create new customer
  const newCustomer = await createCustomer({
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email
  });
  
  finalCustomerId = newCustomer.id;
}

// Now safely use finalCustomerId
const ticket = await createTicketInDB({
  customerId: finalCustomerId,
  deviceBrand,
  deviceModel,
  reportedProblem
});
```

### 3. Add Error Handling
```javascript
try {
  // ... ticket creation logic
} catch (error) {
  console.error('Error in createTicket:', error);
  
  if (error.code === 'P2003') {
    // Foreign key constraint error
    return res.status(400).json({
      success: false,
      error: 'Invalid customer ID'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Failed to create ticket',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

---

## 🧪 Regression Tests to Add

### Unit Test
```javascript
// tests/unit/controllers/tickets.test.js
describe('createTicket', () => {
  test('should create ticket with existing customerId', async () => {
    const req = {
      body: {
        customerId: 1,
        deviceBrand: 'Samsung',
        deviceModel: 'S21',
        reportedProblem: 'Screen broken'
      },
      user: { id: 1 }
    };
    
    const res = mockResponse();
    await createTicket(req, res);
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: expect.any(Number) })
      })
    );
  });
  
  test('should create ticket with new customer object', async () => {
    const req = {
      body: {
        customer: {
          firstName: 'أحمد',
          lastName: 'محمد',
          phone: '01012345678'
        },
        deviceBrand: 'Samsung',
        deviceModel: 'S21',
        reportedProblem: 'Screen broken'
      },
      user: { id: 1 }
    };
    
    const res = mockResponse();
    await createTicket(req, res);
    
    expect(res.status).toHaveBeenCalledWith(201);
  });
  
  test('should return 400 when neither customerId nor customer provided', async () => {
    const req = {
      body: {
        deviceBrand: 'Samsung',
        deviceModel: 'S21',
        reportedProblem: 'Screen broken'
      },
      user: { id: 1 }
    };
    
    const res = mockResponse();
    await createTicket(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('customerId or customer')
      })
    );
  });
  
  test('should handle invalid customerId gracefully', async () => {
    const req = {
      body: {
        customerId: 99999, // Non-existent
        deviceBrand: 'Samsung',
        deviceModel: 'S21',
        reportedProblem: 'Screen broken'
      },
      user: { id: 1 }
    };
    
    const res = mockResponse();
    await createTicket(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Invalid customer')
      })
    );
  });
});
```

### Integration Test
```javascript
// tests/integration/api/tickets.test.js
describe('POST /api/tickets', () => {
  test('should create ticket with inline customer creation', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        customer: {
          firstName: 'أحمد',
          lastName: 'محمد',
          phone: '01012345678',
          email: 'ahmed@example.com'
        },
        deviceBrand: 'Samsung',
        deviceModel: 'S21',
        reportedProblem: 'الشاشة مكسورة',
        priority: 'medium'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('ticketNumber');
    expect(response.body.data.status).toBe('received');
    
    // Verify customer was created
    const customer = await getCustomerByPhone('01012345678');
    expect(customer).toBeDefined();
    expect(customer.firstName).toBe('أحمد');
  });
});
```

### E2E Test
```javascript
// tests/e2e/tickets/create-with-new-customer.spec.js
test('Create ticket with new customer flow', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'reception@fixzone.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await page.click('text=تذكرة جديدة');
  
  // Fill new customer info
  await page.fill('[name="customer.firstName"]', 'أحمد');
  await page.fill('[name="customer.lastName"]', 'محمد');
  await page.fill('[name="customer.phone"]', '01012345678');
  
  // Fill device info
  await page.fill('[name="deviceBrand"]', 'Samsung');
  await page.fill('[name="deviceModel"]', 'S21');
  await page.fill('[name="reportedProblem"]', 'الشاشة مكسورة');
  
  // Submit
  await page.click('button:has-text("حفظ")');
  
  // Verify success
  await expect(page.locator('text=تم إنشاء التذكرة بنجاح')).toBeVisible();
  await expect(page.locator('[data-testid="ticket-number"]')).toBeVisible();
});
```

---

## 🏷️ Labels

- `backend`
- `tickets`
- `bug`
- `P0`
- `validation`
- `error-handling`

---

## 📝 Additional Notes

- تم اكتشاف هذا الخطأ أثناء اختبارات Sanity بعد deploy v1.2.3
- يؤثر على 100% من محاولات إنشاء تذكرة مع عميل جديد
- Workaround مؤقت: إنشاء العميل أولاً من صفحة العملاء، ثم استخدام ID في التذكرة
- هذا الخطأ قد يؤدي إلى فقدان بيانات العملاء إذا تم إدخالها في النموذج

---

## ✅ Resolution

**Status:** 🔴 Open / 🟡 In Progress / 🟢 Fixed / ⚫ Closed

**Fixed in Branch:** `hotfix/BR-20251001-001-ticket-customer-validation`

**Commit:** `abc123def456`

**Pull Request:** #123

**Deployed to Staging:** 2025-10-01 15:30

**Deployed to Production:** 2025-10-02 10:00

**Verified by:** QA Team (John Doe)

**Closed Date:** 2025-10-02

---

**Template Version:** 1.0  
**Last Updated:** 2025-10-01

