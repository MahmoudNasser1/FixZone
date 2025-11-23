# 🚀 FixZone ERP - Complete Deployment Guide

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Step 1: Export Database](#step-1-export-database)
3. [Step 2: Prepare Code for GitHub](#step-2-prepare-code-for-github)
4. [Step 3: Push to GitHub](#step-3-push-to-github)
5. [Step 4: Server Setup](#step-4-server-setup)
6. [Step 5: Deploy on Server](#step-5-deploy-on-server)
7. [Step 6: Import Database](#step-6-import-database)
8. [Step 7: Configure PM2](#step-7-configure-pm2)
9. [Step 8: Start Services](#step-8-start-services)
10. [Post-Deployment Verification](#post-deployment-verification)

---

## ✅ Pre-Deployment Checklist

- [ ] Database backup created
- [ ] All environment variables documented
- [ ] Dependencies installed locally
- [ ] Code tested and working
- [ ] Git repository initialized
- [ ] Server access confirmed
- [ ] PM2 installed on server
- [ ] Node.js and npm installed on server
- [ ] MySQL/MariaDB installed on server

---

## 📦 Step 1: Export Database

### 1.1 Export Database Structure and Data

```bash
# Navigate to project root
cd /opt/lampp/htdocs/FixZone

# Export database (replace with your credentials)
# Default database name is FZ
mysqldump -u root -p FZ > database_backup_$(date +%Y%m%d_%H%M%S).sql

# Or use the export script
cd DEPLOYMENT
./export-database.sh
```

### 1.2 Compress Database Backup

```bash
# Compress the SQL file
gzip database_backup_*.sql

# Or create tar archive
tar -czf database_backup_$(date +%Y%m%d_%H%M%S).tar.gz database_backup_*.sql
```

### 1.3 Verify Backup

```bash
# Check backup file size
ls -lh database_backup_*.sql.gz

# Test restore (optional, on test database)
mysql -u root -p test_db < database_backup_*.sql
```

---

## 🔧 Step 2: Prepare Code for GitHub

### 2.1 Check Git Status

```bash
# Check current git status
git status

# Check if .gitignore is correct
cat .gitignore
```

### 2.2 Create Environment Files Template

```bash
# Backend .env template
cat > backend/.env.example << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=FZ
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# Server Configuration
PORT=4000
NODE_ENV=production

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# File Upload
UPLOAD_MAX_SIZE=10485760
EOF

# Frontend .env template
cat > frontend/react-app/.env.production.example << 'EOF'
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_WS_URL=ws://localhost:4000/ws
EOF
```

### 2.3 Clean Up Before Commit

```bash
# Remove node_modules from tracking (if accidentally added)
git rm -r --cached node_modules/ 2>/dev/null || true
git rm -r --cached backend/node_modules/ 2>/dev/null || true
git rm -r --cached frontend/react-app/node_modules/ 2>/dev/null || true

# Remove log files
find . -name "*.log" -type f -delete
find . -name "*.txt" -type f ! -name "README.txt" -delete

# Remove temporary files
rm -f cookie_*.txt
rm -f *.tmp
```

### 2.4 Stage All Changes

```bash
# Add all files
git add .

# Check what will be committed
git status
```

---

## 📤 Step 3: Push to GitHub

### 3.1 Initialize Git Repository (if not already)

```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/yourusername/fixzone-erp.git

# Or if using SSH
git remote add origin git@github.com:yourusername/fixzone-erp.git
```

### 3.2 Commit and Push

```bash
# Commit all changes
git commit -m "Initial deployment: FixZone ERP v1.0

- Complete backend API
- React frontend
- Database schema
- PM2 configuration
- Deployment scripts"

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3.3 Create Release Tag (Optional)

```bash
# Create a release tag
git tag -a v1.0.0 -m "FixZone ERP v1.0.0 - Production Release"
git push origin v1.0.0
```

---

## 🖥️ Step 4: Server Setup

### 4.1 Connect to Server

```bash
# SSH to your server
ssh user@your-server-ip

# Or using key file
ssh -i ~/.ssh/your-key.pem user@your-server-ip
```

### 4.2 Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install MySQL/MariaDB (if not installed)
sudo apt install -y mysql-server

# Install Git
sudo apt install -y git

# Install Nginx (for reverse proxy, optional)
sudo apt install -y nginx
```

### 4.3 Create Project Directory

```bash
# Create project directory
sudo mkdir -p /var/www/fixzone
sudo chown -R $USER:$USER /var/www/fixzone

# Or use home directory
mkdir -p ~/fixzone
```

---

## 📥 Step 5: Deploy on Server

### 5.1 Clone Repository

```bash
# Navigate to project directory
cd /var/www/fixzone

# Clone repository
git clone https://github.com/yourusername/fixzone-erp.git .

# Or if repository already exists, pull latest
git pull origin main
```

### 5.2 Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies
cd ../frontend/react-app
npm install --production

# Build frontend
npm run build
```

### 5.3 Configure Environment Variables

```bash
# Backend .env
cd /var/www/fixzone/backend
cp .env.example .env
nano .env  # Edit with your production values

# Frontend .env.production
cd /var/www/fixzone/frontend/react-app
cp .env.production.example .env.production
nano .env.production  # Edit with your production API URL
```

### 5.4 Set Permissions

```bash
# Set proper permissions
cd /var/www/fixzone
chmod -R 755 .
chmod -R 777 uploads/
chmod -R 777 backend/uploads/
```

---

## 💾 Step 6: Import Database

### 6.1 Upload Database Backup

```bash
# From local machine, upload database backup
scp database_backup_*.sql.gz user@your-server-ip:/tmp/

# Or use SFTP
sftp user@your-server-ip
put database_backup_*.sql.gz /tmp/
```

### 6.2 Create Database on Server

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE FZ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, for better security)
CREATE USER 'fixzone_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON FZ.* TO 'fixzone_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6.3 Import Database

```bash
# Decompress backup
cd /tmp
gunzip database_backup_*.sql.gz

# Import database
mysql -u root -p FZ < database_backup_*.sql

# Or if using custom user
mysql -u fixzone_user -p FZ < database_backup_*.sql

# Verify import
mysql -u root -p -e "USE FZ; SHOW TABLES;"
```

---

## ⚙️ Step 7: Configure PM2

### 7.1 Create PM2 Ecosystem File

```bash
# Create PM2 ecosystem file
cd /var/www/fixzone
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'fixzone-backend',
      script: './backend/server.js',
      cwd: '/var/www/fixzone',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'fixzone-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: '/var/www/fixzone/frontend/react-app',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false
    }
  ]
};
EOF
```

### 7.2 Install serve for Frontend

```bash
# Install serve globally for serving React build
sudo npm install -g serve
```

---

## 🚀 Step 8: Start Services

### 8.1 Start with PM2

```bash
# Navigate to project root
cd /var/www/fixzone

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown
```

### 8.2 Verify Services

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs fixzone-backend
pm2 logs fixzone-frontend

# Monitor resources
pm2 monit
```

### 8.3 Configure Nginx (Optional but Recommended)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/fixzone

# Add configuration (see Nginx config section below)
# Enable site
sudo ln -s /etc/nginx/sites-available/fixzone /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## ✅ Post-Deployment Verification

### 8.1 Test Backend API

```bash
# Test health endpoint
curl http://localhost:4000/health

# Test login endpoint
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"password"}'
```

### 8.2 Test Frontend

```bash
# Open in browser
# http://your-server-ip:3000
# or
# https://yourdomain.com (if using Nginx)
```

### 8.3 Check Logs

```bash
# Backend logs
pm2 logs fixzone-backend --lines 50

# Frontend logs
pm2 logs fixzone-frontend --lines 50

# System logs
journalctl -u nginx -n 50
```

---

## 🔄 Update/Deploy New Version

### Quick Update Script

```bash
#!/bin/bash
# update-deployment.sh

cd /var/www/fixzone

# Pull latest code
git pull origin main

# Install/update dependencies
cd backend && npm install --production
cd ../frontend/react-app && npm install --production && npm run build

# Restart PM2
cd /var/www/fixzone
pm2 restart ecosystem.config.js

echo "✅ Deployment updated successfully!"
```

---

## 📝 Nginx Configuration Example

```nginx
# /etc/nginx/sites-available/fixzone

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/fixzone/frontend/react-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛠️ Troubleshooting

### PM2 Issues

```bash
# Restart all apps
pm2 restart all

# Delete and recreate
pm2 delete all
pm2 start ecosystem.config.js

# Check PM2 logs
pm2 logs
```

### Database Connection Issues

```bash
# Test database connection
mysql -u root -p -e "SHOW DATABASES;"

# Check MySQL service
sudo systemctl status mysql

# Check database user permissions
mysql -u root -p -e "SHOW GRANTS FOR 'fixzone_user'@'localhost';"
```

### Port Issues

```bash
# Check if ports are in use
sudo netstat -tulpn | grep :4000
sudo netstat -tulpn | grep :3000

# Kill process on port
sudo kill -9 $(sudo lsof -t -i:4000)
```

---

## 📞 Support

For issues or questions, check:
- PM2 Documentation: https://pm2.keymetrics.io/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Nginx Documentation: https://nginx.org/en/docs/

---

**Last Updated:** $(date +%Y-%m-%d)
**Version:** 1.0.0

