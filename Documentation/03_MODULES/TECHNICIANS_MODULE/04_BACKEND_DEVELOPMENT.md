# تطوير الواجهة الخلفية والـ API - مودول الفنيين

## نظرة عامة
هذا الملف يحتوي على جميع متطلبات تطوير الواجهة الخلفية لمودول الفنيين، بما في ذلك Routes، Controllers، Services، Middleware، والتحقق من البيانات.

---

## 1. Routes (المسارات)

### 1.1 Routes الأساسية (`/api/technicians`)

#### GET `/api/technicians`
**الهدف**: جلب قائمة جميع الفنيين

**Query Parameters**:
- `page` - رقم الصفحة
- `pageSize` - حجم الصفحة
- `search` - البحث (اسم، بريد، هاتف)
- `status` - حالة الحساب (active, inactive)
- `specialization` - التخصص
- `branchId` - الفرع
- `sortBy` - الترتيب حسب (name, createdAt, repairsCount)
- `sortDir` - اتجاه الترتيب (asc, desc)

**Response**:
```json
{
  "success": true,
  "data": {
    "technicians": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**الصلاحيات المطلوبة**: `technicians:read`

---

#### GET `/api/technicians/:id`
**الهدف**: جلب تفاصيل فني محدد

**Response**:
```json
{
  "success": true,
  "data": {
    "technician": {
      "id": 1,
      "userId": 10,
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "phone": "0501234567",
      "specialization": "إصلاح الهواتف",
      "skills": [...],
      "stats": {
        "totalRepairs": 150,
        "completedRepairs": 140,
        "averageRating": 4.5
      }
    }
  }
}
```

**الصلاحيات المطلوبة**: `technicians:read`

---

#### POST `/api/technicians`
**الهدف**: إضافة فني جديد

**Request Body**:
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "0501234567",
  "address": "الرياض",
  "birthDate": "1990-01-01",
  "gender": "male",
  "idNumber": "1234567890",
  "employeeId": "TECH001",
  "specialization": "إصلاح الهواتف",
  "hireDate": "2024-01-01",
  "branchId": 1,
  "supervisorId": 2,
  "salary": 5000,
  "commissionRate": 10,
  "password": "password123",
  "skills": [
    {
      "skillName": "إصلاح الشاشات",
      "skillLevel": "advanced"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "تم إضافة الفني بنجاح",
  "data": {
    "technician": {...}
  }
}
```

**الصلاحيات المطلوبة**: `technicians:create`

---

#### PUT `/api/technicians/:id`
**الهدف**: تحديث بيانات فني

**Request Body**: (نفس POST لكن جميع الحقول اختيارية)

**Response**:
```json
{
  "success": true,
  "message": "تم تحديث بيانات الفني بنجاح",
  "data": {
    "technician": {...}
  }
}
```

**الصلاحيات المطلوبة**: `technicians:update`

---

#### DELETE `/api/technicians/:id`
**الهدف**: حذف/تعطيل فني

**Query Parameters**:
- `force` - حذف نهائي (true/false)

**Response**:
```json
{
  "success": true,
  "message": "تم حذف الفني بنجاح"
}
```

**الصلاحيات المطلوبة**: `technicians:delete`

---

#### PATCH `/api/technicians/:id/status`
**الهدف**: تغيير حالة الفني

**Request Body**:
```json
{
  "status": "inactive"
}
```

**Response**:
```json
{
  "success": true,
  "message": "تم تحديث حالة الفني بنجاح"
}
```

**الصلاحيات المطلوبة**: `technicians:update`

---

### 1.2 Routes المهارات (`/api/technicians/:id/skills`)

#### GET `/api/technicians/:id/skills`
**الهدف**: جلب مهارات الفني

