-- =====================================================
-- Finance Module Enhancements - FixZone ERP
-- إضافات قسم المالية المتقدمة
-- تاريخ الإنشاء: يناير 2025
-- الإصدار: 1.0
-- =====================================================

-- إعداد قاعدة البيانات
USE FZ;

-- تعطيل فحص المفاتيح الأجنبية مؤقتاً
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- الجزء الأول: حذف الجداول الموجودة (إذا كانت موجودة)
-- =====================================================

DROP TABLE IF EXISTS RepairCostAnalysis;
DROP TABLE IF EXISTS PartsCostRecord;
DROP TABLE IF EXISTS LaborCostRecord;
DROP TABLE IF EXISTS FinancialAlert;
DROP TABLE IF EXISTS TaxConfiguration;
DROP TABLE IF EXISTS ChartOfAccounts;
DROP TABLE IF EXISTS JournalEntry;
DROP TABLE IF EXISTS JournalEntryLine;

-- =====================================================
-- الجزء الثاني: إنشاء الجداول الجديدة
-- =====================================================

-- جدول تحليل تكلفة الصيانة
CREATE TABLE RepairCostAnalysis (
  id INT NOT NULL AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  partsCost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة قطع الغيار',
  laborCost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة العمل',
  materialCost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة المواد الاستهلاكية',
  overheadCost DECIMAL(10,2) DEFAULT 0 COMMENT 'التكاليف العامة',
  totalCost DECIMAL(10,2) NOT NULL COMMENT 'إجمالي التكلفة',
  sellingPrice DECIMAL(10,2) NOT NULL COMMENT 'سعر البيع',
  profit DECIMAL(10,2) NOT NULL COMMENT 'الربح',
  profitMargin DECIMAL(5,2) NOT NULL COMMENT 'هامش الربح (%)',
  calculatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الحساب',
  calculatedBy INT COMMENT 'حسب بواسطة',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (calculatedBy) REFERENCES User(id),
  INDEX idx_repair_cost_repair (repairRequestId),
  INDEX idx_repair_cost_date (calculatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='تحليل تكلفة الصيانة';

-- جدول تكلفة قطع الغيار
CREATE TABLE PartsCostRecord (
  id INT NOT NULL AUTO_INCREMENT,
  partsUsedId INT NOT NULL,
  purchaseCost DECIMAL(10,2) NOT NULL COMMENT 'تكلفة الشراء',
  sellingPrice DECIMAL(10,2) NOT NULL COMMENT 'سعر البيع',
  profit DECIMAL(10,2) NOT NULL COMMENT 'الربح',
  profitMargin DECIMAL(5,2) NOT NULL COMMENT 'هامش الربح (%)',
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ التسجيل',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (partsUsedId) REFERENCES PartsUsed(id) ON DELETE CASCADE,
  INDEX idx_parts_cost_parts_used (partsUsedId),
  INDEX idx_parts_cost_date (recordedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='سجل تكلفة قطع الغيار';

-- جدول تكلفة العمل
CREATE TABLE LaborCostRecord (
  id INT NOT NULL AUTO_INCREMENT,
  repairRequestId INT NOT NULL,
  technicianId INT NOT NULL,
  hoursWorked DECIMAL(4,2) NOT NULL COMMENT 'ساعات العمل',
  hourlyRate DECIMAL(10,2) NOT NULL COMMENT 'معدل الساعة',
  totalCost DECIMAL(10,2) NOT NULL COMMENT 'إجمالي التكلفة',
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ التسجيل',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (repairRequestId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
  FOREIGN KEY (technicianId) REFERENCES User(id),
  INDEX idx_labor_cost_repair (repairRequestId),
  INDEX idx_labor_cost_technician (technicianId),
  INDEX idx_labor_cost_date (recordedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='سجل تكلفة العمل';

-- جدول التنبيهات المالية
CREATE TABLE FinancialAlert (
  id INT NOT NULL AUTO_INCREMENT,
  alertType ENUM('overdue_payment', 'low_stock', 'budget_exceeded', 'invoice_overdue', 'high_expense') NOT NULL COMMENT 'نوع التنبيه',
  title VARCHAR(255) NOT NULL COMMENT 'عنوان التنبيه',
  message TEXT NOT NULL COMMENT 'رسالة التنبيه',
  referenceType VARCHAR(50) COMMENT 'نوع المرجع',
  referenceId INT COMMENT 'معرف المرجع',
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'درجة الخطورة',
  isRead BOOLEAN DEFAULT FALSE COMMENT 'تم القراءة',
  isResolved BOOLEAN DEFAULT FALSE COMMENT 'تم الحل',
  createdBy INT COMMENT 'أنشأ بواسطة',
  resolvedBy INT COMMENT 'حل بواسطة',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  FOREIGN KEY (resolvedBy) REFERENCES User(id),
  INDEX idx_financial_alert_type (alertType),
  INDEX idx_financial_alert_severity (severity),
  INDEX idx_financial_alert_read (isRead),
  INDEX idx_financial_alert_resolved (isResolved),
  INDEX idx_financial_alert_date (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='التنبيهات المالية';

-- جدول إعدادات الضرائب
CREATE TABLE TaxConfiguration (
  id INT NOT NULL AUTO_INCREMENT,
  taxName VARCHAR(100) NOT NULL COMMENT 'اسم الضريبة',
  taxRate DECIMAL(5,2) NOT NULL COMMENT 'معدل الضريبة (%)',
  taxType ENUM('vat', 'income', 'withholding', 'other') NOT NULL COMMENT 'نوع الضريبة',
  isActive BOOLEAN DEFAULT TRUE COMMENT 'نشط',
  applicableTo ENUM('all', 'services', 'parts', 'custom') DEFAULT 'all' COMMENT 'ينطبق على',
  customRules JSON COMMENT 'قواعد مخصصة',
  effectiveFrom DATE NOT NULL COMMENT 'ساري من',
  effectiveTo DATE NULL COMMENT 'ساري حتى',
  description TEXT COMMENT 'وصف الضريبة',
  createdBy INT COMMENT 'أنشأ بواسطة',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_tax_config_type (taxType),
  INDEX idx_tax_config_active (isActive),
  INDEX idx_tax_config_effective (effectiveFrom, effectiveTo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='إعدادات الضرائب';

-- جدول دليل الحسابات
CREATE TABLE ChartOfAccounts (
  id INT NOT NULL AUTO_INCREMENT,
  accountCode VARCHAR(20) UNIQUE NOT NULL COMMENT 'رمز الحساب',
  accountName VARCHAR(100) NOT NULL COMMENT 'اسم الحساب',
  accountType ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL COMMENT 'نوع الحساب',
  parentAccountId INT NULL COMMENT 'الحساب الأب',
  isActive BOOLEAN DEFAULT TRUE COMMENT 'نشط',
  description TEXT COMMENT 'وصف الحساب',
  createdBy INT COMMENT 'أنشأ بواسطة',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (parentAccountId) REFERENCES ChartOfAccounts(id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  INDEX idx_chart_accounts_code (accountCode),
  INDEX idx_chart_accounts_type (accountType),
  INDEX idx_chart_accounts_parent (parentAccountId),
  INDEX idx_chart_accounts_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='دليل الحسابات';

-- جدول القيود اليومية
CREATE TABLE JournalEntry (
  id INT NOT NULL AUTO_INCREMENT,
  entryNumber VARCHAR(50) UNIQUE NOT NULL COMMENT 'رقم القيد',
  entryDate DATE NOT NULL COMMENT 'تاريخ القيد',
  description TEXT COMMENT 'وصف القيد',
  totalDebit DECIMAL(15,2) NOT NULL COMMENT 'إجمالي المدين',
  totalCredit DECIMAL(15,2) NOT NULL COMMENT 'إجمالي الدائن',
  status ENUM('draft', 'posted', 'reversed') DEFAULT 'draft' COMMENT 'حالة القيد',
  referenceType VARCHAR(50) COMMENT 'نوع المرجع',
  referenceId INT COMMENT 'معرف المرجع',
  createdBy INT NOT NULL COMMENT 'أنشأ بواسطة',
  postedBy INT COMMENT 'ترحيل بواسطة',
  postedAt TIMESTAMP NULL COMMENT 'تاريخ الترحيل',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (createdBy) REFERENCES User(id),
  FOREIGN KEY (postedBy) REFERENCES User(id),
  INDEX idx_journal_entry_number (entryNumber),
  INDEX idx_journal_entry_date (entryDate),
  INDEX idx_journal_entry_status (status),
  INDEX idx_journal_entry_reference (referenceType, referenceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='القيود اليومية';

-- جدول تفاصيل القيود
CREATE TABLE JournalEntryLine (
  id INT NOT NULL AUTO_INCREMENT,
  journalEntryId INT NOT NULL,
  accountId INT NOT NULL,
  debitAmount DECIMAL(15,2) DEFAULT 0 COMMENT 'مبلغ المدين',
  creditAmount DECIMAL(15,2) DEFAULT 0 COMMENT 'مبلغ الدائن',
  description TEXT COMMENT 'وصف البند',
  referenceType VARCHAR(50) COMMENT 'نوع المرجع',
  referenceId INT COMMENT 'معرف المرجع',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id) ON DELETE CASCADE,
  FOREIGN KEY (accountId) REFERENCES ChartOfAccounts(id),
  INDEX idx_journal_line_entry (journalEntryId),
  INDEX idx_journal_line_account (accountId),
  INDEX idx_journal_line_reference (referenceType, referenceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='تفاصيل القيود اليومية';

-- =====================================================
-- الجزء الثالث: إضافة الحقول الجديدة للجداول الموجودة
-- =====================================================

-- إضافة حقول جديدة لجدول Invoice
ALTER TABLE Invoice 
ADD COLUMN costAnalysisId INT NULL COMMENT 'معرف تحليل التكلفة',
ADD COLUMN profit DECIMAL(10,2) DEFAULT 0 COMMENT 'الربح',
ADD COLUMN profitMargin DECIMAL(5,2) DEFAULT 0 COMMENT 'هامش الربح (%)',
ADD COLUMN taxConfigurationId INT NULL COMMENT 'معرف إعدادات الضريبة',
ADD INDEX idx_invoice_cost_analysis (costAnalysisId),
ADD INDEX idx_invoice_tax_config (taxConfigurationId);

-- إضافة حقول جديدة لجدول Payment
ALTER TABLE Payment 
ADD COLUMN customerId INT NULL COMMENT 'معرف العميل',
ADD COLUMN referenceType VARCHAR(50) DEFAULT 'invoice' COMMENT 'نوع المرجع',
ADD COLUMN referenceId INT NULL COMMENT 'معرف المرجع',
ADD COLUMN journalEntryId INT NULL COMMENT 'معرف القيد المحاسبي',
ADD INDEX idx_payment_customer (customerId),
ADD INDEX idx_payment_reference (referenceType, referenceId),
ADD INDEX idx_payment_journal (journalEntryId);

-- إضافة حقول جديدة لجدول Expense
ALTER TABLE Expense 
ADD COLUMN vendorId INT NULL COMMENT 'معرف المورد',
ADD COLUMN journalEntryId INT NULL COMMENT 'معرف القيد المحاسبي',
ADD COLUMN approvalStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'حالة الموافقة',
ADD COLUMN approvedBy INT NULL COMMENT 'وافق بواسطة',
ADD COLUMN approvedAt TIMESTAMP NULL COMMENT 'تاريخ الموافقة',
ADD INDEX idx_expense_vendor (vendorId),
ADD INDEX idx_expense_journal (journalEntryId),
ADD INDEX idx_expense_approval (approvalStatus),
ADD FOREIGN KEY (vendorId) REFERENCES Vendor(id),
ADD FOREIGN KEY (approvedBy) REFERENCES User(id);

-- =====================================================
-- الجزء الرابع: إدراج البيانات الأساسية
-- =====================================================

-- إدراج إعدادات الضرائب الأساسية
INSERT INTO TaxConfiguration (taxName, taxRate, taxType, applicableTo, effectiveFrom, description) VALUES
('ضريبة القيمة المضافة', 14.00, 'vat', 'all', '2025-01-01', 'ضريبة القيمة المضافة بنسبة 14%'),
('ضريبة الدخل', 10.00, 'income', 'all', '2025-01-01', 'ضريبة الدخل بنسبة 10%'),
('ضريبة الخصم', 2.00, 'withholding', 'services', '2025-01-01', 'ضريبة الخصم على الخدمات');

-- إدراج الحسابات الأساسية في دليل الحسابات
INSERT INTO ChartOfAccounts (accountCode, accountName, accountType, description) VALUES
-- الأصول
('1000', 'الأصول المتداولة', 'asset', 'الأصول المتداولة'),
('1100', 'النقدية', 'asset', 'النقدية في الصندوق'),
('1200', 'البنك', 'asset', 'الحساب الجاري في البنك'),
('1300', 'العملاء', 'asset', 'حساب العملاء'),
('1400', 'المخزون', 'asset', 'مخزون قطع الغيار'),

-- الخصوم
('2000', 'الخصوم المتداولة', 'liability', 'الخصوم المتداولة'),
('2100', 'الموردين', 'liability', 'حساب الموردين'),
('2200', 'الضرائب المستحقة', 'liability', 'الضرائب المستحقة للدولة'),

-- حقوق الملكية
('3000', 'حقوق الملكية', 'equity', 'حقوق الملكية'),
('3100', 'رأس المال', 'equity', 'رأس المال الأساسي'),
('3200', 'الأرباح المحتجزة', 'equity', 'الأرباح المحتجزة'),

-- الإيرادات
('4000', 'الإيرادات', 'revenue', 'إيرادات الشركة'),
('4100', 'إيرادات الصيانة', 'revenue', 'إيرادات خدمات الصيانة'),
('4200', 'إيرادات قطع الغيار', 'revenue', 'إيرادات بيع قطع الغيار'),

-- المصروفات
('5000', 'المصروفات', 'expense', 'مصروفات الشركة'),
('5100', 'تكلفة قطع الغيار', 'expense', 'تكلفة قطع الغيار المباعة'),
('5200', 'تكلفة العمل', 'expense', 'تكلفة أجور الفنيين'),
('5300', 'المصروفات الإدارية', 'expense', 'المصروفات الإدارية'),
('5400', 'المصروفات التشغيلية', 'expense', 'المصروفات التشغيلية');

-- =====================================================
-- الجزء الخامس: إنشاء الفهارس والأداء
-- =====================================================

-- فهارس إضافية للأداء
CREATE INDEX idx_repair_cost_profit ON RepairCostAnalysis(profit DESC);
CREATE INDEX idx_parts_cost_profit ON PartsCostRecord(profit DESC);
CREATE INDEX idx_labor_cost_total ON LaborCostRecord(totalCost DESC);
CREATE INDEX idx_financial_alert_critical ON FinancialAlert(severity, isResolved) WHERE severity = 'critical';
CREATE INDEX idx_tax_config_current ON TaxConfiguration(isActive, effectiveFrom, effectiveTo) WHERE isActive = TRUE;
CREATE INDEX idx_journal_entry_posted ON JournalEntry(status, postedAt) WHERE status = 'posted';

-- =====================================================
-- الجزء السادس: إعادة تفعيل فحص المفاتيح الأجنبية
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- الجزء السابع: إنشاء Views للتقارير
-- =====================================================

-- View لتقرير الأرباح والخسائر
CREATE VIEW ProfitLossReport AS
SELECT 
    DATE_FORMAT(i.issueDate, '%Y-%m') as month,
    SUM(CASE WHEN coa.accountType = 'revenue' THEN i.finalAmount ELSE 0 END) as totalRevenue,
    SUM(CASE WHEN coa.accountType = 'expense' THEN e.amount ELSE 0 END) as totalExpenses,
    SUM(CASE WHEN coa.accountType = 'revenue' THEN i.finalAmount ELSE 0 END) - 
    SUM(CASE WHEN coa.accountType = 'expense' THEN e.amount ELSE 0 END) as netProfit
FROM Invoice i
LEFT JOIN Expense e ON DATE_FORMAT(e.expenseDate, '%Y-%m') = DATE_FORMAT(i.issueDate, '%Y-%m')
LEFT JOIN ChartOfAccounts coa ON 1=1
WHERE i.status = 'paid' AND i.deletedAt IS NULL
GROUP BY DATE_FORMAT(i.issueDate, '%Y-%m')
ORDER BY month DESC;

-- View لتقرير التدفق النقدي
CREATE VIEW CashFlowReport AS
SELECT 
    DATE_FORMAT(p.paymentDate, '%Y-%m') as month,
    SUM(p.amount) as cashInflow,
    0 as cashOutflow,
    SUM(p.amount) as netCashFlow
FROM Payment p
LEFT JOIN Invoice i ON p.invoiceId = i.id
WHERE i.deletedAt IS NULL
GROUP BY DATE_FORMAT(p.paymentDate, '%Y-%m')
ORDER BY month DESC;

-- View لتحليل ربحية الصيانة
CREATE VIEW RepairProfitabilityReport AS
SELECT 
    rca.repairRequestId,
    rr.deviceType,
    rca.totalCost,
    rca.sellingPrice,
    rca.profit,
    rca.profitMargin,
    rca.calculatedAt
FROM RepairCostAnalysis rca
LEFT JOIN RepairRequest rr ON rca.repairRequestId = rr.id
ORDER BY rca.profitMargin DESC;

-- =====================================================
-- الجزء الثامن: إنشاء Stored Procedures
-- =====================================================

DELIMITER //

-- Procedure لحساب تكلفة الصيانة
CREATE PROCEDURE CalculateRepairCost(IN repairId INT)
BEGIN
    DECLARE partsCost DECIMAL(10,2) DEFAULT 0;
    DECLARE laborCost DECIMAL(10,2) DEFAULT 0;
    DECLARE materialCost DECIMAL(10,2) DEFAULT 0;
    DECLARE overheadCost DECIMAL(10,2) DEFAULT 0;
    DECLARE totalCost DECIMAL(10,2) DEFAULT 0;
    DECLARE sellingPrice DECIMAL(10,2) DEFAULT 0;
    DECLARE profit DECIMAL(10,2) DEFAULT 0;
    DECLARE profitMargin DECIMAL(5,2) DEFAULT 0;
    
    -- حساب تكلفة قطع الغيار
    SELECT COALESCE(SUM(ii.totalPrice), 0) INTO partsCost
    FROM InvoiceItem ii
    JOIN Invoice i ON ii.invoiceId = i.id
    WHERE i.repairRequestId = repairId AND ii.itemType = 'part';
    
    -- حساب تكلفة العمل
    SELECT COALESCE(SUM(lcr.totalCost), 0) INTO laborCost
    FROM LaborCostRecord lcr
    WHERE lcr.repairRequestId = repairId;
    
    -- حساب تكلفة المواد الاستهلاكية
    SELECT COALESCE(SUM(ii.totalPrice), 0) INTO materialCost
    FROM InvoiceItem ii
    JOIN Invoice i ON ii.invoiceId = i.id
    WHERE i.repairRequestId = repairId AND ii.itemType = 'other';
    
    -- حساب التكلفة الإجمالية
    SET totalCost = partsCost + laborCost + materialCost + overheadCost;
    
    -- الحصول على سعر البيع
    SELECT COALESCE(SUM(i.finalAmount), 0) INTO sellingPrice
    FROM Invoice i
    WHERE i.repairRequestId = repairId;
    
    -- حساب الربح وهامش الربح
    SET profit = sellingPrice - totalCost;
    SET profitMargin = CASE WHEN sellingPrice > 0 THEN (profit / sellingPrice) * 100 ELSE 0 END;
    
    -- إدراج أو تحديث تحليل التكلفة
    INSERT INTO RepairCostAnalysis (
        repairRequestId, partsCost, laborCost, materialCost, overheadCost,
        totalCost, sellingPrice, profit, profitMargin
    ) VALUES (
        repairId, partsCost, laborCost, materialCost, overheadCost,
        totalCost, sellingPrice, profit, profitMargin
    ) ON DUPLICATE KEY UPDATE
        partsCost = VALUES(partsCost),
        laborCost = VALUES(laborCost),
        materialCost = VALUES(materialCost),
        overheadCost = VALUES(overheadCost),
        totalCost = VALUES(totalCost),
        sellingPrice = VALUES(sellingPrice),
        profit = VALUES(profit),
        profitMargin = VALUES(profitMargin),
        calculatedAt = CURRENT_TIMESTAMP;
        
END //

-- Procedure لإرسال تنبيهات المدفوعات المتأخرة
CREATE PROCEDURE SendOverduePaymentAlerts()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE invoiceId INT;
    DECLARE customerId INT;
    DECLARE invoiceNumber VARCHAR(50);
    DECLARE dueDate DATE;
    DECLARE overdueAmount DECIMAL(10,2);
    DECLARE daysOverdue INT;
    
    DECLARE overdue_cursor CURSOR FOR
        SELECT i.id, i.customerId, i.invoiceNumber, i.dueDate, 
               (i.finalAmount - COALESCE(SUM(p.amount), 0)) as overdueAmount,
               DATEDIFF(CURDATE(), i.dueDate) as daysOverdue
        FROM Invoice i
        LEFT JOIN Payment p ON i.id = p.invoiceId
        WHERE i.dueDate < CURDATE() 
        AND i.status IN ('sent', 'partially_paid')
        AND (i.finalAmount - COALESCE(SUM(p.amount), 0)) > 0
        GROUP BY i.id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN overdue_cursor;
    
    read_loop: LOOP
        FETCH overdue_cursor INTO invoiceId, customerId, invoiceNumber, dueDate, overdueAmount, daysOverdue;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- إدراج تنبيه
        INSERT INTO FinancialAlert (
            alertType, title, message, referenceType, referenceId, severity
        ) VALUES (
            'overdue_payment',
            CONCAT('فاتورة متأخرة: ', invoiceNumber),
            CONCAT('فاتورة رقم ', invoiceNumber, ' متأخرة عن السداد بـ ', daysOverdue, ' يوم. المبلغ المتأخر: ', overdueAmount, ' جنيه'),
            'invoice',
            invoiceId,
            CASE 
                WHEN daysOverdue <= 7 THEN 'medium'
                WHEN daysOverdue <= 30 THEN 'high'
                ELSE 'critical'
            END
        );
        
    END LOOP;
    
    CLOSE overdue_cursor;
END //

DELIMITER ;

-- =====================================================
-- الجزء التاسع: إنشاء Triggers
-- =====================================================

-- Trigger لتحديث تحليل التكلفة عند إنشاء فاتورة جديدة
DELIMITER //
CREATE TRIGGER tr_invoice_cost_analysis
AFTER INSERT ON Invoice
FOR EACH ROW
BEGIN
    IF NEW.repairRequestId IS NOT NULL THEN
        CALL CalculateRepairCost(NEW.repairRequestId);
    END IF;
END //

-- Trigger لتحديث تحليل التكلفة عند تحديث فاتورة
CREATE TRIGGER tr_invoice_cost_analysis_update
AFTER UPDATE ON Invoice
FOR EACH ROW
BEGIN
    IF NEW.repairRequestId IS NOT NULL THEN
        CALL CalculateRepairCost(NEW.repairRequestId);
    END IF;
END //

DELIMITER ;

-- =====================================================
-- الجزء العاشر: إنشاء Events للمهام المجدولة
-- =====================================================

-- Event لإرسال تنبيهات المدفوعات المتأخرة يومياً
CREATE EVENT IF NOT EXISTS daily_overdue_payment_alerts
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL SendOverduePaymentAlerts();

-- تفعيل Event Scheduler
SET GLOBAL event_scheduler = ON;

-- =====================================================
-- انتهاء الملف
-- =====================================================

-- عرض ملخص التحديثات
SELECT 'Finance Module Enhancements Applied Successfully!' as Status,
       NOW() as AppliedAt,
       'New tables, indexes, views, and procedures created' as Details;
