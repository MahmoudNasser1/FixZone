-- Migration: Update PurchaseOrder table with missing fields
-- Date: 2025-01-27
-- Description: Add missing fields to PurchaseOrder table to support advanced purchase order management

USE FZ;

-- Add missing columns to PurchaseOrder table
ALTER TABLE PurchaseOrder 
ADD COLUMN orderNumber VARCHAR(50) DEFAULT NULL COMMENT 'رقم طلب الشراء',
ADD COLUMN orderDate DATE DEFAULT NULL COMMENT 'تاريخ الطلب',
ADD COLUMN expectedDeliveryDate DATE DEFAULT NULL COMMENT 'تاريخ التسليم المتوقع',
ADD COLUMN totalAmount DECIMAL(12,2) DEFAULT 0 COMMENT 'إجمالي المبلغ',
ADD COLUMN notes TEXT DEFAULT NULL COMMENT 'ملاحظات',
ADD COLUMN createdBy INT(11) DEFAULT NULL COMMENT 'منشئ السجل',
ADD COLUMN deletedAt DATETIME DEFAULT NULL COMMENT 'تاريخ الحذف';

-- Add foreign key constraint for createdBy
ALTER TABLE PurchaseOrder 
ADD CONSTRAINT fk_purchase_order_created_by 
FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL;

-- Add indexes for better performance
ALTER TABLE PurchaseOrder 
ADD INDEX idx_po_order_number (orderNumber),
ADD INDEX idx_po_order_date (orderDate),
ADD INDEX idx_po_created_by (createdBy),
ADD INDEX idx_po_deleted_at (deletedAt);

-- Add comments to existing columns
ALTER TABLE PurchaseOrder 
MODIFY COLUMN status VARCHAR(50) DEFAULT NULL COMMENT 'حالة الطلب',
MODIFY COLUMN vendorId INT(11) DEFAULT NULL COMMENT 'معرف المورد',
MODIFY COLUMN approvalStatus ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING' COMMENT 'حالة الموافقة',
MODIFY COLUMN approvedById INT(11) DEFAULT NULL COMMENT 'معرف الموافق',
MODIFY COLUMN approvalDate DATETIME DEFAULT NULL COMMENT 'تاريخ الموافقة';

-- Verify the changes
DESCRIBE PurchaseOrder;












