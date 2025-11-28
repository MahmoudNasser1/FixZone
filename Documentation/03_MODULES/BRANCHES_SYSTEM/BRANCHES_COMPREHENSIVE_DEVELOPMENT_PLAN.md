# خطة التطوير الشاملة لنظام الفروع
## Branches System Comprehensive Development Plan

---

## 📋 جدول المحتويات

1. [الوضع الحالي](#الوضع-الحالي)
2. [المشاكل والثغرات](#المشاكل-والثغرات)
3. [الأهداف والرؤية](#الأهداف-والرؤية)
4. [خطة التطوير - Backend](#خطة-التطوير---backend)
5. [خطة التطوير - Frontend](#خطة-التطوير---frontend)
6. [التكامل مع باقي النظام](#التكامل-مع-باقي-النظام)
7. [الأمان والصلاحيات](#الأمان-والصلاحيات)
8. [التوثيق والاختبار](#التوثيق-والاختبار)
9. [خطة التنفيذ](#خطة-التنفيذ)

---

## 🔍 الوضع الحالي

### 1.1 Backend

#### الملفات الموجودة:
- ✅ `backend/routes/branches.js` - Routes بسيطة جداً (80 سطر فقط)
- ❌ لا يوجد `backend/controllers/branchesController.js`
- ❌ لا يوجد Validation schemas للفروع
- ❌ لا يوجد Activity Logging
- ❌ لا يوجد Permissions checking
- ❌ لا يوجد Integration مع Middlewares

#### Routes الحالية:
```javascript
GET    /api/branches          // قائمة الفروع
GET    /api/branches/:id      // فرع واحد
POST   /api/branches          // إنشاء فرع
PUT    /api/branches/:id      // تحديث فرع
DELETE /api/branches/:id      // حذف فرع (hard delete - خطأ!)
```

#### المشاكل:
1. **لا يوجد Authentication/Authorization** - أي شخص يمكنه الوصول
2. **لا يوجد Validation** - لا توجد فحوصات للبيانات
3. **Hard Delete** - يجب استخدام Soft Delete
4. **لا يوجد Activity Logging** - لا يوجد تتبع للتغييرات
5. **لا يوجد Error Handling** - معالجة أخطاء بسيطة
6. **لا يوجد Pagination/Search** - لا يوجد بحث أو تصفح
7. **لا يوجد City Join** - لا يتم جلب بيانات المدينة
8. **Response Format غير موحد** - لا يتبع معيار النظام

### 1.2 Frontend

#### الملفات الموجودة:
- ❌ لا يوجد صفحات للفروع في `frontend/react-app/src/pages/branches/`
- ❌ لا يوجد Components للفروع
- ❌ لا يوجد Integration في Sidebar/Navigation
- ❌ لا يوجد Forms للفروع
- ❌ لا يوجد Tables/Lists للفروع

### 1.3 Database

#### جدول Branch:
```sql
CREATE TABLE `Branch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `cityId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cityId` (`cityId`),
  CONSTRAINT `Branch_ibfk_1` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`)
)
```

#### المشاكل:
1. **لا يوجد `isActive`** - لا يمكن تعطيل فرع بدون حذفه
2. **لا يوجد `managerId`** - لا يوجد ربط بمدير الفرع
3. **لا يوجد `email`** - لا يوجد بريد إلكتروني للفرع
4. **لا يوجد `workingHours`** - لا يوجد ساعات عمل
5. **لا يوجد `location` (GPS)** - لا يوجد إحداثيات جغرافية
6. **لا يوجد `settings` (JSON)** - لا يوجد إعدادات مخصصة

### 1.4 Integration مع باقي النظام

#### الاستخدام الحالي:
- ✅ `Warehouse.branchId` - المخازن مربوطة بالفروع
- ✅ `RepairRequest.branchId` - طلبات الإصلاح مربوطة بالفروع
- ❌ `User.branchId` - المستخدمون غير مربوطين بالفروع (في بعض المخططات)
- ❌ لا يوجد Branch-based filtering في Reports
- ❌ لا يوجد Branch-based permissions

---

## ⚠️ المشاكل والثغرات

### 2.1 مشاكل أمنية
1. **لا يوجد Authentication** - أي شخص يمكنه الوصول للـ API
2. **لا يوجد Authorization** - لا يوجد فحص للصلاحيات
3. **لا يوجد Rate Limiting** - يمكن إرسال طلبات كثيرة
4. **لا يوجد Input Sanitization** - خطر SQL Injection

### 2.2 مشاكل وظيفية
1. **لا يوجد Search/Filter** - صعب البحث عن فرع
2. **لا يوجد Pagination** - إذا كثرت الفروع سيكون بطيء
3. **لا يوجد Soft Delete** - حذف دائم للبيانات
4. **لا يوجد Validation** - يمكن إدخال بيانات خاطئة
5. **لا يوجد Activity Logging** - لا يوجد تتبع للتغييرات

### 2.3 مشاكل في التكامل
1. **لا يوجد Branch Context** - المستخدمون لا يعرفون فرعهم
2. **لا يوجد Branch Filtering** - لا يمكن تصفية البيانات حسب الفرع
3. **لا يوجد Branch Reports** - لا يوجد تقارير خاصة بالفروع
4. **لا يوجد Branch Settings** - لا يوجد إعدادات خاصة بكل فرع

---

## 🎯 الأهداف والرؤية

### 3.1 الأهداف الرئيسية
1. ✅ نظام إدارة فروع كامل وآمن
2. ✅ واجهة مستخدم حديثة وسهلة
3. ✅ تكامل كامل مع باقي النظام
4. ✅ نظام صلاحيات متقدم
5. ✅ تتبع كامل للأنشطة
6. ✅ تقارير وإحصائيات

### 3.2 الميزات المطلوبة

#### Backend:
- [x] Controllers منفصلة
- [x] Validation شاملة
- [x] Authentication & Authorization
- [x] Activity Logging
- [x] Soft Delete
- [x] Search & Pagination
- [x] Error Handling محسّن
- [x] Response Format موحد

#### Frontend:
- [x] صفحة قائمة الفروع
- [x] صفحة تفاصيل الفرع
- [x] صفحة إنشاء فرع
- [x] صفحة تعديل فرع
- [x] Components قابلة لإعادة الاستخدام
- [x] Forms مع Validation
- [x] Tables مع Search & Filter
- [x] Integration في Navigation

#### Database:
- [x] إضافة حقول جديدة
- [x] Indexes للأداء
- [x] Foreign Keys صحيحة

---

## 🚀 خطة التطوير - Backend

### 4.1 إنشاء Controller

**الملف:** `backend/controllers/branchesController.js`

#### الوظائف المطلوبة:

```javascript
// 1. List Branches (مع Search, Pagination, Filters)
exports.listBranches = async (req, res) => {
  // - Search by name, address, phone
  // - Filter by cityId, isActive
  // - Pagination
  // - Sort options
  // - Include city data
  // - Include manager data
  // - Include statistics (users count, repairs count, etc.)
}

// 2. Get Branch by ID
exports.getBranch = async (req, res) => {
  // - Include city data
  // - Include manager data
  // - Include warehouses
  // - Include statistics
  // - Include recent activities
}

// 3. Create Branch
exports.createBranch = async (req, res) => {
  // - Validate data
  // - Check duplicates
  // - Create branch
  // - Log activity
  // - Return created branch
}

// 4. Update Branch
exports.updateBranch = async (req, res) => {
  // - Validate data
  // - Check if exists
  // - Update branch
  // - Log activity (before/after)
  // - Return updated branch
}

// 5. Soft Delete Branch
exports.deleteBranch = async (req, res) => {
  // - Check if can be deleted (no active repairs, users, etc.)
  // - Soft delete
  // - Log activity
}

// 6. Activate/Deactivate Branch
exports.toggleBranchStatus = async (req, res) => {
  // - Toggle isActive
  // - Log activity
}

// 7. Get Branch Statistics
exports.getBranchStatistics = async (req, res) => {
  // - Users count
  // - Repairs count (by status)
  // - Warehouses count
  // - Revenue (if applicable)
  // - Recent activities
}

// 8. Get Branch Users
exports.getBranchUsers = async (req, res) => {
  // - List all users in branch
  // - Include roles
  // - Include activity status
}

// 9. Get Branch Warehouses
exports.getBranchWarehouses = async (req, res) => {
  // - List all warehouses in branch
  // - Include stock levels
}

// 10. Get Branch Repairs
exports.getBranchRepairs = async (req, res) => {
  // - List repairs by branch
  // - Filter by status, date range
  // - Pagination
}
```

### 4.2 إنشاء Validation Schemas

**الملف:** `backend/middleware/validation.js` (إضافة)

```javascript
const branchSchemas = {
  // Create branch
  createBranch: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'string.empty': 'اسم الفرع مطلوب',
        'string.min': 'اسم الفرع يجب أن يكون على الأقل حرفين',
        'string.max': 'اسم الفرع يجب ألا يزيد عن 100 حرف',
        'any.required': 'اسم الفرع مطلوب'
      }),

    address: Joi.string().max(255).allow('', null).optional()
      .messages({
        'string.max': 'العنوان يجب ألا يزيد عن 255 حرف'
      }),

    phone: Joi.string().max(20).pattern(/^[0-9+\-\s()]+$/).allow('', null).optional()
      .messages({
        'string.max': 'رقم الهاتف يجب ألا يزيد عن 20 حرف',
        'string.pattern.base': 'رقم الهاتف غير صحيح'
      }),

    email: Joi.string().email().max(100).allow('', null).optional()
      .messages({
        'string.email': 'البريد الإلكتروني غير صحيح',
        'string.max': 'البريد الإلكتروني يجب ألا يزيد عن 100 حرف'
      }),

    cityId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'معرف المدينة يجب أن يكون رقم',
        'number.positive': 'معرف المدينة يجب أن يكون موجب',
        'any.required': 'المدينة مطلوبة'
      }),

    managerId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.base': 'معرف المدير يجب أن يكون رقم',
        'number.positive': 'معرف المدير يجب أن يكون موجب'
      }),

    isActive: Joi.boolean().default(true),

    workingHours: Joi.object({
      sunday: Joi.object({ open: Joi.string(), close: Joi.string() }).allow(null),
      monday: Joi.object({ open: Joi.string(), close: Joi.string() }).allow(null),
      tuesday: Joi.object({ open: Joi.string(), close: Joi.string() }).allow(null),
      wednesday: Joi.object({ open: Joi.string(), close: Joi.string() }).allow(null),
      thursday: Joi.object({ open: Joi.string(), close: Joi.string() }).allow(null),
      friday: Joi.object({ open: Joi.string(), close: Joi.string() }).allow(null),
      saturday: Joi.object({ open: Joi.string(), close: Joi.string() }).allow(null)
    }).optional(),

    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional(),

    settings: Joi.object().optional()
  }),

  // Update branch
  updateBranch: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    address: Joi.string().max(255).allow('', null).optional(),
    phone: Joi.string().max(30).pattern(/^[0-9+\-\s()]+$/).allow('', null).optional(),
    email: Joi.string().email().max(100).allow('', null).optional(),
    cityId: Joi.number().integer().positive().optional(),
    managerId: Joi.number().integer().positive().allow(null).optional(),
    isActive: Joi.boolean().optional(),
    workingHours: Joi.object().optional(),
    location: Joi.object().optional(),
    settings: Joi.object().optional()
  }),

  // Query parameters
  listBranches: Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    search: Joi.string().max(100).allow('', null).optional(),
    cityId: Joi.number().integer().positive().optional(),
    isActive: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'city', 'createdAt', 'updatedAt').default('name').optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC').optional()
  })
};
```

### 4.3 تحديث Routes

**الملف:** `backend/routes/branches.js`

```javascript
const express = require('express');
const router = express.Router();
const branchesController = require('../controllers/branchesController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const { validate } = require('../middleware/validation');
const { branchSchemas } = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(authMiddleware);

// List branches (with search, pagination, filters)
router.get(
  '/',
  authorizeMiddleware(['Admin', 'Manager']), // أو حسب الصلاحيات
  validate(branchSchemas.listBranches, 'query'),
  branchesController.listBranches
);

// Get branch by ID
router.get(
  '/:id',
  authorizeMiddleware(['Admin', 'Manager', 'Technician']),
  branchesController.getBranch
);

// Create branch
router.post(
  '/',
  authorizeMiddleware(['Admin']), // فقط Admin يمكنه إنشاء فروع
  validate(branchSchemas.createBranch, 'body'),
  branchesController.createBranch
);

// Update branch
router.put(
  '/:id',
  authorizeMiddleware(['Admin', 'Manager']),
  validate(branchSchemas.updateBranch, 'body'),
  branchesController.updateBranch
);

// Soft delete branch
router.delete(
  '/:id',
  authorizeMiddleware(['Admin']), // فقط Admin يمكنه حذف فروع
  branchesController.deleteBranch
);

// Toggle branch status
router.patch(
  '/:id/toggle-status',
  authorizeMiddleware(['Admin', 'Manager']),
  branchesController.toggleBranchStatus
);

// Get branch statistics
router.get(
  '/:id/statistics',
  authorizeMiddleware(['Admin', 'Manager']),
  branchesController.getBranchStatistics
);

// Get branch users
router.get(
  '/:id/users',
  authorizeMiddleware(['Admin', 'Manager']),
  branchesController.getBranchUsers
);

// Get branch warehouses
router.get(
  '/:id/warehouses',
  authorizeMiddleware(['Admin', 'Manager', 'Technician']),
  branchesController.getBranchWarehouses
);

// Get branch repairs
router.get(
  '/:id/repairs',
  authorizeMiddleware(['Admin', 'Manager', 'Technician']),
  branchesController.getBranchRepairs
);

module.exports = router;
```

### 4.4 Activity Logging

**في Controller:**
```javascript
const logActivity = async (userId, action, details = null) => {
  try {
    const query = 'INSERT INTO activity_log (userId, action, details) VALUES (?, ?, ?)';
    await db.execute(query, [userId, action, details ? JSON.stringify(details) : null]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// في createBranch:
await logActivity(req.user.id, 'Branch Created', {
  branchId: result.insertId,
  branchName: name,
  cityId
});

// في updateBranch:
await logActivity(req.user.id, 'Branch Updated', {
  branchId: id,
  changes: {
    before: oldBranch,
    after: updatedData
  }
});
```

### 4.5 Error Handling

**إنشاء:** `backend/utils/branchErrors.js`

```javascript
class BranchError extends Error {
  constructor(message, statusCode = 500, code = 'BRANCH_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class BranchNotFoundError extends BranchError {
  constructor(branchId) {
    super(`Branch with ID ${branchId} not found`, 404, 'BRANCH_NOT_FOUND');
    this.branchId = branchId;
  }
}

class BranchAlreadyExistsError extends BranchError {
  constructor(name) {
    super(`Branch with name "${name}" already exists`, 409, 'BRANCH_ALREADY_EXISTS');
    this.name = name;
  }
}

class BranchCannotBeDeletedError extends BranchError {
  constructor(branchId, reason) {
    super(`Branch cannot be deleted: ${reason}`, 400, 'BRANCH_CANNOT_BE_DELETED');
    this.branchId = branchId;
    this.reason = reason;
  }
}

module.exports = {
  BranchError,
  BranchNotFoundError,
  BranchAlreadyExistsError,
  BranchCannotBeDeletedError
};
```

---

## 🎨 خطة التطوير - Frontend

### 5.1 هيكل الملفات

```
frontend/react-app/src/pages/branches/
├── BranchesPage.js              # قائمة الفروع
├── BranchDetailsPage.js         # تفاصيل الفرع
├── NewBranchPage.js             # إنشاء فرع جديد
├── EditBranchPage.js            # تعديل فرع
├── BranchStatisticsPage.js      # إحصائيات الفرع
└── index.js                     # Exports

frontend/react-app/src/components/branches/
├── BranchCard.js                # بطاقة فرع
├── BranchForm.js                # نموذج الفرع
├── BranchTable.js                # جدول الفروع
├── BranchFilters.js              # فلاتر البحث
├── BranchStatistics.js           # إحصائيات
└── index.js
```

### 5.2 BranchesPage.js

**الميزات:**
- جدول الفروع مع Search & Filter
- Pagination
- Sort options
- Quick actions (View, Edit, Delete, Toggle Status)
- Create new branch button
- Statistics cards (Total, Active, Inactive)

**المكونات:**
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Card, 
  Badge,
  Pagination,
  Spinner
} from '../components/ui';
import { branchService } from '../services/branchService';
import BranchFilters from '../components/branches/BranchFilters';
import BranchTable from '../components/branches/BranchTable';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    cityId: '',
    isActive: '',
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'ASC'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  // Fetch branches
  useEffect(() => {
    fetchBranches();
  }, [filters]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await branchService.listBranches(filters);
      setBranches(response.data);
      setPagination(response.pagination);
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Error fetching branches:', error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      try {
        await branchService.deleteBranch(branchId);
        fetchBranches();
        // Show success notification
      } catch (error) {
        console.error('Error deleting branch:', error);
        // Show error notification
      }
    }
  };

  const handleToggleStatus = async (branchId, currentStatus) => {
    try {
      await branchService.toggleBranchStatus(branchId, !currentStatus);
      fetchBranches();
      // Show success notification
    } catch (error) {
      console.error('Error toggling branch status:', error);
      // Show error notification
    }
  };

  return (
    <div className="branches-page">
      <div className="page-header">
        <h1>إدارة الفروع</h1>
        <Button onClick={() => navigate('/branches/new')}>
          إضافة فرع جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-cards">
        <Card>
          <h3>إجمالي الفروع</h3>
          <p>{statistics.total}</p>
        </Card>
        <Card>
          <h3>الفروع النشطة</h3>
          <p>{statistics.active}</p>
        </Card>
        <Card>
          <h3>الفروع المعطلة</h3>
          <p>{statistics.inactive}</p>
        </Card>
      </div>

      {/* Filters */}
      <BranchFilters 
        filters={filters}
        onChange={setFilters}
      />

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : (
        <BranchTable
          branches={branches}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onEdit={(id) => navigate(`/branches/${id}/edit`)}
          onView={(id) => navigate(`/branches/${id}`)}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
};

export default BranchesPage;
```

### 5.3 BranchForm.js

**الميزات:**
- Form validation
- City selection
- Manager selection
- Working hours input
- Location (GPS) picker
- Settings editor

```javascript
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Input, 
  Select, 
  Button, 
  Card,
  TimePicker,
  MapPicker
} from '../components/ui';
import { cityService } from '../services/cityService';
import { userService } from '../services/userService';

const branchSchema = yup.object().shape({
  name: yup.string().required('اسم الفرع مطلوب').min(2, 'يجب أن يكون على الأقل حرفين'),
  address: yup.string().max(255, 'يجب ألا يزيد عن 255 حرف'),
  phone: yup.string().matches(/^[0-9+\-\s()]+$/, 'رقم الهاتف غير صحيح'),
  email: yup.string().email('البريد الإلكتروني غير صحيح'),
  cityId: yup.number().required('المدينة مطلوبة').positive(),
  managerId: yup.number().nullable(),
  isActive: yup.boolean().default(true)
});

const BranchForm = ({ branch, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: branch || {
      name: '',
      address: '',
      phone: '',
      email: '',
      cityId: '',
      managerId: null,
      isActive: true,
      workingHours: {},
      location: null
    }
  });

  const [cities, setCities] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCities();
    fetchManagers();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await cityService.listCities();
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await userService.listUsers({ role: 'Manager' });
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const onSubmitForm = async (data) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <Card>
        <h2>معلومات الفرع الأساسية</h2>
        
        <Input
          label="اسم الفرع"
          {...register('name')}
          error={errors.name?.message}
          required
        />

        <Select
          label="المدينة"
          {...register('cityId')}
          options={cities.map(c => ({ value: c.id, label: c.name }))}
          error={errors.cityId?.message}
          required
        />

        <Input
          label="العنوان"
          {...register('address')}
          error={errors.address?.message}
        />

        <Input
          label="رقم الهاتف"
          {...register('phone')}
          error={errors.phone?.message}
        />

        <Input
          label="البريد الإلكتروني"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />

        <Select
          label="مدير الفرع"
          {...register('managerId')}
          options={[
            { value: '', label: 'لا يوجد' },
            ...managers.map(m => ({ value: m.id, label: m.name }))
          ]}
          error={errors.managerId?.message}
        />

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              {...register('isActive')}
            />
            فرع نشط
          </label>
        </div>
      </Card>

      <Card>
        <h2>ساعات العمل</h2>
        {/* Working hours inputs */}
      </Card>

      <Card>
        <h2>الموقع الجغرافي</h2>
        <MapPicker
          value={watch('location')}
          onChange={(location) => setValue('location', location)}
        />
      </Card>

      <div className="form-actions">
        <Button type="button" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" loading={loading}>
          حفظ
        </Button>
      </div>
    </form>
  );
};

export default BranchForm;
```

### 5.4 BranchService.js

**الملف:** `frontend/react-app/src/services/branchService.js`

```javascript
import api from './api';

export const branchService = {
  // List branches
  listBranches: async (filters = {}) => {
    const response = await api.get('/branches', { params: filters });
    return response.data;
  },

  // Get branch by ID
  getBranch: async (id) => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },

  // Create branch
  createBranch: async (data) => {
    const response = await api.post('/branches', data);
    return response.data;
  },

  // Update branch
  updateBranch: async (id, data) => {
    const response = await api.put(`/branches/${id}`, data);
    return response.data;
  },

  // Delete branch
  deleteBranch: async (id) => {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  },

  // Toggle branch status
  toggleBranchStatus: async (id, isActive) => {
    const response = await api.patch(`/branches/${id}/toggle-status`, { isActive });
    return response.data;
  },

  // Get branch statistics
  getBranchStatistics: async (id) => {
    const response = await api.get(`/branches/${id}/statistics`);
    return response.data;
  },

  // Get branch users
  getBranchUsers: async (id) => {
    const response = await api.get(`/branches/${id}/users`);
    return response.data;
  },

  // Get branch warehouses
  getBranchWarehouses: async (id) => {
    const response = await api.get(`/branches/${id}/warehouses`);
    return response.data;
  },

  // Get branch repairs
  getBranchRepairs: async (id, filters = {}) => {
    const response = await api.get(`/branches/${id}/repairs`, { params: filters });
    return response.data;
  }
};
```

### 5.5 إضافة Routes في App.js

```javascript
import BranchesPage from './pages/branches/BranchesPage';
import BranchDetailsPage from './pages/branches/BranchDetailsPage';
import NewBranchPage from './pages/branches/NewBranchPage';
import EditBranchPage from './pages/branches/EditBranchPage';

// في Routes:
<Route path="/branches" element={<BranchesPage />} />
<Route path="/branches/new" element={<NewBranchPage />} />
<Route path="/branches/:id" element={<BranchDetailsPage />} />
<Route path="/branches/:id/edit" element={<EditBranchPage />} />
```

### 5.6 إضافة في Sidebar

```javascript
{
  title: 'الفروع',
  icon: <BuildingIcon />,
  path: '/branches',
  roles: ['Admin', 'Manager']
}
```

---

## 🔗 التكامل مع باقي النظام

### 6.1 Integration مع Users

**في User Model:**
- إضافة `branchId` إلى User table (إذا لم يكن موجوداً)
- Filter users by branch
- Assign user to branch

**في User Routes:**
```javascript
// Get users by branch
router.get('/by-branch/:branchId', userController.getUsersByBranch);

// Assign user to branch
router.patch('/:id/assign-branch', userController.assignToBranch);
```

### 6.2 Integration مع Repairs

**في Repair Routes:**
```javascript
// Filter repairs by branch
router.get('/', repairController.listRepairs); // Add branchId filter

// Get repairs by branch
router.get('/by-branch/:branchId', repairController.getRepairsByBranch);
```

### 6.3 Integration مع Warehouses

**في Warehouse Routes:**
```javascript
// Filter warehouses by branch (موجود بالفعل)
// إضافة validation للـ branchId
```

### 6.4 Integration مع Reports

**إنشاء Branch Reports:**
```javascript
// Branch performance report
router.get('/reports/branch-performance', reportController.getBranchPerformance);

// Branch comparison report
router.get('/reports/branch-comparison', reportController.getBranchComparison);
```

### 6.5 Branch Context Middleware

**إنشاء:** `backend/middleware/branchContextMiddleware.js`

```javascript
const branchContextMiddleware = async (req, res, next) => {
  if (req.user && req.user.branchId) {
    req.branchId = req.user.branchId;
    req.branchContext = {
      id: req.user.branchId,
      name: req.user.branchName, // من JWT أو من DB
      canAccessAllBranches: req.user.role === 'Admin'
    };
  }
  next();
};

module.exports = branchContextMiddleware;
```

**الاستخدام:**
```javascript
// في routes التي تحتاج branch context
router.use(branchContextMiddleware);

// في controller:
const getBranchFilter = (req) => {
  if (req.branchContext.canAccessAllBranches) {
    return {}; // يمكنه رؤية كل الفروع
  }
  return { branchId: req.branchContext.id }; // فقط فرعه
};
```

---

## 🔐 الأمان والصلاحيات

### 7.1 Permissions Matrix

| الإجراء | Admin | Manager | Technician | Receptionist |
|---------|-------|---------|------------|--------------|
| عرض الفروع | ✅ جميع | ✅ جميع | ✅ فرعه فقط | ✅ فرعه فقط |
| إنشاء فرع | ✅ | ❌ | ❌ | ❌ |
| تعديل فرع | ✅ جميع | ✅ فرعه فقط | ❌ | ❌ |
| حذف فرع | ✅ | ❌ | ❌ | ❌ |
| تعطيل/تفعيل | ✅ جميع | ✅ فرعه فقط | ❌ | ❌ |
| عرض الإحصائيات | ✅ جميع | ✅ فرعه فقط | ✅ فرعه فقط | ❌ |

### 7.2 Branch-based Access Control

**في Middleware:**
```javascript
const checkBranchAccess = (req, res, next) => {
  const branchId = req.params.id || req.body.branchId;
  const userBranchId = req.user.branchId;
  const userRole = req.user.role;

  // Admin يمكنه الوصول لجميع الفروع
  if (userRole === 'Admin') {
    return next();
  }

  // Manager يمكنه الوصول لفرعه فقط
  if (userRole === 'Manager' && userBranchId === branchId) {
    return next();
  }

  // باقي الأدوار لا يمكنها الوصول
  return res.status(403).json({
    success: false,
    message: 'ليس لديك صلاحية للوصول لهذا الفرع'
  });
};
```

### 7.3 Data Filtering

**في Controllers:**
```javascript
const getBranchFilter = (req) => {
  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  if (userRole === 'Admin') {
    return {}; // لا يوجد filter - يرى كل شيء
  }

  return { branchId: userBranchId }; // فقط فرعه
};

// في listRepairs:
const branchFilter = getBranchFilter(req);
const [repairs] = await db.execute(
  `SELECT * FROM RepairRequest 
   WHERE deletedAt IS NULL 
   ${branchFilter.branchId ? 'AND branchId = ?' : ''}`,
  branchFilter.branchId ? [branchFilter.branchId] : []
);
```

---

## 📊 التوثيق والاختبار

### 8.1 API Documentation

**إنشاء:** `Documentation/03_MODULES/BRANCHES_SYSTEM/API_DOCUMENTATION.md`

```markdown
# Branches API Documentation

## Endpoints

### GET /api/branches
List all branches with filters and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search by name, address, phone
- `cityId` (number): Filter by city
- `isActive` (boolean): Filter by status
- `sortBy` (string): Sort field (name, city, createdAt)
- `sortOrder` (string): Sort order (ASC, DESC)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

### POST /api/branches
Create a new branch.

**Request Body:**
```json
{
  "name": "فرع القاهرة",
  "address": "شارع التحرير",
  "phone": "01012345678",
  "email": "cairo@fixzone.com",
  "cityId": 1,
  "managerId": 5,
  "isActive": true
}
```

// ... باقي التوثيق
```

### 8.2 Testing

**إنشاء:** `backend/tests/branches.test.js`

```javascript
const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Branches API', () => {
  let authToken;
  let testBranchId;

  beforeAll(async () => {
    // Login and get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });
    authToken = loginRes.body.token;
  });

  describe('GET /api/branches', () => {
    it('should return list of branches', async () => {
      const res = await request(app)
        .get('/api/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/branches', () => {
    it('should create a new branch', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Branch',
          cityId: 1,
          address: 'Test Address',
          phone: '01012345678'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Branch');
      testBranchId = res.body.data.id;
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ... باقي الاختبارات
});
```

---

## 📅 خطة التنفيذ

### المرحلة 1: Backend الأساسي (أسبوع 1)
- [ ] إنشاء `branchesController.js`
- [ ] إضافة Validation schemas
- [ ] تحديث Routes مع Middlewares
- [ ] إضافة Activity Logging
- [ ] إضافة Error Handling
- [ ] اختبار API endpoints

### المرحلة 2: Database Enhancements (أسبوع 1)
- [ ] Migration لإضافة حقول جديدة
- [ ] إضافة Indexes
- [ ] تحديث Foreign Keys
- [ ] Seed data للاختبار

### المرحلة 3: Frontend الأساسي (أسبوع 2)
- [ ] إنشاء `BranchesPage.js`
- [ ] إنشاء `BranchForm.js`
- [ ] إنشاء `BranchService.js`
- [ ] إضافة Routes في App.js
- [ ] إضافة في Sidebar

### المرحلة 4: Frontend المتقدم (أسبوع 2)
- [ ] إنشاء `BranchDetailsPage.js`
- [ ] إنشاء `EditBranchPage.js`
- [ ] إنشاء Components إضافية
- [ ] إضافة Statistics
- [ ] إضافة Filters & Search

### المرحلة 5: Integration (أسبوع 3)
- [ ] Integration مع Users
- [ ] Integration مع Repairs
- [ ] Integration مع Warehouses
- [ ] Branch Context Middleware
- [ ] Branch-based Filtering

### المرحلة 6: Security & Permissions (أسبوع 3)
- [ ] Branch-based Access Control
- [ ] Permissions Matrix
- [ ] Data Filtering
- [ ] Security Testing

### المرحلة 7: Reports & Analytics (أسبوع 4)
- [ ] Branch Performance Reports
- [ ] Branch Comparison Reports
- [ ] Statistics Dashboard
- [ ] Export functionality

### المرحلة 8: Testing & Documentation (أسبوع 4)
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] API Documentation
- [ ] User Guide
- [ ] Final Review

---

## 📝 ملاحظات إضافية

### Best Practices
1. **Always use Soft Delete** - لا تحذف البيانات نهائياً
2. **Log all activities** - سجل كل التغييرات
3. **Validate on both sides** - Frontend & Backend
4. **Use Transactions** - للعمليات المعقدة
5. **Handle errors gracefully** - رسائل خطأ واضحة
6. **Follow naming conventions** - اتبع معايير المشروع
7. **Document everything** - وثق كل شيء

### Performance Considerations
1. **Add Indexes** - على الحقول المستخدمة في البحث
2. **Use Pagination** - دائماً استخدم pagination
3. **Cache frequently accessed data** - مثل قائمة المدن
4. **Optimize queries** - استخدم JOINs بدلاً من queries متعددة
5. **Lazy load** - للبيانات الكبيرة

### Security Considerations
1. **Always authenticate** - كل endpoint يحتاج auth
2. **Check permissions** - تحقق من الصلاحيات
3. **Sanitize input** - نظف البيانات المدخلة
4. **Use parameterized queries** - لمنع SQL Injection
5. **Rate limiting** - حدد عدد الطلبات
6. **HTTPS only** - استخدم HTTPS فقط

---

## ✅ Checklist النهائي

### Backend
- [ ] Controller كامل مع جميع الوظائف
- [ ] Validation schemas شاملة
- [ ] Routes مع Middlewares
- [ ] Activity Logging
- [ ] Error Handling
- [ ] Unit Tests
- [ ] API Documentation

### Frontend
- [ ] جميع الصفحات المطلوبة
- [ ] Forms مع Validation
- [ ] Components قابلة لإعادة الاستخدام
- [ ] Integration مع Services
- [ ] Error Handling
- [ ] Loading States
- [ ] Responsive Design

### Database
- [ ] Migration للحقول الجديدة
- [ ] Indexes للأداء
- [ ] Foreign Keys صحيحة
- [ ] Seed Data

### Integration
- [ ] Integration مع Users
- [ ] Integration مع Repairs
- [ ] Integration مع Warehouses
- [ ] Branch Context
- [ ] Branch Filtering

### Security
- [ ] Authentication
- [ ] Authorization
- [ ] Permissions
- [ ] Data Filtering
- [ ] Input Validation

### Documentation
- [ ] API Documentation
- [ ] Code Comments
- [ ] User Guide
- [ ] Testing Guide

---

**تاريخ الإنشاء:** 2025-01-XX  
**آخر تحديث:** 2025-01-XX  
**الحالة:** 📋 قيد التطوير

