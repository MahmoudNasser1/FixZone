# خطة المهام المتبقية - نظام المالية
## Financial System - Remaining Tasks Plan

**تاريخ الإنشاء:** 2025-01-28  
**آخر تحديث:** 2025-01-28  
**الحالة:** خطة تفصيلية للمهام المتبقية

---

## 📊 نظرة عامة على التقدم

| Phase | الحالة | التقدم | الأولوية | المدة المتوقعة |
|-------|--------|--------|----------|---------------|
| Phase 1: الإصلاحات الحرجة | 🔄 قيد العمل | 40% | 🔴 عالية جداً | 2-3 أيام |
| Phase 2: Backend Refactoring | ✅ مكتمل | 100% | - | - |
| Phase 3: Frontend Refactoring | 🔄 قيد العمل | 80% | 🟡 متوسطة | 1-2 أيام |
| Phase 4: Integration | ⏸️ في الانتظار | 0% | 🟠 عالية | 3-5 أيام |
| Phase 5: Testing & QA | ⏸️ في الانتظار | 0% | 🟠 عالية | 3-4 أيام |
| Phase 6: Production Deployment | ⏸️ في الانتظار | 0% | 🔴 عالية جداً | 2-3 أيام |

---

## Phase 1: إكمال الإصلاحات الحرجة (40% → 100%)

### 1.1 تطبيق Database Migrations على Staging

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🔴 عالية جداً  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **Backup قاعدة البيانات Staging**
  ```bash
  mysqldump -u root -p FZ > backup_staging_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **تطبيق Migration 1: Add Missing Columns to Invoice**
  ```sql
  -- Run: backend/migrations/20250128_add_missing_columns_to_invoice.sql
  ```

- [ ] **تطبيق Migration 2: Add paymentDate to Payment**
  ```sql
  -- Run: backend/migrations/20250128_add_paymentDate_to_payment.sql
  ```

- [ ] **تطبيق Migration 3: Add Soft Delete to InvoiceItem**
  ```sql
  -- Run: backend/migrations/20250128_add_soft_delete_to_invoice_item.sql
  ```

- [ ] **التحقق من سلامة البيانات**
  - [ ] التحقق من عدد السجلات قبل وبعد
  - [ ] التحقق من البيانات المهمة
  - [ ] اختبار Queries الأساسية

#### Checklist:
- [ ] Backup تم بنجاح
- [ ] جميع Migrations تم تطبيقها
- [ ] لا توجد أخطاء في Logs
- [ ] البيانات سليمة
- [ ] الأداء طبيعي

---

### 1.2 اختبار الإصلاحات على Staging

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🔴 عالية جداً  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **اختبار Invoice Operations**
  - [ ] إنشاء فاتورة جديدة
  - [ ] إضافة عناصر للفاتورة
  - [ ] حذف عنصر من الفاتورة (soft delete)
  - [ ] تحديث الفاتورة
  - [ ] جلب الفاتورة مع العناصر

- [ ] **اختبار Payment Operations**
  - [ ] إنشاء دفعة جديدة
  - [ ] التحقق من paymentDate
  - [ ] جلب المدفوعات مرتبة حسب التاريخ
  - [ ] تحديث حالة الفاتورة بعد الدفع

- [ ] **اختبار Integration**
  - [ ] ربط فاتورة بطلب إصلاح
  - [ ] ربط فاتورة بعميل
  - [ ] تحديث حالة طلب الإصلاح عند دفع الفاتورة

#### Checklist:
- [ ] جميع العمليات تعمل بشكل صحيح
- [ ] لا توجد أخطاء في Console
- [ ] الأداء مقبول
- [ ] البيانات محفوظة بشكل صحيح

---

### 1.3 تطبيق Migrations على Production

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🔴 عالية جداً  
**المدة المتوقعة:** 1 يوم (خلال فترة انخفاض الحركة)

#### المهام:
- [ ] **Backup قاعدة البيانات Production**
  ```bash
  mysqldump -u root -p FZ > backup_production_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **جدولة Maintenance Window**
  - [ ] اختيار وقت انخفاض الحركة (مثلاً: 2-4 صباحاً)
  - [ ] إشعار الفريق
  - [ ] إعداد Rollback Plan

- [ ] **تطبيق Migrations**
  - [ ] Migration 1
  - [ ] Migration 2
  - [ ] Migration 3

- [ ] **التحقق من Production**
  - [ ] التحقق من سلامة البيانات
  - [ ] اختبار العمليات الأساسية
  - [ ] مراقبة Logs

