# تعليمات تنفيذ Migration على سيرفر الإنتاج

## الطريقة 1: استخدام ملف SQL مباشرة (الأسهل)

### الأمر المباشر:

```bash
mysql -u root -p FZ < /path/to/PRODUCTION_inspection_reports_enhancement.sql
```

أو إذا كنت في نفس المجلد:

```bash
mysql -u root -p FZ < PRODUCTION_inspection_reports_enhancement.sql
```

### مثال كامل:

```bash
# الانتقال إلى مجلد المشروع
cd /opt/lampp/htdocs/FixZone/backend/migrations

# تنفيذ الـ migration
mysql -u root -p FZ < PRODUCTION_inspection_reports_enhancement.sql
```

---

## الطريقة 2: استخدام Bash Script

### الخطوات:

1. رفع الملفات إلى السيرفر:
   ```bash
   scp PRODUCTION_inspection_reports_enhancement.sql user@server:/path/to/migrations/
   scp RUN_PRODUCTION_MIGRATION.sh user@server:/path/to/migrations/
   ```

2. الاتصال بـ SSH:
   ```bash
   ssh user@server
   ```

3. جعل الـ script قابل للتنفيذ:
   ```bash
   chmod +x /path/to/migrations/RUN_PRODUCTION_MIGRATION.sh
   ```

4. تنفيذ الـ script:
   ```bash
   ./RUN_PRODUCTION_MIGRATION.sh FZ root
   ```
   أو مع كلمة المرور:
   ```bash
   ./RUN_PRODUCTION_MIGRATION.sh FZ root your_password
   ```

---

## الطريقة 3: تنفيذ مباشر عبر SSH بدون رفع ملفات

### نسخ محتوى SQL ولصقه مباشرة:

```bash
ssh user@server "mysql -u root -p FZ" << EOF
-- هنا تنسخ محتوى ملف PRODUCTION_inspection_reports_enhancement.sql
-- ... محتوى الـ migration ...
EOF
```

---

## التحقق من نجاح الـ Migration

بعد التنفيذ، تحقق من النتائج:

```bash
mysql -u root -p FZ -e "
SELECT 'Inspection Types' as 'Table', COUNT(*) as 'Count' 
FROM InspectionType 
WHERE deletedAt IS NULL
UNION ALL
SELECT 'FinalInspectionComponentTemplate' as 'Table', COUNT(*) as 'Count' 
FROM FinalInspectionComponentTemplate;
"
```

**النتائج المتوقعة:**
- Inspection Types: 3 على الأقل (مبدئي، أثناء الإصلاح، نهائي)
- FinalInspectionComponentTemplate: 12 قالب

---

## ملاحظات مهمة ⚠️

1. **احفظ نسخة احتياطية** من قاعدة البيانات قبل التنفيذ:
   ```bash
   mysqldump -u root -p FZ > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **الـ Migration آمن**: يستخدم `INSERT IGNORE` و `ON DUPLICATE KEY UPDATE` لتجنب الأخطاء عند التنفيذ المتكرر

3. **لا يوجد حذف بيانات**: الـ migration لا يحذف أي بيانات موجودة

4. **يمكن التنفيذ عدة مرات**: آمن للتنفيذ المتكرر

---

## في حالة حدوث خطأ

إذا واجهت أي أخطاء، تحقق من:

1. صلاحيات المستخدم:
   ```bash
   mysql -u root -p -e "SHOW GRANTS;"
   ```

2. وجود قاعدة البيانات:
   ```bash
   mysql -u root -p -e "SHOW DATABASES LIKE 'FZ';"
   ```

3. سجلات الأخطاء:
   ```bash
   tail -f /var/log/mysql/error.log
   ```

---mysql -u root -p FZ -e "
SELECT 'Inspection Types' as 'Table', COUNT(*) as 'Count' 
FROM InspectionType 
WHERE deletedAt IS NULL
UNION ALL
SELECT 'FinalInspectionComponentTemplate' as 'Table', COUNT(*) as 'Count' 
FROM FinalInspectionComponentTemplate;
"mysql -u root -p FZ -e "
SELECT 'Inspection Types' as 'Table', COUNT(*) as 'Count' 
FROM InspectionType 
WHERE deletedAt IS NULL
UNION ALL
SELECT 'FinalInspectionComponentTemplate' as 'Table', COUNT(*) as 'Count' 
FROM FinalInspectionComponentTemplate;
"

## الأوامر السريعة (Quick Commands)

### نسخ احتياطي:
```bash
mysqldump -u root -p FZ > backup_$(date +%Y%m%d).sql
```

### تنفيذ Migration:
```bash
mysql -u root -p FZ < PRODUCTION_inspection_reports_enhancement.sql
```

### التحقق:
```bash
mysql -u root -p FZ -e "SELECT COUNT(*) FROM FinalInspectionComponentTemplate;"
```

