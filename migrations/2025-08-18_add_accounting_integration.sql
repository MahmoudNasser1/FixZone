-- إضافة التكامل المحاسبي للفواتير والمدفوعات والمصروفات
-- Add accounting integration to invoices, payments, and expenses

USE FZ;

-- إضافة عمود journalEntryId للفواتير
ALTER TABLE Invoice 
ADD COLUMN IF NOT EXISTS journalEntryId INT NULL;

-- إضافة قيد المفتاح الخارجي للفواتير (إن لم يكن موجوداً)
SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Invoice' AND CONSTRAINT_NAME = 'fk_invoice_journal_entry'
);
SET @sql := IF(@c = 0,
  'ALTER TABLE Invoice ADD CONSTRAINT fk_invoice_journal_entry FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- إضافة عمود journalEntryId للمدفوعات
ALTER TABLE Payment 
ADD COLUMN IF NOT EXISTS journalEntryId INT NULL;

-- إضافة قيد المفتاح الخارجي للمدفوعات (إن لم يكن موجوداً)
SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Payment' AND CONSTRAINT_NAME = 'fk_payment_journal_entry'
);
SET @sql := IF(@c = 0,
  'ALTER TABLE Payment ADD CONSTRAINT fk_payment_journal_entry FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- إضافة أعمدة مطلوبة للمدفوعات
ALTER TABLE Payment 
ADD COLUMN IF NOT EXISTS customerId INT NULL,
ADD COLUMN IF NOT EXISTS paymentDate DATE NULL,
ADD COLUMN IF NOT EXISTS referenceNumber VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS notes TEXT NULL,
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL;

-- إضافة مفاتيح خارجية للمدفوعات
SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Payment' AND CONSTRAINT_NAME = 'fk_payment_customer'
);
SET @sql := IF(@c = 0,
  'ALTER TABLE Payment ADD CONSTRAINT fk_payment_customer FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- تحديث جدول المصروفات لإضافة التكامل المحاسبي
ALTER TABLE Expense 
ADD COLUMN IF NOT EXISTS journalEntryId INT NULL,
ADD COLUMN IF NOT EXISTS category ENUM('office_supplies', 'utilities', 'maintenance', 'marketing', 'travel', 'rent', 'salaries', 'other') DEFAULT 'other',
ADD COLUMN IF NOT EXISTS vendorId INT NULL,
ADD COLUMN IF NOT EXISTS costCenterId INT NULL,
ADD COLUMN IF NOT EXISTS paymentMethod ENUM('cash', 'bank_transfer', 'credit_card', 'check') DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS referenceNumber VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS notes TEXT NULL,
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved';

-- إضافة مفاتيح خارجية للمصروفات
SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND CONSTRAINT_NAME = 'fk_expense_journal_entry'
);
SET @sql := IF(@c = 0,
  'ALTER TABLE Expense ADD CONSTRAINT fk_expense_journal_entry FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND CONSTRAINT_NAME = 'fk_expense_vendor'
);
SET @sql := IF(@c = 0,
  'ALTER TABLE Expense ADD CONSTRAINT fk_expense_vendor FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND CONSTRAINT_NAME = 'fk_expense_cost_center'
);
SET @sql := IF(@c = 0,
  'ALTER TABLE Expense ADD CONSTRAINT fk_expense_cost_center FOREIGN KEY (costCenterId) REFERENCES CostCenter(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- إنشاء فهارس لتحسين الأداء
-- Invoice idx_invoice_journal_entry
SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Invoice' AND index_name = 'idx_invoice_journal_entry'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_invoice_journal_entry ON Invoice(journalEntryId)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Payment indexes
SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Payment' AND index_name = 'idx_payment_journal_entry'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_payment_journal_entry ON Payment(journalEntryId)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Payment' AND index_name = 'idx_payment_customer'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_payment_customer ON Payment(customerId)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Payment' AND index_name = 'idx_payment_date'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_payment_date ON Payment(paymentDate)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Expense indexes
SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Expense' AND index_name = 'idx_expense_journal_entry'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_expense_journal_entry ON Expense(journalEntryId)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Expense' AND index_name = 'idx_expense_vendor'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_expense_vendor ON Expense(vendorId)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Expense' AND index_name = 'idx_expense_cost_center'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_expense_cost_center ON Expense(costCenterId)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Expense' AND index_name = 'idx_expense_category'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_expense_category ON Expense(category)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Expense' AND index_name = 'idx_expense_date'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_expense_date ON Expense(expenseDate)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- إضافة Views للتقارير المالية المتكاملة
CREATE OR REPLACE VIEW AccountingTransactions AS
SELECT 
    'invoice' as transaction_type,
    i.id as transaction_id,
    i.createdAt as transaction_date,
    i.totalAmount as amount,
    c.name as party_name,
    CONCAT('Invoice #', i.id) as description,
    je.entryNumber as journal_entry,
    je.status as accounting_status
FROM Invoice i
LEFT JOIN RepairRequest rr ON rr.id = i.repairRequestId
LEFT JOIN Customer c ON rr.customerId = c.id
LEFT JOIN JournalEntry je ON i.journalEntryId = je.id
WHERE i.deletedAt IS NULL

UNION ALL

SELECT 
    'payment' as transaction_type,
    p.id as transaction_id,
    p.paymentDate as transaction_date,
    p.amount as amount,
    COALESCE(c.name, c2.name) as party_name,
    p.notes as description,
    je.entryNumber as journal_entry,
    je.status as accounting_status
FROM Payment p
LEFT JOIN Customer c ON p.customerId = c.id
LEFT JOIN Invoice ii ON p.invoiceId = ii.id
LEFT JOIN RepairRequest rr2 ON ii.repairRequestId = rr2.id
LEFT JOIN Customer c2 ON rr2.customerId = c2.id
LEFT JOIN JournalEntry je ON p.journalEntryId = je.id
WHERE p.deletedAt IS NULL

UNION ALL

SELECT 
    'expense' as transaction_type,
    e.id as transaction_id,
    e.expenseDate as transaction_date,
    e.amount as amount,
    COALESCE(v.name, 'مصروف عام') as party_name,
    e.description as description,
    je.entryNumber as journal_entry,
    je.status as accounting_status
FROM Expense e
LEFT JOIN Vendor v ON e.vendorId = v.id
LEFT JOIN JournalEntry je ON e.journalEntryId = je.id
WHERE e.deletedAt IS NULL;

-- إضافة View للتدفقات النقدية
CREATE OR REPLACE VIEW CashFlowSummary AS
SELECT 
    DATE(transaction_date) as flow_date,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as cash_inflow,
    SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as cash_outflow,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE -amount END) as net_flow
