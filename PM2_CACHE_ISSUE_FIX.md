# إصلاح مشكلة PM2 Cache - Cannot find module 'exceljs'

## المشكلة
بعد تثبيت `exceljs` بنجاح، PM2 ما زال يظهر الخطأ `Cannot find module 'exceljs'` رغم أن الموديول مثبت.

## السبب
PM2 يستخدم cache قديم أو يعمل من مسار عمل (working directory) مختلف عن المكان الذي تم تثبيت الموديولات فيه.

## الحلول

### الحل 1: استخدام السكريبت التلقائي (موصى به)
```bash
cd /home/deploy/FixZone/backend
./scripts/fix-pm2-complete.sh
```

هذا السكريبت يقوم بـ:
1. التحقق من تثبيت exceljs
2. حذف العملية من PM2 بالكامل
3. مسح cache PM2
4. إعادة إنشاء العملية مع المسار الصحيح

### الحل 2: الحل اليدوي الكامل

#### الخطوة 1: التحقق من التثبيت
```bash
cd /home/deploy/FixZone/backend
ls -la node_modules/exceljs
```

يجب أن ترى المجلد موجود. إذا لم يكن موجوداً:
```bash
npm install exceljs@^4.4.0 --save --production
```

#### الخطوة 2: حذف العملية من PM2
```bash
pm2 stop fixzone-api
pm2 delete fixzone-api
pm2 kill  # هذا مهم لمسح الـ cache
sleep 2
```

#### الخطوة 3: إعادة إنشاء العملية مع المسار الصحيح
```bash
cd /home/deploy/FixZone
pm2 start backend/server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
    --merge-logs \
    --max-memory-restart 1G
```

**⚠️ مهم:** لاحظ استخدام `--cwd` لتحديد مسار العمل الصحيح.

#### الخطوة 4: حفظ الإعدادات
```bash
pm2 save
```

#### الخطوة 5: التحقق
```bash
pm2 status
pm2 logs fixzone-api --err --lines 10
```

### الحل 3: استخدام ecosystem.config.js

إذا كان لديك ملف `ecosystem.config.js`:

```bash
# تأكد من أن cwd محدد بشكل صحيح في الملف
cd /home/deploy/FixZone
pm2 delete fixzone-api
pm2 start ecosystem.config.js
pm2 save
```

تأكد من أن `ecosystem.config.js` يحتوي على:
```javascript
{
  name: 'fixzone-api',
  script: './backend/server.js',
  cwd: '/home/deploy/FixZone/backend',  // ⚠️ مهم جداً
  // ...
}
```

## التحقق من نجاح الإصلاح

### 1. التحقق من عدم وجود أخطاء
```bash
pm2 logs fixzone-api --err --lines 20
```
يجب ألا ترى أي أخطاء متعلقة بـ `exceljs`.

### 2. التحقق من المسار
```bash
pm2 describe fixzone-api | grep "cwd"
```
يجب أن يظهر: `/home/deploy/FixZone/backend`

### 3. التحقق من استهلاك CPU
```bash
pm2 monit
```
يجب أن يكون استهلاك CPU أقل من 10% في حالة السكون.

### 4. اختبار مباشر
```bash
cd /home/deploy/FixZone/backend
node -e "require('exceljs'); console.log('✅ exceljs loaded successfully')"
```

## مشاكل شائعة وحلولها

### المشكلة: "exceljs موجود لكن PM2 لا يراه"
**الحل:**
```bash
# تأكد من أن PM2 يعمل من المسار الصحيح
pm2 describe fixzone-api
# تحقق من cwd

# إذا كان cwd خاطئ، أعد إنشاء العملية:
pm2 delete fixzone-api
cd /home/deploy/FixZone
pm2 start backend/server.js --name fixzone-api --cwd /home/deploy/FixZone/backend
```

### المشكلة: "PM2 يعيد التشغيل باستمرار"
**الحل:**
```bash
# أوقف العملية أولاً
pm2 stop fixzone-api

# ثم أصلح المشكلة
cd /home/deploy/FixZone/backend
npm install --production

# ثم أعد التشغيل
pm2 delete fixzone-api
pm2 kill
cd /home/deploy/FixZone
pm2 start backend/server.js --name fixzone-api --cwd /home/deploy/FixZone/backend
```

### المشكلة: "node_modules موجود لكن الموديول مفقود"
**الحل:**
```bash
cd /home/deploy/FixZone/backend
rm -rf node_modules/exceljs
npm install exceljs@^4.4.0 --save --force
```

## نصائح لمنع المشكلة مستقبلاً

1. **استخدم `--cwd` دائماً عند إنشاء عملية PM2:**
   ```bash
   pm2 start script.js --name app-name --cwd /path/to/app
   ```

2. **تأكد من تثبيت الموديولات قبل تشغيل PM2:**
   ```bash
   cd /path/to/app
   npm install --production
   ```

3. **استخدم `pm2 kill` قبل إعادة إنشاء العملية:**
   ```bash
   pm2 delete app-name
   pm2 kill
   # ثم أعد الإنشاء
   ```

4. **احفظ الإعدادات دائماً:**
   ```bash
   pm2 save
   ```

## ملاحظات مهمة

- `pm2 restart` قد لا يحل مشاكل الـ cache - استخدم `pm2 delete` ثم `pm2 start`
- `pm2 kill` يمسح جميع عمليات PM2 والـ cache - استخدمه بحذر
- المسار `cwd` مهم جداً - تأكد من أنه يشير إلى مجلد `backend` وليس الجذر
- بعد أي تغيير في `node_modules`، أعد إنشاء عملية PM2 بالكامل

## تاريخ الإصلاح
- التاريخ: 2025-01-XX
- المشكلة: PM2 cache issue - Cannot find module 'exceljs'
- الحل: حذف العملية وإعادة إنشائها مع `--cwd` صحيح

