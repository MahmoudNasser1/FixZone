// backend/services/database/autoBackupScheduler.js
/**
 * Auto Backup Scheduler Service
 * Manages scheduled automatic database backups
 */

const cron = require('node-cron');
const databaseBackupService = require('./databaseBackupService');
const settingsRepository = require('../../repositories/settingsRepository');

class AutoBackupScheduler {
  constructor() {
    this.dailyJob = null;
    this.weeklyJob = null;
    this.isEnabled = false;
    this.settings = {
      dailyEnabled: false,
      dailyTime: '02:00', // 2 AM
      weeklyEnabled: false,
      weeklyDay: 0, // Sunday
      weeklyTime: '01:00', // 1 AM
      keepDays: 30
    };
  }

  /**
   * Initialize scheduler from settings
   */
  async init() {
    try {
      // Load settings from database
      const dailyEnabled = await this.getSetting('auto_backup.daily.enabled', false);
      const dailyTime = await this.getSetting('auto_backup.daily.time', '02:00');
      const weeklyEnabled = await this.getSetting('auto_backup.weekly.enabled', false);
      const weeklyDay = await this.getSetting('auto_backup.weekly.day', 0);
      const weeklyTime = await this.getSetting('auto_backup.weekly.time', '01:00');
      const keepDays = await this.getSetting('auto_backup.keep_days', 30);

      this.settings = {
        dailyEnabled: dailyEnabled === 'true' || dailyEnabled === true,
        dailyTime,
        weeklyEnabled: weeklyEnabled === 'true' || weeklyEnabled === true,
        weeklyDay: parseInt(weeklyDay) || 0,
        weeklyTime,
        keepDays: parseInt(keepDays) || 30
      };

      // Start scheduler if enabled
      if (this.settings.dailyEnabled || this.settings.weeklyEnabled) {
        await this.start();
      }

      console.log('✅ Auto Backup Scheduler initialized');
      console.log(`   Daily: ${this.settings.dailyEnabled ? `Enabled (${this.settings.dailyTime})` : 'Disabled'}`);
      console.log(`   Weekly: ${this.settings.weeklyEnabled ? `Enabled (${this.getDayName(this.settings.weeklyDay)} ${this.settings.weeklyTime})` : 'Disabled'}`);
    } catch (error) {
      console.error('Error initializing Auto Backup Scheduler:', error);
    }
  }

