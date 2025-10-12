-- ============================================
-- Fix Zone ERP - Test Data
-- ============================================
-- Version: 1.0
-- Date: 10 أكتوبر 2025
-- Description: بيانات اختبار للتطوير فقط
-- 
-- ⚠️ WARNING: FOR DEVELOPMENT/TESTING ONLY
-- ⚠️ DO NOT USE IN PRODUCTION
-- ============================================

USE FZ;

-- ============================================
-- Additional Test Customers
-- ============================================

INSERT IGNORE INTO Customer (name, phone, email, address) VALUES
('محمد أحمد', '01012345678', 'mohamed@test.com', 'القاهرة'),
('أحمد علي', '01098765432', 'ahmed@test.com', 'الجيزة'),
('سارة محمود', '01123456789', 'sara@test.com', 'الإسكندرية');

-- ============================================
-- Additional Test Companies
-- ============================================

INSERT IGNORE INTO Company (name, email, phone, address, taxNumber) VALUES
('شركة التقنية المتقدمة', 'tech@company.com', '0222334455', 'القاهرة', 'TAX-001'),
('مؤسسة الخدمات الرقمية', 'digital@company.com', '0233445566', 'الجيزة', 'TAX-002');

-- ============================================
-- Test Stock Movements
-- ============================================

INSERT IGNORE INTO StockMovement (inventoryItemId, fromWarehouseId, quantity, movementType, notes) VALUES
(1, 1, 5, 'out', 'استخدام في إصلاح'),
(2, 1, 3, 'out', 'استخدام في إصلاح'),
(4, 1, 10, 'out', 'بيع');

-- ============================================
-- End of Test Data
-- ============================================
-- ⚠️ هذه البيانات للتطوير والاختبار فقط
-- ⚠️ لا تستخدمها في بيئة الإنتاج
-- ============================================
