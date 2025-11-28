# 🔒 خطة الأمان - نظام المخزون
## Security Plan - Inventory System

**التاريخ:** 2025-01-27  
**الحالة:** Production Security Requirements  
**الأولوية:** 🔥 عالية جداً

---

## 📋 نظرة عامة

هذه الخطة تغطي جميع جوانب الأمان في نظام المخزون، بما في ذلك:
- 🔐 Authentication & Authorization
- 🛡️ Data Protection
- 🔍 Audit & Logging
- ⚡ Rate Limiting
- ✅ Input Validation

---

## 1️⃣ نظام الصلاحيات (RBAC)

### 1.1 Roles Hierarchy

```javascript
const InventoryRoles = {
  // Super Admin - كل الصلاحيات
  SUPER_ADMIN: {
    permissions: ['*'] // All permissions
  },
  
  // Inventory Manager - إدارة كاملة للمخزون
  INVENTORY_MANAGER: {
    permissions: [
      'inventory.*',
      'warehouse.*',
      'stock.*',
      'reports.view',
      'reports.export'
    ]
  },
  
  // Warehouse Manager - إدارة مخزن محدد
  WAREHOUSE_MANAGER: {
    permissions: [
      'inventory.view',
      'inventory.update',
      'stock.manage',
      'warehouse.manage',
      'reports.view'
    ],
    scope: 'warehouse' // محدود بمخزن معين
  },
  
  // Stock Keeper - إدخال الحركات فقط
  STOCK_KEEPER: {
    permissions: [
      'stock.movement.create',
      'stock.adjust',
      'barcode.scan',
      'reports.view'
    ]
  },
  
  // Viewer - عرض فقط
  VIEWER: {
    permissions: [
      'inventory.view',
      'stock.view',
      'reports.view'
    ]
  },
  
  // Technician - استخدام القطع في الصيانة
  TECHNICIAN: {
    permissions: [
      'inventory.view',
      'stock.reserve',
      'stock.use'
    ]
  }
};
```

### 1.2 Fine-grained Permissions

```javascript
const InventoryPermissions = {
  // Inventory Items
  'inventory.view': ['View inventory items'],
  'inventory.create': ['Create new items'],
  'inventory.update': ['Update existing items'],
  'inventory.delete': ['Delete items'],
  'inventory.import': ['Import items from CSV'],
  'inventory.export': ['Export items to CSV'],
  
  // Stock Management
  'stock.view': ['View stock levels'],
  'stock.adjust': ['Adjust stock quantities'],
  'stock.movement.create': ['Create stock movements'],
  'stock.movement.delete': ['Delete stock movements'],
  'stock.reserve': ['Reserve items'],
  'stock.unreserve': ['Unreserve items'],
  'stock.transfer': ['Transfer between warehouses'],
  
  // Warehouses
  'warehouse.view': ['View warehouses'],
  'warehouse.create': ['Create warehouses'],
  'warehouse.update': ['Update warehouses'],
  'warehouse.delete': ['Delete warehouses'],
  'warehouse.manage': ['Full warehouse management'],
  
  // Stock Count
  'stockcount.create': ['Create stock counts'],
  'stockcount.update': ['Update stock counts'],
  'stockcount.approve': ['Approve stock counts'],
  'stockcount.delete': ['Delete stock counts'],
  
  // Reports
  'reports.view': ['View reports'],
  'reports.export': ['Export reports'],
  
  // Settings
  'settings.view': ['View inventory settings'],
  'settings.update': ['Update inventory settings']
};
```

### 1.3 Warehouse-Level Permissions

```javascript
// صلاحيات محددة لكل مخزن
const warehousePermissions = {
  userId: 123,
  warehouses: [
    {
      warehouseId: 1,
      permissions: ['stock.view', 'stock.adjust']
    },
    {
      warehouseId: 2,
      permissions: ['stock.view', 'stock.adjust', 'stock.transfer']
    }
  ]
};
```

### 1.4 Implementation

