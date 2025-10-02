# 📋 خطة وحدة CRM المتكاملة - Fix Zone ERP

**التاريخ:** 2 أكتوبر 2025  
**الإصدار:** 1.0  
**الحالة:** تصميم أولي - للمراجعة

---

## 🎯 الرؤية والأهداف

### الرؤية
تحويل FixZone من نظام إدارة صيانة إلى **منصة CRM متكاملة** تضع العميل في المركز، مع تتبع كامل لرحلة العميل من أول تفاعل حتى الولاء طويل الأمد.

### الأهداف الرئيسية
1. **زيادة رضا العملاء** بنسبة 40% خلال 6 أشهر
2. **تقليل معدل فقدان العملاء (Churn)** بنسبة 30%
3. **زيادة القيمة مدى الحياة للعميل (CLV)** بنسبة 50%
4. **أتمتة 80%** من عمليات المتابعة والتواصل
5. **تحسين معدل التحويل** من عميل جديد إلى عميل منتظم بنسبة 35%

---

## 🗄️ الكيانات الأساسية (Core Entities)

### 1. Customer (العميل) - موجود مع توسعات
**الحقول الحالية:**
- id, firstName, lastName, phone, email, address
- companyId, isActive, status, notes
- createdAt, updatedAt, deletedAt

**التوسعات المطلوبة:**
```sql
ALTER TABLE Customer ADD COLUMN (
  gender ENUM('male', 'female', 'other', 'unknown') DEFAULT 'unknown',
  birthDate DATE NULL,
  nationalId VARCHAR(50) NULL,
  segment ENUM('vip', 'regular', 'new', 'at_risk', 'inactive') DEFAULT 'new',
  leadSource VARCHAR(50) NULL COMMENT 'facebook, google, referral, walk-in',
  preferredContactMethod ENUM('phone', 'email', 'whatsapp', 'sms') DEFAULT 'phone',
  lastInteractionDate TIMESTAMP NULL,
  totalSpent DECIMAL(10,2) DEFAULT 0,
  visitCount INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0 COMMENT '1-5 stars',
  loyaltyPoints INT DEFAULT 0,
  referredBy INT NULL COMMENT 'Customer ID who referred',
  taxExempt BOOLEAN DEFAULT FALSE,
  creditLimit DECIMAL(10,2) DEFAULT 0,
  
  INDEX idx_segment (segment),
  INDEX idx_lead_source (leadSource),
  INDEX idx_last_interaction (lastInteractionDate),
  FOREIGN KEY (referredBy) REFERENCES Customer(id) ON DELETE SET NULL
);
```

### 2. Company (الشركة) - موجود مع توسعات
**التوسعات المطلوبة:**
```sql
ALTER TABLE Company ADD COLUMN (
  industry VARCHAR(100) NULL,
  website VARCHAR(255) NULL,
  companySize ENUM('small', 'medium', 'large', 'enterprise') DEFAULT 'small',
  companyType ENUM('B2B', 'B2C', 'B2G', 'B2B2C') DEFAULT 'B2B',
  employeesCount INT NULL,
  foundedYear YEAR NULL,
  annualRevenue DECIMAL(15,2) NULL,
  parentCompanyId INT NULL COMMENT 'For subsidiaries',
  
  INDEX idx_industry (industry),
  INDEX idx_company_size (companySize),
  FOREIGN KEY (parentCompanyId) REFERENCES Company(id) ON DELETE SET NULL
);
```

