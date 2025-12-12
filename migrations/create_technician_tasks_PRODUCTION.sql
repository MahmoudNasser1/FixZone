-- ============================================================================
-- Migration: Create Tasks table for technician task management
-- Date: 2025-01-27
-- Description: Manage tasks and to-do lists for technicians
-- Production Safe: Can be run multiple times without errors
-- ============================================================================

-- Step 1: Create Tasks table (if not exists)
CREATE TABLE IF NOT EXISTS Tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  title VARCHAR(255) NOT NULL COMMENT 'عنوان المهمة',
  description TEXT COMMENT 'وصف المهمة',
  taskType ENUM('repair', 'general', 'recurring') DEFAULT 'general' COMMENT 'نوع المهمة',
  repairId INT NULL COMMENT 'الإصلاح المرتبط',
  deviceId INT NULL COMMENT 'الجهاز المرتبط',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'الأولوية',
  status ENUM('todo', 'in_progress', 'review', 'done', 'cancelled') DEFAULT 'todo' COMMENT 'الحالة',
  category VARCHAR(100) COMMENT 'الفئة',
  dueDate DATE NULL COMMENT 'التاريخ المستهدف',
  dueTime TIME NULL COMMENT 'الوقت المستهدف',
  estimatedDuration INT COMMENT 'المدة المتوقعة بالدقائق',
  actualDuration INT COMMENT 'المدة الفعلية بالدقائق',
  completedAt TIMESTAMP NULL COMMENT 'تاريخ الإنجاز',
  tags JSON COMMENT 'العلامات',
  attachments JSON COMMENT 'المرفقات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL COMMENT 'للحذف الناعم',
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
  FOREIGN KEY (deviceId) REFERENCES Device(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_deviceId (deviceId),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_dueDate (dueDate),
  INDEX idx_taskType (taskType),
  INDEX idx_deletedAt (deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Verification queries (optional - for checking results)
-- Uncomment these lines to verify the migration:

-- SELECT 'Migration completed successfully!' AS status;
-- SELECT TABLE_NAME 
-- FROM INFORMATION_SCHEMA.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'Tasks';
-- 
-- SELECT COUNT(*) as total_tasks 
-- FROM Tasks;
-- 
-- SELECT status, COUNT(*) as count 
-- FROM Tasks 
-- WHERE deletedAt IS NULL
-- GROUP BY status;
-- 
-- SELECT priority, COUNT(*) as count 
-- FROM Tasks 
-- WHERE deletedAt IS NULL
-- GROUP BY priority;

