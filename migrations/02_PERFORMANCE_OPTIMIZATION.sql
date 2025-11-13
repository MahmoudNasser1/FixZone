-- تحسين الأداء - إضافة Indexes و Views
-- Performance Optimization Migration
-- Date: 2025-10-20

-- =============================================
-- إضافة Indexes لتحسين أداء الاستعلامات
-- =============================================

-- Indexes لجدول RepairRequest
CREATE INDEX IF NOT EXISTS idx_repairrequest_customer_id ON RepairRequest(customerId);
CREATE INDEX IF NOT EXISTS idx_repairrequest_status ON RepairRequest(status);
CREATE INDEX IF NOT EXISTS idx_repairrequest_created_at ON RepairRequest(createdAt);
CREATE INDEX IF NOT EXISTS idx_repairrequest_updated_at ON RepairRequest(updatedAt);
CREATE INDEX IF NOT EXISTS idx_repairrequest_deleted_at ON RepairRequest(deletedAt);
CREATE INDEX IF NOT EXISTS idx_repairrequest_technician_id ON RepairRequest(technicianId);
CREATE INDEX IF NOT EXISTS idx_repairrequest_branch_id ON RepairRequest(branchId);

-- Composite indexes للاستعلامات المعقدة
CREATE INDEX IF NOT EXISTS idx_repairrequest_status_customer ON RepairRequest(status, customerId);
CREATE INDEX IF NOT EXISTS idx_repairrequest_created_status ON RepairRequest(createdAt, status);
CREATE INDEX IF NOT EXISTS idx_repairrequest_customer_deleted ON RepairRequest(customerId, deletedAt);

-- Indexes لجدول Customer
CREATE INDEX IF NOT EXISTS idx_customer_name ON Customer(name);
CREATE INDEX IF NOT EXISTS idx_customer_phone ON Customer(phone);
CREATE INDEX IF NOT EXISTS idx_customer_email ON Customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_deleted_at ON Customer(deletedAt);

-- Indexes لجدول User
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_role_id ON User(roleId);
CREATE INDEX IF NOT EXISTS idx_user_is_active ON User(isActive);
CREATE INDEX IF NOT EXISTS idx_user_deleted_at ON User(deletedAt);

-- Indexes لجدول Invoice
CREATE INDEX IF NOT EXISTS idx_invoice_status ON Invoice(status);
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON Invoice(createdAt);
CREATE INDEX IF NOT EXISTS idx_invoice_deleted_at ON Invoice(deletedAt);

-- Indexes لجدول Payment
CREATE INDEX IF NOT EXISTS idx_payment_invoice_id ON Payment(invoiceId);
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON Payment(userId);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON Payment(createdAt);

-- Indexes لجدول Expense
CREATE INDEX IF NOT EXISTS idx_expense_category_id ON Expense(categoryId);
CREATE INDEX IF NOT EXISTS idx_expense_user_id ON Expense(userId);
CREATE INDEX IF NOT EXISTS idx_expense_date ON Expense(expenseDate);
CREATE INDEX IF NOT EXISTS idx_expense_deleted_at ON Expense(deletedAt);

-- =============================================
-- إنشاء Views للاستعلامات المعقدة
-- =============================================

-- View لعرض إحصائيات الإصلاحات
CREATE OR REPLACE VIEW v_repair_stats AS
SELECT 
    DATE(rr.createdAt) as date,
    COUNT(*) as total_repairs,
    COUNT(CASE WHEN rr.status = 'RECEIVED' THEN 1 END) as received,
    COUNT(CASE WHEN rr.status = 'INSPECTION' THEN 1 END) as inspection,
    COUNT(CASE WHEN rr.status = 'UNDER_REPAIR' THEN 1 END) as under_repair,
    COUNT(CASE WHEN rr.status = 'DELIVERED' THEN 1 END) as delivered,
    COUNT(CASE WHEN rr.status = 'REJECTED' THEN 1 END) as rejected,
    AVG(TIMESTAMPDIFF(HOUR, rr.createdAt, rr.updatedAt)) as avg_processing_hours
FROM RepairRequest rr
WHERE rr.deletedAt IS NULL
GROUP BY DATE(rr.createdAt)
ORDER BY date DESC;

-- View لعرض طلبات الإصلاح مع تفاصيل العملاء
CREATE OR REPLACE VIEW v_repairs_with_customers AS
SELECT 
    rr.id,
    rr.requestNumber,
    rr.status,
    rr.reportedProblem,
    rr.createdAt,
    rr.updatedAt,
    c.name as customerName,
    c.phone as customerPhone,
    c.email as customerEmail,
    u.name as technicianName,
    b.name as branchName
FROM RepairRequest rr
LEFT JOIN Customer c ON rr.customerId = c.id AND c.deletedAt IS NULL
LEFT JOIN User u ON rr.technicianId = u.id AND u.deletedAt IS NULL
LEFT JOIN Branch b ON rr.branchId = b.id AND b.deletedAt IS NULL
WHERE rr.deletedAt IS NULL;

-- View لعرض أداء الفنيين
CREATE OR REPLACE VIEW v_technician_performance AS
SELECT 
    u.id as technicianId,
    u.name as technicianName,
    COUNT(rr.id) as total_repairs,
    COUNT(CASE WHEN rr.status = 'DELIVERED' THEN 1 END) as completed_repairs,
    COUNT(CASE WHEN rr.status = 'UNDER_REPAIR' THEN 1 END) as in_progress_repairs,
    AVG(CASE WHEN rr.status = 'DELIVERED' THEN 
        TIMESTAMPDIFF(HOUR, rr.createdAt, rr.updatedAt) END) as avg_completion_hours,
    SUM(CASE WHEN rr.status = 'DELIVERED' THEN 
        COALESCE(rr.actualCost, 0) END) as total_revenue
