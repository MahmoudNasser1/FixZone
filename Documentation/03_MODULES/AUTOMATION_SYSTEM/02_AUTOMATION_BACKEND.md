# نظام الأوتوميشن - Backend Services والـ APIs
## Automation System - Backend Services & APIs

**التاريخ:** 2025-01-27  
**الحالة:** Production System

---

## 📋 جدول المحتويات

1. [Database Schema](#database-schema)
2. [Automation Service](#automation-service)
3. [Notification Services](#notification-services)
4. [Scheduled Jobs (Cron)](#scheduled-jobs-cron)
5. [APIs الشاملة](#apis-الشاملة)
6. [Error Handling](#error-handling)

---

## 🗄️ Database Schema

### 1.1 جدول AutomationRule

```sql
CREATE TABLE AutomationRule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'اسم القاعدة',
    description TEXT COMMENT 'وصف القاعدة',
    ruleType ENUM(
        'event_based',      -- بناءً على الأحداث
        'time_based',       -- بناءً على الوقت
        'condition_based',  -- بناءً على الشروط
        'workflow_based'    -- بناءً على سير العمل
    ) NOT NULL,
    
    -- Trigger Configuration
    triggerEvent VARCHAR(100) COMMENT 'الحدث المشغل (repair_completed, payment_received, etc.)',
    triggerModule VARCHAR(50) COMMENT 'الموديول (repairs, finance, inventory, etc.)',
    triggerConditions JSON COMMENT 'شروط إضافية',
    
    -- Schedule Configuration (for time_based)
    scheduleType ENUM('daily', 'weekly', 'monthly', 'custom') NULL,
    scheduleConfig JSON COMMENT 'إعدادات الجدولة (cron expression, time, etc.)',
    
    -- Actions
    actions JSON NOT NULL COMMENT 'قائمة الإجراءات',
    /*
    Example:
    [
        {
            "type": "send_notification",
            "channel": "whatsapp",
            "template": "repair_completed",
            "delay": 0
        },
        {
            "type": "create_task",
            "taskType": "follow_up",
            "delay": 7200
        }
    ]
    */
    
    -- Conditions
    conditions JSON COMMENT 'شروط التنفيذ',
    /*
    Example:
    {
        "operator": "AND",
        "rules": [
            {
                "field": "repair.status",
                "operator": "equals",
                "value": "completed"
            },
            {
                "field": "customer.segment",
                "operator": "in",
                "value": ["vip", "regular"]
            }
        ]
    }
    */
    
    -- Status
    isActive BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0 COMMENT 'الأولوية (أعلى = أولاً)',
    
    -- Metadata
    createdBy INT,
    updatedBy INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL,
    
    FOREIGN KEY (createdBy) REFERENCES User(id),
    FOREIGN KEY (updatedBy) REFERENCES User(id),
    
    INDEX idx_rule_type (ruleType),
    INDEX idx_trigger_event (triggerEvent),
    INDEX idx_is_active (isActive),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 1.2 جدول AutomationExecution

```sql
CREATE TABLE AutomationExecution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ruleId INT NOT NULL,
    ruleName VARCHAR(255),
    
    -- Execution Details
    executionType ENUM('automatic', 'manual', 'scheduled') NOT NULL,
    triggerEvent VARCHAR(100),
    triggerData JSON COMMENT 'بيانات الحدث المشغل',
    
    -- Context
    contextType VARCHAR(50) COMMENT 'repair, invoice, customer, etc.',
    contextId INT COMMENT 'ID الكيان المرتبط',
    
    -- Status
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    startedAt DATETIME NULL,
    completedAt DATETIME NULL,
    duration INT COMMENT 'المدة بالثواني',
    
    -- Results
    actionsExecuted INT DEFAULT 0,
    actionsSucceeded INT DEFAULT 0,
    actionsFailed INT DEFAULT 0,
    results JSON COMMENT 'نتائج التنفيذ',
    errorMessage TEXT,
    errorStack TEXT,
    
    -- Metadata
    executedBy INT COMMENT 'المستخدم الذي نفذ (للتنفيذ اليدوي)',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ruleId) REFERENCES AutomationRule(id),
    FOREIGN KEY (executedBy) REFERENCES User(id),
    
    INDEX idx_rule_id (ruleId),
    INDEX idx_status (status),
    INDEX idx_context (contextType, contextId),
    INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 1.3 جدول NotificationTemplate

```sql
CREATE TABLE NotificationTemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL COMMENT 'كود القالب (repair_completed, payment_reminder, etc.)',
    category VARCHAR(50) COMMENT 'repair, finance, inventory, crm, etc.',
    
    -- Template Content
    subject VARCHAR(500) COMMENT 'الموضوع (للإيميل)',
    message TEXT NOT NULL COMMENT 'محتوى الرسالة',
    messageType ENUM('text', 'html', 'markdown') DEFAULT 'text',
    
    -- Channels
    channels JSON COMMENT 'القنوات المدعومة ["whatsapp", "email", "sms"]',
    
    -- Variables
    variables JSON COMMENT 'قائمة المتغيرات المتاحة',
    /*
    Example:
    [
        {"name": "customerName", "type": "string", "required": true},
        {"name": "repairId", "type": "number", "required": true},
        {"name": "deviceModel", "type": "string", "required": false}
    ]
    */
    
    -- Localization
    language VARCHAR(10) DEFAULT 'ar' COMMENT 'ar, en, etc.',
    
    -- Status
    isActive BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    createdBy INT,
    updatedBy INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (createdBy) REFERENCES User(id),
    FOREIGN KEY (updatedBy) REFERENCES User(id),
    
    INDEX idx_code (code),
    INDEX idx_category (category),
    INDEX idx_is_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 1.4 جدول NotificationLog

```sql
CREATE TABLE NotificationLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notificationType VARCHAR(100) NOT NULL,
    channel ENUM('whatsapp', 'email', 'sms', 'push', 'in_app') NOT NULL,
    
    -- Recipient
    recipientType ENUM('customer', 'user', 'vendor', 'other') NOT NULL,
    recipientId INT,
    recipientContact VARCHAR(255) COMMENT 'رقم الهاتف أو البريد',
    
    -- Content
    templateCode VARCHAR(100),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    variables JSON COMMENT 'المتغيرات المستخدمة',
    
    -- Status
    status ENUM('pending', 'sent', 'delivered', 'failed', 'read') DEFAULT 'pending',
    sentAt DATETIME NULL,
    deliveredAt DATETIME NULL,
    readAt DATETIME NULL,
    
    -- Error Handling
    failureReason TEXT,
    retryCount INT DEFAULT 0,
    maxRetries INT DEFAULT 3,
    
    -- Context
    contextType VARCHAR(50),
    contextId INT,
    relatedRuleId INT COMMENT 'القاعدة المرتبطة',
    
    -- Provider Response
    providerResponse JSON COMMENT 'استجابة مزود الخدمة',
    externalId VARCHAR(255) COMMENT 'ID من مزود الخدمة',
    
    -- Metadata
    sentBy INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (relatedRuleId) REFERENCES AutomationRule(id),
    FOREIGN KEY (sentBy) REFERENCES User(id),
    
    INDEX idx_status (status),
    INDEX idx_channel (channel),
    INDEX idx_recipient (recipientType, recipientId),
    INDEX idx_context (contextType, contextId),
    INDEX idx_sent_at (sentAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## ⚙️ Automation Service

### 2.1 الملف: `backend/services/automationService.js`

```javascript
const db = require('../db');
const notificationService = require('./notificationService');
const taskService = require('./taskService');
const logger = require('../utils/logger');

class AutomationService {
    /**
     * تنفيذ قاعدة أتمتة
     */
    async executeRule(ruleId, triggerData = {}) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // جلب القاعدة
            const [rules] = await connection.query(
                'SELECT * FROM AutomationRule WHERE id = ? AND isActive = TRUE AND deletedAt IS NULL',
                [ruleId]
            );
            
            if (rules.length === 0) {
                throw new Error('Rule not found or inactive');
            }
            
            const rule = rules[0];
            
            // التحقق من الشروط
            const conditionsMet = await this.checkConditions(rule, triggerData);
            if (!conditionsMet) {
                await connection.commit();
                return { success: false, reason: 'Conditions not met' };
            }
            
            // إنشاء سجل التنفيذ
            const [executionResult] = await connection.query(`
                INSERT INTO AutomationExecution (
                    ruleId, ruleName, executionType, triggerEvent, 
                    triggerData, contextType, contextId, status, startedAt
                ) VALUES (?, ?, 'automatic', ?, ?, ?, ?, 'running', NOW())
            `, [
                rule.id,
                rule.name,
                rule.triggerEvent,
                JSON.stringify(triggerData),
                triggerData.contextType || null,
                triggerData.contextId || null
            ]);
            
            const executionId = executionResult.insertId;
            
            // تنفيذ الإجراءات
            const actions = JSON.parse(rule.actions || '[]');
            const results = [];
            let actionsExecuted = 0;
            let actionsSucceeded = 0;
            let actionsFailed = 0;
            
            for (const action of actions) {
                try {
                    // تطبيق التأخير إن وجد
                    if (action.delay && action.delay > 0) {
                        await this.sleep(action.delay * 1000);
                    }
                    
                    const result = await this.executeAction(action, triggerData, rule);
                    results.push({ action, result, success: true });
                    actionsSucceeded++;
                } catch (error) {
                    logger.error('Action execution failed', { action, error: error.message });
                    results.push({ action, error: error.message, success: false });
                    actionsFailed++;
                }
                actionsExecuted++;
            }
            
            // تحديث سجل التنفيذ
            await connection.query(`
                UPDATE AutomationExecution 
                SET status = 'completed',
                    completedAt = NOW(),
                    duration = TIMESTAMPDIFF(SECOND, startedAt, NOW()),
                    actionsExecuted = ?,
                    actionsSucceeded = ?,
                    actionsFailed = ?,
                    results = ?
                WHERE id = ?
            `, [
                actionsExecuted,
                actionsSucceeded,
                actionsFailed,
                JSON.stringify(results),
                executionId
            ]);
            
            await connection.commit();
            
            return {
                success: true,
                executionId,
                actionsExecuted,
                actionsSucceeded,
                actionsFailed,
                results
            };
            
        } catch (error) {
            await connection.rollback();
            logger.error('Rule execution failed', { ruleId, error: error.message });
            
            // تحديث سجل التنفيذ بالفشل
            if (executionId) {
                await connection.query(`
                    UPDATE AutomationExecution 
                    SET status = 'failed',
                        errorMessage = ?,
                        errorStack = ?
                    WHERE id = ?
                `, [error.message, error.stack, executionId]);
            }
            
            throw error;
        } finally {
            connection.release();
        }
    }
    
    /**
     * التحقق من الشروط
     */
    async checkConditions(rule, triggerData) {
        if (!rule.conditions) return true;
        
        const conditions = JSON.parse(rule.conditions);
        return await this.evaluateConditions(conditions, triggerData);
    }
    
    /**
     * تقييم الشروط
     */
    async evaluateConditions(conditions, data) {
        if (!conditions.operator) return true;
        
        const results = [];
        
        for (const rule of conditions.rules || []) {
            const value = await this.getFieldValue(rule.field, data);
            const result = this.compareValues(value, rule.operator, rule.value);
            results.push(result);
        }
        
        if (conditions.operator === 'AND') {
            return results.every(r => r === true);
        } else if (conditions.operator === 'OR') {
            return results.some(r => r === true);
        } else if (conditions.operator === 'NOT') {
            return !results[0];
        }
        
        return true;
    }
    
    /**
     * تنفيذ إجراء
     */
    async executeAction(action, triggerData, rule) {
        switch (action.type) {
            case 'send_notification':
                return await notificationService.send({
                    channel: action.channel,
                    template: action.template,
                    recipient: action.recipient || triggerData.recipient,
                    variables: action.variables || triggerData.variables || {},
                    contextType: triggerData.contextType,
                    contextId: triggerData.contextId,
                    relatedRuleId: rule.id
                });
                
            case 'create_task':
                return await taskService.create({
                    type: action.taskType,
                    title: action.title,
                    description: action.description,
                    assignedTo: action.assignedTo || triggerData.assignedTo,
                    dueDate: action.dueDate || triggerData.dueDate,
                    relatedTo: triggerData.contextType,
                    relatedId: triggerData.contextId
                });
                
            case 'update_status':
                return await this.updateEntityStatus(
                    triggerData.contextType,
                    triggerData.contextId,
                    action.status
                );
                
            case 'create_interaction':
                return await this.createInteraction({
                    customerId: triggerData.customerId,
                    type: action.interactionType,
                    notes: action.notes,
                    relatedTo: triggerData.contextType,
                    relatedId: triggerData.contextId
                });
                
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
    
    /**
     * معالجة الأحداث
     */
    async handleEvent(eventType, eventData) {
        // جلب القواعد المرتبطة بهذا الحدث
        const [rules] = await db.query(`
            SELECT * FROM AutomationRule 
            WHERE ruleType = 'event_based'
                AND triggerEvent = ?
                AND isActive = TRUE
                AND deletedAt IS NULL
            ORDER BY priority DESC, id ASC
        `, [eventType]);
        
        const results = [];
        
        for (const rule of rules) {
            try {
                const result = await this.executeRule(rule.id, {
                    ...eventData,
                    triggerEvent: eventType
                });
                results.push({ ruleId: rule.id, ruleName: rule.name, ...result });
            } catch (error) {
                logger.error('Event handling failed', { eventType, ruleId: rule.id, error });
                results.push({ ruleId: rule.id, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    // Helper Methods
    async getFieldValue(field, data) {
        // دعم nested fields مثل "customer.name"
        const parts = field.split('.');
        let value = data;
        
        for (const part of parts) {
            value = value?.[part];
        }
        
        return value;
    }
    
    compareValues(value, operator, expected) {
        switch (operator) {
            case 'equals': return value == expected;
            case 'not_equals': return value != expected;
            case 'greater_than': return value > expected;
            case 'less_than': return value < expected;
            case 'contains': return String(value).includes(String(expected));
            case 'in': return Array.isArray(expected) && expected.includes(value);
            case 'not_in': return Array.isArray(expected) && !expected.includes(value);
            default: return false;
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AutomationService();
```

---

## 📧 Notification Services

### 3.1 WhatsApp Service

```javascript
// backend/services/whatsappService.js
const axios = require('axios');
const db = require('../db');
const logger = require('../utils/logger');

class WhatsAppService {
    constructor() {
        this.apiUrl = process.env.WHATSAPP_API_URL;
        this.apiKey = process.env.WHATSAPP_API_KEY;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    }
    
    async sendMessage(phone, message, template = null) {
        try {
            const logId = await this.createLog({
                channel: 'whatsapp',
                recipient: phone,
                message,
                template,
                status: 'pending'
            });
            
            const payload = template 
                ? this.buildTemplatePayload(phone, template, message)
                : this.buildTextPayload(phone, message);
            
            const response = await axios.post(
                `${this.apiUrl}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            await this.updateLog(logId, {
                status: 'sent',
                externalId: response.data.messages[0]?.id,
                providerResponse: response.data,
                sentAt: new Date()
            });
            
            return { success: true, messageId: response.data.messages[0]?.id };
            
        } catch (error) {
            logger.error('WhatsApp send failed', { phone, error: error.message });
            await this.updateLog(logId, {
                status: 'failed',
                failureReason: error.message,
                retryCount: 1
            });
            throw error;
        }
    }
    
    buildTextPayload(phone, message) {
        return {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message }
        };
    }
    
    buildTemplatePayload(phone, template, message) {
        return {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
                name: template,
                language: { code: 'ar' },
                components: [{
                    type: 'body',
                    parameters: this.extractTemplateParams(message)
                }]
            }
        };
    }
    
    async createLog(data) {
        const [result] = await db.query(`
            INSERT INTO NotificationLog (
                notificationType, channel, recipientContact, message, 
                templateCode, status, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
            data.notificationType || 'custom',
            data.channel,
            data.recipient,
            data.message,
            data.template || null,
            data.status
        ]);
        
        return result.insertId;
    }
    
    async updateLog(logId, updates) {
        await db.query(`
            UPDATE NotificationLog 
            SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')}, updatedAt = NOW()
            WHERE id = ?
        `, [...Object.values(updates), logId]);
    }
}

module.exports = new WhatsAppService();
```

### 3.2 Email Service

```javascript
// backend/services/emailService.js
const nodemailer = require('nodemailer');
const db = require('../db');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    
    async sendEmail(to, subject, html, text = null) {
        try {
            const logId = await this.createLog({
                channel: 'email',
                recipient: to,
                subject,
                message: text || html,
                status: 'pending'
            });
            
            const info = await this.transporter.sendMail({
                from: `"FixZone" <${process.env.SMTP_FROM}>`,
                to,
                subject,
                text,
                html
            });
            
            await this.updateLog(logId, {
                status: 'sent',
                externalId: info.messageId,
                sentAt: new Date()
            });
            
            return { success: true, messageId: info.messageId };
            
        } catch (error) {
            logger.error('Email send failed', { to, error: error.message });
            await this.updateLog(logId, {
                status: 'failed',
                failureReason: error.message
            });
            throw error;
        }
    }
    
    async sendTemplate(to, templateCode, variables = {}) {
        // جلب القالب
        const [templates] = await db.query(
            'SELECT * FROM NotificationTemplate WHERE code = ? AND isActive = TRUE',
            [templateCode]
        );
        
        if (templates.length === 0) {
            throw new Error(`Template not found: ${templateCode}`);
        }
        
        const template = templates[0];
        
        // استبدال المتغيرات
        let subject = template.subject || '';
        let message = template.message || '';
        
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value);
            message = message.replace(regex, value);
        }
        
        // إرسال
        return await this.sendEmail(
            to,
            subject,
            template.messageType === 'html' ? message : this.textToHtml(message),
            template.messageType === 'text' ? message : null
        );
    }
    
    textToHtml(text) {
        return text.replace(/\n/g, '<br>');
    }
    
    async createLog(data) {
        const [result] = await db.query(`
            INSERT INTO NotificationLog (
                notificationType, channel, recipientContact, subject, message, 
                templateCode, status, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            data.notificationType || 'custom',
            data.channel,
            data.recipient,
            data.subject || null,
            data.message,
            data.template || null,
            data.status
        ]);
        
        return result.insertId;
    }
    
    async updateLog(logId, updates) {
        await db.query(`
            UPDATE NotificationLog 
            SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')}, updatedAt = NOW()
            WHERE id = ?
        `, [...Object.values(updates), logId]);
    }
}

module.exports = new EmailService();
```

---

## ⏰ Scheduled Jobs (Cron)

### 4.1 الملف: `backend/services/schedulerService.js`

```javascript
const CronJob = require('cron').CronJob;
const automationService = require('./automationService');
const db = require('../db');
const logger = require('../utils/logger');

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.timezone = 'Africa/Cairo';
    }
    
    /**
     * تهيئة جميع المهام المجدولة
     */
    async initialize() {
        // جلب جميع القواعد المجدولة
        const [rules] = await db.query(`
            SELECT * FROM AutomationRule 
            WHERE ruleType = 'time_based'
                AND isActive = TRUE
                AND deletedAt IS NULL
        `);
        
        for (const rule of rules) {
            this.scheduleRule(rule);
        }
        
        // مهام النظام الثابتة
        this.scheduleSystemJobs();
        
        logger.info('Scheduler initialized', { jobsCount: this.jobs.size });
    }
    
    /**
     * جدولة قاعدة
     */
    scheduleRule(rule) {
        const scheduleConfig = JSON.parse(rule.scheduleConfig || '{}');
        const cronExpression = scheduleConfig.cron || this.getDefaultCron(rule.scheduleType, scheduleConfig);
        
        const job = new CronJob(
            cronExpression,
            async () => {
                try {
                    logger.info('Executing scheduled rule', { ruleId: rule.id, ruleName: rule.name });
                    await automationService.executeRule(rule.id, {
                        executionType: 'scheduled',
                        scheduledAt: new Date()
                    });
                } catch (error) {
                    logger.error('Scheduled rule execution failed', { ruleId: rule.id, error: error.message });
                }
            },
            null,
            true,
            this.timezone
        );
        
        this.jobs.set(rule.id, job);
    }
    
    /**
     * مهام النظام الثابتة
     */
    scheduleSystemJobs() {
        // كل يوم الساعة 9 صباحاً: فحص العملاء غير النشطين
        new CronJob('0 9 * * *', async () => {
            await this.checkInactiveCustomers();
        }, null, true, this.timezone);
        
        // كل يوم الساعة 8 صباحاً: تهنئة أعياد الميلاد
        new CronJob('0 8 * * *', async () => {
            await this.sendBirthdayWishes();
        }, null, true, this.timezone);
        
        // كل يوم الساعة 6 مساءً: تذكير بالفواتير المستحقة
        new CronJob('0 18 * * *', async () => {
            await this.sendPaymentReminders();
        }, null, true, this.timezone);
        
        // كل أحد الساعة 12 ظهراً: إعادة حساب تصنيفات العملاء
        new CronJob('0 12 * * 0', async () => {
            await this.recalculateCustomerSegments();
        }, null, true, this.timezone);
    }
    
    getDefaultCron(scheduleType, config) {
        switch (scheduleType) {
            case 'daily':
                const time = config.time || '09:00';
                const [hours, minutes] = time.split(':');
                return `${minutes} ${hours} * * *`;
                
            case 'weekly':
                const day = config.dayOfWeek || 0; // 0 = Sunday
                const weeklyTime = config.time || '09:00';
                const [wHours, wMinutes] = weeklyTime.split(':');
                return `${wMinutes} ${wHours} * * ${day}`;
                
            case 'monthly':
                const dayOfMonth = config.dayOfMonth || 1;
                const monthlyTime = config.time || '09:00';
                const [mHours, mMinutes] = monthlyTime.split(':');
                return `${mMinutes} ${mHours} ${dayOfMonth} * *`;
                
            default:
                return '0 9 * * *'; // Default: daily at 9 AM
        }
    }
    
    async checkInactiveCustomers() {
        // Implementation
    }
    
    async sendBirthdayWishes() {
        // Implementation
    }
    
    async sendPaymentReminders() {
        // Implementation
    }
    
    async recalculateCustomerSegments() {
        // Implementation
    }
}

