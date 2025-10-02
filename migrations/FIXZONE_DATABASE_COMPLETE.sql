-- =====================================================
-- Fix Zone ERP - نظام إدارة الصيانة الكامل
-- ملف قاعدة البيانات الموحد والكامل
-- يحتوي على: الهيكل الكامل + البيانات الأساسية + التحديثات المهمة
-- تاريخ الإنشاء: 12 سبتمبر 2025
-- الإصدار: 1.0 (Production Ready)
-- =====================================================

-- إعداد قاعدة البيانات
CREATE DATABASE IF NOT EXISTS [fz] CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE FZ;

-- تعطيل فحص المفاتيح الأجنبية مؤقتاً
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- =====================================================
-- الجزء الأول: حذف الجداول الموجودة (في ترتيب عكسي)
-- =====================================================

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
DROP TABLE IF EXISTS activity_log;

-- =====================================================
-- الجزء الثاني: إنشاء الجداول الأساسية
-- =====================================================

-- جدول المدن
CREATE TABLE City (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الفروع
CREATE TABLE Branch (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  cityId INT,
  PRIMARY KEY (id),
  FOREIGN KEY (cityId) REFERENCES City(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الأدوار
CREATE TABLE Role (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSON,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول المستخدمين
CREATE TABLE User (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  roleId INT,
  branchId INT,
  isActive BOOLEAN DEFAULT TRUE,
  lastLoginAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (roleId) REFERENCES Role(id),
  FOREIGN KEY (branchId) REFERENCES Branch(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول سجل تسجيل الدخول
CREATE TABLE UserLoginLog (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  loginAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logoutAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (userId) REFERENCES User(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الشركات
CREATE TABLE Company (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  contactPerson VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  taxNumber VARCHAR(50),
  notes TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_active_company_name (name, deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول العملاء
CREATE TABLE Customer (
  id INT NOT NULL AUTO_INCREMENT,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  companyId INT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE SET NULL,
  INDEX idx_customer_phone (phone),
  INDEX idx_customer_company (companyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول فئات المتغيرات
CREATE TABLE VariableCategory (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول خيارات المتغيرات
CREATE TABLE VariableOption (
  id INT NOT NULL AUTO_INCREMENT,
  categoryId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(255),
  PRIMARY KEY (id),
  FOREIGN KEY (categoryId) REFERENCES VariableCategory(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول دفعات الأجهزة
CREATE TABLE DeviceBatch (
  id INT NOT NULL AUTO_INCREMENT,
  batchNumber VARCHAR(50) NOT NULL UNIQUE,
  deviceModel VARCHAR(100) NOT NULL,
  totalDevices INT DEFAULT 0,
  receivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الأجهزة
CREATE TABLE Device (
  id INT NOT NULL AUTO_INCREMENT,
  serialNumber VARCHAR(100),
  deviceModel VARCHAR(100) NOT NULL,
  deviceBrand VARCHAR(100),
  deviceType VARCHAR(50),
  devicePassword VARCHAR(255),
  batchId INT,
  PRIMARY KEY (id),
  FOREIGN KEY (batchId) REFERENCES DeviceBatch(id),
  UNIQUE KEY unique_serial (serialNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول طلبات الإصلاح
CREATE TABLE RepairRequest (
  id INT NOT NULL AUTO_INCREMENT,
  customerId INT NOT NULL,
  deviceId INT,
  deviceModel VARCHAR(100),
  deviceBrand VARCHAR(100),
  deviceType VARCHAR(50),
  serialNumber VARCHAR(100),
  devicePassword VARCHAR(255),
  issueDescription TEXT NOT NULL,
  customerNotes TEXT,
  estimatedCost DECIMAL(10, 2),
  actualCost DECIMAL(10, 2),
  status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'delivered') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  receivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  startedAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  deliveredAt TIMESTAMP NULL,
  branchId INT,
  assignedTechnicianId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (customerId) REFERENCES Customer(id),
  FOREIGN KEY (deviceId) REFERENCES Device(id),
  FOREIGN KEY (branchId) REFERENCES Branch(id),
  FOREIGN KEY (assignedTechnicianId) REFERENCES User(id),
  INDEX idx_repair_status (status),
  INDEX idx_repair_customer (customerId),
  INDEX idx_repair_date (receivedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول ملحقات طلب الإصلاح
CREATE TABLE RepairRequestAccessory (
  id INT NOT NULL AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  accessoryName VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 1,
  notes TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول سجل تحديثات الحالة
CREATE TABLE StatusUpdateLog (
  id INT NOT NULL AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  oldStatus VARCHAR(50),
  newStatus VARCHAR(50) NOT NULL,
  notes TEXT,
  updatedBy INT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (updatedBy) REFERENCES User(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول عروض الأسعار
CREATE TABLE Quotation (
  id INT NOT NULL AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  quotationNumber VARCHAR(50) NOT NULL UNIQUE,
  totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  validUntil DATE,
  status ENUM('draft', 'sent', 'approved', 'rejected', 'expired') DEFAULT 'draft',
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
  FOREIGN KEY (createdBy) REFERENCES User(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول عناصر عرض السعر
CREATE TABLE QuotationItem (
  id INT NOT NULL AUTO_INCREMENT,
  quotationId INT NOT NULL,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unitPrice DECIMAL(10, 2) NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (quotationId) REFERENCES Quotation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول المستودعات
CREATE TABLE Warehouse (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  branchId INT,
  isActive BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (id),
  FOREIGN KEY (branchId) REFERENCES Branch(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول عناصر المخزون
CREATE TABLE InventoryItem (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  description TEXT,
  category VARCHAR(50),
  purchasePrice DECIMAL(10, 2),
  sellingPrice DECIMAL(10, 2),
  minStockLevel INT DEFAULT 0,
  maxStockLevel INT DEFAULT 1000,
  unit VARCHAR(20) DEFAULT 'قطعة',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_inventory_sku (sku),
  INDEX idx_inventory_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول مستويات المخزون
CREATE TABLE StockLevel (
  id INT NOT NULL AUTO_INCREMENT,
  inventoryItemId INT NOT NULL,
  warehouseId INT NOT NULL,
  currentQuantity INT DEFAULT 0,
  reservedQuantity INT DEFAULT 0,
  availableQuantity INT GENERATED ALWAYS AS (currentQuantity - reservedQuantity) STORED,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  UNIQUE KEY unique_item_warehouse (inventoryItemId, warehouseId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول حركات المخزون
CREATE TABLE StockMovement (
  id INT NOT NULL AUTO_INCREMENT,
  inventoryItemId INT NOT NULL,
  warehouseId INT NOT NULL,
  movementType ENUM('in', 'out', 'transfer', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  unitCost DECIMAL(10, 2),
  totalCost DECIMAL(10, 2),
  referenceType VARCHAR(50),
  referenceId INT,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_stock_movement_item (inventoryItemId),
  INDEX idx_stock_movement_date (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الموردين
CREATE TABLE Vendor (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  contactPerson VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  taxNumber VARCHAR(50),
  paymentTerms TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول أوامر الشراء
CREATE TABLE PurchaseOrder (
  id INT NOT NULL AUTO_INCREMENT,
  orderNumber VARCHAR(50) NOT NULL UNIQUE,
  vendorId INT NOT NULL,
  totalAmount DECIMAL(10, 2) DEFAULT 0,
  status ENUM('draft', 'sent', 'confirmed', 'received', 'cancelled') DEFAULT 'draft',
  orderDate DATE NOT NULL,
  expectedDelivery DATE,
  actualDelivery DATE,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (vendorId) REFERENCES Vendor(id),
  FOREIGN KEY (createdBy) REFERENCES User(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول عناصر أمر الشراء
CREATE TABLE PurchaseOrderItem (
  id INT NOT NULL AUTO_INCREMENT,
  purchaseOrderId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10, 2) NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  receivedQuantity INT DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (purchaseOrderId) REFERENCES PurchaseOrder(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول القطع المستخدمة
CREATE TABLE PartsUsed (
  id INT NOT NULL AUTO_INCREMENT,
  quantity INT NOT NULL,
  repairRequestId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  invoiceItemId INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (invoiceItemId) REFERENCES InvoiceItem(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الفواتير
CREATE TABLE Invoice (
  id INT NOT NULL AUTO_INCREMENT,
  invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
  repairRequestId INT,
  customerId INT NOT NULL,
  totalAmount DECIMAL(10, 2) DEFAULT 0,
  discountAmount DECIMAL(10, 2) DEFAULT 0,
  taxAmount DECIMAL(10, 2) DEFAULT 0,
  finalAmount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EGP',
  status ENUM('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled') DEFAULT 'draft',
  issueDate DATE NOT NULL,
  dueDate DATE,
  paidDate DATE,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id),
  FOREIGN KEY (customerId) REFERENCES Customer(id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_invoice_number (invoiceNumber),
  INDEX idx_invoice_customer (customerId),
  INDEX idx_invoice_date (issueDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول عناصر الفاتورة
CREATE TABLE InvoiceItem (
  id INT NOT NULL AUTO_INCREMENT,
  invoiceId INT NOT NULL,
  inventoryItemId INT NULL,
  serviceId INT NULL,
  description TEXT,
  quantity INT DEFAULT 1,
  unitPrice DECIMAL(10, 2) NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  itemType ENUM('part', 'service', 'other') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (serviceId) REFERENCES Service(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول المدفوعات
CREATE TABLE Payment (
  id INT NOT NULL AUTO_INCREMENT,
  invoiceId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EGP',
  paymentMethod ENUM('cash', 'card', 'bank_transfer', 'check', 'other') NOT NULL,
  paymentDate DATE NOT NULL,
  referenceNumber VARCHAR(100),
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_payment_invoice (invoiceId),
  INDEX idx_payment_date (paymentDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول فئات المصروفات
CREATE TABLE ExpenseCategory (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول المصروفات
CREATE TABLE Expense (
  id INT NOT NULL AUTO_INCREMENT,
  categoryId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EGP',
  description TEXT NOT NULL,
  expenseDate DATE NOT NULL,
  receiptNumber VARCHAR(100),
  vendorName VARCHAR(100),
  paymentMethod ENUM('cash', 'card', 'bank_transfer', 'check', 'other'),
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (categoryId) REFERENCES ExpenseCategory(id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_expense_category (categoryId),
  INDEX idx_expense_date (expenseDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الخدمات
CREATE TABLE Service (
  id INT NOT NULL AUTO_INCREMENT,
  serviceName VARCHAR(100) NOT NULL,
  description TEXT,
  basePrice DECIMAL(10, 2) DEFAULT 0,
  category VARCHAR(50),
  estimatedDuration INT COMMENT 'Duration in minutes',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_service_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول خدمات طلب الإصلاح
CREATE TABLE RepairRequestService (
  id INT NOT NULL AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  serviceId INT NOT NULL,
  technicianId INT,
  price DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  invoiceItemId INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (serviceId) REFERENCES Service(id),
  FOREIGN KEY (technicianId) REFERENCES User(id),
  FOREIGN KEY (invoiceItemId) REFERENCES InvoiceItem(id) ON DELETE SET NULL,
  INDEX idx_repair_service_repair (repairRequestId),
  INDEX idx_repair_service_service (serviceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول أنواع التفتيش
CREATE TABLE InspectionType (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول تقارير التفتيش
CREATE TABLE InspectionReport (
  id INT NOT NULL AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  inspectionTypeId INT NOT NULL,
  technicianId INT,
  overallCondition ENUM('excellent', 'good', 'fair', 'poor', 'critical') DEFAULT 'good',
  generalNotes TEXT,
  recommendations TEXT,
  inspectionDate DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (inspectionTypeId) REFERENCES InspectionType(id),
  FOREIGN KEY (technicianId) REFERENCES User(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول مكونات التفتيش
CREATE TABLE InspectionComponent (
  id INT NOT NULL AUTO_INCREMENT,
  inspectionReportId INT NOT NULL,
  componentName VARCHAR(100) NOT NULL,
  componentCondition ENUM('excellent', 'good', 'fair', 'poor', 'critical') DEFAULT 'good',
  notes TEXT,
  requiresReplacement BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (id),
  FOREIGN KEY (inspectionReportId) REFERENCES InspectionReport(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول الإشعارات
CREATE TABLE Notification (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_notification_user (userId),
  INDEX idx_notification_read (isRead)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول قوالب الإشعارات
CREATE TABLE NotificationTemplate (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type ENUM('email', 'sms', 'push') DEFAULT 'email',
  isActive BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول إعدادات النظام
CREATE TABLE SystemSetting (
  id INT NOT NULL AUTO_INCREMENT,
  settingKey VARCHAR(100) NOT NULL UNIQUE,
  settingValue TEXT,
  description TEXT,
  dataType ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'general',
  isEditable BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_setting_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول سجل التدقيق
CREATE TABLE AuditLog (
  id INT NOT NULL AUTO_INCREMENT,
  tableName VARCHAR(100) NOT NULL,
  recordId INT NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  oldValues JSON,
  newValues JSON,
  userId INT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (userId) REFERENCES User(id),
  INDEX idx_audit_table (tableName),
  INDEX idx_audit_record (recordId),
  INDEX idx_audit_date (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول سجل الأنشطة
CREATE TABLE activity_log (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_activity_user (userId),
  INDEX idx_activity_date (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- الجزء الثالث: إضافة الفهارس المهمة للأداء
-- =====================================================

CREATE INDEX idx_repair_service_invoice_item ON RepairRequestService(invoiceItemId);
CREATE INDEX idx_parts_used_invoice_item ON PartsUsed(invoiceItemId);

-- =====================================================
-- الجزء الرابع: البيانات الأساسية والتجريبية
-- =====================================================

-- المدن
INSERT IGNORE INTO City (id, name) VALUES 
(1, 'القاهرة'),
(2, 'الجيزة'),
(3, 'الإسكندرية'),
(4, 'أسوان'),
(5, 'الأقصر'),
(6, 'طنطا'),
(7, 'المنصورة'),
(8, 'أسيوط'),
(9, 'بني سويف'),
(10, 'الفيوم');

-- الفروع
INSERT IGNORE INTO Branch (id, name, address, phone, cityId) VALUES 
(1, 'فرع القاهرة الرئيسي', 'شارع التحرير، وسط البلد، القاهرة', '01012345678', 1),
(2, 'فرع الجيزة', 'شارع الهرم، الجيزة', '01023456789', 2),
(3, 'فرع الإسكندرية', 'شارع الكورنيش، الإسكندرية', '01034567890', 3);

-- الأدوار
INSERT IGNORE INTO Role (id, name, description, permissions) VALUES 
(1, 'Admin', 'مدير النظام', '["all"]'),
(2, 'Manager', 'مدير الفرع', '["manage_branch", "view_reports", "manage_users"]'),
(3, 'Technician', 'فني الإصلاح', '["view_repairs", "update_repairs", "manage_inventory"]'),
(4, 'Receptionist', 'موظف الاستقبال', '["create_repairs", "view_customers", "manage_customers"]');

-- المستخدمين
INSERT IGNORE INTO User (id, username, email, password, firstName, lastName, phone, roleId, branchId, isActive) VALUES 
(1, 'admin', 'admin@fixzone.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'محمود', 'ناصر', '01012345678', 1, 1, TRUE),
(2, 'manager1', 'manager1@fixzone.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'أحمد', 'محمد', '01023456789', 2, 1, TRUE),
(3, 'tech1', 'tech1@fixzone.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'محمد', 'علي', '01034567890', 3, 1, TRUE),
(4, 'reception1', 'reception1@fixzone.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'فاطمة', 'أحمد', '01045678901', 4, 1, TRUE);

-- الشركات
INSERT IGNORE INTO Company (id, name, contactPerson, phone, email, address, taxNumber, notes, isActive) VALUES 
(1, 'شركة التكنولوجيا المتقدمة', 'أحمد محمد', '01012345678', 'info@techadvanced.com', 'شارع التحرير، القاهرة', '123456789', 'شركة متخصصة في تقنية المعلومات', TRUE),
(2, 'مؤسسة الحلول الذكية', 'سارة علي', '01023456789', 'contact@smartsolutions.com', 'شارع الهرم، الجيزة', '987654321', 'مؤسسة للحلول التقنية المتطورة', TRUE),
(3, 'شركة الاتصالات الحديثة', 'محمد أحمد', '01034567890', 'support@moderncomm.com', 'شارع الكورنيش، الإسكندرية', '456789123', 'شركة اتصالات وشبكات', TRUE);

-- العملاء
INSERT IGNORE INTO Customer (id, firstName, lastName, phone, email, address, companyId, isActive, status, notes) VALUES 
(1, 'محمد', 'أحمد', '01012345678', 'mohamed@example.com', 'شارع التحرير، القاهرة', 1, TRUE, 'active', 'عميل مهم'),
(2, 'فاطمة', 'علي', '01023456789', 'fatima@example.com', 'شارع الهرم، الجيزة', 2, TRUE, 'active', 'عميلة منتظمة'),
(3, 'أحمد', 'محمود', '01034567890', 'ahmed@example.com', 'شارع الكورنيش، الإسكندرية', NULL, TRUE, 'active', 'عميل فردي'),
(4, 'سارة', 'محمد', '01045678901', 'sara@example.com', 'شارع النيل، أسوان', 3, TRUE, 'active', 'عميلة جديدة');

-- فئات المتغيرات
INSERT IGNORE INTO VariableCategory (id, name, description) VALUES 
(1, 'نوع الجهاز', 'تصنيفات أنواع الأجهزة'),
(2, 'العلامة التجارية', 'العلامات التجارية للأجهزة'),
(3, 'حالة الجهاز', 'حالات الأجهزة المختلفة'),
(4, 'مواصفات الجهاز', 'المواصفات التقنية للأجهزة');

-- خيارات المتغيرات
INSERT IGNORE INTO VariableOption (id, categoryId, name, value) VALUES 
(1, 1, 'هاتف ذكي', 'smartphone'),
(2, 1, 'جهاز لوحي', 'tablet'),
(3, 1, 'لابتوب', 'laptop'),
(4, 1, 'كمبيوتر مكتبي', 'desktop'),
(5, 2, 'سامسونج', 'samsung'),
(6, 2, 'آيفون', 'iphone'),
(7, 2, 'هواوي', 'huawei'),
(8, 2, 'شاومي', 'xiaomi'),
(9, 3, 'جديد', 'new'),
(10, 3, 'مستعمل', 'used'),
(11, 3, 'تالف', 'damaged');

-- المستودعات
INSERT IGNORE INTO Warehouse (id, name, location, branchId, isActive) VALUES 
(1, 'المستودع الرئيسي', 'القاهرة - المقر الرئيسي', 1, TRUE),
(2, 'مستودع الجيزة', 'الجيزة - فرع الهرم', 2, TRUE),
(3, 'مستودع الإسكندرية', 'الإسكندرية - فرع الكورنيش', 3, TRUE);

-- عناصر المخزون
INSERT IGNORE INTO InventoryItem (id, name, sku, description, category, purchasePrice, sellingPrice, minStockLevel, maxStockLevel, unit, isActive) VALUES 
(1, 'شاشة LCD هاتف', 'PART-001', 'شاشة LCD للهواتف الذكية', 'شاشات', 150.00, 250.00, 5, 100, 'قطعة', TRUE),
(2, 'بطارية ليثيوم', 'PART-002', 'بطارية ليثيوم للهواتف المحمولة', 'بطاريات', 80.00, 120.00, 10, 200, 'قطعة', TRUE),
(3, 'خامات لحام', 'PART-003', 'خامات لحام للدوائر الإلكترونية', 'خامات', 200.00, 300.00, 2, 50, 'علبة', TRUE);

-- مستويات المخزون
INSERT IGNORE INTO StockLevel (inventoryItemId, warehouseId, currentQuantity, reservedQuantity) VALUES 
(1, 1, 50, 5),
(2, 1, 100, 10),
(3, 1, 25, 2),
(1, 2, 30, 3),
(2, 2, 75, 8),
(3, 2, 15, 1);

-- الموردين
INSERT IGNORE INTO Vendor (id, name, contactPerson, phone, email, address, taxNumber, paymentTerms, isActive) VALUES 
(1, 'مورد قطع الغيار الأول', 'محمد أحمد', '01012345678', 'supplier1@example.com', 'القاهرة', '123456789', 'دفع خلال 30 يوم', TRUE),
(2, 'شركة الإلكترونيات المتطورة', 'أحمد علي', '01023456789', 'electronics@example.com', 'الجيزة', '987654321', 'دفع نقدي', TRUE);

-- فئات المصروفات
INSERT IGNORE INTO ExpenseCategory (id, name, description, isActive) VALUES 
(1, 'إيجار', 'مصروفات الإيجار الشهري', TRUE),
(2, 'كهرباء', 'فواتير الكهرباء', TRUE),
(3, 'مواد خام', 'شراء مواد خام وقطع غيار', TRUE),
(4, 'رواتب', 'رواتب الموظفين', TRUE),
(5, 'صيانة', 'مصروفات الصيانة والإصلاح', TRUE);

-- الخدمات
INSERT IGNORE INTO Service (id, serviceName, description, basePrice, category, estimatedDuration, isActive) VALUES 
(1, 'تغيير شاشة الهاتف', 'خدمة تغيير شاشة الهاتف المكسورة', 120.00, 'إصلاح الشاشات', 60, TRUE),
(2, 'استبدال البطارية', 'خدمة استبدال بطارية الهاتف التالفة', 80.00, 'إصلاح البطاريات', 30, TRUE),
(3, 'إصلاح دائرة الشحن', 'إصلاح مشاكل الشحن في الأجهزة', 150.00, 'إصلاح الدوائر', 90, TRUE),
(4, 'تنظيف داخلي للجهاز', 'تنظيف الجهاز من الداخل وإزالة الغبار', 50.00, 'صيانة عامة', 45, TRUE),
(5, 'فحص شامل للجهاز', 'فحص شامل لجميع مكونات الجهاز', 100.00, 'فحص وتشخيص', 120, TRUE);

-- أنواع التفتيش
INSERT IGNORE INTO InspectionType (id, name, description, isActive) VALUES 
(1, 'فحص أولي', 'الفحص الأولي عند استلام الجهاز', TRUE),
(2, 'فحص شامل', 'فحص شامل لجميع مكونات الجهاز', TRUE),
(3, 'فحص ما بعد الإصلاح', 'فحص الجهاز بعد انتهاء الإصلاح', TRUE);

-- إعدادات النظام
INSERT IGNORE INTO SystemSetting (settingKey, settingValue, description, dataType, category, isEditable) VALUES 
('company_name', 'Fix Zone ERP', 'اسم الشركة', 'string', 'general', TRUE),
('company_phone', '01012345678', 'رقم هاتف الشركة', 'string', 'contact', TRUE),
('company_email', 'info@fixzone.com', 'البريد الإلكتروني للشركة', 'string', 'contact', TRUE),
('company_address', 'القاهرة، مصر', 'عنوان الشركة', 'string', 'contact', TRUE),
('default_currency', 'EGP', 'العملة الافتراضية', 'string', 'financial', TRUE),
('tax_rate', '14', 'معدل الضريبة المضافة (%)', 'number', 'financial', TRUE),
('invoice_prefix', 'INV-', 'بادئة رقم الفاتورة', 'string', 'invoice', TRUE),
('quotation_prefix', 'QUO-', 'بادئة رقم عرض السعر', 'string', 'quotation', TRUE),
('repair_warranty_days', '30', 'فترة الضمان بالأيام', 'number', 'repair', TRUE),
('notification_enabled', 'true', 'تفعيل الإشعارات', 'boolean', 'system', TRUE);

-- =====================================================
-- الجزء الخامس: تطبيق التحديثات المهمة
-- =====================================================

-- تحديث العملة إلى الجنيه المصري
UPDATE Invoice SET currency = 'EGP' WHERE currency = 'SAR' OR currency IS NULL;
UPDATE Payment SET currency = 'EGP' WHERE currency = 'SAR' OR currency IS NULL;
UPDATE Expense SET currency = 'EGP' WHERE currency = 'SAR' OR currency IS NULL;

-- إعادة تفعيل فحص المفاتيح الأجنبية
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- انتهاء ملف قاعدة البيانات الموحد
-- تاريخ الإنشاء: 12 سبتمبر 2025
-- الحالة: جاهز للإنتاج
-- =====================================================
