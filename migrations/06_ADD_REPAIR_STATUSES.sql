-- ============================================
-- Fix Zone ERP - Add New Repair Statuses
-- ============================================
-- Version: 1.0
-- Date: 2025-01-XX
-- Description: إضافة حالات جديدة لطلبات الإصلاح
-- 
-- الحالات الجديدة:
--   - WAITING_PARTS: بانتظار قطع غيار (موجود بالفعل)
--   - READY_FOR_PICKUP: جاهز للاستلام (جديد)
-- ============================================

USE FZ;

SET FOREIGN_KEY_CHECKS = 0;

-- تحديث ENUM في جدول RepairRequest لإضافة READY_FOR_PICKUP
-- ملاحظة: WAITING_PARTS موجود بالفعل في السكيما
ALTER TABLE RepairRequest 
MODIFY COLUMN status ENUM(
    'RECEIVED',
    'INSPECTION',
    'AWAITING_APPROVAL',
    'UNDER_REPAIR',
    'WAITING_PARTS',
    'READY_FOR_PICKUP',
    'READY_FOR_DELIVERY',
    'DELIVERED',
    'REJECTED',
    'ON_HOLD'
) DEFAULT 'RECEIVED';

SET FOREIGN_KEY_CHECKS = 1;

-- ملاحظات:
-- السيكوينس المطلوب:
-- 1. عند الاستلام: RECEIVED (في الانتظار)
-- 2. توكيله لفني: UNDER_REPAIR (قيد الإصلاح)
-- 3. في حالة احتاج قطع غيار: WAITING_PARTS (بانتظار قطع غيار)
-- 4. عند الانتهاء: READY_FOR_PICKUP (جاهز للاستلام)
-- 5. عندما العميل يستلم: DELIVERED (مكتمل)

