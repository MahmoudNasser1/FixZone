-- ============================================
-- تنظيف قاعدة البيانات - Clean Database
-- ============================================
-- هذا الملف يقوم بمسح جميع البيانات من الجداول
-- مع الحفاظ على بنية الجداول (Structure)
--
-- الاستخدام:
--   mysql -u root -p FZ < clean-database.sql
--   mysql -u root -p marina < clean-database.sql
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Authentication & Users
TRUNCATE TABLE `activity_log`;
TRUNCATE TABLE `AuditLog`;
TRUNCATE TABLE `UserLoginLog`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Role`;

-- Core Business
TRUNCATE TABLE `Customer`;
TRUNCATE TABLE `Company`;
TRUNCATE TABLE `Branch`;
TRUNCATE TABLE `City`;

-- Inventory Management
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

-- Repair & Service Management
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

-- Financial
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

-- System & Configuration
TRUNCATE TABLE `NotificationTemplate`;
TRUNCATE TABLE `Notification`;
TRUNCATE TABLE `VariableOption`;
TRUNCATE TABLE `VariableCategory`;
TRUNCATE TABLE `SystemSetting`;

SET FOREIGN_KEY_CHECKS = 1;

-- رسالة تأكيد
SELECT '✅ تم تنظيف قاعدة البيانات بنجاح!' AS message;
SELECT '📌 ملاحظة: تم الحفاظ على بنية الجداول (Structure)' AS note;

