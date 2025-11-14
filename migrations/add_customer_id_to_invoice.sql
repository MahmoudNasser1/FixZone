-- Migration: إضافة customerId إلى Invoice table
-- Date: 2025-10-27
-- Purpose: السماح بربط الفواتير بالعملاء مباشرة بدون الحاجة لطلب إصلاح

-- التحقق من وجود العمود أولاً
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Invoice'
  AND COLUMN_NAME = 'customerId';

-- إضافة العمود إذا لم يكن موجوداً
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Invoice 
   ADD COLUMN customerId INT NULL COMMENT "معرف العميل - يمكن أن يكون NULL إذا كان الفاتورة من طلب إصلاح",
   ADD INDEX idx_invoice_customer (customerId),
   ADD CONSTRAINT Invoice_ibfk_customer FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE SET NULL',
  'SELECT "Column customerId already exists in Invoice table" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- التحقق من النتيجة
DESCRIBE Invoice;