```javascript
// middleware/authorizeMiddleware.js
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    const user = req.user;
    
    // Check if user has permission
    if (!hasPermission(user, requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action'
        }
      });
    }
    
    // Check warehouse scope if needed
    if (requiredPermission.includes('warehouse')) {
      const warehouseId = req.params.warehouseId || req.body.warehouseId;
      if (!canAccessWarehouse(user, warehouseId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'WAREHOUSE_ACCESS_DENIED',
            message: 'You do not have access to this warehouse'
          }
        });
      }
    }
    
    next();
  };
};

// Usage in routes
router.post('/:id/adjust',
  authMiddleware,
  authorize('stock.adjust'),
  validate(adjustStockSchema),
  async (req, res) => {
    // ...
  }
);
```

---

## 2️⃣ Input Validation

### 2.1 Schema Validation

```javascript
// middleware/validation.js
const inventorySchemas = {
  createItem: Joi.object({
    sku: Joi.string().max(50).required(),
    name: Joi.string().max(255).required(),
    type: Joi.string().max(100),
    purchasePrice: Joi.number().min(0).precision(2),
    sellingPrice: Joi.number().min(0).precision(2),
    minStockLevel: Joi.number().integer().min(0),
    maxStockLevel: Joi.number().integer().min(0),
    barcode: Joi.string().max(100).pattern(/^[A-Z0-9]+$/),
    description: Joi.string().max(1000)
  }),
  
  adjustStock: Joi.object({
    warehouseId: Joi.number().integer().required(),
    quantity: Joi.number().integer().required(),
    type: Joi.string().valid('add', 'subtract').required(),
    reason: Joi.string().max(500),
    notes: Joi.string().max(1000)
  })
};
```

### 2.2 SQL Injection Prevention

```javascript
// ✅ CORRECT - Use prepared statements
const [rows] = await db.execute(
  'SELECT * FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
  [itemId]
);

// ❌ WRONG - String concatenation
const query = `SELECT * FROM InventoryItem WHERE id = ${itemId}`;
```

### 2.3 XSS Prevention

```javascript
// Sanitize user input
const sanitizeInput = (input) => {
  return validator.escape(input);
};

// Use in controllers
const name = sanitizeInput(req.body.name);
```

### 2.4 CSRF Protection

```javascript
// Use CSRF tokens
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to state-changing routes
router.post('/:id/adjust',
  authMiddleware,
  csrfProtection,
  authorize('stock.adjust'),
  async (req, res) => {
    // ...
  }
);
```

---

## 3️⃣ Data Protection

### 3.1 Sensitive Data Encryption

```javascript
// Encrypt sensitive fields
const crypto = require('crypto');

const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Example: Encrypt vendor payment information
const paymentInfo = {
  accountNumber: encrypt(req.body.accountNumber),
  bankName: encrypt(req.body.bankName)
};
```

### 3.2 Data Masking

```javascript
// Mask sensitive data in responses
const maskData = (data, userRole) => {
  if (userRole !== 'ADMIN' && userRole !== 'ACCOUNTANT') {
    // Mask purchase prices for non-admin users
    if (data.purchasePrice) {
      data.purchasePrice = null;
    }
  }
  return data;
};
```

### 3.3 Secure API Keys

```javascript
// Store API keys in environment variables
const apiKey = process.env.EXTERNAL_API_KEY;

// Never expose in logs
console.log('API Key: ********'); // ❌ Don't log actual keys
```

---

## 4️⃣ Rate Limiting

### 4.1 Global Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
```

### 4.2 Endpoint-Specific Rate Limiting

```javascript
// Stricter limits for sensitive endpoints
const adjustStockLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 adjustments per minute
  message: 'Too many stock adjustments, please try again later.'
});

const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 imports per hour
  message: 'Too many imports, please try again later.'
});

