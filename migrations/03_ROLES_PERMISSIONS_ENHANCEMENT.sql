-- =====================================================
-- Migration: Roles & Permissions System Enhancement
-- Date: 2025-11-14
-- Description: تحسين نظام الأدوار والصلاحيات وإضافة Customer Role
-- =====================================================

-- Step 1: تحديث Role table - إضافة columns جديدة
ALTER TABLE `Role` 
ADD COLUMN `description` TEXT NULL AFTER `name`,
ADD COLUMN `isSystem` BOOLEAN DEFAULT FALSE AFTER `parentRoleId`,
ADD COLUMN `isActive` BOOLEAN DEFAULT TRUE AFTER `isSystem`;

-- Step 2: تحديث الأدوار الموجودة - إضافة description
UPDATE `Role` SET `description` = 'مدير النظام - صلاحيات كاملة' WHERE `id` = 1 AND `name` = 'Admin';
UPDATE `Role` SET `description` = 'مدير الفرع - إدارة الفرع والتقارير' WHERE `id` = 2 AND `name` = 'Manager';
UPDATE `Role` SET `description` = 'فني الإصلاح - إدارة الإصلاحات والمخزون' WHERE `id` = 3 AND `name` = 'Technician';
UPDATE `Role` SET `description` = 'موظف الاستقبال - إضافة عملاء وطلبات إصلاح' WHERE `id` = 4 AND `name` = 'User';

-- Step 3: تعيين الأدوار الموجودة كـ system roles
UPDATE `Role` SET `isSystem` = TRUE WHERE `id` IN (1, 2, 3, 4);

-- Step 4: إضافة Customer Role
INSERT INTO `Role` (`name`, `description`, `permissions`, `parentRoleId`, `isSystem`, `isActive`) 
VALUES (
  'Customer',
  'العميل - يرى بياناته فقط (أجهزته، فواتيره، طلبات إصلاحه)',
  JSON_OBJECT(
    'repairs.view_own', true,
    'repairs.track', true,
    'invoices.view_own', true,
    'devices.view_own', true,
    'payments.view_own', true
  ),
  NULL,
  TRUE,
  TRUE
) ON DUPLICATE KEY UPDATE 
  `description` = VALUES(`description`),
  `permissions` = VALUES(`permissions`),
  `isSystem` = VALUES(`isSystem`);

-- Step 5: ربط Customer بـ User - إضافة customerId في User table
ALTER TABLE `User` 
ADD COLUMN `customerId` INT NULL AFTER `roleId`,
ADD INDEX `idx_user_customer` (`customerId`),
ADD CONSTRAINT `fk_user_customer` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL;

