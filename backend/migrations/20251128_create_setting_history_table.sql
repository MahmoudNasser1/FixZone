-- Migration: Create SettingHistory table
-- This table stores the history of all settings changes for audit purposes

CREATE TABLE IF NOT EXISTS `SettingHistory` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `settingId` INT NOT NULL,
  `settingKey` VARCHAR(100) NOT NULL,
  `oldValue` TEXT NULL,
  `newValue` TEXT NOT NULL,
  `changedBy` INT NOT NULL,
  `changeReason` TEXT NULL,
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` TEXT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`settingId`) REFERENCES `SystemSetting`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changedBy`) REFERENCES `User`(`id`),
  INDEX `idx_settingId` (`settingId`),
  INDEX `idx_settingKey` (`settingKey`),
  INDEX `idx_changedBy` (`changedBy`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

