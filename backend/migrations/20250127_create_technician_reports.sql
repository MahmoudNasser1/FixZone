-- Migration: Create TechnicianReports table for quick reports
-- Date: 2025-01-27
-- Description: Store quick and detailed reports from technicians

CREATE TABLE IF NOT EXISTS TechnicianReports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  repairId INT NOT NULL COMMENT 'الإصلاح',
  reportType ENUM('quick', 'detailed') DEFAULT 'quick' COMMENT 'نوع التقرير',
  problemDescription TEXT COMMENT 'وصف المشكلة',
  solutionApplied TEXT COMMENT 'الحل المطبق',
  partsUsed JSON COMMENT 'الأجزاء المستخدمة',
  timeSpent INT COMMENT 'الوقت المستغرق بالدقائق',
  images JSON COMMENT 'روابط الصور',
  additionalNotes TEXT COMMENT 'ملاحظات إضافية',
  status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft' COMMENT 'حالة التقرير',
  submittedAt TIMESTAMP NULL COMMENT 'تاريخ التقديم',
  approvedBy INT NULL COMMENT 'من وافق على التقرير',
  approvedAt TIMESTAMP NULL COMMENT 'تاريخ الموافقة',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_repairId (repairId),
  INDEX idx_status (status),
  INDEX idx_reportType (reportType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

