// backend/scripts/schedule-auto-backup.js
/**
 * Schedule automatic database backups
 * Runs daily backups at 2 AM
 */

const cron = require('node-cron');
const databaseBackupService = require('../services/database/databaseBackupService');

// Schedule daily backup at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Starting scheduled daily backup...');
  try {
    const backup = await databaseBackupService.createBackup({
      name: `Auto Backup ${new Date().toLocaleDateString('ar-EG')}`,
      description: 'نسخة احتياطية تلقائية يومية',
      compress: true,
      userId: null // System user
    });
    console.log(`✅ Scheduled backup completed: ${backup.name}`);
    
    // Cleanup old backups (keep last 30 days)
    await databaseBackupService.cleanupOldBackups(30);
  } catch (error) {
    console.error('❌ Scheduled backup failed:', error.message);
  }
});

// Schedule weekly backup on Sunday at 1 AM
cron.schedule('0 1 * * 0', async () => {
  console.log('🔄 Starting scheduled weekly backup...');
  try {
    const backup = await databaseBackupService.createBackup({
      name: `Weekly Backup ${new Date().toLocaleDateString('ar-EG')}`,
      description: 'نسخة احتياطية أسبوعية',
      compress: true,
      userId: null
    });
    console.log(`✅ Scheduled weekly backup completed: ${backup.name}`);
  } catch (error) {
    console.error('❌ Scheduled weekly backup failed:', error.message);
  }
});

console.log('✅ Automatic backup scheduler started');
console.log('   - Daily backups: 2:00 AM');
console.log('   - Weekly backups: Sunday 1:00 AM');

// Keep process alive
process.stdin.resume();