-- Step 6: ربط User بـ Customer - إضافة userId في Customer table
ALTER TABLE `Customer` 
ADD COLUMN `userId` INT NULL AFTER `companyId`,
ADD INDEX `idx_customer_user` (`userId`),
ADD CONSTRAINT `fk_customer_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL;

-- Step 7: إنشاء Permission table (اختياري للمستقبل - لتحديد جميع الصلاحيات المتاحة)
CREATE TABLE IF NOT EXISTS `Permission` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `module` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(50) DEFAULT 'general',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_permission` (`module`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 8: إضافة Permissions الأساسية
INSERT INTO `Permission` (`module`, `action`, `name`, `description`, `category`) VALUES
-- Repairs Module
('repairs', 'view', 'عرض الإصلاحات', 'عرض قائمة طلبات الإصلاح', 'repairs'),
('repairs', 'view_own', 'عرض إصلاحاته', 'عرض طلبات الإصلاح الخاصة به', 'repairs'),
('repairs', 'view_all', 'عرض جميع الإصلاحات', 'عرض جميع طلبات الإصلاح', 'repairs'),
('repairs', 'create', 'إنشاء إصلاح', 'إنشاء طلب إصلاح جديد', 'repairs'),
('repairs', 'update', 'تعديل إصلاح', 'تعديل طلب إصلاح', 'repairs'),
('repairs', 'delete', 'حذف إصلاح', 'حذف طلب إصلاح', 'repairs'),
('repairs', 'track', 'تتبع الإصلاح', 'تتبع حالة طلب الإصلاح', 'repairs'),

-- Invoices Module
('invoices', 'view', 'عرض الفواتير', 'عرض جميع الفواتير', 'financial'),
('invoices', 'view_own', 'عرض فواتيره', 'عرض الفواتير الخاصة به', 'financial'),
('invoices', 'view_all', 'عرض جميع الفواتير', 'عرض جميع الفواتير', 'financial'),
('invoices', 'create', 'إنشاء فاتورة', 'إنشاء فاتورة جديدة', 'financial'),
('invoices', 'update', 'تعديل فاتورة', 'تعديل فاتورة', 'financial'),
('invoices', 'delete', 'حذف فاتورة', 'حذف فاتورة', 'financial'),
('invoices', 'print', 'طباعة فاتورة', 'طباعة فاتورة', 'financial'),

-- Customers Module
('customers', 'view', 'عرض العملاء', 'عرض قائمة العملاء', 'crm'),
('customers', 'view_all', 'عرض جميع العملاء', 'عرض جميع العملاء', 'crm'),
('customers', 'create', 'إنشاء عميل', 'إضافة عميل جديد', 'crm'),
('customers', 'update', 'تعديل عميل', 'تعديل بيانات العميل', 'crm'),
('customers', 'delete', 'حذف عميل', 'حذف عميل', 'crm'),

-- Users Module
('users', 'view', 'عرض المستخدمين', 'عرض قائمة المستخدمين', 'admin'),
('users', 'create', 'إنشاء مستخدم', 'إضافة مستخدم جديد', 'admin'),
('users', 'update', 'تعديل مستخدم', 'تعديل بيانات المستخدم', 'admin'),
('users', 'delete', 'حذف مستخدم', 'حذف مستخدم', 'admin'),

-- Roles Module
('roles', 'view', 'عرض الأدوار', 'عرض قائمة الأدوار', 'admin'),
('roles', 'create', 'إنشاء دور', 'إضافة دور جديد', 'admin'),
('roles', 'update', 'تعديل دور', 'تعديل دور', 'admin'),
('roles', 'delete', 'حذف دور', 'حذف دور', 'admin'),

-- Inventory Module
('inventory', 'view', 'عرض المخزون', 'عرض المخزون', 'inventory'),
('inventory', 'create', 'إضافة صنف', 'إضافة صنف جديد للمخزون', 'inventory'),
('inventory', 'update', 'تعديل صنف', 'تعديل صنف في المخزون', 'inventory'),
('inventory', 'delete', 'حذف صنف', 'حذف صنف من المخزون', 'inventory'),

-- Reports Module
('reports', 'view', 'عرض التقارير', 'عرض التقارير', 'reports'),
('reports', 'export', 'تصدير التقارير', 'تصدير التقارير', 'reports'),

-- Devices Module
('devices', 'view', 'عرض الأجهزة', 'عرض الأجهزة', 'devices'),
('devices', 'view_own', 'عرض أجهزته', 'عرض الأجهزة الخاصة به', 'devices'),
('devices', 'create', 'إضافة جهاز', 'إضافة جهاز جديد', 'devices'),
('devices', 'update', 'تعديل جهاز', 'تعديل جهاز', 'devices'),
('devices', 'delete', 'حذف جهاز', 'حذف جهاز', 'devices'),

-- Payments Module
('payments', 'view', 'عرض المدفوعات', 'عرض المدفوعات', 'financial'),
('payments', 'view_own', 'عرض مدفوعاته', 'عرض المدفوعات الخاصة به', 'financial'),
('payments', 'create', 'إضافة دفعة', 'إضافة دفعة جديدة', 'financial'),
('payments', 'update', 'تعديل دفعة', 'تعديل دفعة', 'financial'),

-- Companies Module
('companies', 'view', 'عرض الشركات', 'عرض الشركات', 'crm'),
('companies', 'create', 'إضافة شركة', 'إضافة شركة جديدة', 'crm'),
('companies', 'update', 'تعديل شركة', 'تعديل شركة', 'crm'),
('companies', 'delete', 'حذف شركة', 'حذف شركة', 'crm'),

-- Settings Module
('settings', 'view', 'عرض الإعدادات', 'عرض إعدادات النظام', 'admin'),
('settings', 'update', 'تعديل الإعدادات', 'تعديل إعدادات النظام', 'admin')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `category` = VALUES(`category`);

-- Step 9: تحديث Admin permissions لتكون شاملة
UPDATE `Role` SET `permissions` = JSON_OBJECT('all', true) WHERE `id` = 1 AND `name` = 'Admin';

-- Step 10: تحديث Manager permissions
UPDATE `Role` SET `permissions` = JSON_OBJECT(
  'repairs.view_all', true,
  'repairs.update', true,
  'invoices.view_all', true,
  'invoices.create', true,
  'invoices.update', true,
  'invoices.print', true,
  'customers.view_all', true,
  'customers.create', true,
  'customers.update', true,
  'users.view', true,
  'users.update', true,
  'reports.view', true,
  'reports.export', true,
  'inventory.view', true,
  'devices.view', true,
  'payments.view', true,
  'payments.create', true
) WHERE `id` = 2 AND `name` = 'Manager';

-- Step 11: تحديث Technician permissions
UPDATE `Role` SET `permissions` = JSON_OBJECT(
  'repairs.view_all', true,
  'repairs.update', true,
  'inventory.view', true,
  'inventory.update', true,
  'devices.view', true,
  'devices.update', true
) WHERE `id` = 3 AND `name` = 'Technician';

-- Step 12: تحديث Receptionist (User) permissions
UPDATE `Role` SET `permissions` = JSON_OBJECT(
  'repairs.create', true,
  'repairs.view_all', true,
  'customers.view_all', true,
  'customers.create', true,
  'customers.update', true,
  'devices.view', true,
  'devices.create', true,
  'devices.update', true
) WHERE `id` = 4 AND `name` = 'User';

-- ملاحظة: Customer Role تم إضافته في Step 4 مع permissions محددة

