-- Fix Zone ERP Full SQL Schema
-- Compatible with MySQL/MariaDB (XAMPP)
-- All major modules and enhancements included

CREATE DATABASE IF NOT EXISTS FZ;
USE FZ;

-- ----------------------
-- Drop existing tables (in reverse order of dependencies)
-- ----------------------

SET FOREIGN_KEY_CHECKS = 0;

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
DROP TABLE IF EXISTS RepairRequestAccessory;
DROP TABLE IF EXISTS RepairRequest;
DROP TABLE IF EXISTS Device;
DROP TABLE IF EXISTS DeviceBatch;
DROP TABLE IF EXISTS VariableOption;
DROP TABLE IF EXISTS VariableCategory;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Company;
DROP TABLE IF EXISTS UserLoginLog;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS Branch;
DROP TABLE IF EXISTS City;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------
-- Core Entities
-- ----------------------

CREATE TABLE City (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

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

CREATE TABLE UserLoginLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    loginAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),
    deviceInfo VARCHAR(255),
    FOREIGN KEY (userId) REFERENCES User(id)
);

-- ----------------------
-- Customers, Companies & CRM
-- ----------------------

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

-- ----------------------
-- Devices & Device Batches
-- ----------------------

-- ----------------------
-- Variables (Brands, Accessories)
-- ----------------------

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

-- ----------------------
-- Repair Management
-- ----------------------

CREATE TABLE RepairRequest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deviceId INT,
    reportedProblem TEXT,
    technicianReport TEXT,
    status ENUM('RECEIVED','INSPECTION','AWAITING_APPROVAL','UNDER_REPAIR','READY_FOR_DELIVERY','DELIVERED','REJECTED','WAITING_PARTS','ON_HOLD') DEFAULT 'RECEIVED',
    trackingToken VARCHAR(64) UNIQUE DEFAULT NULL,
    customerId INT,
    branchId INT,
    technicianId INT,
    quotationId INT DEFAULT NULL,
    invoiceId INT DEFAULT NULL,
    deviceBatchId INT DEFAULT NULL,
    attachments JSON,
    customFields JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (deviceId) REFERENCES Device(id),
    FOREIGN KEY (customerId) REFERENCES Customer(id),
    FOREIGN KEY (branchId) REFERENCES Branch(id),
    FOREIGN KEY (technicianId) REFERENCES User(id),
    FOREIGN KEY (deviceBatchId) REFERENCES DeviceBatch(id)
);

-- جدول ربط لملحقات/متعلقات الطلب (Accessories)
CREATE TABLE RepairRequestAccessory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    accessoryOptionId INT NOT NULL,
    quantity INT DEFAULT 1,
    notes VARCHAR(255) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
    FOREIGN KEY (accessoryOptionId) REFERENCES VariableOption(id),
    UNIQUE KEY uq_rr_acc (repairRequestId, accessoryOptionId)
);

CREATE TABLE StatusUpdateLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT,
    fromStatus VARCHAR(50),
    toStatus VARCHAR(50),
    notes TEXT,
    changedById INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
    FOREIGN KEY (changedById) REFERENCES User(id)
);

-- ----------------------
-- Quotations
-- ----------------------

CREATE TABLE Quotation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('PENDING','SENT','APPROVED','REJECTED') DEFAULT 'PENDING',
    totalAmount DECIMAL(12,2),
    taxAmount DECIMAL(12,2),
    notes TEXT,
    sentAt DATETIME,
    responseAt DATETIME,
    repairRequestId INT UNIQUE,
    currency VARCHAR(10) DEFAULT 'EGP',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id)
);

CREATE TABLE QuotationItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255),
    quantity INT,
    unitPrice DECIMAL(12,2),
    totalPrice DECIMAL(12,2),
    quotationId INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quotationId) REFERENCES Quotation(id)
);

-- ----------------------
-- Inventory & Purchasing
-- ----------------------

CREATE TABLE Warehouse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE InventoryItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100),
    type VARCHAR(100),
    purchasePrice DECIMAL(12,2),
    sellingPrice DECIMAL(12,2),
    serialNumber VARCHAR(100),
    customFields JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE StockLevel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventoryItemId INT,
    warehouseId INT,
    quantity INT,
    minLevel INT DEFAULT 0,
    isLowStock BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
    FOREIGN KEY (warehouseId) REFERENCES Warehouse(id)
);

CREATE TABLE StockMovement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('IN','OUT','TRANSFER') NOT NULL,
    quantity INT,
    inventoryItemId INT,
    fromWarehouseId INT DEFAULT NULL,
    toWarehouseId INT DEFAULT NULL,
    userId INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
    FOREIGN KEY (fromWarehouseId) REFERENCES Warehouse(id),
    FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id),
    FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE Vendor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(30),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE PurchaseOrder (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50),
    vendorId INT,
    approvalStatus ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approvedById INT DEFAULT NULL,
    approvalDate DATETIME DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendorId) REFERENCES Vendor(id),
    FOREIGN KEY (approvedById) REFERENCES User(id)
);

CREATE TABLE PurchaseOrderItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantity INT,
    unitPrice DECIMAL(12,2),
    totalPrice DECIMAL(12,2),
    purchaseOrderId INT,
    inventoryItemId INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchaseOrderId) REFERENCES PurchaseOrder(id),
    FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id)
);

