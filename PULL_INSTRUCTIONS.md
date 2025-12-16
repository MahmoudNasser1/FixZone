# تعليمات Pull التحديثات من GitHub

## المشكلة:
Git يرفض Pull بسبب تغييرات محلية في `package-lock.json`

## الحل السريع:

### الخطوة 1: Stash التغييرات
```bash
cd /opt/lampp/htdocs/FixZone
git stash push -m "Stash package-lock before pull" frontend/react-app/package-lock.json
```

### الخطوة 2: Pull التحديثات
```bash
git pull origin main
```

إذا طُلب منك username/password:
- Username: MahmoudNasser1
- Password: (Personal Access Token من GitHub)

### الخطوة 3: بعد Pull، أعد تثبيت dependencies
```bash
cd frontend/react-app
npm install
cd ../..
```

هذا سيعيد إنشاء `package-lock.json` محدث بناءً على `package.json` الجديد.

---

## إذا استمرت المشكلة:

### الحل البديل (Force Reset):
```bash
cd /opt/lampp/htdocs/FixZone

# حذف package-lock.json مؤقتاً
rm frontend/react-app/package-lock.json

# Pull
git pull origin main

# إعادة تثبيت dependencies (سيُنشئ package-lock.json جديد)
cd frontend/react-app
npm install
cd ../..
```

---

## ملاحظات مهمة:

1. **package-lock.json يتم إنشاؤه تلقائياً** - لا تقلق بشأن فقدانه
2. بعد pull و npm install، سيكون package-lock.json محدث
3. تأكد من أن التغييرات المهمة موجودة في `package.json`:
   - `exceljs` في dependencies
   - `overrides` section
   - `postcss` محدث

---

## بعد Pull الناجح:

تحقق من أن التغييرات موجودة في package.json:
```bash
cd frontend/react-app
grep -A 2 "exceljs" package.json
grep -A 5 "overrides" package.json
```

إذا لم تكن موجودة، أضفها مرة أخرى بناءً على `COMPREHENSIVE_CHANGES_REPORT.md`.

