# خطة التطوير الشاملة لنظام العملاء الشركات (CRM)
## Companies & Corporate Customers Management System

**تاريخ الإنشاء:** 2024-11-27  
**الحالة:** Production System - خطة تطوير شاملة  
**الإصدار:** 1.0.0

---

## جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [الوضع الحالي والتحليل](#2-الوضع-الحالي-والتحليل)
3. [المتطلبات والهدف](#3-المتطلبات-والهدف)
4. [خطة تطوير Backend](#4-خطة-تطوير-backend)
5. [خطة تطوير Frontend](#5-خطة-تطوير-frontend)
6. [خطة تطوير API](#6-خطة-تطوير-api)
7. [الربط مع الموديولات الأخرى](#7-الربط-مع-الموديولات-الأخرى)
8. [الأمان](#8-الأمان)
9. [خطة التنفيذ](#9-خطة-التنفيذ)
10. [الاختبار والجودة](#10-الاختبار-والجودة)
11. [التوثيق](#11-التوثيق)

---

## 1. نظرة عامة

### 1.1 مقدمة

نظام إدارة العملاء الشركات (CRM) هو موديول أساسي في نظام FixZone ERP لإدارة العلاقات مع الشركات والعملاء المؤسسيين. النظام الحالي يحتوي على وظائف أساسية ولكن يحتاج إلى تطوير شامل لتحسين الأداء والأمان والربط مع الموديولات الأخرى.

### 1.2 الأهداف الرئيسية

- ✅ إدارة شاملة للشركات والعملاء المؤسسيين
- ✅ ربط متكامل مع جميع موديولات النظام (Repairs, Invoices, Inventory, Payments)
- ✅ تقارير وإحصائيات متقدمة
- ✅ أمان عالي المستوى
- ✅ واجهة مستخدم حديثة وسهلة الاستخدام
- ✅ أداء عالي وقابلية للتوسع

### 1.3 النطاق

**يشمل:**
- إدارة الشركات (CRUD)
- إدارة العملاء المرتبطين بالشركات
- إدارة جهات الاتصال في الشركات
- إدارة العقود والاتفاقيات
- التقارير والإحصائيات
- الربط مع موديولات النظام الأخرى

**لا يشمل:**
- نظام إدارة علاقات العملاء الكامل (CRM Enterprise)
- نظام التسويق والمبيعات
- نظام إدارة المشاريع

---

## 2. الوضع الحالي والتحليل

### 2.1 البنية الحالية

#### 2.1.1 Backend

**الملفات الموجودة:**
- `backend/routes/companies.js` - Routes أساسية (360 سطر)
- `backend/routes/companiesSimple.js` - نسخة مبسطة (426 سطر)
- `backend/update_company_table.sql` - تحديثات قاعدة البيانات

**الوظائف الحالية:**
- ✅ GET `/api/companies` - جلب جميع الشركات (مع pagination و search)
- ✅ GET `/api/companies/:id` - جلب شركة واحدة
- ✅ POST `/api/companies` - إنشاء شركة جديدة
- ✅ PUT `/api/companies/:id` - تحديث شركة
- ✅ DELETE `/api/companies/:id` - حذف شركة (soft delete)
- ✅ GET `/api/companies/:id/customers` - جلب عملاء شركة

**المشاكل الحالية:**
- ❌ لا يوجد Model layer منفصل
- ❌ لا يوجد Service layer
- ❌ لا يوجد Validation schemas مخصصة
- ❌ لا يوجد Audit Logging
- ❌ لا يوجد Authorization checks متقدمة
- ❌ لا يوجد Error handling متقدم
- ❌ لا يوجد Rate limiting
- ❌ لا يوجد Caching
- ❌ لا يوجد Bulk operations
- ❌ لا يوجد Export functionality
- ❌ لا يوجد Advanced search
- ❌ لا يوجد Statistics/Reports endpoints

#### 2.1.2 Frontend

**الملفات الموجودة:**
- `frontend/react-app/src/pages/companies/NewCompanyPage.js` - صفحة إنشاء شركة
- `frontend/react-app/src/pages/companies/EditCompanyPage.js` - صفحة تعديل شركة
- `frontend/react-app/src/pages/companies/CompanyDetailsPage.js` - صفحة تفاصيل الشركة

**المشاكل الحالية:**
- ❌ لا توجد صفحة قائمة الشركات الرئيسية
- ❌ لا توجد فلاتر متقدمة
- ❌ لا توجد إحصائيات ولوحة تحكم
- ❌ لا توجد إدارة جهات الاتصال
- ❌ لا توجد إدارة العقود
- ❌ لا توجد تقارير متقدمة
- ❌ لا توجد Export/Import
- ❌ لا توجد Bulk operations UI

#### 2.1.3 قاعدة البيانات

**الجدول: `Company`**

الحقول الحالية (المفترضة):
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- address (TEXT)
- website (VARCHAR)
- taxNumber (VARCHAR)
- customFields (JSON)
- status (VARCHAR) - active, inactive, suspended
- createdAt (DATETIME)
- updatedAt (DATETIME)
- deletedAt (DATETIME) - Soft delete
```

**المشاكل الحالية:**
- ❌ لا يوجد جدول منفصل لجهات الاتصال
- ❌ لا يوجد جدول للعقود
- ❌ لا يوجد جدول للاتفاقيات
- ❌ لا يوجد جدول للفواتير المجمعة
- ❌ لا يوجد جدول للدفعات المجمعة
- ❌ لا يوجد Indexes محسّنة
- ❌ لا يوجد Full-text search indexes

#### 2.1.4 الربط مع الموديولات الأخرى

**الربط الحالي:**
- ✅ `Customer.companyId` - ربط العملاء بالشركات
- ✅ `RepairRequest` - يمكن ربط طلبات الإصلاح بالشركات عبر Customer
- ⚠️ `Invoice` - لا يوجد ربط مباشر بالشركات
- ⚠️ `Payment` - لا يوجد ربط مباشر بالشركات
- ⚠️ `Inventory` - لا يوجد ربط بالشركات

**المشاكل:**
- ❌ لا يوجد ربط مباشر بين الشركات والفواتير
- ❌ لا يوجد ربط مباشر بين الشركات والمدفوعات
- ❌ لا يوجد إدارة للائتمان والحد الائتماني
- ❌ لا يوجد تتبع للدفعات المجمعة
- ❌ لا يوجد تقارير مالية للشركات

---

## 3. المتطلبات والهدف

### 3.1 المتطلبات الوظيفية

#### 3.1.1 إدارة الشركات

**CRUD Operations:**
- ✅ إنشاء شركة جديدة
- ✅ عرض قائمة الشركات
- ✅ عرض تفاصيل شركة
- ✅ تحديث بيانات شركة
- ✅ حذف شركة (soft delete)
- ⚠️ استعادة شركة محذوفة
- ⚠️ حذف نهائي (hard delete)

**Advanced Features:**
- ⚠️ Bulk operations (حذف/تحديث متعدد)
- ⚠️ Import/Export (Excel, CSV)
- ⚠️ Duplicate detection
- ⚠️ Merge companies
- ⚠️ Company hierarchy (شركات فرعية)

#### 3.1.2 إدارة جهات الاتصال

**Features:**
- ⚠️ إضافة/تعديل/حذف جهات اتصال
- ⚠️ تحديد جهة اتصال رئيسية
- ⚠️ إدارة أدوار جهات الاتصال
- ⚠️ إدارة معلومات الاتصال (هاتف، بريد، موبايل)
- ⚠️ تتبع تاريخ الاتصالات

#### 3.1.3 إدارة العملاء المرتبطين

**Features:**
- ✅ عرض عملاء الشركة
- ⚠️ إضافة عميل جديد لشركة
- ⚠️ نقل عميل من شركة لأخرى
- ⚠️ إلغاء ربط عميل من شركة
- ⚠️ Bulk operations على عملاء الشركة

#### 3.1.4 إدارة العقود والاتفاقيات

**Features:**
- ⚠️ إنشاء عقود مع الشركات
- ⚠️ إدارة شروط الدفع
- ⚠️ إدارة الخصومات
- ⚠️ إدارة الحد الائتماني
- ⚠️ تتبع مدة العقد
- ⚠️ تجديد العقود

#### 3.1.5 التقارير والإحصائيات

**Reports:**
- ⚠️ إحصائيات الشركات (عدد، حالة، نشاط)
- ⚠️ تقرير المبيعات حسب الشركة
- ⚠️ تقرير المدفوعات حسب الشركة
- ⚠️ تقرير الديون المستحقة
- ⚠️ تقرير نشاط الشركات
- ⚠️ تقرير العملاء المرتبطين
- ⚠️ تقرير الفواتير المجمعة

### 3.2 المتطلبات غير الوظيفية

#### 3.2.1 الأداء
- ⚠️ Response time < 200ms للعمليات الأساسية
- ⚠️ Response time < 1s للتقارير المعقدة
- ⚠️ دعم pagination حتى 10,000 سجل
- ⚠️ Caching للبيانات المتكررة

#### 3.2.2 الأمان
- ⚠️ Authentication مطلوب لجميع العمليات
- ⚠️ Authorization based on roles
- ⚠️ Input validation شامل
- ⚠️ SQL Injection prevention
- ⚠️ XSS prevention
- ⚠️ CSRF protection
- ⚠️ Rate limiting
- ⚠️ Audit logging

#### 3.2.3 قابلية التوسع
- ⚠️ دعم حتى 10,000 شركة
- ⚠️ دعم حتى 100,000 عميل مرتبط
- ⚠️ دعم حتى 1,000,000 فاتورة مرتبطة

#### 3.2.4 التوافقية
- ⚠️ دعم جميع المتصفحات الحديثة
- ⚠️ Responsive design
- ⚠️ دعم RTL (Right-to-Left)

---

## 4. خطة تطوير Backend

### 4.1 إعادة هيكلة الكود

#### 4.1.1 إنشاء Service Layer

**الملف:** `backend/services/companyService.js`

```javascript
/**
 * Company Service Layer
 * يحتوي على Business Logic
 */

class CompanyService {
  // Get all companies with filters
  async getAllCompanies(filters, pagination, user) {
    // - Validate filters
    // - Check permissions
    // - Build query
    // - Apply filters
    // - Apply pagination
    // - Return results with metadata
  }

  // Get company by ID
  async getCompanyById(id, user) {
    // - Validate ID
    // - Check permissions
    // - Get company with related data
    // - Return company
  }

  // Create company
  async createCompany(data, user) {
    // - Validate data
    // - Check permissions
    // - Check duplicates
    // - Create company
    // - Log activity
    // - Return created company
  }

  // Update company
  async updateCompany(id, data, user) {
    // - Validate ID and data
    // - Check permissions
    // - Check if company exists
    // - Update company
    // - Log activity
    // - Return updated company
  }

  // Delete company (soft delete)
  async deleteCompany(id, force, user) {
    // - Validate ID
    // - Check permissions
    // - Check if company exists
    // - Check for related records
    // - Soft delete or unlink
    // - Log activity
    // - Return success
  }

  // Restore company
  async restoreCompany(id, user) {
    // - Validate ID
    // - Check permissions
    // - Restore company
    // - Log activity
    // - Return restored company
  }

  // Get company statistics
  async getCompanyStatistics(id, user) {
    // - Validate ID
    // - Check permissions
    // - Get statistics
    // - Return statistics
  }

  // Search companies
  async searchCompanies(query, filters, user) {
    // - Validate query
    // - Check permissions
    // - Full-text search
    // - Apply filters
    // - Return results
  }

  // Bulk operations
  async bulkUpdate(ids, data, user) {
    // - Validate IDs and data
    // - Check permissions
    // - Bulk update
    // - Log activities
    // - Return results
  }

  // Export companies
  async exportCompanies(filters, format, user) {
    // - Check permissions
    // - Get data
    // - Format data
    // - Generate file
    // - Return file
  }

  // Import companies
  async importCompanies(file, user) {
    // - Check permissions
    // - Validate file
    // - Parse file
    // - Validate data
    // - Create companies
    // - Log activities
    // - Return results
  }
}

module.exports = new CompanyService();
```

#### 4.1.2 إنشاء Repository Layer

**الملف:** `backend/repositories/companyRepository.js`

```javascript
/**
 * Company Repository Layer
 * يحتوي على Database Queries فقط
 */

class CompanyRepository {
  // Find all with filters
  async findAll(filters, pagination) {
    // - Build WHERE clause
    // - Build JOIN clauses
    // - Apply pagination
    // - Execute query
    // - Return results
  }

  // Find by ID
  async findById(id) {
    // - Execute query with JOINs
    // - Return result
  }

  // Create
  async create(data) {
    // - Start transaction
    // - Insert company
    // - Commit transaction
    // - Return created company
  }

  // Update
  async update(id, data) {
    // - Start transaction
    // - Update company
    // - Commit transaction
    // - Return updated company
  }

  // Soft delete
  async softDelete(id) {
    // - Update deletedAt
    // - Return success
  }

  // Restore
  async restore(id) {
    // - Set deletedAt to NULL
    // - Return success
  }

  // Count with filters
  async count(filters) {
    // - Build WHERE clause
    // - Execute COUNT query
    // - Return count
  }

  // Full-text search
  async fullTextSearch(query, filters) {
    // - Build MATCH AGAINST query
    // - Apply filters
    // - Return results
  }

  // Check duplicate
  async checkDuplicate(name, excludeId = null) {
    // - Build query
    // - Execute query
    // - Return boolean
  }
}

module.exports = new CompanyRepository();
```

#### 4.1.3 إنشاء Model Layer

**الملف:** `backend/models/company.js`

```javascript
/**
 * Company Model
 * يحتوي على Data Structure و Validation
 */

class Company {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.website = data.website;
    this.taxNumber = data.taxNumber;
    this.industry = data.industry;
    this.description = data.description;
    this.status = data.status || 'active';
    this.customFields = data.customFields || {};
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  // Validate
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('اسم الشركة مطلوب');
    }
    
    if (!this.phone || this.phone.trim().length === 0) {
      errors.push('رقم الهاتف مطلوب');
    }
    
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('البريد الإلكتروني غير صحيح');
    }
    
    return errors;
  }

  // Helper methods
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // To JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      website: this.website,
      taxNumber: this.taxNumber,
      industry: this.industry,
      description: this.description,
      status: this.status,
      customFields: this.customFields,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Company;
```

#### 4.1.4 تقسيم Routes

**الملفات:**
- `backend/routes/companies/index.js` - Main router
- `backend/routes/companies/companies.js` - CRUD operations
- `backend/routes/companies/contacts.js` - Contacts management
- `backend/routes/companies/customers.js` - Customers management
- `backend/routes/companies/contracts.js` - Contracts management
- `backend/routes/companies/statistics.js` - Statistics endpoints
- `backend/routes/companies/export.js` - Export functionality
- `backend/routes/companies/import.js` - Import functionality

### 4.2 تحسين الأمان

#### 4.2.1 Input Validation

**الملف:** `backend/middleware/validation.js` (إضافة schemas)

```javascript
const companySchemas = {
  createCompany: Joi.object({
    name: Joi.string().max(200).required()
      .messages({
        'string.empty': 'اسم الشركة مطلوب',
        'string.max': 'اسم الشركة يجب ألا يزيد عن 200 حرف'
      }),
    
    email: Joi.string().email().max(100).optional()
      .messages({
        'string.email': 'البريد الإلكتروني غير صحيح',
        'string.max': 'البريد الإلكتروني يجب ألا يزيد عن 100 حرف'
      }),
    
    phone: Joi.string().max(20).required()
      .messages({
        'string.empty': 'رقم الهاتف مطلوب',
        'string.max': 'رقم الهاتف يجب ألا يزيد عن 20 حرف'
      }),
    
    address: Joi.string().max(500).optional(),
    website: Joi.string().uri().max(200).optional(),
    taxNumber: Joi.string().max(50).optional(),
    industry: Joi.string().max(100).optional(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
    customFields: Joi.object().optional()
  }),

  updateCompany: Joi.object({
    name: Joi.string().max(200).optional(),
    email: Joi.string().email().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(500).optional(),
    website: Joi.string().uri().max(200).optional(),
    taxNumber: Joi.string().max(50).optional(),
    industry: Joi.string().max(100).optional(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    customFields: Joi.object().optional()
  }),

  bulkUpdate: Joi.object({
    ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(100).required(),
    data: Joi.object({
      status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
      // ... other fields
    }).min(1).required()
  }),

  searchCompanies: Joi.object({
    q: Joi.string().max(200).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    industry: Joi.string().max(100).optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  })
};
```

#### 4.2.2 SQL Injection Prevention

```javascript
// استخدام Prepared Statements دائماً
// استخدام Parameterized Queries
// استخدام Query Builder (Knex.js أو Sequelize)
// مثال:
const [rows] = await db.execute(
  'SELECT * FROM Company WHERE id = ? AND deletedAt IS NULL',
  [id]
);
```

#### 4.2.3 XSS Prevention

```javascript
// استخدام DOMPurify للـ Frontend
// استخدام validator.js للـ Backend
// Sanitize جميع المدخلات
const validator = require('validator');

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return validator.escape(input);
  }
  return input;
}
```

#### 4.2.4 CSRF Protection

```javascript
// تفعيل CSRF tokens في جميع POST/PUT/DELETE requests
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.post('/', csrfProtection, authMiddleware, validate(companySchemas.createCompany), ...);
```

#### 4.2.5 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const companyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'تم تجاوز الحد المسموح من الطلبات'
});

router.use(companyLimiter);
```

#### 4.2.6 Authorization

```javascript
// Check permissions based on user role
const authorize = require('../middleware/authorizeMiddleware');

// Roles: admin, manager, employee, customer
const permissions = {
  companies: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'employee'],
    update: ['admin', 'manager'],
    delete: ['admin']
  }
};

router.post('/', 
  authMiddleware, 
  authorize('companies', 'create'),
  validate(companySchemas.createCompany),
  ...
);
```

### 4.3 Audit Logging

**الملف:** `backend/services/auditLogService.js`

```javascript
async function logCompanyActivity(action, companyId, userId, details) {
  await db.execute(
    `INSERT INTO AuditLog (entityType, entityId, action, userId, details, createdAt)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    ['Company', companyId, action, userId, JSON.stringify(details)]
  );
}

// استخدام في CompanyService:
async createCompany(data, user) {
  // ... create company
  await logCompanyActivity('CREATE', company.id, user.id, {
    name: company.name,
    email: company.email
  });
}
```

### 4.4 Error Handling

**الملف:** `backend/middleware/errorHandler.js`

```javascript
class CompanyError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Error types
class CompanyNotFoundError extends CompanyError {
  constructor(id) {
    super(`الشركة غير موجودة: ${id}`, 404, 'COMPANY_NOT_FOUND');
  }
}

class CompanyDuplicateError extends CompanyError {
  constructor(name) {
    super(`يوجد شركة بنفس الاسم: ${name}`, 400, 'COMPANY_DUPLICATE');
  }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  if (err instanceof CompanyError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code
      }
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: {
      message: 'حدث خطأ في الخادم',
      code: 'INTERNAL_ERROR'
    }
  });
}
```

### 4.5 Caching

**استخدام Redis للـ Caching:**

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getCachedCompany(id) {
  const cached = await client.get(`company:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

async function cacheCompany(id, data, ttl = 3600) {
  await client.setex(`company:${id}`, ttl, JSON.stringify(data));
}
```

### 4.6 Database Enhancements

#### 4.6.1 إضافة Indexes

```sql
-- Indexes للبحث السريع
CREATE INDEX idx_company_name ON Company(name);
CREATE INDEX idx_company_status ON Company(status);
CREATE INDEX idx_company_deleted ON Company(deletedAt);
CREATE INDEX idx_company_created ON Company(createdAt);

-- Full-text search index
CREATE FULLTEXT INDEX idx_company_search ON Company(name, email, phone, address);
```

#### 4.6.2 إضافة جداول جديدة

**جدول جهات الاتصال:**
```sql
CREATE TABLE CompanyContact (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  isPrimary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
  INDEX idx_company_contact_company (companyId),
  INDEX idx_company_contact_primary (companyId, isPrimary)
);
```

**جدول العقود:**
```sql
CREATE TABLE CompanyContract (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  contractNumber VARCHAR(50) UNIQUE,
  startDate DATE NOT NULL,
  endDate DATE,
  creditLimit DECIMAL(10,2) DEFAULT 0,
  paymentTerms VARCHAR(100),
  discount DECIMAL(5,2) DEFAULT 0,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
  INDEX idx_contract_company (companyId),
  INDEX idx_contract_status (status),
  INDEX idx_contract_dates (startDate, endDate)
);
```

---

## 5. خطة تطوير Frontend

### 5.1 الصفحات المطلوبة

#### 5.1.1 صفحة قائمة الشركات

**الملف:** `frontend/react-app/src/pages/companies/CompaniesListPage.js`

**المميزات:**
- ✅ قائمة الشركات مع pagination
- ⚠️ فلاتر متقدمة (حالة، قطاع، تاريخ)
- ⚠️ بحث متقدم
- ⚠️ Sorting
- ⚠️ Bulk operations
- ⚠️ Export/Import
- ⚠️ إحصائيات سريعة

**المكونات:**
- `CompanyList` - قائمة الشركات
- `CompanyFilters` - فلاتر البحث
- `CompanyStats` - إحصائيات
- `BulkActions` - عمليات مجمعة

#### 5.1.2 صفحة تفاصيل الشركة (محسّنة)

**الملف:** `frontend/react-app/src/pages/companies/CompanyDetailsPage.js`

**المميزات:**
- ✅ عرض بيانات الشركة
- ✅ عرض العملاء المرتبطين
- ⚠️ عرض جهات الاتصال
- ⚠️ عرض العقود
- ⚠️ عرض الفواتير المرتبطة
- ⚠️ عرض المدفوعات
- ⚠️ عرض الإحصائيات
- ⚠️ Timeline للنشاطات

**المكونات:**
- `CompanyInfo` - معلومات الشركة
- `CompanyContacts` - جهات الاتصال
- `CompanyCustomers` - العملاء
- `CompanyContracts` - العقود
- `CompanyInvoices` - الفواتير
- `CompanyPayments` - المدفوعات
- `CompanyStatistics` - الإحصائيات
- `ActivityTimeline` - Timeline

#### 5.1.3 صفحة إنشاء/تعديل شركة (محسّنة)

**الملف:** `frontend/react-app/src/pages/companies/CompanyFormPage.js`

**المميزات:**
- ✅ Form validation
- ⚠️ Auto-save
- ⚠️ Duplicate detection
- ⚠️ إضافة جهات اتصال مباشرة
- ⚠️ إضافة عقد مباشرة

#### 5.1.4 صفحة إدارة جهات الاتصال

**الملف:** `frontend/react-app/src/pages/companies/CompanyContactsPage.js`

**المميزات:**
- ⚠️ قائمة جهات الاتصال
- ⚠️ إضافة/تعديل/حذف
- ⚠️ تحديد جهة اتصال رئيسية
- ⚠️ إرسال بريد إلكتروني مباشر

#### 5.1.5 صفحة إدارة العقود

**الملف:** `frontend/react-app/src/pages/companies/CompanyContractsPage.js`

**المميزات:**
- ⚠️ قائمة العقود
- ⚠️ إنشاء/تعديل/حذف عقد
- ⚠️ تتبع حالة العقد
- ⚠️ تنبيهات انتهاء العقد

#### 5.1.6 صفحة التقارير

**الملف:** `frontend/react-app/src/pages/companies/CompanyReportsPage.js`

**المميزات:**
- ⚠️ تقارير متعددة
- ⚠️ Charts و Graphs
- ⚠️ Export PDF/Excel
- ⚠️ Filters متقدمة

### 5.2 المكونات المشتركة

#### 5.2.1 CompanyCard

```javascript
// عرض بطاقة شركة في القائمة
<CompanyCard 
  company={company}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

#### 5.2.2 CompanyForm

```javascript
// Form لإضافة/تعديل شركة
<CompanyForm
  initialData={company}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

#### 5.2.3 CompanyFilters

```javascript
// فلاتر البحث
<CompanyFilters
  filters={filters}
  onChange={handleFilterChange}
  onReset={handleReset}
/>
```

#### 5.2.4 CompanyStatistics

```javascript
// إحصائيات الشركة
<CompanyStatistics
  companyId={companyId}
  period="month"
/>
```

### 5.3 State Management

**استخدام Context API أو Redux:**

```javascript
// CompanyContext
const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  
  // Actions
  const fetchCompanies = async (filters) => { ... };
  const createCompany = async (data) => { ... };
  const updateCompany = async (id, data) => { ... };
  const deleteCompany = async (id) => { ... };
  
  return (
    <CompanyContext.Provider value={{
      companies,
      loading,
      filters,
      fetchCompanies,
      createCompany,
      updateCompany,
      deleteCompany
    }}>
      {children}
    </CompanyContext.Provider>
  );
}
```

### 5.4 UI/UX Improvements

- ⚠️ Loading states محسّنة
- ⚠️ Error states واضحة
- ⚠️ Empty states مفيدة
- ⚠️ Success notifications
- ⚠️ Confirmation dialogs
- ⚠️ Responsive design
- ⚠️ Accessibility (ARIA labels)
- ⚠️ Keyboard navigation

---

## 6. خطة تطوير API

### 6.1 API Endpoints

#### 6.1.1 Companies CRUD

```
GET    /api/companies              - جلب جميع الشركات
GET    /api/companies/:id          - جلب شركة واحدة
POST   /api/companies              - إنشاء شركة جديدة
PUT    /api/companies/:id          - تحديث شركة
DELETE /api/companies/:id          - حذف شركة
PATCH  /api/companies/:id/restore  - استعادة شركة محذوفة
```

#### 6.1.2 Contacts Management

```
GET    /api/companies/:id/contacts       - جلب جهات اتصال الشركة
POST   /api/companies/:id/contacts       - إضافة جهة اتصال
PUT    /api/companies/:id/contacts/:contactId - تحديث جهة اتصال
DELETE /api/companies/:id/contacts/:contactId - حذف جهة اتصال
PATCH  /api/companies/:id/contacts/:contactId/primary - تحديد كرئيسية
```

#### 6.1.3 Customers Management

```
GET    /api/companies/:id/customers      - جلب عملاء الشركة
POST   /api/companies/:id/customers      - إضافة عميل للشركة
PUT    /api/companies/:id/customers/:customerId - نقل عميل
DELETE /api/companies/:id/customers/:customerId - إلغاء ربط عميل
```

#### 6.1.4 Contracts Management

```
GET    /api/companies/:id/contracts       - جلب عقود الشركة
POST   /api/companies/:id/contracts      - إنشاء عقد
PUT    /api/companies/:id/contracts/:contractId - تحديث عقد
DELETE /api/companies/:id/contracts/:contractId - حذف عقد
GET    /api/companies/:id/contracts/:contractId/status - حالة العقد
```

#### 6.1.5 Statistics & Reports

```
GET    /api/companies/:id/statistics     - إحصائيات الشركة
GET    /api/companies/:id/invoices       - فواتير الشركة
GET    /api/companies/:id/payments       - مدفوعات الشركة
GET    /api/companies/:id/balance        - الرصيد المستحق
GET    /api/companies/stats              - إحصائيات عامة
```

#### 6.1.6 Search & Filter

```
GET    /api/companies/search             - بحث متقدم
GET    /api/companies/export             - تصدير البيانات
POST   /api/companies/import             - استيراد البيانات
POST   /api/companies/bulk-update        - تحديث مجمع
POST   /api/companies/bulk-delete       - حذف مجمع
```

### 6.2 API Response Format

**Standard Response:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": {
    "timestamp": "2024-11-27T10:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "الشركة غير موجودة",
    "code": "COMPANY_NOT_FOUND",
    "details": { ... }
  }
}
```

### 6.3 API Documentation

**استخدام Swagger/OpenAPI:**

```javascript
/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: جلب جميع الشركات
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: رقم الصفحة
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: عدد السجلات في الصفحة
 *     responses:
 *       200:
 *         description: قائمة الشركات
 */
```

---

## 7. الربط مع الموديولات الأخرى

### 7.1 الربط مع موديول الإصلاحات (Repairs)

**الربط الحالي:**
- ✅ `RepairRequest.customerId` → `Customer.companyId` → `Company.id`

**التحسينات المطلوبة:**
- ⚠️ إضافة `RepairRequest.companyId` مباشرة (اختياري)
- ⚠️ تقارير إصلاحات حسب الشركة
- ⚠️ إحصائيات إصلاحات الشركات

**الكود:**
```javascript
// في repairs.js
async function createRepairRequest(data, user) {
  // ... existing code
  
  // إذا كان customer مرتبط بشركة، ربط RepairRequest بالشركة
  if (customer.companyId) {
    await db.execute(
      'UPDATE RepairRequest SET companyId = ? WHERE id = ?',
      [customer.companyId, repairRequestId]
    );
  }
}
```

### 7.2 الربط مع موديول الفواتير (Invoices)

**الربط المطلوب:**
- ⚠️ إضافة `Invoice.companyId` مباشرة
- ⚠️ فواتير مجمعة للشركات
- ⚠️ تقارير مالية للشركات

**Migration:**
```sql
ALTER TABLE Invoice 
ADD COLUMN companyId INT NULL AFTER customerId,
ADD INDEX idx_invoice_company (companyId),
ADD FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE SET NULL;
```

**الكود:**
```javascript
// في invoices.js
async function createInvoice(data, user) {
  // ... existing code
  
  // إذا كان customer مرتبط بشركة، ربط Invoice بالشركة
  if (customer.companyId) {
    invoiceData.companyId = customer.companyId;
  }
  
  // ... create invoice
}
```

### 7.3 الربط مع موديول المدفوعات (Payments)

**الربط المطلوب:**
- ⚠️ إضافة `Payment.companyId` مباشرة
- ⚠️ مدفوعات مجمعة للشركات
- ⚠️ تتبع الرصيد المستحق

**Migration:**
```sql
ALTER TABLE Payment 
ADD COLUMN companyId INT NULL AFTER customerId,
ADD INDEX idx_payment_company (companyId),
ADD FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE SET NULL;
```

### 7.4 الربط مع موديول المخزون (Inventory)

**الربط المطلوب:**
- ⚠️ تتبع المشتريات حسب الشركة
- ⚠️ تقارير مبيعات حسب الشركة

### 7.5 الربط مع موديول الفروع (Branches)

**الربط المطلوب:**
- ⚠️ ربط الشركات بالفروع
- ⚠️ تقارير حسب الفرع والشركة

**Migration:**
```sql
ALTER TABLE Company 
ADD COLUMN branchId INT NULL AFTER status,
ADD INDEX idx_company_branch (branchId),
ADD FOREIGN KEY (branchId) REFERENCES Branch(id) ON DELETE SET NULL;
```

### 7.6 Integration Service

**الملف:** `backend/services/companyIntegrationService.js`

```javascript
class CompanyIntegrationService {
  // Get company's total invoices
  async getCompanyInvoices(companyId, filters) {
    // - Get all invoices for company
    // - Apply filters
    // - Calculate totals
    // - Return results
  }

  // Get company's total payments
  async getCompanyPayments(companyId, filters) {
    // - Get all payments for company
    // - Apply filters
    // - Calculate totals
    // - Return results
  }

  // Get company's outstanding balance
  async getCompanyBalance(companyId) {
    // - Calculate total invoices
    // - Calculate total payments
    // - Return balance
  }

  // Get company's repair statistics
  async getCompanyRepairStats(companyId, filters) {
    // - Get repair requests
    // - Calculate statistics
    // - Return results
  }

  // Get company's complete statistics
  async getCompanyCompleteStats(companyId) {
    // - Get all statistics
    // - Combine results
    // - Return complete stats
  }
}

module.exports = new CompanyIntegrationService();
```

---

## 8. الأمان

### 8.1 Authentication

- ✅ جميع الـ endpoints تتطلب authentication
- ⚠️ Token expiration handling
- ⚠️ Refresh token mechanism

### 8.2 Authorization

**Role-based Access Control:**

```javascript
const permissions = {
  companies: {
    view: ['admin', 'manager', 'employee'],
    create: ['admin', 'manager'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    export: ['admin', 'manager'],
    import: ['admin']
  }
};
```

### 8.3 Input Validation

- ⚠️ Joi validation schemas
- ⚠️ Sanitization
- ⚠️ Type checking

### 8.4 SQL Injection Prevention

- ✅ استخدام Prepared Statements
- ⚠️ Query Builder
- ⚠️ Parameterized Queries

### 8.5 XSS Prevention

- ⚠️ Input sanitization
- ⚠️ Output encoding
- ⚠️ Content Security Policy

### 8.6 CSRF Protection

- ⚠️ CSRF tokens
- ⚠️ SameSite cookies

### 8.7 Rate Limiting

- ⚠️ Per-IP rate limiting
- ⚠️ Per-user rate limiting
- ⚠️ Per-endpoint rate limiting

### 8.8 Audit Logging

- ⚠️ Log all CRUD operations
- ⚠️ Log access attempts
- ⚠️ Log permission denials

### 8.9 Data Encryption

- ⚠️ Encrypt sensitive data at rest
- ⚠️ Encrypt data in transit (HTTPS)
- ⚠️ Hash sensitive fields

### 8.10 Security Headers

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

---

## 9. خطة التنفيذ

### 9.1 المرحلة 1: التحضير والأساسيات (أسبوع 1-2)

**الأهداف:**
- ✅ تحليل الوضع الحالي بالكامل
- ✅ تحديد المتطلبات النهائية
- ✅ إعداد خطة التنفيذ التفصيلية
- ✅ إعداد بيئة التطوير والاختبار

**المهام:**
1. مراجعة الكود الحالي
2. تحليل قاعدة البيانات
3. تحديد نقاط التحسين
4. إعداد بيئة التطوير
5. إنشاء Branch جديد للتطوير

**التسليمات:**
- ✅ خطة تطوير شاملة (هذا الملف)
- ⚠️ Technical specifications
- ⚠️ Database schema updates

### 9.2 المرحلة 2: Backend Core (أسبوع 3-4)

**الأهداف:**
- ⚠️ إعادة هيكلة Backend
- ⚠️ إنشاء Service/Repository layers
- ⚠️ تحسين Validation
- ⚠️ تحسين Error handling

**المهام:**
1. إنشاء `CompanyService`
2. إنشاء `CompanyRepository`
3. إنشاء `CompanyModel`
4. تحديث Validation schemas
5. تحسين Error handling
6. إضافة Audit logging
7. إضافة Rate limiting

**التسليمات:**
- ⚠️ Service layer كامل
- ⚠️ Repository layer كامل
- ⚠️ Validation schemas
- ⚠️ Error handling محسّن

### 9.3 المرحلة 3: Database Enhancements (أسبوع 5)

**الأهداف:**
- ⚠️ تحديث قاعدة البيانات
- ⚠️ إضافة Indexes
- ⚠️ إضافة جداول جديدة

**المهام:**
1. إنشاء Migration scripts
2. إضافة Indexes
3. إنشاء جدول `CompanyContact`
4. إنشاء جدول `CompanyContract`
5. تحديث جداول موجودة
6. اختبار Migrations

**التسليمات:**
- ⚠️ Migration scripts
- ⚠️ Database schema updated
- ⚠️ Indexes added

### 9.4 المرحلة 4: API Enhancements (أسبوع 6-7)

**الأهداف:**
- ⚠️ إضافة API endpoints جديدة
- ⚠️ تحسين API responses
- ⚠️ إضافة API documentation

**المهام:**
1. إضافة Contacts endpoints
2. إضافة Contracts endpoints
3. إضافة Statistics endpoints
4. إضافة Search endpoints
5. إضافة Export/Import endpoints
6. إضافة Bulk operations endpoints
7. إنشاء API documentation

**التسليمات:**
- ⚠️ API endpoints كاملة
- ⚠️ API documentation
- ⚠️ Postman collection

### 9.5 المرحلة 5: Frontend Development (أسبوع 8-10)

**الأهداف:**
- ⚠️ تطوير واجهة المستخدم
- ⚠️ تحسين UX
- ⚠️ إضافة Features جديدة

**المهام:**
1. تطوير صفحة قائمة الشركات
2. تحسين صفحة تفاصيل الشركة
3. تطوير صفحة جهات الاتصال
4. تطوير صفحة العقود
5. تطوير صفحة التقارير
6. إضافة Components مشتركة
7. تحسين UI/UX

**التسليمات:**
- ⚠️ Frontend pages كاملة
- ⚠️ Components library
- ⚠️ UI/UX improvements

### 9.6 المرحلة 6: Integration (أسبوع 11-12)

**الأهداف:**
- ⚠️ الربط مع الموديولات الأخرى
- ⚠️ تحديث الموديولات الموجودة

**المهام:**
1. الربط مع Repairs module
2. الربط مع Invoices module
3. الربط مع Payments module
4. الربط مع Inventory module
5. الربط مع Branches module
6. تحديث Integration service
7. اختبار التكامل

**التسليمات:**
- ⚠️ Integration كامل
- ⚠️ Updated modules
- ⚠️ Integration tests

### 9.7 المرحلة 7: Security & Performance (أسبوع 13)

**الأهداف:**
- ⚠️ تحسين الأمان
- ⚠️ تحسين الأداء
- ⚠️ إضافة Caching

**المهام:**
1. مراجعة الأمان
2. إضافة Security headers
3. تحسين SQL queries
4. إضافة Caching
5. تحسين Indexes
6. Performance testing

**التسليمات:**
- ⚠️ Security improvements
- ⚠️ Performance optimizations
- ⚠️ Caching implemented

### 9.8 المرحلة 8: Testing (أسبوع 14)

**الأهداف:**
- ⚠️ اختبار شامل
- ⚠️ إصلاح الأخطاء
- ⚠️ تحسين الجودة

**المهام:**
1. Unit tests
2. Integration tests
3. E2E tests
4. Security testing
5. Performance testing
6. Bug fixes
7. Code review

**التسليمات:**
- ⚠️ Test suite كامل
- ⚠️ Bug fixes
- ⚠️ Code review done

### 9.9 المرحلة 9: Documentation (أسبوع 15)

**الأهداف:**
- ⚠️ توثيق شامل
- ⚠️ User guide
- ⚠️ Developer guide

**المهام:**
1. API documentation
2. Code documentation
3. User guide
4. Developer guide
5. Migration guide

**التسليمات:**
- ⚠️ Documentation كامل
- ⚠️ User guide
- ⚠️ Developer guide

### 9.10 المرحلة 10: Deployment (أسبوع 16)

**الأهداف:**
- ⚠️ نشر في Production
- ⚠️ Monitoring
- ⚠️ Support

**المهام:**
1. Production deployment
2. Database migration
3. Monitoring setup
4. User training
5. Support documentation

**التسليمات:**
- ⚠️ Production deployment
- ⚠️ Monitoring active
- ⚠️ User training done

---

## 10. الاختبار والجودة

### 10.1 Unit Tests

**الملف:** `backend/tests/services/companyService.test.js`

```javascript
describe('CompanyService', () => {
  describe('createCompany', () => {
    it('should create a company successfully', async () => {
      // Test implementation
    });
    
    it('should reject duplicate company name', async () => {
      // Test implementation
    });
  });
});
```

### 10.2 Integration Tests

**الملف:** `backend/tests/integration/companies.test.js`

```javascript
describe('Companies API', () => {
  it('should create and retrieve a company', async () => {
    // Test implementation
  });
});
```

### 10.3 E2E Tests

**الملف:** `frontend/tests/e2e/companies.spec.js`

```javascript
describe('Companies Management', () => {
  it('should create a new company', async () => {
    // Test implementation
  });
});
```

### 10.4 Security Tests

- ⚠️ SQL Injection tests
- ⚠️ XSS tests
- ⚠️ CSRF tests
- ⚠️ Authorization tests

### 10.5 Performance Tests

- ⚠️ Load testing
- ⚠️ Stress testing
- ⚠️ Response time testing

---

## 11. التوثيق

### 11.1 API Documentation

- ⚠️ Swagger/OpenAPI documentation
- ⚠️ Postman collection
- ⚠️ Example requests/responses

### 11.2 Code Documentation

- ⚠️ JSDoc comments
- ⚠️ Inline comments
- ⚠️ Architecture documentation

### 11.3 User Documentation

- ⚠️ User guide
- ⚠️ Feature documentation
- ⚠️ FAQ

### 11.4 Developer Documentation

- ⚠️ Setup guide
- ⚠️ Architecture guide
- ⚠️ Contribution guide

---

## 12. الخلاصة

### 12.1 الأهداف المحققة

- ✅ خطة تطوير شاملة
- ✅ تحليل الوضع الحالي
- ✅ تحديد المتطلبات
- ✅ خطة تنفيذ مفصلة

### 12.2 الخطوات التالية

1. مراجعة الخطة والموافقة
2. بدء المرحلة 1: التحضير
3. متابعة التنفيذ حسب الخطة

### 12.3 ملاحظات مهمة

- ⚠️ النظام في Production - يجب الحذر عند التحديثات
- ⚠️ اختبار شامل قبل النشر
- ⚠️ Backup قاعدة البيانات قبل أي تغييرات
- ⚠️ Deployment تدريجي
- ⚠️ Monitoring مستمر

---

**تاريخ آخر تحديث:** 2024-11-27  
**الإصدار:** 1.0.0  
**الحالة:** قيد المراجعة

