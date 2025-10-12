-- ============================================
-- Fix Zone ERP - Repair Module Enhancement
-- ============================================
-- Version: 1.0
-- Date: 11 أكتوبر 2025
-- Description: تحسينات شاملة لموديول الصيانة
-- Based on: 01_COMPLETE_SCHEMA.sql
-- 
-- التحسينات:
--   - إضافة حقول جديدة للجداول الموجودة
--   - إنشاء جداول جديدة للتكامل
--   - Triggers للحسابات التلقائية
--   - Views للاستعلامات المعقدة
-- 
-- ⚠️ ملاحظة: يمكن تشغيله على قاعدة بيانات موجودة
--             آمن - لن يفقد أي بيانات
-- ============================================

USE FZ;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- PART 1: ALTER EXISTING TABLES
-- =====================================================

-- -------------------------------------------------
-- 1.1 تحديث جدول RepairRequest
-- -------------------------------------------------
-- ملاحظة: الجدول الحالي يحتوي على:
-- id, deviceId, reportedProblem, technicianReport, status, 
-- trackingToken, customerId, branchId, technicianId, 
-- quotationId, invoiceId, deviceBatchId, attachments, 
-- customFields, createdAt, updatedAt, deletedAt

ALTER TABLE RepairRequest
-- إضافة حقول التشخيص والملاحظات
ADD COLUMN IF NOT EXISTS diagnosticNotes TEXT COMMENT 'ملاحظات التشخيص المفصلة',
ADD COLUMN IF NOT EXISTS internalNotes TEXT COMMENT 'ملاحظات داخلية للفريق',
ADD COLUMN IF NOT EXISTS customerNotes TEXT COMMENT 'ملاحظات للعميل',

-- إضافة حقول إدارة القطع
ADD COLUMN IF NOT EXISTS partsStatus ENUM('none', 'pending', 'approved', 'ordered', 'ready') DEFAULT 'none' COMMENT 'حالة القطع المطلوبة',
ADD COLUMN IF NOT EXISTS partsApprovedBy INT NULL COMMENT 'من وافق على القطع',
ADD COLUMN IF NOT EXISTS partsApprovedAt DATETIME NULL COMMENT 'تاريخ الموافقة على القطع',

-- إضافة حقول التكلفة والربحية
ADD COLUMN IF NOT EXISTS totalPartsCost DECIMAL(12,2) DEFAULT 0 COMMENT 'تكلفة القطع الإجمالية',
ADD COLUMN IF NOT EXISTS totalServicesCost DECIMAL(12,2) DEFAULT 0 COMMENT 'تكلفة الخدمات الإجمالية',
ADD COLUMN IF NOT EXISTS totalLaborCost DECIMAL(12,2) DEFAULT 0 COMMENT 'تكلفة العمالة',
ADD COLUMN IF NOT EXISTS estimatedCost DECIMAL(12,2) DEFAULT 0 COMMENT 'التكلفة المتوقعة',
ADD COLUMN IF NOT EXISTS actualCost DECIMAL(12,2) DEFAULT 0 COMMENT 'التكلفة الفعلية',
ADD COLUMN IF NOT EXISTS expectedProfit DECIMAL(12,2) DEFAULT 0 COMMENT 'الربح المتوقع',
ADD COLUMN IF NOT EXISTS profitMargin DECIMAL(5,2) DEFAULT 0 COMMENT 'هامش الربح %',

-- إضافة حقول الإشعارات
ADD COLUMN IF NOT EXISTS customerNotified BOOLEAN DEFAULT FALSE COMMENT 'تم إشعار العميل',
ADD COLUMN IF NOT EXISTS lastNotificationAt DATETIME NULL COMMENT 'آخر إشعار للعميل',
ADD COLUMN IF NOT EXISTS notificationCount INT DEFAULT 0 COMMENT 'عدد الإشعارات المرسلة',

-- إضافة حقول الضمان
ADD COLUMN IF NOT EXISTS warrantyMonths INT DEFAULT 3 COMMENT 'مدة الضمان بالأشهر',
ADD COLUMN IF NOT EXISTS warrantyExpiry DATE NULL COMMENT 'تاريخ انتهاء الضمان',
ADD COLUMN IF NOT EXISTS isWarrantyRepair BOOLEAN DEFAULT FALSE COMMENT 'صيانة تحت الضمان',

-- إضافة حقول حالة الجهاز
ADD COLUMN IF NOT EXISTS deviceCondition ENUM('excellent', 'good', 'fair', 'poor') COMMENT 'حالة الجهاز عند الاستلام',
ADD COLUMN IF NOT EXISTS devicePassword VARCHAR(100) COMMENT 'كلمة مرور الجهاز',
ADD COLUMN IF NOT EXISTS hasBackup BOOLEAN DEFAULT FALSE COMMENT 'تم عمل نسخة احتياطية',
ADD COLUMN IF NOT EXISTS backupLocation VARCHAR(255) COMMENT 'موقع النسخة الاحتياطية',

-- إضافة حقول الأولوية والاستعجال
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'الأولوية',
ADD COLUMN IF NOT EXISTS urgency ENUM('normal', 'urgent', 'critical') DEFAULT 'normal' COMMENT 'درجة الاستعجال',

-- إضافة حقول الوقت المتوقع والفعلي
ADD COLUMN IF NOT EXISTS estimatedHours DECIMAL(5,2) COMMENT 'الوقت المتوقع بالساعات',
ADD COLUMN IF NOT EXISTS actualHours DECIMAL(5,2) COMMENT 'الوقت الفعلي بالساعات',
ADD COLUMN IF NOT EXISTS startedAt DATETIME NULL COMMENT 'تاريخ بدء الصيانة',
ADD COLUMN IF NOT EXISTS completedAt DATETIME NULL COMMENT 'تاريخ انتهاء الصيانة',
ADD COLUMN IF NOT EXISTS deliveredAt DATETIME NULL COMMENT 'تاريخ التسليم',

-- إضافة حقول فحص الجودة
ADD COLUMN IF NOT EXISTS qcStatus ENUM('pending', 'passed', 'failed', 'conditional') COMMENT 'حالة فحص الجودة',
ADD COLUMN IF NOT EXISTS qcBy INT NULL COMMENT 'من فحص الجودة',
ADD COLUMN IF NOT EXISTS qcAt DATETIME NULL COMMENT 'تاريخ فحص الجودة',
ADD COLUMN IF NOT EXISTS qcNotes TEXT COMMENT 'ملاحظات فحص الجودة',
ADD COLUMN IF NOT EXISTS qcScore INT COMMENT 'نقاط الجودة (من 100)',

-- إضافة حقول معلومات الجهاز (لتسهيل الاستعلامات)
ADD COLUMN IF NOT EXISTS deviceBrand VARCHAR(100) COMMENT 'العلامة التجارية',
ADD COLUMN IF NOT EXISTS deviceModel VARCHAR(100) COMMENT 'الموديل',
ADD COLUMN IF NOT EXISTS deviceType VARCHAR(100) COMMENT 'نوع الجهاز',
ADD COLUMN IF NOT EXISTS serialNumber VARCHAR(100) COMMENT 'الرقم التسلسلي',

