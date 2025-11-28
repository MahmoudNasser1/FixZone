# 🔐 خطة الأمان والصلاحيات - نظام التنقل والبارات

> **الجزء الثالث:** نظام الأمان والصلاحيات المحسّن

---

## 📋 نظرة عامة

هذا الملف يغطي جميع جوانب الأمان والصلاحيات لنظام التنقل والبارات، مع التركيز على:
- ✅ **RBAC System** - نظام التحكم في الوصول
- ✅ **Permission-based Access** - صلاحيات ديناميكية
- ✅ **Data Masking** - إخفاء البيانات الحساسة
- ✅ **Audit Logging** - تسجيل جميع العمليات
- ✅ **Session Management** - إدارة الجلسات

---

## 1️⃣ نظام RBAC المحسّن

### **1.1 هيكل الصلاحيات:**
```javascript
// backend/models/permissions.js
const NavigationPermissions = {
  // Dashboard
  'dashboard.view': {
    description: 'عرض لوحة التحكم',
    roles: ['Admin', 'Manager', 'Technician', 'Receptionist', 'Accountant']
  },
  
  // Repairs
  'repairs.view': {
    description: 'عرض طلبات الإصلاح',
    roles: ['Admin', 'Manager', 'Technician', 'Receptionist']
  },
  'repairs.view_all': {
    description: 'عرض جميع طلبات الإصلاح',
    roles: ['Admin', 'Manager']
  },
  'repairs.view_assigned': {
    description: 'عرض الطلبات المخصصة',
    roles: ['Technician']
  },
  'repairs.create': {
    description: 'إنشاء طلب إصلاح',
    roles: ['Admin', 'Manager', 'Receptionist']
  },
  'repairs.update': {
    description: 'تعديل طلب إصلاح',
    roles: ['Admin', 'Manager', 'Technician']
  },
  'repairs.delete': {
    description: 'حذف طلب إصلاح',
    roles: ['Admin']
  },
  'repairs.approve': {
    description: 'الموافقة على طلب إصلاح',
    roles: ['Admin', 'Manager']
  },
  
  // Customers
  'customers.view': {
    description: 'عرض العملاء',
    roles: ['Admin', 'Manager', 'Sales', 'Receptionist']
  },
  'customers.view_all': {
    description: 'عرض جميع العملاء',
    roles: ['Admin', 'Manager']
  },
  'customers.view_assigned': {
    description: 'عرض العملاء المخصصين',
    roles: ['Sales', 'Receptionist']
  },
  'customers.create': {
    description: 'إنشاء عميل',
    roles: ['Admin', 'Manager', 'Sales', 'Receptionist']
  },
  'customers.update': {
    description: 'تعديل عميل',
    roles: ['Admin', 'Manager', 'Sales']
  },
  'customers.delete': {
    description: 'حذف عميل',
    roles: ['Admin']
  },
  'customers.view_financial': {
    description: 'عرض البيانات المالية للعملاء',
    roles: ['Admin', 'Manager', 'Accountant']
  },
  
  // Inventory
  'inventory.view': {
    description: 'عرض المخزون',
    roles: ['Admin', 'Manager', 'Warehouse', 'Technician']
  },
  'inventory.create': {
    description: 'إضافة عنصر للمخزون',
    roles: ['Admin', 'Manager', 'Warehouse']
  },
  'inventory.update': {
    description: 'تعديل عنصر في المخزون',
    roles: ['Admin', 'Manager', 'Warehouse']
  },
  'inventory.delete': {
    description: 'حذف عنصر من المخزون',
    roles: ['Admin', 'Manager']
  },
  
  // Finance
  'finance.view': {
    description: 'عرض البيانات المالية',
    roles: ['Admin', 'Manager', 'Accountant']
  },
  'finance.create': {
    description: 'إنشاء معاملة مالية',
    roles: ['Admin', 'Manager', 'Accountant']
  },
  'finance.update': {
    description: 'تعديل معاملة مالية',
    roles: ['Admin', 'Manager', 'Accountant']
  },
  'finance.delete': {
    description: 'حذف معاملة مالية',
    roles: ['Admin']
  },
  
  // Reports
  'reports.view': {
    description: 'عرض التقارير',
    roles: ['Admin', 'Manager']
  },
  'reports.export': {
    description: 'تصدير التقارير',
    roles: ['Admin', 'Manager']
  },
  
  // Settings
  'settings.view': {
    description: 'عرض الإعدادات',
    roles: ['Admin', 'Manager']
  },
  'settings.update': {
    description: 'تعديل الإعدادات',
    roles: ['Admin']
  },
  'users.manage': {
    description: 'إدارة المستخدمين',
    roles: ['Admin']
  },
  'roles.manage': {
    description: 'إدارة الأدوار',
    roles: ['Admin']
  }
};

module.exports = NavigationPermissions;
```