// Apply to routes
router.post('/:id/adjust',
  authMiddleware,
  adjustStockLimiter,
  authorize('stock.adjust'),
  async (req, res) => {
    // ...
  }
);
```

### 4.3 User-Based Rate Limiting

```javascript
// Different limits for different roles
const userRateLimit = (req, res, next) => {
  const user = req.user;
  let maxRequests;
  
  switch(user.role) {
    case 'ADMIN':
      maxRequests = 1000;
      break;
    case 'MANAGER':
      maxRequests = 500;
      break;
    default:
      maxRequests = 100;
  }
  
  // Check rate limit
  // ...
  next();
};
```

---

## 5️⃣ Audit Trail

### 5.1 Comprehensive Logging

```javascript
// services/auditService.js
class AuditService {
  async log(action, user, resource, changes, metadata = {}) {
    await db.execute(`
      INSERT INTO AuditLog (
        userId, action, resourceType, resourceId,
        changes, metadata, ipAddress, userAgent, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      user.id,
      action, // 'inventory.create', 'stock.adjust', etc.
      resource, // 'InventoryItem', 'StockLevel', etc.
      metadata.resourceId,
      JSON.stringify(changes),
      JSON.stringify(metadata),
      metadata.ipAddress,
      metadata.userAgent
    ]);
  }
}

// Usage
await auditService.log(
  'stock.adjust',
  req.user,
  'StockLevel',
  {
    itemId: itemId,
    warehouseId: warehouseId,
    oldQuantity: oldQty,
    newQuantity: newQty
  },
  {
    resourceId: stockLevelId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  }
);
```

### 5.2 Tracked Actions

```javascript
const TrackedActions = [
  'inventory.create',
  'inventory.update',
  'inventory.delete',
  'stock.adjust',
  'stock.movement.create',
  'stock.transfer.create',
  'stock.transfer.approve',
  'stockcount.create',
  'stockcount.approve',
  'warehouse.create',
  'warehouse.update',
  'warehouse.delete',
  'settings.update'
];
```

### 5.3 Audit Reports

```javascript
// GET /api/inventory/audit-logs
router.get('/audit-logs',
  authMiddleware,
  authorize('reports.view'),
  async (req, res) => {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;
    
    // Fetch audit logs with filters
    // ...
  }
);
```

---

## 6️⃣ Error Handling

### 6.1 Secure Error Messages

```javascript
// Don't expose internal errors
catch (error) {
  // ❌ WRONG
  res.status(500).json({
    message: error.message, // Exposes internal details
    stack: error.stack
  });
  
  // ✅ CORRECT
  console.error('Internal error:', error); // Log internally
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred. Please try again later.'
    }
  });
}
```

### 6.2 Error Codes

```javascript
const InventoryErrorCodes = {
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  WAREHOUSE_NOT_FOUND: 'WAREHOUSE_NOT_FOUND',
  DUPLICATE_SKU: 'DUPLICATE_SKU',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN'
};
```

---

## 7️⃣ API Security

### 7.1 HTTPS Only

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

### 7.2 API Key Authentication (for external systems)

```javascript
// For external integrations
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: { code: 'API_KEY_REQUIRED' }
    });
  }
  
  // Verify API key
  const isValid = verifyApiKey(apiKey);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_API_KEY' }
    });
  }
  
  next();
};
```

### 7.3 Request Size Limits

```javascript
// Limit request body size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Limit file upload size
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
```

---

## 8️⃣ Security Headers

### 8.1 Security Headers Middleware

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 9️⃣ Testing Security

### 9.1 Security Tests

```javascript
// tests/security/inventorySecurity.test.js
describe('Inventory Security', () => {
  it('should reject unauthorized access', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .expect(401);
  });
  
  it('should reject invalid permissions', async () => {
    const token = generateToken({ role: 'VIEWER' });
    const res = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
  
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE InventoryItem; --";
    const res = await request(app)
      .get(`/api/inventory?search=${maliciousInput}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    // Verify table still exists
    const [rows] = await db.execute('SHOW TABLES LIKE "InventoryItem"');
    expect(rows.length).toBe(1);
  });
});
```

---

## ✅ Security Checklist

### Pre-Deployment:
- [ ] All endpoints require authentication
- [ ] All endpoints have proper authorization
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Sensitive data encrypted
- [ ] Audit logging enabled
- [ ] Error messages don't expose internals
- [ ] HTTPS enforced in production

### Ongoing:
- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Monitor for vulnerabilities
- [ ] Review audit logs
- [ ] Test security regularly

---

**الخطوة التالية:** راجع [07_IMPLEMENTATION_ROADMAP.md](./07_IMPLEMENTATION_ROADMAP.md)

---

**آخر تحديث:** 2025-01-27  
**الإصدار:** 1.0.0