CREATE TABLE PartsUsed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantity INT,
    repairRequestId INT,
    inventoryItemId INT,
    invoiceItemId INT DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
    FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id)
);

-- ----------------------
-- Services (moved before Financial Entities)
-- ----------------------

CREATE TABLE Service (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    basePrice DECIMAL(12,2),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

-- ----------------------
-- Financial Entities
-- ----------------------

CREATE TABLE Invoice (
    id INT AUTO_INCREMENT PRIMARY KEY,
    totalAmount DECIMAL(12,2),
    amountPaid DECIMAL(12,2),
    status VARCHAR(50),
    repairRequestId INT UNIQUE,
    currency VARCHAR(10) DEFAULT 'EGP',
    taxAmount DECIMAL(12,2),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id)
);

CREATE TABLE InvoiceItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantity INT,
    unitPrice DECIMAL(12,2),
    totalPrice DECIMAL(12,2),
    invoiceId INT,
    serviceId INT DEFAULT NULL,
    inventoryItemId INT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    itemType ENUM('part', 'service') DEFAULT 'part',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoiceId) REFERENCES Invoice(id),
    FOREIGN KEY (serviceId) REFERENCES Service(id),
    FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id)
);

CREATE TABLE Payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(12,2),
    paymentMethod VARCHAR(50),
    invoiceId INT,
    userId INT,
    currency VARCHAR(10) DEFAULT 'EGP',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoiceId) REFERENCES Invoice(id),
    FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE ExpenseCategory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE Expense (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255),
    amount DECIMAL(12,2),
    expenseDate DATE,
    categoryId INT,
    userId INT,
    currency VARCHAR(10) DEFAULT 'EGP',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (categoryId) REFERENCES ExpenseCategory(id),
    FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE RepairRequestService (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT,
    serviceId INT,
    technicianId INT,
    price DECIMAL(12,2),
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
    FOREIGN KEY (serviceId) REFERENCES Service(id),
    FOREIGN KEY (technicianId) REFERENCES User(id)
);

-- ----------------------
-- Inspection Reports
-- ----------------------

CREATE TABLE InspectionType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    description VARCHAR(255),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE InspectionReport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT,
    inspectionTypeId INT,
    technicianId INT,
    summary TEXT,
    result TEXT,
    recommendations TEXT,
    notes TEXT,
    reportDate DATE,
    branchId INT,
    invoiceLink VARCHAR(255),
    qrCode VARCHAR(255),
    attachments JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
    FOREIGN KEY (inspectionTypeId) REFERENCES InspectionType(id),
    FOREIGN KEY (technicianId) REFERENCES User(id),
    FOREIGN KEY (branchId) REFERENCES Branch(id)
);

CREATE TABLE InspectionComponent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspectionReportId INT,
    name VARCHAR(100),
    status ENUM('WORKING','PARTIAL','DEFECTIVE','NOT_PRESENT'),
    notes VARCHAR(255),
    priority ENUM('HIGH','MEDIUM','LOW','NONE'),
    photo VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspectionReportId) REFERENCES InspectionReport(id)
);

-- ----------------------
-- Notifications & Utility
-- ----------------------

CREATE TABLE Notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    message TEXT,
    isRead BOOLEAN DEFAULT FALSE,
    userId INT DEFAULT NULL,
    repairRequestId INT DEFAULT NULL,
    channel ENUM('EMAIL','SMS','IN_APP') DEFAULT 'IN_APP', -- Enhancement: Multi-channel support
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id)
);

CREATE TABLE NotificationTemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    template TEXT, -- Enhancement: Store templates for recurring notifications
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE SystemSetting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    type ENUM('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE AuditLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100),
    actionType ENUM('CREATE','UPDATE','DELETE','LOGIN'),
    details TEXT,
    entityType VARCHAR(50),
    entityId INT DEFAULT NULL,
    userId INT,
    ipAddress VARCHAR(45),
    beforeValue JSON, -- Enhancement: Store previous state for audit
    afterValue JSON, -- Enhancement: Store new state for audit
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id)
);

-- ----------------------
-- Invoice Templates
-- ----------------------

CREATE TABLE InvoiceTemplate (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT 'اسم القالب',
    type ENUM('standard', 'tax', 'commercial', 'service', 'receipt') DEFAULT 'standard' COMMENT 'نوع القالب',
    description TEXT COMMENT 'وصف القالب',
    
    -- محتوى القالب
    headerHTML TEXT COMMENT 'HTML الرأس',
    footerHTML TEXT COMMENT 'HTML التذييل', 
    stylesCSS TEXT COMMENT 'أنماط CSS مخصصة',
    settings JSON COMMENT 'إعدادات القالب (ألوان، خطوط، شعار، إلخ)',
    
    -- حالة القالب
    isDefault BOOLEAN DEFAULT FALSE COMMENT 'هل هو القالب الافتراضي لهذا النوع',
    isActive BOOLEAN DEFAULT TRUE COMMENT 'هل القالب نشط',
    
    -- تواريخ النظام
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP NULL COMMENT 'تاريخ الحذف المنطقي',
    
    -- فهارس
    INDEX idx_template_type (type),
    INDEX idx_template_default (isDefault),
    INDEX idx_template_active (isActive),
    INDEX idx_template_deleted (deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='قوالب الفواتير';

-- End of schema 