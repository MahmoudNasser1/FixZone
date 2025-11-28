# خطة تطوير Backend - بورتال العملاء

## 1. نظرة عامة

هذا المستند يغطي جميع تحسينات وتطويرات Backend لبورتال العملاء، بما في ذلك Routes، Controllers، Services، Middleware، Database، و Business Logic.

## 2. البنية الحالية

### 2.1 الملفات الموجودة

```
backend/
├── routes/
│   ├── customers.js              # Admin routes
│   ├── customerNotifications.js  # Customer notifications
│   └── customerDevices.js        # Customer devices
├── middleware/
│   ├── authMiddleware.js        # Authentication
│   └── authorizeMiddleware.js   # Authorization
└── controllers/
    └── (محدود)
```

## 3. البنية الجديدة المقترحة

### 3.1 هيكل المجلدات الجديد

```
backend/
├── routes/
│   └── customer/
│       ├── index.js              # Main customer router
│       ├── auth.js               # Authentication routes
│       ├── dashboard.js          # Dashboard routes
│       ├── repairs.js            # Repairs routes
│       ├── invoices.js           # Invoices routes
│       ├── devices.js            # Devices routes
│       ├── notifications.js      # Notifications routes
│       ├── profile.js            # Profile routes
│       └── payments.js           # Payment routes
├── controllers/
│   └── customer/
│       ├── authController.js
│       ├── dashboardController.js
│       ├── repairController.js
│       ├── invoiceController.js
│       ├── deviceController.js
│       ├── notificationController.js
│       ├── profileController.js
│       └── paymentController.js
├── services/
│   └── customer/
│       ├── customerService.js
│       ├── repairService.js
│       ├── invoiceService.js
│       ├── deviceService.js
│       ├── notificationService.js
│       └── paymentService.js
├── middleware/
│   ├── customerAuth.js           # Customer-specific auth
│   ├── customerRateLimit.js      # Rate limiting
│   ├── customerValidation.js     # Input validation
│   └── customerAudit.js          # Audit logging
└── models/
    └── customer/
        ├── customerModel.js
        └── customerQueries.js
```

## 4. Routes Development

### 4.1 Customer Router الرئيسي

**الملف**: `backend/routes/customer/index.js`

```javascript
const express = require('express');
const router = express.Router();

// Import sub-routers
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const repairsRouter = require('./repairs');
const invoicesRouter = require('./invoices');
const devicesRouter = require('./devices');
const notificationsRouter = require('./notifications');
const profileRouter = require('./profile');
const paymentsRouter = require('./payments');

// Apply customer authentication middleware to all routes
const customerAuth = require('../../middleware/customerAuth');
router.use(customerAuth);

// Mount sub-routers
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/repairs', repairsRouter);
router.use('/invoices', invoicesRouter);
router.use('/devices', devicesRouter);
router.use('/notifications', notificationsRouter);
router.use('/profile', profileRouter);
router.use('/payments', paymentsRouter);

module.exports = router;
```

### 4.2 Authentication Routes

**الملف**: `backend/routes/customer/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/customer/authController');
const { validate } = require('../../middleware/validation');
const { customerSchemas } = require('../../middleware/validation');

// POST /api/customer/auth/login
router.post('/login', 
  validate(customerSchemas.login, 'body'),
  authController.login
);

// POST /api/customer/auth/logout
router.post('/logout', authController.logout);

// POST /api/customer/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/customer/auth/forgot-password
router.post('/forgot-password',
  validate(customerSchemas.forgotPassword, 'body'),
  authController.forgotPassword
);

// POST /api/customer/auth/reset-password
router.post('/reset-password',
  validate(customerSchemas.resetPassword, 'body'),
  authController.resetPassword
);

// POST /api/customer/auth/verify-otp
router.post('/verify-otp',
  validate(customerSchemas.verifyOTP, 'body'),
  authController.verifyOTP
);

module.exports = router;
```

### 4.3 Dashboard Routes

**الملف**: `backend/routes/customer/dashboard.js`

```javascript
const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/customer/dashboardController');

// GET /api/customer/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/customer/dashboard/recent-repairs
router.get('/recent-repairs', dashboardController.getRecentRepairs);

// GET /api/customer/dashboard/recent-invoices
router.get('/recent-invoices', dashboardController.getRecentInvoices);

// GET /api/customer/dashboard/notifications-summary
router.get('/notifications-summary', dashboardController.getNotificationsSummary);

module.exports = router;
```

