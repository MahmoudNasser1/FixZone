# 🔐 خطة اختبار نظام إدارة الأدوار والصلاحيات - FixZone ERP
## Roles & Permissions System Testing Plan

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI)  
**الحالة:** 🧪 **جاهز للاختبار**

---

## 📋 نظرة عامة

تم إكمال تطوير نظام إدارة الأدوار والصلاحيات المتكامل. هذا الملف يوضح خطة الاختبار الشاملة للنظام.

---

## ✅ ما تم إنجازه

### 1. **Database (Migration)**
- ✅ تحديث Role table (description, isSystem, isActive)
- ✅ إضافة Customer Role (ID: 8)
- ✅ ربط Customer بـ User (customerId, userId)
- ✅ إنشاء Permission table (48 permissions)
- ✅ تحديث permissions للأدوار الموجودة

### 2. **Backend**
- ✅ تحسين rolesController (db.execute + validation)
- ✅ إنشاء permissionMiddleware (permission checking + inheritance)
- ✅ تحسين authorizeMiddleware (role isActive checking)
- ✅ إنشاء customerAuthController (login + profile)

### 3. **Frontend**
- ✅ تحسين RolesPermissionsPage (CRUD + Permission management UI)
- ✅ إنشاء Customer Login Page
- ✅ إنشاء Customer Dashboard
- ✅ إضافة Routes للـ Customer Portal

---

## 🧪 خطة الاختبار

### Phase 1: Database & Migration Testing

#### Test 1.1: Role Table Schema
- [ ] التحقق من وجود columns: description, isSystem, isActive
- [ ] التحقق من Customer Role (ID: 8) موجود
- [ ] التحقق من ربط Customer بـ User (customerId, userId columns)
- [ ] التحقق من Permission table موجود (48 permissions)

**Expected:**
- جميع Columns موجودة
- Customer Role موجود مع permissions صحيحة
- Foreign keys صحيحة

#### Test 1.2: Default Roles & Permissions
- [ ] التحقق من Admin Role (all: true)
- [ ] التحقق من Manager permissions
- [ ] التحقق من Technician permissions
- [ ] التحقق من Receptionist (User) permissions
- [ ] التحقق من Customer permissions

**Expected:**
- Admin لديه `all: true`
- الأدوار الأخرى لديها permissions محددة

---

### Phase 2: Backend API Testing

#### Test 2.1: Roles API (Admin Only)
- [ ] `GET /api/roles` - قائمة الأدوار
- [ ] `GET /api/roles/:id` - تفاصيل دور
- [ ] `POST /api/roles` - إنشاء دور جديد
- [ ] `PUT /api/roles/:id` - تحديث دور
- [ ] `DELETE /api/roles/:id` - حذف دور (soft delete)

**Test Cases:**
1. Admin يمكنه الوصول لجميع endpoints
2. غير Admin لا يمكنه الوصول (403)
3. لا يمكن حذف system roles
4. لا يمكن حذف roles مرتبطة بـ users
5. Validation يعمل بشكل صحيح

#### Test 2.2: Permission Middleware
- [ ] `checkPermission('repairs.view')` يعمل
- [ ] `checkPermission('repairs.view_own')` يعمل
- [ ] Admin لديه كل الصلاحيات
- [ ] Inheritance من parentRoleId يعمل
- [ ] `checkAnyPermission` يعمل
- [ ] `checkAllPermissions` يعمل

**Test Cases:**
1. User مع permission يمكنه الوصول
2. User بدون permission يحصل على 403
3. Admin يمكنه الوصول لكل شيء
4. Inheritance من parent role يعمل

#### Test 2.3: Customer Authentication
- [ ] `POST /api/auth/customer/login` - تسجيل دخول عميل
- [ ] `GET /api/auth/customer/profile` - بيانات العميل
- [ ] `PUT /api/auth/customer/profile` - تحديث بيانات العميل
- [ ] `POST /api/auth/customer/change-password` - تغيير كلمة المرور

**Test Cases:**
1. Customer يمكنه تسجيل الدخول بـ phone أو email
2. Customer لا يمكنه الوصول لبيانات عملاء آخرين
3. Customer يمكنه تحديث بياناته فقط
4. Customer يمكنه تغيير كلمة المرور

---

### Phase 3: Frontend Testing

#### Test 3.1: RolesPermissionsPage (Admin)
- [ ] عرض قائمة الأدوار
- [ ] البحث عن أدوار
- [ ] إنشاء دور جديد
- [ ] تعديل دور موجود
- [ ] حذف دور
- [ ] إدارة الصلاحيات (Permissions Modal)
- [ ] Protection للـ system roles

**Test Cases:**
1. الصفحة تعمل بشكل صحيح
2. CRUD operations تعمل
3. Permission management UI يعمل
4. System roles محمية من التعديل/الحذف

