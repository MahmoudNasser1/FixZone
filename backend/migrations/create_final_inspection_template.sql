-- Migration: Create Final Inspection Component Templates Table
-- Date: 2025-01-13
-- Description: Create table for storing predefined component templates for final inspection

CREATE TABLE IF NOT EXISTS `FinalInspectionComponentTemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'اسم المكون (بالعربية)',
  `nameEn` varchar(100) DEFAULT NULL COMMENT 'اسم المكون (بالإنجليزية)',
  `componentType` varchar(50) DEFAULT NULL COMMENT 'نوع المكون للتصنيف',
  `description` text DEFAULT NULL COMMENT 'وصف المكون',
  `displayOrder` int(11) DEFAULT 0 COMMENT 'ترتيب العرض',
  `isRequired` tinyint(1) DEFAULT 1 COMMENT 'هل المكون مطلوب في كل فحص نهائي',
  `deviceCategory` varchar(50) DEFAULT NULL COMMENT 'نوع الجهاز (laptop, phone, tablet, all)',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_componenttype` (`componentType`),
  KEY `idx_devicecategory` (`deviceCategory`),
  KEY `idx_displayorder` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إدراج القائمة المحددة مسبقاً للمكونات
INSERT INTO `FinalInspectionComponentTemplate` 
  (`name`, `nameEn`, `componentType`, `description`, `displayOrder`, `deviceCategory`) 
VALUES
  ('الكاميرا', 'Camera', 'camera', 'فحص الكاميرا الأمامية/الخلفية', 1, 'all'),
  ('بلوتوث', 'Bluetooth', 'connectivity', 'فحص اتصال Bluetooth', 2, 'all'),
  ('WiFi', 'WiFi', 'connectivity', 'فحص اتصال WiFi', 3, 'all'),
  ('لوحة المفاتيح', 'Keyboard', 'input', 'فحص لوحة المفاتيح', 4, 'laptop'),
  ('لوحة اللمس', 'Touchpad', 'input', 'فحص لوحة اللمس', 5, 'laptop'),
  ('السماعات', 'Speakers', 'audio', 'فحص السماعات', 6, 'all'),
  ('صحة الهارد', 'Hard Drive Health', 'storage', 'فحص صحة القرص الصلب', 7, 'laptop'),
  ('صحة البطارية', 'Battery Health', 'power', 'فحص صحة البطارية', 8, 'all'),
  ('منفذ HDMI', 'HDMI Socket', 'ports', 'فحص منفذ HDMI', 9, 'laptop'),
  ('منفذ الصوت', 'Audio Socket', 'audio', 'فحص منفذ الصوت/سماعة الرأس', 10, 'all'),
  ('الشاشة', 'Screen', 'display', 'فحص الشاشة وجودة العرض', 11, 'all'),
  ('التاتش اسكرين', 'Touch Screen', 'display', 'فحص التاتش اسكرين (في حالة الشاشات اللمسية)', 12, 'all');

