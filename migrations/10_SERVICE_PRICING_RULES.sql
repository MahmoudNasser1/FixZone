-- Migration: Service Pricing Rules
-- Date: 2025-11-17
-- Description: إنشاء جدول ServicePricingRule لقواعد التسعير الديناميكية

-- Create ServicePricingRule table
CREATE TABLE IF NOT EXISTS ServicePricingRule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceId INT NOT NULL,
  deviceType VARCHAR(100) DEFAULT NULL COMMENT 'نوع الجهاز (phone, laptop, tablet, etc.)',
  brandId INT DEFAULT NULL COMMENT 'معرف العلامة التجارية',
  brand VARCHAR(100) DEFAULT NULL COMMENT 'اسم العلامة التجارية',
  pricingType ENUM('multiplier', 'fixed', 'percentage') DEFAULT 'multiplier' COMMENT 'نوع التسعير',
  value DECIMAL(12,4) DEFAULT 1.0 COMMENT 'القيمة (multiplier, fixed price, or percentage)',
  minPrice DECIMAL(12,2) DEFAULT NULL COMMENT 'أقل سعر ممكن',
  maxPrice DECIMAL(12,2) DEFAULT NULL COMMENT 'أعلى سعر ممكن',
  isActive BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0 COMMENT 'أولوية التطبيق (الأعلى أولاً)',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME DEFAULT NULL,
  INDEX idx_service_pricing_service (serviceId),
  INDEX idx_service_pricing_type (deviceType),
  INDEX idx_service_pricing_brand (brandId),
  INDEX idx_service_pricing_active (isActive),
  INDEX idx_service_pricing_priority (priority),
  FOREIGN KEY (serviceId) REFERENCES Service(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Date: 2025-11-17
-- Description: إنشاء جدول ServicePricingRule لقواعد التسعير الديناميكية

-- Create ServicePricingRule table
CREATE TABLE IF NOT EXISTS ServicePricingRule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceId INT NOT NULL,
  deviceType VARCHAR(100) DEFAULT NULL COMMENT 'نوع الجهاز (phone, laptop, tablet, etc.)',
  brandId INT DEFAULT NULL COMMENT 'معرف العلامة التجارية',
  brand VARCHAR(100) DEFAULT NULL COMMENT 'اسم العلامة التجارية',
  pricingType ENUM('multiplier', 'fixed', 'percentage') DEFAULT 'multiplier' COMMENT 'نوع التسعير',
  value DECIMAL(12,4) DEFAULT 1.0 COMMENT 'القيمة (multiplier, fixed price, or percentage)',
  minPrice DECIMAL(12,2) DEFAULT NULL COMMENT 'أقل سعر ممكن',
  maxPrice DECIMAL(12,2) DEFAULT NULL COMMENT 'أعلى سعر ممكن',
  isActive BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0 COMMENT 'أولوية التطبيق (الأعلى أولاً)',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME DEFAULT NULL,
  INDEX idx_service_pricing_service (serviceId),
  INDEX idx_service_pricing_type (deviceType),
  INDEX idx_service_pricing_brand (brandId),
  INDEX idx_service_pricing_active (isActive),
  INDEX idx_service_pricing_priority (priority),
  FOREIGN KEY (serviceId) REFERENCES Service(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Date: 2025-11-17
-- Description: إنشاء جدول ServicePricingRule لقواعد التسعير الديناميكية

-- Create ServicePricingRule table
CREATE TABLE IF NOT EXISTS ServicePricingRule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceId INT NOT NULL,
  deviceType VARCHAR(100) DEFAULT NULL COMMENT 'نوع الجهاز (phone, laptop, tablet, etc.)',
  brandId INT DEFAULT NULL COMMENT 'معرف العلامة التجارية',
  brand VARCHAR(100) DEFAULT NULL COMMENT 'اسم العلامة التجارية',
  pricingType ENUM('multiplier', 'fixed', 'percentage') DEFAULT 'multiplier' COMMENT 'نوع التسعير',
  value DECIMAL(12,4) DEFAULT 1.0 COMMENT 'القيمة (multiplier, fixed price, or percentage)',
  minPrice DECIMAL(12,2) DEFAULT NULL COMMENT 'أقل سعر ممكن',
  maxPrice DECIMAL(12,2) DEFAULT NULL COMMENT 'أعلى سعر ممكن',
  isActive BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0 COMMENT 'أولوية التطبيق (الأعلى أولاً)',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME DEFAULT NULL,
  INDEX idx_service_pricing_service (serviceId),
  INDEX idx_service_pricing_type (deviceType),
  INDEX idx_service_pricing_brand (brandId),
  INDEX idx_service_pricing_active (isActive),
  INDEX idx_service_pricing_priority (priority),
  FOREIGN KEY (serviceId) REFERENCES Service(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


