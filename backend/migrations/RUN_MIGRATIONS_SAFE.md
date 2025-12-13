# دليل تشغيل المايجريشنز بشكل آمن

## الخطوة 1: التحقق من الحالة الحالية

```bash
cd /opt/lampp/htdocs/FixZone/backend/migrations
mysql -u root -p FZ < check_migrations_status.sql
```

هذا سيعرض لك:
- ✅ إذا كان العمود/الجدول موجود
- ❌ إذا كان غير موجود

---

## الخطوة 2: تشغيل المايجريشنز حسب الحاجة

### أ) إذا كان `shippingAmount` غير موجود:

شغل واحد فقط من هذه الملفات (ليس كلهم):

```bash
# استخدم هذا (الأكثر أماناً - يتحقق من وجود العمود أولاً)
mysql -u root -p FZ < add_shipping_amount_to_invoice.sql
```

**لا تشغل:**
- ❌ `add_shipping_amount_production_final.sql` (إذا كان العمود موجود)
- ❌ `PRODUCTION_ADD_SHIPPING_AMOUNT.sql` (إذا كان العمود موجود)

---

### ب) جداول الفنيين (technician tables):

شغل فقط الجداول التي تظهر ❌ غير موجود:

```bash
# إذا كان technician_performance غير موجود
mysql -u root -p FZ < 20250112_create_technician_performance.sql

# إذا كان technician_repairs غير موجود
mysql -u root -p FZ < 20250112_create_technician_repairs.sql

# إذا كان technician_schedules غير موجود
mysql -u root -p FZ < 20250112_create_technician_schedules.sql

# إذا كان technician_skills غير موجود
mysql -u root -p FZ < 20250112_create_technician_skills.sql

# إذا كان technician_wages غير موجود
mysql -u root -p FZ < 20250112_create_technician_wages.sql
```

---

## الخطوة 3: التحقق مرة أخرى

بعد تشغيل المايجريشنز، شغل الفحص مرة أخرى:

```bash
mysql -u root -p FZ < check_migrations_status.sql
```

يجب أن تظهر كلها ✅ موجود

---

## ملاحظات مهمة:

1. **لا تشغل نفس المايجريشن مرتين** - سيظهر خطأ "Duplicate column"
2. **استخدم `check_migrations_status.sql` دائماً أولاً** - لتعرف ما يحتاج تشغيل
3. **لعمود shippingAmount** - استخدم `add_shipping_amount_to_invoice.sql` فقط (الآمن)

---

## إذا ظهر خطأ "Duplicate column":

هذا يعني أن العمود موجود بالفعل. **لا تقلق** - فقط تخطى هذا الملف وانتقل للآخر.

