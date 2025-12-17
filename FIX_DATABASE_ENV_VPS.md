# إصلاح مشكلة قاعدة البيانات على VPS

## المشكلة
```
Access denied for user 'root'@'localhost' (using password: NO)
```

هذا يعني أن ملف `.env` غير موجود أو `DB_PASSWORD` غير محدد.

## الحل السريع

### على VPS، نفّذ هذه الأوامر:

```bash
cd /home/deploy/FixZone/backend

# 1. التحقق من وجود ملف .env
ls -la .env

# 2. إذا لم يكن موجوداً، أنشئه:
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=FZ
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# Server Configuration
NODE_ENV=production
PORT=4000

# JWT Secret (استخدم مفتاح قوي!)
JWT_SECRET=your_strong_jwt_secret_key_here_change_this

# CORS
CORS_ORIGIN=https://yourdomain.com

# Settings Encryption (اختياري)
SETTINGS_ENCRYPTION_KEY=your_encryption_key_here
EOF

# 3. عدّل كلمة المرور في ملف .env
nano .env
# أو
vi .env
```

### 3. استبدل `YOUR_MYSQL_PASSWORD_HERE` بكلمة مرور MySQL الصحيحة

إذا كانت كلمة المرور فارغة (لا توجد كلمة مرور):
```bash
# في ملف .env
DB_PASSWORD=
```

إذا كانت لديك كلمة مرور:
```bash
# في ملف .env
DB_PASSWORD=your_actual_password
```

### 4. إعادة تشغيل السيرفر

```bash
cd /home/deploy/FixZone/backend
pm2 restart fixzone-api --update-env

# التحقق
pm2 logs fixzone-api --err --lines 20
```

## التحقق من كلمة مرور MySQL

إذا كنت لا تعرف كلمة مرور MySQL:

```bash
# جرب الاتصال بدون كلمة مرور
mysql -u root

# إذا نجح، كلمة المرور فارغة
# في ملف .env استخدم: DB_PASSWORD=

# إذا فشل، جرب بكلمة مرور
mysql -u root -p
# أدخل كلمة المرور عند الطلب
```

## إذا كان ملف .env موجود لكن به مشاكل

```bash
cd /home/deploy/FixZone/backend

# عرض محتوى ملف .env
cat .env

# تحقق من وجود DB_PASSWORD
grep DB_PASSWORD .env

# إذا كان فارغاً أو غير موجود، أضفه:
echo "DB_PASSWORD=your_password" >> .env
```

## مثال ملف .env كامل

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=FZ
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# Server Configuration
NODE_ENV=production
PORT=4000

# JWT Secret
JWT_SECRET=fixzone_jwt_secret_key_2025_production_change_this

# CORS
CORS_ORIGIN=https://yourdomain.com

# Settings Encryption
SETTINGS_ENCRYPTION_KEY=fixzone_encryption_key_2025_production
```

## بعد الإصلاح

```bash
# إعادة تشغيل السيرفر
pm2 restart fixzone-api --update-env

# التحقق من اللوجات
pm2 logs fixzone-api --err --lines 20

# يجب ألا ترى أخطاء "Access denied"
```

## ملاحظات أمنية

⚠️ **مهم**: 
- لا ترفع ملف `.env` على GitHub
- استخدم كلمات مرور قوية
- غيّر `JWT_SECRET` و `SETTINGS_ENCRYPTION_KEY` في الإنتاج