**Response**:
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": 1,
        "skillName": "إصلاح الشاشات",
        "skillLevel": "advanced",
        "certification": "شهادة معتمدة",
        "certificationDate": "2024-01-01",
        "expiryDate": "2025-01-01"
      }
    ]
  }
}
```

---

#### POST `/api/technicians/:id/skills`
**الهدف**: إضافة مهارة للفني

**Request Body**:
```json
{
  "skillName": "إصلاح البطاريات",
  "skillLevel": "intermediate",
  "certification": "شهادة",
  "certificationDate": "2024-01-01",
  "expiryDate": "2025-01-01"
}
```

---

#### PUT `/api/technicians/:id/skills/:skillId`
**الهدف**: تحديث مهارة

---

#### DELETE `/api/technicians/:id/skills/:skillId`
**الهدف**: حذف مهارة

---

### 1.3 Routes الإصلاحات (`/api/technicians/:id/repairs`)

#### GET `/api/technicians/:id/repairs`
**الهدف**: جلب إصلاحات الفني

**Query Parameters**:
- `status` - حالة الإصلاح
- `startDate` - تاريخ البداية
- `endDate` - تاريخ النهاية
- `page`, `pageSize`

**Response**:
```json
{
  "success": true,
  "data": {
    "repairs": [...],
    "stats": {
      "total": 150,
      "completed": 140,
      "inProgress": 5,
      "pending": 5
    }
  }
}
```

---

#### GET `/api/technicians/:id/repairs/active`
**الهدف**: جلب الإصلاحات النشطة فقط

---

#### GET `/api/technicians/:id/repairs/stats`
**الهدف**: إحصائيات إصلاحات الفني

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRepairs": 150,
    "completedRepairs": 140,
    "averageTime": 120,
    "successRate": 93.3,
    "customerRating": 4.5
  }
}
```

---

#### POST `/api/technicians/:id/repairs/:repairId/assign`
**الهدف**: تعيين إصلاح للفني

**Request Body**:
```json
{
  "role": "primary"
}
```

---

#### DELETE `/api/technicians/:id/repairs/:repairId/unassign`
**الهدف**: إلغاء تعيين إصلاح

---

### 1.4 Routes الأداء (`/api/technicians/:id/performance`)

#### GET `/api/technicians/:id/performance`
**الهدف**: جلب أداء الفني

**Query Parameters**:
- `period` - الفترة (week, month, year, custom)
- `startDate` - تاريخ البداية
- `endDate` - تاريخ النهاية

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "stats": {
      "totalRepairs": 50,
      "completedRepairs": 48,
      "averageTime": 120,
      "customerRating": 4.5,
      "supervisorRating": 4.3
    },
    "trends": {
      "repairsByDay": [...],
      "timeByDay": [...],
      "ratingByDay": [...]
    }
  }
}
```

---

#### GET `/api/technicians/:id/performance/stats`
**الهدف**: إحصائيات الأداء

---

#### POST `/api/technicians/:id/performance/evaluate`
**الهدف**: تقييم الفني

**Request Body**:
```json
{
  "evaluationType": "supervisor",
  "repairId": 123,
  "criteria": {
    "speed": 4,
    "quality": 5,
    "communication": 4,
    "punctuality": 5
  },
  "overallScore": 4.5,
  "comments": "أداء ممتاز"
}
```

---

### 1.5 Routes الجدولة (`/api/technicians/:id/schedule`)

#### GET `/api/technicians/:id/schedule`
**الهدف**: جلب جدول الفني

**Query Parameters**:
- `date` - التاريخ (YYYY-MM-DD)
- `view` - نوع العرض (day, week, month)

**Response**:
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "id": 1,
        "repairId": 123,
        "scheduledDate": "2024-01-15",
        "scheduledTime": "10:00:00",
        "estimatedDuration": 120,
        "priority": "high",
        "status": "scheduled"
      }
    ]
  }
}
```

---

#### POST `/api/technicians/:id/schedule`
**الهدف**: جدولة مهمة

**Request Body**:
```json
{
  "repairId": 123,
  "scheduledDate": "2024-01-15",
  "scheduledTime": "10:00:00",
  "estimatedDuration": 120,
  "priority": "high"
}
```

---

#### PUT `/api/technicians/:id/schedule/:scheduleId`
**الهدف**: تحديث الجدولة

---

#### DELETE `/api/technicians/:id/schedule/:scheduleId`
**الهدف**: حذف من الجدول

---

### 1.6 Routes الأجور (`/api/technicians/:id/wages`)

#### GET `/api/technicians/:id/wages`
**الهدف**: جلب أجور الفني

**Query Parameters**:
- `periodStart` - بداية الفترة
- `periodEnd` - نهاية الفترة

---

#### POST `/api/technicians/:id/wages`
**الهدف**: إضافة راتب/أجر

---

#### GET `/api/technicians/:id/wages/calculate`
**الهدف**: حساب الأجور تلقائياً

