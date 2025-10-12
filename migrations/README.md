# 🗄️ **Database Migrations - Fix Zone ERP**

## 📅 **آخر تحديث: 10 أكتوبر 2025**

---

```
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║              🗄️ ملفات قاعدة البيانات المنظمة 🗄️                     ║
║                                                                        ║
║  4 ملفات رئيسية - واضحة ومنظمة ومختبرة                             ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

# 📁 **الملفات الرئيسية**

## **📄 01_COMPLETE_SCHEMA.sql** (55K)
**الوصف:** Schema كامل لجميع جداول النظام (55 جدول)

**الاستخدام:**
```bash
# إنشاء قاعدة بيانات جديدة من الصفر
mysql -u root < migrations/01_COMPLETE_SCHEMA.sql
```

**يحتوي على:**
- ✅ 55 جدول كامل
- ✅ جميع الـ Indexes
- ✅ جميع الـ Foreign Keys
- ✅ Settings صحيحة

**الأقسام:**
1. Authentication & Users (Role, User, UserLoginLog)
2. Core Business (Customer, Company, Branch, City)
3. Inventory Management (InventoryItem, Warehouse, StockLevel, etc.)
4. Repair & Service (RepairRequest, Service, Invoice, Payment)
5. Financial (Expense, PurchaseOrder, Quotation)
6. System (Notification, AuditLog, SystemSetting)

---

## **📄 02_SAMPLE_DATA.sql** (3.9K)
**الوصف:** بيانات تجريبية للعرض والتدريب

**الاستخدام:**
```bash
# بعد إنشاء Schema
mysql -u root FZ < migrations/02_SAMPLE_DATA.sql
```

**يحتوي على:**
- ✅ 3 Roles (Admin, Manager, Employee)
- ✅ 1 Admin User (admin@fixzone.com / password)
- ✅ 5 Inventory Categories
- ✅ 10 Inventory Items
- ✅ 4 Warehouses
- ✅ 14 Stock Levels
- ✅ 3 Stock Movements

**الغرض:** للعرض التوضيحي والتدريب

---

## **📄 03_TEST_DATA.sql** (1.9K)
**الوصف:** بيانات اختبار للتطوير

**الاستخدام:**
```bash
# للتطوير والاختبار فقط
mysql -u root FZ < migrations/03_TEST_DATA.sql
```

**يحتوي على:**
- ✅ 3 Test Customers
- ✅ 2 Test Companies
- ✅ Additional Stock Movements

**⚠️ تحذير:** للتطوير فقط - لا تستخدم في الإنتاج!

---

## **📄 04_FIXES_AND_UPDATES.sql** (5.7K)
**الوصف:** تحديثات وإصلاحات تدريجية

**الاستخدام:**
```bash
# تطبيق على قاعدة بيانات موجودة
mysql -u root FZ < migrations/04_FIXES_AND_UPDATES.sql
```

**يحتوي على:**
- ✅ ALTER TABLE statements آمنة
- ✅ إضافة أعمدة جديدة (IF NOT EXISTS)
- ✅ إنشاء جداول Phase 2 (IF NOT EXISTS)
- ✅ آمن للتشغيل المتكرر

**الغرض:** تحديث قاعدة موجودة بدون فقدان البيانات

---

## **📄 05_REPAIR_MODULE_ENHANCEMENT.sql** ⭐ جديد! (54K)
**الوصف:** تحسينات شاملة لموديول الصيانة

**الاستخدام:**
```bash
# تطبيق على قاعدة بيانات موجودة (بعد 01-04)
mysql -u root FZ < migrations/05_REPAIR_MODULE_ENHANCEMENT.sql
```

**يحتوي على:**
- ✅ تحديث 3 جداول (RepairRequest, PartsUsed, RepairRequestService)
- ✅ إضافة 10 جداول جديدة
- ✅ 6 Triggers للحسابات التلقائية
- ✅ 6 Views للاستعلامات المعقدة
- ✅ 1 Stored Procedure
- ✅ Data Migration آمن

**الجداول الجديدة:**
1. RepairWorkflow - سجل مراحل العمل
2. RepairPartsApproval - موافقات القطع
3. RepairNotificationLog - سجل الإشعارات
4. RepairCostBreakdown - تفصيل التكاليف
5. RepairDeviceHistory - تاريخ الأجهزة
6. RepairQuotationEnhanced - عروض الأسعار
7. RepairQualityCheck - فحص الجودة
8. RepairTimeLog - سجل الوقت
9. RepairChecklistTemplate - قوالب الفحص
10. RepairCustomerFeedback - تقييمات العملاء

**الغرض:** تطوير موديول الصيانة ليصبح متكاملاً مع CRM + Inventory + Finance

---

# 🚀 **دليل الاستخدام**

## **سيناريو 1: إعداد قاعدة بيانات جديدة**

### **الخطوات:**
```bash
# 1. إنشاء Schema
mysql -u root < migrations/01_COMPLETE_SCHEMA.sql

