-- Seed variables for Fix Zone ERP
-- Brands and Accessories
-- Safe to run multiple times (idempotent)

USE FZ;

-- 1) Ensure categories exist
INSERT IGNORE INTO VariableCategory (code, name, scope)
VALUES
  ('BRAND', 'الماركات', 'DEVICE'),
  ('ACCESSORY', 'الملحقات', 'REPAIR');

-- 2) Seed BRAND options (per device type when relevant)
-- Laptop brands
INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'Apple', 'apple', 'Laptop', 1, 1 FROM VariableCategory WHERE code = 'BRAND'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'Dell', 'dell', 'Laptop', 1, 2 FROM VariableCategory WHERE code = 'BRAND'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'HP', 'hp', 'Laptop', 1, 3 FROM VariableCategory WHERE code = 'BRAND'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'Lenovo', 'lenovo', 'Laptop', 1, 4 FROM VariableCategory WHERE code = 'BRAND'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

-- Phone brands
INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'Apple', 'apple', 'Phone', 1, 1 FROM VariableCategory WHERE code = 'BRAND'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'Samsung', 'samsung', 'Phone', 1, 2 FROM VariableCategory WHERE code = 'BRAND'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'Xiaomi', 'xiaomi', 'Phone', 1, 3 FROM VariableCategory WHERE code = 'BRAND'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

-- 3) Seed ACCESSORY options (global unless specified)
INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'شاحن', 'charger', NULL, 1, 1 FROM VariableCategory WHERE code = 'ACCESSORY'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'شنطه', 'bag', 'Laptop', 1, 2 FROM VariableCategory WHERE code = 'ACCESSORY'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'بطاريه', 'battery', 'Laptop', 1, 3 FROM VariableCategory WHERE code = 'ACCESSORY'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'كيبورد', 'keyboard', 'Laptop', 1, 4 FROM VariableCategory WHERE code = 'ACCESSORY'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);

INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder)
SELECT id, 'هارد ديسك', 'hard_disk', NULL, 1, 5 FROM VariableCategory WHERE code = 'ACCESSORY'
ON DUPLICATE KEY UPDATE label=VALUES(label), sortOrder=VALUES(sortOrder), isActive=VALUES(isActive);
