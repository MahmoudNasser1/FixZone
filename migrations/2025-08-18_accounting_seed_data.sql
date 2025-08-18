-- =====================================================
-- بيانات تجريبية للنظام المحاسبي - Fix Zone ERP
-- تاريخ الإنشاء: 2025-08-18
-- =====================================================

USE FZ;

-- إدراج فئات الحسابات (ملاحظة: لا يوجد عمود accountType في AccountCategory)
INSERT IGNORE INTO AccountCategory (code, name, nameEn, description) VALUES
('1000', 'الأصول المتداولة', 'Current Assets', 'الأصول التي يمكن تحويلها إلى نقد خلال سنة'),
('1100', 'الأصول الثابتة', 'Fixed Assets', 'الأصول طويلة الأجل'),
('1200', 'الأصول غير الملموسة', 'Intangible Assets', 'الأصول غير المادية'),
('2000', 'الخصوم المتداولة', 'Current Liabilities', 'الالتزامات قصيرة الأجل'),
('2100', 'الخصوم طويلة الأجل', 'Long-term Liabilities', 'الالتزامات طويلة الأجل'),
('3000', 'رأس المال', 'Capital', 'حقوق الملكية'),
('4000', 'الإيرادات التشغيلية', 'Operating Revenue', 'إيرادات النشاط الأساسي'),
('4100', 'الإيرادات الأخرى', 'Other Revenue', 'الإيرادات غير التشغيلية'),
('5000', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'التكاليف المباشرة للخدمات'),
('6000', 'المصروفات التشغيلية', 'Operating Expenses', 'مصروفات النشاط الأساسي'),
('6100', 'المصروفات الإدارية', 'Administrative Expenses', 'المصروفات الإدارية والعمومية'),
('6200', 'المصروفات المالية', 'Financial Expenses', 'الفوائد والرسوم المصرفية');

-- إدراج الحسابات الرئيسية
INSERT IGNORE INTO Account (code, name, nameEn, categoryId, accountType, normalBalance, isActive, description) VALUES
-- الأصول المتداولة
('1001', 'النقدية بالصندوق', 'Cash on Hand', 1, 'asset', 'debit', TRUE, 'النقدية المتوفرة في الصندوق'),
('1002', 'البنك - الحساب الجاري', 'Bank - Current Account', 1, 'asset', 'debit', TRUE, 'الحساب الجاري بالبنك'),
('1003', 'العملاء', 'Accounts Receivable', 1, 'asset', 'debit', TRUE, 'المبالغ المستحقة من العملاء'),
('1004', 'أوراق القبض', 'Notes Receivable', 1, 'asset', 'debit', TRUE, 'الكمبيالات والشيكات المستحقة'),
('1005', 'المخزون - قطع الغيار', 'Inventory - Spare Parts', 1, 'asset', 'debit', TRUE, 'مخزون قطع الغيار'),
('1006', 'المخزون - مواد التشغيل', 'Inventory - Operating Materials', 1, 'asset', 'debit', TRUE, 'مواد التشغيل والصيانة'),
('1007', 'المصروفات المدفوعة مقدماً', 'Prepaid Expenses', 1, 'asset', 'debit', TRUE, 'المصروفات المدفوعة مسبقاً'),
('1008', 'العهد والسلف', 'Advances and Loans', 1, 'asset', 'debit', TRUE, 'السلف المدفوعة للموظفين'),

-- الأصول الثابتة
('1101', 'الأراضي', 'Land', 2, 'asset', 'debit', TRUE, 'قيمة الأراضي المملوكة'),
('1102', 'المباني', 'Buildings', 2, 'asset', 'debit', TRUE, 'قيمة المباني والمنشآت'),
('1103', 'الآلات والمعدات', 'Machinery and Equipment', 2, 'asset', 'debit', TRUE, 'معدات الصيانة والإصلاح'),
('1104', 'الأثاث والتجهيزات', 'Furniture and Fixtures', 2, 'asset', 'debit', TRUE, 'أثاث المكاتب والتجهيزات'),
('1105', 'أجهزة الكمبيوتر', 'Computer Equipment', 2, 'asset', 'debit', TRUE, 'أجهزة الكمبيوتر والبرمجيات'),
('1106', 'وسائل النقل', 'Vehicles', 2, 'asset', 'debit', TRUE, 'السيارات ووسائل النقل'),
('1107', 'مجمع إهلاك المباني', 'Accumulated Depreciation - Buildings', 2, 'asset', 'credit', TRUE, 'مجمع إهلاك المباني'),
('1108', 'مجمع إهلاك الآلات', 'Accumulated Depreciation - Machinery', 2, 'asset', 'credit', TRUE, 'مجمع إهلاك الآلات'),