### 3. Contact (جهة اتصال الشركة) - جديد
```sql
CREATE TABLE CompanyContact (
  id INT NOT NULL AUTO_INCREMENT,
  companyId INT NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  title VARCHAR(100) NULL COMMENT 'Job title',
  department VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  isPrimary BOOLEAN DEFAULT FALSE,
  isDecisionMaker BOOLEAN DEFAULT FALSE,
  notes TEXT NULL,
  birthday DATE NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  PRIMARY KEY (id),
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
  INDEX idx_company (companyId),
  INDEX idx_primary (isPrimary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4. CustomerInteraction (تفاعل العميل) - جديد ⭐
```sql
CREATE TABLE CustomerInteraction (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  companyId INT NULL,
  interactionType ENUM('call', 'email', 'whatsapp', 'sms', 'meeting', 'visit', 'social_media', 'other') NOT NULL,
  interactionDirection ENUM('inbound', 'outbound') NOT NULL,
  subject VARCHAR(255) NULL,
  notes TEXT NULL,
  duration INT NULL COMMENT 'Duration in seconds',
  outcome ENUM('successful', 'no_answer', 'voicemail', 'follow_up_needed', 'resolved', 'escalated') NULL,
  nextFollowUpDate TIMESTAMP NULL,
  recordingUrl VARCHAR(500) NULL,
  attachments JSON NULL,
  userId INT NULL COMMENT 'Employee who handled interaction',
  relatedTo VARCHAR(50) NULL COMMENT 'Table name',
  relatedId INT NULL COMMENT 'Record ID',
  interactionDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
  INDEX idx_customer (customerId),
  INDEX idx_type (interactionType),
  INDEX idx_date (interactionDate),
  INDEX idx_follow_up (nextFollowUpDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5. CustomerNote (ملاحظة العميل) - جديد
```sql
CREATE TABLE CustomerNote (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  companyId INT NULL,
  noteType ENUM('general', 'complaint', 'feedback', 'sales', 'support', 'billing') DEFAULT 'general',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  content TEXT NOT NULL,
  isPrivate BOOLEAN DEFAULT FALSE,
  isPinned BOOLEAN DEFAULT FALSE,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_customer (customerId),
  INDEX idx_type (noteType),
  INDEX idx_priority (priority),
  INDEX idx_pinned (isPinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6. CustomerTag (وسم العميل) - جديد
```sql
CREATE TABLE Tag (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6B7280',
  category VARCHAR(50) NULL,
  description TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CustomerTag (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  tagId INT NOT NULL,
  createdBy INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL,
  UNIQUE KEY unique_customer_tag (customerId, tagId),
  INDEX idx_customer (customerId),
  INDEX idx_tag (tagId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- مثال للوسوم: VIP, problematic, regular, tech-savvy, warranty-customer
```

### 7. FollowUpTask (مهمة متابعة) - جديد ⭐
```sql
CREATE TABLE FollowUpTask (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  companyId INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  taskType ENUM('call', 'email', 'meeting', 'visit', 'quote', 'other') DEFAULT 'call',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue') DEFAULT 'pending',
  dueDate TIMESTAMP NOT NULL,
  completedDate TIMESTAMP NULL,
  assignedTo INT NULL,
  createdBy INT NOT NULL,
  relatedTo VARCHAR(50) NULL,
  relatedId INT NULL,
  reminderSent BOOLEAN DEFAULT FALSE,
  notes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE SET NULL,
  FOREIGN KEY (assignedTo) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_customer (customerId),
  INDEX idx_status (status),
  INDEX idx_due_date (dueDate),
  INDEX idx_assigned (assignedTo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 8. CustomerFeedback (تقييم العميل) - جديد
```sql
CREATE TABLE CustomerFeedback (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  repairRequestId INT NULL,
  invoiceId INT NULL,
  rating TINYINT NOT NULL COMMENT '1-5 stars',
  feedbackType ENUM('service', 'product', 'support', 'overall') DEFAULT 'overall',
  comment TEXT NULL,
  isPublic BOOLEAN DEFAULT FALSE,
  responseText TEXT NULL,
  respondedBy INT NULL,
  respondedAt TIMESTAMP NULL,
  feedbackDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source ENUM('manual', 'email', 'sms', 'whatsapp', 'web') DEFAULT 'manual',
  
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE SET NULL,
  FOREIGN KEY (respondedBy) REFERENCES User(id) ON DELETE SET NULL,
  INDEX idx_customer (customerId),
  INDEX idx_rating (rating),
  INDEX idx_date (feedbackDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 9. CustomerDocument (مستند العميل) - جديد
```sql
CREATE TABLE CustomerDocument (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  companyId INT NULL,
  documentType ENUM('contract', 'agreement', 'id_copy', 'warranty', 'receipt', 'other') DEFAULT 'other',
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  filePath VARCHAR(500) NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileSize INT NOT NULL COMMENT 'in bytes',
  mimeType VARCHAR(100) NOT NULL,
  isConfidential BOOLEAN DEFAULT FALSE,
  expiryDate DATE NULL,
  uploadedBy INT NOT NULL,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadedBy) REFERENCES User(id),
  INDEX idx_customer (customerId),
  INDEX idx_type (documentType),
  INDEX idx_expiry (expiryDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 10. Opportunity (فرصة بيع) - جديد
```sql
CREATE TABLE Opportunity (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  companyId INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  value DECIMAL(10,2) NOT NULL,
  probability INT DEFAULT 50 COMMENT '0-100%',
  stage ENUM('prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'prospecting',
  expectedCloseDate DATE NULL,
  actualCloseDate DATE NULL,
  lostReason TEXT NULL,
  assignedTo INT NULL,
  source VARCHAR(100) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedTo) REFERENCES User(id) ON DELETE SET NULL,
  INDEX idx_customer (customerId),
  INDEX idx_stage (stage),
  INDEX idx_close_date (expectedCloseDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 11. Campaign (حملة تسويقية) - جديد
```sql
CREATE TABLE Campaign (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  campaignType ENUM('email', 'sms', 'whatsapp', 'social', 'mixed') NOT NULL,
  status ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
  startDate DATE NULL,
  endDate DATE NULL,
  budget DECIMAL(10,2) DEFAULT 0,
  targetSegment JSON NULL COMMENT 'Segmentation criteria',
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_status (status),
  INDEX idx_type (campaignType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CampaignRecipient (
  id INT NOT NULL AUTO_INCREMENT,
  campaignId INT NOT NULL,
  customerId INT NOT NULL,
  status ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'bounced', 'unsubscribed') DEFAULT 'pending',
  sentAt TIMESTAMP NULL,
  openedAt TIMESTAMP NULL,
  clickedAt TIMESTAMP NULL,
  
  PRIMARY KEY (id),
  FOREIGN KEY (campaignId) REFERENCES Campaign(id) ON DELETE CASCADE,
  FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
  UNIQUE KEY unique_campaign_customer (campaignId, customerId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🔗 العلاقات بين الكيانات

### خريطة العلاقات الكاملة

```
┌─────────────┐
│   Customer  │◄─┐
└──────┬──────┘  │
       │         │
       │ 1:N     │ M:1
       │         │
       ├─────────┴──────────────┐
       │                        │
       ▼                        ▼
┌──────────────────┐   ┌─────────────────┐
│ RepairRequest    │   │    Company      │
└──────┬───────────┘   └────────┬────────┘
       │                        │
       │ 1:1                    │ 1:N
       │                        │
       ▼                        ▼
┌──────────────────┐   ┌─────────────────┐
│    Invoice       │   │ CompanyContact  │
└──────┬───────────┘   └─────────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────┐
│    Payment       │
└──────────────────┘

CRM Entities:
┌──────────────┐
│   Customer   │──┬──► CustomerInteraction (1:N)
└──────────────┘  ├──► CustomerNote (1:N)
                  ├──► CustomerTag (M:N via CustomerTag)
                  ├──► FollowUpTask (1:N)
                  ├──► CustomerFeedback (1:N)
                  ├──► CustomerDocument (1:N)
                  ├──► Opportunity (1:N)
                  └──► CampaignRecipient (1:N)
```

---

## 📊 التكامل مع الوحدات الموجودة

### 1. التكامل مع طلبات الإصلاح (Repair Requests)
- **ربط تلقائي:** كل طلب إصلاح = تفاعل عميل
- **تتبع التاريخ:** عرض كل أجهزة العميل وتاريخ إصلاحها
- **تحليل الأنماط:** أنواع الأعطال المتكررة لكل عميل
- **فرص البيع:** اقتراح خدمات إضافية بناءً على التاريخ

```sql
-- Trigger لإنشاء تفاعل تلقائياً عند إنشاء طلب إصلاح
DELIMITER $$
CREATE TRIGGER after_repair_request_insert
AFTER INSERT ON RepairRequest
FOR EACH ROW
BEGIN
  INSERT INTO CustomerInteraction (
    customerId, 
    interactionType, 
    interactionDirection,
    subject,
    notes,
    relatedTo,
    relatedId,
    userId
  ) VALUES (
    NEW.customerId,
    'visit',
    'inbound',
    CONCAT('طلب إصلاح جديد - ', NEW.deviceModel),
    NEW.issueDescription,
    'RepairRequest',
    NEW.id,
    NEW.assignedTechnicianId
  );
  
  -- تحديث آخر تفاعل للعميل
  UPDATE Customer 
  SET lastInteractionDate = NOW(), 
      visitCount = visitCount + 1
  WHERE id = NEW.customerId;
END$$
DELIMITER ;
```

### 2. التكامل مع الفواتير والمدفوعات
- **تتبع الإنفاق:** حساب CLV تلقائياً
- **تحليل سلوك الدفع:** متوسط مدة السداد
- **إنذارات الديون:** تنبيهات للفواتير المتأخرة
- **برامج الولاء:** نقاط مكافآت بناءً على الإنفاق

```sql
-- Trigger لتحديث إجمالي الإنفاق عند الدفع
DELIMITER $$
CREATE TRIGGER after_payment_insert
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
  DECLARE customer_id INT;
  
  SELECT customerId INTO customer_id
  FROM Invoice
  WHERE id = NEW.invoiceId;
  
  UPDATE Customer
  SET totalSpent = totalSpent + NEW.amount,
      loyaltyPoints = loyaltyPoints + FLOOR(NEW.amount / 10)
  WHERE id = customer_id;
  
  -- إنشاء تفاعل للدفع
  INSERT INTO CustomerInteraction (
    customerId,
    interactionType,
    interactionDirection,
    subject,
    notes,
    relatedTo,
    relatedId
  ) VALUES (
    customer_id,
    'other',
    'inbound',
    'دفع فاتورة',
    CONCAT('دفع مبلغ ', NEW.amount, ' ', NEW.currency),
    'Payment',
    NEW.id
  );
END$$
DELIMITER ;
```

### 3. التكامل مع المخزون
- **تفضيلات العميل:** قطع الغيار المفضلة
- **عروض مخصصة:** إشعارات عند توفر قطعة يحتاجها
- **تاريخ الشراء:** تتبع مشتريات العميل من قطع الغيار

### 4. التكامل مع الإشعارات
- **رسائل تلقائية:**
  - بعد إتمام الإصلاح: طلب تقييم
  - بعد 7 أيام: متابعة رضا العميل
  - بعد 90 يوم: عرض خدمة صيانة
  - عيد ميلاد: رسالة تهنئة مع خصم
  
```javascript
// Automation Example
const automations = {
  // بعد إتمام الإصلاح
  afterRepairComplete: async (repairId) => {
    const repair = await getRepairRequest(repairId);
    const customer = await getCustomer(repair.customerId);
    
    // إرسال رسالة واتساب بعد ساعتين
    setTimeout(async () => {
      await sendWhatsApp(customer.phone, `
        مرحباً ${customer.firstName}،
        نشكرك على ثقتك بخدماتنا. نتمنى أن تكون راضياً عن خدمة الإصلاح.
        نرجو تقييم الخدمة من خلال الرابط: ${feedbackLink}
      `);
      
      // إنشاء مهمة متابعة بعد 7 أيام
      await createFollowUpTask({
        customerId: customer.id,
        title: 'متابعة رضا العميل',
        taskType: 'call',
        dueDate: addDays(new Date(), 7)
      });
    }, 2 * 60 * 60 * 1000);
  },
  
  // عملاء غير نشطين
  inactiveCustomers: async () => {
    const inactiveCustomers = await db.query(`
      SELECT c.* FROM Customer c
      LEFT JOIN RepairRequest r ON c.id = r.customerId
      WHERE c.deletedAt IS NULL
      GROUP BY c.id
      HAVING MAX(r.receivedAt) < DATE_SUB(NOW(), INTERVAL 90 DAY)
         OR MAX(r.receivedAt) IS NULL
    `);
    
    for (const customer of inactiveCustomers) {
      await sendWhatsApp(customer.phone, `
        مرحباً ${customer.firstName}،
        افتقدناك! نقدم لك خصم 20% على خدمة الفحص الشامل.
        صالح حتى ${addDays(new Date(), 14)}
      `);
      
      await updateCustomer(customer.id, {
        segment: 'at_risk'
      });
    }
  }
};
```

---

## 🎯 المميزات الوظيفية (Functional Features)

### 1. إدارة العملاء المتقدمة
- ✅ عرض 360 درجة للعميل (timeline كامل)
- ✅ تصنيف تلقائي (RFM: Recency, Frequency, Monetary)
- ✅ تتبع كل التفاعلات (مكالمات، رسائل، زيارات)
- ✅ ملاحظات فريق العمل
- ✅ مستندات العميل
- ✅ تقييمات وآراء
- ✅ فرص البيع المحتملة

### 2. إدارة المهام والمتابعة
- ✅ مهام متابعة تلقائية
- ✅ تذكيرات ذكية
- ✅ تعيين المهام للموظفين
- ✅ تقويم المتابعة
- ✅ تقارير الإنتاجية

### 3. التصنيف والفلترة
```javascript
const segments = {
  vip: {
    criteria: {
      totalSpent: { $gt: 5000 },
      OR: { visitCount: { $gt: 10 } }
    },
    benefits: ['priority_support', 'exclusive_offers', 'loyalty_rewards']
  },
  regular: {
    criteria: {
      visitCount: { $gte: 3 },
      lastInteractionDate: { $gt: 'DATE_SUB(NOW(), INTERVAL 90 DAY)' }
    }
  },
  new: {
    criteria: {
      visitCount: { $lte: 2 },
      createdAt: { $gt: 'DATE_SUB(NOW(), INTERVAL 30 DAY)' }
    }
  },
  at_risk: {
    criteria: {
      lastInteractionDate: { $lt: 'DATE_SUB(NOW(), INTERVAL 90 DAY)' },
      visitCount: { $gte: 3 }
    },
    action: 'win_back_campaign'
  },
  inactive: {
    criteria: {
      OR: [
        { lastInteractionDate: { $lt: 'DATE_SUB(NOW(), INTERVAL 180 DAY)' } },
        { lastInteractionDate: { $is: null } }
      ]
    }
  }
};
```

### 4. الحملات والتسويق
- ✅ إنشاء حملات مستهدفة
- ✅ تتبع معدلات الفتح والتفاعل
- ✅ A/B Testing
- ✅ قوالب رسائل جاهزة
- ✅ جدولة الحملات

### 5. التقارير والتحليلات
```
التقارير المطلوبة:
├── تقرير العملاء الجدد (شهري/سنوي)
├── تقرير معدل الاحتفاظ (Retention Rate)
├── تقرير CLV (Customer Lifetime Value)
├── تقرير RFM Analysis
├── تقرير مصادر العملاء
├── تقرير رضا العملاء (NPS)
├── تقرير العملاء المعرضين للخطر
├── تقرير أداء الحملات
├── تقرير إنتاجية الموظفين
└── تقرير الربحية حسب العميل
```

---

## 🔐 الأمان والصلاحيات

### نظام RBAC المقترح

```javascript
const CRMPermissions = {
  // عرض البيانات
  'crm.customers.view': ['Admin', 'Manager', 'Sales', 'Support'],
  'crm.customers.view_all': ['Admin', 'Manager'],
  'crm.customers.view_assigned': ['Sales', 'Support'],
  
  // تعديل البيانات
  'crm.customers.create': ['Admin', 'Manager', 'Sales', 'Receptionist'],
  'crm.customers.update': ['Admin', 'Manager', 'Sales'],
  'crm.customers.delete': ['Admin'],
  
  // البيانات الحساسة
  'crm.customers.view_financial': ['Admin', 'Manager', 'Accountant'],
  'crm.customers.export': ['Admin', 'Manager'],
  
  // التفاعلات
  'crm.interactions.create': ['Admin', 'Manager', 'Sales', 'Support'],
  'crm.interactions.view': ['Admin', 'Manager', 'Sales', 'Support'],
  'crm.interactions.update_own': ['Sales', 'Support'],
  'crm.interactions.delete': ['Admin', 'Manager'],
  
  // المهام
  'crm.tasks.create': ['Admin', 'Manager', 'Sales', 'Support'],
  'crm.tasks.assign': ['Admin', 'Manager'],
  'crm.tasks.view_assigned': ['ALL'],
  
  // الحملات
  'crm.campaigns.manage': ['Admin', 'Manager', 'Marketing'],
  'crm.campaigns.send': ['Admin', 'Manager', 'Marketing'],
  
  // التقارير
  'crm.reports.view': ['Admin', 'Manager'],
  'crm.reports.export': ['Admin', 'Manager']
};
```

### Data Masking
```javascript
// حجب البيانات الحساسة حسب الصلاحية
const maskData = (data, userRole) => {
  if (!hasPermission(userRole, 'crm.customers.view_financial')) {
    data.totalSpent = '***';
    data.creditLimit = '***';
  }
  
  if (!hasPermission(userRole, 'crm.customers.view_contact')) {
    data.phone = maskPhone(data.phone); // 010****5678
    data.email = maskEmail(data.email); // m*****@example.com
  }
  
  return data;
};
```

### Audit Trail
```sql
-- تسجيل كل عملية على بيانات العملاء
CREATE TABLE CRMAuditLog (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  tableName VARCHAR(50) NOT NULL,
  recordId INT NOT NULL,
  oldValues JSON NULL,
  newValues JSON NULL,
  ipAddress VARCHAR(45) NULL,
  userAgent TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  FOREIGN KEY (userId) REFERENCES User(id),
  INDEX idx_user (userId),
  INDEX idx_table_record (tableName, recordId),
  INDEX idx_date (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 📱 واجهات المستخدم (UI Components)

### 1. صفحة العميل الرئيسية (Customer Profile)
```
┌─────────────────────────────────────────────────────┐
│ 👤 محمد أحمد                          ⭐⭐⭐⭐⭐ │
│ 📞 01012345678  📧 mohamed@example.com  🏢 شركة ABC│
├─────────────────────────────────────────────────────┤
│ [معلومات أساسية] [التفاعلات] [الطلبات] [الفواتير] │
│ [المهام] [الملاحظات] [المستندات] [التقييمات]     │
├─────────────────────────────────────────────────────┤
│ 📊 الإحصائيات السريعة                              │
│ ┌──────────┬──────────┬──────────┬──────────┐      │
│ │ الإنفاق  │ الزيارات│ التقييم │ آخر زيارة│      │
│ │ 12,500 ج │    15    │   4.8   │ 15 سبتمبر│      │
│ └──────────┴──────────┴──────────┴──────────┘      │
├─────────────────────────────────────────────────────┤
│ 📝 الخط الزمني (Timeline)                          │
│ ⏰ 2 أكتوبر 2025                                    │
│   📞 مكالمة هاتفية - متابعة رضا العميل            │
│                                                     │
│ ⏰ 15 سبتمبر 2025                                   │
│   🔧 طلب إصلاح #1234 - اكتمل                      │
│   💰 فاتورة #INV-1234 - مدفوعة (1,500 ج)         │
│                                                     │
│ ⏰ 10 سبتمبر 2025                                   │
│   📧 رسالة بريد - عرض صيانة دورية                 │
└─────────────────────────────────────────────────────┘
```

### 2. لوحة تحكم CRM (CRM Dashboard)
```
┌─────────────────────────────────────────────────────┐
│ 📊 لوحة التحكم CRM                    📅 أكتوبر 2025│
├─────────────────────────────────────────────────────┤
│ المؤشرات الرئيسية (KPIs)                           │
│ ┌────────────┬────────────┬────────────┬──────────┐│
│ │ عملاء جدد  │ معدل الرضا│  CLV       │ التحويل ││
│ │    +25     │   4.7/5    │  8,500 ج   │   32%   ││
│ │   ↑ 15%    │   ↑ 0.3    │  ↑ 20%     │  ↑ 5%   ││
│ └────────────┴────────────┴────────────┴──────────┘│
├─────────────────────────────────────────────────────┤
│ 🎯 المهام المستحقة اليوم (12)                      │
│ [عاجل] متابعة عميل VIP - أحمد محمد                │
│ [عادي] إرسال عرض سعر - فاطمة علي                  │
│ [عادي] مكالمة متابعة - محمود حسن                   │
│ [عرض الكل...]                                      │
├─────────────────────────────────────────────────────┤
│ ⚠️ تنبيهات (5)                                     │
│ • 3 عملاء لم يتم التواصل معهم منذ 90 يوم          │
│ • 2 مهام متأخرة تحتاج متابعة                       │
│ • حملة "عروض الخريف" انتهت بنجاح (معدل فتح 45%)   │
├─────────────────────────────────────────────────────┤
│ 📈 توزيع العملاء                                   │
│     [رسم بياني دائري]                              │
│     VIP: 15%  |  Regular: 60%  |  New: 25%        │
└─────────────────────────────────────────────────────┘
```

### 3. صفحة المهام (Tasks Management)
```
┌─────────────────────────────────────────────────────┐
│ ✅ إدارة المهام              [+ مهمة جديدة]        │
├─────────────────────────────────────────────────────┤
│ 🔍 [بحث...] 📅 [التاريخ] 👤 [الموظف] 📌 [الحالة] │
├─────────────────────────────────────────────────────┤
│ ⚡ عاجل (3)                                         │
│ ├─ [🔴] متابعة عميل VIP - أحمد محمد               │
│ │   📅 اليوم 10:00 ص  👤 محمد علي                 │
│ │   [إكمال] [تأجيل] [تفاصيل]                     │
│ │                                                   │
│ └─ [🔴] إرسال عقد صيانة - شركة التقنية            │
│     📅 اليوم 2:00 م  👤 فاطمة أحمد                │
│     [إكمال] [تأجيل] [تفاصيل]                     │
├─────────────────────────────────────────────────────┤
│ 📌 مجدولة (8)                                      │
│ ├─ [ ] مكالمة متابعة - محمود حسن                  │
│ │   📅 غداً 11:00 ص  👤 سارة محمد                 │
│ │                                                   │
│ └─ [ ] عرض سعر جديد - علي أحمد                    │
│     📅 3 أكتوبر  👤 أحمد علي                       │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 خارطة الطريق (Implementation Roadmap)

### المرحلة 1: الأساسيات (4-6 أسابيع) - MVP
**الهدف:** تطبيق الكيانات الأساسية ووظائف CRM الرئيسية

#### الأسبوع 1-2: قاعدة البيانات
- ✅ إنشاء جداول CRM الجديدة
- ✅ إضافة الحقول المطلوبة للجداول الموجودة
- ✅ تطبيق Triggers للتحديث التلقائي
- ✅ ترحيل البيانات الحالية
- ✅ تطبيق تصنيف RFM على العملاء الحاليين

#### الأسبوع 3-4: Backend APIs
```javascript
// APIs المطلوبة
POST   /api/crm/customers/:id/interactions
GET    /api/crm/customers/:id/interactions
POST   /api/crm/customers/:id/notes
GET    /api/crm/customers/:id/notes
POST   /api/crm/customers/:id/tags
DELETE /api/crm/customers/:id/tags/:tagId
GET    /api/crm/customers/:id/timeline
POST   /api/crm/tasks
GET    /api/crm/tasks
PUT    /api/crm/tasks/:id
POST   /api/crm/feedback
GET    /api/crm/customers/:id/feedback
GET    /api/crm/segments/:segment/customers
GET    /api/crm/dashboard/kpis
GET    /api/crm/reports/rfm
```

#### الأسبوع 5-6: Frontend Components
- ✅ صفحة العميل المحسّنة (Customer Profile 360)
- ✅ Timeline Component
- ✅ Interactions Component
- ✅ Notes Component
- ✅ Tasks Dashboard
- ✅ CRM Dashboard

**المخرجات:**
- ✅ نظام تفاعلات كامل
- ✅ نظام ملاحظات
- ✅ نظام مهام ومتابعة
- ✅ عرض 360 للعميل
- ✅ لوحة تحكم CRM أساسية

---

### المرحلة 2: التحسينات (4 أسابيع)
**الهدف:** إضافة الأتمتة والذكاء

#### الأسبوع 7-8: الأتمتة
- ✅ إنشاء مهام تلقائية بعد الأحداث
- ✅ إرسال رسائل تلقائية (واتساب/إيميل)
- ✅ تذكيرات ذكية
- ✅ تصنيف تلقائي للعملاء (RFM)
- ✅ Scheduled Jobs للحملات

```javascript
// أمثلة للأتمتة
const automationRules = [
  {
    trigger: 'repair_completed',
    delay: '2 hours',
    action: 'send_feedback_request'
  },
  {
    trigger: 'feedback_negative',
    delay: 'immediate',
    action: 'create_follow_up_task'
  },
  {
    trigger: 'customer_inactive_90_days',
    delay: 'immediate',
    action: 'send_win_back_campaign'
  },
  {
    trigger: 'birthday',
    delay: '9:00 AM',
    action: 'send_birthday_wish_with_discount'
  },
  {
    trigger: 'payment_overdue_7_days',
    delay: 'immediate',
    action: 'send_payment_reminder'
  }
];
```

#### الأسبوع 9-10: التحليلات والتقارير
- ✅ تقرير RFM Analysis
- ✅ تقرير Customer Lifetime Value
- ✅ تقرير Retention Rate
- ✅ تقرير Churn Prediction
- ✅ تقرير أداء الموظفين
- ✅ تصدير التقارير (PDF/Excel)

**المخرجات:**
- ✅ نظام أتمتة كامل
- ✅ 10+ تقارير CRM
- ✅ تحليلات متقدمة

---

### المرحلة 3: التسويق والحملات (3 أسابيع)
**الهدف:** تطبيق نظام الحملات التسويقية

#### الأسبوع 11-13: نظام الحملات
- ✅ إنشاء وإدارة الحملات
- ✅ استهداف شرائح محددة
- ✅ قوالب رسائل جاهزة
- ✅ جدولة الحملات
- ✅ تتبع الأداء (Open Rate, Click Rate)
- ✅ A/B Testing

```javascript
// مثال حملة
const campaign = {
  name: 'عروض الخريف 2025',
  type: 'whatsapp',
  targetSegment: {
    segment: ['regular', 'vip'],
    lastInteractionDate: { $gt: 'DATE_SUB(NOW(), INTERVAL 180 DAY)' },
    totalSpent: { $gt: 1000 }
  },
  message: `
    مرحباً {{firstName}}،
    لأنك من عملائنا المميزين، نقدم لك خصم 25% على جميع خدمات الصيانة.
    العرض صالح حتى 31 أكتوبر.
    احجز الآن: {{bookingLink}}
  `,
  schedule: '2025-10-05 09:00:00',
  status: 'scheduled'
};
```

**المخرجات:**
- ✅ نظام حملات متكامل
- ✅ تتبع الأداء
- ✅ قوالب جاهزة

---

### المرحلة 4: الذكاء الاصطناعي (اختياري - 4 أسابيع)
**الهدف:** إضافة ذكاء اصطناعي للتنبؤ والتوصيات

#### الأسبوع 14-17: AI/ML Features
- ✅ Churn Prediction Model
- ✅ Next Best Action Recommendations
- ✅ Sentiment Analysis للتقييمات
- ✅ Price Optimization
- ✅ Lead Scoring

```python
# مثال: Churn Prediction Model
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

def predict_churn(customer_data):
    features = [
        'days_since_last_interaction',
        'total_spent',
        'visit_count',
        'avg_rating',
        'days_as_customer',
        'overdue_invoices_count'
    ]
    
    model = load_trained_model('churn_model.pkl')
    prediction = model.predict_proba(customer_data[features])
    
    return {
        'churn_probability': prediction[0][1],
        'risk_level': 'high' if prediction[0][1] > 0.7 else 'medium' if prediction[0][1] > 0.4 else 'low',
        'recommended_actions': get_retention_actions(prediction[0][1])
    }
```

**المخرجات:**
- ✅ توقع العملاء المعرضين للمغادرة
- ✅ توصيات ذكية للموظفين
- ✅ تحليل مشاعر العملاء

---

## 💰 تقدير الموارد والتكاليف

### فريق التطوير المطلوب
- **Backend Developer:** 1 (full-time)
- **Frontend Developer:** 1 (full-time)
- **Database Administrator:** 1 (part-time)
- **UI/UX Designer:** 1 (part-time)
- **QA Tester:** 1 (part-time)
- **Project Manager:** 1 (part-time)

### الوقت المقدّر
- **المرحلة 1 (MVP):** 6 أسابيع
- **المرحلة 2 (التحسينات):** 4 أسابيع
- **المرحلة 3 (التسويق):** 3 أسابيع
- **المرحلة 4 (AI - اختياري):** 4 أسابيع
- **الإجمالي:** 13-17 أسبوع (3-4 أشهر)

### البنية التحتية
- **خادم إضافي للتحليلات:** اختياري
- **خدمة CDN لتسريع التحميل:** موصى بها
- **خدمة Backup يومي:** ضروري
- **Monitoring Tools:** ضروري

---

## 📈 مؤشرات النجاح (Success Metrics)

### KPIs الرئيسية
1. **Customer Satisfaction Score (CSAT):** الهدف 4.5/5
2. **Net Promoter Score (NPS):** الهدف +40
3. **Customer Retention Rate:** الهدف 85%
4. **Customer Lifetime Value (CLV):** زيادة 50% في 6 أشهر
5. **Average Response Time:** أقل من 2 ساعة
6. **Task Completion Rate:** 95%
7. **Campaign Open Rate:** 40%+
8. **Campaign Conversion Rate:** 10%+

### مؤشرات العمليات
- **عدد التفاعلات المسجلة يومياً:** متوسط 50+
- **عدد المهام المنجزة يومياً:** متوسط 30+
- **معدل استخدام النظام:** 90%+ من الموظفين
- **وقت تسجيل التفاعل:** أقل من دقيقة

---

## 🎓 التدريب والتبني

### خطة التدريب
1. **تدريب الإدارة:** يوم واحد
   - نظرة عامة على CRM
   - التقارير والتحليلات
   - الأتمتة والحملات

2. **تدريب المبيعات/الدعم:** 3 أيام
   - إدارة العملاء
   - التفاعلات والملاحظات
   - المهام والمتابعة
   - Best Practices

3. **تدريب الاستقبال:** يوم واحد
   - إنشاء عملاء جدد
   - تسجيل التفاعلات الأساسية
   - البحث والفلترة

### دليل المستخدم
- ✅ دليل مصور (PDF)
- ✅ فيديوهات تعليمية
- ✅ قاعدة معرفة داخلية
- ✅ دعم فني مباشر

---

## ⚠️ المخاطر والتحديات

### المخاطر المحتملة
1. **مقاومة التغيير:**
   - **الحل:** تدريب مكثف + إظهار الفوائد المباشرة
   
2. **جودة البيانات:**
   - **الحل:** تطهير شامل قبل الإطلاق + قواعد تحقق صارمة
   
3. **التعقيد:**
   - **الحل:** واجهة بسيطة + إطلاق تدريجي
   
4. **الأداء:**
   - **الحل:** فهرسة محسّنة + Caching + تحميل lazy

### خطة التخفيف
- ✅ إطلاق تجريبي (Pilot) لفريق صغير
- ✅ جمع الملاحظات بشكل مستمر
- ✅ تحديثات أسبوعية
- ✅ نظام دعم متاح 24/7

---

## ✅ الخلاصة

### النقاط الرئيسية
1. ✅ **البنية التحتية جاهزة:** قاعدة بيانات سليمة وقابلة للتوسع
2. ✅ **التكامل سلس:** يرتبط بسهولة مع الوحدات الموجودة
3. ✅ **الأتمتة شاملة:** تقليل العمل اليدوي بنسبة 80%
4. ✅ **التقارير قوية:** رؤى عميقة لاتخاذ قرارات أفضل
5. ✅ **قابل للتطوير:** يمكن إضافة AI/ML لاحقاً

### التوصية
**البدء فوراً بالمرحلة 1 (MVP)** خلال 6 أسابيع للحصول على:
- عرض 360 للعميل
- نظام تفاعلات كامل
- نظام مهام ومتابعة
- أتمتة أساسية
- تقارير أولية

**العائد المتوقع:**
- تحسين رضا العملاء بنسبة 40%
- زيادة الإيرادات بنسبة 25% من العملاء الحاليين
- توفير 20 ساعة عمل أسبوعياً من الأتمتة

---

**تم إعداد هذه الخطة بواسطة:** فريق تطوير FixZone  
**تاريخ المراجعة القادمة:** بعد 3 أشهر من بدء التطبيق  
**حالة الوثيقة:** نهائية - جاهزة للتطبيق ✅

