# 🔐 خطة نظام إدارة الأدوار والصلاحيات المتكامل - FixZone ERP
## Comprehensive Roles & Permissions System Plan

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI)  
**الحالة:** 📋 قيد التخطيط

---

## 📋 الوضع الحالي

### ✅ ما هو موجود:
1. ✅ `Role` table في Database مع `permissions` (JSON)
2. ✅ `backend/routes/roles.js` - APIs أساسية (CRUD)
3. ✅ `backend/controllers/rolesController.js` - Controller
4. ✅ `frontend/admin/RolesPermissionsPage.js` - صفحة بسيطة (read-only)
5. ✅ `authorizeMiddleware` - بسيط (يتحقق من roleId فقط)
6. ✅ الأدوار الأساسية: Admin (1), Manager (2), Technician (3), User (4)

### ❌ ما هو ناقص:
1. ❌ نظام permissions متكامل ومنظم
2. ❌ Customer Role و Portal
3. ❌ ربط Customer بـ User account
4. ❌ Permission checking middleware متقدم
5. ❌ واجهة إدارة الأدوار والصلاحيات متكاملة
6. ❌ Customer Portal منفصل

---

## 🎯 الأهداف

### 1. **نظام الأدوار الشامل**
- Admin: صلاحيات كاملة
- Manager: إدارة الفرع والتقارير
- Technician: إدارة الإصلاحات والمخزون
- Receptionist: إضافة العملاء وطلبات الإصلاح
- Customer: عرض حالات أجهزته وفواتيره فقط

### 2. **نظام الصلاحيات المرن**
- نظام permissions منظم (module.action)
- دعم inheritance (parentRoleId)
- دعم fine-grained permissions
- إمكانية إنشاء أدوار مخصصة

### 3. **Customer Portal**
- صفحة login منفصلة للعملاء
- عرض حالات أجهزته
- عرض فواتيره ودفعاته
- تتبع طلبات الإصلاح
- تحديثات تلقائية

---

## 📊 أنواع المستخدمين المطلوبة

### 1. **Admin** (مدير النظام)
- ✅ موجود
- **الصلاحيات:** كل شيء
- **الوصول:** كامل

### 2. **Manager** (مدير الفرع)
- ✅ موجود
- **الصلاحيات:** إدارة الفرع، التقارير، المستخدمين
- **الوصول:** محدود بالفرع

### 3. **Technician** (فني الإصلاح)
- ✅ موجود
- **الصلاحيات:** إدارة الإصلاحات، المخزون، القطع
- **الوصول:** طلباته فقط

### 4. **Receptionist** (موظف الاستقبال)
- ✅ موجود
- **الصلاحيات:** إضافة عملاء، إنشاء طلبات إصلاح
- **الوصول:** محدود

### 5. **Customer** (العميل) 🆕
- ❌ غير موجود - **مطلوب إضافته**
- **الصلاحيات:** 
  - عرض أجهزته فقط
  - عرض فواتيره فقط
  - عرض طلبات إصلاحه فقط
  - تتبع حالة الإصلاح
- **الوصول:** بياناته فقط (self-service)
- **Portal:** صفحة منفصلة للعملاء

---

## 🗄️ Database Schema

### 1. **تحسين Role Table**
```sql
-- إضافة description و isSystem
ALTER TABLE Role 
ADD COLUMN description TEXT NULL AFTER name,
ADD COLUMN isSystem BOOLEAN DEFAULT FALSE AFTER parentRoleId,
ADD COLUMN isActive BOOLEAN DEFAULT TRUE AFTER isSystem;

-- إضافة Customer Role
INSERT INTO Role (name, description, permissions, isSystem, isActive) VALUES 
('Customer', 'العميل - يرى بياناته فقط', 
  JSON_OBJECT(
    'repairs.view_own', true,
    'repairs.track', true,
    'invoices.view_own', true,
    'devices.view_own', true,
    'payments.view_own', true
  ), 
  true, true);
```

