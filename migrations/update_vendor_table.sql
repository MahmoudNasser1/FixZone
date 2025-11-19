-- Migration: Update Vendor table with missing fields
-- Date: 2025-01-27
-- Description: Add missing fields to Vendor table to support advanced vendor management

USE FZ;

-- Add missing columns to Vendor table
ALTER TABLE Vendor 
ADD COLUMN contactPerson VARCHAR(100) DEFAULT NULL COMMENT 'اسم الشخص المسؤول',
ADD COLUMN address TEXT DEFAULT NULL COMMENT 'العنوان',
ADD COLUMN taxNumber VARCHAR(50) DEFAULT NULL COMMENT 'الرقم الضريبي',
ADD COLUMN paymentTerms VARCHAR(20) DEFAULT 'net30' COMMENT 'شروط الدفع',
ADD COLUMN creditLimit DECIMAL(12,2) DEFAULT 0 COMMENT 'حد الائتمان',
ADD COLUMN notes TEXT DEFAULT NULL COMMENT 'ملاحظات',
ADD COLUMN status ENUM('active','inactive') DEFAULT 'active' COMMENT 'حالة المورد',
ADD COLUMN createdBy INT(11) DEFAULT NULL COMMENT 'منشئ السجل';

-- Add foreign key constraint for createdBy
ALTER TABLE Vendor 
ADD CONSTRAINT fk_vendor_created_by 
FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL;

-- Add indexes for better performance
ALTER TABLE Vendor 
ADD INDEX idx_vendor_status (status),
ADD INDEX idx_vendor_created_by (createdBy),
ADD INDEX idx_vendor_tax_number (taxNumber);

-- Update existing records to have active status
UPDATE Vendor SET status = 'active' WHERE status IS NULL;

-- Add comments to existing columns
ALTER TABLE Vendor 
MODIFY COLUMN name VARCHAR(100) NOT NULL COMMENT 'اسم المورد',
MODIFY COLUMN email VARCHAR(100) DEFAULT NULL COMMENT 'البريد الإلكتروني',
MODIFY COLUMN phone VARCHAR(30) DEFAULT NULL COMMENT 'رقم الهاتف';

-- Verify the changes
DESCRIBE Vendor;










