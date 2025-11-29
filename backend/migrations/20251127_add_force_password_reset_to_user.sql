-- Migration: add forcePasswordReset flag to User table
-- This column allows the app to require the customer to reset the password after the first login.
ALTER TABLE `User`
ADD COLUMN IF NOT EXISTS `forcePasswordReset` TINYINT(1) NOT NULL DEFAULT 0 AFTER `deletedAt`;

