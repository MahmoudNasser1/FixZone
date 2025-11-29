# دليل تطبيق Migration للحالات الجديدة لطلبات الإصلاح

## 📋 نظرة عامة

تم إضافة حالتين جديدتين لطلبات الإصلاح:
- **WAITING_PARTS** (بانتظار قطع غيار)
- **READY_FOR_PICKUP** (جاهز للاستلام)

## 🚀 خطوات التطبيق

### 1. على البيئة المحلية (Local)

#### الخطوة 1: إصلاح الحالات الموجودة
```bash
cd /opt/lampp/htdocs/FixZone
node backend/scripts/fix-repair-statuses-before-migration.js
```

#### الخطوة 2: تطبيق الـ Migration
```bash
node backend/scripts/apply-repair-statuses-migration.js
```

#### الخطوة 3: اختبار الـ Migration
```bash
node backend/scripts/test-repair-statuses.js
```

### 2. على الإنتاج (Production)

#### الخطوة 1: التحقق من البيئة
```bash
# تأكد من أن NODE_ENV=production
export NODE_ENV=production

# أو استخدم .env file
```

#### الخطوة 2: تطبيق الـ Migration على الإنتاج
```bash
cd /opt/lampp/htdocs/FixZone
NODE_ENV=production node backend/scripts/apply-repair-statuses-production.js
```

هذا السكريبت سيقوم بـ:
1. ✅ التحقق من البيئة
2. 📦 إنشاء نسخة احتياطية
3. 🔧 إصلاح الحالات الموجودة
4. 🚀 تطبيق الـ Migration
5. ✅ التحقق من نجاح الـ Migration

## 📝 ملاحظات مهمة

### قبل التطبيق على الإنتاج:
- ✅ تأكد من عمل النسخة الاحتياطية
- ✅ اختبر على البيئة المحلية أولاً
- ✅ تأكد من أن جميع الحالات الموجودة صحيحة
- ✅ تأكد من وجود مساحة كافية على السيرفر

### بعد التطبيق:
- ✅ تحقق من أن الحالات الجديدة تعمل في الواجهة
- ✅ اختبر تحديث حالة طلب إصلاح إلى الحالات الجديدة
- ✅ تحقق من أن الإحصائيات تعرض الحالات الجديدة بشكل صحيح

## 🔄 السيكوينس المطلوب

1. **عند الاستلام**: `RECEIVED` (في الانتظار)
2. **توكيله لفني**: `UNDER_REPAIR` (قيد الإصلاح)
3. **في حالة احتاج قطع غيار**: `WAITING_PARTS` (بانتظار قطع غيار)
4. **عند الانتهاء**: `READY_FOR_PICKUP` (جاهز للاستلام)
5. **عندما العميل يستلم**: `DELIVERED` (مكتمل)

## 📦 الملفات المهمة

- `migrations/06_ADD_REPAIR_STATUSES.sql` - ملف الـ Migration
- `backend/scripts/fix-repair-statuses-before-migration.js` - إصلاح الحالات
- `backend/scripts/apply-repair-statuses-migration.js` - تطبيق الـ Migration (Local)
- `backend/scripts/apply-repair-statuses-production.js` - تطبيق الـ Migration (Production)
- `backend/scripts/test-repair-statuses.js` - اختبار الـ Migration

## 🆘 في حالة المشاكل

### استعادة النسخة الاحتياطية:
```bash
mysql -u root -p FZ < backups/backup_before_repair_statuses_[timestamp].sql
```

### التحقق من الحالات:
```sql
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'FZ' 
AND TABLE_NAME = 'RepairRequest' 
AND COLUMN_NAME = 'status';
```

### التحقق من السجلات:
```sql
SELECT status, COUNT(*) as count 
FROM RepairRequest 
WHERE deletedAt IS NULL
GROUP BY status;
```

