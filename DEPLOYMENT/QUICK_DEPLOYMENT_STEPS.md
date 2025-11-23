# 🚀 FixZone ERP - Quick Deployment Steps

## 📋 Summary of Deployment Steps

### Step 1: Export Database ✅
```bash
cd DEPLOYMENT
./export-database.sh
# Output: backups/fixzone_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Step 2: Prepare & Push to GitHub ✅
```bash
# Clean up
git add .
git commit -m "Ready for production deployment"
git push origin main

# Optional: Create release tag
git tag -a v1.0.0 -m "Production Release v1.0.0"
git push origin v1.0.0
```

### Step 3: Server Setup ✅
```bash
# SSH to server
ssh user@your-server-ip

# Install required software
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs mysql-server git nginx
sudo npm install -g pm2 serve

# Create project directory
sudo mkdir -p /var/www/fixzone
sudo chown -R $USER:$USER /var/www/fixzone
```

### Step 4: Deploy Code ✅
```bash
cd /var/www/fixzone
git clone https://github.com/yourusername/fixzone-erp.git .

# Or if already exists:
git pull origin main
```

### Step 5: Configure Environment ✅
```bash
# Backend
cd backend
cp .env.example .env
nano .env  # Edit with production values

# Frontend
cd ../frontend/react-app
cp .env.production.example .env.production
nano .env.production  # Edit API URL
```

### Step 6: Install Dependencies & Build ✅
```bash
# Backend
cd /var/www/fixzone/backend
npm install --production

# Frontend
cd ../frontend/react-app
npm install --production
npm run build
```

### Step 7: Import Database ✅
```bash
# Upload backup to server (from local)
scp backups/fixzone_backup_*.sql.gz user@server:/tmp/

# On server: Create database
mysql -u root -p
CREATE DATABASE FixZone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Import database
cd /tmp
gunzip fixzone_backup_*.sql.gz
mysql -u root -p FixZone < fixzone_backup_*.sql
```

### Step 8: Start with PM2 ✅
```bash
cd /var/www/fixzone

# Start applications
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup
pm2 startup
# Follow instructions shown

# Verify
pm2 status
pm2 logs
```

## ✅ Verification

```bash
# Test backend
curl http://localhost:4000/health

# Test frontend
curl http://localhost:3000

# Check PM2
pm2 status
pm2 monit
```

## 🔄 Update Deployment

```bash
cd /var/www/fixzone
git pull origin main
cd backend && npm install --production
cd ../frontend/react-app && npm install --production && npm run build
cd /var/www/fixzone
pm2 restart ecosystem.config.js
```

## 📝 Important Files

- `ecosystem.config.js` - PM2 configuration
- `backend/.env` - Backend environment variables
- `frontend/react-app/.env.production` - Frontend environment variables
- `DEPLOYMENT/DEPLOYMENT_GUIDE.md` - Complete guide

## 🆘 Quick Troubleshooting

```bash
# Restart all
pm2 restart all

# View logs
pm2 logs

# Check database
mysql -u root -p -e "USE FixZone; SHOW TABLES;"

# Check ports
sudo netstat -tulpn | grep :4000
sudo netstat -tulpn | grep :3000
```

