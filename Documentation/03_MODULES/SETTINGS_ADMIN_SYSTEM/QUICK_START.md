# دليل البدء السريع - نظام الإعدادات
## Quick Start Guide - Settings System

**تاريخ:** 2025-01-28  
**الحالة:** ✅ جاهز للاستخدام

---

## 🚀 البدء السريع (3 خطوات)

### الخطوة 1: تشغيل Migrations

```bash
cd /opt/lampp/htdocs/FixZone/backend
npm run migrate:settings
```

**النتيجة المتوقعة:**
```
✅ Migration 1 completed
✅ Migration 2 completed
✅ Migration 3 completed
✅ Migration 4 completed
✅ All migrations completed successfully!
```

### الخطوة 2: اختبار API

```bash
# اختبار الاتصال
npm run test:settings-api
```

**ملاحظة:** تحتاج إلى تعيين `TEST_API_TOKEN` في `.env` file

### الخطوة 3: استخدام API

```bash
# Get all settings
curl -X GET http://localhost:4000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get setting by key
curl -X GET http://localhost:4000/api/settings/company.name \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update setting
curl -X PUT http://localhost:4000/api/settings/company.name \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "Fix Zone", "reason": "Update company name"}'
```

---

## 📋 Checklist سريع

- [ ] Backup قاعدة البيانات
- [ ] تشغيل Migrations
- [ ] التحقق من الجداول
- [ ] اختبار API
- [ ] جاهز للاستخدام!

---

## 🔗 روابط مفيدة

- [Migration Guide](./MIGRATION_GUIDE.md) - دليل تفصيلي للمigrations
- [Backend Summary](./BACKEND_COMPLETE_SUMMARY.md) - ملخص Backend
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - حالة التنفيذ
- [Development Plan](./SETTINGS_ADMIN_COMPREHENSIVE_DEVELOPMENT_PLAN.md) - الخطة الكاملة

---

**آخر تحديث:** 2025-01-28

