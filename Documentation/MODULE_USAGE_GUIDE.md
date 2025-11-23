# دليل استخدام الموديولات (Frontend + API)

> مرجع عملي موجز لكيفية استخدام كل موديول عبر الواجهة وواجهات الـ API.

## المصادقة (Auth)
- الواجهة: `/login` → أدخل البريد/الهاتف + كلمة المرور.
- API: `POST /api/auth/login` → يعيد كوكي JWT (httpOnly). `GET /api/auth/me` لفحص الجلسة.

## لوحة التحكم (Dashboard)
- الواجهة: `/` + `/integration/workflow` للوحة المتكاملة.
- يعرض إحصائيات عامة ومؤشرات الأداء.

## العملاء (CRM)
- الواجهة: `/customers` → بحث/فلاتر/طرق عرض متعددة.
- API: `GET /api/customers?q=&page=1&pageSize=20`, `GET /api/customers/:id`.

## الشركات (Companies)
- الواجهة: `/companies` (عند التفعيل).
- API: `GET /api/companies` (حقول موجودة فقط).

## طلبات الإصلاح (Repairs)
- الواجهة: `/repairs` و`/repairs/:id`.
- API: `GET /api/repairs`, `GET /api/repairs/:id`, `GET /api/repair-tracking/:repairId/timeline`.
- استخدام الحقول: `customerName`, `deviceType`, `deviceBrand`, `deviceModel`, `issueDescription`.

## الخدمات (Services)
- الواجهة: `/services`.
- API: `GET /api/services?q=` (يعتمد على `serviceName`).

## المخزون (Inventory)
- الواجهة: `/inventory`, `/inventory/stock-movements`, `/inventory/stock-alerts`.
- API: `GET /api/stock-movements`, `GET /api/stock-alerts/low`, `GET /api/reports/inventory-value`.

## الموردون وطلبات الشراء (Vendors & POs)
- الواجهة: `/inventory/suppliers`، `/inventory/orders` (عند التفعيل).
- API: `GET/POST/PUT/DELETE /api/vendors`.

## الفواتير والمدفوعات (Invoices & Payments)
- الواجهة: `/invoices`, `/invoices/:id`.
- API: `GET/POST/PUT/DELETE /api/invoices`, `POST /api/invoices/:id/items`, `GET /api/payments/...`.

## التقارير (Reports)
- الواجهة: `/reports/daily`, `/reports/financial`, `/reports/technician`.
- API: `/api/reports/daily-revenue`, `/monthly-revenue`, `/expenses`, `/profit-loss`, `/technician-performance`, `/inventory-value`, `/pending-payments`.

## الإعدادات المتقدمة (Advanced Settings)
- الواجهة: `/settings/advanced`.
- API: `GET /api/advanced-settings`, `PUT /api/advanced-settings/batch`, `POST /api/advanced-settings/reset`, `GET /api/advanced-settings/export/json`, `POST /api/advanced-settings/import`.

## إدارة المستخدمين والأدوار (Users & Roles)
- الواجهة: `/settings/users`.
- API: `GET/POST/PUT/DELETE /api/users`, `GET /api/roles`.

## الإشعارات الذكية (Smart Notifications)
- الواجهة: `/notifications/smart`.
- API: `GET /api/smart-notifications/user/:userId`, `POST /api/smart-notifications`, `PUT /api/smart-notifications/:id/read`.

## تتبع الإصلاح (Repair Tracking)
- الواجهة: `/repairs/tracking`.
- API: `GET /api/repair-tracking/:repairId/timeline`.

## الطباعة والتصدير
- الواجهة: أزرار طباعة وتصدير في صفحات التقارير والفواتير.

> ملاحظة: تأكد من استخدام المسار الكامل للـ API في الواجهة الأمامية `http://localhost:4000/api/...` مع `credentials: 'include'` عند الحاجة.