-- إضافة حقول العرض والموافقة
ADD COLUMN IF NOT EXISTS expectedDeliveryDate DATE COMMENT 'تاريخ التسليم المتوقع',
ADD COLUMN IF NOT EXISTS customerApprovedAt DATETIME NULL COMMENT 'تاريخ موافقة العميل',
ADD COLUMN IF NOT EXISTS customerRejectionReason TEXT COMMENT 'سبب رفض العميل';

-- إضافة Foreign Keys الجديدة (إذا لم تكن موجودة)
-- تحقق أولاً من عدم وجودها لتجنب الأخطاء
-- ALTER TABLE RepairRequest ADD CONSTRAINT fk_repair_parts_approved_by FOREIGN KEY (partsApprovedBy) REFERENCES User(id) ON DELETE SET NULL;
-- ALTER TABLE RepairRequest ADD CONSTRAINT fk_repair_qc_by FOREIGN KEY (qcBy) REFERENCES User(id) ON DELETE SET NULL;

-- Indexes للأداء (إذا لم تكن موجودة)
CREATE INDEX IF NOT EXISTS idx_repair_parts_status ON RepairRequest(partsStatus);
CREATE INDEX IF NOT EXISTS idx_repair_priority ON RepairRequest(priority);
CREATE INDEX IF NOT EXISTS idx_repair_urgency ON RepairRequest(urgency);
CREATE INDEX IF NOT EXISTS idx_repair_qc_status ON RepairRequest(qcStatus);
CREATE INDEX IF NOT EXISTS idx_repair_started_at ON RepairRequest(startedAt);
CREATE INDEX IF NOT EXISTS idx_repair_completed_at ON RepairRequest(completedAt);

-- -------------------------------------------------
-- 1.2 تحديث جدول PartsUsed
-- -------------------------------------------------
-- ملاحظة: الجدول الحالي يحتوي على:
-- id, quantity, repairRequestId, inventoryItemId, 
-- invoiceItemId, createdAt, updatedAt

ALTER TABLE PartsUsed
-- إضافة حقول الحالة والتتبع
ADD COLUMN IF NOT EXISTS status ENUM('requested', 'approved', 'reserved', 'used', 'returned', 'cancelled') DEFAULT 'requested' COMMENT 'حالة القطعة',
ADD COLUMN IF NOT EXISTS requestedBy INT COMMENT 'الفني الذي طلب القطعة',
ADD COLUMN IF NOT EXISTS approvedBy INT NULL COMMENT 'من وافق على القطعة',
ADD COLUMN IF NOT EXISTS usedBy INT NULL COMMENT 'من استخدم القطعة فعلياً',

-- إضافة حقول التواريخ
ADD COLUMN IF NOT EXISTS requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الطلب',
ADD COLUMN IF NOT EXISTS approvedAt DATETIME NULL COMMENT 'تاريخ الموافقة',
ADD COLUMN IF NOT EXISTS usedAt DATETIME NULL COMMENT 'تاريخ الاستخدام الفعلي',
ADD COLUMN IF NOT EXISTS returnedAt DATETIME NULL COMMENT 'تاريخ الإرجاع',

-- إضافة حقول التفاصيل
ADD COLUMN IF NOT EXISTS returnReason TEXT COMMENT 'سبب الإرجاع',
ADD COLUMN IF NOT EXISTS serialNumber VARCHAR(100) COMMENT 'الرقم التسلسلي للقطعة المستخدمة',
ADD COLUMN IF NOT EXISTS warehouseId INT COMMENT 'المستودع الذي تم السحب منه',
ADD COLUMN IF NOT EXISTS notes TEXT COMMENT 'ملاحظات',

-- إضافة حقول الأسعار والتكاليف
ADD COLUMN IF NOT EXISTS unitPurchasePrice DECIMAL(12,2) COMMENT 'سعر الشراء للوحدة',
ADD COLUMN IF NOT EXISTS unitSellingPrice DECIMAL(12,2) COMMENT 'سعر البيع للوحدة',
ADD COLUMN IF NOT EXISTS totalCost DECIMAL(12,2) COMMENT 'التكلفة الإجمالية',
ADD COLUMN IF NOT EXISTS totalPrice DECIMAL(12,2) COMMENT 'السعر الإجمالي',
ADD COLUMN IF NOT EXISTS profit DECIMAL(12,2) COMMENT 'الربح',
ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0 COMMENT 'الخصم',
ADD COLUMN IF NOT EXISTS finalPrice DECIMAL(12,2) COMMENT 'السعر النهائي',

-- إضافة حقول خاصة
ADD COLUMN IF NOT EXISTS isWarranty BOOLEAN DEFAULT FALSE COMMENT 'قطعة تحت الضمان',
ADD COLUMN IF NOT EXISTS isCritical BOOLEAN DEFAULT FALSE COMMENT 'قطعة حساسة تحتاج موافقة';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parts_status ON PartsUsed(status);
CREATE INDEX IF NOT EXISTS idx_parts_requested_by ON PartsUsed(requestedBy);
CREATE INDEX IF NOT EXISTS idx_parts_warehouse ON PartsUsed(warehouseId);
CREATE INDEX IF NOT EXISTS idx_parts_used_at ON PartsUsed(usedAt);

-- -------------------------------------------------
-- 1.3 تحديث جدول RepairRequestService
-- -------------------------------------------------
-- ملاحظة: الجدول الحالي يحتوي على:
-- id, repairRequestId, serviceId, technicianId,
-- price, notes, createdAt, updatedAt

ALTER TABLE RepairRequestService
-- إضافة حقول الحالة والتتبع
ADD COLUMN IF NOT EXISTS status ENUM('added', 'in_progress', 'completed', 'cancelled') DEFAULT 'added' COMMENT 'حالة الخدمة',
ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1 COMMENT 'الكمية',
ADD COLUMN IF NOT EXISTS performedBy INT COMMENT 'من نفذ الخدمة',

-- إضافة حقول الوقت
ADD COLUMN IF NOT EXISTS startedAt DATETIME NULL COMMENT 'وقت البدء',
ADD COLUMN IF NOT EXISTS completedAt DATETIME NULL COMMENT 'وقت الانتهاء',
ADD COLUMN IF NOT EXISTS durationMinutes INT COMMENT 'المدة بالدقائق',

-- إضافة حقول التكلفة
ADD COLUMN IF NOT EXISTS baseCost DECIMAL(12,2) COMMENT 'التكلفة الأساسية',
ADD COLUMN IF NOT EXISTS profit DECIMAL(12,2) COMMENT 'الربح من الخدمة',
ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0 COMMENT 'الخصم',
ADD COLUMN IF NOT EXISTS finalPrice DECIMAL(12,2) COMMENT 'السعر النهائي',

