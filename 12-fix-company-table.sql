-- إصلاح جدول Company ليتوافق مع الباك إند
USE FZ;

-- إضافة الحقول المفقودة لجدول Company
ALTER TABLE Company 
ADD COLUMN website VARCHAR(255) DEFAULT NULL COMMENT 'موقع الشركة الإلكتروني' AFTER address,
ADD COLUMN industry VARCHAR(100) DEFAULT NULL COMMENT 'قطاع الصناعة' AFTER website,
ADD COLUMN description TEXT DEFAULT NULL COMMENT 'وصف الشركة' AFTER industry,
ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT 'حالة الشركة' AFTER description;

-- التحقق من التحديث
SELECT 'Company table updated successfully!' as message;
DESCRIBE Company;
