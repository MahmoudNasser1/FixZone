# 🚀 دليل البدء السريع - Technician Portal

## 🎯 نظرة عامة
بوابة إلكترونية للفنيين لإدارة أجهزتهم وتحديث حالات الإصلاح.

---

## 📋 المتطلبات

### Backend
```bash
cd backend
npm install
node server.js
```
**Port:** 4000

### Frontend
```bash
cd frontend/react-app
npm install
npm start
```
**Port:** 3000

---

## 👤 تسجيل الدخول

### حساب الفني الاختباري
```
Email: tech1@fixzone.com
Password: tech123
```

### عبر واجهة المستخدم
1. افتح: http://localhost:3000/login
2. أدخل البريد الإلكتروني وكلمة المرور
3. اضغط "تسجيل الدخول"
4. سيتم توجيهك تلقائياً إلى: `/tech/dashboard`

---

## 🎨 الواجهات المتاحة

### 1. Dashboard - `/tech/dashboard`
**الميزات:**
- عرض إجمالي الأجهزة المسندة
- توزيع الأجهزة حسب الحالة
- إحصائيات اليوم

**الوصول:**
```javascript
// GET /api/tech/dashboard
Response: {
  totalJobs: 5,
  byStatus: [...],
  todayUpdated: 2
}
```

---

### 2. Jobs List - `/tech/jobs`
**الميزات:**
- قائمة جميع الأجهزة المسندة للفني
- Filter حسب الحالة
- Search بالاسم أو رقم التتبع
- عرض معلومات سريعة (العميل، الجهاز، الحالة)

**الوصول:**
```javascript
// GET /api/tech/jobs?status=UNDER_REPAIR
Response: {
  success: true,
  data: [...]
}
```

---

### 3. Job Details - `/tech/jobs/:id`
**الميزات:**
- تفاصيل كاملة للجهاز
- معلومات العميل
- Timeline للتحديثات
- معرض الوسائط (صور/فيديوهات)
- Quick Actions (تحديث الحالة، إضافة ملاحظة، رفع وسائط)

**الأقسام:**

#### أ. معلومات الجهاز
- نوع الجهاز
- الموديل
- المشكلة المبلغ عنها
- تاريخ الاستلام

#### ب. معلومات العميل
- الاسم
- رقم الهاتف
- البريد الإلكتروني

#### ج. Timeline
- تحديثات الحالة
- ملاحظات الفني
- سجل الوسائط

#### د. Media Gallery
- صور/فيديوهات قبل الإصلاح
- صور/فيديوهات أثناء الإصلاح
- صور/فيديوهات بعد الإصلاح
- صور قطع الغيار
- مستندات إثبات

---

## 🔧 العمليات المتاحة

### 1. تحديث حالة الجهاز

**الخطوات:**
1. افتح تفاصيل الجهاز
2. اضغط "تحديث الحالة" من Quick Actions
3. اختر الحالة الجديدة:
   - `RECEIVED` - تم الاستلام
   - `INSPECTION` - قيد الفحص
   - `AWAITING_APPROVAL` - في انتظار الموافقة
   - `UNDER_REPAIR` - قيد الإصلاح
   - `WAITING_PARTS` - في انتظار قطع غيار
   - `ON_HOLD` - معلق
   - `READY_FOR_DELIVERY` - جاهز للتسليم
   - `COMPLETED` - مكتمل
   - `DELIVERED` - تم التسليم
   - `REJECTED` - مرفوض
4. أضف ملاحظة (اختياري)
5. اضغط "تحديث"

**API:**
```bash
PUT /api/tech/jobs/:id/status
{
  "status": "COMPLETED",
  "notes": "تم الإصلاح بنجاح"
}
```

---

### 2. إضافة ملاحظة

**الخطوات:**
1. افتح تفاصيل الجهاز
2. اضغط "إضافة ملاحظة" من Quick Actions
3. اكتب الملاحظة
4. اضغط "حفظ"

**API:**
```bash
POST /api/tech/jobs/:id/notes
{
  "note": "تم فحص الجهاز - يحتاج إلى شريحة شحن"
}
```

---

### 3. رفع وسائط

**الخطوات:**
1. افتح تفاصيل الجهاز
2. اضغط "رفع وسائط" من Quick Actions أو من Media Gallery
3. أدخل:
   - **رابط الملف:** URL للصورة/فيديو (من ImgBB, Cloudinary, إلخ)
   - **نوع الملف:** صورة / فيديو / مستند
   - **التصنيف:**
     - `BEFORE` - قبل الإصلاح
     - `DURING` - أثناء الإصلاح
     - `AFTER` - بعد الإصلاح
     - `PARTS` - قطع غيار
     - `EVIDENCE` - إثبات
   - **الوصف:** (اختياري)
4. اضغط "رفع"

