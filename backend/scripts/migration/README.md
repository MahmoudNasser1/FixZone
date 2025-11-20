# دليل استيراد البيانات من النظام القديم
# Data Import Guide from Old System

📅 **التاريخ:** 21 نوفمبر 2025  
✅ **الحالة:** مكتمل بنجاح

---

## 🎯 نظرة عامة

هذا الدليل يشرح كيفية استيراد البيانات من النظام القديم (u539485933_maintain) إلى النظام الجديد (FixZone).

تم استيراد:
- ✅ 962 عميل
- ✅ 49 قيمة مساعدة (Lookups)
- ✅ 1,265 جهاز
- ✅ 1,265 طلب إصلاح

---

## 📁 هيكل المجلد

```
backend/scripts/migration/
├── README.md                      هذا الملف
├── DATA_IMPORT_PLAN.md            الخطة التفصيلية
├── IMPORT_PROGRESS_REPORT.md      تقرير التقدم
│
├── 1_extract_old_data.js          استخراج البيانات من SQL
├── 2_transform_data.js            تحويل العملاء والقيم
├── 3_transform_repairs.js         تحويل الأجهزة والطلبات
│
├── extracted_data/                البيانات المستخرجة (JSON)
│   ├── _summary.json
│   ├── clients.json
│   ├── workorders.json
│   ├── lookups.json
│   ├── branches.json
│   └── invoices.json
│
└── import_sql/                    ملفات SQL للاستيراد
    ├── 4_import_lookups.sql
    ├── 5_import_customers.sql
    ├── 6_import_devices.sql
    └── 7_import_repairs.sql
```

---

## 🚀 خطوات الاستيراد

### الخطوة 0: إعادة تعيين قاعدة البيانات (اختياري)

**⚠️ هذه الخطوة ستحذف جميع البيانات الحالية!**

إذا أردت البدء بقاعدة بيانات نظيفة بدون بيانات اختبار:

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts/migration

# عمل نسخة احتياطية أولاً (موصى به!)
/opt/lampp/bin/mysqldump -u root FZ > ../../../backup_before_reset_$(date +%Y%m%d_%H%M%S).sql

# إعادة تعيين قاعدة البيانات
node 0_reset_database.js
```

**النتيجة:**
- قاعدة بيانات نظيفة
- جداول فارغة
- جاهزة للاستيراد

**📄 للمزيد من التفاصيل:** راجع `FRESH_START_GUIDE.md`

---

### الخطوة 1: استخراج البيانات

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts/migration
node 1_extract_old_data.js
```

**الناتج:**
- ملفات JSON في `extracted_data/`
- ملخص في `extracted_data/_summary.json`

---

### الخطوة 2: تحويل العملاء والقيم المساعدة

```bash
node 2_transform_data.js
```

**الناتج:**
- `import_sql/4_import_lookups.sql` - القيم المساعدة
- `import_sql/5_import_customers.sql` - العملاء

---

### الخطوة 3: استيراد القيم المساعدة

```bash
cd /opt/lampp/htdocs/FixZone
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/4_import_lookups.sql
```

**التحقق:**
```bash
/opt/lampp/bin/mysql -u root FZ -e "SELECT COUNT(*) FROM VariableCategory;"
/opt/lampp/bin/mysql -u root FZ -e "SELECT COUNT(*) FROM VariableOption;"
```

---

### الخطوة 4: استيراد العملاء

```bash
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/5_import_customers.sql
```

**التحقق:**
```bash
/opt/lampp/bin/mysql -u root FZ -e "SELECT COUNT(*) FROM Customer WHERE deletedAt IS NULL;"
```

---

### الخطوة 5: تحويل الأجهزة وطلبات الإصلاح

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts/migration
node 3_transform_repairs.js
```

**الناتج:**
- `import_sql/6_import_devices.sql` - الأجهزة
- `import_sql/7_import_repairs.sql` - طلبات الإصلاح

---

### الخطوة 6: استيراد الأجهزة

```bash
cd /opt/lampp/htdocs/FixZone
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/6_import_devices.sql
```

**التحقق:**
```bash
/opt/lampp/bin/mysql -u root FZ -e "SELECT COUNT(*) FROM Device WHERE deletedAt IS NULL;"
```

---

### الخطوة 7: استيراد طلبات الإصلاح

```bash
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/7_import_repairs.sql
```

**التحقق:**
```bash
/opt/lampp/bin/mysql -u root FZ -e "SELECT COUNT(*) FROM RepairRequest WHERE deletedAt IS NULL;"
```

---

## 🔍 استعلامات التحقق

### 1. الإحصائيات الشاملة:

```sql
SELECT 'Customer' as 'الجدول', COUNT(*) as 'العدد' 
FROM Customer WHERE deletedAt IS NULL
UNION ALL
SELECT 'Device', COUNT(*) 
FROM Device WHERE deletedAt IS NULL
UNION ALL
SELECT 'RepairRequest', COUNT(*) 
FROM RepairRequest WHERE deletedAt IS NULL
UNION ALL
SELECT 'VariableOption', COUNT(*) 
FROM VariableOption;
```

---

### 2. التحقق من العلاقات:

```sql
-- أجهزة بدون عملاء (يجب أن يكون 0)
SELECT COUNT(*) as 'Devices without Customer'
FROM Device d 
WHERE d.customerId NOT IN (SELECT id FROM Customer);