### 4.4 Repairs Routes

**الملف**: `backend/routes/customer/repairs.js`

```javascript
const express = require('express');
const router = express.Router();
const repairController = require('../../controllers/customer/repairController');
const { validate } = require('../../middleware/validation');
const { customerSchemas } = require('../../middleware/validation');

// GET /api/customer/repairs
router.get('/', 
  validate(customerSchemas.getRepairs, 'query'),
  repairController.getRepairs
);

// GET /api/customer/repairs/:id
router.get('/:id', repairController.getRepairDetails);

// POST /api/customer/repairs/:id/comments
router.post('/:id/comments',
  validate(customerSchemas.addComment, 'body'),
  repairController.addComment
);

// POST /api/customer/repairs/:id/request-update
router.post('/:id/request-update',
  validate(customerSchemas.requestUpdate, 'body'),
  repairController.requestUpdate
);

// GET /api/customer/repairs/:id/timeline
router.get('/:id/timeline', repairController.getTimeline);

// GET /api/customer/repairs/:id/attachments
router.get('/:id/attachments', repairController.getAttachments);

module.exports = router;
```

### 4.5 Invoices Routes

**الملف**: `backend/routes/customer/invoices.js`

```javascript
const express = require('express');
const router = express.Router();
const invoiceController = require('../../controllers/customer/invoiceController');
const { validate } = require('../../middleware/validation');
const { customerSchemas } = require('../../middleware/validation');

// GET /api/customer/invoices
router.get('/',
  validate(customerSchemas.getInvoices, 'query'),
  invoiceController.getInvoices
);

// GET /api/customer/invoices/:id
router.get('/:id', invoiceController.getInvoiceDetails);

// GET /api/customer/invoices/:id/pdf
router.get('/:id/pdf', invoiceController.downloadPDF);

// POST /api/customer/invoices/:id/pay
router.post('/:id/pay',
  validate(customerSchemas.payInvoice, 'body'),
  invoiceController.payInvoice
);

// GET /api/customer/invoices/:id/payment-history
router.get('/:id/payment-history', invoiceController.getPaymentHistory);

module.exports = router;
```

### 4.6 Devices Routes

**الملف**: `backend/routes/customer/devices.js`

```javascript
const express = require('express');
const router = express.Router();
const deviceController = require('../../controllers/customer/deviceController');
const { validate } = require('../../middleware/validation');
const { customerSchemas } = require('../../middleware/validation');

// GET /api/customer/devices
router.get('/', deviceController.getDevices);

// POST /api/customer/devices
router.post('/',
  validate(customerSchemas.addDevice, 'body'),
  deviceController.addDevice
);

// PUT /api/customer/devices/:id
router.put('/:id',
  validate(customerSchemas.updateDevice, 'body'),
  deviceController.updateDevice
);

// DELETE /api/customer/devices/:id
router.delete('/:id', deviceController.deleteDevice);

// GET /api/customer/devices/:id/repairs
router.get('/:id/repairs', deviceController.getDeviceRepairs);

module.exports = router;
```

### 4.7 Notifications Routes

**الملف**: `backend/routes/customer/notifications.js`

```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/customer/notificationController');
const { validate } = require('../../middleware/validation');
const { customerSchemas } = require('../../middleware/validation');

// GET /api/customer/notifications
router.get('/',
  validate(customerSchemas.getNotifications, 'query'),
  notificationController.getNotifications
);

// GET /api/customer/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/customer/notifications/:id/read
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/customer/notifications/read-all
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /api/customer/notifications/:id
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
```

### 4.8 Profile Routes

**الملف**: `backend/routes/customer/profile.js`

```javascript
const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/customer/profileController');
const { validate } = require('../../middleware/validation');
const { customerSchemas } = require('../../middleware/validation');

// GET /api/customer/profile
router.get('/', profileController.getProfile);

// PUT /api/customer/profile
router.put('/',
  validate(customerSchemas.updateProfile, 'body'),
  profileController.updateProfile
);

// POST /api/customer/profile/change-password
router.post('/change-password',
  validate(customerSchemas.changePassword, 'body'),
  profileController.changePassword
);

// POST /api/customer/profile/upload-avatar
router.post('/upload-avatar',
  upload.single('avatar'),
  profileController.uploadAvatar
);

module.exports = router;
```

### 4.9 Payments Routes

**الملف**: `backend/routes/customer/payments.js`

