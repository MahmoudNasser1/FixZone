# إصلاح ملف .env على VPS

## المشاكل في الملف الحالي:

1. ❌ `NODE_ENV=development` - يجب أن يكون `production` على VPS
2. ❌ `CORS_ORIGIN` مقطوع (ناقص نهاية)
3. ⚠️ `JWT_SECRET` يجب تغييره لمفتاح قوي
4. ⚠️ قد تحتاج `DB_PORT` و `DB_CONNECTION_LIMIT`

## الملف الصحيح:

### على VPS، نفّذ:

```bash
cd /home/deploy/FixZone/backend

cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=4000

# JWT Secret (غيّر هذا لمفتاح قوي!)
JWT_SECRET=fixzone_jwt_secret_2025_production_change_this

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=0000
DB_NAME=FZ
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# CORS Configuration
CORS_ORIGIN=https://system.fixzzone.com,https://fixzzone.com,https://www.fixzzone.com

# Settings Encryption Key
SETTINGS_ENCRYPTION_KEY=fixzone_encryption_key_2025_production
EOF
```

## أو عدّل الملف الموجود:

```bash
cd /home/deploy/FixZone/backend
nano .env
```

### غيّر:

1. **NODE_ENV**: من `development` إلى `production`
2. **JWT_SECRET**: غيّره لمفتاح قوي (مثال: `fixzone_jwt_secret_2025_production_xyz123`)
3. **CORS_ORIGIN**: أكمل السطر (يبدو مقطوعاً)
4. **أضف**:
   ```
   DB_PORT=3306
   DB_CONNECTION_LIMIT=10
   SETTINGS_ENCRYPTION_KEY=fixzone_encryption_key_2025_production
   ```

## بعد التعديل:

```bash
# إعادة تشغيل السيرفر
pm2 restart fixzone-api --update-env

# التحقق
pm2 logs fixzone-api --err --lines 20
```

## ملاحظات مهمة:

1. ✅ `DB_PASSWORD=0000` - صحيح إذا كانت هذه كلمة مرور MySQL
2. ✅ `DB_NAME=FZ` - صحيح
3. ⚠️ **غيّر JWT_SECRET** - مهم جداً للأمان
4. ⚠️ **غيّر SETTINGS_ENCRYPTION_KEY** - مهم للأمان

