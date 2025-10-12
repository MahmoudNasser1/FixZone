-- ============================================
-- Fix Zone ERP - Complete Database Schema
-- ============================================
-- Version: 1.0
-- Date: 10 أكتوبر 2025
-- Author: Fix Zone Development Team
-- Description: Schema كامل لجميع جداول النظام
-- 
-- الجداول: 55 جدول
-- الأقسام:
--   1. Authentication & Users
--   2. Core Business (Customers, Companies, Branches)
--   3. Inventory Management
--   4. Repair & Service Management
--   5. Financial (Invoices, Payments, Expenses)
--   6. System & Configuration
-- ============================================

-- Database Settings
CREATE DATABASE IF NOT EXISTS FZ 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE FZ;

SET FOREIGN_KEY_CHECKS=0;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `AuditLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `AuditLog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(100) DEFAULT NULL,
  `actionType` enum('CREATE','UPDATE','DELETE','LOGIN') DEFAULT NULL,
  `details` text DEFAULT NULL,
  `entityType` varchar(50) DEFAULT NULL,
  `entityId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `beforeValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`beforeValue`)),
  `afterValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`afterValue`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `AuditLog_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `BarcodeScan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `BarcodeScan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `barcode` varchar(100) NOT NULL,
  `inventoryItemId` int(11) DEFAULT NULL,
  `scannedBy` int(11) NOT NULL,
  `scanType` enum('receive','issue','transfer','count','lookup') NOT NULL,
  `warehouseId` int(11) NOT NULL,
  `referenceType` varchar(50) DEFAULT NULL,
  `referenceId` int(11) DEFAULT NULL,
  `result` enum('success','not_found','error') DEFAULT 'success',
  `errorMessage` text DEFAULT NULL,
  `scannedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `action` enum('scan','issue','receive','count','transfer') DEFAULT 'scan',
  `repairRequestId` int(11) DEFAULT NULL,
  `stockCountId` int(11) DEFAULT NULL,
  `stockTransferId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventoryItemId` (`inventoryItemId`),
  KEY `warehouseId` (`warehouseId`),
  KEY `idx_scan_barcode` (`barcode`),
  KEY `idx_scan_user` (`scannedBy`),
  KEY `idx_scan_date` (`scannedAt`),
  KEY `idx_scan_result` (`result`),
  KEY `idx_barcodescan_action` (`action`),
  KEY `idx_barcodescan_repair` (`repairRequestId`),
  KEY `idx_barcodescan_count` (`stockCountId`),
  KEY `idx_barcodescan_transfer` (`stockTransferId`),
  CONSTRAINT `BarcodeScan_ibfk_1` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`),
  CONSTRAINT `BarcodeScan_ibfk_2` FOREIGN KEY (`scannedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `BarcodeScan_ibfk_3` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse` (`id`),
  CONSTRAINT `fk_barcodescan_count` FOREIGN KEY (`stockCountId`) REFERENCES `StockCount` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_barcodescan_repair` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_barcodescan_transfer` FOREIGN KEY (`stockTransferId`) REFERENCES `StockTransfer` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='سجل مسح الباركود';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Branch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `cityId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cityId` (`cityId`),
  CONSTRAINT `Branch_ibfk_1` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `City`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `City` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Company` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `taxNumber` varchar(50) DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `companyId` int(11) DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `Customer_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Device`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Device` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customerId` int(11) DEFAULT NULL,
  `deviceType` varchar(100) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `brandId` int(11) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `cpu` varchar(100) DEFAULT NULL,
  `gpu` varchar(100) DEFAULT NULL,
  `ram` varchar(50) DEFAULT NULL,
  `storage` varchar(50) DEFAULT NULL,
  `serialNumber` varchar(100) DEFAULT NULL,
  `devicePassword` varchar(100) DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `deviceBatchId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customerId` (`customerId`),
  KEY `deviceBatchId` (`deviceBatchId`),
  KEY `brandId` (`brandId`),
  CONSTRAINT `Device_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`),
  CONSTRAINT `Device_ibfk_2` FOREIGN KEY (`deviceBatchId`) REFERENCES `DeviceBatch` (`id`),
  CONSTRAINT `Device_ibfk_3` FOREIGN KEY (`brandId`) REFERENCES `VariableOption` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `DeviceBatch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DeviceBatch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clientId` int(11) DEFAULT NULL,
  `receivedById` int(11) DEFAULT NULL,
  `batchDate` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('PENDING','COMPLETED') DEFAULT 'PENDING',
  `importLog` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  KEY `receivedById` (`receivedById`),
  CONSTRAINT `DeviceBatch_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Customer` (`id`),
  CONSTRAINT `DeviceBatch_ibfk_2` FOREIGN KEY (`receivedById`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Expense` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `expenseDate` date DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'EGP',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  KEY `userId` (`userId`),
  CONSTRAINT `Expense_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `ExpenseCategory` (`id`),
  CONSTRAINT `Expense_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ExpenseCategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ExpenseCategory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InspectionComponent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InspectionComponent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inspectionReportId` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `status` enum('WORKING','PARTIAL','DEFECTIVE','NOT_PRESENT') DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `priority` enum('HIGH','MEDIUM','LOW','NONE') DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `inspectionReportId` (`inspectionReportId`),
  CONSTRAINT `InspectionComponent_ibfk_1` FOREIGN KEY (`inspectionReportId`) REFERENCES `InspectionReport` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InspectionReport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InspectionReport` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repairRequestId` int(11) DEFAULT NULL,
  `inspectionTypeId` int(11) DEFAULT NULL,
  `technicianId` int(11) DEFAULT NULL,
  `summary` text DEFAULT NULL,
  `result` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `reportDate` date DEFAULT NULL,
  `branchId` int(11) DEFAULT NULL,
  `invoiceLink` varchar(255) DEFAULT NULL,
  `qrCode` varchar(255) DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `repairRequestId` (`repairRequestId`),
  KEY `inspectionTypeId` (`inspectionTypeId`),
  KEY `technicianId` (`technicianId`),
  KEY `branchId` (`branchId`),
  CONSTRAINT `InspectionReport_ibfk_1` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`),
  CONSTRAINT `InspectionReport_ibfk_2` FOREIGN KEY (`inspectionTypeId`) REFERENCES `InspectionType` (`id`),
  CONSTRAINT `InspectionReport_ibfk_3` FOREIGN KEY (`technicianId`) REFERENCES `User` (`id`),
  CONSTRAINT `InspectionReport_ibfk_4` FOREIGN KEY (`branchId`) REFERENCES `Branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InspectionType`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InspectionType` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InventoryItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InventoryItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sku` varchar(100) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `purchasePrice` decimal(12,2) DEFAULT NULL,
  `sellingPrice` decimal(12,2) DEFAULT NULL,
  `serialNumber` varchar(100) DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InventoryItemCategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InventoryItemCategory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `parentId` int(11) DEFAULT NULL COMMENT 'فئة أب (للتصنيف الهرمي)',
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL COMMENT 'أيقونة الفئة',
  `displayOrder` int(11) DEFAULT 0,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_category_parent` (`parentId`),
  KEY `idx_category_order` (`displayOrder`),
  KEY `idx_category_active` (`isActive`),
  CONSTRAINT `InventoryItemCategory_ibfk_1` FOREIGN KEY (`parentId`) REFERENCES `InventoryItemCategory` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='فئات الأصناف المخزنية';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InventoryItemVendor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InventoryItemVendor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inventoryItemId` int(11) NOT NULL,
  `vendorId` int(11) NOT NULL,
  `vendorPartNumber` varchar(100) DEFAULT NULL COMMENT 'رقم القطعة عند المورد',
  `unitPrice` decimal(10,2) NOT NULL COMMENT 'السعر من هذا المورد',
  `minOrderQuantity` int(11) DEFAULT 1 COMMENT 'الحد الأدنى للطلب',
  `leadTimeDays` int(11) DEFAULT 7 COMMENT 'مدة التوريد',
  `isPrimary` tinyint(1) DEFAULT 0 COMMENT 'مورد أساسي',
  `lastPurchaseDate` date DEFAULT NULL COMMENT 'آخر عملية شراء',
  `lastPurchasePrice` decimal(10,2) DEFAULT NULL COMMENT 'آخر سعر شراء',
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_item_vendor` (`inventoryItemId`,`vendorId`),
  KEY `vendorId` (`vendorId`),
  KEY `idx_item_vendor_primary` (`isPrimary`),
  CONSTRAINT `InventoryItemVendor_ibfk_1` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`) ON DELETE CASCADE,
  CONSTRAINT `InventoryItemVendor_ibfk_2` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='موردين الأصناف';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Invoice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `amountPaid` decimal(12,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `repairRequestId` int(11) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'EGP',
  `taxAmount` decimal(12,2) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `repairRequestId` (`repairRequestId`),
  CONSTRAINT `Invoice_ibfk_1` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InvoiceItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InvoiceItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quantity` int(11) DEFAULT NULL,
  `unitPrice` decimal(12,2) DEFAULT NULL,
  `totalPrice` decimal(12,2) DEFAULT NULL,
  `invoiceId` int(11) DEFAULT NULL,
  `serviceId` int(11) DEFAULT NULL,
  `inventoryItemId` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `itemType` enum('part','service') DEFAULT 'part',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `invoiceId` (`invoiceId`),
  KEY `serviceId` (`serviceId`),
  KEY `inventoryItemId` (`inventoryItemId`),
  CONSTRAINT `InvoiceItem_ibfk_1` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice` (`id`),
  CONSTRAINT `InvoiceItem_ibfk_2` FOREIGN KEY (`serviceId`) REFERENCES `Service` (`id`),
  CONSTRAINT `InvoiceItem_ibfk_3` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `InvoiceTemplate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InvoiceTemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'اسم القالب',
  `type` enum('standard','tax','commercial','service','receipt') DEFAULT 'standard' COMMENT 'نوع القالب',
  `description` text DEFAULT NULL COMMENT 'وصف القالب',
  `headerHTML` text DEFAULT NULL COMMENT 'HTML الرأس',
  `footerHTML` text DEFAULT NULL COMMENT 'HTML التذييل',
  `stylesCSS` text DEFAULT NULL COMMENT 'أنماط CSS مخصصة',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'إعدادات القالب (ألوان، خطوط، شعار، إلخ)' CHECK (json_valid(`settings`)),
  `isDefault` tinyint(1) DEFAULT 0 COMMENT 'هل هو القالب الافتراضي لهذا النوع',
  `isActive` tinyint(1) DEFAULT 1 COMMENT 'هل القالب نشط',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` timestamp NULL DEFAULT NULL COMMENT 'تاريخ الحذف المنطقي',
  PRIMARY KEY (`id`),
  KEY `idx_template_type` (`type`),
  KEY `idx_template_default` (`isDefault`),
  KEY `idx_template_active` (`isActive`),
  KEY `idx_template_deleted` (`deletedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='قوالب الفواتير';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `userId` int(11) DEFAULT NULL,
  `repairRequestId` int(11) DEFAULT NULL,
  `channel` enum('EMAIL','SMS','IN_APP') DEFAULT 'IN_APP',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `repairRequestId` (`repairRequestId`),
  CONSTRAINT `Notification_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`),
  CONSTRAINT `Notification_ibfk_2` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `NotificationTemplate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `NotificationTemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT NULL,
  `template` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `PartsUsed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `PartsUsed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quantity` int(11) DEFAULT NULL,
  `repairRequestId` int(11) DEFAULT NULL,
  `inventoryItemId` int(11) DEFAULT NULL,
  `invoiceItemId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `repairRequestId` (`repairRequestId`),
  KEY `inventoryItemId` (`inventoryItemId`),
  CONSTRAINT `PartsUsed_ibfk_1` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`),
  CONSTRAINT `PartsUsed_ibfk_2` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Payment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `amount` decimal(12,2) DEFAULT NULL,
  `paymentMethod` varchar(50) DEFAULT NULL,
  `invoiceId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'EGP',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `invoiceId` (`invoiceId`),
  KEY `userId` (`userId`),
  CONSTRAINT `Payment_ibfk_1` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice` (`id`),
  CONSTRAINT `Payment_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `PurchaseOrder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `PurchaseOrder` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(50) DEFAULT NULL,
  `vendorId` int(11) DEFAULT NULL,
  `approvalStatus` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `approvedById` int(11) DEFAULT NULL,
  `approvalDate` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `vendorId` (`vendorId`),
  KEY `approvedById` (`approvedById`),
  CONSTRAINT `PurchaseOrder_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`),
  CONSTRAINT `PurchaseOrder_ibfk_2` FOREIGN KEY (`approvedById`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `PurchaseOrderItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `PurchaseOrderItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quantity` int(11) DEFAULT NULL,
  `unitPrice` decimal(12,2) DEFAULT NULL,
  `totalPrice` decimal(12,2) DEFAULT NULL,
  `purchaseOrderId` int(11) DEFAULT NULL,
  `inventoryItemId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `purchaseOrderId` (`purchaseOrderId`),
  KEY `inventoryItemId` (`inventoryItemId`),
  CONSTRAINT `PurchaseOrderItem_ibfk_1` FOREIGN KEY (`purchaseOrderId`) REFERENCES `PurchaseOrder` (`id`),
  CONSTRAINT `PurchaseOrderItem_ibfk_2` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Quotation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Quotation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('PENDING','SENT','APPROVED','REJECTED') DEFAULT 'PENDING',
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `taxAmount` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `sentAt` datetime DEFAULT NULL,
  `responseAt` datetime DEFAULT NULL,
  `repairRequestId` int(11) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'EGP',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `repairRequestId` (`repairRequestId`),
  CONSTRAINT `Quotation_ibfk_1` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `QuotationItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QuotationItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `unitPrice` decimal(12,2) DEFAULT NULL,
  `totalPrice` decimal(12,2) DEFAULT NULL,
  `quotationId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `quotationId` (`quotationId`),
  CONSTRAINT `QuotationItem_ibfk_1` FOREIGN KEY (`quotationId`) REFERENCES `Quotation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `RepairRequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RepairRequest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deviceId` int(11) DEFAULT NULL,
  `reportedProblem` text DEFAULT NULL,
  `technicianReport` text DEFAULT NULL,
  `status` enum('RECEIVED','INSPECTION','AWAITING_APPROVAL','UNDER_REPAIR','READY_FOR_DELIVERY','DELIVERED','REJECTED','WAITING_PARTS','ON_HOLD') DEFAULT 'RECEIVED',
  `trackingToken` varchar(64) DEFAULT NULL,
  `customerId` int(11) DEFAULT NULL,
  `branchId` int(11) DEFAULT NULL,
  `technicianId` int(11) DEFAULT NULL,
  `quotationId` int(11) DEFAULT NULL,
  `invoiceId` int(11) DEFAULT NULL,
  `deviceBatchId` int(11) DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trackingToken` (`trackingToken`),
  KEY `deviceId` (`deviceId`),
  KEY `customerId` (`customerId`),
  KEY `branchId` (`branchId`),
  KEY `technicianId` (`technicianId`),
  KEY `deviceBatchId` (`deviceBatchId`),
  CONSTRAINT `RepairRequest_ibfk_1` FOREIGN KEY (`deviceId`) REFERENCES `Device` (`id`),
  CONSTRAINT `RepairRequest_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`),
  CONSTRAINT `RepairRequest_ibfk_3` FOREIGN KEY (`branchId`) REFERENCES `Branch` (`id`),
  CONSTRAINT `RepairRequest_ibfk_4` FOREIGN KEY (`technicianId`) REFERENCES `User` (`id`),
  CONSTRAINT `RepairRequest_ibfk_5` FOREIGN KEY (`deviceBatchId`) REFERENCES `DeviceBatch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `RepairRequestAccessory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RepairRequestAccessory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repairRequestId` int(11) NOT NULL,
  `accessoryOptionId` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `notes` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rr_acc` (`repairRequestId`,`accessoryOptionId`),
  KEY `accessoryOptionId` (`accessoryOptionId`),
  CONSTRAINT `RepairRequestAccessory_ibfk_1` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`),
  CONSTRAINT `RepairRequestAccessory_ibfk_2` FOREIGN KEY (`accessoryOptionId`) REFERENCES `VariableOption` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `RepairRequestService`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RepairRequestService` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repairRequestId` int(11) DEFAULT NULL,
  `serviceId` int(11) DEFAULT NULL,
  `technicianId` int(11) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `repairRequestId` (`repairRequestId`),
  KEY `serviceId` (`serviceId`),
  KEY `technicianId` (`technicianId`),
  CONSTRAINT `RepairRequestService_ibfk_1` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`),
  CONSTRAINT `RepairRequestService_ibfk_2` FOREIGN KEY (`serviceId`) REFERENCES `Service` (`id`),
  CONSTRAINT `RepairRequestService_ibfk_3` FOREIGN KEY (`technicianId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `parentRoleId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `parentRoleId` (`parentRoleId`),
  CONSTRAINT `Role_ibfk_1` FOREIGN KEY (`parentRoleId`) REFERENCES `Role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Service`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Service` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `basePrice` decimal(12,2) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StatusUpdateLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StatusUpdateLog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repairRequestId` int(11) DEFAULT NULL,
  `fromStatus` varchar(50) DEFAULT NULL,
  `toStatus` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `changedById` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `repairRequestId` (`repairRequestId`),
  KEY `changedById` (`changedById`),
  CONSTRAINT `StatusUpdateLog_ibfk_1` FOREIGN KEY (`repairRequestId`) REFERENCES `RepairRequest` (`id`),
  CONSTRAINT `StatusUpdateLog_ibfk_2` FOREIGN KEY (`changedById`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StockAlert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StockAlert` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inventoryItemId` int(11) NOT NULL,
  `warehouseId` int(11) NOT NULL,
  `alertType` enum('low_stock','out_of_stock','overstock','expiring_soon','expired') NOT NULL,
  `currentQuantity` int(11) DEFAULT NULL,
  `threshold` int(11) DEFAULT NULL COMMENT 'الحد المحدد',
  `severity` enum('info','warning','critical') DEFAULT 'warning',
  `status` enum('active','acknowledged','resolved') DEFAULT 'active',
  `message` text DEFAULT NULL,
  `acknowledgedBy` int(11) DEFAULT NULL,
  `acknowledgedAt` timestamp NULL DEFAULT NULL,
  `resolvedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `warehouseId` (`warehouseId`),
  KEY `acknowledgedBy` (`acknowledgedBy`),
  KEY `idx_alert_status` (`status`),
  KEY `idx_alert_type` (`alertType`),
  KEY `idx_alert_severity` (`severity`),
  KEY `idx_alert_item_warehouse` (`inventoryItemId`,`warehouseId`),
  CONSTRAINT `StockAlert_ibfk_1` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`),
  CONSTRAINT `StockAlert_ibfk_2` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse` (`id`),
  CONSTRAINT `StockAlert_ibfk_3` FOREIGN KEY (`acknowledgedBy`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='تنبيهات المخزون';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StockCount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StockCount` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `countNumber` varchar(50) NOT NULL,
  `warehouseId` int(11) NOT NULL,
  `countDate` date NOT NULL,
  `status` enum('scheduled','in_progress','pending_review','approved','completed','cancelled') DEFAULT 'scheduled',
  `type` enum('full','partial','cycle','spot') DEFAULT 'full',
  `countedBy` int(11) NOT NULL,
  `completedBy` int(11) DEFAULT NULL,
  `reviewedBy` int(11) DEFAULT NULL,
  `approvedBy` int(11) DEFAULT NULL,
  `adjustedBy` int(11) DEFAULT NULL,
  `scheduledStartTime` timestamp NULL DEFAULT NULL,
  `actualStartTime` timestamp NULL DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `approvedAt` timestamp NULL DEFAULT NULL,
  `totalItems` int(11) DEFAULT 0,
  `itemsCounted` int(11) DEFAULT 0,
  `discrepancies` int(11) DEFAULT 0 COMMENT 'عدد الأصناف بها فروقات',
  `totalValueDifference` decimal(12,2) DEFAULT 0.00 COMMENT 'قيمة الفروقات',
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `countNumber` (`countNumber`),
  KEY `countedBy` (`countedBy`),
  KEY `reviewedBy` (`reviewedBy`),
  KEY `adjustedBy` (`adjustedBy`),
  KEY `idx_count_warehouse` (`warehouseId`),
  KEY `idx_count_status` (`status`),
  KEY `idx_count_date` (`countDate`),
  KEY `idx_stockcount_completed` (`completedBy`),
  KEY `idx_stockcount_approved` (`approvedBy`),
  CONSTRAINT `StockCount_ibfk_1` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse` (`id`),
  CONSTRAINT `StockCount_ibfk_2` FOREIGN KEY (`countedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `StockCount_ibfk_3` FOREIGN KEY (`reviewedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `StockCount_ibfk_4` FOREIGN KEY (`approvedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `StockCount_ibfk_5` FOREIGN KEY (`adjustedBy`) REFERENCES `User` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='جرد المخزون';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StockCountItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StockCountItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stockCountId` int(11) NOT NULL,
  `inventoryItemId` int(11) NOT NULL,
  `systemQuantity` int(11) NOT NULL COMMENT 'الكمية في النظام',
  `actualQuantity` int(11) DEFAULT NULL COMMENT 'الكمية الفعلية',
  `difference` int(11) GENERATED ALWAYS AS (coalesce(`actualQuantity`,0) - `systemQuantity`) STORED,
  `status` enum('pending','counted','verified','adjusted') DEFAULT 'pending',
  `countedAt` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `scannedBarcode` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_count_item` (`stockCountId`,`inventoryItemId`),
  KEY `inventoryItemId` (`inventoryItemId`),
  KEY `idx_count_item_status` (`status`),
  KEY `idx_count_item_difference` (`difference`),
  CONSTRAINT `StockCountItem_ibfk_1` FOREIGN KEY (`stockCountId`) REFERENCES `StockCount` (`id`) ON DELETE CASCADE,
  CONSTRAINT `StockCountItem_ibfk_2` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='عناصر جرد المخزون';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StockLevel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StockLevel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inventoryItemId` int(11) DEFAULT NULL,
  `warehouseId` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `minLevel` int(11) DEFAULT 0,
  `isLowStock` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `inventoryItemId` (`inventoryItemId`),
  KEY `warehouseId` (`warehouseId`),
  CONSTRAINT `StockLevel_ibfk_1` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`),
  CONSTRAINT `StockLevel_ibfk_2` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StockMovement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StockMovement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('IN','OUT','TRANSFER') NOT NULL,
  `quantity` int(11) DEFAULT NULL,
  `inventoryItemId` int(11) DEFAULT NULL,
  `fromWarehouseId` int(11) DEFAULT NULL,
  `toWarehouseId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `inventoryItemId` (`inventoryItemId`),
  KEY `fromWarehouseId` (`fromWarehouseId`),
  KEY `toWarehouseId` (`toWarehouseId`),
  KEY `userId` (`userId`),
  CONSTRAINT `StockMovement_ibfk_1` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`),
  CONSTRAINT `StockMovement_ibfk_2` FOREIGN KEY (`fromWarehouseId`) REFERENCES `Warehouse` (`id`),
  CONSTRAINT `StockMovement_ibfk_3` FOREIGN KEY (`toWarehouseId`) REFERENCES `Warehouse` (`id`),
  CONSTRAINT `StockMovement_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StockTransfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StockTransfer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transferNumber` varchar(50) NOT NULL,
  `fromWarehouseId` int(11) NOT NULL,
  `toWarehouseId` int(11) NOT NULL,
  `status` enum('pending','approved','rejected','in_transit','completed','cancelled') DEFAULT 'pending',
  `requestedBy` int(11) NOT NULL,
  `approvedBy` int(11) DEFAULT NULL,
  `shippedBy` int(11) DEFAULT NULL,
  `receivedBy` int(11) DEFAULT NULL,
  `transferDate` date NOT NULL,
  `expectedArrivalDate` date DEFAULT NULL,
  `approvedAt` timestamp NULL DEFAULT NULL,
  `shippedAt` timestamp NULL DEFAULT NULL,
  `receivedAt` timestamp NULL DEFAULT NULL,
  `carrier` varchar(100) DEFAULT NULL COMMENT 'شركة النقل',
  `trackingNumber` varchar(100) DEFAULT NULL COMMENT 'رقم التتبع',
  `shippingCost` decimal(10,2) DEFAULT 0.00,
  `reason` text DEFAULT NULL COMMENT 'سبب النقل',
  `notes` text DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transferNumber` (`transferNumber`),
  KEY `toWarehouseId` (`toWarehouseId`),
  KEY `requestedBy` (`requestedBy`),
  KEY `approvedBy` (`approvedBy`),
  KEY `shippedBy` (`shippedBy`),
  KEY `receivedBy` (`receivedBy`),
  KEY `idx_transfer_status` (`status`),
  KEY `idx_transfer_warehouses` (`fromWarehouseId`,`toWarehouseId`),
  KEY `idx_transfer_dates` (`transferDate`,`expectedArrivalDate`),
  CONSTRAINT `StockTransfer_ibfk_1` FOREIGN KEY (`fromWarehouseId`) REFERENCES `Warehouse` (`id`),
  CONSTRAINT `StockTransfer_ibfk_2` FOREIGN KEY (`toWarehouseId`) REFERENCES `Warehouse` (`id`),
  CONSTRAINT `StockTransfer_ibfk_3` FOREIGN KEY (`requestedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `StockTransfer_ibfk_4` FOREIGN KEY (`approvedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `StockTransfer_ibfk_5` FOREIGN KEY (`shippedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `StockTransfer_ibfk_6` FOREIGN KEY (`receivedBy`) REFERENCES `User` (`id`),
  CONSTRAINT `chk_different_warehouses` CHECK (`fromWarehouseId` <> `toWarehouseId`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='نقل المخزون بين الفروع';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `StockTransferItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `StockTransferItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transferId` int(11) NOT NULL,
  `inventoryItemId` int(11) NOT NULL,
  `requestedQuantity` int(11) NOT NULL,
  `shippedQuantity` int(11) DEFAULT 0,
  `receivedQuantity` int(11) DEFAULT 0,
  `damagedQuantity` int(11) DEFAULT 0,
  `condition` enum('good','damaged','missing') DEFAULT 'good',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventoryItemId` (`inventoryItemId`),
  KEY `idx_transfer_item` (`transferId`,`inventoryItemId`),
  CONSTRAINT `StockTransferItem_ibfk_1` FOREIGN KEY (`transferId`) REFERENCES `StockTransfer` (`id`) ON DELETE CASCADE,
  CONSTRAINT `StockTransferItem_ibfk_2` FOREIGN KEY (`inventoryItemId`) REFERENCES `InventoryItem` (`id`),
  CONSTRAINT `chk_quantities` CHECK (`receivedQuantity` <= `shippedQuantity` and `damagedQuantity` <= `receivedQuantity`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='عناصر نقل المخزون';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `SystemSetting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SystemSetting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `type` enum('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
  `description` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `User` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `roleId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `User_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `UserLoginLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserLoginLog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `loginAt` datetime DEFAULT current_timestamp(),
  `ipAddress` varchar(45) DEFAULT NULL,
  `deviceInfo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `UserLoginLog_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `VariableCategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `VariableCategory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `scope` enum('GLOBAL','DEVICE','REPAIR','CUSTOMER') DEFAULT 'GLOBAL',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `VariableOption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `VariableOption` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categoryId` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `value` varchar(100) NOT NULL,
  `deviceType` varchar(100) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `sortOrder` int(11) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_varopt_cat_val_dev` (`categoryId`,`value`,`deviceType`),
  CONSTRAINT `VariableOption_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `VariableCategory` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Vendor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Vendor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `VendorPayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `VendorPayment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendorId` int(11) NOT NULL,
  `purchaseOrderId` int(11) DEFAULT NULL COMMENT 'أمر الشراء المرتبط',
  `paymentNumber` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentMethod` enum('cash','bank_transfer','check','credit_card') DEFAULT 'cash',
  `paymentDate` date NOT NULL,
  `referenceNumber` varchar(100) DEFAULT NULL COMMENT 'رقم الحوالة/الشيك',
  `bankName` varchar(100) DEFAULT NULL,
  `checkNumber` varchar(50) DEFAULT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'صور الإيصالات' CHECK (json_valid(`attachments`)),
  `createdBy` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `paymentNumber` (`paymentNumber`),
  KEY `createdBy` (`createdBy`),
  KEY `idx_vendor_payment` (`vendorId`),
  KEY `idx_payment_po` (`purchaseOrderId`),
  KEY `idx_payment_date` (`paymentDate`),
  KEY `idx_payment_status` (`status`),
  CONSTRAINT `VendorPayment_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`),
  CONSTRAINT `VendorPayment_ibfk_2` FOREIGN KEY (`purchaseOrderId`) REFERENCES `PurchaseOrder` (`id`) ON DELETE SET NULL,
  CONSTRAINT `VendorPayment_ibfk_3` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='مدفوعات الموردين';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Warehouse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Warehouse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_activity_user` (`userId`),
  KEY `idx_activity_date` (`timestamp`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


SET FOREIGN_KEY_CHECKS=1;

-- ============================================
-- Schema Created Successfully
-- ============================================
-- Total Tables: 55
-- Ready for use!
-- ============================================