#### Checklist:
- [ ] Backup تم بنجاح
- [ ] Maintenance Window مجدول
- [ ] جميع Migrations تم تطبيقها
- [ ] لا توجد أخطاء
- [ ] النظام يعمل بشكل طبيعي

---

## Phase 3: إكمال Frontend Refactoring (80% → 100%)

### 3.1 إكمال الصفحات المتبقية

**الحالة:** 🔄 قيد العمل  
**الأولوية:** 🟡 متوسطة  
**المدة المتوقعة:** 1-2 أيام

#### المهام:
- [ ] **InvoiceEditPage.js**
  - [ ] صفحة تعديل فاتورة
  - [ ] Form مع Validation
  - [ ] إدارة العناصر
  - [ ] تحديث الحسابات

- [ ] **PaymentDetailsPage.js**
  - [ ] صفحة تفاصيل دفعة
  - [ ] عرض معلومات الدفعة
  - [ ] عرض معلومات الفاتورة المرتبطة

- [ ] **PaymentEditPage.js** (اختياري)
  - [ ] صفحة تعديل دفعة
  - [ ] Form مع Validation

#### Checklist:
- [ ] جميع الصفحات تم إنشاؤها
- [ ] Routes تم إضافتها
- [ ] لا توجد أخطاء Linter
- [ ] الصفحات تعمل بشكل صحيح

---

### 3.2 إكمال Components

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟡 متوسطة  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **ExpenseForm.js**
  - [ ] Form component قابل لإعادة الاستخدام
  - [ ] Validation
  - [ ] Error handling

- [ ] **PaymentForm.js**
  - [ ] Form component للمدفوعات
  - [ ] ربط بالفواتير
  - [ ] Validation للمبلغ

- [ ] **InvoiceForm.js**
  - [ ] Form component للفواتير
  - [ ] إدارة العناصر
  - [ ] حساب الإجماليات

- [ ] **InvoiceItemsForm.js**
  - [ ] Component لإدارة عناصر الفاتورة
  - [ ] إضافة/حذف/تعديل العناصر
  - [ ] حساب الإجماليات

- [ ] **FinancialFilters.js**
  - [ ] Component للفلاتر
  - [ ] Date range picker
  - [ ] Category/Branch filters

#### Checklist:
- [ ] جميع Components تم إنشاؤها
- [ ] Components قابلة لإعادة الاستخدام
- [ ] لا توجد أخطاء Linter

---

### 3.3 Real-time Updates

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟢 منخفضة  
**المدة المتوقعة:** 1-2 أيام

#### المهام:
- [ ] **WebSocket Integration**
  - [ ] ربط Frontend بـ WebSocket
  - [ ] Listen لـ Financial Events
  - [ ] Update UI تلقائياً

- [ ] **Events Handling**
  - [ ] Invoice created/updated
  - [ ] Payment created
  - [ ] Expense created/updated

#### Checklist:
- [ ] WebSocket يعمل
- [ ] Events يتم استقبالها
- [ ] UI يتم تحديثه تلقائياً

---

## Phase 4: Integration (0% → 100%)

### 4.1 Integration مع Repairs Module

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟠 عالية  
**المدة المتوقعة:** 1-2 أيام

#### المهام:
- [ ] **Service Integration**
  - [ ] تحسين `createFromRepair` في InvoicesService
  - [ ] إضافة منطق لاستخراج Services من Repair
  - [ ] إضافة منطق لاستخراج Parts من Repair

- [ ] **Auto Status Update**
  - [ ] تحديث حالة Repair عند دفع الفاتورة
  - [ ] تحديث حالة Repair عند إنشاء الفاتورة
  - [ ] إضافة WebSocket event

- [ ] **API Endpoints**
  - [ ] `GET /api/financial/invoices/by-repair/:repairId` ✅ (موجود)
  - [ ] `POST /api/financial/invoices/create-from-repair/:repairId` ✅ (موجود)
  - [ ] `GET /api/repairs/:id/invoice` (جديد)

#### Checklist:
- [ ] Integration يعمل بشكل صحيح
- [ ] الحالات يتم تحديثها تلقائياً
- [ ] لا توجد أخطاء

---

### 4.2 Integration مع Inventory Module

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟠 عالية  
**المدة المتوقعة:** 1-2 أيام

#### المهام:
- [ ] **Stock Deduction on Payment**
  - [ ] عند دفع فاتورة تحتوي على Parts
  - [ ] خصم من المخزون تلقائياً
  - [ ] تسجيل Stock Movement

- [ ] **Invoice Items Integration**
  - [ ] ربط InvoiceItem بـ InventoryItem
  - [ ] التحقق من توفر المخزون
  - [ ] عرض معلومات المخزون في Invoice

