# ⚡ Docker Quick Start - Fix Zone ERP

## 🚀 النشر السريع (3 خطوات)

### **1. استنساخ المشروع:**
```bash
git clone YOUR_GITHUB_REPO_URL fixzone
cd fixzone
```

### **2. إعداد ملف البيئة:**
```bash
cp DEPLOYMENT/env.docker.example .env
nano .env  # تعديل القيم
```

### **3. بناء وتشغيل:**
```bash
# Development
docker compose up -d

# Production (مع Nginx)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**✅ تم! النظام يعمل الآن**

---

## 📊 الأوامر الأساسية

```bash
# عرض الحالة
docker compose ps

# عرض Logs
docker compose logs -f

# إيقاف
docker compose stop

# إعادة تشغيل
docker compose restart

# تحديث
git pull
docker compose build
docker compose up -d
```

---

## 🔍 Health Checks

```bash
# Backend
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000
```

---

## 📝 ملاحظات

- **ملف .env:** لا ترفعه للـ Git
- **Ports:** Backend (4000), Frontend (3000), MySQL (3306)
- **Volumes:** البيانات محفوظة في Docker volumes

---

**للمزيد من التفاصيل:** راجع `DEPLOYMENT/DOCKER_DEPLOYMENT_GUIDE.md`