-- الخصوم المتداولة
('2001', 'الموردون', 'Accounts Payable', 3, 'liability', 'credit', TRUE, 'المبالغ المستحقة للموردين'),
('2002', 'أوراق الدفع', 'Notes Payable', 3, 'liability', 'credit', TRUE, 'الكمبيالات والشيكات المستحقة الدفع'),
('2003', 'مرتبات مستحقة الدفع', 'Accrued Salaries', 3, 'liability', 'credit', TRUE, 'المرتبات المستحقة للموظفين'),
('2004', 'ضرائب مستحقة الدفع', 'Accrued Taxes', 3, 'liability', 'credit', TRUE, 'الضرائب المستحقة'),
('2005', 'تأمينات اجتماعية مستحقة', 'Accrued Social Insurance', 3, 'liability', 'credit', TRUE, 'التأمينات الاجتماعية المستحقة'),
('2006', 'إيرادات مقبوضة مقدماً', 'Unearned Revenue', 3, 'liability', 'credit', TRUE, 'الإيرادات المحصلة مسبقاً'),
('2007', 'قروض قصيرة الأجل', 'Short-term Loans', 3, 'liability', 'credit', TRUE, 'القروض قصيرة الأجل'),

-- رأس المال
('3001', 'رأس المال المدفوع', 'Paid-in Capital', 6, 'equity', 'credit', TRUE, 'رأس المال المدفوع من المالكين'),
('3002', 'الاحتياطي القانوني', 'Legal Reserve', 6, 'equity', 'credit', TRUE, 'الاحتياطي القانوني المطلوب'),
('3003', 'الاحتياطي العام', 'General Reserve', 6, 'equity', 'credit', TRUE, 'الاحتياطيات العامة'),
('3004', 'الأرباح المحتجزة', 'Retained Earnings', 6, 'equity', 'credit', TRUE, 'الأرباح المحتجزة من السنوات السابقة'),
('3005', 'أرباح العام الجاري', 'Current Year Earnings', 6, 'equity', 'credit', TRUE, 'أرباح السنة المالية الجارية'),

-- الإيرادات
('4001', 'إيرادات خدمات الصيانة', 'Maintenance Service Revenue', 7, 'revenue', 'credit', TRUE, 'إيرادات خدمات الصيانة والإصلاح'),
('4002', 'إيرادات بيع قطع الغيار', 'Spare Parts Sales Revenue', 7, 'revenue', 'credit', TRUE, 'إيرادات بيع قطع الغيار'),
('4003', 'إيرادات الاستشارات التقنية', 'Technical Consulting Revenue', 7, 'revenue', 'credit', TRUE, 'إيرادات الاستشارات التقنية'),
('4004', 'إيرادات عقود الصيانة', 'Maintenance Contracts Revenue', 7, 'revenue', 'credit', TRUE, 'إيرادات عقود الصيانة الدورية'),
('4101', 'إيرادات أخرى', 'Other Revenue', 8, 'revenue', 'credit', TRUE, 'الإيرادات المتنوعة الأخرى'),
('4102', 'أرباح بيع أصول', 'Gain on Asset Disposal', 8, 'revenue', 'credit', TRUE, 'أرباح بيع الأصول الثابتة'),

-- تكلفة البضاعة المباعة
('5001', 'تكلفة قطع الغيار المباعة', 'Cost of Spare Parts Sold', 9, 'cogs', 'debit', TRUE, 'تكلفة قطع الغيار المستخدمة'),
('5002', 'تكلفة مواد التشغيل', 'Cost of Operating Materials', 9, 'cogs', 'debit', TRUE, 'تكلفة مواد التشغيل المستخدمة'),
('5003', 'أجور العمالة المباشرة', 'Direct Labor Cost', 9, 'cogs', 'debit', TRUE, 'أجور الفنيين والعمالة المباشرة'),

