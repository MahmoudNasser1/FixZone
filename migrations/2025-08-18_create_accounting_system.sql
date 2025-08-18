-- =====================================================
-- إنشاء النظام المحاسبي الكامل لمركز Fix Zone للصيانة
-- تاريخ الإنشاء: 2025-08-18
-- =====================================================

USE FZ;

-- =====================================================
-- 1. جدول دليل الحسابات (Chart of Accounts)
-- =====================================================

CREATE TABLE AccountCategory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nameEn VARCHAR(100),
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL
);

CREATE TABLE Account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    nameEn VARCHAR(150),
    categoryId INT NOT NULL,
    parentAccountId INT DEFAULT NULL,
    accountType ENUM('asset', 'liability', 'equity', 'revenue', 'expense', 'cogs') NOT NULL,
    normalBalance ENUM('debit', 'credit') NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    level INT DEFAULT 1,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (categoryId) REFERENCES AccountCategory(id),
    FOREIGN KEY (parentAccountId) REFERENCES Account(id),
    INDEX idx_account_code (code),
    INDEX idx_account_type (accountType),
    INDEX idx_account_parent (parentAccountId)
);

-- =====================================================
-- 2. مراكز التكلفة (Cost Centers)
-- =====================================================

CREATE TABLE CostCenter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    nameEn VARCHAR(100),
    type ENUM('revenue', 'service', 'support') NOT NULL,
    parentId INT DEFAULT NULL,
    managerId INT DEFAULT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (parentId) REFERENCES CostCenter(id),
    FOREIGN KEY (managerId) REFERENCES User(id),
    INDEX idx_costcenter_code (code),
    INDEX idx_costcenter_type (type)
);

-- =====================================================
-- 3. القيود المحاسبية (Journal Entries)
-- =====================================================

CREATE TABLE JournalEntry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entryNumber VARCHAR(50) NOT NULL UNIQUE,
    entryDate DATE NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(100),
    referenceType ENUM('invoice', 'payment', 'expense', 'repair', 'manual', 'adjustment') DEFAULT 'manual',
    referenceId INT DEFAULT NULL,
    totalDebit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    totalCredit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status ENUM('draft', 'posted', 'reversed') DEFAULT 'draft',
    createdBy INT NOT NULL,
    postedBy INT DEFAULT NULL,
    postedAt DATETIME DEFAULT NULL,
    reversedBy INT DEFAULT NULL,
    reversedAt DATETIME DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES User(id),
    FOREIGN KEY (postedBy) REFERENCES User(id),
    FOREIGN KEY (reversedBy) REFERENCES User(id),
    INDEX idx_journal_date (entryDate),
    INDEX idx_journal_number (entryNumber),
    INDEX idx_journal_reference (referenceType, referenceId),
    INDEX idx_journal_status (status)
);

CREATE TABLE JournalEntryLine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journalEntryId INT NOT NULL,
    accountId INT NOT NULL,
    costCenterId INT DEFAULT NULL,
    description VARCHAR(255),
    debitAmount DECIMAL(15,2) DEFAULT 0.00,
    creditAmount DECIMAL(15,2) DEFAULT 0.00,
    lineNumber INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id) ON DELETE CASCADE,
    FOREIGN KEY (accountId) REFERENCES Account(id),
    FOREIGN KEY (costCenterId) REFERENCES CostCenter(id),
    INDEX idx_journal_line_entry (journalEntryId),
    INDEX idx_journal_line_account (accountId),
    INDEX idx_journal_line_costcenter (costCenterId)
);

-- =====================================================
-- 4. الميزانيات (Budgets)
-- =====================================================

CREATE TABLE Budget (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    fiscalYear YEAR NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    status ENUM('draft', 'approved', 'active', 'closed') DEFAULT 'draft',
    totalBudget DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    createdBy INT NOT NULL,
    approvedBy INT DEFAULT NULL,
    approvedAt DATETIME DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES User(id),
    FOREIGN KEY (approvedBy) REFERENCES User(id),
    INDEX idx_budget_year (fiscalYear),
    INDEX idx_budget_status (status)
);

