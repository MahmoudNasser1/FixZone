// backend/scripts/test-messaging-system.js
// Script شامل لاختبار نظام المراسلة

const messagingService = require('../services/messaging.service');
const templateService = require('../services/template.service');
const whatsappService = require('../services/whatsapp.service');
const emailService = require('../services/email.service');
const db = require('../db');

const TEST_PHONE = '01113511940'; // الرقم المقدم للاختبار

async function testSystem() {
  console.log('🧪 بدء اختبار شامل لنظام المراسلة...\n');
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Helper function
  const test = (name, fn) => {
    return async () => {
      try {
        await fn();
        results.passed++;
        results.tests.push({ name, status: '✅ PASS', error: null });
        console.log(`✅ ${name}`);
        return true;
      } catch (error) {
        results.failed++;
        results.tests.push({ name, status: '❌ FAIL', error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
        return false;
      }
    };
  };

  // ============================================
  // 1. اختبار Template Service
  // ============================================
  console.log('\n📝 1. اختبار Template Service:');
  console.log('-'.repeat(60));

  await test('Template render - استبدال المتغيرات', async () => {
    const template = 'مرحباً {name}، رقمك {number}';
    const result = templateService.render(template, { name: 'أحمد', number: '123' });
    if (result !== 'مرحباً أحمد، رقمك 123') {
      throw new Error('فشل في استبدال المتغيرات');
    }
  })();

  await test('Template prepareInvoiceVariables', async () => {
    const invoice = {
      id: 999,
      totalAmount: 1000,
      amountPaid: 500,
      currency: 'EGP',
      createdAt: new Date().toISOString(),
      status: 'partial'
    };
    const customer = { firstName: 'أحمد' };
    const variables = await templateService.prepareInvoiceVariables(invoice, customer, []);
    if (!variables.customerName || !variables.invoiceId) {
      throw new Error('فشل في تحضير متغيرات الفاتورة');
    }
  })();

  // ============================================
  // 2. اختبار WhatsApp Service
  // ============================================
  console.log('\n📱 2. اختبار WhatsApp Service:');
  console.log('-'.repeat(60));

  await test('WhatsApp cleanPhoneNumber', async () => {
    const cleaned = whatsappService.cleanPhoneNumber(TEST_PHONE);
    if (cleaned !== '201113511940') {
      throw new Error(`رقم غير صحيح: ${cleaned}`);
    }
  })();

  await test('WhatsApp sendViaWeb - إنشاء رابط', async () => {
    const result = await whatsappService.sendViaWeb(TEST_PHONE, 'Test message');
    if (!result.success || !result.url || !result.url.includes('wa.me')) {
      throw new Error('فشل في إنشاء رابط WhatsApp Web');
    }
    console.log(`   📎 رابط WhatsApp: ${result.url}`);
  })();

  await test('WhatsApp validateSettings', async () => {
    const validation = await whatsappService.validateSettings();
    if (!validation || typeof validation.isValid !== 'boolean') {
      throw new Error('فشل في التحقق من الإعدادات');
    }
    console.log(`   ⚙️  WhatsApp مفعل: ${validation.enabled}`);
    console.log(`   ⚙️  WhatsApp Web: ${validation.webEnabled}`);
    console.log(`   ⚙️  WhatsApp API: ${validation.apiEnabled}`);
  })();

  // ============================================
  // 3. اختبار Messaging Service
  // ============================================
  console.log('\n💬 3. اختبار Messaging Service:');
  console.log('-'.repeat(60));

  await test('Messaging logMessage - تسجيل رسالة', async () => {
    const logId = await messagingService.logMessage({
      entityType: 'invoice',
      entityId: 999999,
      customerId: null,
      channel: 'whatsapp',
      recipient: TEST_PHONE,
      message: 'Test message from automated test',
      template: 'defaultMessage',
      status: 'sent',
      sentBy: null,
      sentAt: new Date(),
      errorMessage: null,
      retryCount: 0,
      metadata: JSON.stringify({ test: true })
    });

    if (!logId || logId <= 0) {
      throw new Error('فشل في تسجيل الرسالة');
    }
    console.log(`   📝 تم تسجيل الرسالة برقم: ${logId}`);

    // حذف السجل الاختباري
    await db.execute('DELETE FROM MessagingLog WHERE id = ?', [logId]);
  })();

  await test('Messaging getMessageLogs - جلب السجل', async () => {
    const result = await messagingService.getMessageLogs({}, { limit: 5, offset: 0 });
    if (!result || !Array.isArray(result.logs)) {
      throw new Error('فشل في جلب السجل');
    }
    console.log(`   📊 عدد الرسائل في السجل: ${result.total}`);
  })();

  await test('Messaging getStats - الإحصائيات', async () => {
    const stats = await messagingService.getStats();
    if (!stats || typeof stats.total !== 'number') {
      throw new Error('فشل في جلب الإحصائيات');
    }
    console.log(`   📈 إجمالي الرسائل: ${stats.total}`);
    console.log(`   ✅ مرسلة: ${stats.sent}`);
    console.log(`   ❌ فاشلة: ${stats.failed}`);
    console.log(`   📊 معدل النجاح: ${stats.successRate}%`);
  })();

  // ============================================
  // 4. اختبار إرسال فعلي (WhatsApp Web)
  // ============================================
  console.log('\n🚀 4. اختبار إرسال فعلي:');
  console.log('-'.repeat(60));

  await test('إرسال رسالة اختبار عبر WhatsApp Web', async () => {
    const testMessage = `🧪 رسالة اختبار من نظام Fix Zone

هذه رسالة اختبار تلقائية من نظام المراسلة.

الوقت: ${new Date().toLocaleString('ar-EG')}
الرقم: ${TEST_PHONE}

إذا وصلتك هذه الرسالة، فالنظام يعمل بشكل صحيح! ✅`;

    const result = await messagingService.sendMessage({
      entityType: 'invoice',
      entityId: 999999,
      customerId: null,
      channels: ['whatsapp'],
      recipient: TEST_PHONE,
      message: testMessage,
      template: null,
      variables: {},
      sentBy: null,
      options: {
        preferAPI: false, // استخدام Web فقط للاختبار
        preferWeb: true
      }
    });

    if (!result.success) {
      throw new Error('فشل في إرسال الرسالة');
    }

    console.log(`   ✅ تم إعداد الرسالة بنجاح`);
    if (result.channels.whatsapp?.url) {
      console.log(`   🔗 رابط WhatsApp Web:`);
      console.log(`      ${result.channels.whatsapp.url}`);
      console.log(`\n   📱 يرجى فتح الرابط أعلاه في المتصفح لإرسال الرسالة`);
    }

    // عرض السجل
    if (result.logs && result.logs.length > 0) {
      const log = result.logs[0];
      console.log(`\n   📝 السجل:`);
      console.log(`      - ID: ${log.id}`);
      console.log(`      - الحالة: ${log.status}`);
      console.log(`      - القناة: ${log.channel}`);
      console.log(`      - المستلم: ${log.recipient}`);
    }
  })();

  // ============================================
  // 5. اختبار قاعدة البيانات
  // ============================================
  console.log('\n💾 5. اختبار قاعدة البيانات:');
  console.log('-'.repeat(60));

  await test('التحقق من جدول MessagingLog', async () => {
    const [tables] = await db.execute("SHOW TABLES LIKE 'MessagingLog'");
    if (tables.length === 0) {
      throw new Error('الجدول غير موجود');
    }

    const [columns] = await db.execute('DESCRIBE MessagingLog');
    console.log(`   ✅ الجدول موجود (${columns.length} عمود)`);
  })();

  await test('التحقق من Indexes', async () => {
    const [indexes] = await db.execute('SHOW INDEXES FROM MessagingLog');
    console.log(`   ✅ عدد Indexes: ${indexes.length}`);
  })();

  // ============================================
  // النتائج النهائية
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 النتائج النهائية:');
  console.log('='.repeat(60));
  console.log(`✅ نجحت: ${results.passed}`);
  console.log(`❌ فشلت: ${results.failed}`);
  console.log(`📊 الإجمالي: ${results.passed + results.failed}`);

  if (results.failed > 0) {
    console.log('\n❌ الاختبارات الفاشلة:');
    results.tests
      .filter(t => t.status === '❌ FAIL')
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
      });
  }

  console.log('\n' + '='.repeat(60));
  if (results.failed === 0) {
    console.log('🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.');
  } else {
    console.log('⚠️  بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
  }
  console.log('='.repeat(60));

  process.exit(results.failed > 0 ? 1 : 0);
}

testSystem().catch(error => {
  console.error('❌ خطأ في الاختبار:', error);
  process.exit(1);
});