FROM AccountingTransactions
WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(transaction_date)
ORDER BY flow_date DESC;

-- إضافة View لملخص الحسابات
CREATE OR REPLACE VIEW AccountBalanceSummary AS
SELECT 
    a.id,
    a.code AS accountNumber,
    a.name AS accountName,
    ac.name AS categoryName,
    a.accountType,
    COALESCE(SUM(jel.debitAmount), 0) as total_debits,
    COALESCE(SUM(jel.creditAmount), 0) as total_credits,
    CASE 
        WHEN a.accountType IN ('asset', 'expense') THEN 
            COALESCE(SUM(jel.debitAmount), 0) - COALESCE(SUM(jel.creditAmount), 0)
        ELSE 
            COALESCE(SUM(jel.creditAmount), 0) - COALESCE(SUM(jel.debitAmount), 0)
    END as balance
FROM Account a
LEFT JOIN AccountCategory ac ON a.categoryId = ac.id
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.deletedAt IS NULL
GROUP BY a.id, a.code, a.name, ac.name, a.accountType
ORDER BY a.code;

-- إضافة إجراء مخزن لترحيل القيود المحاسبية
DELIMITER //

DROP PROCEDURE IF EXISTS PostJournalEntry //
CREATE PROCEDURE PostJournalEntry(IN entryId INT)
BEGIN
    DECLARE entry_total_debit DECIMAL(15,2);
    DECLARE entry_total_credit DECIMAL(15,2);
    DECLARE entry_status VARCHAR(20);
    
    -- التحقق من حالة القيد
    SELECT status INTO entry_status FROM JournalEntry WHERE id = entryId;
    
    IF entry_status = 'posted' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Journal entry is already posted';
    END IF;
    
    -- حساب مجموع المدين والدائن
    SELECT 
        COALESCE(SUM(debitAmount), 0),
        COALESCE(SUM(creditAmount), 0)
    INTO entry_total_debit, entry_total_credit
    FROM JournalEntryLine 
    WHERE journalEntryId = entryId;
    
    -- التحقق من توازن القيد
    IF entry_total_debit != entry_total_credit THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Journal entry is not balanced';
    END IF;
    
    -- ترحيل القيد
    UPDATE JournalEntry 
    SET status = 'posted', postedAt = NOW() 
    WHERE id = entryId;
    
