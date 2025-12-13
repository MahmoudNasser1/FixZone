# 🚀 تعليمات تنفيذ Migration على سيرفر الإنتاج

## 📋 Migration: Add deletedAt to InspectionReport

---

## ✅ الطريقة 1: استخدام phpMyAdmin (الأسهل)

1. افتح **phpMyAdmin** على السيرفر
2. اختر قاعدة البيانات **FZ** (أو اسم قاعدة البيانات الخاصة بك)
3. اضغط على تبويب **SQL**
4. انسخ محتوى الملف: `migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql`
5. الصق الكود في صندوق SQL
6. اضغط **Go** أو **تنفيذ**

---

## ✅ الطريقة 2: استخدام MySQL Command Line

### على السيرفر مباشرة:

```bash
# الطريقة 1: استخدام mysql command
mysql -u [DB_USER] -p[DB_PASSWORD] -h [DB_HOST] [DB_NAME] < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql

# مثال:
mysql -u root -p -h localhost FZ < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql
```

### أو من داخل MySQL:

```bash
# 1. الدخول إلى MySQL
mysql -u [DB_USER] -p[DB_PASSWORD] -h [DB_HOST]

# 2. اختيار قاعدة البيانات
USE FZ;

# 3. نسخ ولصق محتوى الملف SQL
# (انسخ محتوى migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql)
```

---

## ✅ الطريقة 3: استخدام SSH + MySQL

```bash
# 1. الاتصال بالسيرفر عبر SSH
ssh user@your-server.com

# 2. الانتقال لمجلد المشروع
cd /path/to/FixZone

# 3. تنفيذ الـ migration
mysql -u [DB_USER] -p[DB_PASSWORD] [DB_NAME] < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql
```

---

## ✅ الطريقة 4: استخدام Node.js Script (موصى به للمطورين)

```bash
# على السيرفر
cd /path/to/FixZone
node backend/migrations/run_inspection_reports_migration.js
```

---

## 🔒 الأمان

- ✅ **آمنة تماماً** - لا تحذف أو تعدل بيانات موجودة
- ✅ **Idempotent** - يمكن تشغيلها عدة مرات بأمان
- ✅ **تتحقق تلقائياً** - لا تضيف العمود إذا كان موجوداً
- ✅ **لا تحتاج downtime** - يمكن تنفيذها في أي وقت

---

## 📊 ما الذي يفعله الـ Migration

1. **إضافة عمود `deletedAt`**
   - النوع: `datetime`
   - Default: `NULL`
   - Nullable: `YES`
   - Comment: 'Soft delete timestamp'

2. **إنشاء Index**
   - الاسم: `idx_inspection_report_deletedAt`
   - على العمود: `deletedAt`
   - لتحسين أداء الاستعلامات

---

## ✅ التحقق من النجاح

بعد التنفيذ، يمكنك التحقق من خلال:

### في phpMyAdmin:
1. اختر جدول `InspectionReport`
2. اضغط على **Structure**
3. تأكد من وجود عمود `deletedAt`
4. اضغط على **Indexes** وتأكد من وجود `idx_inspection_report_deletedAt`

### في MySQL Command Line:

```sql
-- التحقق من وجود العمود
DESCRIBE InspectionReport;

-- التحقق من وجود الـ Index
SHOW INDEXES FROM InspectionReport WHERE Key_name = 'idx_inspection_report_deletedAt';

-- التحقق من البيانات
SELECT COUNT(*) as total_reports, COUNT(deletedAt) as deleted_reports 
FROM InspectionReport;
```

---

## 🐛 حل المشاكل

### خطأ: "Column already exists"
- **الحل:** هذا طبيعي - يعني أن الـ migration تم تنفيذها مسبقاً
- **الإجراء:** لا شيء - الـ migration آمنة للتكرار

### خطأ: "Duplicate key name"
- **الحل:** الـ index موجود مسبقاً
- **الإجراء:** لا شيء - يمكن تجاهل الخطأ

### خطأ: "Access denied"
- **الحل:** تحقق من صلاحيات المستخدم
- **الإجراء:** تأكد من أن المستخدم لديه `ALTER` و `CREATE INDEX` privileges

### خطأ: "Table doesn't exist"
- **الحل:** تأكد من اسم قاعدة البيانات
- **الإجراء:** تحقق من أنك في قاعدة البيانات الصحيحة (`USE FZ;`)

---

## 📝 ملاحظات مهمة

1. **Backup:** يُنصح بعمل backup قبل التنفيذ (رغم أن الـ migration آمنة)
2. **Timing:** يمكن تنفيذها في أي وقت - لا تحتاج downtime
3. **Rollback:** إذا احتجت للتراجع، يمكن حذف العمود:
   ```sql
   ALTER TABLE InspectionReport DROP COLUMN deletedAt;
   DROP INDEX idx_inspection_report_deletedAt ON InspectionReport;
   ```

---

## 🎯 بعد التنفيذ

بعد نجاح الـ migration:

1. ✅ تأكد من تحديث Backend code لاستخدام `WHERE deletedAt IS NULL`
2. ✅ تأكد من تحديث Frontend لاستخدام soft delete
3. ✅ اختبر إنشاء/حذف تقرير للتأكد من العمل

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs السيرفر
2. تأكد من صلاحيات قاعدة البيانات
3. تحقق من أن الجدول `InspectionReport` موجود

---

**تاريخ الإنشاء:** 2025-12-10  
**الإصدار:** 1.0