-- طلبات بدون أجهزة (يجب أن يكون 0)
SELECT COUNT(*) as 'Requests without Device'
FROM RepairRequest rr 
WHERE rr.deviceId NOT IN (SELECT id FROM Device);

-- طلبات بدون عملاء (يجب أن يكون 0)
SELECT COUNT(*) as 'Requests without Customer'
FROM RepairRequest rr 
WHERE rr.customerId NOT IN (SELECT id FROM Customer);
```

---

### 3. عينة من البيانات:

```sql
SELECT 
  rr.id,
  rr.requestNumber,
  c.name as customer,
  c.phone,
  d.brand,
  d.model,
  d.serialNumber,
  rr.status,
  rr.problemDescription,
  rr.estimatedCost,
  rr.finalCost,
  rr.receivedAt
FROM RepairRequest rr
JOIN Customer c ON c.id = rr.customerId
JOIN Device d ON d.id = rr.deviceId
ORDER BY rr.id DESC
LIMIT 10;
```

---

### 4. توزيع الحالات:

```sql
SELECT 
  status as 'الحالة',
  COUNT(*) as 'العدد',
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM RepairRequest), 2) as 'النسبة %'
FROM RepairRequest
GROUP BY status
ORDER BY COUNT(*) DESC;
```

---

### 5. أكثر الماركات استخداماً:

```sql
SELECT 
  d.brand as 'الماركة',
  COUNT(*) as 'العدد'
FROM Device d
WHERE d.brand IS NOT NULL
GROUP BY d.brand
ORDER BY COUNT(*) DESC
LIMIT 10;
```

---

## 🗺️ ربط الجداول

### النظام القديم → النظام الجديد

| الجدول القديم | الجدول الجديد | الحقل المرجعي |
|---------------|---------------|---------------|
| `clients` | `Customer` | `customFields.old_system_id` |
| `lookups` | `VariableOption` | - |
| `invoices` | `Device` + `RepairRequest` | `customFields.old_invoice_id` |
| `workorders` | `RepairRequest` | - |

---

## 📋 customFields Structure

### Customer:
```json
{
  "old_system_id": 123,
  "price_type": "1",
  "balance": 0,
  "imported_at": "2025-11-21T00:00:00.000Z"
}
```

### Device:
```json
{
  "cpu": "Intel i5",
  "gpu": "Intel HD",
  "ram": "8GB",
  "storage": "256GB SSD",
  "old_system_id": 456,
  "imported_at": "2025-11-21T00:00:00.000Z"
}
```

### RepairRequest:
```json
{
  "old_invoice_id": 789,
  "old_client_id": 123,
  "payment_status": "paid",
  "price_type": "1",
  "imported_at": "2025-11-21T00:00:00.000Z"
}
```

---

## 🔄 إعادة الاستيراد

إذا أردت إعادة الاستيراد من جديد:

### 1. حذف البيانات المستوردة:

```sql
-- حذف طلبات الإصلاح المستوردة
DELETE FROM RepairRequest 
WHERE JSON_EXTRACT(customFields, '$.old_invoice_id') IS NOT NULL;

-- حذف الأجهزة المستوردة
DELETE FROM Device 
WHERE JSON_EXTRACT(specs, '$.old_system_id') IS NOT NULL;

-- حذف العملاء المستوردين
DELETE FROM Customer 
WHERE JSON_EXTRACT(customFields, '$.old_system_id') IS NOT NULL;

-- حذف القيم المساعدة
DELETE FROM VariableOption 
WHERE categoryId IN (
  SELECT id FROM VariableCategory 
  WHERE code IN ('brand','deviceType','accessories','examination','problem','specifcations','category')
);
```

### 2. إعادة تشغيل السكريبتات:

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts/migration

# تحويل البيانات
node 2_transform_data.js
node 3_transform_repairs.js

# استيراد البيانات
cd /opt/lampp/htdocs/FixZone
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/4_import_lookups.sql
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/5_import_customers.sql
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/6_import_devices.sql
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/7_import_repairs.sql
```

---

## ⚠️ ملاحظات هامة

1. **النسخ الاحتياطي:** تأكد من عمل backup للقاعدة قبل الاستيراد
2. **الترتيب:** يجب تنفيذ الخطوات بالترتيب المذكور
3. **المراجع القديمة:** محفوظة في `customFields` للرجوع إليها
4. **البيانات المحذوفة:** تم استبعاد السجلات المحذوفة من النظام القديم

---

## 📚 المراجع

- **الخطة التفصيلية:** `DATA_IMPORT_PLAN.md`
- **تقرير التقدم:** `IMPORT_PROGRESS_REPORT.md`
- **الملخص النهائي:** `/DATA_IMPORT_SUMMARY.md`
- **ملف SQL القديم:** `/IN/FZ Data From Old System 2025-11-20_u539485933_maintain_dump.sql`

---

## 🎉 النتيجة النهائية

✅ **962 عميل** تم استيرادهم بنجاح  
✅ **49 قيمة مساعدة** تم استيرادها  
✅ **1,265 جهاز** تم استيراده  
✅ **1,265 طلب إصلاح** تم استيراده  
✅ **جميع العلاقات سليمة** ومحفوظة  

---

**آخر تحديث:** 21 نوفمبر 2025  
**الحالة:** ✅ مكتمل بنجاح
