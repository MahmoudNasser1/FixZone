# PM2 Port Update Instructions

## Problem
PM2 process `fixzone-api` is still trying to use port 4000 instead of 4000.

## Solution

### Option 1: Update PM2 Environment Variables (Recommended)

```bash
# Stop the current process
pm2 stop fixzone-api

# Delete the process
pm2 delete fixzone-api

# Update environment variables and restart
pm2 start backend/server.js \
  --name fixzone-api \
  --env PORT=4000 \
  --update-env

# Or if using ecosystem.config.js
pm2 start ecosystem.config.js --update-env
pm2 save
```

### Option 2: Update PM2 Process Directly

```bash
# Stop the process
pm2 stop fixzone-api

# Update the environment variable
pm2 set fixzone-api PORT 4000

# Restart
pm2 restart fixzone-api
pm2 save
```

### Option 3: Delete and Recreate

```bash
# Delete the process
pm2 delete fixzone-api

# Start with new configuration
cd /home/deploy/FixZone
pm2 start backend/server.js \
  --name fixzone-api \
  -i 2 \
  --env PORT=4000 \
  --update-env

# Save PM2 configuration
pm2 save
```

### Option 4: Check and Update .env File

```bash
# Check if backend/.env has PORT=4000
cd /home/deploy/FixZone/backend
grep PORT .env

# If it shows PORT=4000, update it:
sed -i 's/PORT=4000/PORT=4000/g' .env

# Then restart PM2
pm2 restart fixzone-api
```

## Verify

After updating, verify the port:

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs fixzone-api --lines 20

# Test the endpoint
curl http://localhost:4000/health
```

You should see:
```
🚀 Fix Zone Backend Server is running on port 4000
📊 API Base URL: http://localhost:4000/api
🏥 Health Check: http://localhost:4000/health
🔌 WebSocket URL: ws://localhost:4000/ws
```

## Troubleshooting

If port 4000 is still in use:

```bash
# Find what's using port 4000
sudo lsof -i :4000
# or
sudo netstat -tulpn | grep 4000

# Kill the process if needed
sudo kill -9 <PID>
```

Then restart PM2 with the new port.

