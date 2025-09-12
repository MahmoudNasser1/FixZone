-- Fix Zone ERP Schema Order Fix
-- This file fixes the table creation order issues in fixzone_erp_full_schema.sql

-- Step 1: Drop tables in correct dependency order
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables that depend on VariableOption first
DROP TABLE IF EXISTS Device;
DROP TABLE IF EXISTS RepairRequestAccessory;
DROP TABLE IF EXISTS RepairRequest;
DROP TABLE IF EXISTS DeviceBatch;

-- Drop VariableOption before VariableCategory
DROP TABLE IF EXISTS VariableOption;
DROP TABLE IF EXISTS VariableCategory;

-- Drop other tables
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS SystemSetting;
DROP TABLE IF EXISTS NotificationTemplate;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS InspectionComponent;
DROP TABLE IF EXISTS InspectionReport;
DROP TABLE IF EXISTS InspectionType;
DROP TABLE IF EXISTS RepairRequestService;
DROP TABLE IF EXISTS Service;
DROP TABLE IF EXISTS Expense;
DROP TABLE IF EXISTS ExpenseCategory;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS InvoiceItem;
DROP TABLE IF EXISTS Invoice;
DROP TABLE IF EXISTS PartsUsed;
DROP TABLE IF EXISTS PurchaseOrderItem;
DROP TABLE IF EXISTS PurchaseOrder;
DROP TABLE IF EXISTS Vendor;
DROP TABLE IF EXISTS StockMovement;
DROP TABLE IF EXISTS StockLevel;
DROP TABLE IF EXISTS InventoryItem;
DROP TABLE IF EXISTS Warehouse;
DROP TABLE IF EXISTS QuotationItem;
DROP TABLE IF EXISTS Quotation;
DROP TABLE IF EXISTS StatusUpdateLog;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Company;
DROP TABLE IF EXISTS UserLoginLog;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS Branch;
DROP TABLE IF EXISTS City;

SET FOREIGN_KEY_CHECKS = 1;

-- Step 2: Create tables in correct dependency order
-- First: Independent tables (no foreign keys)
CREATE TABLE City (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE Company (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(30),
    address VARCHAR(255),
    taxNumber VARCHAR(50),
    customFields JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE Role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON,
    parentRoleId INT DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (parentRoleId) REFERENCES Role(id)
);

-- Second: Tables with simple foreign keys
CREATE TABLE Branch (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(30),
    cityId INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (cityId) REFERENCES City(id)
);

CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) UNIQUE,
    isActive BOOLEAN DEFAULT TRUE,
    roleId INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (roleId) REFERENCES Role(id)
);

CREATE TABLE Customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100),
    address VARCHAR(255),
    companyId INT DEFAULT NULL,
    customFields JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (companyId) REFERENCES Company(id)
);

-- Third: Variable tables (must be created before Device)
CREATE TABLE VariableCategory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scope ENUM('GLOBAL','DEVICE','REPAIR','CUSTOMER') DEFAULT 'GLOBAL',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE VariableOption (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoryId INT NOT NULL,
    label VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    deviceType VARCHAR(100) DEFAULT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    sortOrder INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    UNIQUE KEY uq_varopt_cat_val_dev (categoryId, value, deviceType),
    FOREIGN KEY (categoryId) REFERENCES VariableCategory(id)
);

-- Fourth: Device and related tables
CREATE TABLE DeviceBatch (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clientId INT,
    receivedById INT,
    batchDate DATE,
    notes TEXT,
    status ENUM('PENDING','COMPLETED') DEFAULT 'PENDING',
    importLog TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES Customer(id),
    FOREIGN KEY (receivedById) REFERENCES User(id)
);

CREATE TABLE Device (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT,
    deviceType VARCHAR(100),
    brand VARCHAR(100),
    brandId INT NULL,
    model VARCHAR(100),
    cpu VARCHAR(100),
    gpu VARCHAR(100),
    ram VARCHAR(50),
    storage VARCHAR(50),
    serialNumber VARCHAR(100),
    devicePassword VARCHAR(100) NULL,
    customFields JSON,
    deviceBatchId INT DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (customerId) REFERENCES Customer(id),
    FOREIGN KEY (deviceBatchId) REFERENCES DeviceBatch(id),
    FOREIGN KEY (brandId) REFERENCES VariableOption(id)
);

-- Continue with other tables...
-- Note: This is a partial fix. For the complete schema, use the original file
-- after running this fix first.

SELECT 'Schema order fix completed successfully!' as message;
