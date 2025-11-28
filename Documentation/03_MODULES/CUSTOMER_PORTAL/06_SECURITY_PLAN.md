# خطة الأمان - بورتال العملاء

## 1. نظرة عامة

هذا المستند يغطي جميع جوانب الأمان لبورتال العملاء، بما في ذلك Authentication، Authorization، Data Protection، API Security، Input Validation، و Security Best Practices.

## 2. Authentication (المصادقة)

### 2.1 Login Security

#### 2.1.1 Password Requirements

```javascript
// Password validation rules
const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional
  maxLength: 128
};

// Validate password
function validatePassword(password) {
  if (password.length < passwordRules.minLength) {
    return { valid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رقم' };
  }
  
  return { valid: true };
}
```

#### 2.1.2 Password Hashing

```javascript
const bcrypt = require('bcryptjs');

// Hash password with salt rounds
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

#### 2.1.3 Login Attempts Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Limit login attempts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => {
    return req.body.loginIdentifier || req.ip;
  },
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات الدخول المسموح بها. يرجى المحاولة لاحقاً.'
  },
  skipSuccessfulRequests: true
});

// Apply to login route
router.post('/login', loginRateLimit, authController.login);
```

#### 2.1.4 Account Lockout

```javascript
// Lock account after failed attempts
async function handleFailedLogin(customerId) {
  const attempts = await getFailedLoginAttempts(customerId);
  
  if (attempts >= 5) {
    // Lock account for 30 minutes
    await lockAccount(customerId, 30 * 60 * 1000);
    throw new Error('تم قفل الحساب مؤقتاً. يرجى المحاولة لاحقاً.');
  }
  
  await incrementFailedLoginAttempts(customerId);
}

async function handleSuccessfulLogin(customerId) {
  await resetFailedLoginAttempts(customerId);
}
```

### 2.2 JWT Token Security

#### 2.2.1 Token Generation

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Strong secret key
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'fixzone',
    audience: 'customer-portal'
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'fixzone',
    audience: 'customer-portal'
  });
}
```

#### 2.2.2 Token Storage

```javascript
// Store tokens securely
// Use HTTP-only cookies for tokens
res.cookie('token', token, {
  httpOnly: true, // Prevent XSS
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Store refresh token in database
await db.query(
  'INSERT INTO CustomerSession (customerId, token, expiresAt) VALUES (?, ?, ?)',
  [customerId, refreshToken, expiresAt]
);
```

#### 2.2.3 Token Validation

```javascript
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'fixzone',
      audience: 'customer-portal'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}
```

#### 2.2.4 Token Revocation

```javascript
// Revoke token on logout
async function revokeToken(token) {
  await db.query(
    'UPDATE CustomerSession SET revoked = 1 WHERE token = ?',
    [token]
  );
}

// Check if token is revoked
async function isTokenRevoked(token) {
  const [rows] = await db.query(
    'SELECT revoked FROM CustomerSession WHERE token = ?',
    [token]
  );
  return rows[0]?.revoked === 1;
}
```

### 2.3 Two-Factor Authentication (2FA) - Optional

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 2FA secret
function generate2FASecret(customerId) {
  const secret = speakeasy.generateSecret({
    name: `FixZone (${customerId})`,
    issuer: 'FixZone'
  });
  
  return {
    secret: secret.base32,
    qrCode: QRCode.toDataURL(secret.otpauth_url)
  };
}

// Verify 2FA token
function verify2FAToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps tolerance
  });
}
```

## 3. Authorization (التخويل)

### 3.1 Role-Based Access Control (RBAC)

```javascript
// Customer role check
function ensureCustomer(req, res, next) {
  if (req.user.type !== 'customer' && !req.user.customerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customers only.'
    });
  }
  next();
}

// Resource ownership check
async function ensureResourceOwnership(req, res, next) {
  const customerId = req.user.customerId;
  const resourceId = req.params.id;
  
  // Check if resource belongs to customer
  const resource = await getResourceById(resourceId);
  if (resource.customerId !== customerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not own this resource.'
    });
  }
  
  next();
}
```

### 3.2 Permission Checks

```javascript
// Check specific permissions
async function checkPermission(customerId, permission) {
  const customer = await getCustomerById(customerId);
  
  // Check if customer has permission
  const permissions = await getCustomerPermissions(customerId);
  return permissions.includes(permission);
}

// Middleware for permission check
function requirePermission(permission) {
  return async (req, res, next) => {
    const hasPermission = await checkPermission(req.user.customerId, permission);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    
    next();
  };
}
```

## 4. Data Protection

### 4.1 Data Encryption

#### 4.1.1 Encryption at Rest

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY; // 32 bytes

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(KEY, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

#### 4.1.2 Encryption in Transit

```javascript
// Use HTTPS only
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

const server = https.createServer(options, app);

// Force HTTPS redirect
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});
```

### 4.2 Data Masking

```javascript
// Mask sensitive data in logs
function maskSensitiveData(data) {
  if (data.phone) {
    data.phone = data.phone.replace(/(\d{3})\d+(\d{3})/, '$1***$2');
  }
  
  if (data.email) {
    const [local, domain] = data.email.split('@');
    data.email = `${local.substring(0, 2)}***@${domain}`;
  }
  
  return data;
}
```

### 4.3 PII Protection

```javascript
// Protect Personally Identifiable Information
const PII_FIELDS = ['phone', 'email', 'address', 'nationalId'];

function sanitizePII(data) {
  const sanitized = { ...data };
  
  PII_FIELDS.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = maskSensitiveData({ [field]: sanitized[field] })[field];
    }
  });
  
  return sanitized;
}
```

## 5. API Security

### 5.1 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  keyGenerator: (req) => {
    return req.user?.customerId || req.ip;
  },
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.'
  }
});