END //

DELIMITER ;

-- إضافة إجراء مخزن لإلغاء ترحيل القيود
DELIMITER //

DROP PROCEDURE IF EXISTS UnpostJournalEntry //
CREATE PROCEDURE UnpostJournalEntry(IN entryId INT)
BEGIN
    DECLARE entry_status VARCHAR(20);
    
    -- التحقق من حالة القيد
    SELECT status INTO entry_status FROM JournalEntry WHERE id = entryId;
    
    IF entry_status != 'posted' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Journal entry is not posted';
    END IF;
    
    -- إلغاء ترحيل القيد
    UPDATE JournalEntry 
    SET status = 'draft', postedAt = NULL 
    WHERE id = entryId;
    
END //

DELIMITER ;

-- إضافة triggers للتحقق من صحة البيانات
DELIMITER //

DROP TRIGGER IF EXISTS check_journal_entry_balance //
CREATE TRIGGER check_journal_entry_balance 
BEFORE UPDATE ON JournalEntry
FOR EACH ROW
BEGIN
    DECLARE entry_total_debit DECIMAL(15,2);
    DECLARE entry_total_credit DECIMAL(15,2);
    
    IF NEW.status = 'posted' AND OLD.status != 'posted' THEN
        SELECT 
            COALESCE(SUM(debitAmount), 0),
            COALESCE(SUM(creditAmount), 0)
        INTO entry_total_debit, entry_total_credit
        FROM JournalEntryLine 
        WHERE journalEntryId = NEW.id;
        
        IF entry_total_debit != entry_total_credit THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot post unbalanced journal entry';
        END IF;
        
        SET NEW.totalDebit = entry_total_debit;
        SET NEW.totalCredit = entry_total_credit;
    END IF;
END //

DELIMITER ;

-- إضافة بيانات تجريبية للاختبار
INSERT INTO Payment (customerId, invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes, currency, status, createdAt, updatedAt) VALUES
(1, 1, 1500.00, 'cash', '2025-08-18', 'PAY-001', 'دفعة نقدية من العميل', 'EGP', 'completed', NOW(), NOW()),
(2, NULL, 2300.00, 'bank_transfer', '2025-08-17', 'PAY-002', 'تحويل بنكي (بدون ربط بفاتورة)', 'EGP', 'completed', NOW(), NOW()),
(3, NULL, 800.00, 'cash', '2025-08-16', 'PAY-003', 'دفعة مقدمة', 'EGP', 'completed', NOW(), NOW());

INSERT INTO Expense (description, amount, category, expenseDate, paymentMethod, referenceNumber, notes, currency, status, createdAt, updatedAt) VALUES
('أدوات مكتبية', 250.00, 'office_supplies', '2025-08-18', 'cash', 'EXP-001', 'شراء أدوات مكتبية', 'EGP', 'approved', NOW(), NOW()),
('فاتورة كهرباء', 800.00, 'utilities', '2025-08-17', 'bank_transfer', 'EXP-002', 'فاتورة كهرباء شهر أغسطس', 'EGP', 'approved', NOW(), NOW()),
('صيانة أجهزة', 1200.00, 'maintenance', '2025-08-16', 'cash', 'EXP-003', 'صيانة دورية للأجهزة', 'EGP', 'approved', NOW(), NOW());

COMMIT;
