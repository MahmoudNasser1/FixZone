-- ============================================
-- Add Missing Fields to RepairRequest Table
-- ============================================
-- Date: 20 أكتوبر 2025
-- Description: إضافة الحقول المفقودة لجدول طلبات الإصلاح

USE FZ;

-- إضافة حقل التكلفة المتوقعة
ALTER TABLE RepairRequest 
ADD COLUMN estimatedCost DECIMAL(10,2) DEFAULT 0.00 AFTER technicianId;

-- إضافة حقل تاريخ التسليم المتوقع
ALTER TABLE RepairRequest 
ADD COLUMN expectedDeliveryDate DATE DEFAULT NULL AFTER estimatedCost;

-- إضافة حقل الأولوية
ALTER TABLE RepairRequest 
ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER expectedDeliveryDate;

-- إضافة حقل التكلفة الفعلية
ALTER TABLE RepairRequest 
ADD COLUMN actualCost DECIMAL(10,2) DEFAULT NULL AFTER priority;

-- إضافة حقل ملاحظات العميل
ALTER TABLE RepairRequest 
ADD COLUMN customerNotes TEXT DEFAULT NULL AFTER actualCost;

-- إضافة فهارس للأداء
CREATE INDEX idx_repair_estimated_cost ON RepairRequest(estimatedCost);
CREATE INDEX idx_repair_expected_delivery ON RepairRequest(expectedDeliveryDate);
CREATE INDEX idx_repair_priority ON RepairRequest(priority);