#### Test 3.2: Customer Portal
- [ ] Customer Login Page يعمل
- [ ] Customer Dashboard يعرض البيانات
- [ ] Routes protection يعمل
- [ ] Customer لا يمكنه الوصول لصفحات Admin

**Test Cases:**
1. Customer يمكنه تسجيل الدخول
2. Dashboard يعرض repairs, invoices, devices الخاصة به
3. Customer لا يمكنه الوصول لصفحات Admin/Staff
4. Logout يعمل بشكل صحيح

---

### Phase 4: Integration Testing

#### Test 4.1: End-to-End Role Management
1. Admin يسجل الدخول
2. Admin يذهب لـ `/admin/roles`
3. Admin ينشئ دور جديد
4. Admin يضيف permissions للدور
5. Admin ينشئ user مع هذا الدور
6. User الجديد يسجل الدخول
7. User يمكنه الوصول فقط للـ permissions المحددة

**Expected:**
- جميع الخطوات تعمل بدون أخطاء
- Permissions تعمل بشكل صحيح

#### Test 4.2: End-to-End Customer Flow
1. Admin ينشئ Customer
2. Admin ينشئ User account للـ Customer
3. Admin يربط User بـ Customer
4. Customer يسجل الدخول
5. Customer يرى بياناته فقط
6. Customer يرى repairs/invoices/devices الخاصة به فقط

**Expected:**
- Customer يمكنه تسجيل الدخول
- Customer يرى بياناته فقط
- Customer لا يرى بيانات عملاء آخرين

---

## 🧪 Test Scenarios

### Scenario 1: Create Custom Role
1. Admin يسجل الدخول
2. Admin يذهب لـ `/admin/roles`
3. Admin ينقر "إضافة دور جديد"
4. Admin يدخل:
   - Name: "Supervisor"
   - Description: "مشرف إصلاحات"
   - Permissions: repairs.view_all, repairs.update, invoices.view_all
5. Admin يحفظ
6. التحقق: الدور الجديد موجود في القائمة

**Expected Result:** ✅ الدور يتم إنشاؤه بنجاح

### Scenario 2: Assign Role to User
1. Admin يسجل الدخول
2. Admin يذهب لـ `/users`
3. Admin يعدل user
4. Admin يختار دور "Supervisor"
5. Admin يحفظ
6. User الجديد يسجل الدخول
7. User يذهب لـ `/repairs`
8. التحقق: User يرى جميع الإصلاحات (repairs.view_all)

**Expected Result:** ✅ User يمكنه رؤية جميع الإصلاحات

### Scenario 3: Customer Login & Access
1. Customer يسجل الدخول على `/customer/login`
2. Customer يدخل phone/email + password
3. Customer يذهب لـ `/customer/dashboard`
4. التحقق: Customer يرى:
   - طلبات الإصلاح الخاصة به فقط
   - فواتيره فقط
   - أجهزته فقط
5. Customer يحاول الوصول لـ `/repairs` (admin route)
6. التحقق: Customer يتم redirect لـ `/customer/dashboard`

**Expected Result:** ✅ Customer يرى بياناته فقط ولا يمكنه الوصول لصفحات Admin

### Scenario 4: Permission Inheritance
1. Admin ينشئ Role "Junior Technician" مع parentRoleId = 3 (Technician)
2. Admin يعطي Junior Technician permissions: repairs.view_own
3. Parent Role (Technician) لديه: repairs.view_all
4. User مع Junior Technician يحاول الوصول لـ repairs
5. التحقق: User يمكنه رؤية repairs.view_all (inherited من parent)

**Expected Result:** ✅ Inheritance يعمل بشكل صحيح

---

## 🔍 Testing Checklist

### Database Tests
- [ ] Role table schema صحيح
- [ ] Customer Role موجود
- [ ] Permissions محدثة بشكل صحيح
- [ ] Foreign keys صحيحة

### Backend API Tests
- [ ] Roles CRUD APIs تعمل
- [ ] Permission middleware يعمل
- [ ] Customer authentication يعمل
- [ ] Authorization يعمل بشكل صحيح

### Frontend Tests
- [ ] RolesPermissionsPage تعمل
- [ ] Customer Portal يعمل
- [ ] Routes protection يعمل
- [ ] UI responsive و functional

### Integration Tests
- [ ] End-to-end role management
- [ ] End-to-end customer flow
- [ ] Permission checking في جميع صفحات النظام

---

## 📝 Test Results Template

```markdown
### Test: [Test Name]
**Date:** YYYY-MM-DD  
**Tester:** [Name]  
**Status:** ✅ Pass / ❌ Fail / ⚠️ Warning

**Steps:**
1. ...
2. ...

**Expected:**  
...

**Actual:**  
...

**Notes:**  
...
```

---

## 🚀 Ready for Testing

**النظام جاهز للاختبار!**

يمكن البدء في الاختبارات التالية:
1. Database verification
2. Backend API testing
3. Frontend testing
4. Integration testing

---

**الحالة:** 🧪 **جاهز للاختبار**

