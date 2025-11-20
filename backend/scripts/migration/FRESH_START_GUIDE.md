# 🔄 دليل البدء من جديد - Fresh Start Guide

📅 **التاريخ:** 21 نوفمبر 2025

---

## 🎯 الهدف

هذا الدليل يشرح كيفية **إعادة تعيين قاعدة البيانات بالكامل** والبدء من صفر مع استيراد البيانات من النظام القديم فقط، بدون أي بيانات اختبار.

---

## ⚠️ تحذير هام

**هذه العملية ستحذف جميع البيانات الحالية في قاعدة البيانات!**

تأكد من:
- ✅ عمل نسخة احتياطية (backup) من القاعدة الحالية
- ✅ أنك تريد فعلاً حذف جميع البيانات
- ✅ أن ملف النظام القديم موجود في المكان الصحيح

---

## 📋 الخطوات الكاملة

### الخطوة 0: النسخ الاحتياطي (اختياري ولكن موصى به)

```bash
# إنشاء نسخة احتياطية من القاعدة الحالية
/opt/lampp/bin/mysqldump -u root FZ > /opt/lampp/htdocs/FixZone/backup_before_reset_$(date +%Y%m%d_%H%M%S).sql

# التحقق من النسخة الاحتياطية
ls -lh /opt/lampp/htdocs/FixZone/backup_*.sql
```

---

### الخطوة 1: إعادة تعيين قاعدة البيانات

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts/migration

# تشغيل سكريبت إعادة التعيين
node 0_reset_database.js
```

**النتيجة المتوقعة:**
```
🔄 بدء إعادة تعيين قاعدة البيانات...
✅ تم الاتصال بقاعدة البيانات
⚙️  تم تعطيل فحص المفاتيح الخارجية مؤقتاً

📋 الجداول المراد إعادة تعيينها:
   ✅ RepairRequest - تم حذف X سجل
   ✅ Device - تم حذف X سجل
   ✅ Customer - تم حذف X سجل
   ...

✅ تم إعادة تعيين قاعدة البيانات بنجاح!
```

---

### الخطوة 2: استخراج البيانات من النظام القديم

```bash
# تأكد من وجود ملف النظام القديم
ls -lh /opt/lampp/htdocs/FixZone/IN/FZ\ Data\ From\ Old\ System*.sql

# استخراج البيانات
node 1_extract_old_data.js
```

**النتيجة المتوقعة:**
```
✅ تم استخراج 965 عميل
✅ تم استخراج 1,268 فاتورة
✅ تم استخراج 49 قيمة مساعدة
```

---

### الخطوة 3: تحويل البيانات

```bash
node 2_transform_data.js
```

**النتيجة المتوقعة:**
```
✅ تم تحويل 962 عميل
✅ تم تحويل 49 قيمة مساعدة
💾 تم حفظ ملفات SQL
```

---

### الخطوة 4: استيراد القيم المساعدة

```bash
cd /opt/lampp/htdocs/FixZone

/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/4_import_lookups.sql
```

**التحقق:**
```bash
/opt/lampp/bin/mysql -u root FZ -e "
  SELECT 
    'VariableCategory' as 'الجدول', 
    COUNT(*) as 'العدد' 
  FROM VariableCategory
  UNION ALL
  SELECT 'VariableOption', COUNT(*) FROM VariableOption;
"
```

---

### الخطوة 5: استيراد العملاء

```bash
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/5_import_customers.sql
```

**التحقق:**
```bash
/opt/lampp/bin/mysql -u root FZ -e "
  SELECT COUNT(*) as 'عدد العملاء' 
  FROM Customer 
  WHERE deletedAt IS NULL;
"
```

---

### الخطوة 6: تحويل واستيراد الأجهزة وطلبات الإصلاح

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts/migration

# تحويل البيانات
node 3_transform_repairs.js

# استيراد الأجهزة
cd /opt/lampp/htdocs/FixZone
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/6_import_devices.sql

# استيراد طلبات الإصلاح
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/7_import_repairs.sql
```

**التحقق النهائي:**
```bash
/opt/lampp/bin/mysql -u root FZ -e "
  SELECT 
    'العملاء' as 'البيان', 
    COUNT(*) as 'العدد' 
  FROM Customer WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'الأجهزة', COUNT(*) FROM Device WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'طلبات الإصلاح', COUNT(*) FROM RepairRequest WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'القيم المساعدة', COUNT(*) FROM VariableOption;
"
```

---

## 🚀 سكريبت واحد لكل شيء

إذا أردت تنفيذ جميع الخطوات دفعة واحدة:

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts/migration

# إنشاء سكريبت bash
cat > fresh_import.sh << 'EOF'
#!/bin/bash

echo "🔄 بدء الاستيراد الكامل من الصفر..."
echo ""

# الخطوة 1: Reset
echo "1️⃣ إعادة تعيين قاعدة البيانات..."
node 0_reset_database.js || exit 1
echo ""

# الخطوة 2: Extract
echo "2️⃣ استخراج البيانات..."
node 1_extract_old_data.js || exit 1
echo ""

# الخطوة 3: Transform
echo "3️⃣ تحويل البيانات..."
node 2_transform_data.js || exit 1
echo ""

# الخطوة 4: Import Lookups
echo "4️⃣ استيراد القيم المساعدة..."
/opt/lampp/bin/mysql -u root FZ < import_sql/4_import_lookups.sql || exit 1
echo ""