CREATE TABLE BudgetLine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    budgetId INT NOT NULL,
    accountId INT NOT NULL,
    costCenterId INT DEFAULT NULL,
    period ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    month TINYINT DEFAULT NULL,
    quarter TINYINT DEFAULT NULL,
    budgetAmount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    actualAmount DECIMAL(15,2) DEFAULT 0.00,
    variance DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (budgetId) REFERENCES Budget(id) ON DELETE CASCADE,
    FOREIGN KEY (accountId) REFERENCES Account(id),
    FOREIGN KEY (costCenterId) REFERENCES CostCenter(id),
    INDEX idx_budget_line_budget (budgetId),
    INDEX idx_budget_line_account (accountId),
    INDEX idx_budget_line_period (period, month, quarter)
);

-- =====================================================
-- 5. تحديث الجداول الموجودة لربطها بالنظام المحاسبي
-- =====================================================

-- إضافة حقول محاسبية لجدول الفواتير
ALTER TABLE Invoice 
ADD COLUMN journalEntryId INT DEFAULT NULL,
ADD COLUMN accountsReceivableId INT DEFAULT NULL,
ADD COLUMN revenueAccountId INT DEFAULT NULL,
ADD COLUMN taxAccountId INT DEFAULT NULL,
ADD FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id),
ADD FOREIGN KEY (accountsReceivableId) REFERENCES Account(id),
ADD FOREIGN KEY (revenueAccountId) REFERENCES Account(id),
ADD FOREIGN KEY (taxAccountId) REFERENCES Account(id);

-- إضافة حقول محاسبية لجدول المدفوعات
ALTER TABLE Payment 
ADD COLUMN journalEntryId INT DEFAULT NULL,
ADD COLUMN cashAccountId INT DEFAULT NULL,
ADD FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id),
ADD FOREIGN KEY (cashAccountId) REFERENCES Account(id);

-- إضافة حقول محاسبية لجدول المصروفات
ALTER TABLE Expense 
ADD COLUMN journalEntryId INT DEFAULT NULL,
ADD COLUMN expenseAccountId INT DEFAULT NULL,
ADD COLUMN costCenterId INT DEFAULT NULL,
ADD FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id),
ADD FOREIGN KEY (expenseAccountId) REFERENCES Account(id),
ADD FOREIGN KEY (costCenterId) REFERENCES CostCenter(id);

-- =====================================================
-- 6. إدراج البيانات الأساسية
-- =====================================================

-- إدراج فئات الحسابات
INSERT INTO AccountCategory (name, nameEn, code, description) VALUES
('الأصول', 'Assets', '1', 'جميع الأصول المملوكة للشركة'),
('الخصوم', 'Liabilities', '2', 'جميع الالتزامات والديون'),
('حقوق الملكية', 'Equity', '3', 'رأس المال وحقوق المالكين'),
('الإيرادات', 'Revenues', '4', 'جميع الإيرادات والدخل'),
('تكلفة البضاعة المباعة', 'Cost of Goods Sold', '5', 'التكاليف المباشرة للخدمات'),
('المصروفات', 'Expenses', '6', 'جميع المصروفات التشغيلية');

-- إدراج الحسابات الرئيسية للأصول
INSERT INTO Account (code, name, nameEn, categoryId, accountType, normalBalance, level, description) VALUES
-- الأصول المتداولة
('1001', 'النقدية بالصندوق', 'Cash on Hand', 1, 'asset', 'debit', 1, 'النقدية المتوفرة في الصندوق'),
('1002', 'النقدية بالبنك - البنك الأهلي', 'Bank - National Bank', 1, 'asset', 'debit', 1, 'الحساب الجاري بالبنك الأهلي'),
('1003', 'النقدية بالبنك - بنك مصر', 'Bank - Banque Misr', 1, 'asset', 'debit', 1, 'الحساب الجاري ببنك مصر'),
('1101', 'عملاء أفراد', 'Individual Customers', 1, 'asset', 'debit', 1, 'مستحقات العملاء الأفراد'),
('1102', 'عملاء شركات', 'Corporate Customers', 1, 'asset', 'debit', 1, 'مستحقات العملاء الشركات'),
('1201', 'مخزون قطع غيار - هواتف', 'Inventory - Phone Parts', 1, 'asset', 'debit', 1, 'مخزون قطع غيار الهواتف'),
('1202', 'مخزون قطع غيار - لابتوب', 'Inventory - Laptop Parts', 1, 'asset', 'debit', 1, 'مخزون قطع غيار اللابتوب'),
('1203', 'مخزون أدوات الصيانة', 'Inventory - Repair Tools', 1, 'asset', 'debit', 1, 'أدوات ومعدات الصيانة'),

