# 🚀 FixZone ERP - Deployment Files

This directory contains all deployment-related files and scripts.

## 📁 Files

- **DEPLOYMENT_GUIDE.md** - Complete step-by-step deployment guide
- **export-database.sh** - Script to export database for deployment
- **deploy-to-server.sh** - Script to deploy code on production server
- **backend.env.example** - Backend environment variables template
- **frontend.env.production.example** - Frontend environment variables template

## 🚀 Quick Start

### 1. Export Database

```bash
cd DEPLOYMENT
./export-database.sh
```

### 2. Push to GitHub

```bash
# From project root
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3. Deploy on Server

```bash
# On your production server
cd DEPLOYMENT
./deploy-to-server.sh
```

## 📝 Environment Variables

### Backend (.env)

Copy `backend.env.example` to `backend/.env` and fill in your values:

```bash
cp DEPLOYMENT/backend.env.example backend/.env
nano backend/.env
```

### Frontend (.env.production)

Copy `frontend.env.production.example` to `frontend/react-app/.env.production`:

```bash
cp DEPLOYMENT/frontend.env.production.example frontend/react-app/.env.production
nano frontend/react-app/.env.production
```

## 🔧 PM2 Commands

```bash
# Start applications
pm2 start ecosystem.config.js

# Stop applications
pm2 stop all

# Restart applications
pm2 restart all

# View logs
pm2 logs

# Monitor
pm2 monit

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

## 📊 Monitoring

- **PM2 Dashboard**: `pm2 monit`
- **Logs**: `pm2 logs`
- **Status**: `pm2 status`

## 🔄 Updates

To update the deployment:

```bash
cd /var/www/fixzone
git pull origin main
cd backend && npm install --production
cd ../frontend/react-app && npm install --production && npm run build
cd /var/www/fixzone
pm2 restart ecosystem.config.js
```

## 🛠️ Troubleshooting

See the main DEPLOYMENT_GUIDE.md for detailed troubleshooting steps.
