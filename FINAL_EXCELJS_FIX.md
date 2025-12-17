# الحل النهائي لمشكلة exceljs مع PM2

## المشكلة
PM2 لا يجد `exceljs` رغم أنه موجود في `node_modules`. المشكلة أن PM2 لا يمرر `NODE_PATH` بشكل صحيح عند استخدامه من سطر الأوامر.

## الحل: استخدام ecosystem.config.js

### الطريقة السريعة (استخدام السكريبت):

```bash
cd /home/deploy/FixZone/backend
chmod +x scripts/fix-exceljs-final.sh
./scripts/fix-exceljs-final.sh
```

### الطريقة اليدوية:

```bash
cd /home/deploy/FixZone/backend

# 1. التحقق من exceljs
node -e "require('exceljs'); console.log('✅ works')"

# 2. إيقاف PM2
pm2 stop fixzone-api
pm2 delete fixzone-api

# 3. تشغيل باستخدام ecosystem.config.js
pm2 start ecosystem.config.js --update-env
pm2 save

# 4. التحقق
sleep 5
pm2 logs fixzone-api --err --lines 20
```

## ملف ecosystem.config.js

تم إنشاء `/home/deploy/FixZone/backend/ecosystem.config.js` مع:
- `NODE_PATH` في `env` 
- المسار الصحيح لـ `node_modules`
- جميع الإعدادات المطلوبة

## التحقق من نجاح الإصلاح

```bash
# يجب ألا ترى أي أخطاء exceljs
pm2 logs fixzone-api --err --lines 10

# يجب أن يكون status = online
pm2 status

# يجب أن يكون CPU < 10%
pm2 monit
```

## إذا استمرت المشكلة

### 1. التحقق من NODE_PATH في PM2:
```bash
pm2 env 0 | grep NODE_PATH
```

يجب أن ترى: `NODE_PATH: '/home/deploy/FixZone/backend/node_modules'`

### 2. التحقق من ملف ecosystem.config.js:
```bash
cat /home/deploy/FixZone/backend/ecosystem.config.js
```

### 3. إعادة تشغيل PM2 daemon:
```bash
pm2 kill
pm2 start /home/deploy/FixZone/backend/ecosystem.config.js
pm2 save
```

## ملاحظات

- `ecosystem.config.js` يضمن أن `NODE_PATH` يتم تمريره بشكل صحيح
- استخدام `--update-env` مهم لتحديث متغيرات البيئة
- بعد هذا الحل، يجب أن يعمل كل شيء بشكل صحيح

