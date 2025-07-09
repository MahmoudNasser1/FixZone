-- Fix Zone ERP Comprehensive Demo/Seed Data
-- Use this file to populate the database with initial data for testing.
-- Make sure you have already run the `fixzone_erp_full_schema.sql` script.

USE FZ;

-- Truncate tables to ensure a clean slate before seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `RepairRequestService`;
TRUNCATE TABLE `Payment`;
TRUNCATE TABLE `InvoiceItem`;
TRUNCATE TABLE `Invoice`;
TRUNCATE TABLE `QuotationItem`;
TRUNCATE TABLE `Quotation`;
TRUNCATE TABLE `StatusUpdateLog`;
TRUNCATE TABLE `RepairRequest`;
TRUNCATE TABLE `Device`;
TRUNCATE TABLE `Customer`;
TRUNCATE TABLE `Company`;
TRUNCATE TABLE `UserLoginLog`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Role`;
TRUNCATE TABLE `Branch`;
TRUNCATE TABLE `City`;
TRUNCATE TABLE `StockMovement`;
TRUNCATE TABLE `StockLevel`;
TRUNCATE TABLE `InventoryItem`;
TRUNCATE TABLE `Warehouse`;
TRUNCATE TABLE `PurchaseOrderItem`;
TRUNCATE TABLE `PurchaseOrder`;
TRUNCATE TABLE `Vendor`;
TRUNCATE TABLE `Service`;
TRUNCATE TABLE `Expense`;
TRUNCATE TABLE `ExpenseCategory`;
TRUNCATE TABLE `NotificationTemplate`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------
-- 1. Core Data
-- ----------------------

INSERT INTO `Role` (`id`, `name`, `permissions`) VALUES
(1, 'Super Admin', '{\"system\": \"all\"}'),
(2, 'Branch Manager', '{\"reports\": \"view\", \"users\": \"manage_branch\"}'),
(3, 'Technician', '{\"repairs\": \"update_status\", \"parts\": \"request\"}'),
(4, 'Receptionist', '{\"customers\": \"create\", \"repairs\": \"create\"}');

INSERT INTO `City` (`id`, `name`) VALUES (1, 'Cairo'), (2, 'Alexandria');

INSERT INTO `Branch` (`id`, `name`, `address`, `phone`, `cityId`) VALUES
(1, 'Nasr City Branch', '123 Tahrir St.', '01000000001', 1),
(2, 'Smouha Branch', '456 Cornish Rd.', '01222222222', 2);

INSERT INTO `User` (`id`, `name`, `email`, `password`, `phone`, `isActive`, `roleId`) VALUES
(1, 'Mahmoud Nasser', 'admin@fix.zone', '$2a$10$gL33obKAFUT5DK3pEbh72OIx9Id/aD6L3hN/T4S2XQ3ccOR/14M7q', '01012345678', 1, 1),
(2, 'Ahmed Ali', 'manager.cairo@fix.zone', '$2a$10$gL33obKAFUT5DK3pEbh72OIx9Id/aD6L3hN/T4S2XQ3ccOR/14M7q', '01098765432', 1, 2),
(3, 'Sara Hassan', 'tech.cairo@fix.zone', '$2a$10$gL33obKAFUT5DK3pEbh72OIx9Id/aD6L3hN/T4S2XQ3ccOR/14M7q', '01111111111', 1, 3),
(4, 'Fatma Ibrahim', 'recep.alex@fix.zone', '$2a$10$gL33obKAFUT5DK3pEbh72OIx9Id/aD6L3hN/T4S2XQ3ccOR/14M7q', '01233333333', 1, 4);

-- ----------------------
-- 2. CRM Data
-- ----------------------

INSERT INTO `Company` (`id`, `name`, `email`, `phone`, `address`) VALUES
(1, 'Tech Solutions Inc.', 'contact@techsolutions.com', '0223456789', 'Maadi, Cairo'),
(2, 'Global Logistics', 'info@globallogistics.net', '034567890', 'Roushdy, Alexandria');

INSERT INTO `Customer` (`id`, `name`, `phone`, `email`, `address`, `companyId`) VALUES
(1, 'Mona Kamal', '01011112222', 'mona.k@email.com', 'Zamalek, Cairo', NULL),
(2, 'Hany Adel', '01288889999', 'hany.a@email.com', 'Gleem, Alexandria', NULL),
(3, 'Company Contact 1', '01555556666', 'contact1@techsolutions.com', 'Maadi, Cairo', 1);

-- ----------------------
-- 3. Inventory & Purchasing
-- ----------------------

INSERT INTO `Warehouse` (`id`, `name`) VALUES (1, 'Main Warehouse'), (2, 'Technician Van Stock');

INSERT INTO `InventoryItem` (`id`, `sku`, `name`, `type`, `purchasePrice`, `sellingPrice`) VALUES
(1, 'SCR-IP12', 'iPhone 12 Screen', 'Part', 1500.00, 2200.00),
(2, 'BAT-S21', 'Samsung S21 Battery', 'Part', 800.00, 1300.00),
(3, 'CHR-DELL-XPS', 'Dell XPS Charger', 'Accessory', 500.00, 850.00);

INSERT INTO `StockLevel` (`inventoryItemId`, `warehouseId`, `quantity`, `minLevel`) VALUES (1, 1, 50, 10), (2, 1, 30, 10), (3, 2, 5, 2);

INSERT INTO `Vendor` (`id`, `name`, `email`) VALUES (1, 'Global Parts Supplier', 'sales@gps.com'), (2, 'Local Electronics', 'contact@localelec.com');

-- ----------------------
-- 4. Services & Repairs
-- ----------------------

INSERT INTO `Service` (`id`, `name`, `description`, `basePrice`) VALUES
(1, 'Screen Replacement', 'Full screen assembly replacement.', 500.00),
(2, 'Battery Change', 'New battery installation and testing.', 250.00),
(3, 'Software Diagnosis', 'Full software checkup and virus removal.', 300.00);

INSERT INTO `Device` (`id`, `customerId`, `deviceType`, `brand`, `model`, `serialNumber`) VALUES
(1, 1, 'Laptop', 'Dell', 'XPS 15', 'ABC123XYZ'),
(2, 2, 'Smartphone', 'Samsung', 'Galaxy S21', 'DEF456HIJ');

INSERT INTO `RepairRequest` (`id`, `deviceId`, `reportedProblem`, `status`, `customerId`, `branchId`, `technicianId`) VALUES
(1, 1, 'Screen is flickering and battery drains quickly.', 'AWAITING_APPROVAL', 1, 1, 3),
(2, 2, 'Phone does not turn on after dropping it.', 'INSPECTION', 2, 2, 3);

INSERT INTO `StatusUpdateLog` (`repairRequestId`, `fromStatus`, `toStatus`, `changedById`) VALUES (1, 'RECEIVED', 'INSPECTION', 4), (1, 'INSPECTION', 'AWAITING_APPROVAL', 3);

-- ----------------------
-- 5. Financials (Quotations, Invoices, Payments)
-- ----------------------

-- Quotation for Repair Request 1
INSERT INTO `Quotation` (`id`, `status`, `totalAmount`, `taxAmount`, `repairRequestId`, `currency`) VALUES
(1, 'SENT', 2750.00, 350.00, 1, 'EGP');

INSERT INTO `QuotationItem` (`description`, `quantity`, `unitPrice`, `totalPrice`, `quotationId`) VALUES
('Dell XPS 15 Screen (Part)', 1, 2200.00, 2200.00, 1),
('Software Diagnosis Service', 1, 300.00, 300.00, 1);

-- Let's assume the quotation was approved and an invoice was generated.
UPDATE `RepairRequest` SET `status` = 'UNDER_REPAIR', `quotationId` = 1 WHERE `id` = 1;

INSERT INTO `Invoice` (`id`, `totalAmount`, `amountPaid`, `status`, `repairRequestId`, `currency`, `taxAmount`) VALUES
(1, 2750.00, 1000.00, 'PARTIALLY_PAID', 1, 'EGP', 350.00);

UPDATE `RepairRequest` SET `invoiceId` = 1 WHERE `id` = 1;

INSERT INTO `InvoiceItem` (`quantity`, `unitPrice`, `totalPrice`, `invoiceId`) VALUES
(1, 2200.00, 2200.00, 1),
(1, 300.00, 300.00, 1);

INSERT INTO `Payment` (`amount`, `paymentMethod`, `invoiceId`, `userId`) VALUES
(1000.00, 'Credit Card', 1, 4);

-- ----------------------
-- 6. Expenses
-- ----------------------

INSERT INTO `ExpenseCategory` (`id`, `name`) VALUES (1, 'Utilities'), (2, 'Office Supplies');

INSERT INTO `Expense` (`description`, `amount`, `expenseDate`, `categoryId`, `userId`) VALUES
('Monthly Electricity Bill', 1200.50, CURDATE(), 1, 2),
('New Keyboards and Mice', 850.00, CURDATE(), 2, 2);

-- ----------------------
-- 7. Notifications
-- ----------------------

INSERT INTO `NotificationTemplate` (`id`, `name`, `type`, `channel`, `subject`, `body`) VALUES
(1, 'Repair Status Update', 'REPAIR', 'SMS', NULL, 'Dear {customerName}, the status of your repair for device {deviceModel} is now {repairStatus}.'),
(2, 'Quotation Ready', 'QUOTATION', 'EMAIL', 'Your Quotation #{quotationId} is Ready', 'Dear {customerName}, please review your quotation for repair request #{repairRequestId}. Total amount is {totalAmount}.');


SELECT 'Comprehensive seed data has been created successfully.' AS status;

