# نظام الأوتوميشن - الأمان والصلاحيات
## Automation System - Security & Permissions

**التاريخ:** 2025-01-27  
**الحالة:** Production System

---

## 📋 جدول المحتويات

1. [RBAC Implementation](#rbac-implementation)
2. [Permission System](#permission-system)
3. [Audit Trail](#audit-trail)
4. [Rate Limiting](#rate-limiting)
5. [Data Protection](#data-protection)

---

## 🔐 RBAC Implementation

### 1.1 Permissions Matrix

```javascript
// backend/middleware/automationPermissions.js

const AUTOMATION_PERMISSIONS = {
    // Rules Management
    'automation.rules.view': ['Admin', 'Manager', 'AutomationManager'],
    'automation.rules.create': ['Admin', 'AutomationManager'],
    'automation.rules.update': ['Admin', 'AutomationManager'],
    'automation.rules.delete': ['Admin'],
    'automation.rules.execute': ['Admin', 'Manager', 'AutomationManager'],
    
    // Templates Management
    'automation.templates.view': ['Admin', 'Manager', 'AutomationManager', 'Support'],
    'automation.templates.create': ['Admin', 'AutomationManager'],
    'automation.templates.update': ['Admin', 'AutomationManager'],
    'automation.templates.delete': ['Admin'],
    
    // Executions
    'automation.executions.view': ['Admin', 'Manager', 'AutomationManager'],
    'automation.executions.retry': ['Admin', 'AutomationManager'],
    'automation.executions.cancel': ['Admin', 'AutomationManager'],
    
    // Logs
    'automation.logs.view': ['Admin', 'Manager', 'AutomationManager'],
    'automation.logs.export': ['Admin', 'Manager'],
    
    // Settings
    'automation.settings.view': ['Admin', 'Manager', 'AutomationManager'],
    'automation.settings.update': ['Admin'],
    
    // Notifications
    'automation.notifications.send': ['Admin', 'Manager', 'Support'],
    'automation.notifications.view': ['Admin', 'Manager', 'Support'],
};
```

### 1.2 Permission Middleware

```javascript
// backend/middleware/automationPermissions.js

const authorize = require('./authorizeMiddleware');

const requirePermission = (permission) => {
    return authorize(permission, {
        resource: 'automation',
        action: permission.split('.')[1]
    });
};

module.exports = {
    requirePermission,
    AUTOMATION_PERMISSIONS
};
```

### 1.3 Usage in Routes

```javascript
// backend/routes/automation.js

const { requirePermission } = require('../middleware/automationPermissions');

// GET /api/automation/rules
router.get('/rules',
    authMiddleware,
    requirePermission('automation.rules.view'),
    async (req, res) => {
        // ...
    }
);

// POST /api/automation/rules
router.post('/rules',
    authMiddleware,
    requirePermission('automation.rules.create'),
    async (req, res) => {
        // ...
    }
);

// DELETE /api/automation/rules/:id
router.delete('/rules/:id',
    authMiddleware,
    requirePermission('automation.rules.delete'),
    async (req, res) => {
        // ...
    }
);
```

---

## 🛡️ Permission System

### 2.1 Data Access Control

```javascript
// backend/services/automationService.js

class AutomationService {
    /**
     * جلب القواعد مع التحقق من الصلاحيات
     */
    async getRules(user, filters = {}) {
        const where = ['deletedAt IS NULL'];
        const params = [];
        
        // Data Filtering based on permissions
        if (!this.hasPermission(user, 'automation.rules.view_all')) {
            // المستخدمون العاديون يرون فقط القواعد النشطة
            where.push('isActive = TRUE');
        }
        
        // Additional filters
        if (filters.ruleType) {
            where.push('ruleType = ?');
            params.push(filters.ruleType);
        }
        
        const [rules] = await db.query(`
            SELECT * FROM AutomationRule 
            WHERE ${where.join(' AND ')}
            ORDER BY priority DESC, createdAt DESC
        `, params);
        
        // Mask sensitive data
        return rules.map(rule => this.maskRuleData(rule, user));
    }
    
    /**
     * إخفاء البيانات الحساسة
     */
    maskRuleData(rule, user) {
        const masked = { ...rule };
        
        // إخفاء الشروط والإجراءات للمستخدمين غير المصرحين
        if (!this.hasPermission(user, 'automation.rules.view_details')) {
            masked.conditions = '***';
            masked.actions = '***';
        }
        
        return masked;
    }
    
    hasPermission(user, permission) {
        const userPermissions = AUTOMATION_PERMISSIONS[permission] || [];
        return userPermissions.includes(user.role);
    }
}
```

### 2.2 Action-Level Permissions

```javascript
// التحقق من الصلاحية قبل تنفيذ إجراء

async executeAction(action, triggerData, rule, user) {
    // التحقق من صلاحية تنفيذ هذا النوع من الإجراءات
    const actionPermissions = {
        'send_notification': 'automation.notifications.send',
        'create_task': 'tasks.create',
        'update_status': 'automation.rules.execute',
        'create_interaction': 'crm.interactions.create'
    };
    
    const requiredPermission = actionPermissions[action.type];
    if (requiredPermission && !this.hasPermission(user, requiredPermission)) {
        throw new Error(`Permission denied: ${requiredPermission}`);
    }
    
    // تنفيذ الإجراء
    return await this.performAction(action, triggerData);
}
```

---

## 📝 Audit Trail

### 3.1 Audit Log Table

```sql
CREATE TABLE AutomationAuditLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Action Details
    action VARCHAR(100) NOT NULL COMMENT 'create, update, delete, execute, etc.',
    resourceType VARCHAR(50) NOT NULL COMMENT 'rule, template, execution, etc.',
    resourceId INT COMMENT 'ID المورد',
    
    -- User Info
    userId INT,
    userRole VARCHAR(50),
    userName VARCHAR(255),
    
    -- Changes
    oldValues JSON COMMENT 'القيم القديمة',
    newValues JSON COMMENT 'القيم الجديدة',
    
    -- Context
    ipAddress VARCHAR(45),
    userAgent TEXT,
    requestId VARCHAR(100) COMMENT 'Request ID للتتبع',
    
    -- Timestamp
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES User(id),
    
    INDEX idx_user_id (userId),
    INDEX idx_resource (resourceType, resourceId),
    INDEX idx_action (action),
    INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Audit Middleware

```javascript
// backend/middleware/automationAuditMiddleware.js

const db = require('../db');

const auditMiddleware = (action, resourceType) => {
    return async (req, res, next) => {
        // حفظ الاستجابة الأصلية
        const originalJson = res.json;
        
        res.json = function(data) {
            // تسجيل العملية بعد النجاح
            if (res.statusCode < 400 && req.user) {
                const auditData = {
                    action,
                    resourceType,
                    resourceId: req.params.id || null,
                    userId: req.user.id,
                    userRole: req.user.role,
                    userName: req.user.firstName + ' ' + req.user.lastName,
                    oldValues: req.body.oldValues || null,
                    newValues: req.body.newValues || req.body,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    requestId: req.id || null
                };
                
                // تسجيل غير متزامن (لا ينتظر)
                db.query(`
                    INSERT INTO AutomationAuditLog (
                        action, resourceType, resourceId, userId, userRole, userName,
                        oldValues, newValues, ipAddress, userAgent, requestId
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    auditData.action,
                    auditData.resourceType,
                    auditData.resourceId,
                    auditData.userId,
                    auditData.userRole,
                    auditData.userName,
                    JSON.stringify(auditData.oldValues),
                    JSON.stringify(auditData.newValues),
                    auditData.ipAddress,
                    auditData.userAgent,
                    auditData.requestId
                ]).catch(err => {
                    console.error('Audit log error:', err);
                });
            }
            
            // إرسال الاستجابة
            originalJson.call(this, data);
        };
        
        next();
    };
};

module.exports = auditMiddleware;
```

### 3.3 Usage

```javascript
// backend/routes/automation.js

const auditMiddleware = require('../middleware/automationAuditMiddleware');

// POST /api/automation/rules
router.post('/rules',
    authMiddleware,
    requirePermission('automation.rules.create'),
    auditMiddleware('create', 'rule'),
    async (req, res) => {
        // ...
    }
);

// PUT /api/automation/rules/:id
router.put('/rules/:id',
    authMiddleware,
    requirePermission('automation.rules.update'),
    auditMiddleware('update', 'rule'),
    async (req, res) => {
        // حفظ القيم القديمة
        const [oldRule] = await db.query('SELECT * FROM AutomationRule WHERE id = ?', [req.params.id]);
        req.body.oldValues = oldRule[0];
        
        // ...
    }
);
```

---

## 🚦 Rate Limiting

### 4.1 Rate Limiting Configuration

```javascript
// backend/middleware/automationRateLimit.js

const rateLimit = require('express-rate-limit');

// Rate limits مختلفة حسب نوع العملية
const rateLimits = {
    // إنشاء/تعديل القواعد
    rules: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 دقيقة
        max: 10, // 10 طلبات
        message: 'تم تجاوز الحد المسموح لإنشاء/تعديل القواعد'
    }),
    
    // تنفيذ القواعد يدوياً
    execute: rateLimit({
        windowMs: 60 * 1000, // دقيقة واحدة
        max: 5, // 5 طلبات
        message: 'تم تجاوز الحد المسموح لتنفيذ القواعد'
    }),
    
    // إرسال إشعارات يدوية
    sendNotification: rateLimit({
        windowMs: 60 * 1000, // دقيقة واحدة
        max: 20, // 20 إشعار
        message: 'تم تجاوز الحد المسموح لإرسال الإشعارات'
    }),
    
    // جلب السجلات
    logs: rateLimit({
        windowMs: 60 * 1000, // دقيقة واحدة
        max: 30, // 30 طلب
        message: 'تم تجاوز الحد المسموح لجلب السجلات'
    })
};

module.exports = rateLimits;
```

### 4.2 Usage

```javascript
// backend/routes/automation.js

const rateLimits = require('../middleware/automationRateLimit');

// POST /api/automation/rules
router.post('/rules',
    authMiddleware,
    rateLimits.rules,
    requirePermission('automation.rules.create'),
    async (req, res) => {
        // ...
    }
);

// POST /api/automation/rules/:id/execute
router.post('/rules/:id/execute',
    authMiddleware,
    rateLimits.execute,
    requirePermission('automation.rules.execute'),
    async (req, res) => {
        // ...
    }
);
```

### 4.3 Per-User Rate Limiting

```javascript
// Rate limiting حسب المستخدم
const userRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: (req) => {
        // Admins لديهم حد أعلى
        if (req.user.role === 'Admin') return 100;
        if (req.user.role === 'Manager') return 50;
        return 20;
    },
    keyGenerator: (req) => {
        return `automation:${req.user.id}`;
    }
});
```

---

## 🔒 Data Protection

### 5.1 Encryption

```javascript
// backend/utils/encryption.js

const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }
    
    /**
     * تشفير البيانات الحساسة
     */
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    
    /**
     * فك التشفير
     */
    decrypt(encryptedData) {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
}

module.exports = new EncryptionService();
```

### 5.2 Sensitive Data Handling

```javascript
// تشفير البيانات الحساسة قبل الحفظ

// في NotificationLog
async createNotificationLog(data) {
    const encryptionService = require('../utils/encryption');
    
    // تشفير رقم الهاتف والبريد الإلكتروني
    const encryptedRecipient = encryptionService.encrypt(data.recipient);
    
    await db.query(`
        INSERT INTO NotificationLog (
            recipientContact, recipientContactEncrypted,
            message, messageEncrypted,
            // ...
        ) VALUES (?, ?, ?, ?, ...)
    `, [
        null, // لا نحفظ البيانات غير المشفرة
        JSON.stringify(encryptedRecipient),
        null,
        encryptionService.encrypt(data.message)
    ]);
}

// فك التشفير عند القراءة (للمستخدمين المصرحين فقط)
async getNotificationLog(id, user) {
    if (!this.hasPermission(user, 'automation.logs.view_sensitive')) {
        // إرجاع بيانات بدون معلومات حساسة
        return {
            ...log,
            recipientContact: '***',
            message: '***'
        };
    }
    
    // فك التشفير للمستخدمين المصرحين
    const encryptionService = require('../utils/encryption');
    return {
        ...log,
        recipientContact: encryptionService.decrypt(JSON.parse(log.recipientContactEncrypted)),
        message: encryptionService.decrypt(log.messageEncrypted)
    };
}
```

### 5.3 Data Masking

```javascript
// إخفاء البيانات الحساسة في الاستجابات

function maskSensitiveData(data, user) {
    const masked = { ...data };
    
    // إخفاء أرقام الهواتف
    if (masked.phone && !hasPermission(user, 'view_sensitive_contacts')) {
        masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
    }
    
    // إخفاء البريد الإلكتروني
    if (masked.email && !hasPermission(user, 'view_sensitive_contacts')) {
        const [name, domain] = masked.email.split('@');
        masked.email = `${name[0]}***@${domain}`;
    }
    
    // إخفاء المبالغ المالية
    if (masked.amount && !hasPermission(user, 'view_financial_details')) {
        masked.amount = '***';
    }
    
    return masked;
}
```

---

## 🔍 Security Best Practices

### 1. Input Validation
- ✅ تحقق من جميع المدخلات
- ✅ استخدم Validation Schemas
- ✅ رفض البيانات غير المتوقعة

### 2. SQL Injection Prevention
- ✅ استخدم Parameterized Queries
- ✅ لا تستخدم String Concatenation
- ✅ استخدم Prepared Statements

### 3. XSS Prevention
- ✅ Escape جميع البيانات في Frontend
- ✅ استخدم Content Security Policy
- ✅ Validate HTML في القوالب

### 4. CSRF Protection
- ✅ استخدم CSRF Tokens
- ✅ تحقق من Origin Header
- ✅ استخدم SameSite Cookies

### 5. API Security
- ✅ استخدم HTTPS دائماً
- ✅ Authenticate جميع الطلبات
- ✅ Authorize حسب الصلاحيات
- ✅ Rate Limit للطلبات

---

## 📊 Security Monitoring

### 6.1 Security Events

```javascript
// تسجيل الأحداث الأمنية
const securityEvents = {
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    PERMISSION_DENIED: 'permission_denied',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    DATA_BREACH_ATTEMPT: 'data_breach_attempt'
};

async function logSecurityEvent(eventType, details) {
    await db.query(`
        INSERT INTO SecurityLog (
            eventType, details, severity, ipAddress, userAgent, createdAt
        ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [
        eventType,
        JSON.stringify(details),
        details.severity || 'medium',
        details.ipAddress,
        details.userAgent
    ]);
    
    // إرسال تنبيه للـ Admins
    if (details.severity === 'high') {
        await notifyAdmins({
            type: 'security_alert',
            event: eventType,
            details
        });
    }
}
```

---

**الجزء التالي:** [خطة التنفيذ والاختبار](./06_AUTOMATION_IMPLEMENTATION.md)