-- إضافة حقول خاصة
ADD COLUMN IF NOT EXISTS isWarranty BOOLEAN DEFAULT FALSE COMMENT 'خدمة تحت الضمان',
ADD COLUMN IF NOT EXISTS requiresApproval BOOLEAN DEFAULT FALSE COMMENT 'تحتاج موافقة';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_status ON RepairRequestService(status);
CREATE INDEX IF NOT EXISTS idx_service_performed_by ON RepairRequestService(performedBy);

-- =====================================================
-- PART 2: CREATE NEW TABLES
-- =====================================================

-- -------------------------------------------------
-- 2.1 جدول RepairWorkflow - سجل مراحل العمل
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairWorkflow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    stage ENUM(
        'received',          -- تم الاستلام
        'initial_diagnosis', -- التشخيص الأولي
        'quote_prepared',    -- تجهيز العرض
        'quote_sent',        -- إرسال العرض للعميل
        'quote_approved',    -- موافقة العميل
        'parts_approval',    -- موافقة على القطع
        'parts_ordered',     -- طلب القطع
        'parts_received',    -- استلام القطع
        'repair_started',    -- بدء الصيانة
        'repair_completed',  -- انتهاء الصيانة
        'qc_check',          -- فحص الجودة
        'qc_passed',         -- نجح في الجودة
        'qc_failed',         -- فشل في الجودة
        'ready_delivery',    -- جاهز للتسليم
        'delivered',         -- تم التسليم
        'invoice_created',   -- تم إنشاء الفاتورة
        'invoice_sent',      -- تم إرسال الفاتورة
        'payment_received',  -- تم استلام الدفعة
        'closed'             -- مغلق
    ) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'skipped', 'failed') DEFAULT 'pending',
    userId INT COMMENT 'المستخدم المسؤول عن هذه المرحلة',
    notes TEXT COMMENT 'ملاحظات على المرحلة',
    metadata JSON COMMENT 'بيانات إضافية',
    startedAt DATETIME COMMENT 'بداية المرحلة',
    completedAt DATETIME COMMENT 'نهاية المرحلة',
    durationMinutes INT COMMENT 'المدة بالدقائق',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_workflow_repair (repairRequestId),
    INDEX idx_workflow_stage (stage),
    INDEX idx_workflow_status (status),
    INDEX idx_workflow_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل مراحل دورة عمل الصيانة';

