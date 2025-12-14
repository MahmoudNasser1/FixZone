-- =====================================================
-- Production Migration: Inspection Reports Enhancement
-- Date: 2025-01-15
-- Description: 
--   - Add inspection type "فحص أثناء الإصلاح"
--   - Ensure all inspection types exist (مبدئي، أثناء الإصلاح، نهائي)
--   - Create FinalInspectionComponentTemplate table
--   - Insert default component templates
-- =====================================================

-- =====================================================
-- Part 1: Add/Update Inspection Types
-- =====================================================

-- إضافة/تحديث نوع "فحص مبدئي"
INSERT INTO InspectionType (name, description, isActive) 
VALUES ('فحص مبدئي', 'تقرير فحص عند الاستلام', 1)
ON DUPLICATE KEY UPDATE 
  description = 'تقرير فحص عند الاستلام',
  isActive = 1,
  deletedAt = NULL;

-- إضافة/تحديث نوع "فحص أثناء الإصلاح"
INSERT INTO InspectionType (name, description, isActive) 
VALUES ('فحص أثناء الإصلاح', 'تقرير فحص بعد الفك والفحص التفصيلي', 1)
ON DUPLICATE KEY UPDATE 
  description = 'تقرير فحص بعد الفك والفحص التفصيلي',
  isActive = 1,
  deletedAt = NULL;

-- إضافة/تحديث نوع "فحص نهائي"
INSERT INTO InspectionType (name, description, isActive) 
VALUES ('فحص نهائي', 'تقرير فحص نهائي شامل قبل التسليم', 1)
ON DUPLICATE KEY UPDATE 
  description = 'تقرير فحص نهائي شامل قبل التسليم',
  isActive = 1,
  deletedAt = NULL;

-- =====================================================
-- Part 2: Create FinalInspectionComponentTemplate Table
-- =====================================================

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
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_componenttype` (`componentType`),
  KEY `idx_devicecategory` (`deviceCategory`),
  KEY `idx_displayorder` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Part 3: Insert Component Templates
-- =====================================================

-- إدراج القوالب مع تجاهل التكرار
INSERT IGNORE INTO `FinalInspectionComponentTemplate` 
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

-- =====================================================
-- Migration Complete
-- =====================================================

-- التحقق من النتائج
SELECT 'Inspection Types' as 'Table', COUNT(*) as 'Count' FROM InspectionType WHERE deletedAt IS NULL
UNION ALL
SELECT 'FinalInspectionComponentTemplate' as 'Table', COUNT(*) as 'Count' FROM FinalInspectionComponentTemplate;

