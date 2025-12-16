# حل مشكلة تعارض Git مع package-lock.json

## المشكلة:
```
error: Your local changes to the following files would be overwritten by merge:
	frontend/react-app/package-lock.json
```

## الحل الأفضل (موصى به):

### الحل 1: Reset package-lock.json ثم Pull (الأسرع)

```bash
cd /opt/lampp/htdocs/FixZone

# احفظ نسخة احتياطية (اختياري)
cp frontend/react-app/package-lock.json frontend/react-app/package-lock.json.backup

# Reset package-lock.json للنسخة من git
git checkout HEAD -- frontend/react-app/package-lock.json

# الآن Pull التحديثات
git pull origin main

# بعد Pull، أعد تثبيت dependencies
cd frontend/react-app
npm install
cd ../..
```

**لماذا هذا الحل؟**
- `package-lock.json` يتم إنشاؤه تلقائياً من `package.json`
- التغييرات في package-lock.json عادة ما تكون من `npm install`
- بعد pull، سنقوم بـ `npm install` مرة أخرى لإنشاء package-lock.json محدث

---

### الحل 2: Stash التغييرات ثم Pull

```bash
cd /opt/lampp/htdocs/FixZone

# Stash التغييرات
git stash push -m "Save local package-lock changes"

# Pull التحديثات
git pull origin main

# استرجع التغييرات (إذا كنت تريدها)
git stash pop

# أو تجاهلها وأعد تثبيت dependencies
cd frontend/react-app
npm install
cd ../..
```

---

### الحل 3: Commit التغييرات المحلية أولاً

```bash
cd /opt/lampp/htdocs/FixZone

# أضف package-lock.json
git add frontend/react-app/package-lock.json

# Commit
git commit -m "Update package-lock.json with exceljs and overrides"

# الآن Pull (ستحتاج merge)
git pull origin main

# إذا كان هناك conflicts، احلها ثم:
git add .
git commit -m "Merge remote changes"
```

---

## الحل الموصى به للـ Production:

**استخدم الحل 1** لأنه:
- ✅ أسرع
- ✅ لا يحتاج commit
- ✅ package-lock.json سيتم إعادة إنشاؤه بعد npm install
- ✅ آمن تماماً

---

## خطوات سريعة:

```bash
cd /opt/lampp/htdocs/FixZone
git checkout HEAD -- frontend/react-app/package-lock.json
git pull origin main
cd frontend/react-app && npm install && cd ../..
```

---

**ملاحظة:** إذا كان لديك تغييرات مهمة في package.json (مثل exceljs و overrides)، تأكد من أنها موجودة في package.json قبل pull. package-lock.json سيتم تحديثه تلقائياً بعد npm install.

