# خطة اختبار شاملة لنظام FixZone ERP

> هذا المستند يعرّف خطة اختبار عملية ومقسمة حسب الموديول لتغطية: الواجهة الخلفية (APIs)، الواجهة الأمامية (React)، تجربة المستخدم UI/UX، والترابط بين الموديولز. يعتمد على الوثائق: `UI_UX_Plan.md`, `erp_fix_zone_project_details.md`, `DEVELOPMENT_PLAN_WEEK.md`, `AUTH_DOCUMENTATION.md`, `PROJECT_STRUCTURE.md`, `COMPLETE_DEVELOPMENT_PLAN.md`، بالإضافة إلى الفحص العملي للنظام.

## 1) بيئة الاختبار
- Backend: Node.js + Express على `http://localhost:3001`
- Frontend: React على `http://localhost:3000`
- Database: MySQL (اسم القاعدة `FZ`)
- حساب اختبار: admin@fixzone.com / password
- المتصفحات: Chrome/Edge أحدث إصدار
- بيانات أولية: استخدام سكريبت القاعدة `FIXZONE_DATABASE_COMPLETE.sql`

## 2) مبادئ عامة للاختبار
- تغطية Happy Path + Edge Cases + Failure Modes
- تأكيد اتساق مخطط الاستجابة: `{ success, data | error }`
- التحقق من المصادقة والتخويل في جميع المسارات المحمية
- UI/UX: دعم RTL والعربية، بساطة واجهة، خلفية بيضاء مع لمسات خضراء/زرقاء، تباين جيد ووضوح خطوط [[memory:8293509]] [[memory:8293504]]
- قابلية الاستخدام: استجابة على الشاشات الصغيرة، حالات عدم وجود بيانات، مؤشرات تحميل، ورسائل توست واضحة

## 3) حالات اختبار غير وظيفية
- الأداء: زمن استجابة < 300ms للعمليات البسيطة، < 1.5s للثقيلة، اختبار N+1
- الأمن: JWT في `httpOnly cookie`، فحص المسارات المحمية، RCE/SQLi/XSS أساسي
- الموثوقية: التعامل مع أخطاء DB و500 بإرجاع JSON مفهوم
- الوصول: أدوار وصلاحيات (Admin/Technician/Reception)
- إمكانية الوصول: تباين، أدوار ARIA أساسية، تنقل لوحة المفاتيح

---

## 4) خطة اختبار حسب الموديول

### 4.1 المصادقة (Auth)
- Backend
  - POST `/api/auth/login`: بريد/هاتف + كلمة مرور صحيحة/خاطئة
  - GET `/api/auth/me`: مع/بدون الكوكي + أدوار
- Frontend
  - شاشة الدخول: التحقق من التوجيه بعد الدخول، رسائل الخطأ، تذكرني (لاحقاً)
- UI/UX
  - RTL، رسائل واضحة، منع تعدد الإرسال Loading state
- ترابط
  - ظهور اسم المستخدم وصلاحيات القوائم بعد الدخول

قبول: نجاح الدخول يعيد توكن كوكي ويظهر لوحة التحكم؛ الطلبات المحمية تعود 401 بدون كوكي.

### 4.2 لوحة التحكم (Dashboard)
- Backend: بيانات البطاقات، الرسوم، تنبيهات
- Frontend: عرض البطاقات والمخططات بدون انهيار عند بيانات صفرية
- UI/UX: سرعة التحميل، skeletons، ألوان دلالية ثابتة
- ترابط: الأرقام تتسق مع تقارير اليومي

### 4.3 إدارة العملاء (CRM)
- Backend
  - GET `/api/customers` مع `q`, pagination
  - GET `/api/customers/:id`
- Frontend: عرض متعدد (بطاقات/جدول/قائمة/شبكي)، بحث لا ينهار مع أسماء مركبة أو ناقصة
- UI/UX: ظهور الاسم من `firstName + lastName` عند غياب `name`
- ترابط: تصفية طلبات الإصلاح حسب العميل من URL

### 4.4 الشركات (Companies)
- Backend: GET `/api/companies` (حقول موجودة فقط)
- Frontend: قائمة/تفاصيل (عند تفعيلها)
- ترابط: ربط عميل بشركة (لاحقاً)

### 4.5 طلبات الإصلاح (Repairs)
- Backend
  - GET `/api/repairs` مع فلاتر الحالة/العميل
  - GET `/api/repairs/:id`
  - GET `/api/repair-tracking/:repairId/timeline`
- Frontend: الجدول + تفاصيل مع timeline
- UI/UX: خرائط حالة متسقة (pending, in-progress, on-hold, completed, cancelled)
- ترابط: إنشاء فاتورة من طلب وإظهارها بالتقارير

قبول: لا توجد أعمدة مفقودة؛ الحقول: `customerName`, `deviceType`, `deviceBrand`, `deviceModel`, `issueDescription` صحيحة.

### 4.6 الخدمات (Services)
- Backend: GET `/api/services` (بحث بـ `serviceName`)
- Frontend: عرض وفلاتر
- قبول: لا 500 بسبب أسماء أعمدة خاطئة

