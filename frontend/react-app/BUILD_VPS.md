# دليل البيلد على VPS

## المشكلة
البيلد يتوقف على VPS بسبب محدودية الذاكرة (Memory).

## الحلول المتاحة

### الحل الأول (الأفضل) - Build مع زيادة الذاكرة
```bash
npm run build:vps
```
هذا الأمر:
- يزيد حد الذاكرة لـ Node.js إلى 4GB
- يعمل linting قبل البيلد
- مناسب للـ VPS مع ذاكرة كافية (2GB+)

### الحل الثاني - Build سريع بدون source maps
```bash
npm run build:fast
```
هذا الأمر:
- يزيد حد الذاكرة إلى 4GB
- **لا يعمل linting** (تخطي prebuild hook)
- **لا ينشئ source maps** (أسرع وأقل استهلاكاً للذاكرة)
- مناسب للـ VPS مع ذاكرة محدودة

### الحل الثالث (الأفضل للـ VPS) - Build للإنتاج بدون linting وبدون source maps
```bash
npm run build:prod:vps
```
هذا الأمر:
- يزيد حد الذاكرة إلى 4GB
- **لا يعمل linting** (تخطي prebuild hook)
- **لا ينشئ source maps**
- الأسرع والأقل استهلاكاً للذاكرة
- **موصى به للـ VPS**

## إذا استمرت المشكلة

### 1. تحقق من الذاكرة المتاحة
```bash
free -h
```

### 2. قم بتشغيل البيلد بدون linting
استخدم `build:prod:vps` الذي يتخطى linting

### 3. قم بتحديث browserslist (حل التحذير)
```bash
npx update-browserslist-db@latest
```

### 4. نظف cache قبل البيلد
```bash
npm run clean
npm run build:prod:vps
```

### 5. إذا كان VPS لديه ذاكرة أقل من 2GB
يمكن تقليل حد الذاكرة في package.json من `4096` إلى `2048`:
```json
"build:vps": "NODE_OPTIONS='--max-old-space-size=2048' ..."
```

### 6. التحقق من استخدام الذاكرة أثناء البيلد
شغّل هذا الأمر في terminal آخر لمراقبة الذاكرة:
```bash
watch -n 1 free -h
```

### 7. استخدام Swap Memory (إذا كانت متاحة)
إذا كان الـ VPS لديه swap memory، تأكد أنها مفعلة:
```bash
swapon --show
```

### 8. حل بديل: استخدام CI/CD أو Build على جهاز آخر
إذا استمرت المشكلة، يمكن عمل البيلد محلياً ونقل مجلد `build` إلى السيرفر:
```bash
# على اللوكل
npm run build
# ثم انقل مجلد build إلى VPS
scp -r build/ user@vps:/path/to/frontend/react-app/
```

## خطوات التشخيص

### 1. تحقق من حجم المشروع
```bash
du -sh node_modules/
du -sh src/
```

### 2. تحقق من logs البيلد
إذا كان البيلد يتوقف، ابحث عن أخطاء في Terminal أو جرب:
```bash
npm run build:prod:vps 2>&1 | tee build.log
```

### 3. تحقق من Node.js version
```bash
node -v
npm -v
```
تأكد من استخدام Node.js 16+ للأفضل

## ملاحظات
- `build:vps` يعمل linting قبل البيلد
- `build:fast` و `build:prod:vps` **لا يعملان linting** (أسرع)
- جميع الـ scripts الجديدة تزيد حد الذاكرة إلى 4GB
- بناءً على داشبورد VPS (30% memory usage)، الموارد متاحة لكن Node.js يحتاج زيادة صريحة للذاكرة

