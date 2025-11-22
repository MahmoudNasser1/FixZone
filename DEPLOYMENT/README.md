# 🚀 Fix Zone ERP - Production Deployment

## 📋 نظرة عامة

هذا المجلد يحتوي على جميع الملفات والإعدادات اللازمة لنشر نظام Fix Zone ERP على VPS مع نظام تحديثات متكامل.

---

## 📁 محتويات المجلد

```
DEPLOYMENT/
├── PRODUCTION_DEPLOYMENT_GUIDE.md    # الدليل الشامل للنشر
├── UPDATE_PROCEDURE.md               # إجراءات التحديث
├── ecosystem.config.js               # إعدادات PM2
├── nginx.conf                        # إعدادات Nginx
├── backend.env.example                # مثال لملف بيئة Backend
├── frontend.env.production.example    # مثال لملف بيئة Frontend
├── scripts/
│   ├── deploy.sh                     # سكريبت النشر الأولي
│   ├── update.sh                     # سكريبت التحديث
│   └── backup.sh                     # سكريبت النسخ الاحتياطي
└── README.md                         # هذا الملف
```

---

## 🚀 البداية السريعة

### **1. اقرأ الدليل الشامل:**
```bash
cat DEPLOYMENT/PRODUCTION_DEPLOYMENT_GUIDE.md
```

### **2. اتبع الخطوات بالترتيب:**
- إعداد الخادم
- إعداد ملفات البيئة
- إعداد قاعدة البيانات
- بناء التطبيق
- إعداد PM2
- إعداد Nginx
- إعداد SSL

---

## 📝 خطوات سريعة

### **النشر الأولي:**
```bash
# 1. نسخ ملفات البيئة
cp DEPLOYMENT/backend.env.example backend/.env
cp DEPLOYMENT/frontend.env.production.example frontend/react-app/.env.production

# 2. تعديل الملفات بالقيم الصحيحة
nano backend/.env
nano frontend/react-app/.env.production

# 3. تشغيل سكريبت النشر
./DEPLOYMENT/scripts/deploy.sh
```

### **التحديث:**
```bash
./DEPLOYMENT/scripts/update.sh
```

### **النسخ الاحتياطي:**
```bash
./DEPLOYMENT/scripts/backup.sh
```

---

## ⚙️ الإعدادات المطلوبة

### **1. Backend Environment (.env):**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (32+ حرف)
- `CORS_ORIGIN` (رابط الدومين)
- `PORT` (افتراضي: 3001)

### **2. Frontend Environment (.env.production):**
- `REACT_APP_API_URL` (رابط API)
- `REACT_APP_WS_URL` (رابط WebSocket)

### **3. Nginx Configuration:**
- تحديث `server_name` بالدومين
- تحديث مسارات SSL certificates

### **4. PM2 Ecosystem:**
- تحديث `cwd` إذا كان المسار مختلف
- تعديل عدد الـ instances حسب الـ CPU

---

## 🔒 الأمان

### **قبل النشر:**
- ✅ استخدام كلمات مرور قوية
- ✅ تحديث جميع التبعيات
- ✅ إعداد Firewall
- ✅ إعداد SSL Certificate
- ✅ تعطيل الوصول المباشر للـ Backend

### **بعد النشر:**
- ✅ مراقبة Logs بانتظام
- ✅ عمل نسخ احتياطية دورية
- ✅ تحديثات أمنية منتظمة
- ✅ مراجعة الصلاحيات

---

## 📊 المراقبة

### **PM2:**
```bash
pm2 status
pm2 monit
pm2 logs
```

### **Nginx:**
```bash
sudo tail -f /var/log/nginx/fixzone-access.log
sudo tail -f /var/log/nginx/fixzone-error.log
```

### **System:**
```bash
htop
df -h
free -m
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
sudo nginx -t
sudo systemctl status nginx
```

### **مشاكل قاعدة البيانات:**
```bash
mysql -u fixzone_user -p FZ -e "SHOW PROCESSLIST;"
```

---

## 📚 الوثائق الكاملة

- **دليل النشر:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **إجراءات التحديث:** `UPDATE_PROCEDURE.md`
- **الدليل الرئيسي:** `../README.md`

---

## ✅ Checklist النشر

- [ ] قراءة الدليل الشامل
- [ ] إعداد الخادم (Node.js, MySQL, Nginx, PM2)
- [ ] إنشاء ملفات البيئة
- [ ] إعداد قاعدة البيانات
- [ ] بناء Frontend
- [ ] إعداد PM2
- [ ] إعداد Nginx
- [ ] إعداد SSL
- [ ] اختبار النظام
- [ ] إعداد النسخ الاحتياطي
- [ ] إعداد المراقبة

---

**📅 آخر تحديث:** 2025-11-19  
**✅ جاهز للنشر**





