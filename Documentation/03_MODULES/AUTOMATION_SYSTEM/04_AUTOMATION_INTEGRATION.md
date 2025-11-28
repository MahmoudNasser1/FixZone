# نظام الأوتوميشن - التكامل مع الموديولات
## Automation System - Module Integration

**التاريخ:** 2025-01-27  
**الحالة:** Production System

---

## 📋 جدول المحتويات

1. [التكامل مع Repairs Module](#التكامل-مع-repairs-module)
2. [التكامل مع Finance Module](#التكامل-مع-finance-module)
3. [التكامل مع Inventory Module](#التكامل-مع-inventory-module)
4. [التكامل مع CRM Module](#التكامل-مع-crm-module)
5. [التكامل مع Notifications Module](#التكامل-مع-notifications-module)

---

## 🔧 التكامل مع Repairs Module

### 1.1 Events المتاحة

```javascript
// Events التي يمكن استخدامها في Automation Rules

const REPAIR_EVENTS = {
    // حالة الطلب
    REPAIR_CREATED: 'repair_created',
    REPAIR_UPDATED: 'repair_updated',
    REPAIR_STATUS_CHANGED: 'repair_status_changed',
    
    // مراحل الإصلاح
    REPAIR_RECEIVED: 'repair_received',
    DIAGNOSIS_COMPLETE: 'diagnosis_complete',
    QUOTE_READY: 'quote_ready',
    QUOTE_APPROVED: 'quote_approved',
    QUOTE_REJECTED: 'quote_rejected',
    PARTS_ORDERED: 'parts_ordered',
    REPAIR_STARTED: 'repair_started',
    REPAIR_COMPLETED: 'repair_completed',
    QC_COMPLETED: 'qc_completed',
    READY_FOR_PICKUP: 'ready_for_pickup',
    DELIVERED: 'delivered',
    
    // المدفوعات
    INVOICE_CREATED: 'invoice_created',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_OVERDUE: 'payment_overdue',
    
    // الضمان
    WARRANTY_EXPIRING: 'warranty_expiring',
    WARRANTY_EXPIRED: 'warranty_expired'
};
```

### 1.2 Integration Points

#### أ) في `backend/routes/repairs.js`

```javascript
const automationService = require('../services/automationService');

// بعد تحديث حالة الطلب
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        // ... الكود الحالي لتحديث الحالة ...
        
        // Trigger Automation Event
        await automationService.handleEvent('repair_status_changed', {
            repairId: req.params.id,
            oldStatus: oldStatus,
            newStatus: newStatus,
            customerId: repair.customerId,
            contextType: 'repair',
            contextId: req.params.id,
            variables: {
                repairId: req.params.id,
                customerName: customer.firstName + ' ' + customer.lastName,
                deviceModel: repair.deviceModel,
                status: newStatus
            }
        });
        
        // Trigger specific event based on status
        if (newStatus === 'completed') {
            await automationService.handleEvent('repair_completed', {
                repairId: req.params.id,
                customerId: repair.customerId,
                // ... المزيد من البيانات
            });
        }
        
        res.json({ success: true, data: updatedRepair });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### 1.3 مثال: قاعدة إشعار إتمام الإصلاح

```javascript
// قاعدة تلقائية: إرسال إشعار عند إتمام الإصلاح
{
    name: "إشعار إتمام الإصلاح",
    ruleType: "event_based",
    triggerEvent: "repair_completed",
    triggerModule: "repairs",
    actions: [
        {
            type: "send_notification",
            channel: "whatsapp",
            template: "repair_completed",
            delay: 0
        },
        {
            type: "send_notification",
            channel: "email",
            template: "repair_completed_email",
            delay: 0
        },
        {
            type: "create_task",
            taskType: "follow_up",
            title: "طلب تقييم من العميل",
            delay: 7200 // بعد ساعتين
        }
    ],
    conditions: {
        operator: "AND",
        rules: [
            {
                field: "customer.preferredContactMethod",
                operator: "in",
                value: ["whatsapp", "email"]
            }
        ]
    }
}
```

---

## 💰 التكامل مع Finance Module

### 2.1 Events المتاحة

```javascript
const FINANCE_EVENTS = {
    INVOICE_CREATED: 'invoice_created',
    INVOICE_SENT: 'invoice_sent',
    INVOICE_PAID: 'invoice_paid',
    INVOICE_PARTIALLY_PAID: 'invoice_partially_paid',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_OVERDUE: 'payment_overdue',
    PAYMENT_REMINDER: 'payment_reminder',
    REFUND_ISSUED: 'refund_issued'
};
```

### 2.2 Integration Points

#### أ) في `backend/routes/invoices.js`

```javascript
const automationService = require('../services/automationService');

// بعد استلام الدفع
router.post('/:id/payments', authMiddleware, async (req, res) => {
    try {
        // ... الكود الحالي لإضافة الدفع ...
        
        // Trigger Automation Event
        await automationService.handleEvent('payment_received', {
            invoiceId: req.params.id,
            paymentId: paymentId,
            amount: req.body.amount,
            customerId: invoice.customerId,
            contextType: 'invoice',
            contextId: req.params.id,
            variables: {
                invoiceNumber: invoice.invoiceNumber,
                amount: req.body.amount,
                customerName: customer.firstName + ' ' + customer.lastName
            }
        });
        
        // Check if invoice is fully paid
        if (invoice.status === 'paid') {
            await automationService.handleEvent('invoice_paid', {
                invoiceId: req.params.id,
                customerId: invoice.customerId,
                // ...
            });
        }
        
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### 2.3 مثال: قاعدة تذكير الدفع

```javascript
// قاعدة مجدولة: تذكير بالفواتير المستحقة
{
    name: "تذكير بالفواتير المستحقة",
    ruleType: "time_based",
    scheduleType: "daily",
    scheduleConfig: {
        time: "18:00" // الساعة 6 مساءً
    },
    actions: [
        {
            type: "send_notification",
            channel: "whatsapp",
            template: "payment_reminder",
            delay: 0
        }
    ],
    conditions: {
        operator: "AND",
        rules: [
            {
                field: "invoice.status",
                operator: "in",
                value: ["sent", "partially_paid"]
            },
            {
                field: "invoice.dueDate",
                operator: "less_than",
                value: "NOW()"
            },
            {
                field: "invoice.daysOverdue",
                operator: "greater_than",
                value: 7
            }
        ]
    }
}
```

---

## 📦 التكامل مع Inventory Module

### 3.1 Events المتاحة

```javascript
const INVENTORY_EVENTS = {
    STOCK_LOW: 'stock_low',
    STOCK_OUT: 'stock_out',
    STOCK_RESTOCKED: 'stock_restocked',
    STOCK_ALERT: 'stock_alert',
    ITEM_ORDERED: 'item_ordered',
    ITEM_RECEIVED: 'item_received',
    TRANSFER_CREATED: 'transfer_created',
    TRANSFER_COMPLETED: 'transfer_completed'
};
```

### 3.2 Integration Points

#### أ) في `backend/routes/inventory.js`

```javascript
const automationService = require('../services/automationService');

// بعد تحديث مستوى المخزون
router.put('/:id/stock', authMiddleware, async (req, res) => {
    try {
        // ... الكود الحالي لتحديث المخزون ...
        
        const oldQuantity = oldStock.currentQuantity;
        const newQuantity = req.body.quantity;
        
        // Check for stock alerts
        if (oldQuantity > 0 && newQuantity === 0) {
            // Stock out
            await automationService.handleEvent('stock_out', {
                itemId: req.params.id,
                itemName: item.name,
                contextType: 'inventory',
                contextId: req.params.id,
                variables: {
                    itemName: item.name,
                    sku: item.sku
                }
            });
        } else if (oldQuantity === 0 && newQuantity > 0) {
            // Stock restocked
            await automationService.handleEvent('stock_restocked', {
                itemId: req.params.id,
                itemName: item.name,
                quantity: newQuantity,
                // ...
            });
        } else if (newQuantity <= item.lowStockThreshold) {
            // Low stock
            await automationService.handleEvent('stock_low', {
                itemId: req.params.id,
                itemName: item.name,
                currentQuantity: newQuantity,
                threshold: item.lowStockThreshold,
                // ...
            });
        }
        
        res.json({ success: true, data: updatedStock });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### 3.3 مثال: قاعدة تنبيه المخزون الناقص

```javascript
// قاعدة تلقائية: تنبيه عند نقص المخزون
{
    name: "تنبيه المخزون الناقص",
    ruleType: "event_based",
    triggerEvent: "stock_low",
    triggerModule: "inventory",
    actions: [
        {
            type: "send_notification",
            channel: "email",
            template: "stock_low_alert",
            recipient: "inventory@fixzone.com",
            delay: 0
        },
        {
            type: "create_task",
            taskType: "purchase",
            title: "طلب قطع غيار: {{itemName}}",
            assignedTo: "purchasing_manager",
            delay: 0
        }
    ]
}
```

---

## 👥 التكامل مع CRM Module

### 4.1 Events المتاحة

```javascript
const CRM_EVENTS = {
    CUSTOMER_CREATED: 'customer_created',
    CUSTOMER_UPDATED: 'customer_updated',
    INTERACTION_CREATED: 'interaction_created',
    TASK_CREATED: 'task_created',
    TASK_COMPLETED: 'task_completed',
    FEEDBACK_RECEIVED: 'feedback_received',
    CUSTOMER_INACTIVE: 'customer_inactive',
    CUSTOMER_BIRTHDAY: 'customer_birthday',
    SEGMENT_CHANGED: 'segment_changed'
};
```

### 4.2 Integration Points

#### أ) في `backend/routes/crm/customers.js`

```javascript
const automationService = require('../services/automationService');

// بعد إنشاء عميل جديد
router.post('/', authMiddleware, async (req, res) => {
    try {
        // ... الكود الحالي لإنشاء العميل ...
        
        // Trigger Automation Event
        await automationService.handleEvent('customer_created', {
            customerId: customerId,
            contextType: 'customer',
            contextId: customerId,
            variables: {
                customerName: req.body.firstName + ' ' + req.body.lastName,
                phone: req.body.phone,
                email: req.body.email
            }
        });
        
        res.json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### 4.3 مثال: قاعدة تهنئة عيد الميلاد

```javascript
// قاعدة مجدولة: تهنئة أعياد الميلاد
{
    name: "تهنئة أعياد الميلاد",
    ruleType: "time_based",
    scheduleType: "daily",
    scheduleConfig: {
        time: "08:00" // الساعة 8 صباحاً
    },
    actions: [
        {
            type: "send_notification",
            channel: "whatsapp",
            template: "birthday_wish",
            delay: 0
        },
        {
            type: "create_interaction",
            interactionType: "birthday",
            notes: "تهنئة بعيد الميلاد",
            delay: 0
        }
    ],
    conditions: {
        operator: "AND",
        rules: [
            {
                field: "customer.birthDate",
                operator: "equals",
                value: "TODAY()"
            },
            {
                field: "customer.deletedAt",
                operator: "equals",
                value: null
            }
        ]
    }
}
```

---

## 🔔 التكامل مع Notifications Module

### 5.1 Unified Notification Service

```javascript
// backend/services/notificationService.js

const whatsappService = require('./whatsappService');
const emailService = require('./emailService');
const smsService = require('./smsService');
const db = require('../db');

class NotificationService {
    /**
     * إرسال إشعار عبر قناة واحدة أو متعددة
     */
    async send(options) {
        const {
            channel, // 'whatsapp' | 'email' | 'sms' | 'all'
            template,
            recipient,
            variables = {},
            contextType,
            contextId,
            relatedRuleId
        } = options;
        
        // جلب القالب
        const templateData = await this.getTemplate(template);
        if (!templateData) {
            throw new Error(`Template not found: ${template}`);
        }
        
        // استبدال المتغيرات
        const processedContent = this.processTemplate(templateData, variables);
        
        // تحديد القنوات
        const channels = channel === 'all' 
            ? JSON.parse(templateData.channels || '[]')
            : [channel];
        
        const results = [];
        
        // إرسال عبر كل قناة
        for (const ch of channels) {
            try {
                let result;
                
                switch (ch) {
                    case 'whatsapp':
                        result = await whatsappService.sendMessage(
                            recipient,
                            processedContent.message,
                            template
                        );
                        break;
                        
                    case 'email':
                        result = await emailService.sendEmail(
                            recipient,
                            processedContent.subject,
                            processedContent.message
                        );
                        break;
                        
                    case 'sms':
                        result = await smsService.sendSMS(
                            recipient,
                            processedContent.message
                        );
                        break;
                }
                
                results.push({ channel: ch, success: true, ...result });
                
            } catch (error) {
                results.push({ channel: ch, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    async getTemplate(code) {
        const [templates] = await db.query(
            'SELECT * FROM NotificationTemplate WHERE code = ? AND isActive = TRUE',
            [code]
        );
        
        return templates[0] || null;
    }
    
    processTemplate(template, variables) {
        let subject = template.subject || '';
        let message = template.message || '';
        
        // استبدال المتغيرات {{variableName}}
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value);
            message = message.replace(regex, value);
        }
        
        return { subject, message };
    }
}

module.exports = new NotificationService();
```

### 5.2 Webhook Integration

```javascript
// backend/routes/automation.js

// Webhook لاستقبال تحديثات من مزودي الخدمة
router.post('/webhooks/whatsapp', async (req, res) => {
    try {
        const { entry } = req.body;
        
        for (const change of entry[0]?.changes || []) {
            if (change.field === 'messages') {
                const message = change.value?.messages?.[0];
                
                if (message) {
                    // تحديث حالة الإشعار
                    await db.query(`
                        UPDATE NotificationLog 
                        SET status = 'delivered',
                            deliveredAt = NOW()
                        WHERE externalId = ? AND channel = 'whatsapp'
                    `, [message.id]);
                }
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});
```

---

## 🔄 Event Flow Diagram

```
┌─────────────────┐
│  Module Event   │
│  (e.g., repair  │
│   completed)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Automation      │
│ Service         │
│ handleEvent()   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Find Matching   │
│ Rules           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check           │
│ Conditions      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute Actions │
│ - Send Notif    │
│ - Create Task   │
│ - Update Status │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Log Execution   │
│ & Results       │
└─────────────────┘
```

---

## 📝 Best Practices

### 1. Event Naming Convention
- استخدم أسماء واضحة ومتسقة
- استخدم snake_case
- ابدأ بالاسم العام ثم التفاصيل: `module_action`

### 2. Error Handling
- دائماً استخدم try-catch
- سجل الأخطاء في AutomationExecution
- لا توقف التنفيذ عند فشل إجراء واحد

### 3. Performance
- استخدم Queue للمهام الثقيلة
- لا تنفذ إجراءات متعددة بشكل متزامن
- استخدم Caching للقوالب

### 4. Testing
- اختبر كل قاعدة قبل تفعيلها
- استخدم Test Mode للقواعد الجديدة
- راقب التنفيذات في Production

---

**الجزء التالي:** [الأمان والصلاحيات](./05_AUTOMATION_SECURITY.md)


