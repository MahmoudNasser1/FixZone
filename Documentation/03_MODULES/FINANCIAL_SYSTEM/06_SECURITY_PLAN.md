# خطة الأمان - نظام المالية
## Financial System - Security Plan

**تاريخ الإنشاء:** 2025-01-27  
**الحالة:** Production System - خطة أمان شاملة  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [نظرة عامة على الأمان](#1-نظرة-عامة-على-الأمان)
2. [Authentication و Authorization](#2-authentication-و-authorization)
3. [Data Protection](#3-data-protection)
4. [Input Validation](#4-input-validation)
5. [SQL Injection Prevention](#5-sql-injection-prevention)
6. [XSS Protection](#6-xss-protection)
7. [CSRF Protection](#7-csrf-protection)
8. [Rate Limiting](#8-rate-limiting)
9. [Audit Logging](#9-audit-logging)
10. [Encryption](#10-encryption)

---

## 1. نظرة عامة على الأمان

### 1.1 المخاطر الأمنية

| المخاطرة | الأولوية | الحالة الحالية | الحالة المطلوبة |
|---------|---------|---------------|----------------|
| SQL Injection | 🔴 حرجة | ⚠️ جزئي | ✅ كامل |
| XSS Attacks | 🔴 حرجة | ⚠️ جزئي | ✅ كامل |
| CSRF Attacks | 🔴 حرجة | ⚠️ جزئي | ✅ كامل |
| Unauthorized Access | 🔴 حرجة | ⚠️ جزئي | ✅ كامل |
| Data Exposure | 🟡 متوسطة | ⚠️ جزئي | ✅ كامل |
| Rate Limiting | 🟡 متوسطة | ⚠️ جزئي | ✅ كامل |

---

## 2. Authentication و Authorization

### 2.1 Authentication

#### 2.1.1 JWT Tokens

```javascript
// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
```

#### 2.1.2 Token Refresh

```javascript
// Implement refresh token mechanism
const refreshToken = jwt.sign(
  { userId: user.id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

### 2.2 Authorization

#### 2.2.1 Role-Based Access Control (RBAC)

```javascript
// backend/middleware/financial/financialAuth.middleware.js
const checkFinancialPermission = async (user, action, resource) => {
  const permissions = {
    admin: ['*'], // All permissions
    accountant: ['read', 'create', 'update'],
    manager: ['read', 'create', 'update', 'delete'],
    user: ['read']
  };

  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
};
```

#### 2.2.2 Resource-Level Authorization

```javascript
// Check if user can access specific resource
const checkResourceAccess = async (user, resourceType, resourceId) => {
  // Check ownership
  if (resourceType === 'expense') {
    const expense = await expensesRepository.findById(resourceId);
    if (expense.createdBy === user.id) return true;
  }

  // Check role
  if (['admin', 'accountant', 'manager'].includes(user.role)) {
    return true;
  }

  return false;
};
```

---

## 3. Data Protection

### 3.1 Sensitive Data Masking

```javascript
// Mask sensitive data in logs
const maskSensitiveData = (data) => {
  const sensitiveFields = ['amount', 'totalAmount', 'paymentMethod'];
  const masked = { ...data };
  
  sensitiveFields.forEach(field => {
    if (masked[field]) {
      masked[field] = '***';
    }
  });
  
  return masked;
};
```

### 3.2 Data Encryption at Rest

```javascript
// Encrypt sensitive data before storing
const crypto = require('crypto');

const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

---

## 4. Input Validation

### 4.1 Validation Schemas

```javascript
// backend/middleware/validation.js
const Joi = require('joi');

const financialSchemas = {
  expense: {
    createExpense: Joi.object({
      categoryId: Joi.number().integer().positive().required(),
      amount: Joi.number().positive().max(1000000).required(),
      description: Joi.string().min(3).max(1000).required(),
      date: Joi.date().max('now').required(),
      vendorId: Joi.number().integer().positive().optional(),
      branchId: Joi.number().integer().positive().optional()
    }),
    // ... other schemas
  }
};
```

### 4.2 Sanitization

```javascript
// Sanitize input to prevent XSS
const sanitize = require('sanitize-html');

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return sanitize(input, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  return input;
};
```

---

## 5. SQL Injection Prevention

### 5.1 Prepared Statements

```javascript
// Always use prepared statements
const getExpenseById = async (id) => {
  // ✅ Correct - Prepared statement
  const [rows] = await db.query(
    'SELECT * FROM Expense WHERE id = ? AND deletedAt IS NULL',
    [id]
  );
  return rows[0];
};

// ❌ Wrong - String concatenation
const getExpenseByIdWrong = async (id) => {
  const query = `SELECT * FROM Expense WHERE id = ${id}`;
  const [rows] = await db.query(query);
  return rows[0];
};
```

### 5.2 Parameterized Queries

```javascript
// Use parameterized queries for all database operations
const searchExpenses = async (searchTerm) => {
  const [rows] = await db.query(
    'SELECT * FROM Expense WHERE description LIKE ? AND deletedAt IS NULL',
    [`%${searchTerm}%`]
  );
  return rows;
};
```

### 5.3 Input Escaping

```javascript
// Escape special characters
const escapeSQL = (str) => {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    const map = {
      '\0': '\\0',
      '\x08': '\\b',
      '\x09': '\\t',
      '\x1a': '\\z',
      '\n': '\\n',
      '\r': '\\r',
      '"': '\\"',
      "'": "\\'",
      '\\': '\\\\',
      '%': '\\%'
    };
    return map[char];
  });
};
```

---

## 6. XSS Protection

### 6.1 Output Encoding

```javascript
// Encode output to prevent XSS
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
```

### 6.2 Content Security Policy

```javascript
// Set CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});
```

### 6.3 Frontend Sanitization

```javascript
// frontend - Sanitize user input
import DOMPurify from 'dompurify';

const sanitizeHTML = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

---

## 7. CSRF Protection

### 7.1 CSRF Tokens

```javascript
// Generate CSRF token
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to financial routes
router.post('/api/financial/*', csrfProtection, (req, res, next) => {
  next();
});
```

### 7.2 SameSite Cookies

```javascript
// Set SameSite cookie attribute
app.use(session({
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  }
}));
```

---

## 8. Rate Limiting

### 8.1 Rate Limiting Middleware

```javascript
// backend/middleware/financial/financialRateLimit.middleware.js
const rateLimit = require('express-rate-limit');

const financialRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many financial requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for admins
    return req.user && req.user.role === 'admin';
  }
});
```

### 8.2 Per-Endpoint Rate Limiting

```javascript
// Different limits for different endpoints
const createExpenseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50 // Lower limit for creation
});

const reportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20 // Very low limit for reports
});
```

---

## 9. Audit Logging

### 9.1 Audit Log Service

```javascript
// backend/services/auditLog.service.js
class AuditLogService {
  async logFinancialAction(action, entityType, entityId, userId, changes, req) {
    await auditLogRepository.create({
      action,
      entityType,
      entityId,
      userId,
      module: 'financial',
      changes: JSON.stringify(changes),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });
  }
}
```

### 9.2 Audit Log Middleware

```javascript
// Log all financial operations
const auditLogMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.path.startsWith('/api/financial')) {
      auditLogService.log({
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode
      });
    }
    originalSend.call(this, data);
  };
  
  next();
};
```

---

## 10. Encryption

### 10.1 Data Encryption

```javascript
// Encrypt sensitive financial data
const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
};
```

### 10.2 HTTPS Only

```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 📚 المراجع

- [الوضع الحالي](./01_OVERVIEW_AND_CURRENT_STATE.md)
- [خطة Backend](./02_BACKEND_DEVELOPMENT_PLAN.md)
- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)

---

**آخر تحديث:** 2025-01-27

