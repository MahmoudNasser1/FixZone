-- ============================================================================
-- Migration: Create TimeTracking and TimeAdjustments tables for technician time tracking
-- Date: 2025-01-27
-- Description: Track time spent by technicians on repairs and tasks
-- Production Safe: Can be run multiple times without errors
-- ============================================================================

-- Step 1: Create TimeTracking table (if not exists)
CREATE TABLE IF NOT EXISTS TimeTracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  repairId INT NULL COMMENT 'الإصلاح المرتبط',
  taskId INT NULL COMMENT 'المهمة المرتبطة',
  startTime TIMESTAMP NOT NULL COMMENT 'وقت البدء',
  endTime TIMESTAMP NULL COMMENT 'وقت الإيقاف',
  duration INT DEFAULT 0 COMMENT 'المدة بالثواني',
  status ENUM('running', 'paused', 'stopped', 'completed') DEFAULT 'running' COMMENT 'حالة التتبع',
  adjustedDuration INT NULL COMMENT 'الوقت المعدل بالثواني',
  adjustmentReason TEXT COMMENT 'سبب التعديل',
  adjustedBy INT NULL COMMENT 'من قام بالتعديل',
  adjustedAt TIMESTAMP NULL COMMENT 'تاريخ التعديل',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
  FOREIGN KEY (taskId) REFERENCES Tasks(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_taskId (taskId),
  INDEX idx_status (status),
  INDEX idx_startTime (startTime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Create TimeAdjustments table (if not exists)
CREATE TABLE IF NOT EXISTS TimeAdjustments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  timeTrackingId INT NOT NULL,
  oldDuration INT NOT NULL COMMENT 'الوقت القديم بالثواني',
  newDuration INT NOT NULL COMMENT 'الوقت الجديد بالثواني',
  reason TEXT NOT NULL COMMENT 'سبب التعديل',
  requestedBy INT NOT NULL COMMENT 'من طلب التعديل',
  approvedBy INT NULL COMMENT 'من وافق على التعديل',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'حالة الطلب',
  requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approvedAt TIMESTAMP NULL,
  rejectionReason TEXT COMMENT 'سبب الرفض',
  
  FOREIGN KEY (timeTrackingId) REFERENCES TimeTracking(id) ON DELETE CASCADE,
  FOREIGN KEY (requestedBy) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
  
  INDEX idx_timeTrackingId (timeTrackingId),
  INDEX idx_status (status),
  INDEX idx_requestedBy (requestedBy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Verification queries (optional - for checking results)
-- Uncomment these lines to verify the migration:

-- SELECT 'Migration completed successfully!' AS status;
-- SELECT TABLE_NAME 
-- FROM INFORMATION_SCHEMA.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME IN ('TimeTracking', 'TimeAdjustments');
-- 
-- SELECT COUNT(*) as total_time_tracking_records 
-- FROM TimeTracking;
-- 
-- SELECT status, COUNT(*) as count 
-- FROM TimeTracking 
-- GROUP BY status;
-- 
-- SELECT COUNT(*) as total_adjustments 
-- FROM TimeAdjustments;
-- 
-- SELECT status, COUNT(*) as count 
-- FROM TimeAdjustments 
-- GROUP BY status;

