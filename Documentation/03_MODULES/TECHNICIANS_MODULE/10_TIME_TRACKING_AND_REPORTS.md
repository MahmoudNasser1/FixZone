# تتبع الوقت والتقارير - للفنيين

## نظرة عامة
نظام شامل لتتبع الوقت المستغرق في الإصلاحات والمهام مع إمكانية تقديم تقارير سريعة على الأجهزة.

---

## تتبع الوقت (Time Tracking)

### 1. Stopwatch System

#### 1.1 المميزات الأساسية
**الهدف**: تتبع الوقت المستغرق في كل إصلاح بشكل تلقائي

**المميزات**:
- **Start/Stop Button**: زر لبدء وإيقاف الوقت
- **عرض الوقت**: عرض الوقت بشكل واضح (ساعة:دقيقة:ثانية)
- **حفظ تلقائي**: حفظ الوقت تلقائياً عند الإيقاف
- **تتبع متعدد**: إمكانية تتبع وقت أكثر من إصلاح (لكن واحد فقط نشط)
- **إشعارات**: تنبيه عند مرور وقت معين
- **تقرير الوقت**: عرض الوقت اليومي/الأسبوعي/الشهري

---

#### 1.2 الواجهة

**في Dashboard**:
- Stopwatch كبير وواضح لكل إصلاح نشط
- زر Start/Stop واضح
- عرض الوقت بشكل بارز
- لون مختلف (أخضر = يعمل، أحمر = متوقف)

**في صفحة الإصلاح**:
- Stopwatch في أعلى الصفحة
- زر Start/Stop
- عرض الوقت المستغرق
- زر Reset (إعادة تعيين)

**في قائمة الإصلاحات**:
- مؤشر صغير للوقت النشط
- زر Start/Stop سريع
- عرض الوقت المستغرق

---

#### 1.3 الحالات

**حالة النشاط**:
- **Not Started**: لم يبدأ بعد
- **Running**: يعمل حالياً
- **Paused**: متوقف مؤقتاً
- **Stopped**: متوقف نهائياً
- **Completed**: مكتمل

---

#### 1.4 حفظ الوقت

**تلقائياً**:
- عند إيقاف Stopwatch
- عند تحديث حالة الإصلاح إلى "مكتمل"
- كل 5 دقائق (Auto-save)

**يدوياً**:
- زر "حفظ الوقت"
- عند إغلاق الصفحة (تحذير)

---

### 2. تعديل الوقت (Time Adjustment)

#### 2.1 من قبل الفني
**الهدف**: إمكانية طلب تعديل الوقت

**المميزات**:
- زر "طلب تعديل الوقت"
- إدخال الوقت الجديد
- سبب التعديل (مطلوب)
- إرسال طلب للمشرف
- انتظار الموافقة

**أسباب التعديل المقترحة**:
- نسيان بدء/إيقاف Stopwatch
- خطأ في الحساب
- وقت إضافي مطلوب
- سبب آخر (نص حر)

---

#### 2.2 من قبل المشرف
**الهدف**: إمكانية تعديل الوقت مباشرة

**المميزات**:
- تعديل الوقت مباشرة
- سبب التعديل (مطلوب)
- إشعار للفني بالتعديل
- سجل التعديلات

---

#### 2.3 سجل التعديلات
**المعلومات**:
- الوقت القديم
- الوقت الجديد
- من قام بالتعديل
- السبب
- التاريخ والوقت
- حالة الموافقة (إن كان طلب)

---

### 3. تتبع الوقت للمهام

#### 3.1 المميزات
- تتبع الوقت لكل مهمة في To-Do List
- Stopwatch لكل مهمة
- ربط الوقت بالمهمة
- تقرير الوقت للمهام

---

### 4. تقارير الوقت

#### 4.1 التقرير اليومي
**المعلومات**:
- إجمالي وقت العمل اليوم
- الوقت لكل إصلاح
- الوقت لكل مهمة
- الوقت الإجمالي
- الوقت المتوقع vs الفعلي

