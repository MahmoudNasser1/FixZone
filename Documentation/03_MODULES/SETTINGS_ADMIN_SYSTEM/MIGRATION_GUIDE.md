# دليل تشغيل Migrations - نظام الإعدادات
## Migration Guide - Settings System

**تاريخ:** 2025-01-28  
**الحالة:** ✅ جاهز للاستخدام

---

## ⚠️ تحذيرات مهمة

1. **Backup قاعدة البيانات أولاً!**
   ```bash
   mysqldump -u root -p FZ > backup_before_settings_migrations.sql
   ```

2. **اختبر على بيئة Development أولاً**
   - لا تشغل Migrations مباشرة على Production
   - اختبر على بيئة مشابهة أولاً

3. **تحقق من الاتصال بقاعدة البيانات**
   - تأكد من صحة `.env` file
   - تأكد من صلاحيات المستخدم

---

## 🚀 طريقة التشغيل

### الطريقة 1: استخدام Migration Runner (موصى بها)

```bash
cd /opt/lampp/htdocs/FixZone/backend
npm run migrate:settings
```

### الطريقة 2: تشغيل يدوي

```bash
cd /opt/lampp/htdocs/FixZone/backend
node run-settings-migrations.js
```

### الطريقة 3: تشغيل Migrations مباشرة (للمستخدمين المتقدمين)

> **للتشغيل على البيئة المحلية:**
```bash
mysql -u root -p FZ < migrations/20251128_enhance_system_setting_table.sql
mysql -u root -p FZ < migrations/20251128_create_setting_history_table.sql
mysql -u root -p FZ < migrations/20251128_create_setting_category_table.sql
mysql -u root -p FZ < migrations/20251128_create_setting_backup_table.sql
```

> **للتشغيل على سيرفر البرودكشن (مثال):**
```bash
cd FixZone/backend
mysql -u root -p0000 FZ < migrations/20251128_enhance_system_setting_table.sql
mysql -u root -p0000 FZ < migrations/20251128_create_setting_history_table.sql
mysql -u root -p0000 FZ < migrations/20251128_create_setting_category_table.sql
mysql -u root -p0000 FZ < migrations/20251128_create_setting_backup_table.sql
```


---

## 📋 Migrations بالترتيب

### 1. Enhance SystemSetting Table
**File:** `20251128_enhance_system_setting_table.sql`

**ما يفعله:**
- يضيف أعمدة جديدة لجدول SystemSetting
- يضيف Indexes للأداء
- آمن للتشغيل (يستخدم IF NOT EXISTS)

**الأعمدة المضافة:**
- `category` - فئة الإعداد
- `isEncrypted` - هل الإعداد مشفر
- `isSystem` - هل إعداد نظام
- `isPublic` - هل إعداد عام
- `defaultValue` - القيمة الافتراضية
- `validationRules` - قواعد التحقق
- `dependencies` - التبعيات
- `environment` - البيئة
- `permissions` - الصلاحيات
- `metadata` - بيانات إضافية

### 2. Create SettingHistory Table
**File:** `20251128_create_setting_history_table.sql`

**ما يفعله:**
- ينشئ جدول SettingHistory
- يربط مع SystemSetting و User
- يضيف Indexes

### 3. Create SettingCategory Table
**File:** `20251128_create_setting_category_table.sql`

**ما يفعله:**
- ينشئ جدول SettingCategory
- يضيف الفئات الافتراضية
- يدعم الفئات المتداخلة

**الفئات الافتراضية:**
- general (عام)
- currency (العملة)
- printing (الطباعة)
- messaging (المراسلة)
- locale (المحلية)
- system (النظام)
- variables (المتغيرات)
- advanced (متقدم)

### 4. Create SettingBackup Table
**File:** `20251128_create_setting_backup_table.sql`

**ما يفعله:**
- ينشئ جدول SettingBackup
- يخزن النسخ الاحتياطية
- يربط مع User

