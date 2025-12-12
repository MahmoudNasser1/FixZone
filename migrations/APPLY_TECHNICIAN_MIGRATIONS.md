# تطبيق Migrations الخاصة بالفنيين

## الطريقة 1: استخدام الـ Script (موصى بها)

```bash
cd /opt/lampp/htdocs/FixZone/migrations
./apply_technician_migrations.sh
```

الـ script سيقوم بـ:
- قراءة بيانات الاتصال من ملف `.env` تلقائياً
- تطبيق جميع الـ migrations بالترتيب
- التحقق من نجاح العملية

---

## الطريقة 2: تطبيق يدوي (إذا كنت تعرف بيانات الاتصال)

### على السيرفر المحلي (XAMPP):

```bash
# إذا كان MySQL في XAMPP
/opt/lampp/bin/mysql -u root -p FZ < migrations/create_technician_notes_PRODUCTION.sql
/opt/lampp/bin/mysql -u root -p FZ < migrations/create_technician_reports_PRODUCTION.sql
/opt/lampp/bin/mysql -u root -p FZ < migrations/create_technician_tasks_PRODUCTION.sql
/opt/lampp/bin/mysql -u root -p FZ < migrations/create_technician_time_tracking_PRODUCTION.sql
```

### على السيرفر (Production):

```bash
# استبدل القيم التالية ببياناتك الفعلية:
# - your_username: اسم المستخدم (مثلاً: root أو fixzone_user)
# - your_database_name: اسم قاعدة البيانات (مثلاً: FZ أو fixzone)

mysql -u your_username -p your_database_name < migrations/create_technician_notes_PRODUCTION.sql
mysql -u your_username -p your_database_name < migrations/create_technician_reports_PRODUCTION.sql
mysql -u your_username -p your_database_name < migrations/create_technician_tasks_PRODUCTION.sql
mysql -u your_username -p your_database_name < migrations/create_technician_time_tracking_PRODUCTION.sql
```

---

## معرفة بيانات الاتصال

### من ملف `.env`:

```bash
# ابحث عن ملف .env في مجلد backend
cat backend/.env | grep DB_

# أو
cat .env | grep DB_
```

ستجد شيئاً مثل:
```
DB_HOST=localhost
DB_USER=root
DB_NAME=FZ
DB_PASSWORD=your_password
```

### من ملف `backend/db.js`:

القيم الافتراضية هي:
- **DB_HOST**: `localhost`
- **DB_USER**: `root`
- **DB_NAME**: `FZ`
- **DB_PASSWORD**: (فارغ في البيئة المحلية)

---

## التحقق من نجاح التطبيق

بعد تطبيق الـ migrations، تحقق من الجداول:

```bash
mysql -u root -p FZ -e "
SHOW TABLES LIKE 'Notes';
SHOW TABLES LIKE 'NoteAttachments';
SHOW TABLES LIKE 'TechnicianReports';
SHOW TABLES LIKE 'Tasks';
SHOW TABLES LIKE 'TimeTracking';
SHOW TABLES LIKE 'TimeAdjustments';
"
```

---

## ملاحظات مهمة

1. **النسخ الاحتياطي**: يُنصح بعمل backup قبل التطبيق:
   ```bash
   mysqldump -u root -p FZ > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **الملفات آمنة**: هذه الملفات تستخدم `CREATE TABLE IF NOT EXISTS`، لذا يمكن تشغيلها عدة مرات بأمان.

3. **الأخطاء**: إذا ظهرت أخطاء، تحقق من:
   - وجود الجداول المرجعية (User, Device, RepairRequest)
   - صلاحيات المستخدم
   - اتصال قاعدة البيانات