```javascript
const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/customer/paymentController');
const { validate } = require('../../middleware/validation');
const { customerSchemas } = require('../../middleware/validation');

// POST /api/customer/payments/initiate
router.post('/initiate',
  validate(customerSchemas.initiatePayment, 'body'),
  paymentController.initiatePayment
);

// POST /api/customer/payments/callback
router.post('/callback', paymentController.handleCallback);

// GET /api/customer/payments/history
router.get('/history',
  validate(customerSchemas.getPaymentHistory, 'query'),
  paymentController.getPaymentHistory
);

module.exports = router;
```

## 5. Controllers Development

### 5.1 Auth Controller

**الملف**: `backend/controllers/customer/authController.js`

```javascript
const customerService = require('../../services/customer/customerService');
const { generateToken, verifyToken } = require('../../utils/jwt');
const bcrypt = require('bcryptjs');
const { sendOTP, verifyOTP } = require('../../services/otpService');

exports.login = async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    
    // Find customer by phone or email
    const customer = await customerService.findByLoginIdentifier(loginIdentifier);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }
    
    // Check if account is active
    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'الحساب غير مفعّل'
      });
    }
    
    // Generate token
    const token = generateToken({
      id: customer.userId,
      customerId: customer.id,
      type: 'customer',
      roleId: customer.roleId
    });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Update last login
    await customerService.updateLastLogin(customer.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: customer.userId,
          customerId: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          roleId: customer.roleId
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الدخول'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الخروج'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { loginIdentifier } = req.body;
    
    const customer = await customerService.findByLoginIdentifier(loginIdentifier);
    if (!customer) {
      // Don't reveal if customer exists
      return res.json({
        success: true,
        message: 'إذا كان الحساب موجوداً، سيتم إرسال رمز التحقق'
      });
    }
    
    // Send OTP
    const otp = await sendOTP(customer.phone || customer.email);
    
    // Store OTP in session/cache
    // Implementation depends on your session/cache solution
    
    res.json({
      success: true,
      message: 'تم إرسال رمز التحقق'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال رمز التحقق'
    });
  }
};
```

### 5.2 Dashboard Controller

**الملف**: `backend/controllers/customer/dashboardController.js`

```javascript
const dashboardService = require('../../services/customer/dashboardService');

exports.getStats = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const stats = await dashboardService.getStats(customerId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
};

exports.getRecentRepairs = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const limit = parseInt(req.query.limit) || 5;
    const repairs = await dashboardService.getRecentRepairs(customerId, limit);
    
    res.json({
      success: true,
      data: repairs
    });
  } catch (error) {
    console.error('Get recent repairs error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب طلبات الإصلاح'
    });
  }
};
```

### 5.3 Repair Controller

**الملف**: `backend/controllers/customer/repairController.js`

```javascript
const repairService = require('../../services/customer/repairService');

exports.getRepairs = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortDir = 'DESC' } = req.query;
    
    const result = await repairService.getRepairs(customerId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortDir
    });
    
    res.json({
      success: true,
      data: result.repairs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get repairs error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب طلبات الإصلاح'
    });
  }
};

exports.getRepairDetails = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const repairId = parseInt(req.params.id);
    
    const repair = await repairService.getRepairDetails(customerId, repairId);
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'طلب الإصلاح غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: repair
    });
  } catch (error) {
    console.error('Get repair details error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تفاصيل طلب الإصلاح'
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const repairId = parseInt(req.params.id);
    const { comment } = req.body;
    
    const result = await repairService.addComment(customerId, repairId, comment);
    
    res.json({
      success: true,
      data: result,
      message: 'تم إضافة التعليق بنجاح'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة التعليق'
    });
  }
};
```

## 6. Services Development

### 6.1 Customer Service

**الملف**: `backend/services/customer/customerService.js`

```javascript
const db = require('../../db');
const customerQueries = require('../../models/customer/customerQueries');

class CustomerService {
  async findByLoginIdentifier(identifier) {
    const [rows] = await db.query(
      customerQueries.findByLoginIdentifier,
      [identifier, identifier]
    );
    return rows[0] || null;
  }
  
  async findById(id) {
    const [rows] = await db.query(
      customerQueries.findById,
      [id]
    );
    return rows[0] || null;
  }
  
  async updateLastLogin(customerId) {
    await db.query(
      customerQueries.updateLastLogin,
      [customerId]
    );
  }
  
  async updateProfile(customerId, data) {
    const { name, email, phone, address } = data;
    await db.query(
      customerQueries.updateProfile,
      [name, email, phone, address, customerId]
    );
    return this.findById(customerId);
  }
  
  async changePassword(customerId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      customerQueries.updatePassword,
      [hashedPassword, customerId]
    );
  }
}

module.exports = new CustomerService();
```