### **1.2 Middleware للصلاحيات:**
```javascript
// backend/middleware/permissionMiddleware.js
const db = require('../db');

/**
 * Middleware للتحقق من الصلاحيات
 * @param {string|string[]} requiredPermissions - الصلاحيات المطلوبة
 */
const requirePermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userId = req.user.id;
      const roleId = req.user.roleId || req.user.role;
      
      // الحصول على صلاحيات المستخدم
      const [roles] = await db.execute(
        `SELECT permissions FROM Role WHERE id = ? AND deletedAt IS NULL`,
        [roleId]
      );
      
      if (!roles.length) {
        return res.status(403).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      const userPermissions = roles[0].permissions 
        ? JSON.parse(roles[0].permissions) 
        : {};
      
      // Admin لديه كل الصلاحيات
      if (userPermissions['*']) {
        return next();
      }
      
      // تحويل الصلاحيات المطلوبة إلى مصفوفة
      const permissionsArray = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];
      
      // التحقق من كل صلاحية
      const hasAllPermissions = permissionsArray.every(permission => {
        return hasPermission(userPermissions, permission);
      });
      
      if (!hasAllPermissions) {
        // تسجيل محاولة الوصول غير المصرح بها
        await logUnauthorizedAccess(userId, req.originalUrl, permissionsArray);
        
        return res.status(403).json({
          success: false,
          message: 'Access denied: Insufficient permissions',
          required: permissionsArray
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in permission middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

/**
 * Helper: التحقق من الصلاحية
 */
function hasPermission(userPermissions, requiredPermission) {
  if (!requiredPermission) return true;
  if (userPermissions['*']) return true; // Admin
  
  // Check exact permission
  if (userPermissions[requiredPermission]) return true;
  
  // Check wildcard permissions
  const permissionParts = requiredPermission.split('.');
  for (let i = permissionParts.length; i > 0; i--) {
    const wildcard = permissionParts.slice(0, i).join('.') + '.*';
    if (userPermissions[wildcard]) return true;
  }
  
  return false;
}

/**
 * Helper: تسجيل محاولة الوصول غير المصرح بها
 */
async function logUnauthorizedAccess(userId, url, requiredPermissions) {
  try {
    await db.execute(
      `INSERT INTO AuditLog (userId, action, entityType, entityId, details, ipAddress, userAgent, createdAt)
       VALUES (?, 'unauthorized_access', 'navigation', NULL, ?, ?, ?, NOW())`,
      [
        userId,
        JSON.stringify({ url, requiredPermissions }),
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      ]
    );
  } catch (error) {
    console.error('Error logging unauthorized access:', error);
  }
}

module.exports = requirePermission;
```

---

## 2️⃣ Data Masking

