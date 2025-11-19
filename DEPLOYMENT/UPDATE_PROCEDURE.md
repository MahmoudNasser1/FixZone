# 🔄 إجراءات التحديث - Fix Zone ERP

## 📋 نظرة عامة

هذا الدليل يوضح كيفية تحديث النظام بعد النشر الأولي مع الحفاظ على البيانات والاستقرار.

---

## 🎯 أنواع التحديثات

### **1. تحديثات الكود (Code Updates)**
- تحديثات الميزات
- إصلاح الأخطاء
- تحسينات الأداء

### **2. تحديثات قاعدة البيانات (Database Migrations)**
- إضافة جداول جديدة
- تعديل الجداول الموجودة
- تحديث البيانات

### **3. تحديثات التبعيات (Dependencies)**
- تحديثات npm packages
- تحديثات Node.js
- تحديثات النظام

---

## 🔄 عملية التحديث القياسية

### **الخطوة 1: النسخ الاحتياطي**

**قبل أي تحديث، قم بعمل نسخة احتياطية:**

```bash
cd /var/www/fixzone
./DEPLOYMENT/scripts/backup.sh
```

أو يدوياً:
```bash
# نسخة احتياطية من قاعدة البيانات
mysqldump -u fixzone_user -p FZ > backup_$(date +%Y%m%d).sql

# نسخة احتياطية من الملفات
tar -czf backup_$(date +%Y%m%d).tar.gz backend frontend
```

---

### **الخطوة 2: استخدام سكريبت التحديث**

**الطريقة الموصى بها:**

```bash
cd /var/www/fixzone
./DEPLOYMENT/scripts/update.sh
```

**ما يقوم به السكريبت:**
1. ✅ إنشاء نسخة احتياطية تلقائية
2. ✅ تحديث الكود من Git (إن وجد)
3. ✅ تحديث التبعيات
4. ✅ تشغيل Migrations
5. ✅ إعادة بناء Frontend
6. ✅ إعادة تشغيل Backend
7. ✅ فحص الصحة (Health Check)

---

### **الخطوة 3: التحديث اليدوي (بدون Git)**

إذا لم تستخدم Git:

```bash
cd /var/www/fixzone

# 1. رفع الملفات الجديدة (FTP/SFTP/SCP)
# scp -r updated-files/* user@vps:/var/www/fixzone/

# 2. تحديث Backend
cd backend
npm install --production
pm2 restart fixzone-backend

# 3. تحديث Frontend
cd ../frontend/react-app
npm install
npm run build

# 4. إعادة تحميل Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🗄️ تحديثات قاعدة البيانات

### **تطبيق Migrations:**

```bash
cd /var/www/fixzone

# 1. نسخة احتياطية أولاً!
mysqldump -u fixzone_user -p FZ > backup_before_migration.sql

# 2. تطبيق Migration
mysql -u fixzone_user -p FZ < migrations/XX_NEW_MIGRATION.sql

# 3. التحقق
mysql -u fixzone_user -p FZ -e "SHOW TABLES;"
```

### **Rollback Migration:**

```bash
# استعادة من النسخة الاحتياطية
mysql -u fixzone_user -p FZ < backup_before_migration.sql
```

---

## 🔍 التحقق من التحديث

### **1. فحص Backend:**
```bash
# Health Check
curl http://localhost:3001/health

# PM2 Status
pm2 status
pm2 logs fixzone-backend --lines 50
```

### **2. فحص Frontend:**
```bash
# التحقق من البناء
ls -la frontend/react-app/build/

# فحص Nginx
sudo nginx -t
sudo systemctl status nginx
```

### **3. فحص قاعدة البيانات:**
```bash
mysql -u fixzone_user -p FZ -e "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'FZ';"
```

---

## 🚨 Rollback (التراجع)

### **في حالة فشل التحديث:**

```bash
cd /var/www/fixzone

# 1. إيقاف التطبيق
pm2 stop fixzone-backend

# 2. استعادة الملفات
cd backups
tar -xzf fixzone_backup_YYYYMMDD_HHMMSS.tar.gz
cp -r fixzone_backup_*/application.tar.gz ..
cd ..
tar -xzf application.tar.gz

# 3. استعادة قاعدة البيانات
gunzip -c backups/fixzone_backup_*/database.sql.gz | mysql -u fixzone_user -p FZ

# 4. إعادة التشغيل
pm2 restart fixzone-backend
```

---

## 📅 جدول التحديثات الموصى به

### **يومياً:**
- ✅ مراقبة Logs
- ✅ فحص Health Status

### **أسبوعياً:**
- ✅ نسخة احتياطية كاملة
- ✅ مراجعة الأخطاء

### **شهرياً:**
- ✅ تحديثات الأمان
- ✅ تحديثات التبعيات (اختياري)
- ✅ تنظيف Logs القديمة

---

## 🔐 تحديثات الأمان

### **تحديثات النظام:**
```bash
sudo apt update
sudo apt upgrade -y
```

### **تحديثات Node.js:**
```bash
# استخدام nvm للتحكم في الإصدارات
nvm install 18
nvm use 18
```

### **تحديثات npm packages:**
```bash
# Backend
cd backend
npm audit
npm audit fix

# Frontend
cd ../frontend/react-app
npm audit
npm audit fix
```

---

## 📊 مراقبة التحديثات

### **PM2 Monitoring:**
```bash
pm2 monit
pm2 logs --lines 100
```

### **Nginx Logs:**
```bash
sudo tail -f /var/log/nginx/fixzone-access.log
sudo tail -f /var/log/nginx/fixzone-error.log
```

### **Application Logs:**
```bash
tail -f /var/www/fixzone/logs/backend-error.log
tail -f /var/www/fixzone/logs/backend-out.log
```

---

## ✅ Checklist قبل التحديث

- [ ] نسخة احتياطية كاملة (Database + Files)
- [ ] قراءة ملاحظات الإصدار (Release Notes)
- [ ] التحقق من المتطلبات (Requirements)
- [ ] اختبار على بيئة التطوير أولاً (إن أمكن)
- [ ] إخطار المستخدمين (للصيانة المخطط لها)
- [ ] التحقق من وقت الذروة (تجنب التحديث في الأوقات المزدحمة)

---

## ✅ Checklist بعد التحديث

- [ ] Health Check ناجح
- [ ] جميع الموديولات تعمل
- [ ] لا توجد أخطاء في Logs
- [ ] الأداء طبيعي
- [ ] المستخدمون يمكنهم الوصول
- [ ] WebSocket يعمل (إن كان مستخدماً)

---

## 🆘 استكشاف الأخطاء

### **Backend لا يعمل:**
```bash
pm2 logs fixzone-backend
pm2 restart fixzone-backend
# أو
pm2 delete fixzone-backend
pm2 start ecosystem.config.js
```

### **Frontend لا يظهر:**
```bash
# إعادة البناء
cd frontend/react-app
rm -rf build
npm run build

# إعادة تحميل Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### **مشاكل قاعدة البيانات:**
```bash
# فحص الاتصال
mysql -u fixzone_user -p FZ -e "SELECT 1;"

# فحص الجداول
mysql -u fixzone_user -p FZ -e "SHOW TABLES;"
```

---

**📅 آخر تحديث:** 2025-11-19

