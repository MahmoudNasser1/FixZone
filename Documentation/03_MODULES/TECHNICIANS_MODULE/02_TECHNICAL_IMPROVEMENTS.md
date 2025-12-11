# التحسينات التقنية والبنية التحتية - مودول الفنيين

## نظرة عامة
هذا الملف يحتوي على جميع التحسينات التقنية المطلوبة لتحسين بنية مودول الفنيين، بما في ذلك قاعدة البيانات، الـ API، الأمان، والأداء.

---

## 1. تحسينات قاعدة البيانات

### 1.1 إنشاء/تحسين جدول Technicians
**الهدف**: إنشاء جدول مخصص للفنيين مع جميع البيانات المطلوبة

**الهيكل المقترح**:
```sql
CREATE TABLE Technicians (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  employeeId VARCHAR(50) UNIQUE,
  specialization VARCHAR(100),
  hireDate DATE,
  salary DECIMAL(10,2),
  commissionRate DECIMAL(5,2),
  status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
  branchId INT,
  supervisorId INT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (branchId) REFERENCES Branches(id),
  FOREIGN KEY (supervisorId) REFERENCES User(id)
);
```

**الفهارس المطلوبة**:
- INDEX idx_userId (userId)
- INDEX idx_employeeId (employeeId)
- INDEX idx_status (status)
- INDEX idx_branchId (branchId)
- INDEX idx_deletedAt (deletedAt)

---

### 1.2 جدول TechnicianSkills (مهارات الفنيين)
**الهدف**: إدارة مهارات الفنيين

**الهيكل المقترح**:
```sql
CREATE TABLE TechnicianSkills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  skillName VARCHAR(100) NOT NULL,
  skillLevel ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
  certification VARCHAR(255),
  certificationDate DATE,
  expiryDate DATE,
  verifiedBy INT,
  verifiedAt TIMESTAMP NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  FOREIGN KEY (verifiedBy) REFERENCES User(id)
);
```

---

### 1.3 جدول TechnicianRepairs (ربط الفنيين بالإصلاحات)
**الهدف**: ربط الفنيين بالإصلاحات مع تفاصيل إضافية

**الهيكل المقترح**:
```sql
CREATE TABLE TechnicianRepairs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  repairId INT NOT NULL,
  role ENUM('primary', 'assistant') DEFAULT 'primary',
  assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assignedBy INT,
  startedAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  timeSpent INT, -- بالدقائق
  status ENUM('assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'assigned',
  notes TEXT,
  FOREIGN KEY (technicianId) REFERENCES Technicians(id),
  FOREIGN KEY (repairId) REFERENCES Repairs(id),
  FOREIGN KEY (assignedBy) REFERENCES User(id),
  UNIQUE KEY unique_technician_repair (technicianId, repairId)
);
```

---

### 1.4 جدول TechnicianPerformance (أداء الفنيين)
**الهدف**: تتبع أداء الفنيين

**الهيكل المقترح**:
```sql
CREATE TABLE TechnicianPerformance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  totalRepairs INT DEFAULT 0,
  completedRepairs INT DEFAULT 0,
  averageTime DECIMAL(10,2),
  customerRating DECIMAL(3,2),
  supervisorRating DECIMAL(3,2),
  totalEarnings DECIMAL(10,2),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (technicianId) REFERENCES Technicians(id)
);
```

---

### 1.5 جدول TechnicianEvaluations (تقييمات الفنيين)
**الهدف**: تخزين تقييمات الفنيين

**الهيكل المقترح**:
```sql
CREATE TABLE TechnicianEvaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  evaluatedBy INT NOT NULL,
  evaluationType ENUM('supervisor', 'customer', 'system') NOT NULL,
  repairId INT NULL,
  criteria JSON, -- معايير التقييم
  overallScore DECIMAL(3,2),
  comments TEXT,
  evaluationDate DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (technicianId) REFERENCES Technicians(id),
  FOREIGN KEY (evaluatedBy) REFERENCES User(id),
  FOREIGN KEY (repairId) REFERENCES Repairs(id)
);
```

