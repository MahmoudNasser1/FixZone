-- =====================================================
-- Phase 2 - Minimal Tables Creation
-- تاريخ الإنشاء: 3 أكتوبر 2025
-- الغرض: إنشاء الجداول الأساسية فقط
-- =====================================================

-- 1. جدول StockCount (جرد المخزون)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockCount (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouseId INT NOT NULL,
  countDate DATE NOT NULL,
  status ENUM('draft', 'in_progress', 'completed', 'approved', 'cancelled') DEFAULT 'draft',
  totalItems INT DEFAULT 0,
  discrepancies INT DEFAULT 0,
  referenceNumber VARCHAR(50) UNIQUE,
  notes TEXT,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL
);

-- 2. جدول StockCountItem (عناصر الجرد)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockCountItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockCountId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  systemQuantity INT NOT NULL DEFAULT 0,
  countedQuantity INT NOT NULL DEFAULT 0,
  variance INT NOT NULL DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  UNIQUE KEY unique_count_item (stockCountId, inventoryItemId)
);

-- 3. جدول StockTransfer (نقل بين المخازن)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockTransfer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fromWarehouseId INT NOT NULL,
  toWarehouseId INT NOT NULL,
  transferDate DATE NOT NULL,
  status ENUM('draft', 'approved', 'shipped', 'received', 'completed', 'cancelled') DEFAULT 'draft',
  totalItems INT DEFAULT 0,
  referenceNumber VARCHAR(50) UNIQUE,
  notes TEXT,
  reason VARCHAR(255),
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL
);

-- 4. جدول StockTransferItem (عناصر النقل)
-- =====================================================
CREATE TABLE IF NOT EXISTS StockTransferItem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stockTransferId INT NOT NULL,
  inventoryItemId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unitPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  totalPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  
  UNIQUE KEY unique_transfer_item (stockTransferId, inventoryItemId)
);

-- =====================================================
-- انتهاء Migration Phase 2
-- =====================================================

SELECT 'Phase 2 Minimal Tables Migration completed successfully!' as message;

