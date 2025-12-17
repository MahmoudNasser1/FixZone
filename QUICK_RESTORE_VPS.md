# رجوع سريع للنقطة المستقرة على VPS

## الطريقة السريعة (3 خطوات)

### 1. على الجهاز المحلي - إنشاء branch من النقطة المستقرة
```bash
cd /opt/lampp/htdocs/FixZone

# استخدام السكريبت (موصى به)
./scripts/restore-stable-commit.sh

# أو يدوياً
git checkout -b restore-stable-4a96aa5 4a96aa5
git push origin restore-stable-4a96aa5
```

### 2. على VPS - Pull التغييرات
```bash
cd /home/deploy/FixZone

# إيقاف السيرفر
pm2 stop fixzone-api

# Pull branch الجديد
git fetch origin
git checkout restore-stable-4a96aa5

# أو إذا أردت merge مع main
git checkout main
git merge restore-stable-4a96aa5
```

### 3. إعادة تشغيل السيرفر
```bash
cd /home/deploy/FixZone/backend

# تثبيت الموديولات (إذا تغيرت)
npm install --production

# إعادة تشغيل
pm2 restart fixzone-api

# التحقق
pm2 logs fixzone-api --err --lines 10
```

## الطريقة المباشرة على VPS (أسرع)

```bash
cd /home/deploy/FixZone

# إيقاف السيرفر
pm2 stop fixzone-api

# حفظ التغييرات الحالية
git stash

# الرجوع مباشرة للنقطة المستقرة
git reset --hard 4a96aa5

# تثبيت الموديولات
cd backend
npm install --production

# إعادة تشغيل
pm2 restart fixzone-api

# التحقق
pm2 logs fixzone-api --err --lines 10
```

## التحقق من النجاح

```bash
# على VPS
cd /home/deploy/FixZone
git log --oneline -3
# يجب أن ترى: 4a96aa5 بعد تعديلات الامان

# التحقق من السيرفر
pm2 status
pm2 logs fixzone-api --err --lines 10
```

---
**ملاحظة**: راجع `RESTORE_STABLE_COMMIT.md` للتفاصيل الكاملة

