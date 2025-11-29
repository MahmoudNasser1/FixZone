-- Migration: Create SettingBackup table
-- This table stores backups of settings for restore purposes

CREATE TABLE IF NOT EXISTS `SettingBackup` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `settings` JSON NOT NULL COMMENT 'Full settings snapshot',
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`),
  INDEX `idx_createdBy` (`createdBy`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

