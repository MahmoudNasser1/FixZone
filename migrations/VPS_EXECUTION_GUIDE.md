# 🚀 دليل تنفيذ Migration على VPS (Ubuntu)

## 📋 معلومات السيرفر

- **OS:** Ubuntu 24.04.3 LTS
- **المشروع:** `~/FixZone`
- **قاعدة البيانات:** `FZ` (أو حسب الإعدادات)

---

## ✅ الطريقة 1: استخدام MySQL Command Line (موصى به)

### الخطوات:

```bash
# 1. الاتصال بالسيرفر (إذا لم تكن متصل)
ssh vps

# 2. الانتقال لمجلد المشروع
cd ~/FixZone

# 3. التحقق من وجود ملف الـ migration
ls -la migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql

# 4. تنفيذ الـ migration
# الطريقة الأولى: استخدام mysql مباشرة
mysql -u [DB_USER] -p[DB_PASSWORD] FZ < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql

# أو الطريقة الثانية: استخدام mysql مع prompt للباسورد (أكثر أماناً)
mysql -u [DB_USER] -p FZ < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql
# سيطلب منك إدخال الباسورد

# مثال:
mysql -u root -p FZ < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql
```

---

## ✅ الطريقة 2: استخدام MySQL Interactive Mode

```bash
# 1. الدخول إلى MySQL
mysql -u [DB_USER] -p

# 2. اختيار قاعدة البيانات
USE FZ;

# 3. نسخ ولصق محتوى الملف
# افتح الملف في محرر آخر أو استخدم cat:
cat ~/FixZone/migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql

# 4. انسخ الكود والصقه في MySQL prompt
# أو استخدم source:
source ~/FixZone/migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql;
```

---

## ✅ الطريقة 3: استخدام Node.js Script (إذا كان Node.js مثبت)

```bash
# 1. الانتقال لمجلد المشروع
cd ~/FixZone

# 2. التأكد من تثبيت dependencies
npm install

# 3. التأكد من وجود ملف .env مع إعدادات قاعدة البيانات
cat .env | grep DB_

# 4. تشغيل الـ migration script
node backend/migrations/run_inspection_reports_migration.js
```

---

## ✅ الطريقة 4: استخدام Environment Variables من .env

إذا كان لديك ملف `.env` في المشروع:

```bash
# 1. قراءة إعدادات قاعدة البيانات
cd ~/FixZone
source .env 2>/dev/null || true

# 2. تنفيذ الـ migration باستخدام المتغيرات
mysql -u ${DB_USER:-root} -p${DB_PASSWORD} -h ${DB_HOST:-localhost} ${DB_NAME:-FZ} < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql
```

---

## 🔍 التحقق من الإعدادات

### 1. التحقق من MySQL:

```bash
# التحقق من أن MySQL يعمل
sudo systemctl status mysql
# أو
sudo service mysql status

# التحقق من إصدار MySQL
mysql --version
```

### 2. التحقق من قاعدة البيانات:

```bash
# الدخول إلى MySQL
mysql -u root -p

# عرض قواعد البيانات
SHOW DATABASES;

# التحقق من وجود قاعدة البيانات FZ
USE FZ;
SHOW TABLES LIKE 'InspectionReport';

# الخروج
EXIT;
```

### 3. التحقق من صلاحيات المستخدم:

```bash
mysql -u root -p -e "SHOW GRANTS FOR 'your_user'@'localhost';"
```

---

## ✅ التحقق من نجاح الـ Migration

بعد التنفيذ:

```bash
# الدخول إلى MySQL
mysql -u root -p

# اختيار قاعدة البيانات
USE FZ;

# التحقق من وجود العمود
DESCRIBE InspectionReport;

# التحقق من وجود الـ Index
SHOW INDEXES FROM InspectionReport WHERE Key_name = 'idx_inspection_report_deletedAt';

# التحقق من البيانات
SELECT COUNT(*) as total_reports, COUNT(deletedAt) as deleted_reports FROM InspectionReport;

# الخروج
EXIT;
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: "Command 'mysql' not found"

```bash
# تثبيت MySQL client
sudo apt update
sudo apt install mysql-client

# أو إذا كان MySQL server مثبت محلياً
sudo apt install mysql-server
```

### مشكلة: "Access denied for user"

```bash
# التحقق من المستخدم والباسورد
# جرب استخدام root:
mysql -u root -p

# أو إنشاء مستخدم جديد:
mysql -u root -p
CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON FZ.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### مشكلة: "Can't connect to MySQL server"

```bash
# التحقق من أن MySQL يعمل
sudo systemctl start mysql
sudo systemctl enable mysql

# التحقق من المنفذ
sudo netstat -tlnp | grep 3306
```

### مشكلة: "Unknown database 'FZ'"

```bash
# التحقق من اسم قاعدة البيانات
mysql -u root -p -e "SHOW DATABASES;"

# إذا كانت القاعدة باسم آخر، استبدل FZ بالاسم الصحيح
```

---

## 📝 مثال كامل للتنفيذ

```bash
# 1. الاتصال بالسيرفر
ssh vps

# 2. الانتقال للمشروع
cd ~/FixZone

# 3. عرض محتوى الملف للتأكد
head -20 migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql

# 4. تنفيذ الـ migration
mysql -u root -p FZ < migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql
# أدخل الباسورد عندما يُطلب منك

# 5. التحقق من النجاح
mysql -u root -p FZ -e "DESCRIBE InspectionReport;" | grep deletedAt

# 6. عرض النتيجة
mysql -u root -p FZ -e "SELECT COUNT(*) as total, COUNT(deletedAt) as deleted FROM InspectionReport;"
```

---

## 🔒 نصائح الأمان

1. **لا تحفظ الباسورد في الأوامر:**
   ```bash
   # ❌ سيء
   mysql -u root -ppassword123 FZ < migration.sql
   
   # ✅ جيد
   mysql -u root -p FZ < migration.sql
   ```

2. **استخدم مستخدم محدود الصلاحيات:**
   ```sql
   CREATE USER 'migration_user'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT ALTER, CREATE, INDEX ON FZ.* TO 'migration_user'@'localhost';
   ```

3. **اعمل backup قبل التنفيذ:**
   ```bash
   mysqldump -u root -p FZ InspectionReport > backup_inspection_report_$(date +%Y%m%d_%H%M%S).sql
   ```

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. تحقق من logs MySQL:
   ```bash
   sudo tail -f /var/log/mysql/error.log
   ```

2. تحقق من صلاحيات الملف:
   ```bash
   ls -la migrations/add_deletedAt_to_inspection_reports_PRODUCTION.sql
   ```

3. جرب تنفيذ الـ migration يدوياً خطوة بخطوة

---

**تاريخ الإنشاء:** 2025-12-11  
**الإصدار:** 1.0