### 4.7 المخزون (Inventory)
- Backend
  - GET `/api/reports/inventory-value`
  - GET `/api/stock-movements`، item/daily
  - GET `/api/stock-alerts/low`, `/api/stock-alerts/reorder-suggestions`, `/api/stock-alerts/settings`
- Frontend
  - `InventoryPage`: استيراد/تصدير، تحديث بعد الاستيراد
  - `StockMovementPage`: أيقونات الأنواع (دخول/خروج/نقل/تسوية)، بحث وفلاتر
  - `StockAlertsPage`: تبويبات (تنبيهات/اقتراحات/إعدادات)
- UI/UX: بطاقات ملخص، ألوان تحذيرية، حالات فارغة
- ترابط: خصم/إضافة عند عمليات الإصلاح والشراء

قبول: لا أخطاء استيراد؛ استدعاءات الإشعارات لا تعود HTML؛ استجابات JSON سليمة.

### 4.8 الموردون وطلبات الشراء (Vendors & POs)
- Backend: `/api/vendors` CRUD، تفعيل `isActive`
- Frontend: قائمة الموردين، إنشاء/تعديل، طلبات شراء (عند تفعيلها)
- ترابط: استلام يؤدي لزيادة المخزون

### 4.9 الفواتير والمدفوعات (Invoices & Payments)
- Backend
  - Invoices: قائمة/تفاصيل/إضافة عنصر/من طلب
  - Payments: إنشاء/تعديل/حذف/إحصائيات/Overdue
- Frontend: صفحات الفواتير + PaymentModal
- UI/UX: إجماليات، ضرائب، متبقي، طباعة
- ترابط: تغيير حالة الطلب عند إنشاء فاتورة، وإحصائيات التقارير تتأثر بالمدفوعات

قبول: لا أعمدة مفقودة (`amountPaid` غير مستخدمة)، حساب `totalPaid` من جدول Payment.

### 4.10 التقارير (Reports)
- Backend: daily-revenue, monthly-revenue, expenses, profit-loss, technician-performance, inventory-value, pending-payments
- Frontend: DailyReportsPage, FinancialReportsPage, TechnicianReportsPage
- ترابط: أرقام dashboard توافق التقارير اليومية

### 4.11 الإعدادات المتقدمة (Advanced Settings)
- Backend: get/batch-update/reset/export/import
- Frontend: تبويبات حسب الفئات مع حفظ/استرجاع
- قبول: استخدام `http://localhost:3001/api/...` و`credentials: 'include'`

### 4.12 إدارة المستخدمين والأدوار (Users & Roles)
- Backend: `/api/users`, `/api/roles`
- Frontend: CRUD مستخدمين، تغيير كلمة المرور، صلاحيات
- قبول: البحث بالاسم المركب (firstName + lastName)، إزالة الحقول غير الموجودة من الاستعلامات

### 4.13 الإشعارات الذكية (Smart Notifications)
- Backend: إنشاء/جلب/وضع مقروء
- Frontend: عرض/تمييز/إجراءات
- قبول: الحقول غير الموجودة تُعاد كـ NULL وليس 500

### 4.14 تتبع الإصلاح (Repair Tracking)
- Backend: timeline + تفاصيل مبسطة بدون JOINs معطلة
- Frontend: عرض تفاعلي للجدول الزمني

### 4.15 التكاملات (Workflow/Inventory/Financial)
- Backend: نقاط تكامل Placeholder + منطق أساسي
- Frontend: WorkflowDashboard
- قبول: استدعاءات ترجع JSON صحيح؛ عدم انهيار الواجهة

### 4.16 الطباعة والتصدير
- Frontend: PDF/Excel للتقارير والفواتير
- قبول: تنسيقات صحيحة واتجاه RTL

---

## 5) بيانات اختبار نموذجية (Examples)
- تسجيل الدخول:
  - curl -X POST `http://localhost:3001/api/auth/login`
- استعلام إصلاحات:
  - GET `http://localhost:3001/api/repairs?q=iphone&page=1&pageSize=10`
- إنشاء دفعة:
  - POST `http://localhost:3001/api/payments`

## 6) معايير القبول العامة
- لا توجد استجابة HTML لطلب API (منع `<!DOCTYPE`)
- لا توجد أعمدة غير موجودة في SELECT/WHERE/ORDER BY
- توحيد الزمن/التوست/حالات عدم وجود بيانات
- جميع المسارات المحمية تتطلب كوكي JWT

## 7) جدول الاختبار والتنفيذ
- الأسبوع 1: Auth, Dashboard, CRM
- الأسبوع 2: Repairs, Services, Inventory
- الأسبوع 3: Vendors/POs, Invoices, Payments
- الأسبوع 4: Reports, Settings, Users & Roles
- الأسبوع 5: Smart Notifications, Repair Tracking, Integrations, Printing

## 8) نواتج الاختبار
- تقارير عيوب مصنفة حسب الموديول
- قائمة الإصلاحات المنفذة
- توصيات تحسين وأولويات التنفيذ