-- الأصول الثابتة
('1301', 'أثاث ومعدات مكتبية', 'Furniture & Office Equipment', 1, 'asset', 'debit', 1, 'الأثاث والمعدات المكتبية'),
('1302', 'مجمع إهلاك الأثاث', 'Accumulated Depreciation - Furniture', 1, 'asset', 'credit', 1, 'مجمع إهلاك الأثاث والمعدات'),
('1303', 'أجهزة كمبيوتر وتقنية', 'Computer & IT Equipment', 1, 'asset', 'debit', 1, 'أجهزة الكمبيوتر والتقنية'),
('1304', 'مجمع إهلاك أجهزة الكمبيوتر', 'Accumulated Depreciation - IT', 1, 'asset', 'credit', 1, 'مجمع إهلاك أجهزة الكمبيوتر'),
('1305', 'معدات الصيانة والإصلاح', 'Repair Equipment', 1, 'asset', 'debit', 1, 'معدات وأجهزة الصيانة'),
('1306', 'مجمع إهلاك معدات الصيانة', 'Accumulated Depreciation - Repair Equipment', 1, 'asset', 'credit', 1, 'مجمع إهلاك معدات الصيانة');

-- إدراج الحسابات الرئيسية للخصوم
INSERT INTO Account (code, name, nameEn, categoryId, accountType, normalBalance, level, description) VALUES
('2001', 'موردون - قطع غيار', 'Suppliers - Parts', 2, 'liability', 'credit', 1, 'مستحقات موردي قطع الغيار'),
('2002', 'موردون - معدات وأدوات', 'Suppliers - Equipment', 2, 'liability', 'credit', 1, 'مستحقات موردي المعدات'),
('2011', 'ضريبة القيمة المضافة', 'VAT Payable', 2, 'liability', 'credit', 1, 'ضريبة القيمة المضافة المستحقة'),
('2012', 'ضريبة الدخل المستحقة', 'Income Tax Payable', 2, 'liability', 'credit', 1, 'ضريبة الدخل المستحقة'),
('2013', 'أمانات العملاء', 'Customer Deposits', 2, 'liability', 'credit', 1, 'أمانات وضمانات العملاء'),
('2007', 'مرتبات مستحقة', 'Accrued Salaries', 2, 'liability', 'credit', 1, 'المرتبات المستحقة للموظفين'),
('2009', 'تأمينات اجتماعية مستحقة', 'Social Insurance Payable', 2, 'liability', 'credit', 1, 'التأمينات الاجتماعية المستحقة');

-- إدراج حسابات حقوق الملكية
INSERT INTO Account (code, name, nameEn, categoryId, accountType, normalBalance, level, description) VALUES
('3001', 'رأس المال المدفوع', 'Paid-in Capital', 3, 'equity', 'credit', 1, 'رأس المال المدفوع من المالكين'),
('3004', 'أرباح مدورة', 'Retained Earnings', 3, 'equity', 'credit', 1, 'الأرباح المحتجزة من السنوات السابقة'),
('3005', 'أرباح العام الحالي', 'Current Year Earnings', 3, 'equity', 'credit', 1, 'صافي أرباح العام الحالي');

-- إدراج حسابات الإيرادات
INSERT INTO Account (code, name, nameEn, categoryId, accountType, normalBalance, level, description) VALUES
('4001', 'إيرادات صيانة الهواتف', 'Phone Repair Revenue', 4, 'revenue', 'credit', 1, 'إيرادات خدمات صيانة الهواتف'),
('4002', 'إيرادات صيانة الأجهزة اللوحية', 'Tablet Repair Revenue', 4, 'revenue', 'credit', 1, 'إيرادات صيانة الأجهزة اللوحية'),
('4003', 'إيرادات صيانة اللابتوب', 'Laptop Repair Revenue', 4, 'revenue', 'credit', 1, 'إيرادات صيانة أجهزة اللابتوب'),
('4005', 'إيرادات بيع قطع الغيار', 'Parts Sales Revenue', 4, 'revenue', 'credit', 1, 'إيرادات بيع قطع الغيار'),
('4006', 'إيرادات الخدمات الإضافية', 'Additional Services Revenue', 4, 'revenue', 'credit', 1, 'إيرادات الخدمات الإضافية'),
('4201', 'إيرادات فوائد بنكية', 'Bank Interest Income', 4, 'revenue', 'credit', 1, 'الفوائد المكتسبة من البنوك');