### 6.2 Repair Service

**الملف**: `backend/services/customer/repairService.js`

```javascript
const db = require('../../db');
const repairQueries = require('../../models/customer/repairQueries');

class RepairService {
  async getRepairs(customerId, options) {
    const { page, limit, status, sortBy, sortDir } = options;
    const offset = (page - 1) * limit;
    
    const whereConditions = ['rr.customerId = ?', 'rr.deletedAt IS NULL'];
    const params = [customerId];
    
    if (status) {
      whereConditions.push('rr.status = ?');
      params.push(status);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get repairs
    const [repairs] = await db.query(
      repairQueries.getRepairs(whereClause, sortBy, sortDir, limit, offset),
      params
    );
    
    // Get total count
    const [countResult] = await db.query(
      repairQueries.getRepairsCount(whereClause),
      params
    );
    const total = countResult[0].total;
    
    return {
      repairs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  async getRepairDetails(customerId, repairId) {
    const [rows] = await db.query(
      repairQueries.getRepairDetails,
      [repairId, customerId]
    );
    return rows[0] || null;
  }
  
  async addComment(customerId, repairId, comment) {
    // Verify repair belongs to customer
    const repair = await this.getRepairDetails(customerId, repairId);
    if (!repair) {
      throw new Error('Repair not found');
    }
    
    // Add comment
    const [result] = await db.query(
      repairQueries.addComment,
      [repairId, customerId, comment, 'customer']
    );
    
    return {
      id: result.insertId,
      repairId,
      comment,
      createdAt: new Date()
    };
  }
}

module.exports = new RepairService();
```

## 7. Middleware Development

### 7.1 Customer Auth Middleware

**الملف**: `backend/middleware/customerAuth.js`

```javascript
const authMiddleware = require('./authMiddleware');

const customerAuth = (req, res, next) => {
  // First verify authentication
  authMiddleware(req, res, () => {
    // Then verify it's a customer
    if (req.user.type !== 'customer' && !req.user.customerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customers only.'
      });
    }
    
    // Attach customerId to request
    req.customerId = req.user.customerId || req.user.id;
    next();
  });
};

module.exports = customerAuth;
```

### 7.2 Customer Rate Limit Middleware

**الملف**: `backend/middleware/customerRateLimit.js`

```javascript
const rateLimit = require('express-rate-limit');

const customerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each customer to 100 requests per windowMs
  keyGenerator: (req) => {
    return req.user?.customerId || req.ip;
  },
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = customerRateLimit;
```

### 7.3 Customer Validation Middleware

**الملف**: `backend/middleware/customerValidation.js`

```javascript
// Extend validation schemas in validation.js
// Add customer-specific validation rules
```

### 7.4 Customer Audit Middleware

**الملف**: `backend/middleware/customerAudit.js`

```javascript
const db = require('../db');

const customerAudit = async (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(data) {
    // Log customer actions
    if (req.user?.customerId) {
      db.query(
        'INSERT INTO CustomerAuditLog (customerId, action, endpoint, method, ipAddress, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          req.user.customerId,
          req.method,
          req.originalUrl,
          req.method,
          req.ip,
          req.get('user-agent')
        ]
      ).catch(err => console.error('Audit log error:', err));
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = customerAudit;
```

## 8. Database Development

### 8.1 جداول جديدة

```sql
-- Customer Audit Log
CREATE TABLE IF NOT EXISTS CustomerAuditLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customerId INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  requestData JSON,
  responseData JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customerId (customerId),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (customerId) REFERENCES Customer(id)
);

-- Customer Sessions
CREATE TABLE IF NOT EXISTS CustomerSession (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customerId INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customerId (customerId),
  INDEX idx_token (token),
  INDEX idx_expiresAt (expiresAt),
  FOREIGN KEY (customerId) REFERENCES Customer(id)
);

-- Customer Preferences
CREATE TABLE IF NOT EXISTS CustomerPreferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customerId INT NOT NULL UNIQUE,
  language VARCHAR(10) DEFAULT 'ar',
  theme VARCHAR(10) DEFAULT 'light',
  notifications JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customer(id)
);
```

