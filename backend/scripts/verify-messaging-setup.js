// backend/scripts/verify-messaging-setup.js
// Script للتحقق من أن كل شيء جاهز

const db = require('../db');
const messagingService = require('../services/messaging.service');
const templateService = require('../services/template.service');
const whatsappService = require('../services/whatsapp.service');
const emailService = require('../services/email.service');

async function verifySetup() {
  console.log('🔍 التحقق من إعداد نظام المراسلة...\n');
  
  let allGood = true;
  const checks = [];

  // 1. التحقق من جدول MessagingLog
  try {
    const [tables] = await db.execute("SHOW TABLES LIKE 'MessagingLog'");
    if (tables.length > 0) {
      const [columns] = await db.execute('DESCRIBE MessagingLog');
      checks.push({ name: 'جدول MessagingLog', status: '✅', details: `${columns.length} عمود` });
    } else {
      checks.push({ name: 'جدول MessagingLog', status: '❌', details: 'غير موجود' });
      allGood = false;
    }
  } catch (error) {
    checks.push({ name: 'جدول MessagingLog', status: '❌', details: error.message });
    allGood = false;
  }

  // 2. التحقق من الإعدادات
  try {
    const [settings] = await db.execute(
      'SELECT value FROM SystemSetting WHERE `key` = ?',
      ['messaging_settings']
    );
    if (settings.length > 0) {
      const parsed = JSON.parse(settings[0].value);
      checks.push({ 
        name: 'إعدادات المراسلة', 
        status: '✅', 
        details: `WhatsApp: ${parsed.whatsapp?.enabled ? 'مفعل' : 'معطل'}, Email: ${parsed.email?.enabled ? 'مفعل' : 'معطل'}` 
      });
    } else {
      checks.push({ name: 'إعدادات المراسلة', status: '❌', details: 'غير موجودة' });
      allGood = false;
    }
  } catch (error) {
    checks.push({ name: 'إعدادات المراسلة', status: '❌', details: error.message });
    allGood = false;
  }

  // 3. التحقق من Services
  try {
    const testTemplate = templateService.render('مرحباً {name}', { name: 'Test' });
    if (testTemplate === 'مرحباً Test') {
      checks.push({ name: 'Template Service', status: '✅', details: 'يعمل بشكل صحيح' });
    } else {
      checks.push({ name: 'Template Service', status: '❌', details: 'فشل في الاختبار' });
      allGood = false;
    }
  } catch (error) {
    checks.push({ name: 'Template Service', status: '❌', details: error.message });
    allGood = false;
  }

  try {
    const cleanPhone = whatsappService.cleanPhoneNumber('01234567890');
    if (cleanPhone === '201234567890') {
      checks.push({ name: 'WhatsApp Service', status: '✅', details: 'يعمل بشكل صحيح' });
    } else {
      checks.push({ name: 'WhatsApp Service', status: '❌', details: 'فشل في الاختبار' });
      allGood = false;
    }
  } catch (error) {
    checks.push({ name: 'WhatsApp Service', status: '❌', details: error.message });
    allGood = false;
  }

  // 4. التحقق من Routes
  try {
    const messagingRouter = require('../routes/messaging');
    if (messagingRouter) {
      checks.push({ name: 'Messaging Routes', status: '✅', details: 'موجود ومربوط' });
    } else {
      checks.push({ name: 'Messaging Routes', status: '❌', details: 'غير موجود' });
      allGood = false;
    }
  } catch (error) {
    checks.push({ name: 'Messaging Routes', status: '❌', details: error.message });
    allGood = false;
  }

  // 5. اختبار تسجيل رسالة
  try {
    const logId = await messagingService.logMessage({
      entityType: 'invoice',
      entityId: 999999,
      customerId: null,
      channel: 'whatsapp',
      recipient: 'test-verification@example.com',
      message: 'Test verification message',
      template: null,
      status: 'sent',
      sentBy: null,
      sentAt: new Date(),
      errorMessage: null,
      retryCount: 0,
      metadata: '{}'
    });

    if (logId) {
      // حذف السجل الاختباري
      await db.execute('DELETE FROM MessagingLog WHERE id = ?', [logId]);
      checks.push({ name: 'تسجيل الرسائل', status: '✅', details: 'يعمل بشكل صحيح' });
    } else {
      checks.push({ name: 'تسجيل الرسائل', status: '❌', details: 'فشل في التسجيل' });
      allGood = false;
    }
  } catch (error) {
    checks.push({ name: 'تسجيل الرسائل', status: '❌', details: error.message });
    allGood = false;
  }

  // عرض النتائج
  console.log('📊 نتائج التحقق:\n');
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.details}`);
  });

  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('✅ جميع الفحوصات نجحت! النظام جاهز للاستخدام.');
    console.log('='.repeat(50));
    process.exit(0);
  } else {
    console.log('❌ بعض الفحوصات فشلت. يرجى مراجعة الأخطاء أعلاه.');
    console.log('='.repeat(50));
    process.exit(1);
  }
}

verifySetup().catch(error => {
  console.error('❌ خطأ في التحقق:', error);
  process.exit(1);
});

