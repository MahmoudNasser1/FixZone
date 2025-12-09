# 🗑️ تنظيف قاعدة البيانات - Clean Database Instructions

## 📋 الطريقة 1: استخدام سكربت Node.js (موصى به)

### للقاعدة الافتراضية (FZ):
```bash
cd /opt/lampp/htdocs/FixZone
node backend/scripts/clean-database.js
```

### لقاعدة بيانات "marina":
```bash
cd /opt/lampp/htdocs/FixZone
node backend/scripts/clean-database.js --database=marina
```

---

## 📋 الطريقة 2: استخدام ملف SQL مباشرة

### للقاعدة الافتراضية (FZ):
```bash
cd /opt/lampp/htdocs/FixZone
/opt/lampp/bin/mysql -u root FZ < clean-database.sql
```

### لقاعدة بيانات "marina":
```bash
cd /opt/lampp/htdocs/FixZone
/opt/lampp/bin/mysql -u root marina < clean-database.sql
```

---

## 📋 الطريقة 3: استخدام أوامر SQL مباشرة

اتصل بقاعدة البيانات أولاً:
```bash
/opt/lampp/bin/mysql -u root marina
```

ثم نفذ هذا الأمر:
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `activity_log`;
TRUNCATE TABLE `AuditLog`;
TRUNCATE TABLE `UserLoginLog`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Role`;
TRUNCATE TABLE `Customer`;
TRUNCATE TABLE `Company`;
TRUNCATE TABLE `Branch`;
TRUNCATE TABLE `City`;
TRUNCATE TABLE `BarcodeScan`;
TRUNCATE TABLE `StockTransferItem`;
TRUNCATE TABLE `StockTransfer`;
TRUNCATE TABLE `StockCountItem`;
TRUNCATE TABLE `StockCount`;
TRUNCATE TABLE `StockMovement`;
TRUNCATE TABLE `StockAlert`;
TRUNCATE TABLE `StockLevel`;
TRUNCATE TABLE `InventoryItemVendor`;
TRUNCATE TABLE `InventoryItemCategory`;
TRUNCATE TABLE `InventoryItem`;
TRUNCATE TABLE `Warehouse`;
TRUNCATE TABLE `StatusUpdateLog`;
TRUNCATE TABLE `RepairRequestService`;
TRUNCATE TABLE `RepairRequestAccessory`;
TRUNCATE TABLE `RepairRequest`;
TRUNCATE TABLE `PartsUsed`;
TRUNCATE TABLE `InspectionComponent`;
TRUNCATE TABLE `InspectionReport`;
TRUNCATE TABLE `InspectionType`;
TRUNCATE TABLE `DeviceBatch`;
TRUNCATE TABLE `Device`;
TRUNCATE TABLE `Service`;
TRUNCATE TABLE `VendorPayment`;
TRUNCATE TABLE `Vendor`;
TRUNCATE TABLE `Payment`;
TRUNCATE TABLE `InvoiceItem`;
TRUNCATE TABLE `Invoice`;
TRUNCATE TABLE `InvoiceTemplate`;
TRUNCATE TABLE `QuotationItem`;
TRUNCATE TABLE `Quotation`;
TRUNCATE TABLE `PurchaseOrderItem`;
TRUNCATE TABLE `PurchaseOrder`;
TRUNCATE TABLE `ExpenseCategory`;
TRUNCATE TABLE `Expense`;
TRUNCATE TABLE `NotificationTemplate`;
TRUNCATE TABLE `Notification`;
TRUNCATE TABLE `VariableOption`;
TRUNCATE TABLE `VariableCategory`;
TRUNCATE TABLE `SystemSetting`;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## ⚠️ تحذيرات مهمة

1. **هذه العملية لا يمكن التراجع عنها!** تأكد من عمل نسخة احتياطية قبل التنظيف
2. السكربت يقوم بمسح **جميع البيانات** من الجداول
3. **بنية الجداول (Structure) ستبقى كما هي** - فقط البيانات ستُحذف

---

## 💾 عمل نسخة احتياطية قبل التنظيف

```bash
# للقاعدة FZ
/opt/lampp/bin/mysqldump -u root FZ > backup_FZ_$(date +%Y%m%d_%H%M%S).sql

# للقاعدة marina
/opt/lampp/bin/mysqldump -u root marina > backup_marina_$(date +%Y%m%d_%H%M%S).sql
```

---

## ✅ التحقق من نجاح العملية

بعد التنظيف، تحقق من أن الجداول فارغة:
```bash
/opt/lampp/bin/mysql -u root marina -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='marina' AND table_type='BASE TABLE';"
```

---

## 📝 ملاحظات

- السكربت Node.js يقوم تلقائياً بحساب جميع الجداول من قاعدة البيانات
- ملف SQL يحتوي على جميع الجداول المعروفة
- في حالة وجود جداول إضافية، استخدم السكربت Node.js

