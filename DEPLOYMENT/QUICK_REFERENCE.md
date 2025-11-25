# ⚡ Quick Reference - Fix Zone ERP Deployment

## 🚀 النشر السريع

```bash
# 1. إعداد ملفات البيئة
cp DEPLOYMENT/backend.env.example backend/.env
cp DEPLOYMENT/frontend.env.production.example frontend/react-app/.env.production

# 2. تعديل الملفات
nano backend/.env
nano frontend/react-app/.env.production

# 3. النشر
./DEPLOYMENT/scripts/deploy.sh
```

---

## 🔄 التحديث

```bash
./DEPLOYMENT/scripts/update.sh
```

---

## 💾 النسخ الاحتياطي

```bash
./DEPLOYMENT/scripts/backup.sh
```

---

## 📊 الأوامر المفيدة

### **PM2:**
```bash
pm2 status              # حالة التطبيقات
pm2 logs                # عرض Logs
pm2 restart backend     # إعادة تشغيل
pm2 monit               # مراقبة مباشرة
pm2 stop all            # إيقاف الكل
pm2 delete all          # حذف الكل
```

### **Nginx:**
```bash
sudo nginx -t           # اختبار الإعدادات
sudo systemctl reload nginx  # إعادة التحميل
sudo systemctl status nginx   # حالة الخدمة
sudo tail -f /var/log/nginx/fixzone-error.log  # Logs
```

### **MySQL:**
```bash
mysql -u fixzone_user -p FZ
mysqldump -u fixzone_user -p FZ > backup.sql
mysql -u fixzone_user -p FZ < backup.sql
```

### **System:**
```bash
df -h                   # مساحة القرص
free -m                 # الذاكرة
htop                    # استخدام الموارد
```

---

## 🔍 Health Checks

```bash
# Backend
curl http://localhost:4000/health

# Frontend
curl https://yourdomain.com
```

---

## 🆘 استكشاف الأخطاء

### **Backend لا يعمل:**
```bash
pm2 logs fixzone-backend
pm2 restart fixzone-backend
```

### **Frontend لا يظهر:**
```bash
cd frontend/react-app
npm run build
sudo systemctl reload nginx
```

### **مشاكل قاعدة البيانات:**
```bash
mysql -u fixzone_user -p FZ -e "SHOW PROCESSLIST;"
```

---

## 📁 الملفات المهمة

- **Backend Config:** `/var/www/fixzone/backend/.env`
- **Frontend Config:** `/var/www/fixzone/frontend/react-app/.env.production`
- **PM2 Config:** `/var/www/fixzone/ecosystem.config.js`
- **Nginx Config:** `/etc/nginx/sites-available/fixzone`
- **Logs:** `/var/www/fixzone/logs/`
- **Backups:** `/var/www/fixzone/backups/`

---

## 🔐 معلومات مهمة

- **Backend Port:** 4000 (internal)
- **Frontend:** Served by Nginx
- **Database:** MySQL (FZ)
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt

---

**📅 آخر تحديث:** 2025-11-19