- [ ] **API Integration**
  - [ ] استخدام InventoryService في InvoicesService
  - [ ] إضافة Validation للمخزون

#### Checklist:
- [ ] Stock يتم خصمه تلقائياً
- [ ] Stock Movements يتم تسجيلها
- [ ] Validation يعمل بشكل صحيح

---

### 4.3 Integration مع Customers Module

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟠 عالية  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **Customer Balance Calculation**
  - [ ] حساب رصيد العميل من الفواتير والمدفوعات
  - [ ] API endpoint: `GET /api/customers/:id/balance`
  - [ ] عرض الرصيد في Customer Details

- [ ] **Customer Invoices/Payments**
  - [ ] `GET /api/customers/:id/invoices`
  - [ ] `GET /api/customers/:id/payments`
  - [ ] عرض في Customer Details Page

- [ ] **Auto Link Customer**
  - [ ] عند إنشاء فاتورة من Repair
  - [ ] ربط العميل تلقائياً

#### Checklist:
- [ ] Balance يتم حسابه بشكل صحيح
- [ ] APIs تعمل
- [ ] Customer Details يعرض المعلومات

---

### 4.4 Integration مع Companies & Branches

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟢 منخفضة  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **Company Integration**
  - [ ] ربط الفواتير بالشركات
  - [ ] Filtering حسب Company
  - [ ] Reports حسب Company

- [ ] **Branch Integration**
  - [ ] ربط الفواتير/المدفوعات/النفقات بالفروع
  - [ ] Filtering حسب Branch
  - [ ] Reports حسب Branch

#### Checklist:
- [ ] Integration يعمل
- [ ] Filtering يعمل
- [ ] Reports تعمل

---

## Phase 5: Testing & QA (0% → 100%)

### 5.1 Unit Tests

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟠 عالية  
**المدة المتوقعة:** 2-3 أيام

#### المهام:
- [ ] **Services Tests**
  - [ ] `expenses.service.test.js`
  - [ ] `payments.service.test.js`
  - [ ] `invoices.service.test.js`

- [ ] **Repositories Tests**
  - [ ] `expenses.repository.test.js`
  - [ ] `payments.repository.test.js`
  - [ ] `invoices.repository.test.js`

- [ ] **Controllers Tests**
  - [ ] `expenses.controller.test.js`
  - [ ] `payments.controller.test.js`
  - [ ] `invoices.controller.test.js`

#### Checklist:
- [ ] Coverage 80%+
- [ ] جميع Tests تمر
- [ ] Tests سريعة (< 5 ثواني)

---

### 5.2 Integration Tests

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟠 عالية  
**المدة المتوقعة:** 2-3 أيام

#### المهام:
- [ ] **API Endpoints Tests**
  - [ ] Expenses endpoints
  - [ ] Payments endpoints
  - [ ] Invoices endpoints

- [ ] **Database Operations Tests**
  - [ ] CRUD operations
  - [ ] Transactions
  - [ ] Soft deletes

- [ ] **Integration Tests**
  - [ ] Repairs integration
  - [ ] Inventory integration
  - [ ] Customers integration

#### Checklist:
- [ ] جميع Tests تمر
- [ ] Coverage 70%+
- [ ] Tests مستقلة

---

### 5.3 E2E Tests

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟡 متوسطة  
**المدة المتوقعة:** 1-2 أيام

#### المهام:
- [ ] **Expense Flow**
  - [ ] إنشاء نفقة
  - [ ] تعديل نفقة
  - [ ] حذف نفقة
  - [ ] عرض قائمة النفقات

- [ ] **Payment Flow**
  - [ ] إنشاء دفعة
  - [ ] ربط دفعة بفاتورة
  - [ ] تحديث حالة الفاتورة

- [ ] **Invoice Flow**
  - [ ] إنشاء فاتورة من Repair
  - [ ] إضافة عناصر
  - [ ] دفع الفاتورة
  - [ ] تحديث حالة Repair

#### Checklist:
- [ ] جميع Flows تعمل
- [ ] لا توجد أخطاء
- [ ] الأداء مقبول

---

### 5.4 Performance Tests

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🟡 متوسطة  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **Load Testing**
  - [ ] 100 concurrent requests
  - [ ] 500 concurrent requests
  - [ ] 1000 concurrent requests

- [ ] **Query Optimization**
  - [ ] مراجعة Queries البطيئة
  - [ ] إضافة Indexes
  - [ ] تحسين Joins

- [ ] **Frontend Performance**
  - [ ] Bundle size
  - [ ] Load time
  - [ ] Render time