**API:**
```bash
POST /api/tech/jobs/:id/media
{
  "fileUrl": "https://example.com/image.jpg",
  "fileType": "IMAGE",
  "category": "BEFORE",
  "description": "صورة الجهاز قبل الإصلاح"
}
```

---

### 4. عرض معرض الوسائط

**الخطوات:**
1. افتح تفاصيل الجهاز
2. انزل إلى قسم "معرض الوسائط"
3. استخدم Filters لعرض فئة معينة:
   - الكل
   - BEFORE
   - DURING
   - AFTER
   - PARTS
   - EVIDENCE
4. اضغط على أي صورة/فيديو للمعاينة في Lightbox

**API:**
```bash
GET /api/tech/jobs/:id/media
```

---

## 🔐 الصلاحيات المطلوبة

لكي يعمل Portal بشكل صحيح، يجب أن يملك الفني (roleId = 3) الصلاحيات التالية:

```json
{
  "repairs.view_own": true,
  "repairs.update_own": true,
  "repairs.timeline_update": true,
  "repairs.parts_request": true,
  "repairs.media_upload": true,
  "devices.view_own": true
}
```

> تم تقييد جميع مسارات `/api/tech/*` لدور الفني فقط عبر `authorizeMiddleware([3,'Technician'])`.

---

## 🗃️ Database Schema Updates

### 1. AuditLog
```sql
ALTER TABLE AuditLog MODIFY COLUMN actionType 
ENUM('CREATE','UPDATE','DELETE','LOGIN','note','media','status_change') DEFAULT NULL;
```

### 2. RepairRequest
```sql
ALTER TABLE RepairRequest MODIFY COLUMN status 
ENUM('RECEIVED','INSPECTION','AWAITING_APPROVAL','UNDER_REPAIR',
     'READY_FOR_DELIVERY','DELIVERED','COMPLETED','REJECTED',
     'WAITING_PARTS','ON_HOLD') DEFAULT 'RECEIVED';
```

### 3. SparePartRequest (جديد)
```sql
CREATE TABLE IF NOT EXISTS SparePartRequest (
  id INT AUTO_INCREMENT PRIMARY KEY,
  repairRequestId INT NOT NULL,
  partName VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  status ENUM('PENDING','APPROVED','REJECTED','ORDERED','RECEIVED') DEFAULT 'PENDING',
  requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  requestedById INT NOT NULL,
  notes TEXT NULL,
  expectedPrice DECIMAL(10,2) NULL,
  approvedById INT NULL,
  approvedAt DATETIME NULL
);
```

> راجع ملفات الهجرة: `migrations/08_TECHNICIAN_PORTAL_UPDATES.sql` و `migrations/09_SPARE_PART_REQUEST.sql`.

---

## 📱 واجهة المستخدم

### الألوان
- **Primary:** Indigo (#6366F1)
- **Success:** Green (#10B981)
- **Warning:** Amber (#F59E0B)
- **Error:** Red (#EF4444)
- **Info:** Blue (#3B82F6)

### الحالات
| Status | Color | Icon |
|--------|-------|------|
| RECEIVED | Blue | 📦 |
| INSPECTION | Purple | 🔍 |
| AWAITING_APPROVAL | Yellow | ⏳ |
| UNDER_REPAIR | Indigo | 🔧 |
| WAITING_PARTS | Orange | 📦 |
| ON_HOLD | Gray | ⏸️ |
| READY_FOR_DELIVERY | Green | ✅ |
| COMPLETED | Green | 🎉 |
| DELIVERED | Green | 🚚 |
| REJECTED | Red | ❌ |

---

## 🆕 تحديثات Sprint 3 (منجزة)
- ✅ تغيير كلمة مرور الفني إلى 8 أرقام على الأقل (تم تحديث Bcrypt)
- ✅ إنشاء واجهة طلب قطع الغيار ودمجها في `JobDetailsPage`
- ✅ إنشاء جدول `SparePartRequest` وربطه
- ✅ تقييد مسارات `/api/tech/*` على دور الفني فقط
- ✅ تقليل صلاحيات دور الفني لأدنى مجموعة لازمة

---

## 🐛 استكشاف الأخطاء

### 1. "Access denied: Insufficient permissions"
**الحل:** تأكد من صلاحيات Role 3 كما في القسم أعلاه.

### 2. "No token, authorization denied"
**الحل:** تأكد من تسجيل الدخول بنجاح وتفعيل الكوكيز.

### 3. أخطاء ENUM
**الحل:** نفّذ أو تأكد من تطبيق ملفات الهجرة المذكورة.

---

## 📞 الدعم

- الخطة الشاملة: `TECHNICIAN_PORTAL_COMPREHENSIVE_PLAN.md`
- نتائج الاختبارات: `TECHNICIAN_PORTAL_SPRINT_1_2_TEST_RESULTS.md`
- الملخص: `TESTING_SUMMARY.md`


