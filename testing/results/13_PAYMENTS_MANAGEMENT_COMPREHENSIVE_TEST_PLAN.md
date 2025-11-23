# خطة الاختبار الشامل - Payments Management Module

## 📋 معلومات الاختبار

**التاريخ:** 2025-11-19  
**المديول:** Payments Management (إدارة المدفوعات)  
**نوع الاختبار:** Comprehensive Testing (Backend + Frontend + Integration)  
**الحالة:** 📋 **خطة الاختبار**

---

## 🎯 أهداف الاختبار

1. ✅ التحقق من أن جميع Backend APIs تعمل بشكل صحيح
2. ✅ التحقق من أن Frontend Pages تعمل بشكل صحيح
3. ✅ التحقق من Security (authMiddleware, validation)
4. ✅ التحقق من Integration (Payment ↔ Invoice)
5. ✅ التحقق من UI/UX

---

## 📊 Backend API Tests

### 1. Authentication & Authorization

#### Test 1.1: GET /api/payments (Without Auth)
- **الخطوات:**
  1. إرسال GET request بدون token
- **المتوقع:** 401 Unauthorized
- **النتيجة:** ⏳ PENDING

#### Test 1.2: GET /api/payments (With Auth)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET request مع token
- **المتوقع:** 200 OK مع بيانات المدفوعات
- **النتيجة:** ⏳ PENDING

#### Test 1.3: POST /api/payments (Without Auth)
- **الخطوات:**
  1. إرسال POST request بدون token
- **المتوقع:** 401 Unauthorized
- **النتيجة:** ⏳ PENDING

#### Test 1.4: PUT /api/payments/:id (Without Auth)
- **الخطوات:**
  1. إرسال PUT request بدون token
- **المتوقع:** 401 Unauthorized
- **النتيجة:** ⏳ PENDING

#### Test 1.5: DELETE /api/payments/:id (Without Auth)
- **الخطوات:**
  1. إرسال DELETE request بدون token
- **المتوقع:** 401 Unauthorized
- **النتيجة:** ⏳ PENDING

---

### 2. CRUD Operations

#### Test 2.1: GET /api/payments (List All)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments?page=1&limit=10
- **المتوقع:**
  - 200 OK
  - `payments` array
  - `pagination` object
- **النتيجة:** ⏳ PENDING

#### Test 2.2: GET /api/payments/:id (Get One)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments/1
- **المتوقع:**
  - 200 OK
  - `payment` object مع تفاصيل كاملة
- **النتيجة:** ⏳ PENDING

#### Test 2.3: GET /api/payments/:id (Invalid ID)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments/99999
- **المتوقع:** 404 Not Found
- **النتيجة:** ⏳ PENDING

#### Test 2.4: POST /api/payments (Create)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال POST /api/payments مع:
     - amount: 100
     - paymentMethod: "cash"
     - invoiceId: 1
     - createdBy: 2
- **المتوقع:**
  - 201 Created
  - `success: true`
  - `payment` object
  - Invoice status updated
- **النتيجة:** ⏳ PENDING

#### Test 2.5: PUT /api/payments/:id (Update)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال PUT /api/payments/1 مع:
     - amount: 150
     - paymentMethod: "card"
- **المتوقع:**
  - 200 OK
  - `success: true`
  - Invoice status updated
- **النتيجة:** ⏳ PENDING

#### Test 2.6: DELETE /api/payments/:id (Delete)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال DELETE /api/payments/1
- **المتوقع:**
  - 200 OK
  - `success: true`
  - Invoice status updated
- **النتيجة:** ⏳ PENDING

---

### 3. Filtering & Pagination

#### Test 3.1: Filter by Payment Method
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments?paymentMethod=cash
- **المتوقع:**
  - 200 OK
  - فقط المدفوعات بـ cash method
- **النتيجة:** ⏳ PENDING

#### Test 3.2: Filter by Date Range
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments?dateFrom=2025-01-01&dateTo=2025-12-31
- **المتوقع:**
  - 200 OK
  - فقط المدفوعات في التاريخ المحدد