// Strict rate limit for sensitive operations
const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  keyGenerator: (req) => {
    return req.user?.customerId || req.ip;
  }
});

// Apply to routes
router.use('/api/customer', apiRateLimit);
router.use('/api/customer/profile/change-password', strictRateLimit);
```

### 5.2 CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CUSTOMER_PORTAL_URL,
      'https://fixzzone.com',
      'https://www.fixzzone.com'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 5.3 Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### 5.4 Request Validation

```javascript
const { body, validationResult } = require('express-validator');

// Validate request body
const validateRequest = [
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone('ar-EG'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
```

### 5.5 Input Sanitization

```javascript
const validator = require('validator');
const xss = require('xss');

function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove HTML tags
    input = validator.escape(input);
    
    // XSS protection
    input = xss(input);
    
    // Trim whitespace
    input = input.trim();
  }
  
  return input;
}

// Sanitize all inputs
app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
});

function sanitizeObject(obj) {
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeInput(obj[key]);
    }
  }
  return sanitized;
}
```

## 6. SQL Injection Prevention

### 6.1 Parameterized Queries

```javascript
// ✅ Good - Use parameterized queries
const [rows] = await db.query(
  'SELECT * FROM Customer WHERE id = ?',
  [customerId]
);

// ❌ Bad - String concatenation
const query = `SELECT * FROM Customer WHERE id = ${customerId}`;
```

### 6.2 Query Escaping

```javascript
const mysql = require('mysql2');

// Escape user input
const escapedId = mysql.escape(customerId);
const escapedName = mysql.escape(customerName);

const query = `SELECT * FROM Customer WHERE id = ${escapedId} AND name = ${escapedName}`;
```

## 7. XSS Prevention

### 7.1 Output Encoding

```javascript
// Encode output to prevent XSS
function encodeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

### 7.2 Content Security Policy

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

## 8. CSRF Protection