#### Checklist:
- [ ] Response time < 200ms
- [ ] No memory leaks
- [ ] Bundle size مقبول

---

## Phase 6: Production Deployment (0% → 100%)

### 6.1 Pre-Deployment Checklist

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🔴 عالية جداً  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **Code Review**
  - [ ] مراجعة جميع التغييرات
  - [ ] التأكد من Best Practices
  - [ ] التأكد من Security

- [ ] **Documentation**
  - [ ] تحديث API Documentation
  - [ ] تحديث README
  - [ ] تحديث User Guide

- [ ] **Backup**
  - [ ] Database backup
  - [ ] Code backup
  - [ ] Config backup

- [ ] **Rollback Plan**
  - [ ] إعداد Rollback scripts
  - [ ] اختبار Rollback على Staging
  - [ ] توثيق Rollback steps

#### Checklist:
- [ ] جميع Items مكتملة
- [ ] Team تم إشعاره
- [ ] Maintenance Window مجدول

---

### 6.2 Deployment Steps

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🔴 عالية جداً  
**المدة المتوقعة:** 1 يوم

#### المهام:
- [ ] **Deploy Backend**
  ```bash
  # 1. Pull latest code
  git checkout main
  git pull origin main
  
  # 2. Install dependencies
  npm install
  
  # 3. Build
  npm run build
  
  # 4. Restart services
  pm2 restart backend
  
  # 5. Monitor
  pm2 logs backend
  ```

- [ ] **Deploy Frontend**
  ```bash
  # 1. Build
  cd frontend/react-app
  npm run build
  
  # 2. Deploy to server
  # (depends on deployment method)
  
  # 3. Verify
  ```

- [ ] **Run Migrations**
  ```bash
  # During maintenance window
  mysql -u root -p FZ < backend/migrations/20250128_add_missing_columns_to_invoice.sql
  mysql -u root -p FZ < backend/migrations/20250128_add_paymentDate_to_payment.sql
  mysql -u root -p FZ < backend/migrations/20250128_add_soft_delete_to_invoice_item.sql
  ```

#### Checklist:
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Migrations applied
- [ ] No errors in logs

---

### 6.3 Post-Deployment

**الحالة:** ⏸️ في الانتظار  
**الأولوية:** 🔴 عالية جداً  
**المدة المتوقعة:** 1-2 أيام

#### المهام:
- [ ] **Monitoring**
  - [ ] مراقبة Error logs
  - [ ] مراقبة Performance metrics
  - [ ] مراقبة Database queries

- [ ] **Verification**
  - [ ] اختبار جميع Features
  - [ ] التحقق من البيانات
  - [ ] التحقق من Integration

- [ ] **User Feedback**
  - [ ] جمع Feedback من المستخدمين
  - [ ] معالجة Issues
  - [ ] تحديث Documentation

#### Checklist:
- [ ] لا توجد أخطاء حرجة
- [ ] الأداء مقبول
- [ ] المستخدمون راضون

---

## 📅 Timeline المقترح

| الأسبوع | Phase | المهام | الأولوية |
|---------|-------|--------|----------|
| الأسبوع 1 | Phase 1 | إكمال Migrations + Testing | 🔴 عالية جداً |
| الأسبوع 2 | Phase 3 | إكمال Frontend | 🟡 متوسطة |
| الأسبوع 3 | Phase 4 | Integration | 🟠 عالية |
| الأسبوع 4 | Phase 5 | Testing & QA | 🟠 عالية |
| الأسبوع 5 | Phase 6 | Production Deployment | 🔴 عالية جداً |

---

## 🎯 الأولويات

### 🔴 عالية جداً (يجب إكمالها فوراً):
1. تطبيق Migrations على Staging
2. اختبار Migrations
3. تطبيق Migrations على Production
4. Production Deployment

### 🟠 عالية (يجب إكمالها قريباً):
1. Integration مع Repairs
2. Integration مع Inventory
3. Integration مع Customers
4. Unit Tests
5. Integration Tests

### 🟡 متوسطة (يمكن تأجيلها):
1. إكمال Frontend Components
2. Real-time Updates
3. E2E Tests
4. Performance Tests

### 🟢 منخفضة (يمكن تأجيلها):
1. Integration مع Companies/Branches
2. Advanced Features

---

## 📚 المراجع

- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)
- [خطة التكامل](./05_INTEGRATION_PLAN.md)
- [استراتيجية الاختبار](./08_TESTING_STRATEGY.md)
- [تتبع التقدم](./PROGRESS.md)

---

**آخر تحديث:** 2025-01-28


