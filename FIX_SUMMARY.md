# ملخص إصلاح مشكلة استهلاك CPU العالي

## المشكلة الأصلية
- النظام يستهلك 98% من إمكانيات VPS
- السيرفر يعيد التشغيل باستمرار
- الخطأ: `Cannot find module 'exceljs'`

## السبب الجذري
1. الموديول `exceljs` غير مثبت في بيئة الإنتاج
2. PM2 يستخدم cache قديم أو مسار عمل خاطئ
3. إعادة التشغيل المستمرة تسبب استهلاك CPU عالي

## الحلول المقدمة

### ✅ الملفات التي تم إنشاؤها:

1. **`backend/scripts/fix-missing-dependencies.sh`**
   - يتحقق من الموديولات المفقودة
   - يثبتها تلقائياً

2. **`backend/scripts/fix-pm2-complete.sh`** ⭐ (موصى به)
   - يحل مشكلة PM2 cache
   - يحذف العملية ويعيد إنشائها بشكل صحيح
   - يحدد مسار العمل الصحيح

3. **`VPS_CPU_FIX.md`**
   - دليل شامل للإصلاح
   - خطوات مفصلة
   - طرق التحقق

4. **`QUICK_FIX_VPS.md`**
   - دليل سريع (3 خطوات)
   - حلول للمشاكل الشائعة

5. **`PM2_CACHE_ISSUE_FIX.md`**
   - شرح مفصل لمشكلة PM2 cache
   - حلول متعددة
   - نصائح للوقاية

## الخطوات المطلوبة على VPS

### الطريقة السريعة (موصى به):
```bash
cd /home/deploy/FixZone/backend
chmod +x scripts/fix-pm2-complete.sh
./scripts/fix-pm2-complete.sh
```

### الطريقة اليدوية:
```bash
# 1. إيقاف وحذف العملية
pm2 stop fixzone-api
pm2 delete fixzone-api
pm2 kill
sleep 2

# 2. تثبيت الموديولات
cd /home/deploy/FixZone/backend
npm install --production

# 3. التحقق من exceljs
ls -la node_modules/exceljs

# 4. إعادة إنشاء العملية
cd /home/deploy/FixZone
pm2 start backend/server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production

# 5. حفظ الإعدادات
pm2 save

# 6. التحقق
pm2 logs fixzone-api --err --lines 20
pm2 monit
```

## التحقق من نجاح الإصلاح

### ✅ علامات النجاح:
1. لا توجد أخطاء في اللوجات: `pm2 logs fixzone-api --err`
2. استهلاك CPU أقل من 10%: `pm2 monit`
3. حالة السيرفر `online`: `pm2 status`
4. لا توجد رسائل `Cannot find module 'exceljs'`

### ❌ إذا استمرت المشكلة:
1. راجع `PM2_CACHE_ISSUE_FIX.md` للحلول المتقدمة
2. تأكد من أن `--cwd` يشير إلى `/home/deploy/FixZone/backend`
3. جرب إعادة تثبيت كامل:
   ```bash
   cd /home/deploy/FixZone/backend
   rm -rf node_modules package-lock.json
   npm install --production
   ```

## منع المشكلة مستقبلاً

### بعد كل pull من Git:
```bash
cd /home/deploy/FixZone/backend
npm install --production
pm2 restart fixzone-api
```

### أو أضف هذا إلى سكريبت الـ deployment:
```bash
cd /home/deploy/FixZone/backend && npm install --production
```

## الملفات المرجعية

- **للحل السريع:** `QUICK_FIX_VPS.md`
- **للحل الشامل:** `VPS_CPU_FIX.md`
- **لمشكلة PM2 cache:** `PM2_CACHE_ISSUE_FIX.md`
- **السكريبتات:** `backend/scripts/fix-*.sh`

## ملاحظات مهمة

1. ⚠️ **استخدم `pm2 delete` بدلاً من `pm2 restart`** عند تغيير `node_modules`
2. ⚠️ **تأكد من `--cwd`** عند إنشاء عملية PM2
3. ⚠️ **استخدم `pm2 kill`** لمسح الـ cache قبل إعادة الإنشاء
4. ✅ **احفظ الإعدادات دائماً:** `pm2 save`

## تاريخ الإصلاح
- التاريخ: 2025-01-XX
- المشكلة: استهلاك CPU 98% + Cannot find module 'exceljs'
- الحل: تثبيت الموديولات + إعادة تهيئة PM2 مع مسار صحيح

