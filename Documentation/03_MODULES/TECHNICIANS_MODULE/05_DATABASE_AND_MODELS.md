# قاعدة البيانات والـ Models - مودول الفنيين

## نظرة عامة
هذا الملف يحتوي على جميع متطلبات قاعدة البيانات لمودول الفنيين، بما في ذلك الجداول، العلاقات، Migrations، والـ Models.

---

## 1. الجداول المطلوبة

### 1.1 جدول Technicians (الفنيين)

**الهدف**: تخزين معلومات الفنيين الأساسية

```sql
CREATE TABLE Technicians (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE COMMENT 'ربط مع جدول User',
  employeeId VARCHAR(50) UNIQUE COMMENT 'رقم الموظف',
  specialization VARCHAR(100) COMMENT 'التخصص الرئيسي',
  hireDate DATE COMMENT 'تاريخ التوظيف',
  salary DECIMAL(10,2) DEFAULT 0 COMMENT 'الراتب الأساسي',
  commissionRate DECIMAL(5,2) DEFAULT 0 COMMENT 'نسبة العمولة (%)',
  status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active' COMMENT 'حالة الفني',
  branchId INT COMMENT 'الفرع',
  supervisorId INT COMMENT 'المشرف المباشر',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL COMMENT 'للحذف الناعم',
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (branchId) REFERENCES Branches(id) ON DELETE SET NULL,
  FOREIGN KEY (supervisorId) REFERENCES User(id) ON DELETE SET NULL,
  
  INDEX idx_userId (userId),
  INDEX idx_employeeId (employeeId),
  INDEX idx_status (status),
  INDEX idx_branchId (branchId),
  INDEX idx_supervisorId (supervisorId),
  INDEX idx_deletedAt (deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**الملاحظات**:
- `userId` مرتبط بجدول `User` للحصول على البيانات الأساسية
- `employeeId` فريد لتحديد الفني
- `status` لتتبع حالة الفني
- `deletedAt` للحذف الناعم

---

### 1.2 جدول TechnicianSkills (مهارات الفنيين)

**الهدف**: إدارة مهارات الفنيين

```sql
CREATE TABLE TechnicianSkills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  skillName VARCHAR(100) NOT NULL COMMENT 'اسم المهارة',
  skillLevel ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate' COMMENT 'مستوى المهارة',
  certification VARCHAR(255) COMMENT 'الشهادة أو الترخيص',
  certificationDate DATE COMMENT 'تاريخ الحصول على الشهادة',
  expiryDate DATE COMMENT 'تاريخ انتهاء الشهادة',
  verifiedBy INT COMMENT 'الشخص الذي تحقق من المهارة',
  verifiedAt TIMESTAMP NULL COMMENT 'تاريخ التحقق',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  FOREIGN KEY (verifiedBy) REFERENCES User(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_skillName (skillName),
  INDEX idx_skillLevel (skillLevel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 1.3 جدول TechnicianRepairs (ربط الفنيين بالإصلاحات)

**الهدف**: ربط الفنيين بالإصلاحات مع تفاصيل إضافية

```sql
CREATE TABLE TechnicianRepairs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  repairId INT NOT NULL,
  role ENUM('primary', 'assistant') DEFAULT 'primary' COMMENT 'دور الفني (رئيسي/مساعد)',
  assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ التعيين',
  assignedBy INT COMMENT 'الشخص الذي عين الإصلاح',
  startedAt TIMESTAMP NULL COMMENT 'تاريخ البدء',
  completedAt TIMESTAMP NULL COMMENT 'تاريخ الإنجاز',
  timeSpent INT COMMENT 'الوقت المستغرق بالدقائق',
  status ENUM('assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'assigned' COMMENT 'حالة التعيين',
  notes TEXT COMMENT 'ملاحظات',
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES Repairs(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedBy) REFERENCES User(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_technician_repair (technicianId, repairId),
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_status (status),
  INDEX idx_assignedAt (assignedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 1.4 جدول TechnicianPerformance (أداء الفنيين)

**الهدف**: تتبع أداء الفنيين بشكل دوري

```sql
CREATE TABLE TechnicianPerformance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  periodStart DATE NOT NULL COMMENT 'بداية الفترة',
  periodEnd DATE NOT NULL COMMENT 'نهاية الفترة',
  totalRepairs INT DEFAULT 0 COMMENT 'إجمالي الإصلاحات',
  completedRepairs INT DEFAULT 0 COMMENT 'الإصلاحات المكتملة',
  averageTime DECIMAL(10,2) COMMENT 'متوسط الوقت بالدقائق',
  customerRating DECIMAL(3,2) COMMENT 'تقييم العملاء (0-5)',
  supervisorRating DECIMAL(3,2) COMMENT 'تقييم المشرف (0-5)',
  totalEarnings DECIMAL(10,2) DEFAULT 0 COMMENT 'إجمالي الأرباح',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_period (periodStart, periodEnd),
  UNIQUE KEY unique_technician_period (technicianId, periodStart, periodEnd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 1.5 جدول TechnicianEvaluations (تقييمات الفنيين)

**الهدف**: تخزين تقييمات الفنيين

```sql
CREATE TABLE TechnicianEvaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  evaluatedBy INT NOT NULL COMMENT 'الشخص الذي قام بالتقييم',
  evaluationType ENUM('supervisor', 'customer', 'system') NOT NULL COMMENT 'نوع التقييم',
  repairId INT NULL COMMENT 'الإصلاح المرتبط (إن وجد)',
  criteria JSON COMMENT 'معايير التقييم (speed, quality, communication, etc.)',
  overallScore DECIMAL(3,2) COMMENT 'الدرجة الإجمالية (0-5)',
  comments TEXT COMMENT 'تعليقات',
  evaluationDate DATE NOT NULL COMMENT 'تاريخ التقييم',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatedBy) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES Repairs(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_evaluationType (evaluationType),
  INDEX idx_evaluationDate (evaluationDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**مثال على JSON في criteria**:
```json
{
  "speed": 4,
  "quality": 5,
  "communication": 4,
  "punctuality": 5,
  "problemSolving": 4
}
```

---

### 1.6 جدول TechnicianSchedules (جدولة الفنيين)

**الهدف**: جدولة مهام الفنيين

```sql
CREATE TABLE TechnicianSchedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  repairId INT NOT NULL,
  scheduledDate DATE NOT NULL COMMENT 'التاريخ المجدول',
  scheduledTime TIME NOT NULL COMMENT 'الوقت المجدول',
  estimatedDuration INT COMMENT 'المدة المتوقعة بالدقائق',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'الأولوية',
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled' COMMENT 'الحالة',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES Repairs(id) ON DELETE CASCADE,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_scheduledDate (scheduledDate),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 1.7 جدول TechnicianWages (أجور الفنيين)

**الهدف**: تتبع أجور ورواتب الفنيين

```sql
CREATE TABLE TechnicianWages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  periodStart DATE NOT NULL COMMENT 'بداية الفترة',
  periodEnd DATE NOT NULL COMMENT 'نهاية الفترة',
  baseSalary DECIMAL(10,2) DEFAULT 0 COMMENT 'الراتب الأساسي',
  commission DECIMAL(10,2) DEFAULT 0 COMMENT 'العمولة',
  bonuses DECIMAL(10,2) DEFAULT 0 COMMENT 'المكافآت',
  deductions DECIMAL(10,2) DEFAULT 0 COMMENT 'الخصومات',
  totalEarnings DECIMAL(10,2) DEFAULT 0 COMMENT 'إجمالي الأرباح',
  paymentDate DATE COMMENT 'تاريخ الدفع',
  paymentStatus ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending' COMMENT 'حالة الدفع',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_period (periodStart, periodEnd),
  INDEX idx_paymentStatus (paymentStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 1.8 جدول TechnicianLocations (تتبع الموقع)

**الهدف**: تتبع موقع الفنيين (GPS)

```sql
CREATE TABLE TechnicianLocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL COMMENT 'خط العرض',
  longitude DECIMAL(11,8) NOT NULL COMMENT 'خط الطول',
  accuracy DECIMAL(10,2) COMMENT 'دقة الموقع (بالمتر)',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'وقت التسجيل',
  repairId INT NULL COMMENT 'الإصلاح المرتبط (إن وجد)',
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES Repairs(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_timestamp (timestamp),
  INDEX idx_repairId (repairId),
  INDEX idx_technician_timestamp (technicianId, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**ملاحظة**: هذا الجدول قد ينمو بسرعة، يُنصح بأرشفة البيانات القديمة دورياً.

---

## 2. العلاقات بين الجداول

### 2.1 مخطط العلاقات

```
User (1) ──── (1) Technicians
                │
                ├── (1:N) TechnicianSkills
                ├── (1:N) TechnicianRepairs ─── (N:1) Repairs
                ├── (1:N) TechnicianPerformance
                ├── (1:N) TechnicianEvaluations
                ├── (1:N) TechnicianSchedules ─── (N:1) Repairs
                ├── (1:N) TechnicianWages
                └── (1:N) TechnicianLocations

Technicians (N:1) Branches
Technicians (N:1) User (supervisor)
```

---

### 2.2 Foreign Keys

**من Technicians**:
- `userId` → `User.id`
- `branchId` → `Branches.id`
- `supervisorId` → `User.id`

**من TechnicianSkills**:
- `technicianId` → `Technicians.id`
- `verifiedBy` → `User.id`

**من TechnicianRepairs**:
- `technicianId` → `Technicians.id`
- `repairId` → `Repairs.id`
- `assignedBy` → `User.id`

**من TechnicianEvaluations**:
- `technicianId` → `Technicians.id`
- `evaluatedBy` → `User.id`
- `repairId` → `Repairs.id`

**من TechnicianSchedules**:
- `technicianId` → `Technicians.id`
- `repairId` → `Repairs.id`

**من TechnicianLocations**:
- `technicianId` → `Technicians.id`
- `repairId` → `Repairs.id`

---

## 3. Migrations

### 3.1 Migration: إنشاء جدول Technicians

```sql
-- migrations/XX_create_technicians_table.sql

CREATE TABLE IF NOT EXISTS Technicians (
  -- كما هو موضح أعلاه
);

-- إضافة بيانات أولية (إن وجدت)
```

---

### 3.2 Migration: إنشاء باقي الجداول

```sql
-- migrations/XX_create_technician_skills_table.sql
-- migrations/XX_create_technician_repairs_table.sql
-- migrations/XX_create_technician_performance_table.sql
-- migrations/XX_create_technician_evaluations_table.sql
-- migrations/XX_create_technician_schedules_table.sql
-- migrations/XX_create_technician_wages_table.sql
-- migrations/XX_create_technician_locations_table.sql
```

---

### 3.3 Migration: تحديثات مستقبلية

```sql
-- migrations/XX_add_indexes_to_technicians.sql
-- migrations/XX_add_columns_to_technicians.sql
-- migrations/XX_update_technician_relationships.sql
```

---

## 4. Models

### 4.1 Technician Model

```javascript
// backend/models/Technician.js

const db = require('../db');

class Technician {
  static async findAll(filters = {}, pagination = {}) {
    // بناء استعلام مع الفلاتر
    // تطبيق Pagination
    // JOIN مع User
    // إرجاع النتائج
  }

  static async findById(id) {
    // جلب الفني مع جميع العلاقات
    const [technicians] = await db.query(`
      SELECT 
        t.*,
        u.name, u.email, u.phone, u.address,
        b.name as branchName,
        s.name as supervisorName
      FROM Technicians t
      INNER JOIN User u ON t.userId = u.id
      LEFT JOIN Branches b ON t.branchId = b.id
      LEFT JOIN User s ON t.supervisorId = s.id
      WHERE t.id = ? AND t.deletedAt IS NULL
    `, [id]);
    
    if (technicians.length === 0) return null;
    
    const technician = technicians[0];
    
    // جلب المهارات
    technician.skills = await this.getSkills(id);
    
    // جلب الإحصائيات
    technician.stats = await this.getStats(id);
    
    return technician;
  }

  static async create(data) {
    // بدء Transaction
    // إنشاء مستخدم أولاً
    // إنشاء سجل فني
    // إضافة المهارات
    // Commit
  }

  static async update(id, data) {
    // تحديث البيانات
  }

  static async delete(id, force = false) {
    // حذف ناعم أو نهائي
  }

  static async getSkills(technicianId) {
    // جلب المهارات
  }

  static async getStats(technicianId) {
    // حساب الإحصائيات
  }
}

module.exports = Technician;
```

---

### 4.2 TechnicianSkill Model

```javascript
// backend/models/TechnicianSkill.js

class TechnicianSkill {
  static async findByTechnicianId(technicianId) {
    // جلب مهارات الفني
  }

  static async create(data) {
    // إضافة مهارة
  }

  static async update(id, data) {
    // تحديث مهارة
  }

  static async delete(id) {
    // حذف مهارة
  }
}
```

---

### 4.3 TechnicianRepair Model

```javascript
// backend/models/TechnicianRepair.js

class TechnicianRepair {
  static async findByTechnicianId(technicianId, filters = {}) {
    // جلب إصلاحات الفني
  }

  static async assign(technicianId, repairId, role = 'primary', assignedBy) {
    // تعيين إصلاح
  }

  static async unassign(technicianId, repairId) {
    // إلغاء تعيين
  }

  static async getStats(technicianId) {
    // إحصائيات الإصلاحات
  }
}
```

---

## 5. Views (اختياري)

### 5.1 View: TechnicianStats

```sql
CREATE VIEW TechnicianStats AS
SELECT 
  t.id,
  t.technicianId,
  COUNT(DISTINCT tr.repairId) as totalRepairs,
  COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) as completedRepairs,
  AVG(tr.timeSpent) as averageTime,
  AVG(te.overallScore) as averageRating
FROM Technicians t
LEFT JOIN TechnicianRepairs tr ON t.id = tr.technicianId
LEFT JOIN TechnicianEvaluations te ON t.id = te.technicianId
WHERE t.deletedAt IS NULL
GROUP BY t.id;
```

---

## 6. Stored Procedures (اختياري)

### 6.1 Procedure: CalculateTechnicianPerformance

```sql
DELIMITER //
CREATE PROCEDURE CalculateTechnicianPerformance(
  IN p_technicianId INT,
  IN p_periodStart DATE,
  IN p_periodEnd DATE
)
BEGIN
  -- حساب الأداء للفترة المحددة
  -- إدراج أو تحديث في TechnicianPerformance
END //
DELIMITER ;
```

---

## 7. Triggers (اختياري)

### 7.1 Trigger: UpdateTechnicianStats

```sql
DELIMITER //
CREATE TRIGGER after_repair_completed
AFTER UPDATE ON TechnicianRepairs
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- تحديث الإحصائيات
  END IF;
END //
DELIMITER ;
```

---

## 8. Indexes Optimization

### 8.1 Indexes المطلوبة

**جدول Technicians**:
- `idx_userId` - للبحث السريع
- `idx_status` - للفلترة
- `idx_branchId` - للفلترة حسب الفرع

**جدول TechnicianRepairs**:
- `idx_technicianId_status` - Composite index
- `idx_repairId` - للبحث السريع

**جدول TechnicianLocations**:
- `idx_technician_timestamp` - Composite index للاستعلامات الزمنية

---

## 9. Data Seeding

### 9.1 Seed Data

```sql
-- إدراج بيانات تجريبية (للاختبار فقط)
INSERT INTO Technicians (userId, employeeId, specialization, status)
VALUES 
  (1, 'TECH001', 'إصلاح الهواتف', 'active'),
  (2, 'TECH002', 'إصلاح الأجهزة اللوحية', 'active');
```

---

## ملخص الأولويات

### أولوية عالية جداً:
1. ✅ جدول Technicians
2. ✅ جدول TechnicianSkills
3. ✅ جدول TechnicianRepairs
4. ✅ العلاقات الأساسية
5. ✅ Models الأساسية

### أولوية عالية:
6. ✅ جدول TechnicianPerformance
7. ✅ جدول TechnicianEvaluations
8. ✅ Indexes
9. ✅ Migrations

### أولوية متوسطة:
10. ⚠️ جدول TechnicianSchedules
11. ⚠️ جدول TechnicianWages
12. ⚠️ Views

### أولوية منخفضة:
13. ⚪ جدول TechnicianLocations
14. ⚪ Stored Procedures
15. ⚪ Triggers

---

**ملاحظات**:
- يجب استخدام UTF8MB4 للدعم الكامل للعربية
- استخدام Foreign Keys مع ON DELETE مناسب
- استخدام Indexes لتحسين الأداء
- الحذف الناعم للبيانات المهمة

