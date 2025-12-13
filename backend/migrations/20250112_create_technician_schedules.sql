-- Migration: Create TechnicianSchedules table
-- Date: 2025-01-12
-- Description: Schedule repairs and tasks for technicians

CREATE TABLE IF NOT EXISTS TechnicianSchedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  repairId INT NOT NULL COMMENT 'الإصلاح',
  scheduledDate DATE NOT NULL COMMENT 'تاريخ الجدولة',
  scheduledTime TIME NOT NULL COMMENT 'وقت الجدولة',
  estimatedDuration INT COMMENT 'المدة المقدرة بالدقائق',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'الأولوية',
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled' COMMENT 'الحالة',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_scheduledDate (scheduledDate),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