### **2.1 Masking للبيانات الحساسة:**
```javascript
// backend/utils/dataMasking.js
/**
 * إخفاء البيانات الحساسة حسب الصلاحيات
 */
class DataMasker {
  /**
   * إخفاء رقم الهاتف
   */
  static maskPhone(phone, hasPermission) {
    if (!phone) return null;
    if (hasPermission) return phone;
    
    // إظهار آخر 4 أرقام فقط
    return phone.replace(/\d(?=\d{4})/g, '*');
  }
  
  /**
   * إخفاء البريد الإلكتروني
   */
  static maskEmail(email, hasPermission) {
    if (!email) return null;
    if (hasPermission) return email;
    
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 2) + '***' + local.substring(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }
  
  /**
   * إخفاء البيانات المالية
   */
  static maskFinancial(data, hasPermission) {
    if (!data) return null;
    if (hasPermission) return data;
    
    // إخفاء المبالغ المالية
    if (typeof data === 'number') {
      return '***';
    }
    
    // إخفاء بيانات الفواتير
    if (data.invoiceNumber) {
      return {
        ...data,
        totalAmount: '***',
        paidAmount: '***',
        balance: '***',
        items: data.items?.map(item => ({
          ...item,
          price: '***',
          total: '***'
        }))
      };
    }
    
    return data;
  }
  
  /**
   * إخفاء بيانات العملاء
   */
  static maskCustomer(customer, userPermissions) {
    if (!customer) return null;
    
    const hasFinancialPermission = hasPermission(userPermissions, 'customers.view_financial');
    const hasFullPermission = hasPermission(userPermissions, 'customers.view_all');
    
    return {
      ...customer,
      phone: this.maskPhone(customer.phone, hasFullPermission),
      email: this.maskEmail(customer.email, hasFullPermission),
      financialData: hasFinancialPermission 
        ? customer.financialData 
        : this.maskFinancial(customer.financialData, false)
    };
  }
}

module.exports = DataMasker;
```

### **2.2 استخدام Data Masking في APIs:**
```javascript
// backend/routes/customers.js
const DataMasker = require('../utils/dataMasking');

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customerId = req.params.id;
    const userId = req.user.id;
    const roleId = req.user.roleId || req.user.role;
    
    // الحصول على صلاحيات المستخدم
    const [roles] = await db.execute(
      `SELECT permissions FROM Role WHERE id = ? AND deletedAt IS NULL`,
      [roleId]
    );
    
    const userPermissions = roles[0].permissions 
      ? JSON.parse(roles[0].permissions) 
      : {};
    
    // الحصول على بيانات العميل
    const [customers] = await db.execute(
      `SELECT * FROM Customer WHERE id = ? AND deletedAt IS NULL`,
      [customerId]
    );
    
    if (!customers.length) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    let customer = customers[0];
    
    // إخفاء البيانات الحساسة
    customer = DataMasker.maskCustomer(customer, userPermissions);
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});
```

---

## 3️⃣ Audit Logging

### **3.1 نظام Audit Logging:**
```javascript
// backend/utils/auditLogger.js
const db = require('../db');

class AuditLogger {
  /**
   * تسجيل عملية
   */
  static async log(action, entityType, entityId, details, req) {
    try {
      const userId = req.user?.id || null;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      await db.execute(
        `INSERT INTO AuditLog (userId, action, entityType, entityId, details, ipAddress, userAgent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          action,
          entityType,
          entityId,
          JSON.stringify(details),
          ipAddress,
          userAgent
        ]
      );
    } catch (error) {
      console.error('Error logging audit:', error);
      // لا نوقف العملية إذا فشل التسجيل
    }
  }
  
  /**
   * تسجيل الوصول إلى صفحة
   */
  static async logPageAccess(page, req) {
    await this.log('page_access', 'navigation', null, { page }, req);
  }
  
  /**
   * تسجيل البحث
   */
  static async logSearch(query, resultsCount, req) {
    await this.log('search', 'navigation', null, { query, resultsCount }, req);
  }
  
  /**
   * تسجيل محاولة وصول غير مصرح بها
   */
  static async logUnauthorizedAccess(url, requiredPermissions, req) {
    await this.log('unauthorized_access', 'navigation', null, {
      url,
      requiredPermissions
    }, req);
  }
  
  /**
   * تسجيل تعديل بيانات
   */
  static async logDataModification(entityType, entityId, changes, req) {
    await this.log('data_modification', entityType, entityId, { changes }, req);
  }
}

