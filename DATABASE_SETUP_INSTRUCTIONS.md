# تعليمات إعداد قاعدة البيانات - Fix Zone ERP
## Database Setup Instructions

### المتطلبات الأساسية
- XAMPP مع MySQL مُفعل
- phpMyAdmin أو MySQL Workbench
- قاعدة بيانات باسم `FZ`

### خطوات التشغيل

#### 1. إنشاء قاعدة البيانات
```sql
CREATE DATABASE IF NOT EXISTS FZ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE FZ;
```

#### 2. تطبيق سكربتات الترحيل بالترتيب التالي:

##### أ) إنشاء الهيكل الأساسي
```bash
# تطبيق السكربت الأساسي لقاعدة البيانات
mysql -u root -p FZ < fixzone_erp_full_schema.sql
```

##### ب) إنشاء النظام المحاسبي
```bash
# تطبيق سكربت النظام المحاسبي
mysql -u root -p FZ < migrations/2025-08-18_create_accounting_system.sql
```

##### ج) إضافة البيانات التجريبية للنظام المحاسبي
```bash
# تطبيق بيانات النظام المحاسبي التجريبية
mysql -u root -p FZ < migrations/2025-08-18_accounting_seed_data.sql
```

##### د) إضافة التكامل المحاسبي
```bash
# تطبيق سكربت التكامل المحاسبي
mysql -u root -p FZ < migrations/2025-08-18_add_accounting_integration.sql
```

##### هـ) تطبيق باقي سكربتات الترحيل
```bash
# تطبيق سكربتات الترحيل الأخرى
mysql -u root -p FZ < migrations/2025-01-15_fix_invoice_item_schema.sql
mysql -u root -p FZ < migrations/2025-08-09_add_device_password.sql
mysql -u root -p FZ < migrations/2025-08-09_add_variables_device_specs.sql
mysql -u root -p FZ < migrations/2025-08-09_seed_variables.sql
```

#### 3. إضافة البيانات التجريبية الأساسية
```bash
# تطبيق البيانات التجريبية الأساسية
mysql -u root -p FZ < database/seed_data.sql
```

### التحقق من نجاح التشغيل

#### 1. فحص الجداول المحاسبية
```sql
USE FZ;

-- التحقق من وجود الجداول المحاسبية
SHOW TABLES LIKE '%Account%';
SHOW TABLES LIKE '%Journal%';
SHOW TABLES LIKE '%CostCenter%';

-- فحص البيانات التجريبية
SELECT COUNT(*) as account_categories FROM AccountCategory;
SELECT COUNT(*) as accounts FROM Account;
SELECT COUNT(*) as cost_centers FROM CostCenter;
SELECT COUNT(*) as journal_entries FROM JournalEntry;
```

#### 2. فحص التكامل المحاسبي
```sql
-- التحقق من إضافة الأعمدة الجديدة
DESCRIBE Invoice;
DESCRIBE Payment;
DESCRIBE Expense;

-- فحص البيانات التجريبية للمدفوعات والمصروفات
SELECT COUNT(*) as payments FROM Payment;
SELECT COUNT(*) as expenses FROM Expense;
```

#### 3. فحص Views والإجراءات المخزنة
```sql
-- فحص Views
SELECT * FROM AccountingTransactions LIMIT 5;
SELECT * FROM CashFlowSummary LIMIT 5;
SELECT * FROM AccountBalanceSummary LIMIT 10;

-- فحص الإجراءات المخزنة
SHOW PROCEDURE STATUS WHERE Db = 'FZ';
```

### استكشاف الأخطاء

#### مشاكل شائعة وحلولها:

1. **خطأ في الترميز (Character Set)**
   ```sql
   ALTER DATABASE FZ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **خطأ في المفاتيح الخارجية**
   ```sql
   SET FOREIGN_KEY_CHECKS = 0;
   -- تطبيق السكربت
   SET FOREIGN_KEY_CHECKS = 1;
   ```

3. **خطأ في الصلاحيات**
   ```sql
   GRANT ALL PRIVILEGES ON FZ.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### اختبار النظام

#### 1. اختبار API المحاسبي
```bash
# تشغيل الخادم
cd c:\xampp\htdocs\FixZone
node server.js

# اختبار endpoints
curl http://localhost:3000/api/accounting/accounts
curl http://localhost:3000/api/accounting/journal-entries
curl http://localhost:3000/api/accounting/cost-centers
```

#### 2. اختبار التكامل المالي
```bash
# اختبار المدفوعات
curl http://localhost:3000/api/payments

# اختبار المصروفات
curl http://localhost:3000/api/expenses

# اختبار الفواتير
curl http://localhost:3000/api/invoices
```

### ملاحظات مهمة

1. **النسخ الاحتياطي**: قم بعمل نسخة احتياطية قبل تطبيق أي سكربت
   ```bash
   mysqldump -u root -p FZ > backup_before_accounting.sql
   ```

2. **ترتيب التطبيق**: يجب تطبيق السكربتات بالترتيب المحدد لتجنب أخطاء المفاتيح الخارجية

3. **البيانات التجريبية**: السكربتات تحتوي على بيانات تجريبية مصرية مناسبة للاختبار

4. **الأداء**: تم إضافة فهارس لتحسين أداء الاستعلامات المحاسبية

### الخطوات التالية

بعد تطبيق جميع السكربتات بنجاح:

1. تشغيل الخادم: `node server.js`
2. تشغيل Frontend: `cd frontend/react-app && npm start`
3. اختبار النظام المحاسبي من الواجهة
4. التحقق من إنشاء القيود المحاسبية التلقائية

### الدعم

في حالة مواجهة أي مشاكل:
1. تحقق من سجلات الأخطاء في MySQL
2. تأكد من تشغيل XAMPP بصلاحيات المدير
3. تحقق من إعدادات الاتصال في `db.js`