---

#### 4.2 التقرير الأسبوعي
**المعلومات**:
- إجمالي وقت العمل الأسبوعي
- الوقت اليومي
- متوسط الوقت اليومي
- الوقت لكل إصلاح
- الرسوم البيانية

---

#### 4.3 التقرير الشهري
**المعلومات**:
- إجمالي وقت العمل الشهري
- الوقت الأسبوعي
- متوسط الوقت اليومي
- الاتجاهات
- المقارنات

---

## التقارير على الأجهزة

### 1. تقرير سريع (Quick Report)

#### 1.1 المميزات
**الهدف**: تقديم تقرير سريع على الجهاز/الإصلاح

**النموذج**:
- **وصف المشكلة** (نص)
- **الحل المطبق** (نص)
- **الأجزاء المستخدمة** (قائمة)
- **الوقت المستغرق** (تلقائي من Stopwatch أو يدوي)
- **الصور** (اختياري، رفع صور)
- **ملاحظات إضافية** (نص)
- **الحالة** (تحديث تلقائي أو يدوي)

---

#### 1.2 الواجهة
- نموذج بسيط وسريع
- حقول واضحة
- رفع صور سهل
- حفظ سريع

---

### 2. تقرير مفصل (Detailed Report)

#### 2.1 المميزات
**الهدف**: تقرير مفصل وشامل

**الأقسام**:
1. **معلومات الإصلاح**:
   - رقم الإصلاح
   - نوع الجهاز
   - العميل
   - تاريخ الاستلام
   - تاريخ الإنجاز

2. **التشخيص**:
   - المشكلة المكتشفة
   - الأسباب المحتملة
   - الاختبارات المنجزة

3. **الحل**:
   - الحل المطبق
   - الخطوات المتبعة
   - الأجزاء المستخدمة
   - التكلفة

4. **الوقت**:
   - الوقت المستغرق
   - الوقت المتوقع
   - الفرق

5. **الملاحظات**:
   - ملاحظات عامة
   - توصيات للعميل
   - ملاحظات تقنية

6. **المرفقات**:
   - الصور
   - الفيديوهات
   - المستندات

---

### 3. تحديث الحالة مع التقرير

#### 3.1 المميزات
- تحديث حالة الإصلاح تلقائياً عند حفظ التقرير
- اختيار الحالة الجديدة:
  - قيد التشخيص
  - قيد الإصلاح
  - قيد الاختبار
  - مكتمل
  - يحتاج موافقة
  - ملغي

---

### 4. قوالب التقارير

#### 4.1 المميزات
- قوالب جاهزة للتقارير
- تخصيص القوالب
- حفظ القوالب المفضلة
- استخدام سريع

---

## قاعدة البيانات

### 1. جدول TimeTracking

```sql
CREATE TABLE TimeTracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  repairId INT NULL,
  taskId INT NULL,
  startTime TIMESTAMP NOT NULL,
  endTime TIMESTAMP NULL,
  duration INT COMMENT 'بالثواني',
  status ENUM('running', 'paused', 'stopped', 'completed') DEFAULT 'running',
  adjustedDuration INT NULL COMMENT 'الوقت المعدل',
  adjustmentReason TEXT,
  adjustedBy INT NULL,
  adjustedAt TIMESTAMP NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id),
  FOREIGN KEY (repairId) REFERENCES Repairs(id),
  FOREIGN KEY (taskId) REFERENCES Tasks(id),
  FOREIGN KEY (adjustedBy) REFERENCES User(id),
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_startTime (startTime)
);
```

---

### 2. جدول Reports