### 2. **ربط Customer بـ User**
```sql
-- إضافة customerId إلى User table
ALTER TABLE User 
ADD COLUMN customerId INT NULL AFTER roleId,
ADD CONSTRAINT fk_user_customer FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE SET NULL,
ADD INDEX idx_user_customer (customerId);

-- إضافة userId إلى Customer table (اختياري)
ALTER TABLE Customer
ADD COLUMN userId INT NULL,
ADD CONSTRAINT fk_customer_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
ADD INDEX idx_customer_user (userId);
```

### 3. **إنشاء Permission Table (اختياري للمستقبل)**
```sql
CREATE TABLE IF NOT EXISTS Permission (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE KEY unique_permission (module, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- إضافة permissions أساسية
INSERT INTO Permission (module, action, name, description) VALUES
('repairs', 'view', 'عرض الإصلاحات', 'عرض قائمة طلبات الإصلاح'),
('repairs', 'view_own', 'عرض إصلاحاته', 'عرض طلبات الإصلاح الخاصة به'),
('repairs', 'create', 'إنشاء إصلاح', 'إنشاء طلب إصلاح جديد'),
('repairs', 'update', 'تعديل إصلاح', 'تعديل طلب إصلاح'),
('repairs', 'delete', 'حذف إصلاح', 'حذف طلب إصلاح'),
('invoices', 'view', 'عرض الفواتير', 'عرض جميع الفواتير'),
('invoices', 'view_own', 'عرض فواتيره', 'عرض الفواتير الخاصة به'),
('invoices', 'create', 'إنشاء فاتورة', 'إنشاء فاتورة جديدة'),
('invoices', 'update', 'تعديل فاتورة', 'تعديل فاتورة'),
('customers', 'view', 'عرض العملاء', 'عرض قائمة العملاء'),
('customers', 'create', 'إنشاء عميل', 'إضافة عميل جديد'),
('customers', 'update', 'تعديل عميل', 'تعديل بيانات العميل'),
('customers', 'delete', 'حذف عميل', 'حذف عميل'),
('users', 'view', 'عرض المستخدمين', 'عرض قائمة المستخدمين'),
('users', 'create', 'إنشاء مستخدم', 'إضافة مستخدم جديد'),
('users', 'update', 'تعديل مستخدم', 'تعديل بيانات المستخدم'),
('users', 'delete', 'حذف مستخدم', 'حذف مستخدم'),
('reports', 'view', 'عرض التقارير', 'عرض التقارير'),
('reports', 'export', 'تصدير التقارير', 'تصدير التقارير');
```

---

## 🔧 Backend Changes

### 1. **تحسين rolesController.js**
- ✅ استخدام `db.execute` بدلاً من `db.query`
- ✅ إضافة validation للـ permissions
- ✅ دعم description و isSystem

### 2. **إنشاء permissionMiddleware.js**
```javascript
// backend/middleware/permissionMiddleware.js
const db = require('../db');

// نظام permissions متكامل
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin لديه كل الصلاحيات
    if (req.user.roleId === 1) {
      return next();
    }

    // جلب permissions من Role
    const [roles] = await db.execute(
      'SELECT permissions FROM Role WHERE id = ? AND deletedAt IS NULL',
      [req.user.roleId]
    );

    if (!roles.length) {
      return res.status(403).json({ message: 'Role not found' });
    }

    const permissions = JSON.parse(roles[0].permissions || '{}');

    // فحص الصلاحية المطلوبة
    if (permissions[requiredPermission] === true || permissions.all === true) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied: Insufficient permissions',
      required: requiredPermission
    });
  };
};

module.exports = { checkPermission };
```

### 3. **تحسين authorizeMiddleware.js**
- ✅ دعم checking permissions من Role.permissions
- ✅ دعم inheritance (parentRoleId)
- ✅ دعم Customer access control

### 4. **إضافة Customer Auth**
- ✅ Customer login endpoint
- ✅ Customer portal routes
- ✅ Customer-specific permissions

---

## 🎨 Frontend Changes

### 1. **تحسين RolesPermissionsPage.js**
- ✅ عرض جميع الأدوار
- ✅ إضافة/تعديل/حذف أدوار
- ✅ إدارة permissions بشكل visual
- ✅ اختبار permissions
- ✅ واجهة متكاملة لإدارة الأدوار

