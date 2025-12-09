// backend/jobs/messagingCronJobs.js
// Cron Jobs للمراسلة التلقائية

const cron = require('node-cron');
const automationService = require('../services/automation.service');

/**
 * Cron Job لتذكيرات الدفع المتأخرة
 * يعمل يومياً الساعة 9 صباحاً
 */
const overduePaymentsJob = cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Starting overdue payments check...');
  try {
    const sentCount = await automationService.checkOverduePayments();
    console.log(`[CRON] ✅ Sent ${sentCount} overdue payment reminders`);
  } catch (error) {
    console.error('[CRON] ❌ Error in overdue payments job:', error);
  }
}, {
  scheduled: false, // لا يبدأ تلقائياً - يجب تفعيله يدوياً
  timezone: 'Africa/Cairo'
});

/**
 * Cron Job لتذكيرات قبل الاستحقاق (3 أيام)
 * يعمل يومياً الساعة 10 صباحاً
 */
const paymentRemindersJob = cron.schedule('0 10 * * *', async () => {
  console.log('[CRON] Starting payment reminders (3 days before due)...');
  try {
    const sentCount = await automationService.sendPaymentReminders();
    console.log(`[CRON] ✅ Sent ${sentCount} payment reminders`);
  } catch (error) {
    console.error('[CRON] ❌ Error in payment reminders job:', error);
  }
}, {
  scheduled: false, // لا يبدأ تلقائياً - يجب تفعيله يدوياً
  timezone: 'Africa/Cairo'
});

/**
 * Cron Job لإعادة محاولة الرسائل الفاشلة
 * يعمل كل 6 ساعات
 */
const retryFailedMessagesJob = cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Starting retry failed messages...');
  try {
    // TODO: تنفيذ آلية إعادة المحاولة (في المرحلة 7)
    console.log('[CRON] Retry mechanism not implemented yet');
  } catch (error) {
    console.error('[CRON] ❌ Error in retry failed messages job:', error);
  }
}, {
  scheduled: false,
  timezone: 'Africa/Cairo'
});

/**
 * تفعيل جميع Cron Jobs
 */
function startAllJobs() {
  console.log('[CRON] Starting messaging cron jobs...');
  
  // التحقق من تفعيل الأتمتة
  automationService.isAutomationEnabled().then(enabled => {
    if (!enabled) {
      console.log('[CRON] ⚠️ Automation is disabled, skipping cron jobs');
      return;
    }

    overduePaymentsJob.start();
    console.log('[CRON] ✅ Overdue payments job started (daily at 9 AM)');
    
    paymentRemindersJob.start();
    console.log('[CRON] ✅ Payment reminders job started (daily at 10 AM)');
    
    // retryFailedMessagesJob.start(); // سيتم تفعيله في المرحلة 7
    // console.log('[CRON] ✅ Retry failed messages job started (every 6 hours)');
  }).catch(err => {
    console.error('[CRON] ❌ Error checking automation status:', err);
  });
}

/**
 * إيقاف جميع Cron Jobs
 */
function stopAllJobs() {
  console.log('[CRON] Stopping messaging cron jobs...');
  overduePaymentsJob.stop();
  paymentRemindersJob.stop();
  retryFailedMessagesJob.stop();
  console.log('[CRON] ✅ All jobs stopped');
}

module.exports = {
  startAllJobs,
  stopAllJobs,
  overduePaymentsJob,
  paymentRemindersJob,
  retryFailedMessagesJob
};



