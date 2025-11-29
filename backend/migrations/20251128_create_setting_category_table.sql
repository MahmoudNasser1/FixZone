-- Migration: Create SettingCategory table
-- This table organizes settings into categories for better management

CREATE TABLE IF NOT EXISTS `SettingCategory` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `sortOrder` INT DEFAULT 0,
  `parentCategoryId` INT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`parentCategoryId`) REFERENCES `SettingCategory`(`id`),
  INDEX `idx_code` (`code`),
  INDEX `idx_parentCategoryId` (`parentCategoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO `SettingCategory` (`code`, `name`, `description`, `icon`, `sortOrder`) VALUES
('general', 'عام', 'الإعدادات العامة للنظام', 'Settings', 1),
('currency', 'العملة', 'إعدادات العملة والعرض المالي', 'DollarSign', 2),
('printing', 'الطباعة', 'إعدادات الطباعة والإيصالات', 'Printer', 3),
('messaging', 'المراسلة', 'إعدادات المراسلة والبريد الإلكتروني', 'MessageSquare', 4),
('locale', 'المحلية', 'إعدادات اللغة والتاريخ والوقت', 'Globe', 5),
('system', 'النظام', 'إعدادات النظام المتقدمة', 'Server', 6),
('variables', 'المتغيرات', 'متغيرات النظام (العلامات التجارية، الملحقات، إلخ)', 'List', 7),
('advanced', 'متقدم', 'الإعدادات المتقدمة', 'Cog', 8)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