### 2. **إنشاء CustomerPortal.js**
- ✅ صفحة login للعملاء
- ✅ Dashboard للعميل
- ✅ عرض أجهزته
- ✅ عرض طلبات الإصلاح
- ✅ عرض الفواتير والدفعات
- ✅ تتبع حالة الإصلاح

### 3. **إضافة Permission-based UI**
- ✅ إخفاء/إظهار elements حسب permissions
- ✅ Disable buttons حسب permissions
- ✅ Route protection حسب permissions

---

## 📋 Permissions Structure

### Permissions Format:
```json
{
  "all": false,
  "module.action": true,
  "module.action_own": true,
  "module.action_all": true
}
```

### Modules:
- `repairs` - طلبات الإصلاح
- `invoices` - الفواتير
- `customers` - العملاء
- `users` - المستخدمين
- `inventory` - المخزون
- `reports` - التقارير
- `settings` - الإعدادات
- `companies` - الشركات
- `vendors` - الموردين
- `payments` - المدفوعات

### Actions:
- `view` - عرض
- `view_own` - عرض خاصته فقط
- `view_all` - عرض الكل
- `create` - إنشاء
- `update` - تعديل
- `delete` - حذف
- `export` - تصدير

---

## 🗺️ Implementation Plan

### Phase 1: Database & Backend Foundation
1. ✅ Update Role table schema
2. ✅ Add Customer Role
3. ✅ Link Customer to User
4. ✅ Create Permission table (optional)
5. ✅ Improve rolesController
6. ✅ Create permissionMiddleware
7. ✅ Improve authorizeMiddleware

### Phase 2: Customer Portal Backend
1. ✅ Customer authentication
2. ✅ Customer-specific APIs
3. ✅ Customer permissions
4. ✅ Route protection

### Phase 3: Frontend - Roles Management
1. ✅ Improve RolesPermissionsPage
2. ✅ Add Role CRUD UI
3. ✅ Permission management UI
4. ✅ Test permissions

### Phase 4: Frontend - Customer Portal
1. ✅ Customer login page
2. ✅ Customer dashboard
3. ✅ Customer devices view
4. ✅ Customer repairs view
5. ✅ Customer invoices view

### Phase 5: Testing & Documentation
1. ✅ Test all roles
2. ✅ Test permissions
3. ✅ Test Customer Portal
4. ✅ Document permissions
5. ✅ Create user guides

---

## 🔒 Default Permissions

### Admin:
```json
{
  "all": true
}
```

### Manager:
```json
{
  "repairs.view_all": true,
  "repairs.update": true,
  "invoices.view_all": true,
  "invoices.create": true,
  "invoices.update": true,
  "customers.view_all": true,
  "customers.create": true,
  "customers.update": true,
  "users.view": true,
  "users.update": true,
  "reports.view": true,
  "reports.export": true
}
```

### Technician:
```json
{
  "repairs.view_all": true,
  "repairs.update": true,
  "repairs.create": false,
  "inventory.view": true,
  "inventory.update": true
}
```

### Receptionist:
```json
{
  "repairs.create": true,
  "repairs.view_all": true,
  "customers.view_all": true,
  "customers.create": true,
  "customers.update": true
}
```

### Customer:
```json
{
  "repairs.view_own": true,
  "repairs.track": true,
  "invoices.view_own": true,
  "devices.view_own": true,
  "payments.view_own": true
}
```

---

## ✅ Acceptance Criteria

1. ✅ يمكن إضافة/تعديل/حذف أدوار
2. ✅ يمكن إدارة permissions لكل دور
3. ✅ يمكن للعميل تسجيل الدخول
4. ✅ يمكن للعميل رؤية بياناته فقط
5. ✅ نظام permissions يعمل بشكل صحيح
6. ✅ Admin لديه كل الصلاحيات
7. ✅ Customer لا يمكنه الوصول لبيانات الآخرين

---

**الحالة:** 📋 **قيد التخطيط - جاهز للتنفيذ**