---

### 1.6 جدول TechnicianSchedules (جدولة الفنيين)
**الهدف**: جدولة مهام الفنيين

**الهيكل المقترح**:
```sql
CREATE TABLE TechnicianSchedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  repairId INT NOT NULL,
  scheduledDate DATE NOT NULL,
  scheduledTime TIME NOT NULL,
  estimatedDuration INT, -- بالدقائق
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (technicianId) REFERENCES Technicians(id),
  FOREIGN KEY (repairId) REFERENCES Repairs(id)
);
```

---

### 1.7 جدول TechnicianWages (أجور الفنيين)
**الهدف**: تتبع أجور ورواتب الفنيين

**الهيكل المقترح**:
```sql
CREATE TABLE TechnicianWages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  baseSalary DECIMAL(10,2),
  commission DECIMAL(10,2),
  bonuses DECIMAL(10,2),
  deductions DECIMAL(10,2),
  totalEarnings DECIMAL(10,2),
  paymentDate DATE,
  paymentStatus ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (technicianId) REFERENCES Technicians(id)
);
```

---

### 1.8 جدول TechnicianLocations (تتبع الموقع)
**الهدف**: تتبع موقع الفنيين

**الهيكل المقترح**:
```sql
CREATE TABLE TechnicianLocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  repairId INT NULL,
  FOREIGN KEY (technicianId) REFERENCES Technicians(id),
  FOREIGN KEY (repairId) REFERENCES Repairs(id),
  INDEX idx_technician_timestamp (technicianId, timestamp)
);
```

---

## 2. تحسينات الـ API

### 2.1 Routes المطلوبة

#### 2.1.1 Routes الأساسية (`/api/technicians`)
```
GET    /api/technicians              - جلب جميع الفنيين (مع فلترة وبحث)
GET    /api/technicians/:id          - جلب فني محدد
POST   /api/technicians              - إضافة فني جديد
PUT    /api/technicians/:id          - تحديث فني
DELETE /api/technicians/:id          - حذف/تعطيل فني
PATCH  /api/technicians/:id/status   - تغيير حالة الفني
```

#### 2.1.2 Routes المهارات (`/api/technicians/:id/skills`)
```
GET    /api/technicians/:id/skills           - جلب مهارات الفني
POST   /api/technicians/:id/skills           - إضافة مهارة
PUT    /api/technicians/:id/skills/:skillId  - تحديث مهارة
DELETE /api/technicians/:id/skills/:skillId  - حذف مهارة
```

#### 2.1.3 Routes الإصلاحات (`/api/technicians/:id/repairs`)
```
GET    /api/technicians/:id/repairs          - جلب إصلاحات الفني
GET    /api/technicians/:id/repairs/active   - جلب الإصلاحات النشطة
GET    /api/technicians/:id/repairs/stats    - إحصائيات الإصلاحات
POST   /api/technicians/:id/repairs/:repairId/assign - تعيين إصلاح
```

#### 2.1.4 Routes الأداء (`/api/technicians/:id/performance`)
```
GET    /api/technicians/:id/performance      - جلب أداء الفني
GET    /api/technicians/:id/performance/stats - إحصائيات الأداء
POST   /api/technicians/:id/performance/evaluate - تقييم الفني
```

#### 2.1.5 Routes الجدولة (`/api/technicians/:id/schedule`)
```
GET    /api/technicians/:id/schedule        - جلب جدول الفني
POST   /api/technicians/:id/schedule       - جدولة مهمة
PUT    /api/technicians/:id/schedule/:scheduleId - تحديث الجدولة
DELETE /api/technicians/:id/schedule/:scheduleId - حذف من الجدول
```

#### 2.1.6 Routes الأجور (`/api/technicians/:id/wages`)
```
GET    /api/technicians/:id/wages          - جلب أجور الفني
POST   /api/technicians/:id/wages          - إضافة راتب/أجر
GET    /api/technicians/:id/wages/calculate - حساب الأجور تلقائياً
```