# 2. إضافة بيانات تجريبية
mysql -u root FZ < migrations/02_SAMPLE_DATA.sql

# 3. (اختياري) إضافة بيانات اختبار
mysql -u root FZ < migrations/03_TEST_DATA.sql

# 4. التحقق
mysql -u root FZ -e "SHOW TABLES;"
mysql -u root FZ -e "SELECT * FROM User;"
```

**الوقت:** 2-3 دقائق  
**النتيجة:** قاعدة بيانات جاهزة بالكامل ✅

---

## **سيناريو 2: تحديث قاعدة بيانات موجودة**

### **الخطوات:**
```bash
# 1. نسخة احتياطية أولاً!
mysqldump -u root FZ > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 2. تطبيق التحديثات
mysql -u root FZ < migrations/04_FIXES_AND_UPDATES.sql

# 3. التحقق
mysql -u root FZ -e "SHOW TABLES;"
```

**الوقت:** 1 دقيقة  
**النتيجة:** قاعدة بيانات محدثة ✅

---

## **سيناريو 3: إعادة بناء كاملة**

### **الخطوات:**
```bash
# 1. نسخة احتياطية
mysqldump -u root FZ > backups/backup_before_rebuild.sql

# 2. حذف القاعدة القديمة
mysql -u root -e "DROP DATABASE IF EXISTS FZ;"

# 3. إنشاء جديدة
mysql -u root < migrations/01_COMPLETE_SCHEMA.sql
mysql -u root FZ < migrations/02_SAMPLE_DATA.sql

# 4. التحقق
mysql -u root FZ -e "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema='FZ';"
```

**الوقت:** 3-4 دقائق  
**النتيجة:** قاعدة بيانات نظيفة تماماً ✅

---

## **سيناريو 4: تطبيق تحسينات الصيانة** ⭐ جديد!

### **الخطوات:**
```bash
# 1. نسخة احتياطية (ضروري!)
mysqldump -u root FZ > backups/backup_before_repair_enhancement_$(date +%Y%m%d_%H%M%S).sql

# 2. تطبيق التحسينات
mysql -u root FZ < migrations/05_REPAIR_MODULE_ENHANCEMENT.sql

# 3. التحقق من الجداول الجديدة
mysql -u root FZ -e "SHOW TABLES LIKE 'Repair%';"
# المتوقع: 13 جدول

# 4. التحقق من الـ Views
mysql -u root FZ -e "SHOW FULL TABLES WHERE table_type='VIEW' AND Tables_in_FZ LIKE 'v_repair%';"
# المتوقع: 6 views

# 5. التحقق من الـ Triggers
mysql -u root FZ -e "SHOW TRIGGERS WHERE \`Trigger\` LIKE '%repair%';"
# المتوقع: 6 triggers

# 6. اختبار View
mysql -u root FZ -e "SELECT * FROM v_repair_summary LIMIT 5;"
```

**الوقت:** 2-3 دقائق  
**النتيجة:** موديول الصيانة محسّن بالكامل ✅

---

# 📊 **معلومات Schema**

## **الجداول (65+ جدول):**

### **Authentication (3):**
- Role, User, UserLoginLog

### **Core Business (4):**
- Customer, Company, Branch, City

### **Inventory (11):**
- InventoryItem, InventoryItemCategory, InventoryItemVendor
- Warehouse, StockLevel, StockMovement
- StockCount, StockCountItem
- StockTransfer, StockTransferItem
- BarcodeScan

### **Repair & Service (17):** ⭐ محسّن!
**الجداول الأساسية:**
- RepairRequest, RepairRequestService, RepairRequestAccessory
- Service, Device, DeviceBatch
- PartsUsed

**الجداول الجديدة (10):** 🆕
- RepairWorkflow - سجل دورة العمل
- RepairPartsApproval - موافقات القطع
- RepairNotificationLog - سجل الإشعارات
- RepairCostBreakdown - تفصيل التكاليف
- RepairDeviceHistory - تاريخ الأجهزة
- RepairQuotationEnhanced - عروض الأسعار المحسّنة
- RepairQualityCheck - فحص الجودة
- RepairTimeLog - سجل الوقت
- RepairChecklistTemplate - قوالب الفحص
- RepairCustomerFeedback - تقييمات العملاء

### **Financial (9):**
- Invoice, InvoiceItem, InvoiceTemplate
- Payment, Quotation, QuotationItem
- Expense, ExpenseCategory
- PurchaseOrder, PurchaseOrderItem

### **System (7):**
- Notification, NotificationTemplate
- AuditLog, SystemSetting, StatusUpdateLog
- VariableCategory, VariableOption

### **Other (9):**
- Vendor, VendorPayment
- InspectionType, InspectionReport, InspectionComponent
- activity_log
- StockAlert

### **Views (11+ views):**
**Inventory Views:**
- v_current_stock
- v_inventory_summary
- v_low_stock_alerts
- v_low_stock_items
- v_stock_movements_detailed
- v_warehouse_inventory_value

**Repair Views (6 جديدة):** 🆕
- v_repair_summary
- v_repair_pending_approvals
- v_repair_technician_performance
- v_repair_parts_usage
- v_repair_timeline
- v_repair_cost_analysis

---

# 🧪 **الاختبار**

## **التحقق من النجاح:**

```bash
# 1. عدد الجداول
mysql -u root FZ -e "SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema='FZ';"
# المتوقع: 55+

