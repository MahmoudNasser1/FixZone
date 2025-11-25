# 🔧 إصلاح مشكلة CORS - Production

## ✅ **ما تم إصلاحه:**

### 1. **تحديث CORS Configuration في Backend:**
- ✅ تم تحديث `backend/server.js` لدعم `https://system.fixzzone.com`
- ✅ تم تحديث `backend/app.js` لدعم `https://system.fixzzone.com`
- ✅ إضافة دعم للـ production domains

### 2. **CORS Configuration الجديدة:**

الـ backend الآن يدعم:
- `https://system.fixzzone.com` (Production)
- `https://fixzzone.com` (Production)
- `https://www.fixzzone.com` (Production)
- `http://localhost:3000` (Development)
- `http://localhost:4000` (Development)

---

## 🚀 **الخطوات المطلوبة:**

### 1. **إعداد Environment Variables للـ Backend:**

أنشئ أو حدث ملف `.env` في مجلد `backend/`:

```bash
cd /opt/lampp/htdocs/FixZone/backend
nano .env
```

أضف السطر التالي:

```env
CORS_ORIGIN=https://system.fixzzone.com,https://fixzzone.com,https://www.fixzzone.com
NODE_ENV=production
PORT=4000
JWT_SECRET=your_jwt_secret_key_here
```

### 2. **إعداد Environment Variables للـ Frontend:**

أنشئ ملف `.env.production` في مجلد `frontend/react-app/`:

```bash
cd /opt/lampp/htdocs/FixZone/frontend/react-app
nano .env.production
```

أضف السطور التالية:

```env
REACT_APP_API_URL=https://api.fixzzone.com/api
REACT_APP_WS_URL=wss://api.fixzzone.com/ws
```

**ملاحظة:** استبدل `api.fixzzone.com` بـ الـ domain الفعلي للـ backend API.

### 3. **إعادة بناء Frontend:**

```bash
cd /opt/lampp/htdocs/FixZone/frontend/react-app
npm run build
```

### 4. **إعادة تشغيل Backend:**

```bash
cd /opt/lampp/htdocs/FixZone/backend
# إذا كنت تستخدم PM2:
pm2 restart fixzone-backend

# أو إذا كنت تستخدم systemd:
sudo systemctl restart fixzone-backend

# أو يدوياً:
node server.js
```

---

## 🔍 **التحقق من الإصلاح:**

### 1. **تحقق من CORS Headers:**

افتح Developer Tools (F12) → Network tab → حاول تسجيل الدخول → شوف الـ Response Headers:

يجب أن ترى:
```
Access-Control-Allow-Origin: https://system.fixzzone.com
Access-Control-Allow-Credentials: true
```

### 2. **تحقق من Console:**

يجب أن تختفي الأخطاء:
- ❌ `Access to XMLHttpRequest... blocked by CORS policy` → ✅ يجب أن يختفي
- ❌ `No 'Access-Control-Allow-Origin' header` → ✅ يجب أن يختفي

---

## 📋 **ملاحظات مهمة:**

### 1. **API URL في Production:**

الـ frontend محتاج يتحدث لاستخدام الـ production API URL بدل `localhost:4000`.

**الحل:**
- أنشئ `.env.production` مع `REACT_APP_API_URL` الصحيح
- أعد بناء الـ frontend: `npm run build`

### 2. **إذا كان Backend على نفس الـ Server:**

إذا كان الـ backend يعمل على نفس الـ server، يمكنك استخدام:
```env
REACT_APP_API_URL=https://system.fixzzone.com/api
```

### 3. **إذا كان Backend على Server منفصل:**

إذا كان الـ backend على server منفصل (مثل `api.fixzzone.com`):
```env
REACT_APP_API_URL=https://api.fixzzone.com/api
```

---

## 🛠️ **استكشاف الأخطاء:**

### إذا استمرت مشكلة CORS:

#### 1. تحقق من Backend Logs:
```bash
# إذا كنت تستخدم PM2:
pm2 logs fixzone-backend

# أو إذا كنت تستخدم systemd:
sudo journalctl -u fixzone-backend -f
```

#### 2. تحقق من Environment Variables:
```bash
cd /opt/lampp/htdocs/FixZone/backend
cat .env | grep CORS_ORIGIN
```

#### 3. اختبر CORS يدوياً:
```bash
curl -H "Origin: https://system.fixzzone.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.fixzzone.com/api/auth/login \
     -v
```

يجب أن ترى في الـ response:
```
Access-Control-Allow-Origin: https://system.fixzzone.com
Access-Control-Allow-Credentials: true
```

---

## ✅ **الملفات المحدثة:**

1. ✅ `/backend/server.js` - CORS configuration محدثة
2. ✅ `/backend/app.js` - CORS configuration محدثة

---

**تاريخ الإصلاح:** $(date +%Y-%m-%d)
**الحالة:** ✅ تم تحديث CORS configuration


