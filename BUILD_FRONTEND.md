# بناء Frontend على Production

## المشكلة:
أنت في المجلد الخطأ! يجب أن تكون في `frontend/react-app`

## الحل:

```bash
cd /opt/lampp/htdocs/FixZone/frontend/react-app
npm run build:prod:vps
```

---

## الخطوات الكاملة:

```bash
# 1. انتقل إلى مجلد frontend
cd /opt/lampp/htdocs/FixZone/frontend/react-app

# 2. تحقق من أنك في المكان الصحيح
pwd
# يجب أن يظهر: /opt/lampp/htdocs/FixZone/frontend/react-app

# 3. تحقق من وجود package.json
ls package.json

# 4. بناء Frontend
npm run build:prod:vps
```

---

## إذا فشل Build:

### تنظيف Cache:
```bash
cd /opt/lampp/htdocs/FixZone/frontend/react-app
npm run clean
npm run build:prod:vps
```

### تحقق من الذاكرة:
```bash
free -h
```

إذا كانت الذاكرة محدودة، استخدم:
```bash
npm run build:fast
```

---

## بعد Build الناجح:

سيتم إنشاء مجلد `build/` يحتوي على:
- `build/static/js/` - ملفات JavaScript
- `build/static/css/` - ملفات CSS
- `build/index.html` - HTML الرئيسي

---

## نقل Build إلى مكان Static Files:

حسب إعداداتك:
```bash
# مثال (يختلف حسب إعدادات nginx/apache)
cp -r frontend/react-app/build/* /var/www/html/fixzone/
# أو
cp -r frontend/react-app/build/* /opt/lampp/htdocs/FixZone/public/
```