---

### 2.2 Controllers المطلوبة

#### 2.2.1 TechnicianController
**الوظائف المطلوبة**:
- `getAllTechnicians(req, res)` - جلب جميع الفنيين مع فلترة
- `getTechnicianById(req, res)` - جلب فني محدد
- `createTechnician(req, res)` - إنشاء فني جديد
- `updateTechnician(req, res)` - تحديث فني
- `deleteTechnician(req, res)` - حذف فني
- `updateTechnicianStatus(req, res)` - تحديث حالة الفني

#### 2.2.2 TechnicianSkillsController
**الوظائف المطلوبة**:
- `getTechnicianSkills(req, res)`
- `addSkill(req, res)`
- `updateSkill(req, res)`
- `deleteSkill(req, res)`

#### 2.2.3 TechnicianRepairsController
**الوظائف المطلوبة**:
- `getTechnicianRepairs(req, res)`
- `assignRepair(req, res)`
- `unassignRepair(req, res)`
- `getRepairStats(req, res)`

#### 2.2.4 TechnicianPerformanceController
**الوظائف المطلوبة**:
- `getPerformance(req, res)`
- `getPerformanceStats(req, res)`
- `evaluateTechnician(req, res)`

---

### 2.3 Services المطلوبة

#### 2.3.1 TechnicianService
**الوظائف**:
- `findAll(filters, pagination)`
- `findById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `assignToRepair(technicianId, repairId, role)`
- `calculateWorkload(technicianId)`

#### 2.3.2 TechnicianPerformanceService
**الوظائف**:
- `calculatePerformance(technicianId, period)`
- `getStatistics(technicianId)`
- `compareTechnicians(technicianIds, period)`

#### 2.3.3 TechnicianSchedulingService
**الوظائف**:
- `getSchedule(technicianId, date)`
- `scheduleRepair(technicianId, repairId, date, time)`
- `optimizeSchedule(technicianId)`
- `checkAvailability(technicianId, date, time)`

---

### 2.4 Validation المطلوبة

#### 2.4.1 Validators
- `validateTechnicianCreate(data)` - التحقق من بيانات إنشاء فني
- `validateTechnicianUpdate(data)` - التحقق من بيانات التحديث
- `validateSkill(data)` - التحقق من بيانات المهارة
- `validateAssignment(data)` - التحقق من تعيين إصلاح

**مثال**:
```javascript
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
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

---

## 3. تحسينات الأمان

### 3.1 Authentication & Authorization
**الهدف**: ضمان أن فقط المستخدمين المصرح لهم يمكنهم الوصول

**المتطلبات**:
- Middleware للتحقق من الهوية
- Middleware للتحقق من الصلاحيات
- صلاحيات مختلفة:
  - `technicians:read` - قراءة بيانات الفنيين
  - `technicians:create` - إضافة فنيين
  - `technicians:update` - تحديث فنيين
  - `technicians:delete` - حذف فنيين
  - `technicians:assign` - تعيين إصلاحات
  - `technicians:evaluate` - تقييم الفنيين

---

### 3.2 Data Validation
**الهدف**: التحقق من صحة البيانات المدخلة

**المتطلبات**:
- التحقق من جميع المدخلات
- تنظيف البيانات (Sanitization)
- منع SQL Injection
- منع XSS Attacks
- التحقق من أنواع البيانات

---

### 3.3 Rate Limiting
**الهدف**: منع إساءة الاستخدام

**المتطلبات**:
- تحديد عدد الطلبات لكل مستخدم
- حماية من DDoS
- حماية من Brute Force

---

## 4. تحسينات الأداء

### 4.1 Database Optimization
**الهدف**: تحسين أداء الاستعلامات

**التحسينات**:
- إضافة الفهارس (Indexes) المناسبة
- تحسين الاستعلامات المعقدة
- استخدام Pagination
- استخدام Caching للبيانات المتكررة
- تحسين JOINs

