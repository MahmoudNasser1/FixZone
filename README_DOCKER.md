# 🐳 Fix Zone ERP - Docker Deployment

## ⚡ النشر السريع

```bash
# 1. استنساخ المشروع
git clone YOUR_REPO_URL fixzone
cd fixzone

# 2. إعداد ملف البيئة
cp DEPLOYMENT/env.docker.example .env
nano .env

# 3. بناء وتشغيل
docker compose up -d
```

**✅ تم! النظام يعمل الآن على:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- MySQL: localhost:3306

---

## 📚 الوثائق الكاملة

- **الدليل الشامل:** [`DEPLOYMENT/DOCKER_DEPLOYMENT_GUIDE.md`](DEPLOYMENT/DOCKER_DEPLOYMENT_GUIDE.md)
- **البداية السريعة:** [`DEPLOYMENT/DOCKER_QUICK_START.md`](DEPLOYMENT/DOCKER_QUICK_START.md)
- **الملخص:** [`DEPLOYMENT/DOCKER_SUMMARY.md`](DEPLOYMENT/DOCKER_SUMMARY.md)

---

## 🔄 الأوامر الأساسية

```bash
# عرض الحالة
docker compose ps

# عرض Logs
docker compose logs -f

# تحديث
git pull
docker compose build
docker compose up -d

# إيقاف
docker compose down
```

---

## 🆘 المساعدة

راجع [`DEPLOYMENT/DOCKER_DEPLOYMENT_GUIDE.md`](DEPLOYMENT/DOCKER_DEPLOYMENT_GUIDE.md) للتفاصيل الكاملة.

---

**📅 آخر تحديث:** 2025-11-19





