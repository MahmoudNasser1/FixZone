# 🔐 دليل اختبار نظام إدارة الأدوار والصلاحيات - FixZone ERP
## Testing Guide - Roles & Permissions System

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI)  
**الحالة:** 🧪 **جاهز للاختبار**

---

## 🎯 نظرة عامة

هذا الدليل يوضح كيفية اختبار نظام إدارة الأدوار والصلاحيات المتكامل خطوة بخطوة.

---

## 🔧 الإعداد المطلوب

### 1. تشغيل الخوادم
```bash
# Backend
cd /opt/lampp/htdocs/FixZone/backend
npm start

# Frontend
cd /opt/lampp/htdocs/FixZone/frontend/react-app
npm start
```

### 2. إنشاء Customer Account للاختبار
```sql
-- في MySQL
USE FZ;

-- 1. إنشاء Customer
INSERT INTO Customer (name, phone, email, address) 
VALUES ('عميل اختبار', '01000000000', 'customer@test.com', 'عنوان اختبار');

-- 2. إنشاء User للـ Customer
-- Password: "password123" (hashed)
INSERT INTO User (name, email, password, roleId, customerId, isActive) 
VALUES (
  'عميل اختبار',
  'customer@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  8, -- Customer Role ID
  LAST_INSERT_ID(), -- Customer ID
  1
);

-- 3. ربط Customer بـ User
UPDATE Customer 
SET userId = LAST_INSERT_ID() 
WHERE email = 'customer@test.com';
```

---

## 🧪 الاختبارات المطلوبة

### Test 1: RolesPermissionsPage (Admin) ✅

**URL:** `http://localhost:3000/admin/roles`

**Steps:**
1. سجّل الدخول كـ Admin (`/login`)
2. اذهب لـ `/admin/roles`
3. تحقق من:
   - ✅ عرض 6 أدوار (Admin, Manager, Technician, Receptionist, User, Customer)
   - ✅ كل دور يعرض name, description, permissions count
   - ✅ System roles (Admin, Manager, Technician, Receptionist, Customer) لديها badge "نظامي"
   - ✅ البحث يعمل

**Expected:**
- الصفحة تعمل بشكل صحيح
- جميع الأدوار موجودة

---

### Test 2: Create Role ✅

**Steps:**
1. في `/admin/roles`، انقر "إضافة دور جديد"
2. أدخل:
   - Name: "Supervisor"
   - Description: "مشرف إصلاحات"
   - Parent Role: لا شيء
   - Active: ✅
3. انقر "حفظ"
4. التحقق: الدور الجديد موجود في القائمة

**Expected:**
- ✅ الدور يتم إنشاؤه بنجاح
- ✅ Notification "تم إنشاء الدور بنجاح"
- ✅ الدور الجديد يظهر في القائمة

---

### Test 3: Manage Permissions ✅

**Steps:**
1. في `/admin/roles`، انقر "الصلاحيات" على أي دور
2. Permissions Modal يفتح
3. جرب:
   - تحديد/إلغاء صلاحية واحدة
   - "تحديد الكل" لموديول معين
   - "إلغاء الكل" لموديول معين
4. انقر "حفظ الصلاحيات"
5. التحقق: الصلاحيات تم حفظها

**Expected:**
- ✅ Modal يفتح ويعرض جميع الصلاحيات
- ✅ Toggle يعمل بشكل صحيح
- ✅ حفظ الصلاحيات يعمل
- ✅ Changes تظهر في الدور

---

### Test 4: Edit Role ✅

**Steps:**
1. في `/admin/roles`، انقر "تعديل" على دور (غير system role)
2. Edit Modal يفتح
3. غيّر:
   - Name
   - Description
   - Parent Role
   - Active status
4. انقر "حفظ"
5. التحقق: التغييرات تم حفظها

**Expected:**
- ✅ Edit Modal يفتح مع البيانات الصحيحة
- ✅ التعديل يعمل بشكل صحيح
- ✅ System roles لا يمكن تعديلها

---

### Test 5: Delete Role ✅

**Steps:**
1. في `/admin/roles`، انقر "حذف" على دور (غير system role)
2. Delete Confirmation Modal يفتح
3. انقر "حذف"
4. التحقق: الدور تم حذفه (soft delete)

**Test Cases:**
- ✅ حذف دور عادي يعمل
- ❌ حذف system role يفشل (403)
- ❌ حذف role مرتبط بـ users يفشل (409)

**Expected:**
- ✅ Soft delete يعمل
- ✅ Protection للـ system roles يعمل
- ✅ Protection للـ roles المرتبطة بـ users يعمل