-- إدراج حسابات تكلفة البضاعة المباعة
INSERT INTO Account (code, name, nameEn, categoryId, accountType, normalBalance, level, description) VALUES
('5001', 'تكلفة قطع الغيار المستخدمة', 'Cost of Parts Used', 5, 'cogs', 'debit', 1, 'تكلفة قطع الغيار المستخدمة في الصيانة'),
('5002', 'تكلفة المواد المستهلكة', 'Cost of Consumables', 5, 'cogs', 'debit', 1, 'تكلفة المواد المستهلكة'),
('5003', 'تكلفة العمالة المباشرة', 'Direct Labor Cost', 5, 'cogs', 'debit', 1, 'تكلفة العمالة المباشرة للصيانة');

-- إدراج حسابات المصروفات
INSERT INTO Account (code, name, nameEn, categoryId, accountType, normalBalance, level, description) VALUES
-- مصروفات الموظفين
('6001', 'مرتبات وأجور', 'Salaries & Wages', 6, 'expense', 'debit', 1, 'مرتبات وأجور الموظفين'),
('6002', 'مكافآت وحوافز', 'Bonuses & Incentives', 6, 'expense', 'debit', 1, 'مكافآت وحوافز الموظفين'),
('6003', 'تأمينات اجتماعية', 'Social Insurance', 6, 'expense', 'debit', 1, 'تأمينات اجتماعية للموظفين'),
('6004', 'تأمين صحي', 'Health Insurance', 6, 'expense', 'debit', 1, 'تأمين صحي للموظفين'),

-- مصروفات إدارية
('6101', 'إيجار المحل', 'Shop Rent', 6, 'expense', 'debit', 1, 'إيجار المحل والمكاتب'),
('6102', 'كهرباء ومياه', 'Utilities', 6, 'expense', 'debit', 1, 'فواتير الكهرباء والمياه'),
('6103', 'هاتف وإنترنت', 'Telecommunications', 6, 'expense', 'debit', 1, 'فواتير الهاتف والإنترنت'),
('6104', 'مصروفات تنظيف', 'Cleaning Expenses', 6, 'expense', 'debit', 1, 'مصروفات التنظيف والنظافة'),
('6107', 'مصروفات قرطاسية', 'Stationery Expenses', 6, 'expense', 'debit', 1, 'قرطاسية ومطبوعات'),
('6112', 'مصروفات بنكية', 'Bank Charges', 6, 'expense', 'debit', 1, 'رسوم وعمولات بنكية'),

-- مصروفات تسويق
('6201', 'إعلانات ودعاية', 'Advertising & Marketing', 6, 'expense', 'debit', 1, 'مصروفات الإعلان والتسويق'),
('6202', 'وسائل التواصل الاجتماعي', 'Social Media Marketing', 6, 'expense', 'debit', 1, 'مصروفات التسويق الرقمي'),

-- مصروفات الإهلاك
('6301', 'إهلاك الأثاث والمعدات', 'Depreciation - Furniture', 6, 'expense', 'debit', 1, 'إهلاك الأثاث والمعدات'),
('6303', 'إهلاك أجهزة الكمبيوتر', 'Depreciation - IT Equipment', 6, 'expense', 'debit', 1, 'إهلاك أجهزة الكمبيوتر'),
('6304', 'إهلاك معدات الصيانة', 'Depreciation - Repair Equipment', 6, 'expense', 'debit', 1, 'إهلاك معدات الصيانة');

-- إدراج مراكز التكلفة
INSERT INTO CostCenter (code, name, nameEn, type, description) VALUES
-- مراكز الإيراد
('CC001', 'قسم صيانة الهواتف', 'Phone Repair Department', 'revenue', 'قسم صيانة وإصلاح الهواتف الذكية'),
('CC002', 'قسم صيانة الأجهزة اللوحية', 'Tablet Repair Department', 'revenue', 'قسم صيانة الأجهزة اللوحية'),
('CC003', 'قسم صيانة اللابتوب', 'Laptop Repair Department', 'revenue', 'قسم صيانة أجهزة اللابتوب'),
('CC005', 'قسم بيع قطع الغيار', 'Parts Sales Department', 'revenue', 'قسم بيع قطع الغيار والإكسسوارات'),

