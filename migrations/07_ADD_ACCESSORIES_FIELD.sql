-- ============================================
-- Add Accessories Field to RepairRequest Table
-- ============================================
-- Date: 24 أكتوبر 2025
-- Description: إضافة حقل المتعلقات لجدول طلبات الإصلاح

USE FZ;

-- إضافة حقل المتعلقات
ALTER TABLE RepairRequest 
ADD COLUMN accessories TEXT DEFAULT NULL AFTER customerNotes;

-- إضافة فهرس للأداء
CREATE INDEX idx_repair_accessories ON RepairRequest(accessories(100));

-- إضافة تعليق للحقل
ALTER TABLE RepairRequest 
MODIFY COLUMN accessories TEXT DEFAULT NULL COMMENT 'قائمة المتعلقات المستلمة من العميل (JSON format)';