---

### 4.2 API Optimization
**الهدف**: تحسين استجابة الـ API

**التحسينات**:
- استخدام Response Caching
- تقليل حجم البيانات المرسلة
- استخدام Compression
- تحسين Serialization
- استخدام Lazy Loading

---

### 4.3 Frontend Optimization
**الهدف**: تحسين أداء الواجهة الأمامية

**التحسينات**:
- Code Splitting
- Lazy Loading للمكونات
- Memoization
- Virtual Scrolling للقوائم الطويلة
- Optimistic Updates

---

## 5. Error Handling

### 5.1 Error Responses
**الهدف**: معالجة الأخطاء بشكل مناسب

**المتطلبات**:
- رسائل خطأ واضحة بالعربية
- رموز خطأ مناسبة
- Logging للأخطاء
- Error Recovery

**مثال**:
```javascript
{
  "success": false,
  "error": {
    "code": "TECHNICIAN_NOT_FOUND",
    "message": "الفني غير موجود",
    "details": "الفني بالمعرف 123 غير موجود في النظام"
  }
}
```

---

## 6. Logging & Monitoring

### 6.1 Activity Logging
**الهدف**: تسجيل جميع الأنشطة

**المتطلبات**:
- تسجيل إنشاء/تحديث/حذف الفنيين
- تسجيل تعيين الإصلاحات
- تسجيل التقييمات
- تسجيل تغييرات الحالة

---

### 6.2 Performance Monitoring
**الهدف**: مراقبة أداء النظام

**المتطلبات**:
- مراقبة وقت الاستجابة
- مراقبة استخدام الموارد
- تنبيهات عند المشاكل
- تقارير الأداء

---

## 7. Testing

### 7.1 Unit Tests
**الهدف**: اختبار الوظائف بشكل منفصل

**المتطلبات**:
- اختبار Controllers
- اختبار Services
- اختبار Validators
- اختبار Helpers

---

### 7.2 Integration Tests
**الهدف**: اختبار التكامل بين المكونات

**المتطلبات**:
- اختبار API Endpoints
- اختبار قاعدة البيانات
- اختبار Authentication
- اختبار Authorization

---

### 7.3 E2E Tests
**الهدف**: اختبار السيناريوهات الكاملة

**المتطلبات**:
- اختبار سيناريوهات المستخدم
- اختبار التدفقات الكاملة
- اختبار الأخطاء

---

## 8. Documentation

### 8.1 API Documentation
**الهدف**: توثيق الـ API

**المتطلبات**:
- توثيق جميع Endpoints
- أمثلة للطلبات والاستجابات
- شرح المعاملات
- أمثلة الأخطاء

---

### 8.2 Code Documentation
**الهدف**: توثيق الكود

**المتطلبات**:
- تعليقات على الوظائف
- JSDoc للوظائف
- شرح المعقدات
- أمثلة الاستخدام

---

## ملخص الأولويات التقنية

### أولوية عالية جداً:
1. ✅ إنشاء/تحسين جداول قاعدة البيانات
2. ✅ إنشاء Routes الأساسية
3. ✅ إنشاء Controllers الأساسية
4. ✅ Validation والتحقق من البيانات
5. ✅ Authentication & Authorization

### أولوية عالية:
6. ✅ تحسينات قاعدة البيانات (Indexes)
7. ✅ Error Handling
8. ✅ Logging الأساسي

### أولوية متوسطة:
9. ⚠️ تحسينات الأداء
10. ⚠️ Caching
11. ⚠️ Testing

### أولوية منخفضة:
12. ⚪ Monitoring المتقدم
13. ⚪ Documentation التفصيلي

---

**ملاحظات**:
- يجب البدء بالبنية التحتية الأساسية أولاً
- التحسينات يمكن تطبيقها تدريجياً
- يُنصح بكتابة Tests أثناء التطوير