- **النتيجة:** ⏳ PENDING

#### Test 3.3: Filter by Invoice ID
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments?invoiceId=1
- **المتوقع:**
  - 200 OK
  - فقط المدفوعات للفاتورة المحددة
- **النتيجة:** ⏳ PENDING

#### Test 3.4: Pagination
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments?page=1&limit=5
  3. إرسال GET /api/payments?page=2&limit=5
- **المتوقع:**
  - 200 OK
  - pagination object صحيح
  - بيانات مختلفة لكل صفحة
- **النتيجة:** ⏳ PENDING

---

### 4. Statistics

#### Test 4.1: GET /api/payments/stats/summary
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments/stats/summary
- **المتوقع:**
  - 200 OK
  - `totalPayments`, `totalAmount`, `averageAmount`
  - Breakdown by payment method
- **النتيجة:** ⏳ PENDING

#### Test 4.2: GET /api/payments/stats/summary (Date Range)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments/stats/summary?dateFrom=2025-01-01&dateTo=2025-12-31
- **المتوقع:**
  - 200 OK
  - إحصائيات للفترة المحددة
- **النتيجة:** ⏳ PENDING

#### Test 4.3: GET /api/payments/invoice/:invoiceId
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال GET /api/payments/invoice/1
- **المتوقع:**
  - 200 OK
  - `payments` array
  - `summary` object (finalAmount, totalPaid, remainingAmount)
- **النتيجة:** ⏳ PENDING

---

### 5. Validation

#### Test 5.1: Create - Missing Required Fields
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال POST /api/payments مع بيانات ناقصة
- **المتوقع:** 400 Bad Request مع رسالة خطأ واضحة
- **النتيجة:** ⏳ PENDING

#### Test 5.2: Create - Invalid Amount (negative)
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال POST /api/payments مع amount: -100
- **المتوقع:** 400 Bad Request
- **النتيجة:** ⏳ PENDING

#### Test 5.3: Create - Invalid Payment Method
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال POST /api/payments مع paymentMethod: "invalid"
- **المتوقع:** 400 Bad Request
- **النتيجة:** ⏳ PENDING

#### Test 5.4: Create - Amount Exceeds Remaining
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال POST /api/payments مع amount أكبر من المبلغ المتبقي
- **المتوقع:** 400 Bad Request
- **النتيجة:** ⏳ PENDING

#### Test 5.5: Update - Invalid Amount
- **الخطوات:**
  1. تسجيل الدخول
  2. إرسال PUT /api/payments/1 مع amount: -50
- **المتوقع:** 400 Bad Request
- **النتيجة:** ⏳ PENDING

---

## 📊 Frontend Tests

### 1. Page Load & Display

#### Test 1.1: Page Load
- **الخطوات:**
  1. تسجيل الدخول
  2. الانتقال إلى /payments
- **المتوقع:**
  - الصفحة تحمّل بنجاح
  - Header و Subtitle معروضان
  - Statistics Cards معروضة
  - Payments List معروض
- **النتيجة:** ⏳ PENDING

#### Test 1.2: Statistics Cards
- **الخطوات:**
  1. الانتقال إلى /payments
  2. التحقق من Statistics Cards
- **المتوقع:**
  - إجمالي المدفوعات
  - إجمالي المبلغ
  - متوسط المدفوعات
  - Breakdown by method
- **النتيجة:** ⏳ PENDING

#### Test 1.3: Payments List
- **الخطوات:**
  1. الانتقال إلى /payments
  2. التحقق من Payments List
- **المتوقع:**
  - قائمة المدفوعات معروضة
  - تفاصيل كل دفعة (المبلغ، الطريقة، الفاتورة، التاريخ)
- **النتيجة:** ⏳ PENDING

---

### 2. Filters & Search

#### Test 2.1: Search Functionality
- **الخطوات:**
  1. الانتقال إلى /payments
  2. إدخال نص في حقل البحث
- **المتوقع:**
  - النتائج تتحدث تلقائياً
  - فقط المدفوعات المطابقة معروضة
- **النتيجة:** ⏳ PENDING