-- المصروفات التشغيلية
('6001', 'مرتبات وأجور', 'Salaries and Wages', 10, 'expense', 'debit', TRUE, 'مرتبات وأجور الموظفين'),
('6002', 'تأمينات اجتماعية', 'Social Insurance', 10, 'expense', 'debit', TRUE, 'التأمينات الاجتماعية على الموظفين'),
('6003', 'إيجار المحل', 'Rent Expense', 10, 'expense', 'debit', TRUE, 'إيجار المحل أو المصنع'),
('6004', 'كهرباء ومياه', 'Utilities', 10, 'expense', 'debit', TRUE, 'فواتير الكهرباء والمياه والغاز'),
('6005', 'صيانة وإصلاحات', 'Maintenance and Repairs', 10, 'expense', 'debit', TRUE, 'صيانة المعدات والمباني'),
('6006', 'وقود ومحروقات', 'Fuel and Lubricants', 10, 'expense', 'debit', TRUE, 'وقود السيارات والمعدات'),
('6007', 'مصروفات تسويق وإعلان', 'Marketing and Advertising', 10, 'expense', 'debit', TRUE, 'مصروفات التسويق والإعلان'),
('6008', 'مصروفات اتصالات', 'Communication Expenses', 10, 'expense', 'debit', TRUE, 'فواتير الهاتف والإنترنت'),

-- المصروفات الإدارية
('6101', 'مصروفات إدارية عامة', 'General Administrative Expenses', 11, 'expense', 'debit', TRUE, 'المصروفات الإدارية العامة'),
('6102', 'قرطاسية ومطبوعات', 'Stationery and Printing', 11, 'expense', 'debit', TRUE, 'مصروفات القرطاسية والمطبوعات'),
('6103', 'مصروفات قانونية ومحاسبية', 'Legal and Accounting Fees', 11, 'expense', 'debit', TRUE, 'أتعاب المحاسبين والمحامين'),
('6104', 'تأمينات عامة', 'General Insurance', 11, 'expense', 'debit', TRUE, 'بوالص التأمين المختلفة'),
('6105', 'إهلاك الأصول الثابتة', 'Depreciation Expense', 11, 'expense', 'debit', TRUE, 'إهلاك الأصول الثابتة'),

-- المصروفات المالية
('6201', 'فوائد القروض', 'Interest Expense', 12, 'expense', 'debit', TRUE, 'فوائد القروض والتسهيلات'),
('6202', 'رسوم مصرفية', 'Bank Charges', 12, 'expense', 'debit', TRUE, 'الرسوم والعمولات المصرفية'),
('6203', 'خسائر تقلبات العملة', 'Foreign Exchange Loss', 12, 'expense', 'debit', TRUE, 'خسائر تقلبات أسعار الصرف');

-- إدراج مراكز التكلفة
INSERT IGNORE INTO CostCenter (code, name, nameEn, type, isActive, description) VALUES
('CC001', 'مركز صيانة الهواتف', 'Mobile Repair Center', 'revenue', TRUE, 'مركز إيراد لصيانة الهواتف الذكية'),
('CC002', 'مركز صيانة الحاسوب', 'Computer Repair Center', 'revenue', TRUE, 'مركز إيراد لصيانة أجهزة الكمبيوتر'),
('CC003', 'مركز صيانة الطابعات', 'Printer Repair Center', 'revenue', TRUE, 'مركز إيراد لصيانة الطابعات'),
('CC004', 'قسم المبيعات', 'Sales Department', 'revenue', TRUE, 'قسم بيع قطع الغيار والإكسسوارات'),
('CC005', 'قسم الإدارة', 'Administration Department', 'service', TRUE, 'الأقسام الإدارية والمالية'),
('CC006', 'قسم التسويق', 'Marketing Department', 'service', TRUE, 'قسم التسويق والإعلان'),
('CC007', 'قسم خدمة العملاء', 'Customer Service Department', 'service', TRUE, 'قسم خدمة العملاء والدعم الفني'),
('CC008', 'المخازن', 'Warehouse', 'support', TRUE, 'مخازن قطع الغيار والمواد'),
('CC009', 'قسم النقل', 'Transportation Department', 'support', TRUE, 'قسم النقل والتوصيل'),
('CC010', 'قسم الصيانة العامة', 'General Maintenance Department', 'support', TRUE, 'صيانة المباني والمعدات');

-- إدراج قيود محاسبية تجريبية
INSERT IGNORE INTO JournalEntry (entryNumber, entryDate, description, reference, totalDebit, totalCredit, status, createdBy) VALUES
('JE-2025-001', '2025-01-01', 'قيد افتتاحي - رأس المال', 'Opening Entry', 500000.00, 500000.00, 'posted', 1),
('JE-2025-002', '2025-01-02', 'شراء معدات صيانة', 'INV-001', 50000.00, 50000.00, 'posted', 1),
('JE-2025-003', '2025-01-03', 'إيراد خدمات صيانة', 'SRV-001', 15000.00, 15000.00, 'posted', 1),
('JE-2025-004', '2025-01-04', 'شراء قطع غيار', 'PUR-001', 25000.00, 25000.00, 'posted', 1),
('JE-2025-005', '2025-01-05', 'دفع إيجار المحل', 'RENT-001', 8000.00, 8000.00, 'posted', 1),
('JE-2025-006', '2025-01-06', 'مرتبات الموظفين', 'SAL-001', 30000.00, 30000.00, 'draft', 1);

