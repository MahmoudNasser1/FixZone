# 🚀 تعليمات تنفيذ Migration على سيرفر الإنتاج

## 📋 Migration: Add deletedAt to InspectionReport

هذا الـ migration يضيف عمود `deletedAt` لجدول `InspectionReport` لدعم Soft Delete.

---

## ✅ المتطلبات

1. **Node.js** مثبت على السيرفر
2. **mysql2** package مثبت: `npm install mysql2`
3. **Environment Variables** محددة في `.env`:
   ```env
   DB_HOST=your_production_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=FZ
   DB_PORT=3306
   ```

---

## 🎯 طريقة التنفيذ

### الطريقة 1: استخدام Node.js Script (موصى به)

```bash
# 1. الانتقال إلى مجلد المشروع
cd /path/to/FixZone

# 2. التأكد من تثبيت dependencies
npm install

# 3. تشغيل الـ migration
node backend/migrations/run_inspection_reports_migration.js
```

### الطريقة 2: استخدام SQL مباشرة

```bash
# على السيرفر
mysql -u [DB_USER] -p[DB_PASSWORD] -h [DB_HOST] [DB_NAME] < migrations/add_deletedAt_to_inspection_reports.sql
```

**مثال:**
```bash
mysql -u root -p -h localhost FZ < migrations/add_deletedAt_to_inspection_reports.sql
```

---

## 🔒 الأمان

- ✅ الـ migration **آمنة** - لا تحذف أو تعدل بيانات موجودة
- ✅ تضيف فقط عمود جديد (`deletedAt`)
- ✅ تتحقق من وجود العمود قبل الإضافة (idempotent)
- ✅ يمكن تشغيلها عدة مرات بأمان

---

## 📊 ما الذي يفعله الـ Migration

1. **إضافة عمود `deletedAt`**
   - النوع: `datetime`
   - Default: `NULL`
   - Nullable: `YES`

2. **إنشاء Index**
   - الاسم: `idx_inspection_report_deletedAt`
   - لتحسين أداء الاستعلامات

---

## ✅ التحقق من النجاح

بعد التنفيذ، يمكنك التحقق:

```sql
-- التحقق من وجود العمود
DESCRIBE InspectionReport;

-- التحقق من وجود الـ Index
SHOW INDEXES FROM InspectionReport WHERE Key_name = 'idx_inspection_report_deletedAt';

-- التحقق من البيانات
SELECT COUNT(*) as total, COUNT(deletedAt) as deleted FROM InspectionReport;
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

**تاريخ الإنشاء:** 2025-12-10  
**الإصدار:** 1.0