# 2. البيانات التجريبية
mysql -u root FZ -e "SELECT COUNT(*) FROM Role;"
# المتوقع: 3

mysql -u root FZ -e "SELECT COUNT(*) FROM InventoryItem;"
# المتوقع: 10

mysql -u root FZ -e "SELECT COUNT(*) FROM Warehouse;"
# المتوقع: 4

# 3. التحقق من User
mysql -u root FZ -e "SELECT id, name, email FROM User WHERE id=2;"
# المتوقع: Admin User
```

---

# 📂 **هيكل المجلد**

```
migrations/
│
├── README.md                          [هذا الملف - ⭐ ابدأ هنا]
│
├── 01_COMPLETE_SCHEMA.sql            [⭐⭐⭐ Schema كامل]
├── 02_SAMPLE_DATA.sql                [⭐⭐ بيانات تجريبية]
├── 03_TEST_DATA.sql                  [⭐ بيانات اختبار]
├── 04_FIXES_AND_UPDATES.sql          [⭐ تحديثات]
│
├── 📂 backups/                        [نسخ احتياطية]
│   └── [backup files]
│
└── 📂 archive/                        [ملفات قديمة]
    ├── old_migrations/               [13 ملف مؤرشف]
    └── old/                          [ملفات أقدم]
```

---

# ⚠️ **ملاحظات مهمة**

## **قبل التشغيل:**

### **✅ افعل:**
1. ✅ خذ نسخة احتياطية دائماً
2. ✅ اختبر على DB تجريبية أولاً
3. ✅ راجع الملف قبل التنفيذ
4. ✅ تحقق من النتائج بعد التنفيذ

### **❌ لا تفعل:**
1. ❌ لا تشغل على production بدون اختبار
2. ❌ لا تشغل ملفات متعددة معاً
3. ❌ لا تعدل الملفات مباشرة
4. ❌ لا تنسى النسخة الاحتياطية

---

# 🔧 **أوامر مفيدة**

## **النسخ الاحتياطي:**
```bash
# نسخة احتياطية كاملة
mysqldump -u root FZ > migrations/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# نسخة احتياطية (schema فقط)
mysqldump -u root --no-data FZ > migrations/backups/schema_$(date +%Y%m%d).sql

# نسخة احتياطية (بيانات فقط)
mysqldump -u root --no-create-info FZ > migrations/backups/data_$(date +%Y%m%d).sql
```

## **الاستعادة:**
```bash
# استعادة من نسخة احتياطية
mysql -u root FZ < migrations/backups/backup_20251010.sql
```

---

# 📚 **المراجع**

## **للمزيد:**
- [`../Documentation/05_DATABASE/DATABASE_README.md`](../Documentation/05_DATABASE/DATABASE_README.md) - دليل شامل
- [`../Documentation/05_DATABASE/MIGRATIONS_CONSOLIDATION_PLAN.md`](../Documentation/05_DATABASE/MIGRATIONS_CONSOLIDATION_PLAN.md) - خطة الدمج

## **للمساعدة:**
راجع التوثيق في `../Documentation/`

---

# 🎯 **الخلاصة**

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ✅ 4 ملفات رئيسية واضحة                                      ║
║  ✅ 13 ملف قديم محفوظ في archive                              ║
║  ✅ تعليمات واضحة للاستخدام                                  ║
║  ✅ أمثلة عملية لكل سيناريو                                  ║
║                                                                ║
║  🚀 قاعدة البيانات منظمة وجاهزة! 🚀                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

**📅 التاريخ:** 10 أكتوبر 2025  
**الملفات:** 4 ملفات رئيسية  
**الجداول:** 55 جدول  
**الحالة:** ✅ **منظم ومختبر**

**🎉 Migrations منظمة ومرتبة بالكامل! 🎉**