**Query Parameters**:
- `periodStart`
- `periodEnd`

---

## 2. Controllers

### 2.1 TechnicianController

```javascript
// backend/controllers/technicianController.js

class TechnicianController {
  // جلب جميع الفنيين
  async getAllTechnicians(req, res) {
    try {
      const { page, pageSize, search, status, ...filters } = req.query;
      const result = await technicianService.findAll(filters, { page, pageSize });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // جلب فني محدد
  async getTechnicianById(req, res) {
    try {
      const { id } = req.params;
      const technician = await technicianService.findById(id);
      if (!technician) {
        return res.status(404).json({ 
          success: false, 
          error: 'الفني غير موجود' 
        });
      }
      res.json({ success: true, data: { technician } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // إنشاء فني جديد
  async createTechnician(req, res) {
    try {
      // التحقق من البيانات
      const validation = validateTechnicianCreate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ 
          success: false, 
          errors: validation.errors 
        });
      }

      const technician = await technicianService.create(req.body);
      res.status(201).json({ 
        success: true, 
        message: 'تم إضافة الفني بنجاح',
        data: { technician } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // تحديث فني
  async updateTechnician(req, res) {
    try {
      const { id } = req.params;
      const validation = validateTechnicianUpdate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ 
          success: false, 
          errors: validation.errors 
        });
      }

      const technician = await technicianService.update(id, req.body);
      res.json({ 
        success: true, 
        message: 'تم تحديث بيانات الفني بنجاح',
        data: { technician } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // حذف فني
  async deleteTechnician(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query;
      await technicianService.delete(id, { force: force === 'true' });
      res.json({ success: true, message: 'تم حذف الفني بنجاح' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // تحديث حالة الفني
  async updateTechnicianStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const technician = await technicianService.updateStatus(id, status);
      res.json({ 
        success: true, 
        message: 'تم تحديث حالة الفني بنجاح',
        data: { technician } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TechnicianController();
```

---

### 2.2 TechnicianSkillsController

```javascript
// backend/controllers/technicianSkillsController.js

class TechnicianSkillsController {
  async getTechnicianSkills(req, res) {
    // جلب مهارات الفني
  }

  async addSkill(req, res) {
    // إضافة مهارة
  }

  async updateSkill(req, res) {
    // تحديث مهارة
  }

  async deleteSkill(req, res) {
    // حذف مهارة
  }
}
```

---

### 2.3 TechnicianRepairsController

```javascript
// backend/controllers/technicianRepairsController.js

class TechnicianRepairsController {
  async getTechnicianRepairs(req, res) {
    // جلب إصلاحات الفني
  }

  async assignRepair(req, res) {
    // تعيين إصلاح
  }

  async unassignRepair(req, res) {
    // إلغاء تعيين
  }

  async getRepairStats(req, res) {
    // إحصائيات الإصلاحات
  }
}
```

---

### 2.4 TechnicianPerformanceController

```javascript
// backend/controllers/technicianPerformanceController.js

class TechnicianPerformanceController {
  async getPerformance(req, res) {
    // جلب الأداء
  }

  async getPerformanceStats(req, res) {
    // إحصائيات الأداء
  }

  async evaluateTechnician(req, res) {
    // تقييم الفني
  }
}
```

---

## 3. Services

### 3.1 TechnicianService

```javascript
// backend/services/technicianService.js

class TechnicianService {
  async findAll(filters = {}, pagination = {}) {
    // بناء استعلام مع الفلاتر
    // تطبيق Pagination
    // إرجاع النتائج
  }

  async findById(id) {
    // جلب الفني مع جميع العلاقات
    // إحصائيات
    // المهارات
    // الإصلاحات الأخيرة
  }

  async create(data) {
    // التحقق من البريد الإلكتروني الفريد
    // إنشاء مستخدم
    // إنشاء سجل فني
    // إضافة المهارات
    // إرسال بريد ترحيبي
  }

  async update(id, data) {
    // التحقق من وجود الفني
    // تحديث البيانات
    // تحديث المهارات إذا كانت موجودة
    // تسجيل التغييرات
  }

  async delete(id, options = {}) {
    // التحقق من وجود إصلاحات نشطة
    // حذف ناعم أو نهائي
    // أرشفة البيانات
  }

  async assignToRepair(technicianId, repairId, role = 'primary') {
    // التحقق من توفر الفني
    // تعيين الإصلاح
    // إرسال إشعار
  }

  async calculateWorkload(technicianId) {
    // حساب عدد المهام الحالية
    // حساب الوقت المتوقع
    // إرجاع عبء العمل
  }
}

module.exports = new TechnicianService();
```