-- إدراج سطور القيود المحاسبية
INSERT IGNORE INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount, costCenterId) VALUES
-- القيد الافتتاحي
(1, 1, 1, 'النقدية بالصندوق', 100000.00, 0.00, 5),
(1, 2, 2, 'البنك - الحساب الجاري', 300000.00, 0.00, 5),
(1, 3, 11, 'الآلات والمعدات', 100000.00, 0.00, 5),
(1, 4, 29, 'رأس المال المدفوع', 0.00, 500000.00, 5),

-- شراء معدات صيانة
(2, 1, 11, 'الآلات والمعدات', 50000.00, 0.00, 5),
(2, 2, 2, 'البنك - الحساب الجاري', 0.00, 50000.00, 5),

-- إيراد خدمات صيانة
(3, 1, 1, 'النقدية بالصندوق', 15000.00, 0.00, 1),
(3, 2, 35, 'إيرادات خدمات الصيانة', 0.00, 15000.00, 1),

-- شراء قطع غيار
(4, 1, 5, 'المخزون - قطع الغيار', 25000.00, 0.00, 8),
(4, 2, 19, 'الموردون', 0.00, 25000.00, 8),

-- دفع إيجار المحل
(5, 1, 45, 'إيجار المحل', 8000.00, 0.00, 5),
(5, 2, 1, 'النقدية بالصندوق', 0.00, 8000.00, 5),

-- مرتبات الموظفين (مسودة)
(6, 1, 43, 'مرتبات وأجور', 30000.00, 0.00, 5),
(6, 2, 21, 'مرتبات مستحقة الدفع', 0.00, 30000.00, 5);

-- إدراج بيانات تجريبية للفواتير مع ربطها بالنظام المحاسبي
UPDATE Invoice SET accountsReceivableId = 3 WHERE id IN (1, 2, 3, 4, 5); -- ربط الفواتير بحساب العملاء (A/R)

-- إدراج بيانات تجريبية للمدفوعات مع ربطها بالنظام المحاسبي
UPDATE Payment SET cashAccountId = 1 WHERE paymentMethod = 'cash'; -- ربط المدفوعات النقدية بحساب الصندوق
UPDATE Payment SET cashAccountId = 2 WHERE paymentMethod IN ('bank_transfer', 'check'); -- ربط التحويلات بحساب البنك

-- إدراج بيانات تجريبية للمصروفات مع ربطها بالنظام المحاسبي
UPDATE Expense SET expenseAccountId = 45 WHERE categoryId = 1; -- ربط مصروفات الإيجار
UPDATE Expense SET expenseAccountId = 46 WHERE categoryId = 2; -- ربط مصروفات الكهرباء والمياه
UPDATE Expense SET expenseAccountId = 43 WHERE categoryId = 3; -- ربط مصروفات المرتبات

-- إنشاء Views للتقارير المالية
CREATE OR REPLACE VIEW TrialBalanceView AS
SELECT 
    a.id,
    a.code,
    a.name,
    a.accountType,
    ac.name as categoryName,
    COALESCE(SUM(CASE 
        WHEN a.normalBalance = 'debit' THEN 
            COALESCE(jel.debitAmount, 0) - COALESCE(jel.creditAmount, 0)
        ELSE 
            COALESCE(jel.creditAmount, 0) - COALESCE(jel.debitAmount, 0)
    END), 0) as balance,
    CASE 
        WHEN COALESCE(SUM(CASE 
            WHEN a.normalBalance = 'debit' THEN 
                COALESCE(jel.debitAmount, 0) - COALESCE(jel.creditAmount, 0)
            ELSE 
                COALESCE(jel.creditAmount, 0) - COALESCE(jel.debitAmount, 0)
        END), 0) >= 0 THEN
            CASE WHEN a.normalBalance = 'debit' THEN 
                COALESCE(SUM(CASE 
                    WHEN a.normalBalance = 'debit' THEN 
                        COALESCE(jel.debitAmount, 0) - COALESCE(jel.creditAmount, 0)
                    ELSE 
                        COALESCE(jel.creditAmount, 0) - COALESCE(jel.debitAmount, 0)
                END), 0)
            ELSE 0 END
        ELSE 0
    END as debitBalance,
    CASE 
        WHEN COALESCE(SUM(CASE 
            WHEN a.normalBalance = 'debit' THEN 
                COALESCE(jel.debitAmount, 0) - COALESCE(jel.creditAmount, 0)
            ELSE 
                COALESCE(jel.creditAmount, 0) - COALESCE(jel.debitAmount, 0)
        END), 0) >= 0 THEN
            CASE WHEN a.normalBalance = 'credit' THEN 
                COALESCE(SUM(CASE 
                    WHEN a.normalBalance = 'debit' THEN 
                        COALESCE(jel.debitAmount, 0) - COALESCE(jel.creditAmount, 0)
                    ELSE 
                        COALESCE(jel.creditAmount, 0) - COALESCE(jel.debitAmount, 0)
                END), 0)
            ELSE 0 END
        ELSE 
            ABS(COALESCE(SUM(CASE 
                WHEN a.normalBalance = 'debit' THEN 
                    COALESCE(jel.debitAmount, 0) - COALESCE(jel.creditAmount, 0)
                ELSE 
                    COALESCE(jel.creditAmount, 0) - COALESCE(jel.debitAmount, 0)
            END), 0))
    END as creditBalance