FROM RepairRequest rr
JOIN User u ON rr.technicianId = u.id
WHERE rr.deletedAt IS NULL AND u.deletedAt IS NULL
GROUP BY u.id, u.name;

-- View لعرض العملاء النشطين
CREATE OR REPLACE VIEW v_active_customers AS
SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    COUNT(rr.id) as total_repairs,
    COUNT(CASE WHEN rr.status = 'DELIVERED' THEN 1 END) as completed_repairs,
    COUNT(CASE WHEN rr.status IN ('RECEIVED', 'INSPECTION', 'UNDER_REPAIR') THEN 1 END) as active_repairs,
    MAX(rr.createdAt) as last_repair_date,
    SUM(CASE WHEN rr.status = 'DELIVERED' THEN 
        COALESCE(rr.actualCost, 0) END) as total_spent
FROM Customer c
LEFT JOIN RepairRequest rr ON c.id = rr.customerId AND rr.deletedAt IS NULL
WHERE c.deletedAt IS NULL
GROUP BY c.id, c.name, c.phone, c.email;

-- =============================================
-- تحسينات إضافية
-- =============================================

-- تحديث إحصائيات الجداول لتحسين أداء المخطط التنفيذي
ANALYZE TABLE RepairRequest;
ANALYZE TABLE Customer;
ANALYZE TABLE User;
ANALYZE TABLE Invoice;
ANALYZE TABLE Payment;
ANALYZE TABLE Expense;

-- =============================================
-- إنشاء Stored Procedures للعمليات المعقدة
-- =============================================

DELIMITER //

-- إجراء لحساب إحصائيات الإصلاحات لفترة معينة
CREATE PROCEDURE GetRepairStatsByDateRange(
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    SELECT 
        DATE(rr.createdAt) as date,
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN rr.status = 'RECEIVED' THEN 1 END) as received,
        COUNT(CASE WHEN rr.status = 'UNDER_REPAIR' THEN 1 END) as under_repair,
        COUNT(CASE WHEN rr.status = 'DELIVERED' THEN 1 END) as delivered,
        AVG(TIMESTAMPDIFF(HOUR, rr.createdAt, rr.updatedAt)) as avg_processing_hours
    FROM RepairRequest rr
    WHERE rr.deletedAt IS NULL 
        AND DATE(rr.createdAt) BETWEEN start_date AND end_date
    GROUP BY DATE(rr.createdAt)
    ORDER BY date DESC;
END //

-- إجراء لتحديث حالة طلب الإصلاح مع logging
CREATE PROCEDURE UpdateRepairStatus(
    IN repair_id INT,
    IN new_status VARCHAR(50),
    IN updated_by INT
)
BEGIN
    DECLARE old_status VARCHAR(50);
    
    -- جلب الحالة القديمة
    SELECT status INTO old_status FROM RepairRequest WHERE id = repair_id;
    
    -- تحديث الحالة
    UPDATE RepairRequest 
    SET status = new_status, updatedAt = NOW()
    WHERE id = repair_id;
    
    -- إدراج في سجل التغييرات (إذا كان الجدول موجود)
    -- INSERT INTO RepairStatusHistory (repairId, oldStatus, newStatus, changedBy, changedAt)
    -- VALUES (repair_id, old_status, new_status, updated_by, NOW());
    
    SELECT 'Status updated successfully' as message;
END //

DELIMITER ;

-- =============================================
-- إنشاء Triggers للتحديث التلقائي
-- =============================================

-- Trigger لتحديث updatedAt تلقائياً
DELIMITER //
CREATE TRIGGER tr_repairrequest_update_timestamp
    BEFORE UPDATE ON RepairRequest
    FOR EACH ROW
BEGIN
    SET NEW.updatedAt = NOW();
END //
DELIMITER ;

-- Trigger لتحديث updatedAt في Customer
DELIMITER //
CREATE TRIGGER tr_customer_update_timestamp
    BEFORE UPDATE ON Customer
    FOR EACH ROW
BEGIN
    SET NEW.updatedAt = NOW();
END //
DELIMITER ;

-- Trigger لتحديث updatedAt في User
DELIMITER //
CREATE TRIGGER tr_user_update_timestamp
    BEFORE UPDATE ON User
    FOR EACH ROW
BEGIN
    SET NEW.updatedAt = NOW();
END //
DELIMITER ;

-- =============================================
-- إنشاء جداول إضافية للتحسينات
-- =============================================

-- جدول لحفظ إحصائيات الأداء
CREATE TABLE IF NOT EXISTS PerformanceMetrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_name (metric_name),
    INDEX idx_recorded_at (recorded_at)
);

-- جدول لحفظ cache keys
CREATE TABLE IF NOT EXISTS CacheKeys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    ttl INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_expires_at (expires_at),
    INDEX idx_cache_key (cache_key)
);

-- =============================================
-- إدراج بيانات تجريبية للاختبار
-- =============================================

-- إدراج بعض إحصائيات الأداء التجريبية
INSERT INTO PerformanceMetrics (metric_name, metric_value, metric_unit) VALUES
('average_response_time', 60.5, 'ms'),
('cache_hit_rate', 85.2, 'percent'),
('database_query_time', 25.3, 'ms'),
('active_users', 150, 'count'),
('total_repairs_today', 12, 'count');

COMMIT;

