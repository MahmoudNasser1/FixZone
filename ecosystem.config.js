module.exports = {
  apps: [
    {
      name: 'fixzone-backend',
      script: './backend/server.js',
      cwd: process.cwd(),
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      // Restart on file changes (only in development)
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },
    {
      name: 'fixzone-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: './frontend/react-app',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};

