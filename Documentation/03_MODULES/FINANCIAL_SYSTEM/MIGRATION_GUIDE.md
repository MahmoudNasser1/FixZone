# دليل تطبيق Migrations - نظام المالية
## Financial System - Migration Guide

**تاريخ الإنشاء:** 2025-01-28  
**آخر تحديث:** 2025-01-28

---

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تطبيق Migrations لنظام المالية بشكل آمن على Staging و Production.

---

## 🔧 المتطلبات

1. **Backup قاعدة البيانات** - يجب عمل Backup قبل أي Migration
2. **Access إلى قاعدة البيانات** - MySQL/MariaDB access
3. **Scripts جاهزة** - Scripts موجودة في `backend/scripts/`

---

## 📝 Migrations المتوفرة

### Migration 1: Add Missing Columns to Invoice
**الملف:** `backend/migrations/20250128_add_missing_columns_to_invoice.sql`

**التغييرات:**
- إضافة `discountAmount` DECIMAL(12,2)
- إضافة `dueDate` DATE
- إضافة `notes` TEXT
- إضافة `customerId` INT(11)
- إضافة Indexes

### Migration 2: Add paymentDate to Payment
**الملف:** `backend/migrations/20250128_add_paymentDate_to_payment.sql`

**التغييرات:**
- إضافة `paymentDate` DATE

### Migration 3: Add Soft Delete to InvoiceItem
**الملف:** `backend/migrations/20250128_add_soft_delete_to_invoice_item.sql`

**التغييرات:**
- إضافة `deletedAt` DATETIME

---

## 🚀 خطوات التطبيق

### على Staging Environment

#### الطريقة 1: استخدام Script (موصى به)

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts
./apply_financial_migrations.sh staging
```

#### الطريقة 2: تطبيق يدوي

```bash
# 1. Backup
mysqldump -u root -p FZ > backup_staging_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migrations
mysql -u root -p FZ < backend/migrations/20250128_add_missing_columns_to_invoice.sql
mysql -u root -p FZ < backend/migrations/20250128_add_paymentDate_to_payment.sql
mysql -u root -p FZ < backend/migrations/20250128_add_soft_delete_to_invoice_item.sql

# 3. Test
cd backend
node scripts/test_financial_migrations.js
```

### على Production Environment

⚠️ **تحذير:** يجب تطبيق Migrations على Production فقط بعد:
1. ✅ اختبار كامل على Staging
2. ✅ Backup قاعدة البيانات
3. ✅ جدولة Maintenance Window
4. ✅ إشعار الفريق

#### خطوات التطبيق:

```bash
# 1. جدولة Maintenance Window (2-4 صباحاً)
# 2. إشعار الفريق

# 3. Backup
mysqldump -u root -p FZ > backup_production_$(date +%Y%m%d_%H%M%S).sql

# 4. Apply migrations
cd /opt/lampp/htdocs/FixZone/backend/scripts
./apply_financial_migrations.sh production

# 5. Test
cd /opt/lampp/htdocs/FixZone/backend
node scripts/test_financial_migrations.js

# 6. Monitor logs
pm2 logs backend
```

---

## ✅ Checklist قبل التطبيق

### على Staging:
- [ ] Backup قاعدة البيانات
- [ ] جميع Tests تمر
- [ ] لا توجد أخطاء في Logs
- [ ] Team تم إشعاره

### على Production:
- [ ] ✅ Staging تم اختباره بنجاح
- [ ] Backup قاعدة البيانات
- [ ] Maintenance Window مجدول
- [ ] Team تم إشعاره
- [ ] Rollback Plan جاهز
- [ ] Monitoring جاهز

---

## 🧪 الاختبار بعد التطبيق

### 1. اختبار Migrations

```bash
cd /opt/lampp/htdocs/FixZone/backend
node scripts/test_financial_migrations.js
```

### 2. اختبار العمليات

```bash
# Test Invoice operations
curl -X GET http://localhost:3000/api/financial/invoices

# Test Payment operations
curl -X GET http://localhost:3000/api/financial/payments

# Test Expense operations
curl -X GET http://localhost:3000/api/financial/expenses
```

### 3. التحقق من البيانات

```sql
-- Check Invoice columns
DESCRIBE Invoice;

-- Check Payment columns
DESCRIBE Payment;

-- Check InvoiceItem columns
DESCRIBE InvoiceItem;

-- Check data integrity
SELECT COUNT(*) FROM Invoice;
SELECT COUNT(*) FROM Payment;
SELECT COUNT(*) FROM InvoiceItem;
```

---

## 🔄 Rollback

في حالة حدوث مشاكل، يمكن Rollback باستخدام:

```bash
cd /opt/lampp/htdocs/FixZone/backend/scripts
./rollback_financial_migrations.sh <backup_file>
```

أو يدوياً:

```bash
mysql -u root -p FZ < backup_file.sql
```

---

## 📊 Monitoring بعد التطبيق

### 1. مراقبة Logs

```bash
# Backend logs
pm2 logs backend

# Database logs
tail -f /var/log/mysql/error.log
```

### 2. مراقبة الأداء

```sql
-- Check slow queries
SHOW PROCESSLIST;

-- Check table sizes
SELECT 
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'FZ'
AND TABLE_NAME IN ('Invoice', 'Payment', 'InvoiceItem');
```

### 3. مراقبة الأخطاء

- مراقبة Error logs في Backend
- مراقبة Database errors
- مراقبة Frontend errors

---

## ⚠️ المشاكل المحتملة وحلولها

### المشكلة 1: Migration فشل

**السبب:** قد يكون العمود موجود بالفعل أو خطأ في SQL

**الحل:**
```sql
-- Check if column exists
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'FZ' 
AND TABLE_NAME = 'Invoice' 
AND COLUMN_NAME = 'discountAmount';

-- If exists, skip migration or modify it
```

### المشكلة 2: Data integrity issues

**السبب:** بيانات غير صحيحة بعد Migration

**الحل:**
```sql
-- Check for NULL values in required fields
SELECT * FROM Invoice WHERE customerId IS NULL;

-- Update if needed
UPDATE Invoice SET customerId = (SELECT customerId FROM RepairRequest WHERE id = Invoice.repairRequestId) WHERE customerId IS NULL;
```

### المشكلة 3: Performance degradation

**السبب:** Indexes غير محسّنة

**الحل:**
```sql
-- Analyze tables
ANALYZE TABLE Invoice;
ANALYZE TABLE Payment;
ANALYZE TABLE InvoiceItem;

-- Check indexes
SHOW INDEX FROM Invoice;
```

---

## 📚 المراجع

- [خطة المهام المتبقية](./REMAINING_TASKS_PLAN.md)
- [تتبع التقدم](./PROGRESS.md)
- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)

---

## 📞 الدعم

في حالة وجود مشاكل:
1. راجع Logs
2. راجع هذا الدليل
3. راجع [REMAINING_TASKS_PLAN.md](./REMAINING_TASKS_PLAN.md)
4. اتصل بـ DevOps Team

---

**آخر تحديث:** 2025-01-28


