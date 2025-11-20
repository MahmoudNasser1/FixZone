# 🚀 دليل البدء السريع - Quick Start Guide

---

## ✅ تم الاستيراد بنجاح!

جميع البيانات من النظام القديم موجودة الآن في النظام الجديد.

---

## 📊 ما تم استيراده

- ✅ **962 عميل** من 965 (تم استبعاد 3 محذوفين)
- ✅ **49 قيمة مساعدة** (ماركات، أنواع أجهزة، ملحقات، إلخ)
- ✅ **1,265 جهاز** من 1,268 (تم استبعاد 3 محذوفة)
- ✅ **1,265 طلب إصلاح** من 1,268

---

## 🔍 كيف أتحقق من البيانات؟

### عبر الواجهة:
1. افتح المتصفح: `http://localhost:3000`
2. سجل دخول بحساب Admin
3. اذهب إلى:
   - **العملاء** → سترى 962 عميل
   - **الإصلاحات** → سترى 1,265 طلب
   - **الأجهزة** → سترى 1,265 جهاز

### عبر قاعدة البيانات:
```bash
/opt/lampp/bin/mysql -u root FZ -e "
  SELECT 'العملاء' as 'البيان', COUNT(*) as 'العدد' FROM Customer WHERE deletedAt IS NULL
  UNION ALL SELECT 'الأجهزة', COUNT(*) FROM Device WHERE deletedAt IS NULL
  UNION ALL SELECT 'طلبات الإصلاح', COUNT(*) FROM RepairRequest WHERE deletedAt IS NULL;
"
```

---

## 🔗 كيف أجد البيانات القديمة؟

كل سجل محفوظ فيه المرجع القديم في حقل `customFields`:

### مثال - البحث عن عميل قديم برقم 123:
```sql
SELECT * FROM Customer 
WHERE JSON_EXTRACT(customFields, '$.old_system_id') = 123;
```

### مثال - البحث عن فاتورة قديمة برقم 456:
```sql
SELECT * FROM RepairRequest 
WHERE JSON_EXTRACT(customFields, '$.old_invoice_id') = 456;
```

---

## 📋 عينة من البيانات

### عرض آخر 10 طلبات إصلاح:
```sql
SELECT 
  rr.requestNumber as 'رقم الطلب',
  c.name as 'العميل',
  c.phone as 'الهاتف',
  CONCAT(d.brand, ' ', d.model) as 'الجهاز',
  rr.status as 'الحالة',
  rr.estimatedCost as 'التكلفة'
FROM RepairRequest rr
JOIN Customer c ON c.id = rr.customerId
JOIN Device d ON d.id = rr.deviceId
ORDER BY rr.id DESC
LIMIT 10;
```

---

## 📞 أين أجد المزيد من المعلومات؟

- **الملخص الكامل:** `/DATA_IMPORT_SUMMARY.md`
- **الدليل التفصيلي:** `backend/scripts/migration/README.md`
- **الخطة الأصلية:** `backend/scripts/migration/DATA_IMPORT_PLAN.md`

---

## ⚙️ استعلامات مفيدة

### 1. توزيع الحالات:
```sql
SELECT status, COUNT(*) as count FROM RepairRequest 
GROUP BY status ORDER BY count DESC;
```

### 2. أكثر الماركات:
```sql
SELECT brand, COUNT(*) as count FROM Device 
WHERE brand IS NOT NULL 
GROUP BY brand ORDER BY count DESC LIMIT 10;
```

### 3. العملاء الأكثر نشاطاً:
```sql
SELECT 
  c.name,
  c.phone,
  COUNT(rr.id) as total_repairs
FROM Customer c
JOIN RepairRequest rr ON rr.customerId = c.id
GROUP BY c.id
ORDER BY total_repairs DESC
LIMIT 10;
```

---

## 🎉 تهانينا!

تم استيراد جميع بياناتك بنجاح من النظام القديم إلى النظام الجديد!

---

**التاريخ:** 21 نوفمبر 2025  
**الحالة:** ✅ جاهز للاستخدام