#### Test 2.2: Filter by Payment Method
- **الخطوات:**
  1. الانتقال إلى /payments
  2. اختيار payment method من dropdown
- **المتوقع:**
  - فقط المدفوعات بطريقة الدفع المختارة معروضة
- **النتيجة:** ⏳ PENDING

#### Test 2.3: Filter by Date Range
- **الخطوات:**
  1. الانتقال إلى /payments
  2. اختيار date from و date to
- **المتوقع:**
  - فقط المدفوعات في التاريخ المحدد معروضة
- **النتيجة:** ⏳ PENDING

#### Test 2.4: Filter by Invoice
- **الخطوات:**
  1. الانتقال إلى /payments
  2. اختيار invoice ID
- **المتوقع:**
  - فقط المدفوعات للفاتورة المختارة معروضة
- **النتيجة:** ⏳ PENDING

---

### 3. Forms (Create/Edit)

#### Test 3.1: Create Payment Form
- **الخطوات:**
  1. الانتقال إلى /payments
  2. الضغط على "إضافة دفعة جديدة"
  3. ملء النموذج
  4. حفظ
- **المتوقع:**
  - Modal يفتح
  - جميع الحقول موجودة
  - Validation يعمل
  - يتم إنشاء الدفعة بنجاح
  - Invoice status updated
- **النتيجة:** ⏳ PENDING

#### Test 3.2: Edit Payment Form
- **الخطوات:**
  1. الانتقال إلى /payments
  2. الضغط على "تعديل" لدفعة موجودة
  3. تعديل البيانات
  4. حفظ
- **المتوقع:**
  - Modal يفتح مع بيانات مملوءة مسبقاً
  - يتم التحديث بنجاح
  - Invoice status updated
- **النتيجة:** ⏳ PENDING

#### Test 3.3: Delete Payment
- **الخطوات:**
  1. الانتقال إلى /payments
  2. الضغط على "حذف" لدفعة موجودة
  3. تأكيد الحذف
- **المتوقع:**
  - يتم الحذف بنجاح
  - Invoice status updated
- **النتيجة:** ⏳ PENDING

---

### 4. View Options

#### Test 4.1: Table View
- **الخطوات:**
  1. الانتقال إلى /payments
  2. اختيار "جدول" view
- **المتوقع:**
  - البيانات معروضة في جدول
  - جميع الأعمدة موجودة
- **النتيجة:** ⏳ PENDING

#### Test 4.2: Card View
- **الخطوات:**
  1. الانتقال إلى /payments
  2. اختيار "بطاقات" view
- **المتوقع:**
  - البيانات معروضة في بطاقات
  - تفاصيل واضحة لكل دفعة
- **النتيجة:** ⏳ PENDING

---

## 📊 Integration Tests

### 1. Payment ↔ Invoice Integration

#### Test 1.1: Invoice Status Update on Payment Create
- **الخطوات:**
  1. إنشاء دفعة جديدة
  2. التحقق من Invoice status
- **المتوقع:**
  - Invoice status يتحول إلى `paid` أو `partially_paid`
  - `amountPaid` يتم تحديثه
- **النتيجة:** ⏳ PENDING

#### Test 1.2: Invoice Status Update on Payment Update
- **الخطوات:**
  1. تحديث دفعة موجودة (تغيير المبلغ)
  2. التحقق من Invoice status
- **المتوقع:**
  - Invoice status يتم تحديثه بناءً على المبلغ الجديد
  - `amountPaid` يتم تحديثه
- **النتيجة:** ⏳ PENDING

#### Test 1.3: Invoice Status Update on Payment Delete
- **الخطوات:**
  1. حذف دفعة موجودة
  2. التحقق من Invoice status
- **المتوقع:**
  - Invoice status يعود إلى `draft` أو `partially_paid`
  - `amountPaid` يتم تحديثه
- **النتيجة:** ⏳ PENDING

---

## 📝 سجل الاختبارات

سيتم تحديث هذا الملف بعد إجراء كل اختبار.

---

**التحديث:** 2025-11-19  
**الحالة:** 📋 **Test Plan Ready**