-- -------------------------------------------------
-- 2.2 جدول RepairPartsApproval - موافقات القطع
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairPartsApproval (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    partsUsedId INT NULL COMMENT 'القطعة المحددة أو NULL للطلب الكامل',
    requestedBy INT NOT NULL COMMENT 'الفني الطالب',
    approverRoleId INT COMMENT 'الدور المطلوب للموافقة',
    approvedBy INT NULL COMMENT 'من وافق فعلياً',
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    requestReason TEXT COMMENT 'سبب الطلب',
    rejectionReason TEXT COMMENT 'سبب الرفض إن وجد',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    totalCost DECIMAL(12,2) COMMENT 'التكلفة الإجمالية للقطع',
    autoApproved BOOLEAN DEFAULT FALSE COMMENT 'موافقة تلقائية',
    requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewedAt DATETIME NULL,
    notificationSent BOOLEAN DEFAULT FALSE,
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
    INDEX idx_approval_priority (priority),
    INDEX idx_approval_created (requestedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='طلبات الموافقة على القطع';

-- -------------------------------------------------
-- 2.3 جدول RepairNotificationLog - سجل الإشعارات
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairNotificationLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    customerId INT NOT NULL,
    notificationType ENUM(
        'repair_received',      -- تم استلام الجهاز
        'diagnosis_complete',   -- اكتمل التشخيص
        'quote_ready',          -- العرض جاهز
        'quote_sent',           -- تم إرسال العرض
        'parts_ordered',        -- تم طلب القطع
        'repair_started',       -- بدأت الصيانة
        'repair_in_progress',   -- جاري العمل
        'repair_completed',     -- انتهت الصيانة
        'qc_completed',         -- اكتمل فحص الجودة
        'ready_pickup',         -- جاهز للاستلام
        'delivered',            -- تم التسليم
        'invoice_sent',         -- تم إرسال الفاتورة
        'payment_received',     -- تم استلام الدفع
        'payment_reminder',     -- تذكير بالدفع
        'warranty_expiring',    -- ينتهي الضمان قريباً
        'custom'                -- إشعار مخصص
    ) NOT NULL,
    channel ENUM('sms', 'email', 'whatsapp', 'push', 'system') DEFAULT 'system',
    status ENUM('pending', 'sent', 'delivered', 'failed', 'read') DEFAULT 'pending',
    title VARCHAR(255),
    message TEXT NOT NULL,
    recipient VARCHAR(255) COMMENT 'رقم الهاتف أو البريد الإلكتروني',
    sentBy INT COMMENT 'من أرسل الإشعار',
    sentAt DATETIME NULL,
    deliveredAt DATETIME NULL,
    readAt DATETIME NULL,
    failureReason TEXT COMMENT 'سبب الفشل',
    retryCount INT DEFAULT 0 COMMENT 'عدد محاولات الإعادة',
    metadata JSON COMMENT 'بيانات إضافية',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
    FOREIGN KEY (sentBy) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_notification_repair (repairRequestId),
    INDEX idx_notification_customer (customerId),
    INDEX idx_notification_type (notificationType),
    INDEX idx_notification_status (status),
    INDEX idx_notification_channel (channel),
    INDEX idx_notification_sent_at (sentAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل إشعارات الصيانة للعملاء';

-- -------------------------------------------------
-- 2.4 جدول RepairCostBreakdown - تفصيل التكاليف
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairCostBreakdown (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    itemType ENUM('part', 'service', 'labor', 'shipping', 'tax', 'other') NOT NULL,
    itemId INT COMMENT 'ID القطعة أو الخدمة (إذا كان part أو service)',
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unitCost DECIMAL(12,2) NOT NULL COMMENT 'سعر التكلفة للوحدة',
    unitPrice DECIMAL(12,2) NOT NULL COMMENT 'سعر البيع للوحدة',
    totalCost DECIMAL(12,2) NOT NULL COMMENT 'التكلفة الإجمالية',
    totalPrice DECIMAL(12,2) NOT NULL COMMENT 'السعر الإجمالي',
    profit DECIMAL(12,2) NOT NULL COMMENT 'الربح',
    profitMargin DECIMAL(5,2) COMMENT 'هامش الربح %',
    discount DECIMAL(12,2) DEFAULT 0,
    discountType ENUM('fixed', 'percentage') DEFAULT 'fixed',
    finalPrice DECIMAL(12,2) NOT NULL COMMENT 'السعر النهائي بعد الخصم',
    isIncludedInInvoice BOOLEAN DEFAULT TRUE,
    isIncludedInQuotation BOOLEAN DEFAULT TRUE,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    
    INDEX idx_cost_repair (repairRequestId),
    INDEX idx_cost_type (itemType),
    INDEX idx_cost_item (itemId)
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
        'service_performed', -- خدمة تمت
        'upgrade',           -- ترقية
        'inspection',        -- فحص
        'note'               -- ملاحظة
    ) NOT NULL,
    description TEXT,
    partReplaced VARCHAR(255) COMMENT 'القطعة المستبدلة',
    servicePerformed VARCHAR(255) COMMENT 'الخدمة المنفذة',
    technicianId INT,
    cost DECIMAL(12,2),
    eventDate DATE NOT NULL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
    FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_history_serial (deviceSerialNumber),
    INDEX idx_history_customer (customerId),
    INDEX idx_history_repair (repairRequestId),
    INDEX idx_history_event_date (eventDate),
    INDEX idx_history_event_type (eventType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تاريخ الصيانات للأجهزة';

-- -------------------------------------------------
-- 2.6 جدول RepairQuotationEnhanced - عروض أسعار محسّنة
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairQuotationEnhanced (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    quotationNumber VARCHAR(50) UNIQUE,
    version INT DEFAULT 1 COMMENT 'رقم النسخة من العرض',
    
    -- التكاليف التفصيلية
    totalPartsCost DECIMAL(12,2) DEFAULT 0,
    totalServicesCost DECIMAL(12,2) DEFAULT 0,
    laborCost DECIMAL(12,2) DEFAULT 0,
    shippingCost DECIMAL(12,2) DEFAULT 0,
    otherCosts DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    
    -- الخصومات والضرائب
    discount DECIMAL(12,2) DEFAULT 0,
    discountType ENUM('fixed', 'percentage') DEFAULT 'fixed',
    discountReason TEXT,
    taxAmount DECIMAL(12,2) DEFAULT 0,
    taxRate DECIMAL(5,2) DEFAULT 14.00 COMMENT 'نسبة الضريبة',
    finalAmount DECIMAL(12,2) NOT NULL,
    
    -- معلومات العرض
    validUntil DATE COMMENT 'صلاحية العرض',
    expiresIn INT DEFAULT 7 COMMENT 'ينتهي خلال (أيام)',
    status ENUM('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'revised') DEFAULT 'draft',
    
    -- تواريخ مهمة
    sentAt DATETIME NULL,
    viewedAt DATETIME NULL,
    respondedAt DATETIME NULL,
    expiredAt DATETIME NULL,
    
    -- ردود العميل
    customerResponse TEXT COMMENT 'رد العميل',
    customerSignature TEXT COMMENT 'توقيع العميل (base64)',
    
    -- المسؤولون
    preparedBy INT COMMENT 'من أعد العرض',
    approvedBy INT NULL COMMENT 'من وافق من الإدارة',
    sentBy INT NULL COMMENT 'من أرسل العرض',
    
    -- محتوى العرض
    notes TEXT,
    terms TEXT COMMENT 'الشروط والأحكام',
    paymentTerms TEXT COMMENT 'شروط الدفع',
    
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (preparedBy) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (sentBy) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_quotation_repair (repairRequestId),
    INDEX idx_quotation_number (quotationNumber),
    INDEX idx_quotation_status (status),
    INDEX idx_quotation_version (repairRequestId, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='عروض أسعار الصيانة المحسّنة';

-- -------------------------------------------------
-- 2.7 جدول RepairQualityCheck - فحص الجودة
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairQualityCheck (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    checkedBy INT NOT NULL,
    checklistVersion VARCHAR(20) DEFAULT '1.0',
    overallStatus ENUM('passed', 'failed', 'conditional', 'pending') NOT NULL,
    
    -- معايير الفحص
    functionalityCheck BOOLEAN DEFAULT FALSE COMMENT 'فحص الوظائف',
    appearanceCheck BOOLEAN DEFAULT FALSE COMMENT 'فحص المظهر الخارجي',
    partsQualityCheck BOOLEAN DEFAULT FALSE COMMENT 'جودة القطع المستخدمة',
    cleanlinessCheck BOOLEAN DEFAULT FALSE COMMENT 'النظافة',
    packagingCheck BOOLEAN DEFAULT FALSE COMMENT 'التعبئة والتغليف',
    performanceCheck BOOLEAN DEFAULT FALSE COMMENT 'الأداء',
    
    -- النتائج
    score INT COMMENT 'النقاط الإجمالية (من 100)',
    grade ENUM('A', 'B', 'C', 'D', 'F') COMMENT 'التقدير',
    issues JSON COMMENT 'المشاكل المكتشفة',
    recommendations TEXT COMMENT 'التوصيات',
    
    -- إعادة العمل
    requiresRework BOOLEAN DEFAULT FALSE,
    reworkReason TEXT,
    reworkAssignedTo INT NULL,
    reworkCompletedAt DATETIME NULL,
    reworkNotes TEXT,
    
    -- الصور والمرفقات
    photos JSON COMMENT 'صور الفحص',
    attachments JSON COMMENT 'مرفقات إضافية',
    
    checkDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (checkedBy) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (reworkAssignedTo) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_qc_repair (repairRequestId),
    INDEX idx_qc_status (overallStatus),
    INDEX idx_qc_checked_by (checkedBy),
    INDEX idx_qc_date (checkDate),
    INDEX idx_qc_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل فحص الجودة';

-- -------------------------------------------------
-- 2.8 جدول RepairTimeLog - سجل الوقت المستغرق
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairTimeLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    technicianId INT NOT NULL,
    activityType ENUM(
        'diagnosis',        -- التشخيص
        'repair',           -- الصيانة
        'testing',          -- الاختبار
        'quality_check',    -- فحص الجودة
        'waiting_parts',    -- انتظار القطع
        'waiting_customer', -- انتظار رد العميل
        'customer_delay',   -- تأخير من العميل
        'rework',           -- إعادة عمل
        'packaging',        -- التعبئة
        'other'             -- أخرى
    ) NOT NULL,
    description TEXT,
    startTime DATETIME NOT NULL,
    endTime DATETIME NULL,
    durationMinutes INT COMMENT 'المدة المحسوبة تلقائياً',
    
    -- معلومات الفوترة
    isBillable BOOLEAN DEFAULT TRUE COMMENT 'قابل للفوترة',
    hourlyRate DECIMAL(12,2) COMMENT 'سعر الساعة',
    totalCost DECIMAL(12,2) COMMENT 'التكلفة الإجمالية',
    
    -- حالة السجل
    isActive BOOLEAN DEFAULT TRUE COMMENT 'سجل نشط (لم ينتهي بعد)',
    notes TEXT,
    
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
    
    INDEX idx_time_repair (repairRequestId),
    INDEX idx_time_technician (technicianId),
    INDEX idx_time_activity (activityType),
    INDEX idx_time_start (startTime),
    INDEX idx_time_billable (isBillable),
    INDEX idx_time_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل الوقت المستغرق في الصيانة';

-- -------------------------------------------------
-- 2.9 جدول RepairChecklistTemplate - قوالب فحص الجودة
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairChecklistTemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    deviceType VARCHAR(100) COMMENT 'نوع الجهاز (اختياري)',
    description TEXT,
    checklistItems JSON NOT NULL COMMENT 'قائمة عناصر الفحص',
    passingScore INT DEFAULT 80 COMMENT 'النقاط المطلوبة للنجاح',
    version VARCHAR(20) DEFAULT '1.0',
    isActive BOOLEAN DEFAULT TRUE,
    isDefault BOOLEAN DEFAULT FALSE,
    createdBy INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL,
    
    INDEX idx_template_device_type (deviceType),
    INDEX idx_template_active (isActive),
    INDEX idx_template_default (isDefault)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='قوالب فحص الجودة حسب نوع الجهاز';

-- -------------------------------------------------
-- 2.10 جدول RepairCustomerFeedback - تقييم العملاء
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS RepairCustomerFeedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repairRequestId INT NOT NULL,
    customerId INT NOT NULL,
    
    -- التقييمات
    overallRating INT COMMENT 'التقييم الإجمالي (1-5)',
    serviceQuality INT COMMENT 'جودة الخدمة (1-5)',
    technicianProfessionalism INT COMMENT 'احترافية الفني (1-5)',
    communicationRating INT COMMENT 'التواصل (1-5)',
    timelinessRating INT COMMENT 'الالتزام بالمواعيد (1-5)',
    pricingRating INT COMMENT 'التسعير (1-5)',
    
    -- التعليقات
    positiveComments TEXT COMMENT 'التعليقات الإيجابية',
    negativeComments TEXT COMMENT 'التعليقات السلبية',
    suggestions TEXT COMMENT 'الاقتراحات',
    
    -- معلومات إضافية
    wouldRecommend BOOLEAN COMMENT 'هل يوصي بنا؟',
    wouldReturn BOOLEAN COMMENT 'هل سيعود مرة أخرى؟',
    
    submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source ENUM('email', 'sms', 'in_person', 'web', 'phone') DEFAULT 'web',
    
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE,
    
    INDEX idx_feedback_repair (repairRequestId),
    INDEX idx_feedback_customer (customerId),
    INDEX idx_feedback_rating (overallRating),
    INDEX idx_feedback_date (submittedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تقييمات العملاء للصيانة';

-- =====================================================
-- PART 3: DATA MIGRATION & UPDATES
-- =====================================================

-- تحديث السجلات الموجودة بقيم افتراضية
UPDATE RepairRequest 
SET 
    partsStatus = 'none',
    estimatedCost = COALESCE(estimatedCost, 0),
    actualCost = COALESCE(actualCost, 0),
    urgency = 'normal',
    priority = 'normal',
    customerNotified = FALSE,
    hasBackup = FALSE,
    warrantyMonths = 3,
    notificationCount = 0
WHERE deletedAt IS NULL AND partsStatus IS NULL;

-- إنشاء workflow أولي للصيانات الموجودة
INSERT INTO RepairWorkflow (repairRequestId, stage, status, userId, startedAt, completedAt, createdAt)
SELECT 
    id,
    CASE 
        WHEN status = 'RECEIVED' THEN 'received'
        WHEN status = 'INSPECTION' THEN 'initial_diagnosis'
        WHEN status = 'UNDER_REPAIR' THEN 'repair_started'
        WHEN status = 'READY_FOR_DELIVERY' THEN 'ready_delivery'
        WHEN status = 'DELIVERED' THEN 'delivered'
        ELSE 'received'
    END,
    CASE 
        WHEN status IN ('DELIVERED', 'REJECTED') THEN 'completed'
        WHEN status IN ('UNDER_REPAIR', 'READY_FOR_DELIVERY') THEN 'in_progress'
        ELSE 'pending'
    END,
    technicianId,
    createdAt,
    CASE WHEN status IN ('DELIVERED', 'REJECTED') THEN updatedAt ELSE NULL END,
    createdAt
FROM RepairRequest
WHERE deletedAt IS NULL
AND NOT EXISTS (
    SELECT 1 FROM RepairWorkflow WHERE RepairWorkflow.repairRequestId = RepairRequest.id
);

-- تحديث PartsUsed بقيم افتراضية
UPDATE PartsUsed
SET 
    status = COALESCE(status, 'used'),
    requestedAt = COALESCE(requestedAt, createdAt),
    usedAt = COALESCE(usedAt, createdAt)
WHERE status IS NULL;

-- تحديث RepairRequestService بقيم افتراضية
UPDATE RepairRequestService
SET 
    status = COALESCE(status, 'completed'),
    quantity = COALESCE(quantity, 1),
    finalPrice = COALESCE(finalPrice, price)
WHERE status IS NULL;

-- =====================================================
-- PART 4: CREATE TRIGGERS
-- =====================================================

DELIMITER $$

-- -------------------------------------------------
-- Trigger 1: Auto-calculate profit margin في RepairCostBreakdown
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_repair_cost_calc_profit$$

CREATE TRIGGER trg_repair_cost_calc_profit
BEFORE INSERT ON RepairCostBreakdown
FOR EACH ROW
BEGIN
    -- حساب الربح
    SET NEW.profit = NEW.totalPrice - NEW.totalCost;
    
    -- حساب هامش الربح
    IF NEW.totalCost > 0 THEN
        SET NEW.profitMargin = ROUND((NEW.profit / NEW.totalCost) * 100, 2);
    ELSE
        SET NEW.profitMargin = 0;
    END IF;
    
    -- حساب السعر النهائي بعد الخصم
    IF NEW.discountType = 'percentage' THEN
        SET NEW.finalPrice = NEW.totalPrice - (NEW.totalPrice * NEW.discount / 100);
    ELSE
        SET NEW.finalPrice = NEW.totalPrice - NEW.discount;
    END IF;
END$$

-- -------------------------------------------------
-- Trigger 2: Update repair total cost عند إضافة breakdown
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_repair_update_totals$$

CREATE TRIGGER trg_repair_update_totals
AFTER INSERT ON RepairCostBreakdown
FOR EACH ROW
BEGIN
    UPDATE RepairRequest
    SET 
        totalPartsCost = (
            SELECT COALESCE(SUM(totalCost), 0)
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId 
            AND itemType = 'part'
            AND isIncludedInInvoice = TRUE
        ),
        totalServicesCost = (
            SELECT COALESCE(SUM(totalCost), 0)
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId 
            AND itemType = 'service'
            AND isIncludedInInvoice = TRUE
        ),
        totalLaborCost = (
            SELECT COALESCE(SUM(totalCost), 0)
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId 
            AND itemType = 'labor'
            AND isIncludedInInvoice = TRUE
        ),
        actualCost = (
            SELECT COALESCE(SUM(totalCost), 0)
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId
            AND isIncludedInInvoice = TRUE
        ),
        expectedProfit = (
            SELECT COALESCE(SUM(profit), 0) 
            FROM RepairCostBreakdown 
            WHERE repairRequestId = NEW.repairRequestId
            AND isIncludedInInvoice = TRUE
        )
    WHERE id = NEW.repairRequestId;
    
    -- حساب هامش الربح للصيانة
    UPDATE RepairRequest
    SET profitMargin = CASE 
        WHEN actualCost > 0 THEN ROUND((expectedProfit / actualCost) * 100, 2)
        ELSE 0
    END
    WHERE id = NEW.repairRequestId;
END$$

-- -------------------------------------------------
-- Trigger 3: Auto-generate quotation number
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_repair_quotation_number$$

CREATE TRIGGER trg_repair_quotation_number
BEFORE INSERT ON RepairQuotationEnhanced
FOR EACH ROW
BEGIN
    IF NEW.quotationNumber IS NULL OR NEW.quotationNumber = '' THEN
        SET NEW.quotationNumber = CONCAT(
            'QUO-',
            YEAR(NOW()),
            LPAD(MONTH(NOW()), 2, '0'),
            '-',
            LPAD(NEW.repairRequestId, 5, '0'),
            '-V',
            NEW.version
        );
    END IF;
    
    -- تعيين تاريخ انتهاء الصلاحية
    IF NEW.validUntil IS NULL AND NEW.expiresIn IS NOT NULL THEN
        SET NEW.validUntil = DATE_ADD(CURDATE(), INTERVAL NEW.expiresIn DAY);
    END IF;
END$$

-- -------------------------------------------------
-- Trigger 4: Calculate time log duration
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_repair_time_duration$$

CREATE TRIGGER trg_repair_time_duration
BEFORE UPDATE ON RepairTimeLog
FOR EACH ROW
BEGIN
    IF NEW.endTime IS NOT NULL AND OLD.endTime IS NULL THEN
        SET NEW.durationMinutes = TIMESTAMPDIFF(MINUTE, NEW.startTime, NEW.endTime);
        SET NEW.isActive = FALSE;
        
        IF NEW.hourlyRate IS NOT NULL AND NEW.hourlyRate > 0 THEN
            SET NEW.totalCost = ROUND((NEW.durationMinutes / 60.0) * NEW.hourlyRate, 2);
        END IF;
    END IF;
END$$

-- -------------------------------------------------
-- Trigger 5: Auto-calculate QC grade من النقاط
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_repair_qc_grade$$

CREATE TRIGGER trg_repair_qc_grade
BEFORE INSERT ON RepairQualityCheck
FOR EACH ROW
BEGIN
    IF NEW.score IS NOT NULL THEN
        SET NEW.grade = CASE
            WHEN NEW.score >= 90 THEN 'A'
            WHEN NEW.score >= 80 THEN 'B'
            WHEN NEW.score >= 70 THEN 'C'
            WHEN NEW.score >= 60 THEN 'D'
            ELSE 'F'
        END;
        
        SET NEW.overallStatus = CASE
            WHEN NEW.score >= 80 THEN 'passed'
            WHEN NEW.score >= 60 THEN 'conditional'
            ELSE 'failed'
        END;
    END IF;
END$$

-- -------------------------------------------------
-- Trigger 6: Update warranty expiry date تلقائياً
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_repair_warranty_expiry$$

CREATE TRIGGER trg_repair_warranty_expiry
BEFORE UPDATE ON RepairRequest
FOR EACH ROW
BEGIN
    IF NEW.deliveredAt IS NOT NULL AND OLD.deliveredAt IS NULL AND NEW.warrantyMonths > 0 THEN
        SET NEW.warrantyExpiry = DATE_ADD(NEW.deliveredAt, INTERVAL NEW.warrantyMonths MONTH);
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- PART 5: CREATE VIEWS
-- =====================================================

-- -------------------------------------------------
-- View 1: Repair Summary - ملخص شامل للصيانة
-- -------------------------------------------------
CREATE OR REPLACE VIEW v_repair_summary AS
SELECT 
    r.id,
    r.deviceBrand,
    r.deviceModel,
    r.deviceType,
    r.serialNumber,
    r.status,
    r.priority,
    r.urgency,
    r.partsStatus,
    
    -- معلومات العميل
    c.id as customerId,
    c.name as customerName,
    c.phone as customerPhone,
    c.email as customerEmail,
    
    -- معلومات الفني
    u.id as technicianId,
    u.name as technicianName,
    
    -- التكاليف والأرباح
    r.estimatedCost,
    r.actualCost,
    r.totalPartsCost,
    r.totalServicesCost,
    r.totalLaborCost,
    r.expectedProfit,
    r.profitMargin,
    
    -- عدد القطع والخدمات
    (SELECT COUNT(*) FROM PartsUsed pu WHERE pu.repairRequestId = r.id AND pu.status IN ('approved', 'used')) as partsCount,
    (SELECT COUNT(*) FROM RepairRequestService rs WHERE rs.repairRequestId = r.id) as servicesCount,
    
    -- الوقت
    r.estimatedHours,
    r.actualHours,
    r.createdAt,
    r.startedAt,
    r.completedAt,
    r.deliveredAt,
    DATEDIFF(NOW(), r.createdAt) as daysInShop,
    DATEDIFF(r.completedAt, r.startedAt) as repairDays,
    
    -- الجودة
    r.qcStatus,
    r.qcScore,
    
    -- الفاتورة
    r.invoiceId,
    i.status as invoiceStatus,
    i.totalAmount as invoiceAmount
    
FROM RepairRequest r
LEFT JOIN Customer c ON r.customerId = c.id
LEFT JOIN User u ON r.technicianId = u.id
LEFT JOIN Invoice i ON r.invoiceId = i.id
WHERE r.deletedAt IS NULL;

-- -------------------------------------------------
-- View 2: Pending Approvals - الموافقات المعلقة
-- -------------------------------------------------
CREATE OR REPLACE VIEW v_repair_pending_approvals AS
SELECT 
    a.id,
    a.repairRequestId,
    r.deviceBrand,
    r.deviceModel,
    r.priority as repairPriority,
    a.priority as approvalPriority,
    a.status,
    a.totalCost,
    a.requestReason,
    
    -- معلومات الطالب
    req.id as requesterId,
    req.name as requesterName,
    req.email as requesterEmail,
    
    -- معلومات المدة
    a.requestedAt,
    TIMESTAMPDIFF(HOUR, a.requestedAt, NOW()) as hoursWaiting,
    TIMESTAMPDIFF(DAY, a.requestedAt, NOW()) as daysWaiting,
    
    -- معلومات القطعة
    pu.id as partUsedId,
    ii.name as partName,
    pu.quantity as partQuantity,
    
    -- الحالة
    CASE 
        WHEN TIMESTAMPDIFF(HOUR, a.requestedAt, NOW()) > 24 THEN 'overdue'
        WHEN TIMESTAMPDIFF(HOUR, a.requestedAt, NOW()) > 4 THEN 'urgent'
        ELSE 'normal'
    END as urgencyStatus
    
FROM RepairPartsApproval a
JOIN RepairRequest r ON a.repairRequestId = r.id
JOIN User req ON a.requestedBy = req.id
LEFT JOIN PartsUsed pu ON a.partsUsedId = pu.id
LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
WHERE a.status = 'pending'
ORDER BY 
    a.priority DESC, 
    a.requestedAt ASC;

-- -------------------------------------------------
-- View 3: Technician Performance - أداء الفنيين
-- -------------------------------------------------
CREATE OR REPLACE VIEW v_repair_technician_performance AS
SELECT 
    u.id as technicianId,
    u.name as technicianName,
    u.email as technicianEmail,
    
    -- إحصائيات الصيانة
    COUNT(DISTINCT r.id) as totalRepairs,
    SUM(CASE WHEN r.status = 'DELIVERED' THEN 1 ELSE 0 END) as completedRepairs,
    SUM(CASE WHEN r.status IN ('RECEIVED', 'INSPECTION', 'UNDER_REPAIR') THEN 1 ELSE 0 END) as activeRepairs,
    
    -- الوقت
    ROUND(AVG(r.actualHours), 2) as avgActualHours,
    ROUND(AVG(r.estimatedHours), 2) as avgEstimatedHours,
    ROUND(SUM(r.actualHours), 2) as totalHours,
    
    -- المالية
    ROUND(SUM(r.actualCost), 2) as totalRevenue,
    ROUND(SUM(r.expectedProfit), 2) as totalProfit,
    ROUND(AVG(r.profitMargin), 2) as avgProfitMargin,
    
    -- الجودة
    ROUND(AVG(qc.score), 2) as avgQualityScore,
    SUM(CASE WHEN qc.overallStatus = 'passed' THEN 1 ELSE 0 END) as qcPassedCount,
    SUM(CASE WHEN qc.overallStatus = 'failed' THEN 1 ELSE 0 END) as qcFailedCount,
    SUM(CASE WHEN qc.requiresRework = TRUE THEN 1 ELSE 0 END) as reworkCount,
    
    -- التقييمات
    ROUND(AVG(f.overallRating), 2) as avgCustomerRating,
    ROUND(AVG(f.technicianProfessionalism), 2) as avgProfessionalismRating,
    
    -- الكفاءة
    ROUND(AVG(CASE 
        WHEN r.estimatedHours > 0 THEN (r.actualHours / r.estimatedHours) * 100 
        ELSE 100 
    END), 2) as timeEfficiencyPercent,
    
    -- آخر نشاط
    MAX(r.updatedAt) as lastActivity
    
FROM User u
LEFT JOIN RepairRequest r ON u.id = r.technicianId AND r.deletedAt IS NULL
LEFT JOIN RepairQualityCheck qc ON r.id = qc.repairRequestId
LEFT JOIN RepairCustomerFeedback f ON r.id = f.repairRequestId
WHERE u.roleId = 3  -- Technician role
GROUP BY u.id, u.name, u.email;

-- -------------------------------------------------
-- View 4: Parts Usage Summary - ملخص استخدام القطع
-- -------------------------------------------------
CREATE OR REPLACE VIEW v_repair_parts_usage AS
SELECT 
    ii.id as inventoryItemId,
    ii.sku,
    ii.name as partName,
    ii.type as partType,
    
    -- الاستخدام
    COUNT(DISTINCT pu.id) as totalUsageCount,
    SUM(pu.quantity) as totalQuantityUsed,
    COUNT(DISTINCT pu.repairRequestId) as repairsCount,
    COUNT(DISTINCT pu.requestedBy) as techniciansCount,
    
    -- التكاليف والأرباح
    ROUND(SUM(pu.totalCost), 2) as totalCostAmount,
    ROUND(SUM(pu.totalPrice), 2) as totalRevenueAmount,
    ROUND(SUM(pu.profit), 2) as totalProfitAmount,
    ROUND(AVG((pu.profit / NULLIF(pu.totalCost, 0)) * 100), 2) as avgProfitMargin,
    
    -- الحالات
    SUM(CASE WHEN pu.status = 'used' THEN pu.quantity ELSE 0 END) as usedQuantity,
    SUM(CASE WHEN pu.status = 'returned' THEN pu.quantity ELSE 0 END) as returnedQuantity,
    SUM(CASE WHEN pu.status = 'cancelled' THEN pu.quantity ELSE 0 END) as cancelledQuantity,
    
    -- المستودعات
    COUNT(DISTINCT pu.warehouseId) as warehousesUsedFrom,
    
    -- آخر استخدام
    MAX(pu.usedAt) as lastUsedDate,
    
    -- المتوسطات
    ROUND(AVG(pu.quantity), 2) as avgQuantityPerRepair,
    ROUND(AVG(pu.unitSellingPrice), 2) as avgSellingPrice
    
FROM InventoryItem ii
LEFT JOIN PartsUsed pu ON ii.id = pu.inventoryItemId
WHERE pu.status IN ('used', 'returned')
GROUP BY ii.id, ii.sku, ii.name, ii.type
HAVING totalUsageCount > 0
ORDER BY totalQuantityUsed DESC;

-- -------------------------------------------------
-- View 5: Repair Timeline - خط زمني للصيانات
-- -------------------------------------------------
CREATE OR REPLACE VIEW v_repair_timeline AS
SELECT 
    r.id as repairId,
    r.deviceBrand,
    r.deviceModel,
    c.name as customerName,
    
    -- المراحل
    w.stage,
    w.status as stageStatus,
    w.startedAt as stageStarted,
    w.completedAt as stageCompleted,
    w.durationMinutes as stageDuration,
    u.name as responsibleUser,
    w.notes as stageNotes,
    
    -- ترتيب زمني
    w.createdAt,
    RANK() OVER (PARTITION BY r.id ORDER BY w.createdAt) as stageOrder
    
FROM RepairRequest r
JOIN RepairWorkflow w ON r.id = w.repairRequestId
LEFT JOIN Customer c ON r.customerId = c.id
LEFT JOIN User u ON w.userId = u.id
WHERE r.deletedAt IS NULL
ORDER BY r.id DESC, w.createdAt ASC;

-- -------------------------------------------------
-- View 6: Cost Analysis - تحليل التكاليف
-- -------------------------------------------------
CREATE OR REPLACE VIEW v_repair_cost_analysis AS
SELECT 
    r.id as repairId,
    r.deviceBrand,
    r.deviceModel,
    r.status,
    c.name as customerName,
    
    -- التفصيل حسب النوع
    SUM(CASE WHEN cb.itemType = 'part' THEN cb.totalCost ELSE 0 END) as partsCost,
    SUM(CASE WHEN cb.itemType = 'service' THEN cb.totalCost ELSE 0 END) as servicesCost,
    SUM(CASE WHEN cb.itemType = 'labor' THEN cb.totalCost ELSE 0 END) as laborCost,
    SUM(CASE WHEN cb.itemType = 'other' THEN cb.totalCost ELSE 0 END) as otherCost,
    
    -- الإجماليات
    SUM(cb.totalCost) as totalCost,
    SUM(cb.totalPrice) as totalRevenue,
    SUM(cb.profit) as totalProfit,
    SUM(cb.discount) as totalDiscount,
    SUM(cb.finalPrice) as finalAmount,
    
    -- النسب
    ROUND(AVG(cb.profitMargin), 2) as avgProfitMargin,
    ROUND((SUM(cb.profit) / NULLIF(SUM(cb.totalCost), 0)) * 100, 2) as overallProfitMargin,
    
    -- العدد
    COUNT(DISTINCT CASE WHEN cb.itemType = 'part' THEN cb.id END) as partsCount,
    COUNT(DISTINCT CASE WHEN cb.itemType = 'service' THEN cb.id END) as servicesCount
    
FROM RepairRequest r
LEFT JOIN RepairCostBreakdown cb ON r.id = cb.repairRequestId AND cb.isIncludedInInvoice = TRUE
LEFT JOIN Customer c ON r.customerId = c.id
WHERE r.deletedAt IS NULL
GROUP BY r.id, r.deviceBrand, r.deviceModel, r.status, c.name;

-- =====================================================
-- PART 6: CREATE STORED PROCEDURES (Optional)
-- =====================================================

DELIMITER $$

-- -------------------------------------------------
-- Procedure: Calculate Repair Cost
-- -------------------------------------------------
DROP PROCEDURE IF EXISTS sp_calculate_repair_cost$$

CREATE PROCEDURE sp_calculate_repair_cost(IN p_repairId INT)
BEGIN
    DECLARE v_partsCost DECIMAL(12,2);
    DECLARE v_servicesCost DECIMAL(12,2);
    DECLARE v_laborCost DECIMAL(12,2);
    DECLARE v_totalCost DECIMAL(12,2);
    DECLARE v_totalProfit DECIMAL(12,2);
    
    -- حساب تكلفة القطع
    SELECT COALESCE(SUM(totalCost), 0) INTO v_partsCost
    FROM RepairCostBreakdown
    WHERE repairRequestId = p_repairId AND itemType = 'part';
    
    -- حساب تكلفة الخدمات
    SELECT COALESCE(SUM(totalCost), 0) INTO v_servicesCost
    FROM RepairCostBreakdown
    WHERE repairRequestId = p_repairId AND itemType = 'service';
    
    -- حساب تكلفة العمالة
    SELECT COALESCE(SUM(totalCost), 0) INTO v_laborCost
    FROM RepairCostBreakdown
    WHERE repairRequestId = p_repairId AND itemType = 'labor';
    
    -- الإجماليات
    SET v_totalCost = v_partsCost + v_servicesCost + v_laborCost;
    
    SELECT COALESCE(SUM(profit), 0) INTO v_totalProfit
    FROM RepairCostBreakdown
    WHERE repairRequestId = p_repairId;
    
    -- تحديث الصيانة
    UPDATE RepairRequest
    SET 
        totalPartsCost = v_partsCost,
        totalServicesCost = v_servicesCost,
        totalLaborCost = v_laborCost,
        actualCost = v_totalCost,
        expectedProfit = v_totalProfit,
        profitMargin = CASE 
            WHEN v_totalCost > 0 THEN ROUND((v_totalProfit / v_totalCost) * 100, 2)
            ELSE 0
        END
    WHERE id = p_repairId;
    
END$$

DELIMITER ;

-- =====================================================
-- PART 7: INSERT DEFAULT DATA
-- =====================================================

-- إضافة قوالب فحص الجودة الافتراضية
INSERT INTO RepairChecklistTemplate (name, deviceType, description, checklistItems, passingScore, isDefault, createdBy)
VALUES 
(
    'فحص جودة عام',
    NULL,
    'قالب فحص الجودة الافتراضي لجميع أنواع الأجهزة',
    JSON_ARRAY(
        JSON_OBJECT('item', 'فحص الوظائف الأساسية', 'weight', 30),
        JSON_OBJECT('item', 'فحص المظهر الخارجي', 'weight', 15),
        JSON_OBJECT('item', 'جودة القطع المستخدمة', 'weight', 20),
        JSON_OBJECT('item', 'النظافة', 'weight', 10),
        JSON_OBJECT('item', 'التعبئة والتغليف', 'weight', 10),
        JSON_OBJECT('item', 'الأداء العام', 'weight', 15)
    ),
    80,
    TRUE,
    2
),
(
    'فحص جودة الهواتف الذكية',
    'Smartphone',
    'قالب مخصص لفحص الهواتف الذكية',
    JSON_ARRAY(
        JSON_OBJECT('item', 'فحص الشاشة واللمس', 'weight', 25),
        JSON_OBJECT('item', 'فحص الأزرار والمنافذ', 'weight', 15),
        JSON_OBJECT('item', 'فحص الكاميرات', 'weight', 15),
        JSON_OBJECT('item', 'فحص الشبكة والاتصال', 'weight', 15),
        JSON_OBJECT('item', 'فحص البطارية', 'weight', 15),
        JSON_OBJECT('item', 'فحص السماعات', 'weight', 10),
        JSON_OBJECT('item', 'فحص النظافة', 'weight', 5)
    ),
    85,
    FALSE,
    2
);

-- =====================================================
-- PART 8: VERIFICATION QUERIES
-- =====================================================

-- التحقق من الجداول الجديدة
SELECT 
    'RepairWorkflow' as TableName,
    COUNT(*) as RecordCount
FROM RepairWorkflow
UNION ALL
SELECT 'RepairPartsApproval', COUNT(*) FROM RepairPartsApproval
UNION ALL
SELECT 'RepairNotificationLog', COUNT(*) FROM RepairNotificationLog
UNION ALL
SELECT 'RepairCostBreakdown', COUNT(*) FROM RepairCostBreakdown
UNION ALL
SELECT 'RepairDeviceHistory', COUNT(*) FROM RepairDeviceHistory
UNION ALL
SELECT 'RepairQuotationEnhanced', COUNT(*) FROM RepairQuotationEnhanced
UNION ALL
SELECT 'RepairQualityCheck', COUNT(*) FROM RepairQualityCheck
UNION ALL
SELECT 'RepairTimeLog', COUNT(*) FROM RepairTimeLog
UNION ALL
SELECT 'RepairChecklistTemplate', COUNT(*) FROM RepairChecklistTemplate
UNION ALL
SELECT 'RepairCustomerFeedback', COUNT(*) FROM RepairCustomerFeedback;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

SELECT '✅ Migration completed successfully!' as Status,
       'تم تطبيق التحسينات بنجاح على موديول الصيانة' as Message;

-- =====================================================
-- Summary of Changes:
-- =====================================================
-- ✅ تحديث 3 جداول موجودة (55+ حقل جديد)
-- ✅ إنشاء 10 جداول جديدة
-- ✅ إنشاء 6 Triggers
-- ✅ إنشاء 6 Views
-- ✅ إضافة 2 قوالب افتراضية
-- ✅ Data Migration آمن
-- =====================================================

