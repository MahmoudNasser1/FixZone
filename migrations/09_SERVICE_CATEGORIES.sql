-- Migration: Service Categories Management
-- Date: 2025-11-17
-- Description: إنشاء جدول ServiceCategory لإدارة فئات الخدمات

-- Create ServiceCategory table
CREATE TABLE IF NOT EXISTS ServiceCategory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) DEFAULT NULL,
  icon VARCHAR(50) DEFAULT NULL COMMENT 'Icon name for UI display',
  color VARCHAR(20) DEFAULT NULL COMMENT 'Color code for UI display',
  sortOrder INT DEFAULT 0 COMMENT 'Sort order for display',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME DEFAULT NULL,
  INDEX idx_category_active (isActive),
  INDEX idx_category_sort (sortOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO ServiceCategory (name, description, icon, color, sortOrder) VALUES
('صيانة عامة', 'خدمات الصيانة العامة للأجهزة', 'Settings', '#3B82F6', 1),
('إصلاح الشاشة', 'إصلاح واستبدال الشاشات التالفة', 'Monitor', '#10B981', 2),
('إصلاح البطارية', 'استبدال وإصلاح البطاريات', 'Battery', '#F59E0B', 3),
('إصلاح الكاميرا', 'إصلاح واستبدال كاميرات الأجهزة', 'Camera', '#8B5CF6', 4),
('إصلاح السماعات', 'إصلاح واستبدال السماعات', 'Volume2', '#EC4899', 5),
('إصلاح الشاحن', 'إصلاح منافذ الشحن والشواحن', 'Plug', '#06B6D4', 6),
('تحديث البرامج', 'تحديث أنظمة التشغيل والبرامج', 'Download', '#6366F1', 7),
('استعادة البيانات', 'استعادة البيانات المفقودة', 'Database', '#14B8A6', 8),
('إصلاح الهاردوير', 'إصلاح المكونات الداخلية', 'Cpu', '#F97316', 9),
('خدمات أخرى', 'خدمات إضافية متنوعة', 'MoreHorizontal', '#6B7280', 10)
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;

-- Add categoryId column to Service table (optional - for future use)
-- For now, we'll keep using category string for backward compatibility
-- ALTER TABLE Service ADD COLUMN IF NOT EXISTS categoryId INT DEFAULT NULL;
-- ALTER TABLE Service ADD FOREIGN KEY (categoryId) REFERENCES ServiceCategory(id);