### 8.2 Indexes Optimization

```sql
-- Optimize existing tables
ALTER TABLE RepairRequest ADD INDEX idx_customer_status (customerId, status);
ALTER TABLE Invoice ADD INDEX idx_customer_status (customerId, status);
ALTER TABLE Notification ADD INDEX idx_user_read (userId, isRead);
```

## 9. Error Handling

### 9.1 Custom Error Classes

**الملف**: `backend/utils/customerErrors.js`

```javascript
class CustomerError extends Error {
  constructor(message, statusCode = 500, code = 'CUSTOMER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'CustomerError';
  }
}

class CustomerNotFoundError extends CustomerError {
  constructor(message = 'العميل غير موجود') {
    super(message, 404, 'CUSTOMER_NOT_FOUND');
  }
}

class UnauthorizedCustomerError extends CustomerError {
  constructor(message = 'غير مصرح بالوصول') {
    super(message, 403, 'UNAUTHORIZED_CUSTOMER');
  }
}

module.exports = {
  CustomerError,
  CustomerNotFoundError,
  UnauthorizedCustomerError
};
```

### 9.2 Error Handler Middleware

**الملف**: `backend/middleware/customerErrorHandler.js`

```javascript
const { CustomerError } = require('../utils/customerErrors');

const customerErrorHandler = (err, req, res, next) => {
  if (err instanceof CustomerError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }
  
  // Log error
  console.error('Customer error:', err);
  
  // Return generic error
  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم'
  });
};

module.exports = customerErrorHandler;
```

## 10. Caching Strategy

### 10.1 Redis Cache

**الملف**: `backend/services/cache/customerCache.js`

```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

class CustomerCache {
  async get(key) {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key, value, ttl = 3600) {
    await client.setEx(key, ttl, JSON.stringify(value));
  }
  
  async del(key) {
    await client.del(key);
  }
  
  async getCustomerStats(customerId) {
    const key = `customer:stats:${customerId}`;
    return this.get(key);
  }
  
  async setCustomerStats(customerId, stats, ttl = 300) {
    const key = `customer:stats:${customerId}`;
    await this.set(key, stats, ttl);
  }
  
  async invalidateCustomerCache(customerId) {
    const patterns = [
      `customer:stats:${customerId}`,
      `customer:repairs:${customerId}:*`,
      `customer:invoices:${customerId}:*`
    ];
    
    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
  }
}

module.exports = new CustomerCache();
```

## 11. خطة التنفيذ

### Phase 1: Structure Setup (Week 1)
1. إنشاء هيكل المجلدات
2. إنشاء Routes الأساسية
3. إنشاء Controllers الأساسية
4. إنشاء Services الأساسية

### Phase 2: Core Features (Week 2-3)
1. Authentication
2. Dashboard
3. Repairs
4. Invoices

### Phase 3: Additional Features (Week 4)
1. Devices
2. Notifications
3. Profile
4. Payments

### Phase 4: Optimization (Week 5)
1. Caching
2. Error Handling
3. Performance Optimization
4. Security Hardening

## 12. Checklist

### 12.1 Routes
- [ ] Customer Router
- [ ] Auth Routes
- [ ] Dashboard Routes
- [ ] Repairs Routes
- [ ] Invoices Routes
- [ ] Devices Routes
- [ ] Notifications Routes
- [ ] Profile Routes
- [ ] Payments Routes

### 12.2 Controllers
- [ ] Auth Controller
- [ ] Dashboard Controller
- [ ] Repair Controller
- [ ] Invoice Controller
- [ ] Device Controller
- [ ] Notification Controller
- [ ] Profile Controller
- [ ] Payment Controller

### 12.3 Services
- [ ] Customer Service
- [ ] Repair Service
- [ ] Invoice Service
- [ ] Device Service
- [ ] Notification Service
- [ ] Payment Service

### 12.4 Middleware
- [ ] Customer Auth
- [ ] Rate Limiting
- [ ] Validation
- [ ] Audit Logging
- [ ] Error Handling

### 12.5 Database
- [ ] Audit Log Table
- [ ] Session Table
- [ ] Preferences Table
- [ ] Indexes Optimization

### 12.6 Caching
- [ ] Redis Setup
- [ ] Cache Service
- [ ] Cache Invalidation

---

**الملف التالي**: [خطة تطوير API](./04_API_DEVELOPMENT_PLAN.md)


