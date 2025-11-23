/**
 * PM2 Ecosystem Configuration
 * Fix Zone ERP - Production Deployment
 */

module.exports = {
  apps: [
    {
      name: 'fixzone-backend',
      script: './backend/server.js',
      cwd: '/var/www/fixzone',
      instances: 2, // عدد الـ instances (موصى به: 2-4 حسب الـ CPU cores)
      exec_mode: 'cluster', // cluster mode للاستفادة من جميع الـ CPU cores
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Logging
      error_file: '/var/www/fixzone/logs/backend-error.log',
      out_file: '/var/www/fixzone/logs/backend-out.log',
      log_file: '/var/www/fixzone/logs/backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto Restart
      autorestart: true,
      watch: false, // false في الإنتاج
      max_memory_restart: '1G', // إعادة التشغيل إذا تجاوزت الذاكرة 1GB
      
      // Advanced
      min_uptime: '10s', // الحد الأدنى للـ uptime قبل اعتبار التطبيق مستقر
      max_restarts: 10, // الحد الأقصى لإعادة التشغيل في 10 ثواني
      restart_delay: 4000, // تأخير 4 ثواني قبل إعادة التشغيل
      
      // Graceful Shutdown
      kill_timeout: 5000, // انتظار 5 ثواني قبل القتل القسري
      listen_timeout: 10000, // انتظار 10 ثواني للاستماع
      
      // Environment Variables
      env_file: './backend/.env',
      
      // Merge logs
      merge_logs: true,
      
      // Source map support
      source_map_support: true
    }
  ],

  // Deployment Configuration (للنشر التلقائي من Git)
  deploy: {
    production: {
      user: 'deploy', // اسم المستخدم على الـ VPS
      host: ['your-vps-ip'], // IP الـ VPS
      ref: 'origin/main', // Branch
      repo: 'git@github.com:your-username/fixzone.git', // Git repository
      path: '/var/www/fixzone', // مسار النشر
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install --production && cd ../frontend/react-app && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};






