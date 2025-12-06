// backend/scripts/test-send-real-message.js
// اختبار إرسال رسالة فعلية

const messagingService = require('../services/messaging.service');
const templateService = require('../services/template.service');

const TEST_PHONE = '01113511940';

async function sendTestMessage() {
  console.log('🚀 إرسال رسالة اختبار فعلية...\n');
  console.log('='.repeat(60));

  try {
    // تحضير رسالة اختبار
    const testMessage = `🧪 رسالة اختبار من نظام Fix Zone

مرحباً! هذه رسالة اختبار تلقائية من نظام المراسلة.

📋 معلومات الاختبار:
• الوقت: ${new Date().toLocaleString('ar-EG', { 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})}
• الرقم: ${TEST_PHONE}
• النظام: Fix Zone ERP

✅ إذا وصلتك هذه الرسالة، فالنظام يعمل بشكل صحيح!

شكراً لمساعدتك في الاختبار 🎉`;

    console.log('📝 محتوى الرسالة:');
    console.log('-'.repeat(60));
    console.log(testMessage);
    console.log('-'.repeat(60));
    console.log('');

    // إرسال الرسالة
    console.log('📤 جاري إرسال الرسالة...');
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
        preferAPI: false, // استخدام Web فقط
        preferWeb: true
      }
    });

    console.log('\n✅ النتيجة:');
    console.log('-'.repeat(60));

    if (result.success) {
      console.log('✅ تم إعداد الرسالة بنجاح!');
      
      if (result.channels.whatsapp) {
        const whatsappResult = result.channels.whatsapp;
        console.log(`\n📱 القناة: WhatsApp`);
        console.log(`   الطريقة: ${whatsappResult.method || 'web'}`);
        
        if (whatsappResult.url) {
          console.log(`\n🔗 رابط WhatsApp Web:`);
          console.log(`   ${whatsappResult.url}`);
          console.log(`\n📱 يرجى فتح الرابط أعلاه في المتصفح لإرسال الرسالة`);
          console.log(`   (يجب أن يكون WhatsApp Web مفتوحاً في المتصفح)`);
        }
      }

      if (result.logs && result.logs.length > 0) {
        const log = result.logs[0];
        console.log(`\n📝 السجل:`);
        console.log(`   - ID: ${log.id}`);
        console.log(`   - الحالة: ${log.status}`);
        console.log(`   - القناة: ${log.channel}`);
        console.log(`   - المستلم: ${log.recipient}`);
        console.log(`   - وقت الإرسال: ${log.sentAt || 'قيد الانتظار'}`);
      }
    } else {
      console.log('❌ فشل في إرسال الرسالة');
      if (result.channels.whatsapp?.error) {
        console.log(`   الخطأ: ${result.channels.whatsapp.error}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ تم إكمال الاختبار!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ خطأ في الإرسال:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

sendTestMessage();