---

### Test 6: Customer Login ✅

**URL:** `http://localhost:3000/customer/login`

**Steps:**
1. افتح `/customer/login`
2. أدخل:
   - Login Identifier: `customer@test.com` أو `01000000000`
   - Password: `password123`
3. انقر "تسجيل الدخول"
4. التحقق: Redirect إلى `/customer/dashboard`

**Test Cases:**
- ✅ Login بـ email يعمل
- ✅ Login بـ phone يعمل
- ❌ Login بكلمة مرور خاطئة يفشل
- ❌ Login لـ customer غير موجود يفشل

**Expected:**
- ✅ تسجيل الدخول ناجح
- ✅ Redirect إلى dashboard
- ✅ User data في authStore

---

### Test 7: Customer Dashboard ✅

**URL:** `http://localhost:3000/customer/dashboard`

**Steps:**
1. بعد تسجيل الدخول كـ Customer
2. التحقق من:
   - ✅ Stats cards (Repairs, Invoices, Devices, Payments)
   - ✅ Profile card (name, phone, email, address)
   - ✅ Recent repairs list (5 آخر)
   - ✅ Recent invoices list (5 آخر)

**Expected:**
- ✅ Dashboard يعرض البيانات
- ✅ Customer يرى بياناته فقط
- ✅ Navigation يعمل

---

### Test 8: Customer Route Protection ✅

**Steps:**
1. سجّل الدخول كـ Customer
2. حاول الوصول لـ:
   - `/repairs` (admin route)
   - `/users` (admin route)
   - `/admin/roles` (admin route)
3. التحقق: Customer يتم redirect لـ `/customer/dashboard` أو `/customer/login`

**Expected:**
- ✅ Customer لا يمكنه الوصول لصفحات Admin/Staff
- ✅ Redirect يعمل بشكل صحيح

---

### Test 9: Permission Middleware Testing ✅

**Backend Testing:**
```bash
# Test permission checking
curl -X GET http://localhost:3001/api/repairs \
  -H "Cookie: token=..." \
  -v

# Should return:
# - 200 if user has repairs.view permission
# - 403 if user doesn't have permission
```

**Expected:**
- ✅ Permission checking يعمل
- ✅ Admin لديه كل الصلاحيات
- ✅ Users الآخرون لديهم permissions محددة

---

### Test 10: Permission Inheritance ✅

**Steps:**
1. Admin ينشئ Role "Junior Technician" مع `parentRoleId = 3` (Technician)
2. Admin يعطي Junior Technician: `repairs.view_own`
3. Parent (Technician) لديه: `repairs.view_all`
4. Admin ينشئ User مع Junior Technician role
5. User الجديد يسجل الدخول
6. User يحاول الوصول لـ `/repairs`
7. التحقق: User يمكنه رؤية جميع الإصلاحات (inherited من parent)

**Expected:**
- ✅ Inheritance يعمل بشكل صحيح
- ✅ User يرث permissions من parent role

---

## 📊 Test Results Template

```markdown
### Test: [Test Name]
**Date:** YYYY-MM-DD HH:MM  
**Tester:** [Name]  
**Status:** ✅ Pass / ❌ Fail / ⚠️ Warning

**Steps:**
1. ...
2. ...

**Expected:**  
...

**Actual:**  
...

**Screenshots:**
- [Link to screenshot]

**Notes:**  
...
```

---

## ✅ Acceptance Criteria

- ✅ يمكن إضافة/تعديل/حذف أدوار
- ✅ يمكن إدارة permissions لكل دور
- ✅ يمكن للعميل تسجيل الدخول
- ✅ يمكن للعميل رؤية بياناته فقط
- ✅ نظام permissions يعمل بشكل صحيح
- ✅ Admin لديه كل الصلاحيات
- ✅ Customer لا يمكنه الوصول لبيانات الآخرين
- ✅ System roles محمية من التعديل/الحذف
- ✅ Permission inheritance يعمل

---

## 🐛 Known Issues

لا توجد مشاكل معروفة حالياً.

---

## 📝 Testing Checklist

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

## 🚀 Next Steps

1. ⏳ **Manual Testing** - ابدأ الاختبارات اليدوية
2. ⏳ **Customer Account Setup** - أنشئ customer account للاختبار
3. ⏳ **Permission Integration** - أضف permission checking في routes الفعلية
4. ⏳ **Documentation** - أضف documentation للمستخدمين

---

**الحالة:** 🧪 **جاهز للاختبار**

