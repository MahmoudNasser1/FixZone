# إصلاح سريع لمشكلة استهلاك CPU العالي

## المشكلة
السيرفر يعيد التشغيل باستمرار بسبب خطأ: `Cannot find module 'exceljs'`

## الحل السريع (3 خطوات)

### 1. إيقاف السيرفر
```bash
pm2 stop fixzone-api
```

### 2. تثبيت الموديولات
```bash
cd /home/deploy/FixZone/backend
npm install --production
```

### 3. إعادة تشغيل السيرفر
```bash
pm2 restart fixzone-api
pm2 logs fixzone-api --err --lines 20
```

## التحقق من نجاح الإصلاح
```bash
# يجب ألا ترى أي أخطاء
pm2 logs fixzone-api --err --lines 10

# يجب أن يكون CPU أقل من 10%
pm2 monit
```

## إذا لم يعمل (PM2 Cache Issue)

إذا استمر الخطأ بعد تثبيت الموديولات، المشكلة في PM2 cache:

### الحل: إعادة تهيئة PM2 بالكامل

```bash
# 1. حذف العملية وقتل PM2 daemon
pm2 stop fixzone-api
pm2 delete fixzone-api
pm2 kill
sleep 2

# 2. التحقق من exceljs
cd /home/deploy/FixZone/backend
node -e "require('exceljs'); console.log('✅ exceljs works!')"

# 3. إعادة تشغيل PM2 من الصفر
cd /home/deploy/FixZone
pm2 start backend/server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production \
    --update-env

pm2 save

# 4. التحقق
sleep 5
pm2 logs fixzone-api --err --lines 20
```

### أو استخدام السكريبت التلقائي:

```bash
cd /home/deploy/FixZone/backend
./scripts/fix-pm2-cache-issue.sh
```

---
**ملاحظات:**
- راجع `VPS_CPU_FIX.md` للتفاصيل الكاملة
- راجع `PM2_CACHE_FIX.md` لحل مشاكل PM2 cache

