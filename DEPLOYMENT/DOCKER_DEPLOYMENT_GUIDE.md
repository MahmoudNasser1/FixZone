# 🐳 دليل النشر باستخدام Docker - Fix Zone ERP

## 📋 نظرة عامة

هذا الدليل يوضح كيفية نشر Fix Zone ERP باستخدام Docker و Docker Compose. هذا الحل أسهل وأكثر احترافية من النشر التقليدي.

---

## 🎯 المميزات

✅ **سهولة النشر** - أمر واحد فقط  
✅ **عزل كامل** - كل خدمة في container منفصل  
✅ **سهولة التحديث** - rebuild و restart فقط  
✅ **Portability** - يعمل على أي خادم  
✅ **Scalability** - سهولة التوسع  
✅ **Health Checks** - مراقبة تلقائية  

---

## 📦 المتطلبات

### **على VPS:**
- Docker 20.10+
- Docker Compose 2.0+
- Git (للاستنساخ من GitHub)
- 2GB+ RAM
- 20GB+ Storage

### **تثبيت Docker:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo apt install docker-compose-plugin -y

# إضافة المستخدم لمجموعة docker
sudo usermod -aG docker $USER
newgrp docker

# التحقق
docker --version
docker compose version
```

---

## 🚀 النشر السريع

### **1. استنساخ المشروع:**
```bash
cd /var/www
git clone YOUR_GITHUB_REPO_URL fixzone
cd fixzone
```

### **2. إعداد ملف البيئة:**
```bash
cp .env.docker.example .env
nano .env  # تعديل القيم
```

### **3. بناء وتشغيل:**
```bash
# Development
docker compose up -d

# Production (مع Nginx)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### **4. التحقق:**
```bash
docker compose ps
docker compose logs -f
```

---

## 📝 الإعدادات التفصيلية

### **1. ملف .env:**

أنشئ ملف `.env` في جذر المشروع:

```env
# Database
MYSQL_ROOT_PASSWORD=strong_root_password
MYSQL_DATABASE=FZ
MYSQL_USER=fixzone_user
MYSQL_PASSWORD=strong_password

# Backend
JWT_SECRET=your_32_character_secret_key
CORS_ORIGIN=https://yourdomain.com

# Frontend
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
```

### **2. قاعدة البيانات:**

**الطريقة 1: استيراد Schema تلقائياً**
- ضع ملفات `.sql` في مجلد `migrations/`
- سيتم استيرادها تلقائياً عند أول تشغيل

**الطريقة 2: استيراد يدوي**
```bash
# بعد تشغيل Containers
docker exec -i fixzone-mysql mysql -u fixzone_user -pfixzone_password FZ < migrations/01_COMPLETE_SCHEMA.sql
```

---

## 🔧 الأوامر الأساسية

### **البناء والتشغيل:**
```bash
# بناء الصور
docker compose build

# بناء وتشغيل
docker compose up -d

# بناء بدون cache
docker compose build --no-cache

# Production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### **الإدارة:**
```bash
# عرض الحالة
docker compose ps

# عرض Logs
docker compose logs -f
docker compose logs backend -f
docker compose logs frontend -f
docker compose logs mysql -f

# إيقاف
docker compose stop

# إيقاف وحذف
docker compose down

# إيقاف مع حذف Volumes (⚠️ يحذف قاعدة البيانات!)
docker compose down -v
```

### **التحديث:**
```bash
# سحب آخر التحديثات
git pull

# إعادة البناء
docker compose build --no-cache

# إعادة التشغيل
docker compose up -d

# أو restart service محدد
docker compose restart backend
```

---

## 🔄 التحديثات

### **تحديث الكود:**
```bash
# 1. سحب التحديثات
git pull origin main

# 2. إعادة بناء (Backend فقط)
docker compose build backend
docker compose up -d backend

# 3. إعادة بناء (Frontend فقط)
docker compose build frontend
docker compose up -d frontend

# 4. إعادة بناء (الكل)
docker compose build
docker compose up -d
```

### **تحديث قاعدة البيانات:**
```bash
# نسخة احتياطية أولاً
docker exec fixzone-mysql mysqldump -u fixzone_user -pfixzone_password FZ > backup.sql

