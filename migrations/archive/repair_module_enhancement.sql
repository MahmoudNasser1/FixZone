-- =====================================================
-- Repair Module Enhancement Migration
-- =====================================================
-- Date: 2025-10-11
-- Description: تحسينات شاملة لموديول الصيانة
-- Author: System Architect
-- =====================================================

USE FZ;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- PART 1: ALTER EXISTING TABLES
-- =====================================================

-- -------------------------------------------------
-- 1.1 تحديث جدول RepairRequest
-- -------------------------------------------------
ALTER TABLE RepairRequest
-- إضافة حقول التشخيص
ADD COLUMN diagnosticNotes TEXT COMMENT 'ملاحظات التشخيص' AFTER issueDescription,
ADD COLUMN technicianNotes TEXT COMMENT 'ملاحظات الفني' AFTER diagnosticNotes,
ADD COLUMN internalNotes TEXT COMMENT 'ملاحظات داخلية' AFTER technicianNotes,

-- إضافة حقول حالة القطع
ADD COLUMN partsStatus ENUM('none', 'pending', 'approved', 'ordered', 'ready') DEFAULT 'none' COMMENT 'حالة القطع' AFTER priority,
ADD COLUMN approvedBy INT NULL COMMENT 'من وافق على القطع' AFTER partsStatus,
ADD COLUMN approvedAt DATETIME NULL COMMENT 'تاريخ الموافقة' AFTER approvedBy,

-- إضافة حقول التكلفة والربح
ADD COLUMN totalPartsCost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة القطع الإجمالية' AFTER actualCost,
ADD COLUMN totalServicesCost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة الخدمات الإجمالية' AFTER totalPartsCost,
ADD COLUMN totalCost DECIMAL(10,2) DEFAULT 0 COMMENT 'التكلفة الإجمالية' AFTER totalServicesCost,
ADD COLUMN expectedProfit DECIMAL(10,2) DEFAULT 0 COMMENT 'الربح المتوقع' AFTER totalCost,
ADD COLUMN profitMargin DECIMAL(5,2) DEFAULT 0 COMMENT 'هامش الربح %' AFTER expectedProfit,

-- إضافة حقول الإشعارات
ADD COLUMN customerNotified BOOLEAN DEFAULT FALSE COMMENT 'تم إشعار العميل' AFTER profitMargin,
ADD COLUMN lastNotificationAt DATETIME NULL COMMENT 'آخر إشعار للعميل' AFTER customerNotified,

-- إضافة حقول الضمان
ADD COLUMN warrantyMonths INT DEFAULT 0 COMMENT 'مدة الضمان بالأشهر' AFTER lastNotificationAt,
ADD COLUMN warrantyExpiry DATE NULL COMMENT 'تاريخ انتهاء الضمان' AFTER warrantyMonths,

-- إضافة حقول حالة الجهاز
ADD COLUMN deviceCondition ENUM('excellent', 'good', 'fair', 'poor') COMMENT 'حالة الجهاز عند الاستلام' AFTER warrantyExpiry,
ADD COLUMN hasBackup BOOLEAN DEFAULT FALSE COMMENT 'تم عمل نسخة احتياطية' AFTER deviceCondition,

-- إضافة حقول الاستعجال والوقت
ADD COLUMN urgency ENUM('normal', 'urgent', 'critical') DEFAULT 'normal' COMMENT 'درجة الاستعجال' AFTER hasBackup,
ADD COLUMN estimatedHours DECIMAL(5,2) COMMENT 'الوقت المتوقع بالساعات' AFTER urgency,
ADD COLUMN actualHours DECIMAL(5,2) COMMENT 'الوقت الفعلي بالساعات' AFTER estimatedHours,

