# دليل Deployment - نظام الإعدادات
## Deployment Guide - Settings System

**تاريخ:** 2025-01-28  
**الحالة:** ✅ جاهز للاستخدام

---

## 📋 Checklist قبل Deployment

### قبل Deployment على Staging

- [ ] ✅ Unit Tests تعمل (29/29 passing)
- [ ] ✅ Migration files جاهزة
- [ ] ✅ Backup script جاهز
- [ ] ✅ Deployment script جاهز
- [ ] ✅ .env file محدث
- [ ] ✅ قاعدة البيانات متصلة
- [ ] ✅ Admin user موجود

---

## 🚀 Deployment على Staging

### الطريقة 1: استخدام Deployment Script (موصى بها)

```bash
cd /opt/lampp/htdocs/FixZone/backend
npm run deploy:staging
```

هذا الـ script يقوم بـ:
1. ✅ التحقق من Prerequisites
2. 📦 إنشاء نسخة احتياطية
3. 🔄 تشغيل Migrations
4. ✅ التحقق من Deployment

### الطريقة 2: خطوات يدوية

#### Step 1: إنشاء نسخة احتياطية

```bash
cd /opt/lampp/htdocs/FixZone/backend
npm run backup:db
```

أو يدوياً:
```bash
mysqldump -u root -p FZ > backup_before_settings_deployment.sql
```

#### Step 2: تشغيل Migrations

```bash
npm run migrate:settings
```

#### Step 3: التحقق من Deployment

```sql
-- التحقق من الجداول
SHOW TABLES LIKE 'Setting%';

-- التحقق من الأعمدة
DESCRIBE SystemSetting;

-- التحقق من البيانات
SELECT COUNT(*) FROM SystemSetting;
SELECT * FROM SettingCategory;
```

#### Step 4: اختبار API

```bash
# اختبار API endpoints
npm run test:settings-api
```

---

## 🔄 Rollback Plan

إذا احتجت للتراجع عن Deployment:

### 1. استعادة قاعدة البيانات

```bash
# من النسخة الاحتياطية
mysql -u root -p FZ < backup_before_settings_deployment.sql
```

### 2. إزالة الجداول الجديدة (اختياري)

```sql
DROP TABLE IF EXISTS SettingBackup;
DROP TABLE IF EXISTS SettingCategory;
DROP TABLE IF EXISTS SettingHistory;
```

### 3. إزالة الأعمدة الجديدة من SystemSetting (اختياري)

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
```

**⚠️ تحذير:** Rollback سيحذف البيانات! تأكد من وجود backup.

---

## 📊 Monitoring بعد Deployment

### 1. مراقبة Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Error logs
tail -f backend/logs/error.log
```

### 2. مراقبة قاعدة البيانات

```sql
-- مراقبة حجم الجداول
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'FZ'
  AND table_name LIKE 'Setting%'
ORDER BY size_mb DESC;

-- مراقبة Migration history
SELECT * FROM migration_history 
ORDER BY executed_at DESC;
```

### 3. اختبار API Endpoints

```bash
# Get all settings
curl -X GET http://localhost:4000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get setting by key
curl -X GET http://localhost:4000/api/settings/company.name \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: Migration فشل

**الحل:**
1. تحقق من logs
2. تحقق من اتصال قاعدة البيانات
3. تحقق من صلاحيات المستخدم
4. استعد من backup إذا لزم الأمر

### مشكلة: API لا يعمل

**الحل:**
1. تحقق من أن السيرفر يعمل
2. تحقق من Routes في `app.js`
3. تحقق من Middleware
4. تحقق من Authentication

### مشكلة: Frontend لا يتصل

**الحل:**
1. تحقق من API base URL
2. تحقق من CORS settings
3. تحقق من Network tab في DevTools
4. تحقق من Console errors

---

## ✅ Post-Deployment Checklist

بعد Deployment على Staging:

- [ ] ✅ جميع الجداول موجودة
- [ ] ✅ جميع الأعمدة موجودة
- [ ] ✅ API endpoints تعمل
- [ ] ✅ Frontend يتصل بالـ API
- [ ] ✅ Authentication يعمل
- [ ] ✅ لا توجد أخطاء في Logs
- [ ] ✅ Performance مقبول
- [ ] ✅ Backup موجود وآمن

---

## 🚀 Deployment على Production

بعد نجاح Deployment على Staging:

### Phase 1: Read-Only (أسبوع 1)
- Deploy new APIs (read-only)
- Keep old APIs working
- Monitor performance

### Phase 2: Write Operations (أسبوع 2)
- Enable write operations gradually
- Monitor for errors
- Keep old APIs as fallback

### Phase 3: Full Migration (أسبوع 3)
- Migrate all settings to new system
- Deprecate old APIs
- Monitor for issues

### Phase 4: Cleanup (أسبوع 4)
- Remove old code
- Clean up database
- Final testing

---

## 📝 ملاحظات

1. **Backup مهم جداً** - احتفظ بنسخة احتياطية قبل أي deployment
2. **Test على Staging أولاً** - لا تنتقل للـ Production مباشرة
3. **Monitor بعد Deployment** - راقب النظام لمدة 24-48 ساعة
4. **Document التغييرات** - سجل جميع التغييرات

---

**آخر تحديث:** 2025-01-28

