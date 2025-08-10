-- Migration: Add Variables system, Device specs, and RepairRequestAccessory
-- Environment: MySQL/MariaDB (XAMPP)
-- Note: Run on existing database FZ

USE FZ;

-- 1) Variables (Brands, Accessories)
CREATE TABLE IF NOT EXISTS VariableCategory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scope ENUM('GLOBAL','DEVICE','REPAIR','CUSTOMER') DEFAULT 'GLOBAL',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS VariableOption (
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

-- Optional seeding for categories
INSERT INTO VariableCategory (code, name, scope)
SELECT * FROM (SELECT 'BRAND' AS code, 'ماركات الأجهزة' AS name, 'DEVICE' AS scope) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM VariableCategory WHERE code = 'BRAND');

INSERT INTO VariableCategory (code, name, scope)
SELECT * FROM (SELECT 'ACCESSORY' AS code, 'ملحقات مستلمة' AS name, 'REPAIR' AS scope) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM VariableCategory WHERE code = 'ACCESSORY');

-- 2) Extend Device with brandId and specs (cpu, gpu, ram, storage)
-- Note: If your MySQL/MariaDB version doesn't support IF NOT EXISTS for columns, running twice may error.
ALTER TABLE Device ADD COLUMN brandId INT NULL AFTER brand;
ALTER TABLE Device ADD COLUMN cpu VARCHAR(100) NULL AFTER model;
ALTER TABLE Device ADD COLUMN gpu VARCHAR(100) NULL AFTER cpu;
ALTER TABLE Device ADD COLUMN ram VARCHAR(50) NULL AFTER gpu;
ALTER TABLE Device ADD COLUMN storage VARCHAR(50) NULL AFTER ram;

-- Add FK for brandId
ALTER TABLE Device ADD CONSTRAINT fk_device_brandid FOREIGN KEY (brandId) REFERENCES VariableOption(id);

-- 3) RepairRequest accessories mapping
CREATE TABLE IF NOT EXISTS RepairRequestAccessory (
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
