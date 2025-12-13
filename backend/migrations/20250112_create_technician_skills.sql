-- Migration: Create TechnicianSkills table
-- Date: 2025-01-12
-- Description: Track skills and certifications for technicians

CREATE TABLE IF NOT EXISTS TechnicianSkills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  skillName VARCHAR(100) NOT NULL COMMENT 'اسم المهارة',
  skillLevel ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate' COMMENT 'مستوى المهارة',
  certification VARCHAR(255) COMMENT 'الشهادة أو الترخيص',
  certificationDate DATE COMMENT 'تاريخ الحصول على الشهادة',
  expiryDate DATE COMMENT 'تاريخ انتهاء الشهادة',
  verifiedBy INT COMMENT 'من قام بالتحقق',
  verifiedAt TIMESTAMP NULL COMMENT 'تاريخ التحقق',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (verifiedBy) REFERENCES User(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_skillName (skillName),
  INDEX idx_skillLevel (skillLevel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


