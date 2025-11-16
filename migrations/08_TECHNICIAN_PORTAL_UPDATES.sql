-- ============================================
-- Fix Zone ERP - Technician Portal Updates
-- ============================================
-- Version: 1.0
-- Date: 2025-11-16
-- Description: Database schema updates for Technician Portal (Sprint 1 & 2)
-- 
-- Changes:
--   1. AuditLog: Add new actionType values (note, media, status_change)
--   2. RepairRequest: Add COMPLETED status
--   3. Role: Update permissions for Technician role (roleId = 3)
-- 
-- ⚠️ Important: Run this BEFORE using Technician Portal
-- ============================================

USE FZ;

-- =====================================================
-- 1. Update AuditLog actionType ENUM
-- =====================================================
-- Add support for technician portal actions: notes, media uploads, status changes

ALTER TABLE AuditLog MODIFY COLUMN actionType 
  ENUM('CREATE','UPDATE','DELETE','LOGIN','note','media','status_change') 
  DEFAULT NULL 
  COMMENT 'Action type: note=timeline note, media=file upload, status_change=status update';

-- =====================================================
-- 2. Update RepairRequest status ENUM
-- =====================================================
-- Add COMPLETED status for technicians to mark jobs as finished

ALTER TABLE RepairRequest MODIFY COLUMN status 
  ENUM(
    'RECEIVED',           -- تم الاستلام
    'INSPECTION',         -- قيد الفحص
    'AWAITING_APPROVAL',  -- في انتظار الموافقة
    'UNDER_REPAIR',       -- قيد الإصلاح
    'READY_FOR_DELIVERY', -- جاهز للتسليم
    'DELIVERED',          -- تم التسليم
    'COMPLETED',          -- مكتمل (جديد)
    'REJECTED',           -- مرفوض
    'WAITING_PARTS',      -- في انتظار قطع غيار
    'ON_HOLD'             -- معلق
  ) 
  DEFAULT 'RECEIVED'
  COMMENT 'Status of repair request - Added COMPLETED for technician portal';

-- =====================================================
-- 3. Update Role Permissions for Technician (roleId = 3)
-- =====================================================
-- Grant necessary permissions for technician portal functionality

UPDATE Role 
SET permissions = JSON_OBJECT(
  'repairs.view_own', true,
  'repairs.update_own', true,
  'repairs.timeline_update', true,
  'devices.view_own', true,
  'repairs.*', false,
  'users.*', false
)
WHERE id = 3 AND name = 'Employee';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify AuditLog actionType
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'FZ' 
  AND TABLE_NAME = 'AuditLog' 
  AND COLUMN_NAME = 'actionType';

-- Verify RepairRequest status
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'FZ' 
  AND TABLE_NAME = 'RepairRequest' 
  AND COLUMN_NAME = 'status';

-- Verify Role permissions
SELECT id, name, permissions 
FROM Role 
WHERE id = 3;

-- =====================================================
-- Test Data (Optional)
-- =====================================================

-- Create a test technician user (if needed)
-- Uncomment the following lines to create a test user:

/*
INSERT IGNORE INTO User (id, name, email, phone, password, roleId, isActive, createdAt)
VALUES (
  96,
  'أحمد الفني',
  'tech1@fixzone.com',
  '01999888777',
  '$2a$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
  3,
  1,
  NOW()
);
*/

-- =====================================================
-- Rollback (if needed)
-- =====================================================

-- To rollback AuditLog changes:
/*
ALTER TABLE AuditLog MODIFY COLUMN actionType 
  ENUM('CREATE','UPDATE','DELETE','LOGIN') 
  DEFAULT NULL;
*/

-- To rollback RepairRequest changes:
/*
ALTER TABLE RepairRequest MODIFY COLUMN status 
  ENUM('RECEIVED','INSPECTION','AWAITING_APPROVAL','UNDER_REPAIR',
       'READY_FOR_DELIVERY','DELIVERED','REJECTED','WAITING_PARTS','ON_HOLD') 
  DEFAULT 'RECEIVED';
*/

-- =====================================================
-- Notes
-- =====================================================

-- 1. The 'note' actionType is used for technician timeline notes
--    Stored in AuditLog with details JSON containing the note text
--
-- 2. The 'media' actionType is used for file uploads
--    Stored in AuditLog with details JSON containing:
--    - fileUrl: URL of the uploaded file
--    - fileType: IMAGE, VIDEO, or DOCUMENT
--    - category: BEFORE, DURING, AFTER, PARTS, or EVIDENCE
--    - description: Optional description
--    - uploadedBy: Technician user ID
--
-- 3. The 'status_change' actionType can be used for explicit status changes
--    (Currently status changes are recorded in StatusUpdateLog table)
--
-- 4. COMPLETED status indicates a repair job is finished by the technician
--    Different from DELIVERED which means handed over to customer
--
-- 5. Role permissions are stored as JSON in the Role table
--    - repairs.view_own: View own assigned repair requests
--    - repairs.update_own: Update own repair requests
--    - repairs.timeline_update: Add notes and media to timeline
--    - devices.view_own: View device information

-- ============================================
-- End of Migration
-- ============================================


