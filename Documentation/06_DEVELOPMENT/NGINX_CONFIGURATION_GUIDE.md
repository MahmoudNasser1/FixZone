# 🔧 دليل إعداد Nginx للـ Production

## ✅ **ما تم إصلاحه في server.js:**

1. ✅ إضافة route `/api` لإرجاع معلومات عن الـ API
2. ✅ إزالة تكرار `cookieParser()`
3. ✅ تحسين ترتيب الـ middleware
4. ✅ تحسين CORS configuration

---

## 🚨 **المشكلة الأساسية:**

الـ backend **شغال** (من PM2 logs) والـ routes **تعمل محلياً**:
- ✅ `curl http://127.0.0.1:4000/health` → يعمل
- ✅ `curl http://127.0.0.1:4000/api/auth/login` → يعمل
- ✅ `curl http://127.0.0.1:4000/api/dashboard/stats` → يعمل (يحتاج auth)

لكن من الـ frontend (`https://system.fixzzone.com`):
- ❌ جميع الـ API requests → **404 Not Found**

**السبب:** Nginx **مش موجه** الـ requests للـ backend بشكل صحيح.

---

## ✅ **الحل: إعداد Nginx Configuration**

### 1. **إنشاء أو تحديث Nginx Configuration:**

```bash
sudo nano /etc/nginx/sites-available/system.fixzzone.com
# أو
sudo nano /etc/nginx/conf.d/system.fixzzone.com.conf
```

### 2. **إضافة الـ Configuration التالي:**

```nginx
server {
    listen 80;
    server_name system.fixzzone.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name system.fixzzone.com;

    # SSL certificates
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend static files
    root /opt/lampp/htdocs/FixZone/frontend/react-app/build;
    index index.html;

    # Frontend routes - serve React app
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Backend API routes - proxy to Node.js backend
    location /api {
        proxy_pass http://127.0.0.1:4000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Auth-Token" always;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:4000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:4000/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/system.fixzzone.com.access.log;
    error_log /var/log/nginx/system.fixzzone.com.error.log;
}
```

### 3. **تفعيل الـ Site:**

```bash
# إنشاء symbolic link (إذا لم يكن موجود)
sudo ln -s /etc/nginx/sites-available/system.fixzzone.com /etc/nginx/sites-enabled/

# أو إذا كنت تستخدم conf.d:
# الملف موجود مباشرة في conf.d
```

### 4. **التحقق من الـ Configuration:**

```bash
sudo nginx -t
```

يجب أن ترى:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. **إعادة تحميل Nginx:**

```bash
sudo systemctl reload nginx
# أو
sudo service nginx reload
```

---

## 🔍 **التحقق من الإصلاح:**

### 1. **من الـ Server نفسه:**

```bash
# Health check
curl http://127.0.0.1/health
curl https://system.fixzzone.com/health

# API test
curl https://system.fixzzone.com/api
curl https://system.fixzzone.com/api/auth/login -X POST -H "Content-Type: application/json" -d '{"loginIdentifier":"test","password":"test"}'
```

### 2. **من المتصفح:**

افتح Developer Tools (F12) → Network tab:
- ✅ `GET /api/auth/me` → يجب أن يعطي **200** أو **401** (بدل 404)
- ✅ `POST /api/auth/login` → يجب أن يعطي **200** أو **401** (بدل 404)
- ✅ `GET /api/dashboard/stats` → يجب أن يعطي **200** أو **401** (بدل 404)

---

## 🛠️ **استكشاف الأخطاء:**

### 1. **إذا استمرت المشكلة:**

#### أ) تحقق من Nginx Error Logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

#### ب) تحقق من أن الـ Backend شغال:
```bash
pm2 list
# أو
ps aux | grep node
```

#### ج) اختبر الـ Backend مباشرة:
```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4000/api
```

### 2. **إذا كان الـ Backend على Port مختلف:**

إذا كان الـ backend شغال على port مختلف (مثل 3001):

```nginx
location /api {
    proxy_pass http://127.0.0.1:3001/api;  # غير الـ port هنا
    # ... باقي الإعدادات
}
```

### 3. **إذا كان الـ Backend على Server منفصل:**

```nginx
location /api {
    proxy_pass http://backend-server-ip:4000/api;
    # ... باقي الإعدادات
}
```

---

## 📋 **ملاحظات مهمة:**

### 1. **مسار Frontend Build:**

تأكد من أن المسار صحيح:
```nginx
root /opt/lampp/htdocs/FixZone/frontend/react-app/build;
```

### 2. **مسار SSL Certificates:**

استبدل المسارات التالية:
```nginx
ssl_certificate /path/to/ssl/cert.pem;
ssl_certificate_key /path/to/ssl/key.pem;
```

بالمسارات الفعلية لـ SSL certificates.

### 3. **إعادة تشغيل Backend بعد التغييرات:**

```bash
pm2 restart fixzone-api
# أو
pm2 restart fixzone-backend
```

---

## ✅ **الملفات المحدثة:**

1. ✅ `/backend/server.js` - تم تحسين الـ routes configuration
2. ✅ `/backend/.env` - CORS_ORIGIN محدث
3. ✅ `/frontend/react-app/.env.production` - API URLs محدثة

---

**تاريخ الإصلاح:** $(date +%Y-%m-%d)
**الحالة:** ✅ تم تحسين server.js - يحتاج إعداد Nginx