FROM Account a
LEFT JOIN AccountCategory ac ON a.categoryId = ac.id
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.deletedAt IS NULL AND a.isActive = TRUE
GROUP BY a.id, a.code, a.name, a.accountType, a.normalBalance, ac.name
ORDER BY a.code;

CREATE OR REPLACE VIEW IncomeStatementView AS
SELECT 
    'الإيرادات' as section,
    a.code,
    a.name,
    COALESCE(SUM(jel.creditAmount - jel.debitAmount), 0) as amount
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.accountType = 'revenue' AND a.deletedAt IS NULL
GROUP BY a.id, a.code, a.name

UNION ALL

SELECT 
    'تكلفة البضاعة المباعة' as section,
    a.code,
    a.name,
    COALESCE(SUM(jel.debitAmount - jel.creditAmount), 0) as amount
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.accountType = 'cogs' AND a.deletedAt IS NULL
GROUP BY a.id, a.code, a.name

UNION ALL

SELECT 
    'المصروفات' as section,
    a.code,
    a.name,
    COALESCE(SUM(jel.debitAmount - jel.creditAmount), 0) as amount
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.accountType = 'expense' AND a.deletedAt IS NULL
GROUP BY a.id, a.code, a.name

ORDER BY section, code;

CREATE OR REPLACE VIEW BalanceSheetView AS
SELECT 
    'الأصول' as section,
    a.code,
    a.name,
    COALESCE(SUM(
        CASE WHEN a.normalBalance = 'debit' THEN 
            jel.debitAmount - jel.creditAmount
        ELSE 
            jel.creditAmount - jel.debitAmount
        END
    ), 0) as amount
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.accountType = 'asset' AND a.deletedAt IS NULL
GROUP BY a.id, a.code, a.name

UNION ALL

SELECT 
    'الخصوم' as section,
    a.code,
    a.name,
    COALESCE(SUM(
        CASE WHEN a.normalBalance = 'credit' THEN 
            jel.creditAmount - jel.debitAmount
        ELSE 
            jel.debitAmount - jel.creditAmount
        END
    ), 0) as amount
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.accountType = 'liability' AND a.deletedAt IS NULL
GROUP BY a.id, a.code, a.name

UNION ALL

SELECT 
    'حقوق الملكية' as section,
    a.code,
    a.name,
    COALESCE(SUM(
        CASE WHEN a.normalBalance = 'credit' THEN 
            jel.creditAmount - jel.debitAmount
        ELSE 
            jel.debitAmount - jel.creditAmount
        END
    ), 0) as amount
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
WHERE a.accountType = 'equity' AND a.deletedAt IS NULL
GROUP BY a.id, a.code, a.name

ORDER BY section, code;

-- إضافة فهارس لتحسين الأداء
SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Account' AND index_name = 'idx_account_code'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_account_code ON Account(code)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Account' AND index_name = 'idx_account_type'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_account_type ON Account(accountType)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'JournalEntry' AND index_name = 'idx_journal_entry_date'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_journal_entry_date ON JournalEntry(entryDate)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'JournalEntry' AND index_name = 'idx_journal_entry_status'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_journal_entry_status ON JournalEntry(status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'JournalEntryLine' AND index_name = 'idx_journal_entry_line_account'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_journal_entry_line_account ON JournalEntryLine(accountId)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'CostCenter' AND index_name = 'idx_cost_center_type'
);
SET @sql := IF(@c = 0, 'CREATE INDEX idx_cost_center_type ON CostCenter(type)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

COMMIT;