-- إضافة حقول فحص الجودة
ADD COLUMN qcStatus ENUM('pending', 'passed', 'failed') COMMENT 'حالة فحص الجودة' AFTER actualHours,
ADD COLUMN qcBy INT NULL COMMENT 'من فحص الجودة' AFTER qcStatus,
ADD COLUMN qcAt DATETIME NULL COMMENT 'تاريخ فحص الجودة' AFTER qcBy,
ADD COLUMN qcNotes TEXT COMMENT 'ملاحظات فحص الجودة' AFTER qcAt,

-- Foreign Keys
ADD CONSTRAINT fk_repair_approved_by FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_repair_qc_by FOREIGN KEY (qcBy) REFERENCES User(id) ON DELETE SET NULL;

-- Indexes للأداء
CREATE INDEX idx_repair_status ON RepairRequest(status);
CREATE INDEX idx_repair_priority ON RepairRequest(priority);
CREATE INDEX idx_repair_technician ON RepairRequest(assignedTechnicianId);
CREATE INDEX idx_repair_customer ON RepairRequest(customerId);
CREATE INDEX idx_repair_created ON RepairRequest(createdAt);
CREATE INDEX idx_repair_parts_status ON RepairRequest(partsStatus);
CREATE INDEX idx_repair_urgency ON RepairRequest(urgency);
CREATE INDEX idx_repair_qc_status ON RepairRequest(qcStatus);

-- -------------------------------------------------
-- 1.2 تحديث جدول PartsUsed
-- -------------------------------------------------
ALTER TABLE PartsUsed
-- إضافة تتبع أفضل للقطع
ADD COLUMN status ENUM('requested', 'approved', 'used', 'returned', 'cancelled') DEFAULT 'requested' COMMENT 'حالة القطعة' AFTER quantity,
ADD COLUMN requestedBy INT COMMENT 'من طلب القطعة (الفني)' AFTER status,
ADD COLUMN approvedBy INT NULL COMMENT 'من وافق على القطعة' AFTER requestedBy,
ADD COLUMN usedBy INT NULL COMMENT 'من استخدم القطعة' AFTER approvedBy,
ADD COLUMN requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الطلب' AFTER usedBy,
ADD COLUMN approvedAt DATETIME NULL COMMENT 'تاريخ الموافقة' AFTER requestedAt,
ADD COLUMN usedAt DATETIME NULL COMMENT 'تاريخ الاستخدام الفعلي' AFTER approvedAt,
ADD COLUMN returnedAt DATETIME NULL COMMENT 'تاريخ الإرجاع' AFTER usedAt,
ADD COLUMN returnReason TEXT COMMENT 'سبب الإرجاع' AFTER returnedAt,
ADD COLUMN serialNumber VARCHAR(100) COMMENT 'الرقم التسلسلي للقطعة المستخدمة' AFTER returnReason,
ADD COLUMN warehouseId INT COMMENT 'المستودع الذي تم السحب منه' AFTER serialNumber,
ADD COLUMN unitPurchasePrice DECIMAL(10,2) COMMENT 'سعر الشراء للوحدة' AFTER warehouseId,
ADD COLUMN unitSellingPrice DECIMAL(10,2) COMMENT 'سعر البيع للوحدة' AFTER unitPurchasePrice,
ADD COLUMN totalCost DECIMAL(10,2) COMMENT 'التكلفة الإجمالية' AFTER unitSellingPrice,
ADD COLUMN totalPrice DECIMAL(10,2) COMMENT 'السعر الإجمالي' AFTER totalCost,
ADD COLUMN profit DECIMAL(10,2) COMMENT 'الربح' AFTER totalPrice,
ADD COLUMN notes TEXT COMMENT 'ملاحظات' AFTER profit,
ADD COLUMN isWarranty BOOLEAN DEFAULT FALSE COMMENT 'قطعة تحت الضمان' AFTER notes,

