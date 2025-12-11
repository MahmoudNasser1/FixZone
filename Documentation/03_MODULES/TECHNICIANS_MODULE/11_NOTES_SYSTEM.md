# نظام الملاحظات - للفنيين

## نظرة عامة
نظام شامل لإدارة الملاحظات على النظام عموماً وعلى الأجهزة بشكل خاص.

---

## أنواع الملاحظات

### 1. الملاحظات العامة (System Notes)
**الوصف**: ملاحظات عامة على النظام

**الاستخدامات**:
- ملاحظات عامة للفني
- تذكيرات
- ملاحظات تقنية عامة
- ملاحظات شخصية

---

### 2. الملاحظات الخاصة على الجهاز (Device Notes)
**الوصف**: ملاحظات مرتبطة بجهاز/إصلاح محدد

**الاستخدامات**:
- ملاحظات تقنية على الجهاز
- مشاكل سابقة
- حلول مطبقة
- توصيات
- معلومات مهمة

---

### 3. الملاحظات على المهام (Task Notes)
**الوصف**: ملاحظات مرتبطة بمهمة في To-Do List

**الاستخدامات**:
- تفاصيل المهمة
- ملاحظات أثناء التنفيذ
- تحديثات

---

## المميزات

### 1. إضافة ملاحظة

#### 1.1 النموذج
**الحقول**:
- **النص** (مطلوب)
- **النوع**:
  - ملاحظة عامة
  - ملاحظة على جهاز
  - ملاحظة على مهمة
- **الجهاز/الإصلاح** (إن كان نوع الجهاز)
- **المهمة** (إن كان نوع المهمة)
- **الفئة** (اختياري):
  - تقنية
  - تذكير
  - مشكلة
  - حل
  - توصية
  - أخرى
- **الأولوية** (منخفضة، متوسطة، عالية)
- **العلامات (Tags)** (اختياري)
- **المرفقات** (اختياري):
  - صور
  - ملفات
- **خاص/عام**:
  - خاص (فقط للفني)
  - عام (للجميع)
- **التذكير** (اختياري):
  - تاريخ التذكير
  - وقت التذكير

---

#### 1.2 الواجهة
- نموذج بسيط وسريع
- محرر نص غني (Rich Text Editor)
- رفع مرفقات سهل
- حفظ سريع

---

### 2. عرض الملاحظات

#### 2.1 في Dashboard
**الهدف**: عرض الملاحظات المهمة

**المميزات**:
- قائمة بالملاحظات الأخيرة
- فلترة حسب النوع
- بحث سريع
- عرض الملاحظات المهمة فقط

---

#### 2.2 في صفحة الجهاز/الإصلاح
**الهدف**: عرض جميع الملاحظات على الجهاز

**المميزات**:
- قائمة بجميع الملاحظات
- ترتيب حسب التاريخ (الأحدث أولاً)
- فلترة حسب:
  - الفئة
  - الأولوية
  - من أضافها
  - التاريخ
- بحث
- عرض تفاصيل الملاحظة

---

#### 2.3 في صفحة المهمة
**الهدف**: عرض ملاحظات المهمة

**المميزات**:
- عرض ملاحظات المهمة فقط
- إضافة ملاحظة سريعة
- تحديثات المهمة

---

### 3. تعديل الملاحظة

#### 3.1 المميزات
- تعديل النص
- تعديل الفئة
- تعديل الأولوية
- إضافة/حذف المرفقات
- تحديث التذكير

---

### 4. حذف الملاحظة

#### 4.1 المميزات
- حذف ناعم (Soft Delete)
- تأكيد قبل الحذف
- استعادة الملاحظات المحذوفة
- حذف نهائي (بعد فترة)

---

### 5. البحث في الملاحظات

#### 5.1 المميزات
- بحث في النص
- بحث حسب الفئة
- بحث حسب العلامات (Tags)
- بحث حسب التاريخ
- بحث متقدم

---

### 6. التذكيرات

#### 6.1 المميزات
- تعيين تذكير للملاحظة
- إشعارات عند وقت التذكير
- قائمة التذكيرات
- إكمال التذكير

---

### 7. المرفقات

#### 7.1 المميزات
- رفع صور
- رفع ملفات
- عرض المرفقات
- تحميل المرفقات
- حذف المرفقات

---

## قاعدة البيانات

### 1. جدول Notes

