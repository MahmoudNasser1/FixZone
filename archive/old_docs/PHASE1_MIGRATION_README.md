# 📦 دليل Migration Phase 1 - نظام المخزون

## 🎯 نظرة عامة

هذا الـ Migration يطبق جميع تحديثات قاعدة البيانات المطلوبة للمرحلة الأولى من خطة تطوير نظام المخزون.

---

## ⚠️ **مهم جداً: اقرأ قبل التنفيذ!**

### قبل تطبيق الـ Migration:

1. ✅ **عمل نسخة احتياطية كاملة من قاعدة البيانات**
2. ✅ **التأكد من إيقاف السيرفر أو عدم وجود مستخدمين نشطين**
3. ✅ **مراجعة الـ Migration قبل التطبيق**
4. ✅ **اختبار على قاعدة بيانات تجريبية أولاً (إن أمكن)**

---

## 📋 ما سيتم تنفيذه؟

### 1. تحديثات على الجداول الحالية:

#### Warehouse (المخازن):
- ✅ إضافة soft delete (deletedAt)
- ✅ إضافة timestamps (createdAt, updatedAt)
- ✅ إضافة managerId (مدير المخزن)
- ✅ إضافة capacity, type, address, phone, email
- ✅ 4 فهارس جديدة

#### InventoryItem (الأصناف):
- ✅ إضافة soft delete (deletedAt)
- ✅ إضافة barcode, partNumber
- ✅ إضافة brand, model, condition
- ✅ إضافة categoryId, preferredVendorId
- ✅ إضافة reorderPoint, reorderQuantity
- ✅ إضافة weight, dimensions, location
- ✅ إضافة image, notes, customFields
- ✅ 7 فهارس جديدة

#### Vendor (الموردين):
- ✅ إضافة soft delete (deletedAt)
- ✅ إضافة status (active, inactive, blocked)
- ✅ إضافة rating, totalPurchases
- ✅ إضافة creditLimit, currentBalance
- ✅ 3 فهارس جديدة

#### PurchaseOrder (أوامر الشراء):
- ✅ إضافة soft delete (deletedAt)
- ✅ إضافة taxRate, taxAmount, shippingCost
- ✅ إضافة discountAmount, finalAmount (محسوب)
- ✅ إضافة paymentStatus, paidAmount
- ✅ إضافة approvedBy, approvedAt
- ✅ 5 فهارس جديدة

#### StockMovement (الحركات):
- ✅ توسيع movementType (10 أنواع)
- ✅ إضافة toWarehouseId (للنقل)
- ✅ إضافة batchNumber, expiryDate
- ✅ 4 فهارس جديدة

---

### 2. الجداول الجديدة (9 جداول):

1. **InventoryItemCategory** - فئات الأصناف
2. **InventoryItemVendor** - موردين كل صنف
3. **StockTransfer** - نقل المخزون بين الفروع
4. **StockTransferItem** - عناصر النقل
5. **StockCount** - الجرد
6. **StockCountItem** - عناصر الجرد
7. **VendorPayment** - مدفوعات الموردين
8. **StockAlert** - تنبيهات المخزون
9. **BarcodeScan** - سجل مسح الباركود

---

### 3. البيانات الأساسية:

- ✅ 6 فئات أساسية للأصناف
- ✅ ربط الأصناف الموجودة بالفئات تلقائياً

---

### 4. تنظيف البيانات:

- ✅ حذف الأصناف التجريبية (TEST-*, DEMO-*)
- ✅ حذف مستويات المخزون المرتبطة

---

### 5. Views للاستعلامات:

- ✅ v_inventory_summary - ملخص المخزون الشامل
- ✅ v_low_stock_items - الأصناف المنخفضة
- ✅ v_stock_movements_detailed - الحركات التفصيلية

---

## 🚀 خطوات التنفيذ

### الطريقة 1: من Terminal (الموصى بها)

```bash
# 1. النسخ الاحتياطي أولاً!
mysqldump -u root -p FZ > backup_before_phase1_$(date +%Y%m%d_%H%M%S).sql

# 2. تطبيق الـ Migration
mysql -u root -p FZ < migrations/inventory_phase1_migration.sql

# 3. التحقق من النجاح
mysql -u root -p FZ -e "SELECT * FROM InventoryItemCategory;"
```

### الطريقة 2: من phpMyAdmin

1. افتح phpMyAdmin: http://localhost/phpmyadmin
2. اختر قاعدة البيانات `FZ`
3. اذهب لتبويب **Import**
4. اختر ملف `inventory_phase1_migration.sql`
5. اضغط **Go**

### الطريقة 3: من MySQL Workbench

1. افتح MySQL Workbench
2. اتصل بقاعدة البيانات
3. File → Open SQL Script
4. اختر `inventory_phase1_migration.sql`
5. Execute

---

## ✅ التحقق من النجاح

بعد تطبيق الـ Migration، نفذ هذه الاستعلامات للتحقق:

```sql
-- 1. التحقق من الجداول الجديدة
SELECT COUNT(*) as new_tables 
FROM information_schema.tables 
WHERE table_schema = 'FZ' 
  AND table_name IN (
    'InventoryItemCategory',
    'InventoryItemVendor',
    'StockTransfer',
    'StockTransferItem',
    'StockCount',
    'StockCountItem',
    'VendorPayment',
    'StockAlert',
    'BarcodeScan'
  );
-- يجب أن يرجع: 9

-- 2. التحقق من الأعمدة الجديدة في Warehouse
SHOW COLUMNS FROM Warehouse LIKE 'deletedAt';
SHOW COLUMNS FROM Warehouse LIKE 'managerId';

-- 3. التحقق من الأعمدة الجديدة في InventoryItem
SHOW COLUMNS FROM InventoryItem LIKE 'barcode';
SHOW COLUMNS FROM InventoryItem LIKE 'categoryId';

-- 4. التحقق من الفئات
SELECT * FROM InventoryItemCategory;
-- يجب أن يرجع: 6 فئات

-- 5. التحقق من Views
SHOW FULL TABLES WHERE table_type = 'VIEW';
-- يجب أن يظهر: v_inventory_summary, v_low_stock_items, v_stock_movements_detailed
```

---

## 🔧 استكشاف الأخطاء

### خطأ: "Duplicate column name"
**السبب:** العمود موجود مسبقاً  
**الحل:** تجاهل الخطأ، الـ Migration يستخدم `IF NOT EXISTS`

### خطأ: "Cannot add foreign key constraint"
**السبب:** بيانات موجودة لا تتوافق مع Foreign Key  
**الحل:** 
```sql
-- فحص البيانات المعلقة
SELECT * FROM InventoryItem WHERE categoryId IS NOT NULL 
  AND categoryId NOT IN (SELECT id FROM InventoryItemCategory);

-- تصحيح البيانات
UPDATE InventoryItem SET categoryId = NULL WHERE categoryId NOT IN (SELECT id FROM InventoryItemCategory);
```

### خطأ: "Table already exists"
**السبب:** الجدول موجود مسبقاً  
**الحل:** تجاهل الخطأ، الـ Migration يستخدم `IF NOT EXISTS`

---

## ⏪ التراجع عن الـ Migration (Rollback)

إذا حدث خطأ، يمكنك التراجع:

```bash
# استعادة النسخة الاحتياطية
mysql -u root -p FZ < backup_before_phase1_YYYYMMDD_HHMMSS.sql
```

أو يمكنك حذف التعديلات يدوياً:

```sql
-- حذف الجداول الجديدة
DROP TABLE IF EXISTS BarcodeScan;
DROP TABLE IF EXISTS StockAlert;
DROP TABLE IF EXISTS VendorPayment;
DROP TABLE IF EXISTS StockCountItem;
DROP TABLE IF EXISTS StockCount;
DROP TABLE IF EXISTS StockTransferItem;
DROP TABLE IF EXISTS StockTransfer;
DROP TABLE IF EXISTS InventoryItemVendor;
DROP TABLE IF EXISTS InventoryItemCategory;

-- حذف الأعمدة الجديدة (مثال)
ALTER TABLE Warehouse DROP COLUMN IF EXISTS deletedAt;
ALTER TABLE Warehouse DROP COLUMN IF EXISTS managerId;
-- ... إلخ
```

---

## 📊 الإحصائيات

### قبل Migration:
- الجداول: 8 جداول رئيسية
- الأعمدة في Warehouse: ~5
- الأعمدة في InventoryItem: ~10

### بعد Migration:
- الجداول: 17 جدول (8 قديمة + 9 جديدة)
- الأعمدة في Warehouse: ~15
- الأعمدة في InventoryItem: ~25
- Views: 3
- Fهارس جديدة: 25+

---

## 📝 ملاحظات مهمة

1. **الـ Migration آمن:** يستخدم `IF NOT EXISTS` لتجنب الأخطاء
2. **لا يحذف بيانات:** جميع البيانات الحالية محفوظة
3. **Soft Delete:** الحذف أصبح منطقي (soft) وليس فيزيائي
4. **الفهارس:** تم إضافة فهارس لتحسين الأداء
5. **Views:** مفيدة للتقارير والاستعلامات السريعة

---

## ⏭️ الخطوات التالية

بعد نجاح الـ Migration:

### اليوم 3-4 (القادم):
- [ ] إنشاء بيانات تجريبية واقعية
- [ ] إضافة موردين تجريبيين
- [ ] إضافة أصناف متنوعة

### اليوم 5-7:
- [ ] تحديث Backend APIs
- [ ] إضافة Validation
- [ ] توحيد Error Handling

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. راجع قسم "استكشاف الأخطاء" أعلاه
2. تحقق من الـ logs:
   ```bash
   tail -f /var/log/mysql/error.log
   ```
3. راجع الخطة الكاملة في:
   `/opt/lampp/htdocs/FixZone/InventoryModulePlan/`

---

## ✅ Checklist

- [ ] قرأت جميع التعليمات
- [ ] عملت نسخة احتياطية
- [ ] أوقفت السيرفر/تأكدت من عدم وجود مستخدمين
- [ ] طبقت الـ Migration
- [ ] تحققت من النجاح
- [ ] جربت الاستعلامات الأساسية
- [ ] البيانات سليمة ✅

---

**التاريخ:** 2 أكتوبر 2025  
**النسخة:** 1.0  
**الحالة:** ✅ جاهز للتطبيق

**الخطوة التالية:** تطبيق الـ Migration! 🚀

