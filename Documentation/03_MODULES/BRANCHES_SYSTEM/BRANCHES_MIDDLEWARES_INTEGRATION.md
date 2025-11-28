# تكامل نظام الفروع مع Middlewares
## Branches System - Middlewares Integration Guide

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [Authentication Middleware](#authentication-middleware)
3. [Authorization Middleware](#authorization-middleware)
4. [Validation Middleware](#validation-middleware)
5. [Branch Context Middleware](#branch-context-middleware)
6. [Activity Logging Middleware](#activity-logging-middleware)
7. [Error Handling Middleware](#error-handling-middleware)
8. [Rate Limiting Middleware](#rate-limiting-middleware)
9. [Audit Logging](#audit-logging)
10. [أمثلة عملية](#أمثلة-عملية)

---

## 🔍 نظرة عامة

نظام الفروع يحتاج للتكامل مع جميع الـ Middlewares الموجودة في النظام لضمان:
- ✅ الأمان الكامل
- ✅ التحقق من الصلاحيات
- ✅ تتبع الأنشطة
- ✅ معالجة الأخطاء
- ✅ الأداء الأمثل

---

## 🔐 Authentication Middleware

### الاستخدام

**الملف:** `backend/middleware/authMiddleware.js`

```javascript
const authMiddleware = require('../middleware/authMiddleware');

// في routes/branches.js
router.use(authMiddleware); // يطبق على جميع routes
```

### الوظيفة
- التحقق من وجود Token في الطلب
- التحقق من صحة Token
- إضافة `req.user` للطلب

### مثال

```javascript
// قبل Middleware
router.get('/branches', async (req, res) => {
  // req.user غير موجود
});

// بعد Middleware
router.use(authMiddleware);
router.get('/branches', async (req, res) => {
  // req.user موجود ويحتوي على:
  // {
  //   id: 1,
  //   email: 'admin@fixzone.com',
  //   role: 'Admin',
  //   roleId: 1,
  //   branchId: 1
  // }
});
```

---

## 🛡️ Authorization Middleware

### الاستخدام

**الملف:** `backend/middleware/authorizeMiddleware.js`

```javascript
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// فقط Admin و Manager يمكنهم الوصول
router.get(
  '/branches',
  authMiddleware,
  authorizeMiddleware(['Admin', 'Manager']),
  branchesController.listBranches
);

// فقط Admin يمكنه إنشاء فروع
router.post(
  '/branches',
  authMiddleware,
  authorizeMiddleware(['Admin']),
  branchesController.createBranch
);
```

### الصلاحيات المطلوبة

| Route | Method | الأدوار المسموحة |
|-------|--------|------------------|
| GET /branches | List | Admin, Manager |
| GET /branches/:id | View | Admin, Manager, Technician |
| POST /branches | Create | Admin |
| PUT /branches/:id | Update | Admin, Manager |
| DELETE /branches/:id | Delete | Admin |
| PATCH /branches/:id/toggle-status | Toggle | Admin, Manager |

### Implementation في Routes

```javascript
const express = require('express');
const router = express.Router();
const branchesController = require('../controllers/branchesController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Apply auth to all routes
router.use(authMiddleware);

// List branches - Admin & Manager only
router.get(
  '/',
  authorizeMiddleware(['Admin', 'Manager']),
  branchesController.listBranches
);

// Get branch - Admin, Manager, Technician
router.get(
  '/:id',
  authorizeMiddleware(['Admin', 'Manager', 'Technician']),
  branchesController.getBranch
);

// Create branch - Admin only
router.post(
  '/',
  authorizeMiddleware(['Admin']),
  branchesController.createBranch
);

// Update branch - Admin & Manager
router.put(
  '/:id',
  authorizeMiddleware(['Admin', 'Manager']),
  branchesController.updateBranch
);

// Delete branch - Admin only
router.delete(
  '/:id',
  authorizeMiddleware(['Admin']),
  branchesController.deleteBranch
);
```

---

## ✅ Validation Middleware

### إنشاء Validation Schemas

**الملف:** `backend/middleware/validation.js`

```javascript
const Joi = require('joi');

const branchSchemas = {
  // Create Branch Schema
  createBranch: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'اسم الفرع مطلوب',
        'string.min': 'اسم الفرع يجب أن يكون على الأقل حرفين',
        'string.max': 'اسم الفرع يجب ألا يزيد عن 100 حرف',
        'any.required': 'اسم الفرع مطلوب'
      }),

    address: Joi.string()
      .max(255)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'العنوان يجب ألا يزيد عن 255 حرف'
      }),

    phone: Joi.string()
      .max(30)
      .pattern(/^[0-9+\-\s()]+$/)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'رقم الهاتف يجب ألا يزيد عن 30 حرف',
        'string.pattern.base': 'رقم الهاتف غير صحيح'
      }),

    email: Joi.string()
      .email()
      .max(100)
      .allow('', null)
      .optional()
      .messages({
        'string.email': 'البريد الإلكتروني غير صحيح',
        'string.max': 'البريد الإلكتروني يجب ألا يزيد عن 100 حرف'
      }),

    cityId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'معرف المدينة يجب أن يكون رقم',
        'number.positive': 'معرف المدينة يجب أن يكون موجب',
        'any.required': 'المدينة مطلوبة'
      }),

    managerId: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .optional()
      .messages({
        'number.base': 'معرف المدير يجب أن يكون رقم',
        'number.positive': 'معرف المدير يجب أن يكون موجب'
      }),

    isActive: Joi.boolean()
      .default(true),

    workingHours: Joi.object({
      sunday: Joi.object({
        open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      }).allow(null),
      monday: Joi.object({
        open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      }).allow(null),
      // ... باقي الأيام
    }).optional(),

    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional(),

    settings: Joi.object().optional()
  }),

  // Update Branch Schema
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

  // List Branches Query Schema
  listBranches: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
      .messages({
        'number.min': 'رقم الصفحة يجب أن يكون على الأقل 1',
        'number.base': 'رقم الصفحة يجب أن يكون رقم'
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .optional()
      .messages({
        'number.min': 'عدد العناصر يجب أن يكون على الأقل 1',
        'number.max': 'عدد العناصر يجب ألا يزيد عن 100',
        'number.base': 'عدد العناصر يجب أن يكون رقم'
      }),

    search: Joi.string()
      .max(100)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'نص البحث يجب ألا يزيد عن 100 حرف'
      }),

    cityId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'معرف المدينة يجب أن يكون رقم',
        'number.positive': 'معرف المدينة يجب أن يكون موجب'
      }),

    isActive: Joi.boolean()
      .optional(),

    sortBy: Joi.string()
      .valid('name', 'city', 'createdAt', 'updatedAt')
      .default('name')
      .optional()
      .messages({
        'any.only': 'حقل الترتيب غير صحيح'
      }),

    sortOrder: Joi.string()
      .valid('ASC', 'DESC')
      .default('ASC')
      .optional()
      .messages({
        'any.only': 'اتجاه الترتيب يجب أن يكون ASC أو DESC'
      })
  }),

  // Branch ID Parameter Schema
  branchId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'معرف الفرع يجب أن يكون رقم',
        'number.positive': 'معرف الفرع يجب أن يكون موجب',
        'any.required': 'معرف الفرع مطلوب'
      })
  })
};

module.exports = {
  ...commonSchemas,
  branchSchemas
};
```

### الاستخدام في Routes

```javascript
const { validate } = require('../middleware/validation');
const { branchSchemas } = require('../middleware/validation');

// Create branch with validation
router.post(
  '/',
  authMiddleware,
  authorizeMiddleware(['Admin']),
  validate(branchSchemas.createBranch, 'body'),
  branchesController.createBranch
);

// Update branch with validation
router.put(
  '/:id',
  authMiddleware,
  authorizeMiddleware(['Admin', 'Manager']),
  validate(branchSchemas.branchId, 'params'),
  validate(branchSchemas.updateBranch, 'body'),
  branchesController.updateBranch
);

// List branches with query validation
router.get(
  '/',
  authMiddleware,
  authorizeMiddleware(['Admin', 'Manager']),
  validate(branchSchemas.listBranches, 'query'),
  branchesController.listBranches
);
```

### Response Format عند الخطأ

```json
{
  "success": false,
  "message": "خطأ في البيانات المدخلة",
  "errors": [
    {
      "field": "name",
      "message": "اسم الفرع مطلوب"
    },
    {
      "field": "cityId",
      "message": "المدينة مطلوبة"
    }
  ]
}
```

---

## 🏢 Branch Context Middleware

### إنشاء Middleware

**الملف:** `backend/middleware/branchContextMiddleware.js`

```javascript
const db = require('../db');

/**
 * Branch Context Middleware
 * يضيف معلومات الفرع للطلب بناءً على المستخدم
 */
const branchContextMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(); // إذا لم يكن المستخدم مسجل دخول
    }

    const userId = req.user.id;
    const userRole = req.user.role || req.user.roleId;

    // جلب معلومات المستخدم من قاعدة البيانات
    const [users] = await db.execute(
      `SELECT u.*, b.id as branchId, b.name as branchName, b.isActive as branchIsActive
       FROM User u
       LEFT JOIN Branch b ON u.branchId = b.id
       WHERE u.id = ? AND u.deletedAt IS NULL`,
      [userId]
    );

    if (users.length === 0) {
      return next();
    }

    const user = users[0];

    // إعداد Branch Context
    req.branchContext = {
      userId: user.id,
      userRole: userRole,
      branchId: user.branchId || null,
      branchName: user.branchName || null,
      branchIsActive: user.branchIsActive !== null ? Boolean(user.branchIsActive) : null,
      
      // الصلاحيات
      canAccessAllBranches: userRole === 'Admin' || userRole === 1,
      canManageBranch: userRole === 'Admin' || userRole === 'Manager' || userRole === 1 || userRole === 2,
      canViewBranch: true, // جميع المستخدمين يمكنهم رؤية فرعهم
      
      // Helper functions
      hasBranchAccess: (targetBranchId) => {
        if (req.branchContext.canAccessAllBranches) {
          return true;
        }
        return req.branchContext.branchId === targetBranchId;
      }
    };

    next();
  } catch (error) {
    console.error('Error in branchContextMiddleware:', error);
    next(); // Continue even if there's an error
  }
};

module.exports = branchContextMiddleware;
```

### الاستخدام

```javascript
const branchContextMiddleware = require('../middleware/branchContextMiddleware');

// في routes/branches.js
router.use(authMiddleware);
router.use(branchContextMiddleware); // بعد authMiddleware

// في Controller
exports.listBranches = async (req, res) => {
  try {
    let query = 'SELECT * FROM Branch WHERE deletedAt IS NULL';
    const params = [];

    // Filter by branch if user is not Admin
    if (!req.branchContext.canAccessAllBranches && req.branchContext.branchId) {
      query += ' AND id = ?';
      params.push(req.branchContext.branchId);
    }

    // ... باقي الكود
  } catch (error) {
    // ...
  }
};
```

### استخدام في Controllers

```javascript
// في branchesController.js
exports.getBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // Check branch access
    if (!req.branchContext.hasBranchAccess(parseInt(id))) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول لهذا الفرع'
      });
    }

    // ... باقي الكود
  } catch (error) {
    // ...
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can manage this branch
    if (!req.branchContext.canManageBranch) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتعديل الفروع'
      });
    }

    // Check branch access
    if (!req.branchContext.canAccessAllBranches) {
      if (req.branchContext.branchId !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'يمكنك تعديل فرعك فقط'
        });
      }
    }

    // ... باقي الكود
  } catch (error) {
    // ...
  }
};
```

---

## 📝 Activity Logging Middleware

### Helper Function

**في Controller:**

```javascript
const db = require('../db');

// Helper function for logging activities
const logActivity = async (userId, action, details = null) => {
  try {
    const query = 'INSERT INTO activity_log (userId, action, details) VALUES (?, ?, ?)';
    await db.execute(query, [
      userId,
      action,
      details ? JSON.stringify(details) : null
    ]);
    console.log(`✅ Activity logged: ${action} by user ${userId}`);
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    // Continue execution even if logging fails
  }
};
```

### الاستخدام في Controller

```javascript
exports.createBranch = async (req, res) => {
  try {
    const { name, address, phone, email, cityId, managerId, isActive } = req.body;
    const userId = req.user.id;

    // Validate city exists
    const [cities] = await db.execute('SELECT * FROM City WHERE id = ? AND deletedAt IS NULL', [cityId]);
    if (cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'المدينة غير موجودة'
      });
    }

    // Create branch
    const [result] = await db.execute(
      `INSERT INTO Branch (name, address, phone, email, cityId, managerId, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, address || null, phone || null, email || null, cityId, managerId || null, isActive !== undefined ? isActive : true]
    );

    const branchId = result.insertId;

    // Log activity
    await logActivity(userId, 'Branch Created', {
      branchId,
      branchName: name,
      cityId,
      managerId
    });

    // Get created branch
    const [branches] = await db.execute(
      `SELECT b.*, c.name as cityName, u.name as managerName
       FROM Branch b
       LEFT JOIN City c ON b.cityId = c.id
       LEFT JOIN User u ON b.managerId = u.id
       WHERE b.id = ?`,
      [branchId]
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفرع بنجاح',
      data: branches[0]
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الفرع',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get old branch data
    const [oldBranches] = await db.execute('SELECT * FROM Branch WHERE id = ? AND deletedAt IS NULL', [id]);
    if (oldBranches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الفرع غير موجود'
      });
    }

    const oldBranch = oldBranches[0];

    // Update branch
    const { name, address, phone, email, cityId, managerId, isActive } = req.body;
    
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (cityId !== undefined) {
      updateFields.push('cityId = ?');
      updateValues.push(cityId);
    }
    if (managerId !== undefined) {
      updateFields.push('managerId = ?');
      updateValues.push(managerId);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    const [result] = await db.execute(
      `UPDATE Branch SET ${updateFields.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'الفرع غير موجود'
      });
    }

    // Get updated branch
    const [updatedBranches] = await db.execute(
      `SELECT b.*, c.name as cityName, u.name as managerName
       FROM Branch b
       LEFT JOIN City c ON b.cityId = c.id
       LEFT JOIN User u ON b.managerId = u.id
       WHERE b.id = ?`,
      [id]
    );

    // Log activity with before/after
    await logActivity(userId, 'Branch Updated', {
      branchId: id,
      changes: {
        before: oldBranch,
        after: updatedBranches[0]
      }
    });

    res.json({
      success: true,
      message: 'تم تحديث الفرع بنجاح',
      data: updatedBranches[0]
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الفرع',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if branch exists
    const [branches] = await db.execute('SELECT * FROM Branch WHERE id = ? AND deletedAt IS NULL', [id]);
    if (branches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الفرع غير موجود'
      });
    }

    const branch = branches[0];

    // Check if branch can be deleted (no active users, repairs, etc.)
    const [activeUsers] = await db.execute(
      'SELECT COUNT(*) as count FROM User WHERE branchId = ? AND deletedAt IS NULL',
      [id]
    );
    if (activeUsers[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الفرع لأنه يحتوي على مستخدمين نشطين'
      });
    }

    const [activeRepairs] = await db.execute(
      'SELECT COUNT(*) as count FROM RepairRequest WHERE branchId = ? AND status NOT IN ("COMPLETED", "CANCELLED") AND deletedAt IS NULL',
      [id]
    );
    if (activeRepairs[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الفرع لأنه يحتوي على طلبات إصلاح نشطة'
      });
    }

    // Soft delete
    await db.execute(
      'UPDATE Branch SET deletedAt = NOW() WHERE id = ?',
      [id]
    );

    // Log activity
    await logActivity(userId, 'Branch Deleted', {
      branchId: id,
      branchName: branch.name
    });

    res.json({
      success: true,
      message: 'تم حذف الفرع بنجاح'
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الفرع',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
```

---

## ⚠️ Error Handling Middleware

### استخدام Error Handler الموجود

**الملف:** `backend/middleware/errorHandler.js`

```javascript
// في app.js
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);
```

### Custom Errors للفروع

**الملف:** `backend/utils/branchErrors.js`

```javascript
class BranchError extends Error {
  constructor(message, statusCode = 500, code = 'BRANCH_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'BranchError';
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

class BranchAccessDeniedError extends BranchError {
  constructor(branchId) {
    super(`Access denied to branch ${branchId}`, 403, 'BRANCH_ACCESS_DENIED');
    this.branchId = branchId;
  }
}

module.exports = {
  BranchError,
  BranchNotFoundError,
  BranchAlreadyExistsError,
  BranchCannotBeDeletedError,
  BranchAccessDeniedError
};
```

### الاستخدام في Controller

```javascript
const {
  BranchNotFoundError,
  BranchAlreadyExistsError,
  BranchCannotBeDeletedError,
  BranchAccessDeniedError
} = require('../utils/branchErrors');

exports.getBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check access
    if (!req.branchContext.hasBranchAccess(parseInt(id))) {
      throw new BranchAccessDeniedError(id);
    }

    const [branches] = await db.execute(
      `SELECT b.*, c.name as cityName, u.name as managerName
       FROM Branch b
       LEFT JOIN City c ON b.cityId = c.id
       LEFT JOIN User u ON b.managerId = u.id
       WHERE b.id = ? AND b.deletedAt IS NULL`,
      [id]
    );

    if (branches.length === 0) {
      throw new BranchNotFoundError(id);
    }

    res.json({
      success: true,
      data: branches[0]
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

---

## 🚦 Rate Limiting Middleware

### الاستخدام

```javascript
const rateLimit = require('express-rate-limit');

// Rate limiter للفروع
const branchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً'
});

// في routes
router.post(
  '/',
  authMiddleware,
  authorizeMiddleware(['Admin']),
  branchLimiter, // Apply rate limiting
  validate(branchSchemas.createBranch, 'body'),
  branchesController.createBranch
);
```

---

## 📊 Audit Logging

### استخدام AuditLog Table

```javascript
const logAudit = async (userId, action, entityType, entityId, beforeValue, afterValue) => {
  try {
    await db.execute(
      `INSERT INTO AuditLog (userId, action, actionType, entityType, entityId, beforeValue, afterValue, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        action,
        'UPDATE', // CREATE, UPDATE, DELETE
        entityType,
        entityId,
        beforeValue ? JSON.stringify(beforeValue) : null,
        afterValue ? JSON.stringify(afterValue) : null
      ]
    );
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

// في updateBranch
await logAudit(
  userId,
  'Branch Updated',
  'Branch',
  id,
  oldBranch,
  updatedBranch
);
```

---

## 💡 أمثلة عملية

### مثال كامل: Route مع جميع Middlewares

```javascript
// routes/branches.js
const express = require('express');
const router = express.Router();
const branchesController = require('../controllers/branchesController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const branchContextMiddleware = require('../middleware/branchContextMiddleware');
const { validate } = require('../middleware/validation');
const { branchSchemas } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiter
const branchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Apply middlewares in order
router.use(authMiddleware); // 1. Authenticate
router.use(branchContextMiddleware); // 2. Add branch context
router.use(branchLimiter); // 3. Rate limiting

// List branches
router.get(
  '/',
  authorizeMiddleware(['Admin', 'Manager']), // 4. Check authorization
  validate(branchSchemas.listBranches, 'query'), // 5. Validate query
  branchesController.listBranches // 6. Controller
);

// Create branch
router.post(
  '/',
  authorizeMiddleware(['Admin']), // 4. Check authorization
  validate(branchSchemas.createBranch, 'body'), // 5. Validate body
  branchesController.createBranch // 6. Controller (includes activity logging)
);

// Update branch
router.put(
  '/:id',
  authorizeMiddleware(['Admin', 'Manager']), // 4. Check authorization
  validate(branchSchemas.branchId, 'params'), // 5. Validate params
  validate(branchSchemas.updateBranch, 'body'), // 5. Validate body
  branchesController.updateBranch // 6. Controller (includes activity logging)
);

module.exports = router;
```

---

## ✅ Checklist التكامل

- [ ] Authentication Middleware على جميع Routes
- [ ] Authorization Middleware مع الصلاحيات الصحيحة
- [ ] Validation Middleware لجميع Inputs
- [ ] Branch Context Middleware
- [ ] Activity Logging في جميع العمليات
- [ ] Error Handling محسّن
- [ ] Rate Limiting على Routes الحساسة
- [ ] Audit Logging للعمليات المهمة

---

**تاريخ الإنشاء:** 2025-01-XX  
**آخر تحديث:** 2025-01-XX


