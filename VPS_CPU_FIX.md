# إصلاح مشكلة استهلاك CPU العالي في VPS

## المشكلة
النظام يستهلك 98% من إمكانيات VPS بسبب خطأ في تحميل الموديولات، مما يسبب إعادة تشغيل مستمرة للسيرفر.

## السبب الجذري
الموديول `exceljs` غير مثبت في بيئة الإنتاج على VPS، مما يسبب:
- فشل في تحميل السيرفر
- إعادة تشغيل مستمرة من PM2
- استهلاك عالي للـ CPU

## الحل

### الخطوة 1: إيقاف السيرفر مؤقتاً
```bash
pm2 stop fixzone-api
```

### الخطوة 2: تثبيت الموديولات المفقودة

#### الطريقة الأولى: استخدام السكريبت (موصى به)
```bash
cd /home/deploy/FixZone/backend
chmod +x scripts/fix-missing-dependencies.sh
./scripts/fix-missing-dependencies.sh
```

#### الطريقة الثانية: التثبيت اليدوي
```bash
cd /home/deploy/FixZone/backend
npm install --production
```

أو تثبيت الموديول المفقود فقط:
```bash
cd /home/deploy/FixZone/backend
npm install exceljs@^4.4.0 --save
```

### الخطوة 3: التحقق من التثبيت
```bash
cd /home/deploy/FixZone/backend
ls -la node_modules/exceljs
```

يجب أن ترى مجلد `exceljs` موجود.

### الخطوة 4: إعادة تشغيل السيرفر
```bash
pm2 restart fixzone-api
```

### الخطوة 5: مراقبة اللوجات
```bash
# مراقبة الأخطاء
pm2 logs fixzone-api --err --lines 50

# مراقبة الإخراج
pm2 logs fixzone-api --out --lines 50

# مراقبة الحالة العامة
pm2 status
```

### الخطوة 6: مراقبة استهلاك الموارد
```bash
pm2 monit
```

## التحقق من نجاح الإصلاح

### 1. التحقق من عدم وجود أخطاء
```bash
pm2 logs fixzone-api --err --lines 20
```
يجب ألا ترى أي أخطاء متعلقة بـ `Cannot find module 'exceljs'`.

### 2. التحقق من استهلاك CPU
```bash
pm2 monit
```
يجب أن يكون استهلاك CPU أقل من 10% في حالة السكون.

### 3. التحقق من حالة السيرفر
```bash
pm2 status
```
يجب أن يكون الحالة `online` وليس `errored` أو `restarting`.

## منع المشكلة في المستقبل

### 1. التأكد من تثبيت الموديولات بعد كل pull
أضف هذا إلى سكريبت الـ deployment:
```bash
cd /home/deploy/FixZone/backend
npm install --production
```

### 2. التحقق من package.json قبل الـ deployment
تأكد من أن جميع الموديولات المطلوبة موجودة في `package.json`.

### 3. استخدام npm ci بدلاً من npm install في الإنتاج
```bash
npm ci --production
```
هذا يضمن تثبيت نفس الإصدارات المحددة في `package-lock.json`.

## الموديولات المطلوبة الحالية
من `backend/package.json`:
- exceljs@^4.4.0
- express@^4.18.2
- mysql2@^3.15.2
- jsonwebtoken@^9.0.2
- bcryptjs@^3.0.3
- cors@^2.8.5
- cookie-parser@^1.4.7
- express-rate-limit@^8.1.0
- express-validator@^7.2.1
- joi@^17.9.2
- multer@^2.0.2
- node-cache@^5.1.2
- node-cron@^3.0.3
- nodemailer@^7.0.6
- qrcode@^1.5.4
- ws@^8.18.3
- csv-parser@^3.2.0
- dotenv@^16.6.1
- jsbarcode@^3.12.1

## ملاحظات إضافية

### إذا استمرت المشكلة بعد تثبيت exceljs:
1. تحقق من وجود `package-lock.json`:
   ```bash
   ls -la /home/deploy/FixZone/backend/package-lock.json
   ```

2. احذف `node_modules` وأعد التثبيت:
   ```bash
   cd /home/deploy/FixZone/backend
   rm -rf node_modules
   npm install --production
   ```

3. تحقق من إصدار Node.js:
   ```bash
   node --version
   ```
   يجب أن يكون 16.x أو أحدث.

### إذا كان هناك مشاكل في الصلاحيات:
```bash
sudo chown -R deploy:deploy /home/deploy/FixZone/backend/node_modules
```

## تاريخ الإصلاح
- التاريخ: $(date +%Y-%m-%d)
- المشكلة: Cannot find module 'exceljs'
- الحل: تثبيت الموديولات المفقودة