---

## ✅ التحقق من نجاح Migrations

### 1. التحقق من الجداول

```sql
-- التحقق من SystemSetting
DESCRIBE SystemSetting;
SELECT COUNT(*) FROM SystemSetting;

-- التحقق من SettingHistory
DESCRIBE SettingHistory;
SELECT COUNT(*) FROM SettingHistory;

-- التحقق من SettingCategory
DESCRIBE SettingCategory;
SELECT * FROM SettingCategory;

-- التحقق من SettingBackup
DESCRIBE SettingBackup;
SELECT COUNT(*) FROM SettingBackup;

-- التحقق من migration_history
SELECT * FROM migration_history ORDER BY executed_at DESC;
```

### 2. التحقق من Indexes

```sql
SHOW INDEXES FROM SystemSetting;
SHOW INDEXES FROM SettingHistory;
SHOW INDEXES FROM SettingCategory;
SHOW INDEXES FROM SettingBackup;
```

### 3. اختبار API

```bash
cd /opt/lampp/htdocs/FixZone/backend
npm run test:settings-api
```

---

## 🔄 Rollback (التراجع)

إذا احتجت للتراجع عن Migrations:

### 1. Rollback SettingBackup Table
```sql
DROP TABLE IF EXISTS SettingBackup;
```

### 2. Rollback SettingCategory Table
```sql
DROP TABLE IF EXISTS SettingCategory;
```

### 3. Rollback SettingHistory Table
```sql
DROP TABLE IF EXISTS SettingHistory;
```

### 4. Rollback SystemSetting Enhancements
```sql
ALTER TABLE SystemSetting
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS isEncrypted,
DROP COLUMN IF EXISTS isSystem,
DROP COLUMN IF EXISTS isPublic,
DROP COLUMN IF EXISTS defaultValue,
DROP COLUMN IF EXISTS validationRules,
DROP COLUMN IF EXISTS dependencies,
DROP COLUMN IF EXISTS environment,
DROP COLUMN IF EXISTS permissions,
DROP COLUMN IF EXISTS metadata;

DROP INDEX IF EXISTS idx_category ON SystemSetting;
DROP INDEX IF EXISTS idx_environment ON SystemSetting;
DROP INDEX IF EXISTS idx_key ON SystemSetting;
```

**⚠️ تحذير:** Rollback سيحذف البيانات! تأكد من وجود backup.

---

## 🐛 حل المشاكل الشائعة

### مشكلة: "Table already exists"
**الحل:** هذا طبيعي، Migration Runner يتخطى الجداول الموجودة.

### مشكلة: "Column already exists"
**الحل:** هذا طبيعي، Migration يستخدم IF NOT EXISTS.

### مشكلة: "Access denied"
**الحل:** تأكد من صلاحيات المستخدم:
```sql
GRANT ALL PRIVILEGES ON FZ.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### مشكلة: "Connection refused"
**الحل:** تأكد من:
1. MySQL يعمل
2. `.env` file صحيح
3. الاتصال بقاعدة البيانات

---

## 📊 حالة Migrations

للتحقق من حالة Migrations:

```sql
SELECT * FROM migration_history 
ORDER BY executed_at DESC;
```

---

## ✅ Checklist قبل التشغيل

- [ ] Backup قاعدة البيانات
- [ ] التحقق من `.env` file
- [ ] التحقق من اتصال قاعدة البيانات
- [ ] تشغيل على بيئة Development أولاً
- [ ] مراجعة Migration files
- [ ] التأكد من وجود مساحة كافية

---

## 📝 ملاحظات

1. **Migration Runner** يسجل جميع Migrations في جدول `migration_history`
2. **Migrations آمنة** - يمكن تشغيلها عدة مرات
3. **لا تحذف البيانات** - Migrations تضيف فقط
4. **Backup مهم** - احتفظ بنسخة احتياطية دائماً

---

**آخر تحديث:** 2025-01-28

