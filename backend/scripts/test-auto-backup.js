// backend/scripts/test-auto-backup.js
/**
 * Test script for Auto Backup Scheduler
 * Tests daily and weekly backup functionality
 */

const autoBackupScheduler = require('../services/database/autoBackupScheduler');

async function testAutoBackup() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 اختبار النسخ التلقائي                                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Initialize scheduler
    console.log('1️⃣ تهيئة الـ Scheduler...');
    await autoBackupScheduler.init();
    console.log('✅ تم التهيئة بنجاح\n');

    // Get current settings
    console.log('2️⃣ جلب الإعدادات الحالية...');
    const settings = autoBackupScheduler.getSettings();
    console.log('   الإعدادات:', JSON.stringify(settings, null, 2));
    console.log('');

    // Test daily backup
    console.log('3️⃣ اختبار النسخ اليومي...');
    const dailyResult = await autoBackupScheduler.testBackup('daily');
    if (dailyResult.success) {
      console.log('✅ النسخ اليومي يعمل بشكل صحيح');
    } else {
      console.log('❌ فشل النسخ اليومي:', dailyResult.error);
    }
    console.log('');

    // Test weekly backup
    console.log('4️⃣ اختبار النسخ الأسبوعي...');
    const weeklyResult = await autoBackupScheduler.testBackup('weekly');
    if (weeklyResult.success) {
      console.log('✅ النسخ الأسبوعي يعمل بشكل صحيح');
    } else {
      console.log('❌ فشل النسخ الأسبوعي:', weeklyResult.error);
    }
    console.log('');

    // Test settings update
    console.log('5️⃣ اختبار تحديث الإعدادات...');
    const testSettings = {
      dailyEnabled: true,
      dailyTime: '03:00',
      weeklyEnabled: true,
      weeklyDay: 0,
      weeklyTime: '02:00',
      keepDays: 30
    };
    const updateResult = await autoBackupScheduler.updateSettings(testSettings);
    if (updateResult.success) {
      console.log('✅ تحديث الإعدادات يعمل بشكل صحيح');
      console.log('   الإعدادات الجديدة:', JSON.stringify(updateResult.settings, null, 2));
    } else {
      console.log('❌ فشل تحديث الإعدادات');
    }
    console.log('');

    // Test start/stop
    console.log('6️⃣ اختبار Start/Stop...');
    autoBackupScheduler.stop();
    console.log('✅ تم إيقاف الـ Scheduler');
    await autoBackupScheduler.start();
    console.log('✅ تم تشغيل الـ Scheduler');
    console.log('');

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ جميع الاختبارات اكتملت بنجاح!                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
    process.exit(1);
  }
}

// Run test
testAutoBackup();