# تطبيق Migration
docker exec -i fixzone-mysql mysql -u fixzone_user -pfixzone_password FZ < migrations/XX_NEW_MIGRATION.sql
```

---

## 💾 النسخ الاحتياطي

### **قاعدة البيانات:**
```bash
# Export
docker exec fixzone-mysql mysqldump -u fixzone_user -pfixzone_password FZ > backup_$(date +%Y%m%d).sql

# Import
docker exec -i fixzone-mysql mysql -u fixzone_user -pfixzone_password FZ < backup_20251119.sql
```

### **الرفوعات (Uploads):**
```bash
# Backup
docker cp fixzone-backend:/app/uploads ./backups/uploads_$(date +%Y%m%d).tar.gz

# Restore
docker cp ./backups/uploads.tar.gz fixzone-backend:/app/uploads
```

---

## 🌐 إعداد Nginx (Production)

### **1. إنشاء مجلد SSL:**
```bash
mkdir -p nginx/ssl
# ضع ملفات SSL هنا
```

### **2. تحديث nginx.conf:**
- تحديث `server_name` بالدومين
- تحديث مسارات SSL certificates

### **3. تشغيل مع Nginx:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔍 Health Checks

### **فحص الحالة:**
```bash
# جميع الخدمات
docker compose ps

# Backend Health
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000

# MySQL
docker exec fixzone-mysql mysqladmin ping -h localhost -u root -p
```

---

## 🐛 استكشاف الأخطاء

### **Backend لا يعمل:**
```bash
# عرض Logs
docker compose logs backend

# الدخول للـ Container
docker exec -it fixzone-backend sh

# فحص الاتصال بقاعدة البيانات
docker exec fixzone-backend node -e "require('./db.js')"
```

### **Frontend لا يعمل:**
```bash
# عرض Logs
docker compose logs frontend

# إعادة البناء
docker compose build --no-cache frontend
docker compose up -d frontend
```

### **مشاكل قاعدة البيانات:**
```bash
# عرض Logs
docker compose logs mysql

# الدخول للـ MySQL
docker exec -it fixzone-mysql mysql -u fixzone_user -pfixzone_password FZ

# فحص الجداول
docker exec fixzone-mysql mysql -u fixzone_user -pfixzone_password FZ -e "SHOW TABLES;"
```

### **مشاكل الذاكرة:**
```bash
# عرض استخدام الموارد
docker stats

# تنظيف
docker system prune -a
```

---

## 📊 المراقبة

### **استخدام الموارد:**
```bash
docker stats
```

### **Logs:**
```bash
# جميع Logs
docker compose logs -f

# Logs محددة
docker compose logs backend --tail=100 -f
```

---

## 🔒 الأمان

### **Best Practices:**
1. ✅ استخدام كلمات مرور قوية في `.env`
2. ✅ عدم رفع ملف `.env` للـ Git
3. ✅ استخدام SSL في Production
4. ✅ تحديث Docker images بانتظام
5. ✅ استخدام non-root user في Containers (✅ موجود)

---

## 🚀 النشر على VPS

### **الخطوات الكاملة:**
```bash
# 1. تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. استنساخ المشروع
cd /var/www
git clone YOUR_REPO_URL fixzone
cd fixzone

# 3. إعداد ملف البيئة
cp .env.docker.example .env
nano .env

# 4. بناء وتشغيل
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. استيراد قاعدة البيانات
docker exec -i fixzone-mysql mysql -u fixzone_user -pfixzone_password FZ < migrations/01_COMPLETE_SCHEMA.sql

# 6. التحقق
docker compose ps
curl http://localhost:4000/health
```

---

## 📝 ملاحظات مهمة

1. **ملف .env:** لا ترفعه للـ Git (موجود في .gitignore)
2. **Volumes:** البيانات محفوظة في Docker volumes
3. **Ports:** تأكد من عدم تعارض المنافذ
4. **Resources:** راقب استخدام RAM و CPU
5. **Backups:** اعمل نسخ احتياطية دورية

---

## ✅ Checklist

- [ ] تثبيت Docker و Docker Compose
- [ ] استنساخ المشروع من GitHub
- [ ] إنشاء ملف `.env`
- [ ] بناء الصور
- [ ] تشغيل Containers
- [ ] استيراد قاعدة البيانات
- [ ] اختبار النظام
- [ ] إعداد SSL (Production)
- [ ] إعداد النسخ الاحتياطي

---

**📅 آخر تحديث:** 2025-11-19  
**✅ جاهز للاستخدام**