  /**
   * Get setting value
   */
  async getSetting(key, defaultValue) {
    try {
      const setting = await settingsRepository.findByKey(key);
      if (setting) {
        return setting.value;
      }
      return defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Update setting value
   */
  async updateSetting(key, value) {
    try {
      const existing = await settingsRepository.findByKey(key);
      if (existing) {
        await settingsRepository.update(key, { value: String(value) });
      } else {
        await settingsRepository.create({
          key,
          value: String(value),
          type: 'string',
          category: 'system',
          description: `Auto backup setting: ${key}`
        });
      }
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
    }
  }

  /**
   * Start scheduler
   */
  async start() {
    if (this.isEnabled) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    // Stop existing jobs
    this.stop();

    // Schedule daily backup
    if (this.settings.dailyEnabled) {
      const [hours, minutes] = this.settings.dailyTime.split(':');
      const cronExpression = `${minutes} ${hours} * * *`;
      
      this.dailyJob = cron.schedule(cronExpression, async () => {
        await this.runDailyBackup();
      }, {
        scheduled: true,
        timezone: 'Africa/Cairo'
      });

      console.log(`✅ Daily backup scheduled: ${this.settings.dailyTime}`);
    }

    // Schedule weekly backup
    if (this.settings.weeklyEnabled) {
      const [hours, minutes] = this.settings.weeklyTime.split(':');
      const cronExpression = `${minutes} ${hours} * * ${this.settings.weeklyDay}`;
      
      this.weeklyJob = cron.schedule(cronExpression, async () => {
        await this.runWeeklyBackup();
      }, {
        scheduled: true,
        timezone: 'Africa/Cairo'
      });

      console.log(`✅ Weekly backup scheduled: ${this.getDayName(this.settings.weeklyDay)} ${this.settings.weeklyTime}`);
    }

    this.isEnabled = true;
  }

  /**
   * Stop scheduler
   */
  stop() {
    if (this.dailyJob) {
      this.dailyJob.stop();
      this.dailyJob = null;
    }
    if (this.weeklyJob) {
      this.weeklyJob.stop();
      this.weeklyJob = null;
    }
    this.isEnabled = false;
    console.log('⏸️ Auto Backup Scheduler stopped');
  }

  /**
   * Run daily backup
   */
  async runDailyBackup() {
    try {
      console.log('🔄 Starting scheduled daily backup...');
      const backup = await databaseBackupService.createBackup({
        name: `Auto Daily Backup ${new Date().toLocaleDateString('ar-EG')}`,
        description: 'نسخة احتياطية تلقائية يومية',
        compress: true,
        userId: null
      });
      console.log(`✅ Daily backup completed: ${backup.name}`);
    } catch (error) {
      console.error('❌ Daily backup failed:', error.message);
    }
  }

  /**
   * Run weekly backup
   */
  async runWeeklyBackup() {
    try {
      console.log('🔄 Starting scheduled weekly backup...');
      const backup = await databaseBackupService.createBackup({
        name: `Auto Weekly Backup ${new Date().toLocaleDateString('ar-EG')}`,
        description: 'نسخة احتياطية أسبوعية',
        compress: true,
        userId: null
      });
      console.log(`✅ Weekly backup completed: ${backup.name}`);
      
      // Cleanup old backups
      await databaseBackupService.cleanupOldBackups(this.settings.keepDays);
    } catch (error) {
      console.error('❌ Weekly backup failed:', error.message);
    }
  }

  /**
   * Update settings and restart scheduler
   */
  async updateSettings(newSettings) {
    try {
      // Update settings
      if (newSettings.dailyEnabled !== undefined) {
        this.settings.dailyEnabled = newSettings.dailyEnabled;
        await this.updateSetting('auto_backup.daily.enabled', newSettings.dailyEnabled);
      }
      if (newSettings.dailyTime !== undefined) {
        this.settings.dailyTime = newSettings.dailyTime;
        await this.updateSetting('auto_backup.daily.time', newSettings.dailyTime);
      }
      if (newSettings.weeklyEnabled !== undefined) {
        this.settings.weeklyEnabled = newSettings.weeklyEnabled;
        await this.updateSetting('auto_backup.weekly.enabled', newSettings.weeklyEnabled);
      }
      if (newSettings.weeklyDay !== undefined) {
        this.settings.weeklyDay = newSettings.weeklyDay;
        await this.updateSetting('auto_backup.weekly.day', newSettings.weeklyDay);
      }
      if (newSettings.weeklyTime !== undefined) {
        this.settings.weeklyTime = newSettings.weeklyTime;
        await this.updateSetting('auto_backup.weekly.time', newSettings.weeklyTime);
      }
      if (newSettings.keepDays !== undefined) {
        this.settings.keepDays = newSettings.keepDays;
        await this.updateSetting('auto_backup.keep_days', newSettings.keepDays);
      }

      // Restart scheduler
      this.stop();
      if (this.settings.dailyEnabled || this.settings.weeklyEnabled) {
        await this.start();
      }

      return { success: true, settings: this.settings };
    } catch (error) {
      console.error('Error updating scheduler settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      ...this.settings,
      isEnabled: this.isEnabled,
      dailyJobRunning: this.dailyJob !== null,
      weeklyJobRunning: this.weeklyJob !== null
    };
  }

  /**
   * Get day name
   */
  getDayName(day) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[day] || 'الأحد';
  }

  /**
   * Test backup (manual trigger)
   */
  async testBackup(type = 'daily') {
    try {
      if (type === 'daily') {
        await this.runDailyBackup();
      } else if (type === 'weekly') {
        await this.runWeeklyBackup();
      }
      return { success: true, message: `${type} backup test completed` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AutoBackupScheduler();