### 8.1 CSRF Tokens

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Generate CSRF token
app.get('/api/customer/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protect routes
router.post('/api/customer/profile', csrfProtection, profileController.updateProfile);
```

### 8.2 SameSite Cookies

```javascript
// Set SameSite attribute
res.cookie('token', token, {
  sameSite: 'strict', // CSRF protection
  httpOnly: true,
  secure: true
});
```

## 9. Session Security

### 9.1 Session Configuration

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({
    client: redisClient
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));
```

### 9.2 Session Regeneration

```javascript
// Regenerate session on login
req.session.regenerate((err) => {
  if (err) {
    return next(err);
  }
  
  req.session.customerId = customer.id;
  req.session.save((err) => {
    if (err) {
      return next(err);
    }
    next();
  });
});
```

## 10. File Upload Security

### 10.1 File Validation

```javascript
const multer = require('multer');
const path = require('path');

// Allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/customer/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${req.user.customerId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مسموح'));
    }
  }
});
```

### 10.2 File Scanning

```javascript
// Scan uploaded files for malware
const ClamScan = require('clamscan');

const clamscan = new ClamScan().init({
  removeInfected: true
});

async function scanFile(filePath) {
  const { isInfected, viruses } = await clamscan.isInfected(filePath);
  
  if (isInfected) {
    throw new Error(`File is infected: ${viruses.join(', ')}`);
  }
}
```

## 11. Audit Logging

### 11.1 Security Events Logging

```javascript
// Log security events
async function logSecurityEvent(event) {
  await db.query(
    'INSERT INTO SecurityAuditLog (customerId, eventType, details, ipAddress, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
    [
      event.customerId,
      event.type, // login, logout, password_change, etc.
      JSON.stringify(event.details),
      event.ipAddress,
      event.userAgent
    ]
  );
}

// Log login attempts
async function logLoginAttempt(customerId, success, ipAddress, userAgent) {
  await logSecurityEvent({
    customerId,
    type: success ? 'login_success' : 'login_failure',
    details: { success },
    ipAddress,
    userAgent
  });
}
```

### 11.2 Access Logging

```javascript
// Log all API access
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logAccess({
      customerId: req.user?.customerId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});
```

## 12. Security Monitoring

### 12.1 Intrusion Detection

```javascript
// Detect suspicious activities
async function detectSuspiciousActivity(customerId, activity) {
  const recentActivities = await getRecentActivities(customerId, 1 * 60 * 60 * 1000); // Last hour
  
  // Check for multiple failed login attempts
  const failedLogins = recentActivities.filter(a => a.type === 'login_failure');
  if (failedLogins.length >= 5) {
    await lockAccount(customerId);
    await sendSecurityAlert(customerId, 'Multiple failed login attempts');
  }
  
  // Check for unusual access patterns
  const unusualAccess = detectUnusualPattern(recentActivities);
  if (unusualAccess) {
    await sendSecurityAlert(customerId, 'Unusual access pattern detected');
  }
}
```

### 12.2 Security Alerts

```javascript
// Send security alerts
async function sendSecurityAlert(customerId, message) {
  // Send email
  await emailService.send({
    to: customer.email,
    subject: 'تنبيه أمني',
    template: 'security-alert',
    data: { message }
  });
  
  // Send SMS (optional)
  await smsService.send(customer.phone, `تنبيه أمني: ${message}`);
  
  // Log alert
  await logSecurityEvent({
    customerId,
    type: 'security_alert',
    details: { message }
  });
}
```

## 13. Compliance

### 13.1 GDPR Compliance

```javascript
// Right to access
async function exportCustomerData(customerId) {
  const data = await getAllCustomerData(customerId);
  return data;
}

// Right to deletion
async function deleteCustomerData(customerId) {
  // Anonymize data instead of hard delete
  await anonymizeCustomerData(customerId);
}

// Right to rectification
async function updateCustomerData(customerId, data) {
  await updateCustomer(customerId, data);
}
```

### 13.2 Data Retention

```javascript
// Automatic data cleanup
async function cleanupOldData() {
  // Delete old sessions (older than 90 days)
  await db.query(
    'DELETE FROM CustomerSession WHERE expiresAt < DATE_SUB(NOW(), INTERVAL 90 DAY)'
  );
  
  // Archive old audit logs (older than 1 year)
  await db.query(
    'INSERT INTO SecurityAuditLogArchive SELECT * FROM SecurityAuditLog WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 YEAR)'
  );
  
  await db.query(
    'DELETE FROM SecurityAuditLog WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 YEAR)'
  );
}
```

## 14. Security Checklist

### 14.1 Authentication
- [ ] Strong password requirements
- [ ] Password hashing (bcrypt)
- [ ] Login attempt limiting
- [ ] Account lockout
- [ ] JWT token security
- [ ] Token expiration
- [ ] Token revocation
- [ ] 2FA (optional)

### 14.2 Authorization
- [ ] Role-based access control
- [ ] Resource ownership checks
- [ ] Permission checks

### 14.3 Data Protection
- [ ] Encryption at rest
- [ ] Encryption in transit (HTTPS)
- [ ] Data masking
- [ ] PII protection

### 14.4 API Security
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Security headers
- [ ] Request validation
- [ ] Input sanitization

### 14.5 Vulnerability Prevention
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] File upload security

### 14.6 Monitoring
- [ ] Audit logging
- [ ] Security event logging
- [ ] Intrusion detection
- [ ] Security alerts

### 14.7 Compliance
- [ ] GDPR compliance
- [ ] Data retention policies
- [ ] Privacy policy

---

**الملف التالي**: [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)