-- مراكز الخدمة
('CC101', 'الإدارة العامة', 'General Administration', 'service', 'الإدارة العامة والتنفيذية'),
('CC102', 'المحاسبة والمالية', 'Accounting & Finance', 'service', 'قسم المحاسبة والشؤون المالية'),
('CC103', 'الموارد البشرية', 'Human Resources', 'service', 'قسم الموارد البشرية'),
('CC104', 'التسويق والمبيعات', 'Marketing & Sales', 'service', 'قسم التسويق والمبيعات'),
('CC105', 'خدمة العملاء', 'Customer Service', 'service', 'قسم خدمة العملاء والاستقبال'),
('CC106', 'المخازن', 'Warehouse', 'service', 'إدارة المخازن والمخزون');

-- =====================================================
-- 7. إنشاء الفهارس الإضافية لتحسين الأداء
-- =====================================================

CREATE INDEX idx_account_active ON Account(isActive);
CREATE INDEX idx_costcenter_active ON CostCenter(isActive);
CREATE INDEX idx_journal_entry_date_status ON JournalEntry(entryDate, status);
CREATE INDEX idx_journal_line_amounts ON JournalEntryLine(debitAmount, creditAmount);

-- =====================================================
-- 8. إنشاء Views للتقارير المالية
-- =====================================================

-- عرض ميزان المراجعة
CREATE VIEW TrialBalance AS
SELECT 
    a.code,
    a.name,
    a.accountType,
    a.normalBalance,
    COALESCE(SUM(jel.debitAmount), 0) as totalDebits,
    COALESCE(SUM(jel.creditAmount), 0) as totalCredits,
    CASE 
        WHEN a.normalBalance = 'debit' THEN COALESCE(SUM(jel.debitAmount), 0) - COALESCE(SUM(jel.creditAmount), 0)
        ELSE COALESCE(SUM(jel.creditAmount), 0) - COALESCE(SUM(jel.debitAmount), 0)
    END as balance
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id
WHERE a.isActive = TRUE AND a.deletedAt IS NULL
    AND (je.status = 'posted' OR je.id IS NULL)
GROUP BY a.id, a.code, a.name, a.accountType, a.normalBalance
ORDER BY a.code;

-- عرض قائمة الدخل
CREATE VIEW IncomeStatement AS
SELECT 
    a.accountType,
    a.code,
    a.name,
    CASE 
        WHEN a.accountType IN ('revenue') THEN COALESCE(SUM(jel.creditAmount), 0) - COALESCE(SUM(jel.debitAmount), 0)
        WHEN a.accountType IN ('expense', 'cogs') THEN COALESCE(SUM(jel.debitAmount), 0) - COALESCE(SUM(jel.creditAmount), 0)
        ELSE 0
    END as amount
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id
WHERE a.accountType IN ('revenue', 'expense', 'cogs') 
    AND a.isActive = TRUE AND a.deletedAt IS NULL
    AND (je.status = 'posted' OR je.id IS NULL)
GROUP BY a.id, a.accountType, a.code, a.name
HAVING amount != 0
ORDER BY a.accountType, a.code;

-- عرض المركز المالي
CREATE VIEW BalanceSheet AS
SELECT 
    a.accountType,
    a.code,
    a.name,
    CASE 
        WHEN a.normalBalance = 'debit' THEN COALESCE(SUM(jel.debitAmount), 0) - COALESCE(SUM(jel.creditAmount), 0)
        ELSE COALESCE(SUM(jel.creditAmount), 0) - COALESCE(SUM(jel.debitAmount), 0)
    END as balance
FROM Account a
LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id
WHERE a.accountType IN ('asset', 'liability', 'equity') 
    AND a.isActive = TRUE AND a.deletedAt IS NULL
    AND (je.status = 'posted' OR je.id IS NULL)
GROUP BY a.id, a.accountType, a.code, a.name, a.normalBalance
HAVING balance != 0
ORDER BY a.accountType, a.code;

-- =====================================================
-- انتهاء سكربت إنشاء النظام المحاسبي
-- =====================================================