```sql
CREATE TABLE Notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  noteType ENUM('general', 'device', 'task') NOT NULL,
  deviceId INT NULL COMMENT 'إن كان نوع الجهاز',
  repairId INT NULL COMMENT 'إن كان مرتبط بإصلاح',
  taskId INT NULL COMMENT 'إن كان نوع المهمة',
  title VARCHAR(255),
  content TEXT NOT NULL,
  category VARCHAR(50),
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  tags JSON COMMENT 'العلامات',
  isPrivate BOOLEAN DEFAULT false COMMENT 'خاص أو عام',
  reminderDate DATE NULL,
  reminderTime TIME NULL,
  attachments JSON COMMENT 'المرفقات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  FOREIGN KEY (technicianId) REFERENCES Technicians(id),
  FOREIGN KEY (deviceId) REFERENCES Devices(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES Repairs(id) ON DELETE CASCADE,
  FOREIGN KEY (taskId) REFERENCES Tasks(id) ON DELETE CASCADE,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_noteType (noteType),
  INDEX idx_deviceId (deviceId),
  INDEX idx_repairId (repairId),
  INDEX idx_taskId (taskId),
  INDEX idx_reminderDate (reminderDate),
  INDEX idx_deletedAt (deletedAt)
);
```

---

### 2. جدول NoteAttachments

```sql
CREATE TABLE NoteAttachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  noteId INT NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  filePath VARCHAR(500) NOT NULL,
  fileType VARCHAR(50),
  fileSize INT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (noteId) REFERENCES Notes(id) ON DELETE CASCADE,
  
  INDEX idx_noteId (noteId)
);
```

---

## API Endpoints

### 1. Notes

```
GET    /api/technicians/:id/notes              - جلب جميع الملاحظات
GET    /api/technicians/:id/notes/general      - جلب الملاحظات العامة
GET    /api/technicians/:id/notes/device/:deviceId - جلب ملاحظات جهاز
GET    /api/technicians/:id/notes/task/:taskId - جلب ملاحظات مهمة
GET    /api/notes/:id                         - جلب ملاحظة محددة
POST   /api/technicians/:id/notes              - إضافة ملاحظة
PUT    /api/notes/:id                          - تحديث ملاحظة
DELETE /api/notes/:id                          - حذف ملاحظة
GET    /api/notes/search                       - بحث في الملاحظات
GET    /api/notes/reminders                    - جلب التذكيرات
POST   /api/notes/:id/reminder                 - تعيين تذكير
DELETE /api/notes/:id/reminder                 - حذف تذكير
```

---

### 2. Attachments

```
POST   /api/notes/:id/attachments              - رفع مرفق
GET    /api/notes/:id/attachments              - جلب المرفقات
DELETE /api/attachments/:id                    - حذف مرفق
GET    /api/attachments/:id/download           - تحميل مرفق
```

---

## الواجهة الأمامية

### 1. Notes List Component

```javascript
<NotesList
  notes={notes}
  onNoteClick={handleNoteClick}
  onAddNote={handleAddNote}
  filters={filters}
/>
```

---

### 2. Note Form Component

```javascript
<NoteForm
  note={note}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  deviceId={deviceId}
  taskId={taskId}
/>
```

---

### 3. Note Card Component

```javascript
<NoteCard
  note={note}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onReminder={handleReminder}
/>
```

---

## التكامل مع المودولات الأخرى

### 1. التكامل مع Dashboard
- عرض الملاحظات المهمة
- التذكيرات
- الملاحظات الأخيرة

---

### 2. التكامل مع صفحة الإصلاح
- عرض ملاحظات الجهاز
- إضافة ملاحظة سريعة
- ربط الملاحظة بالإصلاح

---

### 3. التكامل مع To-Do List
- ملاحظات المهام
- تحديثات المهام

---

## الإشعارات

### 1. إشعارات التذكير
- إشعار عند وقت التذكير
- قائمة التذكيرات
- إكمال التذكير

---

### 2. إشعارات الملاحظات الجديدة
- إشعار عند إضافة ملاحظة عامة (إن كان عام)
- إشعار عند إضافة ملاحظة على جهاز (للمشرف)

---

## الأولويات

### أولوية عالية جداً:
1. ✅ إضافة ملاحظة عامة
2. ✅ إضافة ملاحظة على جهاز
3. ✅ عرض الملاحظات
4. ✅ البحث في الملاحظات

### أولوية عالية:
5. ✅ تعديل/حذف الملاحظة
6. ✅ المرفقات
7. ✅ التذكيرات

### أولوية متوسطة:
8. ⚠️ العلامات (Tags)
9. ⚠️ الملاحظات على المهام
10. ⚠️ الملاحظات المشتركة

---

## التطوير المقترح

### المرحلة 1: الأساسيات (أسبوع 1)
- إضافة/عرض الملاحظات العامة
- إضافة/عرض ملاحظات الجهاز
- البحث الأساسي

### المرحلة 2: المميزات المتقدمة (أسبوع 2)
- تعديل/حذف
- المرفقات
- التذكيرات

### المرحلة 3: التكامل (أسبوع 3)
- التكامل مع Dashboard
- التكامل مع صفحة الإصلاح
- التكامل مع To-Do List

---

**ملاحظات**:
- الملاحظات يجب أن تكون سريعة وسهلة الإضافة
- البحث يجب أن يكون قوياً
- التذكيرات مهمة جداً
- دعم كامل للغة العربية

