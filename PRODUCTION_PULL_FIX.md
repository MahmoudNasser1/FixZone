# حل مشكلة Git Pull على Production Server

## المشكلة على Production:
```
error: Your local changes to the following files would be overwritten by merge:
	frontend/react-app/package-lock.json
```

## ⚠️ تحذير مهم للـ Production:

على Production، يجب أن نكون حذرين جداً. الحلول الآمنة:

---

## الحل الآمن للـ Production (موصى به):

### الخطوة 1: Backup أولاً
```bash
cd /opt/lampp/htdocs/FixZone

# Backup package.json و package-lock.json
cp frontend/react-app/package.json frontend/react-app/package.json.backup
cp frontend/react-app/package-lock.json frontend/react-app/package-lock.json.backup

# Backup للتأكد
tar -czf backup_before_pull_$(date +%Y%m%d_%H%M%S).tar.gz frontend/react-app/package*.json
```

### الخطوة 2: حفظ التغييرات المهمة
```bash
# تأكد من أن exceljs و overrides موجودة في package.json
grep -A 2 "exceljs" frontend/react-app/package.json
grep -A 5 "overrides" frontend/react-app/package.json
```

### الخطوة 3: حذف package-lock.json (آمن - سيتم إعادة إنشاؤه)
```bash
rm frontend/react-app/package-lock.json
```

### الخطوة 4: Pull التحديثات
```bash
git pull origin main
```

### الخطوة 5: أعد تثبيت dependencies
```bash
cd frontend/react-app
npm install
cd ../..
```

### الخطوة 6: تحقق من أن كل شيء يعمل
```bash
# تحقق من package.json
grep -A 2 "exceljs" frontend/react-app/package.json

# إذا لم تكن موجودة، أضفها (انظر أدناه)
```

---

## إذا لم تكن التغييرات موجودة بعد Pull:

### أضف exceljs في package.json:

في `frontend/react-app/package.json`، في `dependencies`:
```json
"exceljs": "^4.4.0",
```

### أضف overrides في package.json:

في نهاية `frontend/react-app/package.json` (قبل السطر الأخير `}`):
```json
  "overrides": {
    "nth-check": "^2.1.1",
    "webpack-dev-server": "^4.15.1",
    "react-scripts": {
      "postcss": "^8.4.31"
    }
  }
```

### حدّث postcss في devDependencies:
```json
"postcss": "^8.4.31",
```

### ثم:
```bash
cd frontend/react-app
npm install
cd ../..
```

---

## حل بديل (إذا كان لديك git access محدود):

### استخدام merge strategy:
```bash
cd /opt/lampp/htdocs/FixZone

# Pull مع تجاهل التغييرات المحلية في package-lock.json
git pull -X theirs origin main

# ثم npm install
cd frontend/react-app
npm install
cd ../..
```

---

## ⚡ Script جاهز للاستخدام:

```bash
#!/bin/bash
# Production Pull Script

cd /opt/lampp/htdocs/FixZone

echo "🔧 Starting Production Pull..."

# Backup
echo "1. Creating backup..."
cp frontend/react-app/package.json frontend/react-app/package.json.backup
cp frontend/react-app/package-lock.json frontend/react-app/package-lock.json.backup 2>/dev/null || true

# Remove package-lock.json
echo "2. Removing package-lock.json..."
rm -f frontend/react-app/package-lock.json

# Pull
echo "3. Pulling updates..."
git pull origin main

# Install dependencies
echo "4. Installing dependencies..."
cd frontend/react-app
npm install
cd ../..

# Verify exceljs exists
if ! grep -q "exceljs" frontend/react-app/package.json; then
    echo "⚠️  WARNING: exceljs not found in package.json!"
    echo "You may need to add it manually."
fi

echo "✅ Done!"
```

---

## بعد Pull على Production:

### 1. أعد بناء Frontend:
```bash
cd /opt/lampp/htdocs/FixZone/frontend/react-app
npm run build:prod:vps
```

### 2. أعد تشغيل Backend (إذا لزم الأمر):
```bash
cd /opt/lampp/htdocs/FixZone/backend
npm install  # إذا كان هناك تغييرات في package.json
pm2 restart fixzone-backend
# أو
systemctl restart fixzone-backend
```

### 3. تحقق من Logs:
```bash
# Backend logs
tail -f /opt/lampp/htdocs/FixZone/backend/logs/backend.log

# أو PM2 logs
pm2 logs fixzone-backend
```

---

## في حالة الطوارئ (Rollback):

إذا حدثت مشكلة:
```bash
cd /opt/lampp/htdocs/FixZone

# استرجع النسخة الاحتياطية
cp frontend/react-app/package.json.backup frontend/react-app/package.json
cp frontend/react-app/package-lock.json.backup frontend/react-app/package-lock.json

# أو استرجع commit سابق
git log --oneline -10  # للبحث عن commit سابق
git reset --hard <commit-hash>
```

---

## ملاحظات مهمة للـ Production:

1. ✅ **دائماً عمل backup قبل pull**
2. ✅ **package-lock.json آمن للحذف** - سيتم إنشاؤه من package.json
3. ✅ **package.json هو المهم** - تأكد من التغييرات موجودة
4. ✅ **اختبر بعد pull** - تحقق من أن التطبيق يعمل
5. ✅ **راقب logs** - للتأكد من عدم وجود أخطاء

---

**تاريخ:** $(date)  
**للاستخدام على:** Production Server

