# 🔧 إصلاح مشكلة API URL في Production

## ✅ **المشكلة:**

الـ frontend بيحاول يتصل بـ `https://api.fixzzone.com` لكن الـ domain ده مش موجود (`ERR_NAME_NOT_RESOLVED`).

---

## ✅ **الحل المطبق:**

### 1. **تحديث CORS_ORIGIN في Backend:**
✅ تم تحديث `/backend/.env`:
```
CORS_ORIGIN=https://system.fixzzone.com,https://fixzzone.com,https://www.fixzzone.com,http://localhost:3000,http://localhost:4000
```

### 2. **إنشاء .env.production للـ Frontend:**
✅ تم إنشاء `/frontend/react-app/.env.production`:
```env
REACT_APP_API_URL=https://system.fixzzone.com/api
REACT_APP_WS_URL=wss://system.fixzzone.com/ws
REACT_APP_ENV=production
```

---

## 🚀 **الخطوات المطلوبة:**

### 1. **إعادة بناء Frontend:**
```bash
cd /opt/lampp/htdocs/FixZone/frontend/react-app
npm run build
```

### 2. **إعادة تشغيل Backend:**
```bash
cd /opt/lampp/htdocs/FixZone/backend
# إذا كنت تستخدم PM2:
pm2 restart fixzone-backend

# أو يدوياً:
node server.js
```

### 3. **نسخ Build Files إلى Production:**
```bash
# إذا كان الـ build في مكان مختلف:
cp -r /opt/lampp/htdocs/FixZone/frontend/react-app/build/* /path/to/production/frontend/
```

---

## 🔍 **التحقق من الإصلاح:**

### 1. **تحقق من API URL:**
افتح Developer Tools (F12) → Network tab → شوف الطلبات:
- ✅ يجب أن تكون إلى `https://system.fixzzone.com/api` وليس `api.fixzzone.com`
- ✅ يجب أن لا توجد أخطاء `ERR_NAME_NOT_RESOLVED`

### 2. **تحقق من WebSocket:**
- ✅ يجب أن يتصل بـ `wss://system.fixzzone.com/ws`
- ✅ يجب أن لا توجد أخطاء WebSocket connection failed

---

## 📋 **ملاحظات مهمة:**

### 1. **إذا كان Backend على Domain منفصل:**

إذا كان الـ backend على domain منفصل (مثل `api.fixzzone.com`):
- تأكد من أن الـ domain موجود ومسجل في DNS
- حدث `.env.production`:
  ```env
  REACT_APP_API_URL=https://api.fixzzone.com/api
  REACT_APP_WS_URL=wss://api.fixzzone.com/ws
  ```

### 2. **إذا كان Backend على نفس الـ Server:**

إذا كان الـ backend على نفس الـ server (system.fixzzone.com):
- استخدم الـ configuration الحالي
- تأكد من أن الـ backend يستمع على الـ port الصحيح
- تأكد من أن Nginx يوجه `/api` requests إلى الـ backend

---

## 🛠️ **Nginx Configuration (إذا لزم الأمر):**

إذا كنت تستخدم Nginx كـ reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name system.fixzzone.com;

    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:4000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ✅ **الملفات المحدثة:**

1. ✅ `/backend/.env` - CORS_ORIGIN محدث
2. ✅ `/frontend/react-app/.env.production` - API URLs محدثة

---

**تاريخ الإصلاح:** $(date +%Y-%m-%d)
**الحالة:** ✅ تم إصلاح API URL configuration