# الخطوة 5: Import Customers
echo "5️⃣ استيراد العملاء..."
/opt/lampp/bin/mysql -u root FZ < import_sql/5_import_customers.sql || exit 1
echo ""

# الخطوة 6: Transform Repairs
echo "6️⃣ تحويل الأجهزة وطلبات الإصلاح..."
node 3_transform_repairs.js || exit 1
echo ""

# الخطوة 7: Import Devices
echo "7️⃣ استيراد الأجهزة..."
/opt/lampp/bin/mysql -u root FZ < import_sql/6_import_devices.sql || exit 1
echo ""

# الخطوة 8: Import Repairs
echo "8️⃣ استيراد طلبات الإصلاح..."
/opt/lampp/bin/mysql -u root FZ < import_sql/7_import_repairs.sql || exit 1
echo ""

# الخطوة 9: Verify
echo "9️⃣ التحقق من النتائج..."
/opt/lampp/bin/mysql -u root FZ -e "
  SELECT 
    'العملاء' as 'البيان', 
    COUNT(*) as 'العدد' 
  FROM Customer WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'الأجهزة', COUNT(*) FROM Device WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'طلبات الإصلاح', COUNT(*) FROM RepairRequest WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'القيم المساعدة', COUNT(*) FROM VariableOption;
"

echo ""
echo "═══════════════════════════════════════════"
echo "✅ تم الاستيراد الكامل بنجاح!"
echo "═══════════════════════════════════════════"
EOF

# منح صلاحيات التنفيذ
chmod +x fresh_import.sh

# تشغيل السكريبت
./fresh_import.sh
```

---

## 📊 النتائج المتوقعة

بعد انتهاء جميع الخطوات، يجب أن تحصل على:

| البيان | العدد المتوقع |
|--------|---------------|
| العملاء | 962 |
| القيم المساعدة | 49 |
| الفئات | 7 |
| الأجهزة | يعتمد على البيانات الصحيحة |
| طلبات الإصلاح | يعتمد على البيانات الصحيحة |

---

## ⚠️ معالجة المشاكل

### المشكلة: "Table doesn't exist"

**الحل:**
```bash
# تأكد من أن قاعدة البيانات موجودة
/opt/lampp/bin/mysql -u root -e "SHOW DATABASES LIKE 'FZ';"

# إذا لم تكن موجودة، أنشئها
/opt/lampp/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS FZ;"

# تشغيل ملف Schema
/opt/lampp/bin/mysql -u root FZ < /opt/lampp/htdocs/FixZone/migrations/01_COMPLETE_SCHEMA.sql
```

---

### المشكلة: "Foreign key constraint fails"

**الحل:**
```bash
# تعطيل فحص المفاتيح الخارجية مؤقتاً
/opt/lampp/bin/mysql -u root FZ -e "SET FOREIGN_KEY_CHECKS = 0;"

# إعادة تشغيل الاستيراد
# ...

# إعادة تفعيل الفحص
/opt/lampp/bin/mysql -u root FZ -e "SET FOREIGN_KEY_CHECKS = 1;"
```

---

### المشكلة: "Duplicate entry"

**الحل:**
```bash
# إعادة تشغيل reset
node 0_reset_database.js

# البدء من جديد
```

---

## 🎯 الأوامر السريعة

### عرض إحصائيات سريعة:

```bash
/opt/lampp/bin/mysql -u root FZ -e "
  SELECT 
    'العملاء' as 'البيان', 
    COUNT(*) as 'العدد' 
  FROM Customer WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'الأجهزة', COUNT(*) FROM Device WHERE deletedAt IS NULL
  UNION ALL
  SELECT 'طلبات الإصلاح', COUNT(*) FROM RepairRequest WHERE deletedAt IS NULL;
"
```

### حذف بيانات معينة فقط:

```bash
# حذف العملاء المستوردين فقط
/opt/lampp/bin/mysql -u root FZ -e "
  DELETE FROM Customer 
  WHERE JSON_EXTRACT(customFields, '$.old_system_id') IS NOT NULL;
"

# حذف القيم المساعدة المستوردة فقط
/opt/lampp/bin/mysql -u root FZ -e "
  DELETE FROM VariableOption 
  WHERE categoryId IN (
    SELECT id FROM VariableCategory 
    WHERE code IN ('brand','deviceType','accessories','examination')
  );
"
```

---

## 📚 المراجع

- **الدليل الكامل:** `backend/scripts/migration/README.md`
- **البدء السريع:** `backend/scripts/migration/QUICK_START.md`
- **الإرشادات بالعربية:** `backend/scripts/migration/إرشادات_الاستيراد.md`
- **الملخص النهائي:** `DATA_IMPORT_SUMMARY.md`

---

## ✅ قائمة التحقق

قبل البدء:
- [ ] عمل نسخة احتياطية من القاعدة الحالية
- [ ] التأكد من وجود ملف النظام القديم
- [ ] التأكد من أن الخادم يعمل

أثناء التنفيذ:
- [ ] إعادة تعيين قاعدة البيانات
- [ ] استخراج البيانات
- [ ] تحويل البيانات
- [ ] استيراد القيم المساعدة
- [ ] استيراد العملاء
- [ ] استيراد الأجهزة وطلبات الإصلاح
- [ ] التحقق من النتائج

بعد الانتهاء:
- [ ] التحقق من الإحصائيات
- [ ] اختبار النظام من الواجهة
- [ ] التأكد من العلاقات بين الجداول

---

**آخر تحديث:** 21 نوفمبر 2025  
**الحالة:** ✅ جاهز للاستخدام

