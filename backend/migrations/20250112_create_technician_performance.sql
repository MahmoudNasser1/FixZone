-- Migration: Create TechnicianPerformance and TechnicianEvaluations tables
-- Date: 2025-01-12
-- Description: Track technician performance and evaluations

CREATE TABLE IF NOT EXISTS TechnicianPerformance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  periodStart DATE NOT NULL COMMENT 'بداية الفترة',
  periodEnd DATE NOT NULL COMMENT 'نهاية الفترة',
  totalRepairs INT DEFAULT 0 COMMENT 'إجمالي الإصلاحات',
  completedRepairs INT DEFAULT 0 COMMENT 'الإصلاحات المكتملة',
  averageTime DECIMAL(10,2) COMMENT 'متوسط الوقت',
  customerRating DECIMAL(3,2) COMMENT 'تقييم العملاء',
  supervisorRating DECIMAL(3,2) COMMENT 'تقييم المشرف',
  totalEarnings DECIMAL(10,2) COMMENT 'إجمالي الأرباح',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_period (periodStart, periodEnd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS TechnicianEvaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  evaluatedBy INT NOT NULL COMMENT 'من قام بالتقييم',
  evaluationType ENUM('supervisor', 'customer', 'system') NOT NULL COMMENT 'نوع التقييم',
  repairId INT NULL COMMENT 'الإصلاح المرتبط',
  criteria JSON COMMENT 'معايير التقييم',
  overallScore DECIMAL(3,2) COMMENT 'النتيجة الإجمالية',
  comments TEXT COMMENT 'تعليقات',
  evaluationDate DATE NOT NULL COMMENT 'تاريخ التقييم',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatedBy) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_evaluationDate (evaluationDate),
  INDEX idx_evaluationType (evaluationType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


