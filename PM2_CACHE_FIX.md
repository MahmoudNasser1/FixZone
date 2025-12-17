# إصلاح مشكلة PM2 Cache مع الموديولات المفقودة

## المشكلة
بعد تثبيت الموديولات، PM2 ما زال يظهر خطأ `Cannot find module 'exceljs'` بسبب cache قديم.

## الحل: إعادة تهيئة PM2 بالكامل

### الطريقة السريعة (استخدام السكريبت):

```bash
cd /home/deploy/FixZone/backend
chmod +x scripts/fix-pm2-cache-issue.sh
./scripts/fix-pm2-cache-issue.sh
```

### الطريقة اليدوية (خطوة بخطوة):

#### 1. التحقق من وجود exceljs
```bash
cd /home/deploy/FixZone/backend
ls -la node_modules/exceljs
# يجب أن ترى المجلد موجود
```

#### 2. اختبار require من Node.js مباشرة
```bash
cd /home/deploy/FixZone/backend
node -e "require('exceljs'); console.log('✅ exceljs works!')"
```

إذا نجح هذا، المشكلة في PM2 cache.

#### 3. حذف العملية من PM2 بالكامل
```bash
pm2 stop fixzone-api
pm2 delete fixzone-api
pm2 kill  # قتل PM2 daemon لمسح الـ cache
sleep 2
```

#### 4. إعادة تشغيل PM2 من الصفر
```bash
cd /home/deploy/FixZone
pm2 start backend/server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production \
    --update-env

pm2 save
```

#### 5. التحقق من اللوجات
```bash
sleep 5
pm2 logs fixzone-api --err --lines 20
```

## إذا استمرت المشكلة

### 1. التحقق من إصدار Node.js
```bash
node --version
npm --version
```

### 2. إعادة تثبيت exceljs بشكل صريح
```bash
cd /home/deploy/FixZone/backend
npm uninstall exceljs
npm install exceljs@^4.4.0 --save --production
```

### 3. التحقق من مسار node_modules
```bash
cd /home/deploy/FixZone/backend
pwd
ls -la node_modules/exceljs
```

### 4. استخدام node_modules المطلق في PM2
```bash
pm2 delete fixzone-api
pm2 kill

cd /home/deploy/FixZone/backend
NODE_PATH=/home/deploy/FixZone/backend/node_modules pm2 start server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production \
    --update-env

pm2 save
```

## التحقق من نجاح الإصلاح

```bash
# يجب ألا ترى أي أخطاء
pm2 logs fixzone-api --err --lines 10

# يجب أن يكون status = online
pm2 status

# يجب أن يكون CPU < 10%
pm2 monit
```

## ملاحظات

- PM2 يحتفظ بـ cache للموديولات، لذلك قد يحتاج إلى إعادة تهيئة كاملة
- استخدام `--update-env` مهم لتحديث متغيرات البيئة
- `pm2 kill` يمسح الـ cache بالكامل

