-- ============================================
-- Fix Zone ERP - Sample Data
-- ============================================
-- Version: 1.0
-- Date: 10 أكتوبر 2025
-- Description: بيانات تجريبية للعرض والتدريب
-- ============================================

USE FZ;

-- ============================================
-- SECTION 1: Roles & Users
-- ============================================

-- Roles
INSERT IGNORE INTO Role (id, name, permissions) VALUES
(1, 'Admin', '["all"]'),
(2, 'Manager', '["read", "write"]'),
(3, 'Employee', '["read"]');

-- Admin User (password: password)
INSERT IGNORE INTO User (id, name, email, password, roleId, isActive) VALUES
(2, 'Admin User', 'admin@fixzone.com', 
 '$2b$10$HuQ/BxARvmGkEdSETogQc./qkG30TyI3.TZaPmbre2a2t./mWAmSu', 1, 1);

-- ============================================
-- SECTION 2: Inventory - Categories
-- ============================================

INSERT IGNORE INTO InventoryItemCategory (id, name) VALUES
(1, 'batteries'),
(2, 'screens'),
(3, 'accessories'),
(4, 'tools'),
(5, 'parts');

-- ============================================
-- SECTION 3: Inventory - Items
-- ============================================

INSERT IGNORE INTO InventoryItem (id, sku, name, type, purchasePrice, sellingPrice) VALUES
(1, 'BAT-IPH12', 'بطارية iPhone 12', 'batteries', 200.00, 350.00),
(2, 'BAT-IPH13', 'بطارية iPhone 13', 'batteries', 220.00, 380.00),
(3, 'SCR-IPH12', 'شاشة iPhone 12', 'screens', 450.00, 750.00),
(4, 'CASE-SIL', 'جراب سيليكون', 'accessories', 15.00, 35.00),
(5, 'CHARGE-C', 'شاحن USB-C', 'accessories', 80.00, 150.00),
(6, 'BAT-SAM21', 'بطارية Samsung S21', 'batteries', 180.00, 320.00),
(7, 'SCR-SAM22', 'شاشة Samsung S22', 'screens', 550.00, 900.00),
(8, 'CABLE-L1M', 'كابل Lightning 1م', 'accessories', 25.00, 50.00),
(9, 'BAT-IPAD', 'بطارية iPad Air', 'batteries', 350.00, 600.00),
(10, 'CASE-LEATH', 'جراب جلد فاخر', 'accessories', 45.00, 90.00);

-- ============================================
-- SECTION 4: Warehouses
-- ============================================

INSERT IGNORE INTO Warehouse (id, name) VALUES
(1, 'المستودع الرئيسي'),
(2, 'مستودع الجيزة'),
(3, 'مستودع الإسكندرية'),
(4, 'مركز البستان');

-- ============================================
-- SECTION 5: Stock Levels
-- ============================================

-- المستودع الرئيسي
INSERT IGNORE INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, maxLevel) VALUES
(1, 1, 50, 10, 100),
(2, 1, 30, 10, 80),
(3, 1, 15, 5, 50),
(4, 1, 100, 20, 200),
(5, 1, 40, 10, 100),
(6, 1, 25, 8, 80),
(7, 1, 12, 5, 40),
(8, 1, 60, 15, 150),
(9, 1, 10, 5, 30),
(10, 1, 30, 10, 80);

-- مستودع الجيزة
INSERT IGNORE INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, maxLevel) VALUES
(1, 2, 20, 5, 50),
(2, 2, 15, 5, 40),
(4, 2, 50, 10, 100),
(8, 2, 20, 5, 50);

-- مستودع الإسكندرية
INSERT IGNORE INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, maxLevel) VALUES
(1, 3, 15, 5, 40);

-- ============================================
-- SECTION 6: Stock Movements (Sample)
-- ============================================

INSERT IGNORE INTO StockMovement (id, inventoryItemId, fromWarehouseId, toWarehouseId, quantity, movementType, notes) VALUES
(1, 1, 1, 2, 10, 'transfer', 'نقل للفرع'),
(2, 2, 1, 2, 5, 'transfer', 'نقل للفرع'),
(3, 4, 1, 2, 20, 'transfer', 'نقل بضاعة');

-- ============================================
-- End of Sample Data
-- ============================================
-- Total Inserts:
--   Roles: 3
--   Users: 1 (admin)
--   Categories: 5
--   Items: 10
--   Warehouses: 4
--   Stock Levels: 14
--   Stock Movements: 3
-- ============================================
