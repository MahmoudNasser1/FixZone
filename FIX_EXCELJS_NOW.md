# حل فوري لمشكلة exceljs مع PM2

## المشكلة
PM2 لا يجد `exceljs` رغم أنه موجود في `node_modules`.

## الحل الفوري (نفذ هذه الأوامر بالترتيب):

### 1. التحقق من exceljs وإعادة تثبيته
```bash
cd /home/deploy/FixZone/backend

# حذف exceljs وإعادة تثبيته
npm uninstall exceljs
npm install exceljs@^4.4.0 --save --production

# التحقق من وجوده
ls -la node_modules/exceljs
```

### 2. اختبار require من Node.js
```bash
cd /home/deploy/FixZone/backend
node -e "const ExcelJS = require('exceljs'); console.log('✅ exceljs version:', ExcelJS.version || 'loaded');"
```

إذا نجح هذا، المشكلة في PM2 فقط.

### 3. إيقاف PM2 وإعادة تشغيله مع NODE_PATH صريح
```bash
cd /home/deploy/FixZone/backend

# إيقاف وحذف العملية
pm2 stop fixzone-api
pm2 delete fixzone-api

# الحصول على المسار المطلق لـ node_modules
NODE_MODULES_PATH="$(pwd)/node_modules"
echo "NODE_PATH will be: $NODE_MODULES_PATH"

# تشغيل مع NODE_PATH صريح
NODE_PATH="$NODE_MODULES_PATH" pm2 start server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production \
    --update-env

pm2 save
```

### 4. التحقق من اللوجات
```bash
sleep 5
pm2 logs fixzone-api --err --lines 20
```

## إذا استمرت المشكلة - حل بديل:

### استخدام ecosystem.config.js مع NODE_PATH:

```bash
cd /home/deploy/FixZone/backend

# إنشاء ملف ecosystem مؤقت
cat > /tmp/fixzone-api.config.js <<'EOF'
module.exports = {
  apps: [{
    name: 'fixzone-api',
    script: 'server.js',
    cwd: '/home/deploy/FixZone/backend',
    env: {
      NODE_ENV: 'production',
      NODE_PATH: '/home/deploy/FixZone/backend/node_modules'
    },
    error_file: '/home/deploy/.pm2/logs/fixzone-api-error.log',
    out_file: '/home/deploy/.pm2/logs/fixzone-api-out.log',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

pm2 delete fixzone-api || true
pm2 start /tmp/fixzone-api.config.js
pm2 save

sleep 5
pm2 logs fixzone-api --err --lines 20
```

## إذا لم يعمل أي شيء - حل نهائي:

### إعادة تثبيت كامل للموديولات:
```bash
cd /home/deploy/FixZone/backend

# حذف كل شيء وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install --production

# إعادة تشغيل PM2
pm2 delete fixzone-api
NODE_PATH="$(pwd)/node_modules" pm2 start server.js \
    --name fixzone-api \
    --cwd /home/deploy/FixZone/backend \
    --env production

pm2 save
```

## التحقق النهائي:
```bash
# يجب ألا ترى أي أخطاء exceljs
pm2 logs fixzone-api --err --lines 10

# يجب أن يكون status = online
pm2 status

# يجب أن يكون CPU < 10%
pm2 monit
```

