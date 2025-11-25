# 🚀 دليل النشر على الإنتاج - Fix Zone ERP

## 📋 نظرة عامة

هذا الدليل الشامل يوضح كيفية نشر نظام Fix Zone ERP على VPS مع نظام تحديثات متكامل.

**التاريخ:** 2025-11-19  
**الإصدار:** 1.0.0

---

## 🎯 المتطلبات الأساسية

### **1. متطلبات الخادم (VPS):**
- **OS:** Ubuntu 20.04+ أو Debian 11+
- **RAM:** 2GB كحد أدنى (4GB+ موصى به)
- **Storage:** 20GB+ مساحة خالية
- **CPU:** 2 cores كحد أدنى
- **Network:** اتصال إنترنت مستقر

### **2. البرمجيات المطلوبة:**
- Node.js 18+ (LTS)
- MySQL 8.0+
- Nginx
- PM2 (Process Manager)
- Git
- SSL Certificate (Let's Encrypt)

---

## 📦 هيكل النظام

```
FixZone ERP
├── Backend (Node.js + Express)
│   ├── Port: 4000 (internal)
│   ├── Database: MySQL (FZ)
│   └── WebSocket: ws://
│
├── Frontend (React)
│   ├── Build: Static files
│   └── Served by: Nginx
│
└── Infrastructure
    ├── Nginx: Reverse Proxy + SSL
    ├── PM2: Process Management
    └── MySQL: Database Server
```

---

## 🔧 الخطوة 1: إعداد الخادم

### **1.1 تحديث النظام:**
```bash
sudo apt update && sudo apt upgrade -y
```

### **1.2 تثبيت Node.js:**
```bash
# تثبيت Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# التحقق من الإصدار
node --version  # يجب أن يكون v18.x.x
npm --version
```

### **1.3 تثبيت MySQL:**
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation

# إنشاء قاعدة البيانات
sudo mysql -u root -p
```

```sql
CREATE DATABASE FZ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fixzone_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON FZ.* TO 'fixzone_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **1.4 تثبيت Nginx:**
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### **1.5 تثبيت PM2:**
```bash
sudo npm install -g pm2
pm2 startup  # لإضافة PM2 للـ startup
```

### **1.6 تثبيت Certbot (للـ SSL):**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📁 الخطوة 2: إعداد المشروع

### **2.1 إنشاء مجلد التطبيق:**
```bash
sudo mkdir -p /var/www/fixzone
sudo chown -R $USER:$USER /var/www/fixzone
cd /var/www/fixzone
```

### **2.2 استنساخ المشروع:**
```bash
# من Git repository
git clone YOUR_REPO_URL .

# أو رفع الملفات يدوياً
# scp -r /path/to/FixZone/* user@your-vps:/var/www/fixzone/
```

### **2.3 إعداد ملفات البيئة:**

**Backend (.env):**
```bash
cd /var/www/fixzone/backend
cp .env.example .env  # إذا كان موجود
nano .env
```

**Frontend (.env.production):**
```bash
cd /var/www/fixzone/frontend/react-app
cp .env.example .env.production  # إذا كان موجود
nano .env.production
```

---

## 🔐 الخطوة 3: إعداد ملفات البيئة

### **3.1 Backend Environment Variables:**

أنشئ ملف `/var/www/fixzone/backend/.env`:

```env
# Server Configuration
NODE_ENV=production
PORT=4000

# Database Configuration
DB_HOST=localhost
DB_USER=fixzone_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_NAME=FZ
DB_PORT=3306

# JWT Configuration
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/www/fixzone/backend/uploads

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **3.2 Frontend Environment Variables:**

أنشئ ملف `/var/www/fixzone/frontend/react-app/.env.production`:

```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
REACT_APP_ENV=production
```

---

## 🗄️ الخطوة 4: إعداد قاعدة البيانات

### **4.1 استيراد قاعدة البيانات:**
```bash
cd /var/www/fixzone

# استيراد Schema
mysql -u fixzone_user -p FZ < migrations/01_COMPLETE_SCHEMA.sql

# استيراد البيانات (اختياري)
mysql -u fixzone_user -p FZ < migrations/02_SAMPLE_DATA.sql
```

### **4.2 التحقق من قاعدة البيانات:**
```bash
mysql -u fixzone_user -p FZ -e "SHOW TABLES;"
```

---

## 📦 الخطوة 5: بناء التطبيق

### **5.1 تثبيت Dependencies:**
```bash
cd /var/www/fixzone

# Backend
cd backend
npm install --production

# Frontend
cd ../frontend/react-app
npm install
npm run build
```

### **5.2 التحقق من البناء:**
```bash
ls -la frontend/react-app/build/
# يجب أن ترى ملفات static
```

---

## ⚙️ الخطوة 6: إعداد PM2

### **6.1 إنشاء PM2 Ecosystem File:**

أنشئ ملف `/var/www/fixzone/ecosystem.config.js` (سيتم إنشاؤه في الخطوة التالية)

### **6.2 تشغيل التطبيق:**
```bash
cd /var/www/fixzone
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 الخطوة 7: إعداد Nginx

### **7.1 إنشاء Nginx Configuration:**

أنشئ ملف `/etc/nginx/sites-available/fixzone` (سيتم إنشاؤه في الخطوة التالية)

### **7.2 تفعيل الموقع:**
```bash
sudo ln -s /etc/nginx/sites-available/fixzone /etc/nginx/sites-enabled/
sudo nginx -t  # اختبار الإعدادات
sudo systemctl reload nginx
```

### **7.3 إعداد SSL:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔄 الخطوة 8: نظام التحديثات

### **8.1 استخدام سكريبتات التحديث:**

راجع ملفات:
- `DEPLOYMENT/scripts/deploy.sh` - للنشر الأولي
- `DEPLOYMENT/scripts/update.sh` - للتحديثات
- `DEPLOYMENT/scripts/backup.sh` - للنسخ الاحتياطي

---

## ✅ الخطوة 9: التحقق من النشر

### **9.1 فحص الخدمات:**
```bash
# PM2
pm2 status
pm2 logs

# Nginx
sudo systemctl status nginx

# MySQL
sudo systemctl status mysql

# Backend Health
curl http://localhost:4000/health
```

### **9.2 فحص الموقع:**
- افتح المتصفح: `https://yourdomain.com`
- تحقق من تسجيل الدخول
- تحقق من جميع الموديولات

---

## 🔒 الخطوة 10: الأمان

### **10.1 Firewall:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **10.2 تحديثات أمنية:**
```bash
# إعداد auto-updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 المراقبة والصيانة

### **مراقبة الأداء:**
```bash
pm2 monit
pm2 logs --lines 100
```

### **النسخ الاحتياطي:**
```bash
# تشغيل النسخ الاحتياطي اليومي
./DEPLOYMENT/scripts/backup.sh
```

---

## 🆘 استكشاف الأخطاء

### **مشاكل شائعة:**

1. **Backend لا يعمل:**
   ```bash
   pm2 logs backend
   pm2 restart backend
   ```

2. **Frontend لا يظهر:**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

3. **مشاكل قاعدة البيانات:**
   ```bash
   mysql -u fixzone_user -p FZ -e "SHOW PROCESSLIST;"
   ```

---

## 📝 ملاحظات مهمة

1. **احفظ جميع كلمات المرور في مكان آمن**
2. **قم بعمل نسخة احتياطية قبل أي تحديث**
3. **راقب استخدام الموارد (RAM, CPU, Disk)**
4. **حدث النظام بانتظام**

---

## 🔄 التحديثات المستقبلية

راجع ملف `DEPLOYMENT/UPDATE_PROCEDURE.md` للتفاصيل الكاملة.

---

**✅ تم النشر بنجاح!**

**📅 آخر تحديث:** 2025-11-19







