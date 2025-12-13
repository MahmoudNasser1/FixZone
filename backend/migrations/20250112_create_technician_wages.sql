-- Migration: Create TechnicianWages table
-- Date: 2025-01-12
-- Description: Track wages and salaries for technicians

CREATE TABLE IF NOT EXISTS TechnicianWages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL COMMENT 'الفني',
  periodStart DATE NOT NULL COMMENT 'بداية الفترة',
  periodEnd DATE NOT NULL COMMENT 'نهاية الفترة',
  baseSalary DECIMAL(10,2) COMMENT 'الراتب الأساسي',
  commission DECIMAL(10,2) COMMENT 'العمولة',
  bonuses DECIMAL(10,2) COMMENT 'المكافآت',
  deductions DECIMAL(10,2) COMMENT 'الخصومات',
  totalEarnings DECIMAL(10,2) COMMENT 'إجمالي الأرباح',
  paymentDate DATE COMMENT 'تاريخ الدفع',
  paymentStatus ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending' COMMENT 'حالة الدفع',
  notes TEXT COMMENT 'ملاحظات',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  
  INDEX idx_technicianId (technicianId),
  INDEX idx_period (periodStart, periodEnd),
  INDEX idx_paymentStatus (paymentStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