```sql
CREATE TABLE TechnicianReports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  repairId INT NOT NULL,
  reportType ENUM('quick', 'detailed') DEFAULT 'quick',
  problemDescription TEXT,
  solutionApplied TEXT,
  partsUsed JSON,
  timeSpent INT COMMENT 'بالدقائق',
  images JSON COMMENT 'روابط الصور',
  additionalNotes TEXT,
  status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
  submittedAt TIMESTAMP NULL,
  approvedBy INT NULL,
  approvedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id),
  FOREIGN KEY (repairId) REFERENCES Repairs(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_status (status)
);
```

---

### 3. جدول TimeAdjustments

```sql
CREATE TABLE TimeAdjustments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  timeTrackingId INT NOT NULL,
  oldDuration INT NOT NULL,
  newDuration INT NOT NULL,
  reason TEXT NOT NULL,
  requestedBy INT NOT NULL,
  approvedBy INT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approvedAt TIMESTAMP NULL,
  
  FOREIGN KEY (timeTrackingId) REFERENCES TimeTracking(id),
  FOREIGN KEY (requestedBy) REFERENCES Technicians(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  
  INDEX idx_timeTrackingId (timeTrackingId),
  INDEX idx_status (status)
);
```

---

## API Endpoints

### 1. Time Tracking

```
POST   /api/technicians/:id/time/start      - بدء تتبع الوقت
POST   /api/technicians/:id/time/stop       - إيقاف تتبع الوقت
POST   /api/technicians/:id/time/pause      - إيقاف مؤقت
GET    /api/technicians/:id/time/current    - الوقت الحالي
GET    /api/technicians/:id/time/report     - تقرير الوقت
POST   /api/technicians/:id/time/adjust     - طلب تعديل الوقت
PUT    /api/time-adjustments/:id/approve    - موافقة على تعديل الوقت
```

---

### 2. Reports

```
GET    /api/technicians/:id/reports         - جلب التقارير
GET    /api/technicians/:id/reports/:reportId - جلب تقرير محدد
POST   /api/technicians/:id/reports         - إنشاء تقرير
PUT    /api/technicians/:id/reports/:reportId - تحديث تقرير
DELETE /api/technicians/:id/reports/:reportId - حذف تقرير
POST   /api/reports/:id/submit              - تقديم تقرير
POST   /api/reports/:id/approve             - موافقة على تقرير
```

---

## الواجهة الأمامية

### 1. Stopwatch Component

```javascript
<Stopwatch
  repairId={repairId}
  onTimeUpdate={handleTimeUpdate}
  onStart={handleStart}
  onStop={handleStop}
/>
```

---

### 2. Quick Report Form

```javascript
<QuickReportForm
  repairId={repairId}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

---

## الأولويات

### أولوية عالية جداً:
1. ✅ Stopwatch System
2. ✅ حفظ الوقت تلقائياً
3. ✅ تقرير سريع
4. ✅ تحديث الحالة

### أولوية عالية:
5. ✅ تعديل الوقت (من قبل المشرف)
6. ✅ تقرير مفصل
7. ✅ تقارير الوقت

### أولوية متوسطة:
8. ⚠️ طلب تعديل الوقت (من قبل الفني)
9. ⚠️ قوالب التقارير
10. ⚠️ تتبع الوقت للمهام

---

## التطوير المقترح

### المرحلة 1: Stopwatch الأساسي (أسبوع 1)
- Start/Stop
- عرض الوقت
- حفظ تلقائي

### المرحلة 2: التقارير (أسبوع 2)
- تقرير سريع
- تحديث الحالة
- رفع الصور

### المرحلة 3: تعديل الوقت (أسبوع 3)
- تعديل من قبل المشرف
- طلب تعديل من قبل الفني
- سجل التعديلات

### المرحلة 4: التقارير المتقدمة (أسبوع 4)
- تقرير مفصل
- قوالب التقارير
- تقارير الوقت

---

**ملاحظات**:
- Stopwatch يجب أن يكون واضحاً وسهل الاستخدام
- حفظ الوقت تلقائياً مهم جداً
- التقارير يجب أن تكون سريعة وبسيطة
- دعم كامل للغة العربية

