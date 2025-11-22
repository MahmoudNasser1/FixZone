# 🔍 خطة فحص شامل - موديول طلبات الإصلاح
## QA Engineer - Complete Testing Plan

## 📅 التاريخ: 21 نوفمبر 2025

---

## 📋 المرحلة 1: فحص Backend APIs

### 🔧 APIs المطلوب فحصها:

#### 1. **Repairs Module APIs**
- ✅ GET `/api/repairs` - قائمة طلبات الإصلاح
- ✅ GET `/api/repairs/:id` - تفاصيل طلب إصلاح
- ✅ POST `/api/repairs` - إنشاء طلب إصلاح جديد
- ✅ PUT `/api/repairs/:id` - تحديث طلب إصلاح
- ✅ DELETE `/api/repairs/:id` - حذف طلب إصلاح
- ✅ PATCH `/api/repairs/:id/status` - تحديث الحالة
- ✅ PATCH `/api/repairs/:id/details` - تحديث التفاصيل
- ✅ POST `/api/repairs/:id/assign` - تعيين فني
- ✅ GET `/api/repairs/:id/logs` - سجل التغييرات
- ✅ GET `/api/repairs/:id/track` - تتبع الطلب (public)
- ✅ GET `/api/repairs/track/:token` - تتبع بالرمز
- ✅ POST `/api/repairs/:id/rotate-token` - تحديث رمز التتبع
- ✅ GET `/api/repairs/:id/attachments` - المرفقات
- ✅ POST `/api/repairs/:id/attachments` - رفع مرفق
- ✅ DELETE `/api/repairs/:id/attachments/:attachmentId` - حذف مرفق
- ✅ GET `/api/repairs/:id/print/receipt` - طباعة الإيصال
- ✅ GET `/api/repairs/:id/print/invoice` - طباعة الفاتورة
- ✅ GET `/api/repairs/:id/print/inspection` - طباعة الفحص
- ✅ GET `/api/repairs/:id/print/delivery` - طباعة التسليم
- ✅ GET `/api/repairs/:id/print/sticker` - طباعة الملصق

#### 2. **Parts Used APIs**
- ✅ GET `/api/partsused` - قائمة القطع المستخدمة
- ✅ POST `/api/partsused` - إضافة قطعة مستخدمة
- ✅ PUT `/api/partsused/:id` - تحديث قطعة
- ✅ DELETE `/api/partsused/:id` - حذف قطعة

#### 3. **Services APIs**
- ✅ GET `/api/repairrequestservices` - قائمة الخدمات
- ✅ POST `/api/repairrequestservices` - إضافة خدمة
- ✅ PUT `/api/repairrequestservices/:id` - تحديث خدمة
- ✅ DELETE `/api/repairrequestservices/:id` - حذف خدمة

#### 4. **Inventory Integration APIs**
- ✅ POST `/api/inventory/issue` - صرف قطعة لطلب إصلاح
- ✅ POST `/api/inventory-integration/deduct-items` - خصم قطع من المخزون

---

## 📋 المرحلة 2: فحص Frontend

### 🔧 الصفحات المطلوب فحصها:

1. **RepairsPage.js** - الصفحة الرئيسية لطلبات الإصلاح
   - عرض القائمة
   - البحث والفلترة
   - Multi-select
   - Pagination
   - Sorting

2. **RepairDetailsPage.js** - صفحة تفاصيل الطلب
   - عرض البيانات
   - تحديث الحالة
   - إضافة/تعديل ملاحظات
   - إضافة قطع
   - إضافة خدمات
   - إدارة المرفقات
   - الطباعة (Receipt, Invoice, Inspection, Delivery, Sticker)
   - تعيين فني
   - عرض السجل

3. **Repairs Tracking Page** - صفحة تتبع الطلب (public)

---

## 📋 المرحلة 3: فحص الترابطات

### 🔗 الترابطات مع الموديولات الأخرى:

1. **Inventory Module**
   - خصم المخزون عند إضافة قطع
   - عرض المخزون المتاح
   - تحذيرات نقص المخزون

2. **Invoices Module**
   - إنشاء فاتورة تلقائياً
   - ربط القطع بالفاتورة
   - ربط الخدمات بالفاتورة

3. **Customers Module**
   - ربط الطلب بالعميل
   - تحديث بيانات العميل
   - تتبع تاريخ الأجهزة

4. **Services Module**
   - إضافة خدمات للطلب
   - حساب تكلفة الخدمات

---

## 🎯 معايير الفحص:

### ✅ **Functional Testing**
- ✅ جميع APIs تعمل بشكل صحيح
- ✅ Validation يعمل
- ✅ Error handling صحيح
- ✅ Transactions تعمل بشكل صحيح

### ✅ **Integration Testing**
- ✅ التكامل مع Inventory
- ✅ التكامل مع Invoices
- ✅ التكامل مع Customers
- ✅ التكامل مع Services

### ✅ **UI/UX Testing**
- ✅ الواجهة تعمل بشكل صحيح
- ✅ Responsive design
- ✅ Loading states
- ✅ Error messages واضحة

### ✅ **Performance Testing**
- ✅ Response time
- ✅ Database queries optimization

---

## 📊 خطة التنفيذ:

1. ✅ إنشاء خطة الفحص
2. ⏳ فحص Backend APIs (Postman/curl)
3. ⏳ فحص Frontend (Chrome DevTools)
4. ⏳ فحص الترابطات
5. ⏳ إنشاء تقرير شامل
6. ⏳ إصلاح المشاكل المكتشفة

---

**الحالة:** ⏳ جاري التنفيذ
