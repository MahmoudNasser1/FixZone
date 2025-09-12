-- إضافة حقل status للعملاء
ALTER TABLE Customer ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- تحديث جميع العملاء الحاليين ليكونوا نشطين
UPDATE Customer SET status = 'active' WHERE status IS NULL;

-- إضافة فهرس للحقل الجديد
CREATE INDEX idx_customer_status ON Customer(status);
