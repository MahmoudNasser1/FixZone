# إصلاح مشكلة PM2 مع ملف .env

## المشكلة
PM2 لا يقرأ ملف `.env` بشكل صحيح، لذلك `DB_PASSWORD` غير محمّل.

## الحلول

### الحل 1: استخدام PM2 ecosystem config (موصى به)

```bash
cd /home/deploy/FixZone/backend

# إنشاء ملف ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fixzone-api',
    script: 'server.js',
    cwd: '/home/deploy/FixZone/backend',
    env_file: '/home/deploy/FixZone/backend/.env',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/home/deploy/.pm2/logs/fixzone-api-error.log',
    out_file: '/home/deploy/.pm2/logs/fixzone-api-out.log',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# إعادة تشغيل PM2
pm2 delete fixzone-api
pm2 start ecosystem.config.js
pm2 save
```

### الحل 2: تمرير المتغيرات مباشرة في PM2

```bash
cd /home/deploy/FixZone/backend

# إيقاف وحذف العملية
pm2 stop fixzone-api
pm2 delete fixzone-api

# تشغيل مع المتغيرات مباشرة
pm2 start server.js \
  --name fixzone-api \
  --cwd /home/deploy/FixZone/backend \
  --env production \
  --update-env \
  -- DB_HOST=localhost \
  -- DB_USER=root \
  -- DB_PASSWORD=0000 \
  -- DB_NAME=FZ \
  -- DB_PORT=3306 \
  -- NODE_ENV=production

pm2 save
```

### الحل 3: تعديل server.js لقراءة .env بشكل صريح (أفضل)

```bash
cd /home/deploy/FixZone/backend

# التحقق من أن dotenv يقرأ من المسار الصحيح
# في server.js يجب أن يكون:
# require('dotenv').config({ path: __dirname + '/.env' });
```

### الحل 4: استخدام source لتحميل .env قبل PM2

```bash
cd /home/deploy/FixZone/backend

# إنشاء سكريبت تشغيل
cat > start.sh << 'EOF'
#!/bin/bash
cd /home/deploy/FixZone/backend
export $(cat .env | xargs)
node server.js
EOF

chmod +x start.sh

# تشغيل PM2 مع السكريبت
pm2 delete fixzone-api
pm2 start start.sh --name fixzone-api
pm2 save
```

## الحل السريع الموصى به

```bash
cd /home/deploy/FixZone/backend

# 1. التحقق من وجود ملف .env
cat .env | grep DB_PASSWORD

# 2. إنشاء ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fixzone-api',
    script: 'server.js',
    cwd: '/home/deploy/FixZone/backend',
    env_file: '/home/deploy/FixZone/backend/.env',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# 3. إعادة تشغيل PM2
pm2 delete fixzone-api
pm2 start ecosystem.config.js
pm2 save

# 4. التحقق
pm2 logs fixzone-api --err --lines 20
```

## التحقق من أن .env يتم قراءته

```bash
# اختبار قراءة .env
cd /home/deploy/FixZone/backend
node -e "require('dotenv').config(); console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');"
```

إذا ظهر "SET" يعني أن dotenv يعمل، المشكلة في PM2.