-- Foreign Keys
ADD CONSTRAINT fk_parts_requested_by FOREIGN KEY (requestedBy) REFERENCES User(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_parts_approved_by FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_parts_used_by FOREIGN KEY (usedBy) REFERENCES User(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_parts_warehouse FOREIGN KEY (warehouseId) REFERENCES Warehouse(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_parts_repair ON PartsUsed(repairRequestId);
CREATE INDEX idx_parts_item ON PartsUsed(inventoryItemId);
CREATE INDEX idx_parts_status ON PartsUsed(status);
CREATE INDEX idx_parts_requested_by ON PartsUsed(requestedBy);
CREATE INDEX idx_parts_used_at ON PartsUsed(usedAt);

-- -------------------------------------------------
-- 1.3 تحديث جدول RepairRequestService
-- -------------------------------------------------
ALTER TABLE RepairRequestService
-- إضافة تتبع أفضل للخدمات
ADD COLUMN status ENUM('added', 'in_progress', 'completed', 'cancelled') DEFAULT 'added' AFTER price,
ADD COLUMN performedBy INT COMMENT 'من نفذ الخدمة' AFTER status,
ADD COLUMN startedAt DATETIME NULL COMMENT 'وقت البدء' AFTER performedBy,
ADD COLUMN completedAt DATETIME NULL COMMENT 'وقت الانتهاء' AFTER startedAt,
ADD COLUMN durationMinutes INT COMMENT 'المدة بالدقائق' AFTER completedAt,
ADD COLUMN notes TEXT COMMENT 'ملاحظات على الخدمة' AFTER durationMinutes,
ADD COLUMN baseCost DECIMAL(10,2) COMMENT 'التكلفة الأساسية' AFTER notes,
ADD COLUMN profit DECIMAL(10,2) COMMENT 'الربح من الخدمة' AFTER baseCost,
ADD COLUMN discount DECIMAL(10,2) DEFAULT 0 COMMENT 'الخصم' AFTER profit,
ADD COLUMN finalPrice DECIMAL(10,2) COMMENT 'السعر النهائي' AFTER discount,
ADD COLUMN isWarranty BOOLEAN DEFAULT FALSE COMMENT 'خدمة تحت الضمان' AFTER finalPrice,

-- Foreign Keys
ADD CONSTRAINT fk_service_performed_by FOREIGN KEY (performedBy) REFERENCES User(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_service_repair ON RepairRequestService(repairRequestId);
CREATE INDEX idx_service_status ON RepairRequestService(status);
CREATE INDEX idx_service_performed_by ON RepairRequestService(performedBy);

-- =====================================================
-- PART 2: CREATE NEW TABLES
-- =====================================================

-- -------------------------------------------------
-- 2.1 جدول RepairWorkflow - سجل دورة العمل
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairWorkflow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    stage ENUM(
        'received',          -- تم الاستلام
        'initial_diagnosis', -- التشخيص الأولي
        'quote_prepared',    -- تجهيز العرض
        'quote_approved',    -- موافقة العميل
        'parts_ordered',     -- طلب القطع
        'parts_received',    -- استلام القطع
        'repair_started',    -- بدء الصيانة
        'repair_completed',  -- انتهاء الصيانة
        'qc_check',          -- فحص الجودة
        'ready_delivery',    -- جاهز للتسليم
        'delivered',         -- تم التسليم
        'invoice_sent',      -- تم إرسال الفاتورة
        'payment_received'   -- تم استلام الدفعة
    ) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',
    userId INT COMMENT 'المستخدم المسؤول',
    notes TEXT,
    startedAt DATETIME,
    completedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_workflow_repair (repairRequestId),
    INDEX idx_workflow_stage (stage),
    INDEX idx_workflow_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل مراحل دورة عمل الصيانة';

-- -------------------------------------------------
-- 2.2 جدول RepairPartsApproval - موافقات القطع
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairPartsApproval (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    partsUsedId INT NULL COMMENT 'يمكن أن يكون للقطعة أو للطلب كاملاً',
    requestedBy INT NOT NULL COMMENT 'الفني الطالب',
    approverRoleId INT COMMENT 'الدور المطلوب للموافقة',
    approvedBy INT NULL COMMENT 'من وافق',
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    requestReason TEXT COMMENT 'سبب الطلب',
    rejectionReason TEXT COMMENT 'سبب الرفض',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    totalCost DECIMAL(10,2) COMMENT 'التكلفة الإجمالية للقطع المطلوبة',
    requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewedAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (partsUsedId) REFERENCES PartsUsed(id) ON DELETE SET NULL,
    FOREIGN KEY (requestedBy) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (approverRoleId) REFERENCES Role(id) ON DELETE SET NULL,
    
    INDEX idx_approval_repair (repairRequestId),
    INDEX idx_approval_status (status),
    INDEX idx_approval_requested_by (requestedBy),
    INDEX idx_approval_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='طلبات الموافقة على القطع';

-- -------------------------------------------------
-- 2.3 جدول RepairNotification - سجل الإشعارات
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairNotification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    customerId INT NOT NULL,
    notificationType ENUM(
        'repair_received',      -- تم استلام الجهاز
        'diagnosis_complete',   -- اكتمل التشخيص
        'quote_ready',          -- العرض جاهز
        'parts_ordered',        -- تم طلب القطع
        'repair_started',       -- بدأت الصيانة
        'repair_completed',     -- انتهت الصيانة
        'ready_pickup',         -- جاهز للاستلام
        'delivered',            -- تم التسليم
        'invoice_sent',         -- تم إرسال الفاتورة
        'payment_reminder',     -- تذكير بالدفع
        'warranty_expiring'     -- ينتهي الضمان قريبًا
    ) NOT NULL,
    channel ENUM('sms', 'email', 'whatsapp', 'push', 'system') DEFAULT 'system',
    status ENUM('pending', 'sent', 'delivered', 'failed', 'read') DEFAULT 'pending',
    title VARCHAR(255),
    message TEXT NOT NULL,
    recipient VARCHAR(255) COMMENT 'رقم/بريد المستلم',
    sentBy INT COMMENT 'من أرسل الإشعار',
    sentAt DATETIME NULL,
    deliveredAt DATETIME NULL,
    readAt DATETIME NULL,
    failureReason TEXT,
    retryCount INT DEFAULT 0,
    metadata JSON COMMENT 'بيانات إضافية',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
    FOREIGN KEY (sentBy) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_notification_repair (repairRequestId),
    INDEX idx_notification_customer (customerId),
    INDEX idx_notification_type (notificationType),
    INDEX idx_notification_status (status),
    INDEX idx_notification_sent_at (sentAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل إشعارات العملاء';

-- -------------------------------------------------
-- 2.4 جدول RepairCostBreakdown - تفصيل التكاليف
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairCostBreakdown (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    itemType ENUM('part', 'service', 'labor', 'shipping', 'other') NOT NULL,
    itemId INT COMMENT 'ID القطعة أو الخدمة',
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unitCost DECIMAL(10,2) NOT NULL COMMENT 'سعر التكلفة للوحدة',
    unitPrice DECIMAL(10,2) NOT NULL COMMENT 'سعر البيع للوحدة',
    totalCost DECIMAL(10,2) NOT NULL COMMENT 'التكلفة الإجمالية',
    totalPrice DECIMAL(10,2) NOT NULL COMMENT 'السعر الإجمالي',
    profit DECIMAL(10,2) NOT NULL COMMENT 'الربح',
    profitMargin DECIMAL(5,2) COMMENT 'هامش الربح %',
    discount DECIMAL(10,2) DEFAULT 0,
    finalPrice DECIMAL(10,2) NOT NULL,
    isIncludedInInvoice BOOLEAN DEFAULT TRUE,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    
    INDEX idx_cost_repair (repairRequestId),
    INDEX idx_cost_type (itemType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تفصيل التكاليف والأرباح';

-- -------------------------------------------------
-- 2.5 جدول RepairDeviceHistory - تاريخ الجهاز
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairDeviceHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deviceSerialNumber VARCHAR(100) NOT NULL,
    customerId INT NOT NULL,
    deviceType VARCHAR(100),
    deviceBrand VARCHAR(100),
    deviceModel VARCHAR(100),
    repairRequestId INT COMMENT 'طلب الصيانة المرتبط',
    eventType ENUM(
        'first_repair',      -- أول صيانة
        'repeat_repair',     -- صيانة متكررة
        'warranty_repair',   -- صيانة ضمان
        'part_replaced',     -- استبدال قطعة
        'upgrade',           -- ترقية
        'note'               -- ملاحظة
    ) NOT NULL,
    description TEXT,
    partReplaced VARCHAR(255) COMMENT 'القطعة المستبدلة',
    technicianId INT,
    cost DECIMAL(10,2),
    eventDate DATE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
    FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_history_serial (deviceSerialNumber),
    INDEX idx_history_customer (customerId),
    INDEX idx_history_repair (repairRequestId),
    INDEX idx_history_event_date (eventDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تاريخ الصيانات للأجهزة';

-- -------------------------------------------------
-- 2.6 جدول RepairQuotation - عروض الأسعار
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairQuotation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    quotationNumber VARCHAR(50) UNIQUE,
    version INT DEFAULT 1 COMMENT 'رقم النسخة من العرض',
    totalPartsCost DECIMAL(10,2) DEFAULT 0,
    totalServicesCost DECIMAL(10,2) DEFAULT 0,
    laborCost DECIMAL(10,2) DEFAULT 0,
    otherCosts DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    discountType ENUM('fixed', 'percentage') DEFAULT 'fixed',
    taxAmount DECIMAL(10,2) DEFAULT 0,
    taxRate DECIMAL(5,2) DEFAULT 0,
    finalAmount DECIMAL(10,2) NOT NULL,
    validUntil DATE COMMENT 'صلاحية العرض',
    status ENUM('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired') DEFAULT 'draft',
    sentAt DATETIME NULL,
    viewedAt DATETIME NULL,
    respondedAt DATETIME NULL,
    customerResponse TEXT COMMENT 'رد العميل',
    preparedBy INT,
    approvedBy INT NULL COMMENT 'من وافق من الإدارة',
    notes TEXT,
    terms TEXT COMMENT 'الشروط والأحكام',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (preparedBy) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_quotation_repair (repairRequestId),
    INDEX idx_quotation_number (quotationNumber),
    INDEX idx_quotation_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='عروض أسعار الصيانة';

-- -------------------------------------------------
-- 2.7 جدول RepairQualityCheck - فحص الجودة
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairQualityCheck (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    checkedBy INT NOT NULL,
    checklistVersion VARCHAR(20) DEFAULT '1.0',
    overallStatus ENUM('passed', 'failed', 'conditional') NOT NULL,
    functionalityCheck BOOLEAN COMMENT 'فحص الوظائف',
    appearanceCheck BOOLEAN COMMENT 'فحص المظهر',
    partsQualityCheck BOOLEAN COMMENT 'جودة القطع المستخدمة',
    cleanlinessCheck BOOLEAN COMMENT 'النظافة',
    packagingCheck BOOLEAN COMMENT 'التعبئة والتغليف',
    score INT COMMENT 'النقاط (من 100)',
    issues JSON COMMENT 'المشاكل المكتشفة',
    recommendations TEXT COMMENT 'التوصيات',
    requiresRework BOOLEAN DEFAULT FALSE,
    reworkReason TEXT,
    reworkAssignedTo INT NULL,
    reworkCompletedAt DATETIME NULL,
    checkDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (checkedBy) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (reworkAssignedTo) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_qc_repair (repairRequestId),
    INDEX idx_qc_status (overallStatus),
    INDEX idx_qc_checked_by (checkedBy),
    INDEX idx_qc_date (checkDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل فحص الجودة';

-- -------------------------------------------------
-- 2.8 جدول RepairTimeLog - سجل الوقت
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairTimeLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    technicianId INT NOT NULL,
    activityType ENUM(
        'diagnosis',      -- التشخيص
        'repair',         -- الصيانة
        'testing',        -- الاختبار
        'quality_check',  -- فحص الجودة
        'waiting_parts',  -- انتظار القطع
        'customer_delay', -- تأخير من العميل
        'rework',         -- إعادة عمل
        'other'           -- أخرى
    ) NOT NULL,
    description TEXT,
    startTime DATETIME NOT NULL,
    endTime DATETIME NULL,
    durationMinutes INT COMMENT 'المدة المحسوبة تلقائياً',
    isBillable BOOLEAN DEFAULT TRUE COMMENT 'قابل للفوترة',
    hourlyRate DECIMAL(10,2) COMMENT 'سعر الساعة',
    totalCost DECIMAL(10,2) COMMENT 'التكلفة الإجمالية',
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
    
    INDEX idx_time_repair (repairRequestId),
    INDEX idx_time_technician (technicianId),
    INDEX idx_time_activity (activityType),
    INDEX idx_time_start (startTime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل الوقت المستغرق في الصيانة';

-- =====================================================
-- PART 3: DATA MIGRATION & UPDATES
-- =====================================================

-- Update existing repairs with default values
UPDATE RepairRequest 
SET 
    partsStatus = 'none',
    totalCost = COALESCE(actualCost, estimatedCost, 0),
    urgency = 'normal',
    customerNotified = FALSE,
    hasBackup = FALSE,
    warrantyMonths = 3
WHERE deletedAt IS NULL;

-- Create initial workflow entries for existing repairs
INSERT INTO RepairWorkflow (repairRequestId, stage, status, startedAt, completedAt, createdAt)
SELECT 
    id,
    CASE 
        WHEN status = 'pending' THEN 'received'
        WHEN status = 'in_progress' THEN 'repair_started'
        WHEN status = 'completed' THEN 'repair_completed'
        WHEN status = 'delivered' THEN 'delivered'
        ELSE 'received'
    END,
    'completed',
    createdAt,
    updatedAt,
    createdAt
FROM RepairRequest
WHERE deletedAt IS NULL;

-- Update PartsUsed with default status and timestamps
UPDATE PartsUsed
SET 
    status = 'used',
    usedAt = createdAt,
    requestedAt = createdAt
WHERE id > 0;

-- =====================================================
-- PART 4: CREATE TRIGGERS
-- =====================================================

DELIMITER $$

-- Trigger: Auto-calculate profit margin when cost breakdown is inserted
CREATE TRIGGER trg_calc_profit_margin
BEFORE INSERT ON RepairCostBreakdown
FOR EACH ROW
BEGIN
    SET NEW.profit = NEW.totalPrice - NEW.totalCost;
    IF NEW.totalCost > 0 THEN
        SET NEW.profitMargin = (NEW.profit / NEW.totalCost) * 100;
    END IF;
    SET NEW.finalPrice = NEW.totalPrice - COALESCE(NEW.discount, 0);
END$$

-- Trigger: Update repair total cost when cost breakdown changes
CREATE TRIGGER trg_update_repair_cost
AFTER INSERT ON RepairCostBreakdown
FOR EACH ROW
BEGIN
    UPDATE RepairRequest
    SET 
        totalCost = (
            SELECT SUM(totalCost) 
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId
        ),
        totalPartsCost = (
            SELECT COALESCE(SUM(totalCost), 0)
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId AND itemType = 'part'
        ),
        totalServicesCost = (
            SELECT COALESCE(SUM(totalCost), 0)
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId AND itemType = 'service'
        ),
        expectedProfit = (
            SELECT SUM(profit) 
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId
        )
    WHERE id = NEW.repairRequestId;
END$$

-- Trigger: Auto-generate quotation number
CREATE TRIGGER trg_gen_quotation_number
BEFORE INSERT ON RepairQuotation
FOR EACH ROW
BEGIN
    IF NEW.quotationNumber IS NULL OR NEW.quotationNumber = '' THEN
        SET NEW.quotationNumber = CONCAT('QUO-', YEAR(NOW()), LPAD(MONTH(NOW()), 2, '0'), '-', LPAD(NEW.repairRequestId, 5, '0'), '-', NEW.version);
    END IF;
END$$

-- Trigger: Calculate time log duration
CREATE TRIGGER trg_calc_time_duration
BEFORE UPDATE ON RepairTimeLog
FOR EACH ROW
BEGIN
    IF NEW.endTime IS NOT NULL AND OLD.endTime IS NULL THEN
        SET NEW.durationMinutes = TIMESTAMPDIFF(MINUTE, NEW.startTime, NEW.endTime);
        IF NEW.hourlyRate IS NOT NULL THEN
            SET NEW.totalCost = (NEW.durationMinutes / 60) * NEW.hourlyRate;
        END IF;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- PART 5: CREATE VIEWS
-- =====================================================

-- View: Repair Summary with all related data
CREATE OR REPLACE VIEW v_repair_summary AS
SELECT 
    r.id,
    r.deviceBrand,
    r.deviceModel,
    r.status,
    r.priority,
    r.urgency,
    r.totalCost,
    r.expectedProfit,
    r.profitMargin,
    c.name as customerName,
    c.phone as customerPhone,
    u.name as technicianName,
    COUNT(DISTINCT pu.id) as partsCount,
    COUNT(DISTINCT rs.id) as servicesCount,
    r.createdAt,
    r.updatedAt,
    DATEDIFF(NOW(), r.createdAt) as daysInShop
FROM RepairRequest r
LEFT JOIN Customer c ON r.customerId = c.id
LEFT JOIN User u ON r.assignedTechnicianId = u.id
LEFT JOIN PartsUsed pu ON r.id = pu.repairRequestId AND pu.status IN ('approved', 'used')
LEFT JOIN RepairRequestService rs ON r.id = rs.repairRequestId
WHERE r.deletedAt IS NULL
GROUP BY r.id;

-- View: Pending Approvals Summary
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
    a.id,
    a.repairRequestId,
    r.deviceBrand,
    r.deviceModel,
    a.priority,
    a.totalCost,
    a.requestReason,
    u.name as requestedByName,
    a.requestedAt,
    TIMESTAMPDIFF(HOUR, a.requestedAt, NOW()) as hoursWaiting
FROM RepairPartsApproval a
JOIN RepairRequest r ON a.repairRequestId = r.id
JOIN User u ON a.requestedBy = u.id
WHERE a.status = 'pending'
ORDER BY a.priority DESC, a.requestedAt ASC;

-- View: Technician Performance
CREATE OR REPLACE VIEW v_technician_performance AS
SELECT 
    u.id as technicianId,
    u.name as technicianName,
    COUNT(DISTINCT r.id) as totalRepairs,
    SUM(CASE WHEN r.status = 'delivered' THEN 1 ELSE 0 END) as completedRepairs,
    AVG(r.actualHours) as avgHours,
    AVG(r.profitMargin) as avgProfitMargin,
    SUM(r.expectedProfit) as totalProfit,
    AVG(qc.score) as avgQualityScore
FROM User u
LEFT JOIN RepairRequest r ON u.id = r.assignedTechnicianId AND r.deletedAt IS NULL
LEFT JOIN RepairQualityCheck qc ON r.id = qc.repairRequestId
WHERE u.roleId = 3  -- Technician role
GROUP BY u.id;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Success Message
SELECT 'Migration completed successfully! ✅' as Status;