---

### 3.2 TechnicianPerformanceService

```javascript
// backend/services/technicianPerformanceService.js

class TechnicianPerformanceService {
  async calculatePerformance(technicianId, period) {
    // حساب الأداء للفترة المحددة
    // عدد الإصلاحات
    // متوسط الوقت
    // التقييمات
    // معدل النجاح
  }

  async getStatistics(technicianId) {
    // إحصائيات شاملة
  }

  async compareTechnicians(technicianIds, period) {
    // مقارنة بين فنيين
  }
}
```

---

## 4. Middleware

### 4.1 Authentication Middleware
**الهدف**: التحقق من هوية المستخدم

```javascript
// backend/middleware/authMiddleware.js
const authenticate = async (req, res, next) => {
  // التحقق من Token
  // إضافة المستخدم للطلب
  next();
};
```

---

### 4.2 Authorization Middleware
**الهدف**: التحقق من الصلاحيات

```javascript
// backend/middleware/authorizeMiddleware.js
const authorize = (...permissions) => {
  return (req, res, next) => {
    // التحقق من الصلاحيات
    // السماح أو رفض
    next();
  };
};
```

---

### 4.3 Validation Middleware
**الهدف**: التحقق من البيانات

```javascript
// backend/middleware/validationMiddleware.js
const validate = (schema) => {
  return (req, res, next) => {
    // التحقق من البيانات
    // إرجاع الأخطاء إن وجدت
    next();
  };
};
```

---

## 5. Validation

### 5.1 Validators

```javascript
// backend/validators/technicianValidator.js

const validateTechnicianCreate = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('الاسم مطلوب ويجب أن يكون أكثر من حرفين');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('البريد الإلكتروني غير صحيح');
  }

  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push('رقم الهاتف غير صحيح');
  }

  // المزيد من التحققات...

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateTechnicianUpdate = (data) => {
  // نفس التحققات لكن جميع الحقول اختيارية
};

module.exports = {
  validateTechnicianCreate,
  validateTechnicianUpdate
};
```

---

## 6. Error Handling

### 6.1 Custom Errors

```javascript
// backend/utils/errors.js

class TechnicianNotFoundError extends Error {
  constructor(id) {
    super(`الفني بالمعرف ${id} غير موجود`);
    this.name = 'TechnicianNotFoundError';
    this.statusCode = 404;
  }
}

class DuplicateEmailError extends Error {
  constructor(email) {
    super(`البريد الإلكتروني ${email} مستخدم بالفعل`);
    this.name = 'DuplicateEmailError';
    this.statusCode = 409;
  }
}
```

---

### 6.2 Error Handler Middleware

```javascript
// backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'خطأ في الخادم';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.name || 'INTERNAL_ERROR',
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
```

---

## 7. Logging

### 7.1 Activity Logging

```javascript
// backend/utils/activityLogger.js

const logActivity = async (userId, action, entity, entityId, details) => {
  await db.query(`
    INSERT INTO ActivityLogs (userId, action, entity, entityId, details, createdAt)
    VALUES (?, ?, ?, ?, ?, NOW())
  `, [userId, action, entity, entityId, JSON.stringify(details)]);
};
```

---

## ملخص الأولويات

### أولوية عالية جداً:
1. ✅ Routes الأساسية (CRUD)
2. ✅ TechnicianController
3. ✅ TechnicianService
4. ✅ Validation
5. ✅ Authentication & Authorization

### أولوية عالية:
6. ✅ Routes المهارات
7. ✅ Routes الإصلاحات
8. ✅ Error Handling
9. ✅ Logging

### أولوية متوسطة:
10. ⚠️ Routes الأداء
11. ⚠️ Routes الجدولة
12. ⚠️ Performance Services

### أولوية منخفضة:
13. ⚪ Routes الأجور
14. ⚪ Advanced Services

---

**ملاحظات**:
- يجب اتباع نمط RESTful API
- جميع الاستجابات يجب أن تكون JSON
- استخدام Status Codes المناسبة
- رسائل الخطأ بالعربية

