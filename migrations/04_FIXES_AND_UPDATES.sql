-- ============================================
-- Fix Zone ERP - Fixes and Updates
-- ============================================
-- Version: 1.0
-- Date: 10 أكتوبر 2025
-- Description: تحديثات وإصلاحات تدريجية
-- 
-- يمكن تشغيله على قاعدة بيانات موجودة
-- لتحديثها بدون فقدان البيانات
-- ============================================

USE FZ;

-- ============================================
-- SECTION 1: Inventory System Fixes
-- ============================================

-- التأكد من وجود الأعمدة المطلوبة في InventoryItem
ALTER TABLE InventoryItem 
  ADD COLUMN IF NOT EXISTS serialNumber VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customFields JSON;

-- التأكد من وجود الأعمدة المطلوبة في StockLevel  
ALTER TABLE StockLevel 
  ADD COLUMN IF NOT EXISTS minLevel INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maxLevel INT DEFAULT 0;

-- ============================================
-- SECTION 2: Phase 2 Tables (إذا لم تكن موجودة)
-- ============================================

-- StockCount Table
CREATE TABLE IF NOT EXISTS StockCount (
  id INT PRIMARY KEY AUTO_INCREMENT,
  countNumber VARCHAR(50) UNIQUE,
  warehouseId INT NOT NULL,
  countDate DATE,
  type ENUM('full', 'partial', 'cycle') DEFAULT 'full',
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  notes TEXT,
  countedBy INT,
  reviewedBy INT,
  approvedBy INT,
  adjustedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (countedBy) REFERENCES User(id),
  FOREIGN KEY (reviewedBy) REFERENCES User(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  FOREIGN KEY (adjustedBy) REFERENCES User(id),
  INDEX idx_count_warehouse (warehouseId),
  INDEX idx_count_status (status),
  INDEX idx_count_date (countDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- StockCountItem Table
CREATE TABLE IF NOT EXISTS StockCountItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockCountId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  systemQuantity INT NOT NULL,
  actualQuantity INT,
  difference INT AS (actualQuantity - systemQuantity) STORED,
  status ENUM('pending', 'counted', 'verified', 'adjusted') DEFAULT 'pending',
  countedAt TIMESTAMP NULL,
  notes TEXT,
  scannedBarcode VARCHAR(100),
  FOREIGN KEY (stockCountId) REFERENCES StockCount(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  INDEX idx_count_item_count (stockCountId),
  INDEX idx_count_item_item (inventoryItemId),
  INDEX idx_count_item_status (status),
  INDEX idx_count_item_difference (difference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- StockTransfer Table
CREATE TABLE IF NOT EXISTS StockTransfer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transferNumber VARCHAR(50) UNIQUE,
  fromWarehouseId INT NOT NULL,
  toWarehouseId INT NOT NULL,
  transferDate DATE,
  status ENUM('pending', 'approved', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  requestedBy INT,
  approvedBy INT,
  receivedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fromWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (toWarehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (requestedBy) REFERENCES User(id),
  FOREIGN KEY (approvedBy) REFERENCES User(id),
  FOREIGN KEY (receivedBy) REFERENCES User(id),
  INDEX idx_transfer_from (fromWarehouseId),
  INDEX idx_transfer_to (toWarehouseId),
  INDEX idx_transfer_status (status),
  INDEX idx_transfer_date (transferDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- StockTransferItem Table
CREATE TABLE IF NOT EXISTS StockTransferItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transferId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  requestedQuantity INT NOT NULL,
  approvedQuantity INT,
  receivedQuantity INT,
  notes TEXT,
  FOREIGN KEY (transferId) REFERENCES StockTransfer(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  INDEX idx_transfer_item_transfer (transferId),
  INDEX idx_transfer_item_item (inventoryItemId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 3: Stock Alert Table
-- ============================================

CREATE TABLE IF NOT EXISTS StockAlert (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inventoryItemId INT NOT NULL,
  warehouseId INT,
  alertType ENUM('low_stock', 'out_of_stock', 'overstock', 'expiring') DEFAULT 'low_stock',
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  message TEXT,
  isResolved BOOLEAN DEFAULT FALSE,
  resolvedAt TIMESTAMP NULL,
  resolvedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventoryItemId) REFERENCES InventoryItem(id),
  FOREIGN KEY (warehouseId) REFERENCES Warehouse(id),
  FOREIGN KEY (resolvedBy) REFERENCES User(id),
  INDEX idx_alert_item (inventoryItemId),
  INDEX idx_alert_warehouse (warehouseId),
  INDEX idx_alert_type (alertType),
  INDEX idx_alert_resolved (isResolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- End of Fixes and Updates
-- ============================================
-- يمكن تشغيل هذا الملف على قاعدة بيانات موجودة
-- لن يؤثر على البيانات الموجودة
-- ============================================
