-- ============================================
-- Add Notes Column to RepairRequest Table
-- ============================================
-- Date: 23 أكتوبر 2025
-- Description: إضافة حقل الملاحظات لجدول طلبات الإصلاح

USE FZ;

-- إضافة حقل الملاحظات
ALTER TABLE RepairRequest 
ADD COLUMN notes TEXT DEFAULT NULL AFTER actualCost;

-- إضافة فهرس للأداء
CREATE INDEX idx_repair_notes ON RepairRequest(notes(255));

