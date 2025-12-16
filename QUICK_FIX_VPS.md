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

## إذا لم يعمل
```bash
cd /home/deploy/FixZone/backend
rm -rf node_modules
npm install --production
pm2 restart fixzone-api
```

---
**ملاحظة:** راجع `VPS_CPU_FIX.md` للتفاصيل الكاملة

