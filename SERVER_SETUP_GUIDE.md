# دليل تشغيل سيرفرات FixZone ERP

## 🚀 طريقة التشغيل الصحيحة:

### الطريقة السريعة:
```bash
# شغل الملف التالي:
start_servers.bat
```

### الطريقة اليدوية:

#### 1. تشغيل Backend Server:
```bash
cd backend
node server.js
```
**يجب أن تشاهد:** `🚀 Fix Zone Backend Server is running on port 3001`

#### 2. تشغيل Frontend Server:
```bash
cd frontend/react-app  
npm start
```
**يجب أن تشاهد:** `webpack compiled successfully`

## 🌐 الروابط الصحيحة:

- **التطبيق الرئيسي:** http://localhost:3000
- **صفحة الفواتير:** http://localhost:3000/invoices
- **لوحة التحكم:** http://localhost:3000/dashboard
- **Backend API:** http://localhost:3001/api (للمطورين فقط)

## ⚠️ تنبيهات مهمة:

1. **لا تفتح** http://localhost:3001 في المتصفح مباشرة
2. **استخدم دائماً** http://localhost:3000 للوصول للتطبيق
3. Backend (3001) للـ APIs فقط، Frontend (3000) للواجهة

## 🔧 في حالة المشاكل:

### إذا ظهر خطأ "Cannot GET /invoices":
- تأكد من تشغيل Frontend server على البورت 3000
- افتح http://localhost:3000/invoices (وليس 3001)

### إذا ظهر خطأ "Network Error":
- تأكد من تشغيل Backend server على البورت 3001
- تحقق من إعدادات قاعدة البيانات MySQL

### إذا ظهر خطأ JSON:
- أعد تشغيل Backend server
- تأكد من عدم وجود أخطاء في console

## 📊 فحص حالة السيرفرات:

```bash
# فحص Backend
curl http://localhost:3001/health

# فحص Frontend  
curl http://localhost:3000
```
