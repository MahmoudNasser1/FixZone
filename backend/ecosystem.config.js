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

