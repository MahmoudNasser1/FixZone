# خطة التطوير الشاملة لبورتال الفنيين والموظفين
## Technician & Employee Portal Comprehensive Development Plan

**التاريخ:** 2025-01-27  
**الحالة:** Production System  
**الأولوية:** 🔥 عالية جداً

---

## 📋 جدول المحتويات

1. [الوضع الحالي والتحليل](#الوضع-الحالي-والتحليل)
2. [المشاكل والثغرات](#المشاكل-والثغرات)
3. [الأهداف والرؤية](#الأهداف-والرؤية)
4. [خطة التطوير - Backend](#خطة-التطوير---backend)
5. [خطة التطوير - Frontend](#خطة-التطوير---frontend)
6. [التكامل مع الموديولات الأخرى](#التكامل-مع-الموديولات-الأخرى)
7. [الأمان والصلاحيات](#الأمان-والصلاحيات)
8. [خطة التنفيذ (Production-Safe)](#خطة-التنفيذ-production-safe)
9. [الاختبار والجودة](#الاختبار-والجودة)
10. [التوثيق](#التوثيق)

---

## 🔍 الوضع الحالي والتحليل

### 1.1 Backend - الوضع الحالي

#### الملفات الموجودة:
- ✅ `backend/routes/technicianRoutes.js` (93 سطر) - Routes محدودة
- ✅ `backend/controllers/technicianController.js` (685 سطر) - Controller أساسي
- ✅ `backend/routes/technicians.js` (35 سطر) - Routes بسيطة للقوائم
- ❌ لا يوجد Employee Portal منفصل
- ❌ لا يوجد Service Layer منفصل
- ❌ لا يوجد Repository Pattern
- ❌ لا يوجد Activity Logging شامل
- ❌ لا يوجد Audit Trail كامل

#### Routes الحالية للفنيين:
```javascript
GET    /api/tech/dashboard              // Dashboard الفني
GET    /api/tech/jobs                   // قائمة المهام
GET    /api/tech/jobs/:id               // تفاصيل مهمة
PUT    /api/tech/jobs/:id/status        // تحديث الحالة
POST   /api/tech/jobs/:id/notes         // إضافة ملاحظة
POST   /api/tech/jobs/:id/media         // رفع وسائط
GET    /api/tech/jobs/:id/media         // جلب الوسائط
POST   /api/tech/parts-request          // طلب قطع غيار
GET    /api/tech/parts-request/:id      // حالة طلب قطع غيار
GET    /api/tech/profile                // الملف الشخصي
PUT    /api/tech/profile                 // تحديث الملف الشخصي
PUT    /api/tech/status                 // تحديث حالة الفني (Online/Busy/Offline)
```

#### Routes الحالية للموظفين:
```javascript
❌ لا يوجد Employee Portal منفصل حالياً
⚠️ الموظفون يستخدمون نفس النظام العام مع صلاحيات محدودة
```

#### المشاكل في Backend:
1. **Routes محدودة** - وظائف أساسية فقط
2. **لا يوجد Employee Portal** - الموظفون بدون بورتال مخصص
3. **لا يوجد Service Layer** - Logic في Controller مباشرة
4. **لا يوجد Repository Pattern** - Database queries مباشرة
5. **Error Handling غير موحد** - معالجة أخطاء مختلفة
6. **لا يوجد Caching** - كل طلب يذهب للـ Database
7. **لا يوجد Rate Limiting محدد** - Rate limiting عام فقط
8. **لا يوجد Activity Logging شامل** - تتبع محدود
9. **لا يوجد Audit Trail** - لا يوجد سجل كامل للتغييرات
10. **لا يوجد Real-time Updates** - لا WebSocket
11. **لا يوجد Background Jobs** - كل شيء synchronous
12. **لا يوجد File Upload Handler محسّن** - رفع ملفات بسيط

### 1.2 Frontend - الوضع الحالي

#### الملفات الموجودة:
- ✅ `TechnicianDashboard.js` - Dashboard الفني
- ✅ `JobsListPage.js` - قائمة المهام
- ✅ `JobDetailsPage.js` - تفاصيل المهمة
- ✅ `TechnicianProfilePage.js` - الملف الشخصي
- ✅ `TechnicianHeader.js` - Header مخصص
- ✅ `TechnicianQRScanner.js` - ماسح QR
- ✅ `TechnicianStatsCard.js` - بطاقات الإحصائيات
- ✅ `technicianService.js` - Service للـ API
- ❌ لا يوجد Employee Portal في Frontend
- ❌ لا يوجد Real-time Updates
- ❌ لا يوجد Offline Support

#### المشاكل في Frontend:
1. **صفحات محدودة** - وظائف أساسية فقط
2. **لا يوجد Employee Portal** - الموظفون بدون واجهة مخصصة
3. **لا يوجد State Management مركزي** - Context API بسيط
4. **لا يوجد Caching للبيانات** - كل مرة fetch جديد
5. **لا يوجد Optimistic Updates** - لا تحديث فوري
6. **لا يوجد Real-time Updates** - لا WebSocket
7. **Forms بسيطة** - لا validation متقدم
8. **لا يوجد Error Boundaries** - أخطاء قد تكسر الصفحة
9. **لا يوجد Loading States محسّنة** - Loading بسيط
10. **لا يوجد Offline Support** - لا يعمل بدون إنترنت
11. **لا يوجد PWA Features** - لا Service Workers
12. **لا يوجد File Upload UI محسّن** - رفع ملفات بسيط

### 1.3 Database - الوضع الحالي

#### الجداول المستخدمة:
```sql
User                      -- المستخدمون (الفنيون والموظفون)
RepairRequest             -- طلبات الإصلاح
StatusUpdateLog           -- سجل تغييرات الحالة
AuditLog                  -- سجل التدقيق
RepairRequestAttachment   -- المرفقات
SparePartRequest          -- طلبات قطع الغيار
```

#### المشاكل في Database:
1. **لا يوجد جدول TechnicianStatus** - الحالة في AuditLog فقط
2. **لا يوجد جدول EmployeeActivity** - لا تتبع أنشطة الموظفين
3. **لا يوجد Indexes محسّنة** - بعض الاستعلامات بطيئة
4. **لا يوجد Full-Text Search** - البحث محدود
5. **لا يوجد Partitioning** - الجداول كبيرة
6. **لا يوجد Archiving Strategy** - البيانات تتراكم

### 1.4 Integration - الوضع الحالي

#### الموديولات المتصلة:
- ✅ **Repairs** - مرتبط (technicianId)
- ✅ **Customers** - مرتبط (customerId)
- ✅ **Devices** - مرتبط (deviceId)
- ✅ **Branches** - مرتبط (branchId)
- ⚠️ **Inventory** - تكامل جزئي (طلب قطع غيار)
- ⚠️ **Finance** - تكامل جزئي
- ⚠️ **Notifications** - تكامل جزئي
- ❌ **Reports** - تقارير محدودة
- ❌ **Analytics** - لا تحليلات
- ❌ **Time Tracking** - لا تتبع وقت العمل

---

## ⚠️ المشاكل والثغرات

### 2.1 مشاكل أمنية

#### 🔴 حرجة:
1. **Authorization Gaps** - بعض Routes بدون فحص صلاحيات كامل
2. **SQL Injection Risk** - بعض الاستعلامات بدون Prepared Statements
3. **XSS Vulnerability** - لا يوجد sanitization في بعض الأماكن
4. **CSRF Protection** - غير مفعل في بعض Routes
5. **Rate Limiting غير كافي** - يمكن إرسال طلبات كثيرة
6. **File Upload Security** - لا يوجد فحص للملفات المرفوعة
7. **Sensitive Data Exposure** - بعض البيانات الحساسة في Logs

#### 🟡 متوسطة:
1. **Input Validation غير كامل** - بعض الحقول بدون validation
2. **Session Management** - لا يوجد refresh tokens
3. **Password Policy** - لا يوجد سياسة كلمات مرور قوية
4. **2FA** - لا يوجد Two-Factor Authentication

### 2.2 مشاكل وظيفية

#### 🔴 حرجة:
1. **No Employee Portal** - الموظفون بدون بورتال مخصص
2. **Performance Issues** - بعض الاستعلامات بطيئة
3. **No Real-time Updates** - لا يوجد WebSocket
4. **No Offline Support** - لا يعمل بدون إنترنت
5. **Limited Search** - البحث محدود
6. **No Advanced Filters** - فلاتر بسيطة
7. **No Bulk Operations** - لا يمكن تحديث عدة مهام
8. **No Time Tracking** - لا تتبع وقت العمل

#### 🟡 متوسطة:
1. **No Export Functionality** - لا يمكن تصدير البيانات
2. **No Print Templates** - قوالب طباعة محدودة
3. **No Email/SMS Integration** - لا إشعارات تلقائية
4. **No Mobile App** - لا تطبيق موبايل
5. **No Analytics Dashboard** - لا لوحة تحليلات

### 2.3 مشاكل في التكامل

#### 🔴 حرجة:
1. **Inventory Integration** - تكامل جزئي مع المخزون
2. **Finance Integration** - تكامل جزئي مع المالية
3. **Notification System** - تكامل جزئي مع الإشعارات
4. **Limited Reporting** - تقارير محدودة

#### 🟡 متوسطة:
1. **No CRM Integration** - لا تكامل كامل مع CRM
2. **No Analytics** - لا تحليلات متقدمة
3. **No Mobile App** - لا تطبيق موبايل

---

## 🎯 الأهداف والرؤية

### 3.1 الأهداف الرئيسية

1. ✅ **نظام آمن ومستقر** - أمان على جميع المستويات
2. ✅ **بورتال موظفين كامل** - واجهة مخصصة للموظفين
3. ✅ **أداء عالي** - استعلامات محسّنة و caching
4. ✅ **تجربة مستخدم ممتازة** - واجهة سريعة وسهلة
5. ✅ **تكامل كامل** - ربط مع جميع الموديولات
6. ✅ **Real-time Updates** - تحديثات فورية
7. ✅ **Scalability** - قابلية للتوسع
8. ✅ **Maintainability** - سهولة الصيانة
9. ✅ **Documentation** - توثيق شامل

### 3.2 الميزات المطلوبة

#### Backend:
- [x] Employee Portal Routes & Controllers
- [x] Service Layer منفصل
- [x] Repository Pattern
- [x] Activity Logging شامل
- [x] Audit Trail كامل
- [x] Caching Strategy
- [x] Background Jobs
- [x] Real-time Updates (WebSocket)
- [x] Advanced Search
- [x] Bulk Operations
- [x] Export Functionality
- [x] File Upload Handler محسّن
- [x] Time Tracking System
- [x] Performance Monitoring

#### Frontend:
- [x] Employee Portal Pages
- [x] State Management محسّن
- [x] Caching للبيانات
- [x] Optimistic Updates
- [x] Real-time Updates (WebSocket)
- [x] Advanced Forms
- [x] Error Boundaries
- [x] Loading States محسّنة
- [x] Offline Support
- [x] PWA Features
- [x] File Upload UI محسّن
- [x] Time Tracking UI
- [x] Analytics Dashboard

---

## 4. خطة التطوير - Backend

### 4.1 هيكل الملفات الجديد

```
backend/
├── routes/
│   ├── technicianRoutes.js          (محسّن)
│   ├── employeeRoutes.js             (جديد)
│   └── portalRoutes.js              (جديد - مشترك)
├── controllers/
│   ├── technicianController.js      (محسّن)
│   ├── employeeController.js        (جديد)
│   └── portalController.js          (جديد - مشترك)
├── services/
│   ├── technicianService.js         (جديد)
│   ├── employeeService.js           (جديد)
│   ├── portalService.js             (جديد - مشترك)
│   └── timeTrackingService.js      (جديد)
├── repositories/
│   ├── technicianRepository.js      (جديد)
│   ├── employeeRepository.js        (جديد)
│   └── portalRepository.js          (جديد - مشترك)
├── middleware/
│   ├── portalAuthMiddleware.js      (جديد)
│   ├── portalPermissionMiddleware.js (جديد)
│   └── portalRateLimit.js           (جديد)
├── models/
│   ├── TechnicianStatus.js          (جديد)
│   ├── EmployeeActivity.js         (جديد)
│   └── TimeTracking.js              (جديد)
└── validators/
    ├── technicianValidator.js       (جديد)
    └── employeeValidator.js         (جديد)
```

### 4.2 Routes الجديدة والمحسّنة

#### 4.2.1 Technician Routes (محسّنة)

```javascript
// ============= Dashboard =============
GET    /api/tech/dashboard                    // Dashboard شامل
GET    /api/tech/dashboard/stats               // إحصائيات مفصلة
GET    /api/tech/dashboard/performance         // أداء الفني

// ============= Jobs Management =============
GET    /api/tech/jobs                         // قائمة المهام (محسّنة)
GET    /api/tech/jobs/:id                     // تفاصيل مهمة (محسّنة)
PUT    /api/tech/jobs/:id                     // تحديث مهمة (جديد)
PUT    /api/tech/jobs/:id/status               // تحديث الحالة (محسّن)
POST   /api/tech/jobs/:id/start               // بدء العمل (جديد)
POST   /api/tech/jobs/:id/pause               // إيقاف مؤقت (جديد)
POST   /api/tech/jobs/:id/complete            // إكمال المهمة (جديد)
POST   /api/tech/jobs/:id/cancel              // إلغاء المهمة (جديد)
POST   /api/tech/jobs/bulk-update             // تحديث جماعي (جديد)

// ============= Notes & Communication =============
POST   /api/tech/jobs/:id/notes               // إضافة ملاحظة (محسّن)
PUT    /api/tech/jobs/:id/notes/:noteId       // تحديث ملاحظة (جديد)
DELETE /api/tech/jobs/:id/notes/:noteId       // حذف ملاحظة (جديد)
GET    /api/tech/jobs/:id/timeline            // Timeline كامل (جديد)

// ============= Media Management =============
POST   /api/tech/jobs/:id/media               // رفع وسائط (محسّن)
GET    /api/tech/jobs/:id/media               // جلب الوسائط (محسّن)
DELETE /api/tech/jobs/:id/media/:mediaId     // حذف وسائط (جديد)
POST   /api/tech/jobs/:id/media/bulk-upload   // رفع متعدد (جديد)

// ============= Parts Management =============
POST   /api/tech/parts-request                // طلب قطع غيار (محسّن)
GET    /api/tech/parts-request                 // قائمة الطلبات (جديد)
GET    /api/tech/parts-request/:id            // تفاصيل طلب (محسّن)
PUT    /api/tech/parts-request/:id            // تحديث طلب (جديد)
DELETE /api/tech/parts-request/:id            // إلغاء طلب (جديد)

// ============= Profile & Settings =============
GET    /api/tech/profile                      // الملف الشخصي (محسّن)
PUT    /api/tech/profile                      // تحديث الملف (محسّن)
PUT    /api/tech/status                       // تحديث الحالة (محسّن)
GET    /api/tech/settings                     // الإعدادات (جديد)
PUT    /api/tech/settings                     // تحديث الإعدادات (جديد)

// ============= Time Tracking =============
POST   /api/tech/time-tracking/clock-in       // تسجيل الدخول (جديد)
POST   /api/tech/time-tracking/clock-out      // تسجيل الخروج (جديد)
GET    /api/tech/time-tracking/history         // سجل الوقت (جديد)
GET    /api/tech/time-tracking/stats           // إحصائيات الوقت (جديد)

// ============= Reports & Analytics =============
GET    /api/tech/reports/performance          // تقرير الأداء (جديد)
GET    /api/tech/reports/jobs                 // تقرير المهام (جديد)
GET    /api/tech/reports/export               // تصدير التقارير (جديد)

// ============= Search & Filters =============
GET    /api/tech/search                       // بحث متقدم (جديد)
GET    /api/tech/filters                      // فلاتر متاحة (جديد)
```

#### 4.2.2 Employee Routes (جديد)

```javascript
// ============= Dashboard =============
GET    /api/employee/dashboard                // Dashboard شامل
GET    /api/employee/dashboard/stats          // إحصائيات مفصلة

// ============= Repairs Management =============
GET    /api/employee/repairs                  // قائمة طلبات الإصلاح
GET    /api/employee/repairs/:id              // تفاصيل طلب
POST   /api/employee/repairs                  // إنشاء طلب جديد
PUT    /api/employee/repairs/:id             // تحديث طلب
PUT    /api/employee/repairs/:id/status      // تحديث الحالة
POST   /api/employee/repairs/:id/assign      // تعيين فني

// ============= Customers Management =============
GET    /api/employee/customers                // قائمة العملاء
GET    /api/employee/customers/:id           // تفاصيل عميل
POST   /api/employee/customers                // إضافة عميل جديد
PUT    /api/employee/customers/:id           // تحديث عميل

// ============= Devices Management =============
GET    /api/employee/devices                 // قائمة الأجهزة
GET    /api/employee/devices/:id             // تفاصيل جهاز
POST   /api/employee/devices                 // إضافة جهاز جديد
PUT    /api/employee/devices/:id             // تحديث جهاز

// ============= Quotations =============
GET    /api/employee/quotations              // قائمة العروض
GET    /api/employee/quotations/:id          // تفاصيل عرض
POST   /api/employee/quotations              // إنشاء عرض
PUT    /api/employee/quotations/:id         // تحديث عرض
POST   /api/employee/quotations/:id/approve  // الموافقة على عرض

// ============= Invoices =============
GET    /api/employee/invoices                // قائمة الفواتير
GET    /api/employee/invoices/:id            // تفاصيل فاتورة
POST   /api/employee/invoices                // إنشاء فاتورة
PUT    /api/employee/invoices/:id           // تحديث فاتورة

// ============= Profile & Settings =============
GET    /api/employee/profile                 // الملف الشخصي
PUT    /api/employee/profile                 // تحديث الملف
GET    /api/employee/settings                // الإعدادات
PUT    /api/employee/settings                // تحديث الإعدادات

// ============= Time Tracking =============
POST   /api/employee/time-tracking/clock-in   // تسجيل الدخول
POST   /api/employee/time-tracking/clock-out // تسجيل الخروج
GET    /api/employee/time-tracking/history    // سجل الوقت

// ============= Reports =============
GET    /api/employee/reports/daily          // تقرير يومي
GET    /api/employee/reports/performance     // تقرير الأداء
GET    /api/employee/reports/export          // تصدير التقارير
```

#### 4.2.3 Portal Shared Routes (جديد)

```javascript
// ============= Notifications =============
GET    /api/portal/notifications             // الإشعارات
PUT    /api/portal/notifications/:id/read    // قراءة إشعار
PUT    /api/portal/notifications/read-all    // قراءة الكل
DELETE /api/portal/notifications/:id        // حذف إشعار

// ============= Search =============
GET    /api/portal/search                    // بحث عام
GET    /api/portal/search/suggestions        // اقتراحات البحث

// ============= File Upload =============
POST   /api/portal/upload                    // رفع ملف
POST   /api/portal/upload/multiple           // رفع متعدد
DELETE /api/portal/upload/:fileId           // حذف ملف

// ============= Real-time =============
WS     /api/portal/ws                         // WebSocket connection
```

### 4.3 Service Layer

#### 4.3.1 Technician Service

```javascript
// backend/services/technicianService.js

class TechnicianService {
  // Dashboard
  async getDashboard(technicianId, filters) {}
  async getStats(technicianId, dateRange) {}
  async getPerformance(technicianId, period) {}
  
  // Jobs
  async getJobs(technicianId, filters, pagination) {}
  async getJobById(technicianId, jobId) {}
  async updateJob(technicianId, jobId, data) {}
  async updateJobStatus(technicianId, jobId, status, notes) {}
  async startJob(technicianId, jobId) {}
  async pauseJob(technicianId, jobId) {}
  async completeJob(technicianId, jobId, data) {}
  async cancelJob(technicianId, jobId, reason) {}
  async bulkUpdateJobs(technicianId, jobIds, updates) {}
  
  // Notes
  async addNote(technicianId, jobId, note) {}
  async updateNote(technicianId, jobId, noteId, note) {}
  async deleteNote(technicianId, jobId, noteId) {}
  async getTimeline(technicianId, jobId) {}
  
  // Media
  async uploadMedia(technicianId, jobId, files) {}
  async getMedia(technicianId, jobId) {}
  async deleteMedia(technicianId, jobId, mediaId) {}
  async bulkUploadMedia(technicianId, jobId, files) {}
  
  // Parts
  async createPartsRequest(technicianId, data) {}
  async getPartsRequests(technicianId, filters) {}
  async getPartsRequestById(technicianId, requestId) {}
  async updatePartsRequest(technicianId, requestId, data) {}
  async cancelPartsRequest(technicianId, requestId) {}
  
  // Profile
  async getProfile(technicianId) {}
  async updateProfile(technicianId, data) {}
  async updateStatus(technicianId, status) {}
  async getSettings(technicianId) {}
  async updateSettings(technicianId, settings) {}
  
  // Time Tracking
  async clockIn(technicianId, location) {}
  async clockOut(technicianId) {}
  async getTimeHistory(technicianId, dateRange) {}
  async getTimeStats(technicianId, period) {}
  
  // Reports
  async getPerformanceReport(technicianId, period) {}
  async getJobsReport(technicianId, filters) {}
  async exportReport(technicianId, reportType, format) {}
  
  // Search
  async search(technicianId, query, filters) {}
  async getFilters(technicianId) {}
}
```

#### 4.3.2 Employee Service

```javascript
// backend/services/employeeService.js

class EmployeeService {
  // Dashboard
  async getDashboard(employeeId, filters) {}
  async getStats(employeeId, dateRange) {}
  
  // Repairs
  async getRepairs(employeeId, filters, pagination) {}
  async getRepairById(employeeId, repairId) {}
  async createRepair(employeeId, data) {}
  async updateRepair(employeeId, repairId, data) {}
  async updateRepairStatus(employeeId, repairId, status) {}
  async assignTechnician(employeeId, repairId, technicianId) {}
  
  // Customers
  async getCustomers(employeeId, filters, pagination) {}
  async getCustomerById(employeeId, customerId) {}
  async createCustomer(employeeId, data) {}
  async updateCustomer(employeeId, customerId, data) {}
  
  // Devices
  async getDevices(employeeId, filters, pagination) {}
  async getDeviceById(employeeId, deviceId) {}
  async createDevice(employeeId, data) {}
  async updateDevice(employeeId, deviceId, data) {}
  
  // Quotations
  async getQuotations(employeeId, filters, pagination) {}
  async getQuotationById(employeeId, quotationId) {}
  async createQuotation(employeeId, data) {}
  async updateQuotation(employeeId, quotationId, data) {}
  async approveQuotation(employeeId, quotationId) {}
  
  // Invoices
  async getInvoices(employeeId, filters, pagination) {}
  async getInvoiceById(employeeId, invoiceId) {}
  async createInvoice(employeeId, data) {}
  async updateInvoice(employeeId, invoiceId, data) {}
  
  // Profile
  async getProfile(employeeId) {}
  async updateProfile(employeeId, data) {}
  async getSettings(employeeId) {}
  async updateSettings(employeeId, settings) {}
  
  // Time Tracking
  async clockIn(employeeId, location) {}
  async clockOut(employeeId) {}
  async getTimeHistory(employeeId, dateRange) {}
  
  // Reports
  async getDailyReport(employeeId, date) {}
  async getPerformanceReport(employeeId, period) {}
  async exportReport(employeeId, reportType, format) {}
}
```

### 4.4 Repository Pattern

#### 4.4.1 Technician Repository

```javascript
// backend/repositories/technicianRepository.js

class TechnicianRepository {
  // Jobs
  async findJobsByTechnician(technicianId, filters, pagination) {}
  async findJobById(technicianId, jobId) {}
  async updateJob(jobId, data) {}
  async updateJobStatus(jobId, status, notes, changedById) {}
  
  // Notes
  async createNote(jobId, note, userId) {}
  async updateNote(noteId, note) {}
  async deleteNote(noteId) {}
  async findNotesByJobId(jobId) {}
  
  // Media
  async createMedia(jobId, mediaData) {}
  async findMediaByJobId(jobId) {}
  async deleteMedia(mediaId) {}
  
  // Parts
  async createPartsRequest(data) {}
  async findPartsRequestsByTechnician(technicianId, filters) {}
  async findPartsRequestById(requestId) {}
  async updatePartsRequest(requestId, data) {}
  async deletePartsRequest(requestId) {}
  
  // Status
  async updateTechnicianStatus(technicianId, status) {}
  async getTechnicianStatus(technicianId) {}
  
  // Time Tracking
  async createTimeEntry(data) {}
  async findTimeEntriesByTechnician(technicianId, dateRange) {}
  async getTimeStats(technicianId, period) {}
}
```

### 4.5 Database Schema Updates

#### 4.5.1 New Tables

```sql
-- Technician Status Table
CREATE TABLE TechnicianStatus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  status ENUM('ONLINE', 'BUSY', 'BREAK', 'OFFLINE') DEFAULT 'OFFLINE',
  location JSON,
  lastSeenAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (technicianId) REFERENCES User(id),
  INDEX idx_technician_status (technicianId, status),
  INDEX idx_last_seen (lastSeenAt)
);

-- Employee Activity Table
CREATE TABLE EmployeeActivity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId INT NOT NULL,
  activityType VARCHAR(50) NOT NULL,
  entityType VARCHAR(50),
  entityId INT,
  details JSON,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES User(id),
  INDEX idx_employee_activity (employeeId, createdAt),
  INDEX idx_activity_type (activityType, createdAt)
);

-- Time Tracking Table
CREATE TABLE TimeTracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  userType ENUM('TECHNICIAN', 'EMPLOYEE') NOT NULL,
  clockInAt TIMESTAMP NOT NULL,
  clockOutAt TIMESTAMP NULL,
  location JSON,
  totalMinutes INT,
  breakMinutes INT DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  INDEX idx_user_time (userId, clockInAt),
  INDEX idx_date_range (clockInAt, clockOutAt)
);

-- Portal Notifications Table (if not exists)
CREATE TABLE PortalNotification (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  userType ENUM('TECHNICIAN', 'EMPLOYEE', 'CUSTOMER') NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON,
  isRead BOOLEAN DEFAULT FALSE,
  readAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  INDEX idx_user_notifications (userId, isRead, createdAt),
  INDEX idx_type (type, createdAt)
);
```

#### 4.5.2 Indexes Optimization

```sql
-- Optimize existing tables
ALTER TABLE RepairRequest ADD INDEX idx_technician_status (technicianId, status, createdAt);
ALTER TABLE RepairRequest ADD INDEX idx_status_created (status, createdAt);
ALTER TABLE StatusUpdateLog ADD INDEX idx_repair_created (repairRequestId, createdAt);
ALTER TABLE AuditLog ADD INDEX idx_entity_user (entityType, entityId, userId, createdAt);
```

### 4.6 Security Enhancements

#### 4.6.1 Portal Auth Middleware

```javascript
// backend/middleware/portalAuthMiddleware.js

const portalAuthMiddleware = (allowedTypes = ['TECHNICIAN', 'EMPLOYEE']) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.roleId || req.user.role;
      const userType = getUserType(userRole);

      if (!allowedTypes.includes(userType)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Invalid user type'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive'
        });
      }

      req.userType = userType;
      next();
    } catch (error) {
      console.error('Error in portal auth middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking authentication'
      });
    }
  };
};

function getUserType(roleId) {
  const roleMap = {
    1: 'ADMIN',
    2: 'MANAGER',
    3: 'EMPLOYEE',
    6: 'TECHNICIAN',
    8: 'CUSTOMER'
  };
  return roleMap[roleId] || 'UNKNOWN';
}
```

#### 4.6.2 Portal Permission Middleware

```javascript
// backend/middleware/portalPermissionMiddleware.js

const portalPermissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userType = req.userType;
      const roleId = req.user.roleId || req.user.role;

      // Admin has all permissions
      if (roleId === 1) {
        return next();
      }

      // Check permission based on user type
      const hasPermission = await checkPortalPermission(
        userType,
        roleId,
        requiredPermission,
        req
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Insufficient permissions',
          required: requiredPermission
        });
      }

      next();
    } catch (error) {
      console.error('Error in portal permission middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

async function checkPortalPermission(userType, roleId, permission, req) {
  // Technician permissions
  if (userType === 'TECHNICIAN') {
    return await checkTechnicianPermission(roleId, permission, req);
  }

  // Employee permissions
  if (userType === 'EMPLOYEE') {
    return await checkEmployeePermission(roleId, permission, req);
  }

  return false;
}
```

#### 4.6.3 Rate Limiting

```javascript
// backend/middleware/portalRateLimit.js

const rateLimit = require('express-rate-limit');

const portalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

module.exports = {
  portalRateLimit,
  strictRateLimit
};
```

### 4.7 Real-time Updates (WebSocket)

```javascript
// backend/services/websocketService.js

const WebSocket = require('ws');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/api/portal/ws' });
    this.clients = new Map(); // userId -> Set of WebSocket connections
    
    this.setup();
  }

  setup() {
    this.wss.on('connection', (ws, req) => {
      // Authenticate connection
      const user = this.authenticateConnection(req);
      if (!user) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      // Store connection
      if (!this.clients.has(user.id)) {
        this.clients.set(user.id, new Set());
      }
      this.clients.get(user.id).add(ws);

      // Handle messages
      ws.on('message', (message) => {
        this.handleMessage(user, ws, message);
      });

      // Handle disconnect
      ws.on('close', () => {
        this.clients.get(user.id)?.delete(ws);
        if (this.clients.get(user.id)?.size === 0) {
          this.clients.delete(user.id);
        }
      });
    });
  }

  // Broadcast to specific user
  broadcastToUser(userId, event, data) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({ event, data });
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  // Broadcast to all technicians
  broadcastToTechnicians(event, data) {
    // Implementation
  }

  // Broadcast to all employees
  broadcastToEmployees(event, data) {
    // Implementation
  }
}

module.exports = WebSocketService;
```

---

## 5. خطة التطوير - Frontend

### 5.1 هيكل الملفات الجديد

```
frontend/react-app/src/
├── pages/
│   ├── technician/
│   │   ├── TechnicianDashboard.js        (محسّن)
│   │   ├── JobsListPage.js               (محسّن)
│   │   ├── JobDetailsPage.js             (محسّن)
│   │   ├── TechnicianProfilePage.js      (محسّن)
│   │   ├── TimeTrackingPage.js           (جديد)
│   │   └── ReportsPage.js                (جديد)
│   └── employee/
│       ├── EmployeeDashboard.js          (جديد)
│       ├── RepairsManagementPage.js       (جديد)
│       ├── CustomersManagementPage.js     (جديد)
│       ├── DevicesManagementPage.js       (جديد)
│       ├── QuotationsPage.js              (جديد)
│       ├── InvoicesPage.js                (جديد)
│       ├── EmployeeProfilePage.js         (جديد)
│       └── ReportsPage.js                 (جديد)
├── components/
│   ├── technician/
│   │   ├── TechnicianHeader.js           (محسّن)
│   │   ├── TechnicianStatsCard.js        (محسّن)
│   │   ├── JobCard.js                     (محسّن)
│   │   ├── JobDetailsView.js              (جديد)
│   │   ├── MediaUploader.js               (جديد)
│   │   ├── PartsRequestForm.js            (جديد)
│   │   └── TimeTrackingWidget.js          (جديد)
│   └── employee/
│       ├── EmployeeHeader.js              (جديد)
│       ├── QuickActionsPanel.js           (جديد)
│       ├── RepairsTable.js                (جديد)
│       ├── CustomerForm.js                (جديد)
│       └── DeviceForm.js                  (جديد)
├── services/
│   ├── technicianService.js               (محسّن)
│   ├── employeeService.js                 (جديد)
│   ├── portalService.js                   (جديد)
│   └── websocketService.js                (جديد)
├── stores/
│   ├── technicianStore.js                 (جديد)
│   ├── employeeStore.js                   (جديد)
│   └── portalStore.js                     (جديد)
└── hooks/
    ├── useTechnician.js                    (جديد)
    ├── useEmployee.js                      (جديد)
    ├── useWebSocket.js                     (جديد)
    └── useTimeTracking.js                  (جديد)
```

### 5.2 State Management (Zustand)

#### 5.2.1 Technician Store

```javascript
// frontend/react-app/src/stores/technicianStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useTechnicianStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        dashboard: null,
        jobs: [],
        currentJob: null,
        stats: null,
        status: 'OFFLINE',
        loading: false,
        error: null,

        // Actions
        setDashboard: (data) => set({ dashboard: data }),
        setJobs: (jobs) => set({ jobs }),
        setCurrentJob: (job) => set({ currentJob: job }),
        updateJob: (jobId, updates) => {
          const jobs = get().jobs.map(job =>
            job.id === jobId ? { ...job, ...updates } : job
          );
          set({ jobs });
        },
        setStatus: (status) => set({ status }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        
        // Reset
        reset: () => set({
          dashboard: null,
          jobs: [],
          currentJob: null,
          stats: null,
          status: 'OFFLINE',
          loading: false,
          error: null
        })
      }),
      {
        name: 'technician-store',
        partialize: (state) => ({
          status: state.status,
          // Don't persist sensitive data
        })
      }
    ),
    { name: 'TechnicianStore' }
  )
);

export default useTechnicianStore;
```

#### 5.2.2 Employee Store

```javascript
// frontend/react-app/src/stores/employeeStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useEmployeeStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        dashboard: null,
        repairs: [],
        customers: [],
        devices: [],
        quotations: [],
        invoices: [],
        loading: false,
        error: null,

        // Actions
        setDashboard: (data) => set({ dashboard: data }),
        setRepairs: (repairs) => set({ repairs }),
        addRepair: (repair) => set((state) => ({
          repairs: [repair, ...state.repairs]
        })),
        updateRepair: (repairId, updates) => {
          const repairs = get().repairs.map(repair =>
            repair.id === repairId ? { ...repair, ...updates } : repair
          );
          set({ repairs });
        },
        setCustomers: (customers) => set({ customers }),
        setDevices: (devices) => set({ devices }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        
        // Reset
        reset: () => set({
          dashboard: null,
          repairs: [],
          customers: [],
          devices: [],
          quotations: [],
          invoices: [],
          loading: false,
          error: null
        })
      }),
      {
        name: 'employee-store'
      }
    ),
    { name: 'EmployeeStore' }
  )
);

export default useEmployeeStore;
```

### 5.3 Custom Hooks

#### 5.3.1 useTechnician Hook

```javascript
// frontend/react-app/src/hooks/useTechnician.js

import { useEffect } from 'react';
import useTechnicianStore from '../stores/technicianStore';
import technicianService from '../services/technicianService';
import { useNotifications } from '../components/notifications/NotificationSystem';

export function useTechnician() {
  const store = useTechnicianStore();
  const notifications = useNotifications();

  // Load dashboard
  const loadDashboard = async () => {
    try {
      store.setLoading(true);
      const data = await technicianService.getDashboard();
      store.setDashboard(data);
    } catch (error) {
      store.setError(error);
      notifications.error('خطأ', { message: 'فشل تحميل البيانات' });
    } finally {
      store.setLoading(false);
    }
  };

  // Load jobs
  const loadJobs = async (filters = {}) => {
    try {
      store.setLoading(true);
      const data = await technicianService.getJobs(filters);
      store.setJobs(data);
    } catch (error) {
      store.setError(error);
      notifications.error('خطأ', { message: 'فشل تحميل المهام' });
    } finally {
      store.setLoading(false);
    }
  };

  // Update job status
  const updateJobStatus = async (jobId, status, notes) => {
    try {
      await technicianService.updateJobStatus(jobId, status, notes);
      store.updateJob(jobId, { status });
      notifications.success('نجح', { message: 'تم تحديث الحالة بنجاح' });
    } catch (error) {
      store.setError(error);
      notifications.error('خطأ', { message: 'فشل تحديث الحالة' });
      throw error;
    }
  };

  // Update status
  const updateStatus = async (status) => {
    try {
      await technicianService.updateStatus(status);
      store.setStatus(status);
      notifications.success('نجح', { message: 'تم تحديث الحالة' });
    } catch (error) {
      store.setError(error);
      notifications.error('خطأ', { message: 'فشل تحديث الحالة' });
    }
  };

  return {
    ...store,
    loadDashboard,
    loadJobs,
    updateJobStatus,
    updateStatus
  };
}
```

#### 5.3.2 useWebSocket Hook

```javascript
// frontend/react-app/src/hooks/useWebSocket.js

import { useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore';

export function useWebSocket(url, onMessage) {
  const wsRef = useRef(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(`${url}?token=${user.token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (user) {
          // Reconnect logic
        }
      }, 5000);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, url, onMessage]);

  const sendMessage = (event, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    }
  };

  return { sendMessage };
}
```

### 5.4 Employee Portal Pages

#### 5.4.1 Employee Dashboard

```javascript
// frontend/react-app/src/pages/employee/EmployeeDashboard.js

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmployeeStore from '../../stores/employeeStore';
import EmployeeHeader from '../../components/employee/EmployeeHeader';
import QuickActionsPanel from '../../components/employee/QuickActionsPanel';
import { useEmployee } from '../../hooks/useEmployee';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { loadDashboard, dashboard, loading } = useEmployee();

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            مرحباً، {dashboard?.user?.name} 👋
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats cards */}
        </div>

        {/* Quick Actions */}
        <QuickActionsPanel />

        {/* Recent Activities */}
        <div>
          {/* Recent repairs, customers, etc. */}
        </div>
      </div>
    </div>
  );
}
```

---

## 6. التكامل مع الموديولات الأخرى

### 6.1 Repairs Module Integration

```javascript
// Integration points:
- Technician can view assigned repairs
- Technician can update repair status
- Technician can add notes to repairs
- Technician can request parts for repairs
- Employee can create new repairs
- Employee can assign technicians to repairs
- Employee can update repair information
```

### 6.2 Inventory Module Integration

```javascript
// Integration points:
- Technician can request spare parts
- Employee can check inventory availability
- Employee can issue parts for repairs
- Real-time inventory updates
- Low stock notifications
```

### 6.3 Finance Module Integration

```javascript
// Integration points:
- Employee can create quotations
- Employee can create invoices
- Employee can view payment status
- Technician can view repair costs
- Financial reports for technicians
```

### 6.4 Notifications Module Integration

```javascript
// Integration points:
- Real-time notifications for new assignments
- Notifications for parts request approval
- Notifications for status changes
- Notifications for important updates
- Email/SMS notifications
```

### 6.5 Reports Module Integration

```javascript
// Integration points:
- Technician performance reports
- Employee activity reports
- Time tracking reports
- Job completion reports
- Financial reports
```

---

## 7. الأمان والصلاحيات

### 7.1 Permission Matrix

#### Technician Permissions:
```javascript
{
  'repairs.view_own': true,
  'repairs.update_own': true,
  'repairs.timeline_update': true,
  'repairs.parts_request': true,
  'repairs.media_upload': true,
  'profile.view_own': true,
  'profile.update_own': true,
  'time_tracking.clock_in': true,
  'time_tracking.clock_out': true,
  'reports.view_own': true
}
```

#### Employee Permissions:
```javascript
{
  'repairs.view': true,
  'repairs.create': true,
  'repairs.update': true,
  'repairs.assign': true,
  'customers.view': true,
  'customers.create': true,
  'customers.update': true,
  'devices.view': true,
  'devices.create': true,
  'devices.update': true,
  'quotations.create': true,
  'quotations.update': true,
  'invoices.create': true,
  'invoices.update': true,
  'profile.view_own': true,
  'profile.update_own': true,
  'time_tracking.clock_in': true,
  'time_tracking.clock_out': true,
  'reports.view': true
}
```

### 7.2 Security Best Practices

1. **Input Validation** - Validate all inputs
2. **SQL Injection Prevention** - Use prepared statements
3. **XSS Prevention** - Sanitize all outputs
4. **CSRF Protection** - Use CSRF tokens
5. **Rate Limiting** - Limit API requests
6. **File Upload Security** - Validate file types and sizes
7. **Password Policy** - Enforce strong passwords
8. **Session Management** - Secure session handling
9. **Audit Logging** - Log all important actions
10. **Error Handling** - Don't expose sensitive information

---

## 8. خطة التنفيذ (Production-Safe)

### Phase 1: Foundation (Week 1-2)
- [ ] Create database tables
- [ ] Set up Service Layer structure
- [ ] Set up Repository Pattern
- [ ] Create basic Employee Routes
- [ ] Set up authentication middleware
- [ ] Set up permission middleware

### Phase 2: Backend Core (Week 3-4)
- [ ] Implement Technician Service
- [ ] Implement Employee Service
- [ ] Implement Portal Service
- [ ] Implement Time Tracking Service
- [ ] Set up WebSocket service
- [ ] Implement file upload handler

### Phase 3: Frontend Core (Week 5-6)
- [ ] Set up State Management (Zustand)
- [ ] Create Employee Portal pages
- [ ] Enhance Technician Portal pages
- [ ] Create shared components
- [ ] Implement WebSocket client
- [ ] Set up error boundaries

### Phase 4: Integration (Week 7-8)
- [ ] Integrate with Repairs module
- [ ] Integrate with Inventory module
- [ ] Integrate with Finance module
- [ ] Integrate with Notifications module
- [ ] Integrate with Reports module

### Phase 5: Security & Testing (Week 9-10)
- [ ] Security audit
- [ ] Performance testing
- [ ] Load testing
- [ ] Security testing
- [ ] User acceptance testing

### Phase 6: Deployment (Week 11-12)
- [ ] Production deployment plan
- [ ] Database migration
- [ ] Feature flags
- [ ] Gradual rollout
- [ ] Monitoring setup
- [ ] Documentation

---

## 9. الاختبار والجودة

### 9.1 Unit Tests

```javascript
// Test files structure:
backend/tests/
├── unit/
│   ├── services/
│   │   ├── technicianService.test.js
│   │   ├── employeeService.test.js
│   │   └── portalService.test.js
│   ├── repositories/
│   │   ├── technicianRepository.test.js
│   │   └── employeeRepository.test.js
│   └── middleware/
│       ├── portalAuthMiddleware.test.js
│       └── portalPermissionMiddleware.test.js
```

### 9.2 Integration Tests

```javascript
// Test files structure:
backend/tests/
├── integration/
│   ├── technicianRoutes.test.js
│   ├── employeeRoutes.test.js
│   └── portalRoutes.test.js
```

### 9.3 E2E Tests

```javascript
// Test files structure:
frontend/tests/
├── e2e/
│   ├── technicianPortal.test.js
│   ├── employeePortal.test.js
│   └── portalIntegration.test.js
```

---

## 10. التوثيق

### 10.1 API Documentation

- OpenAPI/Swagger specification
- Postman collection
- API usage examples

### 10.2 Frontend Documentation

- Component documentation
- Hook documentation
- Store documentation
- Usage examples

### 10.3 Deployment Documentation

- Deployment guide
- Environment variables
- Database migration guide
- Troubleshooting guide

---

## 📝 ملاحظات إضافية

### Production Considerations:
1. **Feature Flags** - Use feature flags for gradual rollout
2. **Database Backups** - Ensure backups before migrations
3. **Monitoring** - Set up monitoring and alerts
4. **Logging** - Comprehensive logging for debugging
5. **Error Tracking** - Use error tracking service (Sentry)
6. **Performance Monitoring** - Monitor API response times
7. **User Feedback** - Collect user feedback during rollout

### Future Enhancements:
1. Mobile App (React Native)
2. Advanced Analytics
3. AI-powered recommendations
4. Voice commands
5. AR/VR support
6. Blockchain for audit trail

---

**آخر تحديث:** 2025-01-27  
**الإصدار:** 1.0.0  
**الحالة:** Planning Phase