module.exports = AuditLogger;
```

### **3.2 استخدام Audit Logging:**
```javascript
// backend/routes/navigation.js
const AuditLogger = require('../utils/auditLogger');

router.get('/items', authMiddleware, async (req, res) => {
  try {
    // ... كود الحصول على navigation items
    
    // تسجيل الوصول
    await AuditLogger.logPageAccess('navigation_items', req);
    
    res.json({
      success: true,
      data: filteredItems
    });
  } catch (error) {
    // ... معالجة الأخطاء
  }
});

router.get('/search/global', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    
    // ... كود البحث
    
    // تسجيل البحث
    await AuditLogger.logSearch(q, results.length, req);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    // ... معالجة الأخطاء
  }
});
```

---

## 4️⃣ Session Management

### **4.1 إدارة الجلسات المحسّنة:**
```javascript
// backend/middleware/sessionMiddleware.js
const db = require('../db');

/**
 * Middleware للتحقق من صحة الجلسة
 */
const validateSession = async (req, res, next) => {
  try {
    // التحقق من JWT token
    const token = req.cookies.token || req.headers['x-auth-token'];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // التحقق من صحة Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // التحقق من أن المستخدم موجود ونشط
    const [users] = await db.execute(
      `SELECT id, email, roleId, isActive, deletedAt 
       FROM User 
       WHERE id = ? AND deletedAt IS NULL`,
      [decoded.userId]
    );
    
    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      });
    }
    
    // إضافة معلومات المستخدم إلى Request
    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.roleId
    };
    
    // تحديث آخر نشاط
    await db.execute(
      `UPDATE User SET lastActivityAt = NOW() WHERE id = ?`,
      [user.id]
    );
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    console.error('Error validating session:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating session',
      error: error.message
    });
  }
};

module.exports = validateSession;
```

### **4.2 Session Timeout:**
```javascript
// backend/middleware/sessionTimeout.js
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const checkSessionTimeout = (req, res, next) => {
  const lastActivity = req.session?.lastActivity;
  
  if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT) {
    // الجلسة منتهية
    req.session.destroy();
    return res.status(401).json({
      success: false,
      message: 'Session expired'
    });
  }
  
  // تحديث آخر نشاط
  req.session.lastActivity = Date.now();
  next();
};

module.exports = checkSessionTimeout;
```

---

## 5️⃣ Security Headers

### **5.1 إضافة Security Headers:**
```javascript
// backend/middleware/securityHeaders.js
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:;"
  );
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=()'
  );
  
  next();
};

module.exports = securityHeaders;
```

---

## 6️⃣ Input Validation

### **6.1 Validation Middleware:**
```javascript
// backend/middleware/validation.js
const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    req.validated = value;
    next();
  };
};

// Schemas
const searchSchema = Joi.object({
  q: Joi.string().min(2).max(100).required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

module.exports = {
  validate,
  searchSchema
};
```

---

## 📝 Checklist التنفيذ

### **RBAC System:**
- [ ] هيكل الصلاحيات
- [ ] Permission Middleware
- [ ] Role-based Filtering
- [ ] Dynamic Permissions

### **Data Masking:**
- [ ] Phone Masking
- [ ] Email Masking
- [ ] Financial Data Masking
- [ ] Customer Data Masking

### **Audit Logging:**
- [ ] Audit Logger
- [ ] Page Access Logging
- [ ] Search Logging
- [ ] Unauthorized Access Logging
- [ ] Data Modification Logging

### **Session Management:**
- [ ] Session Validation
- [ ] Session Timeout
- [ ] Last Activity Tracking
- [ ] Session Invalidation

### **Security:**
- [ ] Security Headers
- [ ] Input Validation
- [ ] SQL Injection Prevention
- [ ] XSS Prevention
- [ ] CSRF Protection

---

**التالي:** [Integration Plan](./04_INTEGRATION_PLAN.md)

