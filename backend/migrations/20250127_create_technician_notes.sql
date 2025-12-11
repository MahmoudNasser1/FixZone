-- Migration: Create Notes table for technician notes system
-- Date: 2025-01-27
-- Description: Manage notes (general and device-specific) for technicians

CREATE TABLE IF NOT EXISTS Notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  noteType ENUM('general', 'device', 'task') NOT NULL COMMENT 'نوع الملاحظة',
  deviceId INT NULL COMMENT 'الجهاز المرتبط',
  repairId INT NULL COMMENT 'الإصلاح المرتبط',
  taskId INT NULL COMMENT 'المهمة المرتبطة',
  title VARCHAR(255) COMMENT 'عنوان الملاحظة',
  content TEXT NOT NULL COMMENT 'محتوى الملاحظة',
  category VARCHAR(50) COMMENT 'الفئة (تقنية، تذكير، مشكلة، حل، توصية)',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT 'الأولوية',
  tags JSON COMMENT 'العلامات',
  isPrivate BOOLEAN DEFAULT false COMMENT 'خاص أو عام',
  reminderDate DATE NULL COMMENT 'تاريخ التذكير',
  reminderTime TIME NULL COMMENT 'وقت التذكير',
  reminderSent BOOLEAN DEFAULT false COMMENT 'تم إرسال التذكير',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL COMMENT 'للحذف الناعم',
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (deviceId) REFERENCES Device(id) ON DELETE SET NULL,
  FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
  FOREIGN KEY (taskId) REFERENCES Tasks(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_noteType (noteType),
  INDEX idx_deviceId (deviceId),
  INDEX idx_repairId (repairId),
  INDEX idx_taskId (taskId),
  INDEX idx_reminderDate (reminderDate),
  INDEX idx_deletedAt (deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create NoteAttachments table for note attachments
CREATE TABLE IF NOT EXISTS NoteAttachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  noteId INT NOT NULL,
  fileName VARCHAR(255) NOT NULL COMMENT 'اسم الملف',
  filePath VARCHAR(500) NOT NULL COMMENT 'مسار الملف',
  fileType VARCHAR(50) COMMENT 'نوع الملف',
  fileSize INT COMMENT 'حجم الملف بالبايت',
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (noteId) REFERENCES Notes(id) ON DELETE CASCADE,
  
  INDEX idx_noteId (noteId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

