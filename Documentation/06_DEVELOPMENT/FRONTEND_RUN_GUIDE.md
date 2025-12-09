# 🚀 Frontend Run Guide - FixZone ERP

## كيفية تشغيل الواجهة الأمامية (Frontend)

### 📍 الموقع
الواجهة الأمامية موجودة في: `frontend/react-app/`

---

## 🎯 الطريقة الأساسية (Development)

### 1. الانتقال إلى مجلد الواجهة الأمامية:
```bash
cd /opt/lampp/htdocs/FixZone/frontend/react-app
```

### 2. تثبيت المكتبات (إذا لم تكن مثبتة):
```bash
npm install
```

### 3. تشغيل الواجهة الأمامية:
```bash
npm start
```

**النتيجة:**
- ✅ الواجهة الأمامية ستعمل على: **http://localhost:3000**
- ✅ سيفتح المتصفح تلقائياً
- ✅ التغييرات في الكود ستحدث تلقائياً (Hot Reload)

---

## 🔧 الطرق البديلة

### الطريقة 1: تحديد المنفذ يدوياً
```bash
cd frontend/react-app
PORT=3000 npm start
```

### الطريقة 2: استخدام npm script مباشرة
```bash
cd frontend/react-app
npm run start
```

### الطريقة 3: من المجلد الرئيسي
```bash
cd /opt/lampp/htdocs/FixZone
cd frontend/react-app && npm start
```

---

## 🏗️ بناء الإنتاج (Production Build)

### 1. بناء المشروع:
```bash
cd frontend/react-app
npm run build
```

**النتيجة:** مجلد `build/` يحتوي على الملفات الجاهزة للنشر

### 2. تشغيل البناء محلياً (للاختبار):
```bash
# تثبيت serve (إذا لم يكن مثبت)
npm install -g serve

# تشغيل البناء
serve -s build -l 3000
```

---

## 📋 المتطلبات

### 1. Node.js و npm
```bash
# التحقق من التثبيت
node --version  # يجب أن يكون v14 أو أحدث
npm --version   # يجب أن يكون v6 أو أحدث
```

### 2. المكتبات المطلوبة
جميع المكتبات موجودة في `package.json` وسيتم تثبيتها تلقائياً عند تشغيل `npm install`

---

## ⚙️ الإعدادات (Configuration)

### ملف package.json
```json
{
  "scripts": {
    "start": "react-scripts start",    // تشغيل التطوير
    "build": "react-scripts build",     // بناء الإنتاج
    "test": "react-scripts test"        // الاختبارات
  },
  "proxy": "http://localhost:4000"     // Backend URL
}
```

### ملفات البيئة (.env)
- `.env.development` - إعدادات التطوير
- `.env.production` - إعدادات الإنتاج
- `.env.local` - إعدادات محلية (لا يتم رفعها)

**مثال:**
```bash
# .env.development
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_WS_URL=ws://localhost:4000/ws
REACT_APP_ENV=development
```

---

## 🔗 الاتصال بالـ Backend

### الإعداد الحالي:
- **Backend Port:** 4000
- **Frontend Port:** 3000
- **Proxy:** تم إعداد proxy في `package.json` للاتصال بالـ backend

### التحقق من الاتصال:
```bash
# في terminal منفصل، تأكد أن الـ Backend يعمل:
curl http://localhost:4000/health

# يجب أن ترى:
# {"status":"OK","message":"Server is running"}
```

---

## 🐛 حل المشاكل الشائعة

### 1. Port 3000 مستخدم بالفعل:
```bash
# إيجاد العملية التي تستخدم المنفذ
sudo lsof -i :3000
# أو
sudo netstat -tulpn | grep 3000

# إيقاف العملية
kill -9 <PID>

# أو استخدم منفذ آخر
PORT=3001 npm start
```

### 2. خطأ في تثبيت المكتبات:
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

### 3. خطأ في الاتصال بالـ Backend:
```bash
# تأكد أن الـ Backend يعمل على المنفذ 4000
curl http://localhost:4000/health

# تحقق من ملف package.json أن proxy صحيح:
# "proxy": "http://localhost:4000"
```

### 4. خطأ في البناء:
```bash
# تنظيف الكاش
npm cache clean --force
rm -rf node_modules build
npm install
npm run build
```

---

## 📝 سكريبتات مفيدة

### تشغيل Backend + Frontend معاً (Linux/Mac):
```bash
#!/bin/bash
# start-all.sh

# Terminal 1: Backend
cd backend && node server.js &

# Terminal 2: Frontend  
cd frontend/react-app && npm start
```

### تشغيل Backend + Frontend معاً (Windows):
استخدم ملف `start_servers.bat` الموجود في المجلد الرئيسي:
```cmd
start_servers.bat
```

---

## 🎯 الخلاصة السريعة

```bash
# 1. الانتقال للمجلد
cd frontend/react-app

# 2. تثبيت المكتبات (مرة واحدة فقط)
npm install

# 3. التشغيل
npm start

# ✅ الواجهة ستكون على: http://localhost:3000
```

---

## 📚 ملفات مهمة

- `frontend/react-app/package.json` - إعدادات المشروع والسكريبتات
- `frontend/react-app/src/` - كود المصدر
- `frontend/react-app/public/` - الملفات الثابتة
- `frontend/react-app/build/` - ملفات البناء (بعد `npm run build`)

---

**💡 نصيحة:** تأكد دائماً أن الـ Backend يعمل قبل تشغيل الـ Frontend!


