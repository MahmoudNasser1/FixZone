-- Migration: Create TechnicianRepairs table
-- Date: 2025-01-12
-- Description: Link technicians to repairs with role and status tracking

CREATE TABLE IF NOT EXISTS TechnicianRepairs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  repairId INT NOT NULL COMMENT 'الإصلاح',
  role ENUM('primary', 'assistant') DEFAULT 'primary' COMMENT 'الدور (رئيسي/مساعد)',
  assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ التعيين',
  assignedBy INT COMMENT 'من قام بالتعيين',
  startedAt TIMESTAMP NULL COMMENT 'وقت البدء',
  completedAt TIMESTAMP NULL COMMENT 'وقت الإكمال',
  timeSpent INT COMMENT 'الوقت المستغرق بالدقائق',
  status ENUM('assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'assigned' COMMENT 'الحالة',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedBy) REFERENCES User(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_technician_repair (technicianId, repairId),
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_status (status),
  INDEX idx_assignedAt (assignedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