module.exports = new SchedulerService();
```

---

## 🔌 APIs الشاملة

### 5.1 Automation Rules APIs

```javascript
// backend/routes/automation.js

// GET /api/automation/rules - قائمة القواعد
router.get('/rules', authMiddleware, async (req, res) => {
    try {
        const { page = 1, pageSize = 20, ruleType, isActive } = req.query;
        
        let where = ['deletedAt IS NULL'];
        const params = [];
        
        if (ruleType) {
            where.push('ruleType = ?');
            params.push(ruleType);
        }
        
        if (isActive !== undefined) {
            where.push('isActive = ?');
            params.push(isActive === 'true');
        }
        
        const offset = (page - 1) * pageSize;
        
        const [rules] = await db.query(`
            SELECT * FROM AutomationRule 
            WHERE ${where.join(' AND ')}
            ORDER BY priority DESC, createdAt DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(pageSize), offset]);
        
        const [count] = await db.query(`
            SELECT COUNT(*) as total FROM AutomationRule 
            WHERE ${where.join(' AND ')}
        `, params);
        
        res.json({
            success: true,
            data: rules,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: count[0].total,
                totalPages: Math.ceil(count[0].total / pageSize)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/automation/rules - إنشاء قاعدة
router.post('/rules', authMiddleware, validate(automationSchemas.createRule), async (req, res) => {
    try {
        const ruleData = {
            ...req.body,
            createdBy: req.user.id,
            updatedBy: req.user.id
        };
        
        const [result] = await db.query(`
            INSERT INTO AutomationRule (
                name, description, ruleType, triggerEvent, triggerModule,
                triggerConditions, scheduleType, scheduleConfig,
                actions, conditions, isActive, priority, createdBy, updatedBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            ruleData.name,
            ruleData.description || null,
            ruleData.ruleType,
            ruleData.triggerEvent || null,
            ruleData.triggerModule || null,
            JSON.stringify(ruleData.triggerConditions || {}),
            ruleData.scheduleType || null,
            JSON.stringify(ruleData.scheduleConfig || {}),
            JSON.stringify(ruleData.actions || []),
            JSON.stringify(ruleData.conditions || {}),
            ruleData.isActive !== false,
            ruleData.priority || 0,
            ruleData.createdBy,
            ruleData.updatedBy
        ]);
        
        res.json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/automation/rules/:id - تحديث قاعدة
// DELETE /api/automation/rules/:id - حذف قاعدة
// POST /api/automation/rules/:id/execute - تنفيذ قاعدة يدوياً
// GET /api/automation/rules/:id/executions - سجل تنفيذات القاعدة
```

### 5.2 Templates APIs

```javascript
// GET /api/automation/templates - قائمة القوالب
// POST /api/automation/templates - إنشاء قالب
// PUT /api/automation/templates/:id - تحديث قالب
// DELETE /api/automation/templates/:id - حذف قالب
// POST /api/automation/templates/:id/preview - معاينة القالب
```

### 5.3 Executions APIs

```javascript
// GET /api/automation/executions - سجل التنفيذات
// GET /api/automation/executions/:id - تفاصيل تنفيذ
// POST /api/automation/executions/:id/retry - إعادة محاولة
```

### 5.4 Notifications APIs

```javascript
// GET /api/automation/notifications - سجل الإشعارات
// POST /api/automation/notifications/send - إرسال إشعار يدوي
// GET /api/automation/notifications/stats - إحصائيات الإشعارات
```

---

## ⚠️ Error Handling

### 6.1 Retry Mechanism

```javascript
async function retryNotification(logId, maxRetries = 3) {
    const [logs] = await db.query('SELECT * FROM NotificationLog WHERE id = ?', [logId]);
    
    if (logs.length === 0 || logs[0].retryCount >= maxRetries) {
        return false;
    }
    
    const log = logs[0];
    
    try {
        // إعادة المحاولة حسب القناة
        switch (log.channel) {
            case 'whatsapp':
                await whatsappService.sendMessage(log.recipientContact, log.message);
                break;
            case 'email':
                await emailService.sendEmail(log.recipientContact, log.subject, log.message);
                break;
            // ...
        }
        
        await db.query(`
            UPDATE NotificationLog 
            SET status = 'sent', retryCount = retryCount + 1, sentAt = NOW()
            WHERE id = ?
        `, [logId]);
        
        return true;
    } catch (error) {
        await db.query(`
            UPDATE NotificationLog 
            SET retryCount = retryCount + 1, failureReason = ?
            WHERE id = ?
        `, [error.message, logId]);
        
        return false;
    }
}
```

---

**الجزء التالي:** [Frontend Components](./03_AUTOMATION_FRONTEND.md)


