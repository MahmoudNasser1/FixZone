# 🔄 الاستيراد الكامل مع إعادة التعيين

## الخطوات السريعة للبدء من الصفر

### 1️⃣ النسخ الاحتياطي (مهم!)

```bash
cd /opt/lampp/htdocs/FixZone
/opt/lampp/bin/mysqldump -u root FZ > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2️⃣ إعادة تعيين قاعدة البيانات

```bash
cd backend/scripts/migration
node 0_reset_database.js
```

### 3️⃣ استخراج وتحويل البيانات

```bash
node 1_extract_old_data.js
node 2_transform_data.js
node 3_transform_repairs.js
```

### 4️⃣ الاستيراد

```bash
cd /opt/lampp/htdocs/FixZone

# القيم المساعدة
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/4_import_lookups.sql

# العملاء
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/5_import_customers.sql

# الأجهزة
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/6_import_devices.sql

# طلبات الإصلاح
/opt/lampp/bin/mysql -u root FZ < backend/scripts/migration/import_sql/7_import_repairs.sql
```

### 5️⃣ التحقق

```bash
/opt/lampp/bin/mysql -u root FZ -e "
  SELECT 'العملاء' as 'البيان', COUNT(*) as 'العدد' FROM Customer WHERE deletedAt IS NULL
  UNION ALL SELECT 'القيم المساعدة', COUNT(*) FROM VariableOption;
"
```

---

## ✅ تم!

الآن لديك قاعدة بيانات نظيفة مع البيانات المستوردة فقط!

📚 **للمزيد:** راجع `FRESH_START_GUIDE.md`

