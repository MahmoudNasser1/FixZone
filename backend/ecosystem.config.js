module.exports = {
<<<<<<< HEAD
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
=======
  apps: [
    {
      name: 'fixzone-api',
      script: 'server.js',
      cwd: '/home/deploy/FixZone/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: '/home/deploy/FixZone/backend/node_modules',
        PORT: 4000
      },
      error_file: '/home/deploy/.pm2/logs/fixzone-api-error.log',
      out_file: '/home/deploy/.pm2/logs/fixzone-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
>>>>>>> 9dff5a3a5737bb1497f93afb9ea731bd52ef4288
};

