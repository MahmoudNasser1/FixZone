-- تحديث العملة إلى الجنيه المصري كافتراضي
UPDATE Invoice SET currency = 'EGP' WHERE currency = 'SAR' OR currency IS NULL;
UPDATE Payment SET currency = 'EGP' WHERE currency = 'SAR' OR currency IS NULL;
UPDATE Expense SET currency = 'EGP' WHERE currency = 'SAR' OR currency IS NULL;

-- تحديث الجداول لاستخدام EGP كافتراضي
ALTER TABLE Invoice MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EGP';
ALTER TABLE Payment MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EGP';
ALTER TABLE Expense MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EGP';
