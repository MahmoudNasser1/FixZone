// اختبار إرسال Email مع إعدادات تجريبية
// Usage: node scripts/test-email-with-settings.js [invoiceId] [email]

const emailService = require('../services/email.service');
const db = require('../db');

async function testEmailWithSettings() {
  try {
    console.log('🧪 اختبار إرسال Email مع إعدادات تجريبية...\n');

    // إعدادات Email تجريبية (للاستخدام في الاختبار فقط)
    const testEmailSettings = {
      enabled: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: process.env.TEST_EMAIL_USER || 'test@example.com',
      smtpPassword: process.env.TEST_EMAIL_PASSWORD || 'testpassword',
      fromEmail: process.env.TEST_EMAIL_FROM || 'test@example.com',
      fromName: 'Fix Zone ERP Test',
      defaultSubject: 'فاتورة #{invoiceId} - Fix Zone',
      defaultTemplate: 'مرحباً {customerName}...'
    };

    console.log('⚠️  تحذير: هذا اختبار تجريبي');
    console.log('📧 إعدادات SMTP:');
    console.log(`   Host: ${testEmailSettings.smtpHost}`);
    console.log(`   Port: ${testEmailSettings.smtpPort}`);
    console.log(`   From: ${testEmailSettings.fromEmail}\n`);

    // جلب invoice ID من arguments أو استخدام default
    const invoiceId = process.argv[2] ? parseInt(process.argv[2]) : null;
    const testEmail = process.argv[3] || 'test@example.com';

    // تحديث الإعدادات مؤقتاً للاختبار
    console.log('📝 تحديث إعدادات Email مؤقتاً...');
    const [currentSettingsRow] = await db.execute(
      'SELECT value FROM SystemSetting WHERE `key` = ?',
      ['messaging_settings']
    );
    let messagingSettings = {};
    
    if (currentSettingsRow.length > 0 && currentSettingsRow[0].value) {
      messagingSettings = typeof currentSettingsRow[0].value === 'string' 
        ? JSON.parse(currentSettingsRow[0].value) 
        : currentSettingsRow[0].value;
    }

    messagingSettings.email = testEmailSettings;

    // تحديث الإعدادات في قاعدة البيانات
    const [existing] = await db.execute(
      'SELECT id FROM SystemSetting WHERE `key` = ?',
      ['messaging_settings']
    );

    if (existing.length > 0) {
      await db.execute(
        'UPDATE SystemSetting SET value = ? WHERE `key` = ?',
        [JSON.stringify(messagingSettings), 'messaging_settings']
      );
    } else {
      await db.execute(
        `INSERT INTO SystemSetting (\`key\`, value, description, type) 
         VALUES (?, ?, ?, ?)`,
        [
          'messaging_settings',
          JSON.stringify(messagingSettings),
          'إعدادات المراسلة والإشعارات',
          'JSON'
        ]
      );
    }

    console.log('✅ تم تحديث الإعدادات\n');

    if (!invoiceId) {
      console.log('📋 جلب أول فاتورة متاحة...');
      const [invoices] = await db.execute(
        'SELECT * FROM Invoice WHERE deletedAt IS NULL ORDER BY id DESC LIMIT 1'
      );

      if (invoices.length === 0) {
        throw new Error('لا توجد فواتير في النظام');
      }

      const invoice = invoices[0];
      console.log(`✅ تم العثور على فاتورة #${invoice.id}\n`);

      // جلب بيانات العميل
      let customerEmail = testEmail;
      if (invoice.customerId) {
        const [customers] = await db.execute(
          'SELECT * FROM Customer WHERE id = ?',
          [invoice.customerId]
        );
        if (customers.length > 0 && customers[0].email) {
          customerEmail = customers[0].email;
          console.log(`📧 بريد العميل: ${customerEmail}`);
        } else {
          console.log(`⚠️  لا يوجد بريد للعميل، استخدام: ${customerEmail}`);
        }
      }

      // اختبار إرسال Email
      console.log('📤 إرسال Email...');
      try {
        const result = await emailService.sendInvoiceEmail(invoice.id, customerEmail, {
          attachPDF: false
        });

        console.log('\n✅ تم الإرسال بنجاح!');
        console.log('📊 النتيجة:');
        console.log(JSON.stringify(result, null, 2));
      } catch (emailError) {
        console.error('\n❌ خطأ في إرسال Email:');
        console.error(emailError.message);
        
        if (emailError.message.includes('Invalid login') || emailError.message.includes('Authentication failed')) {
          console.error('\n💡 نصيحة: تحقق من إعدادات SMTP في ملف .env:');
          console.error('   TEST_EMAIL_USER=your-email@gmail.com');
          console.error('   TEST_EMAIL_PASSWORD=your-app-password');
          console.error('   TEST_EMAIL_FROM=your-email@gmail.com');
        }
        
        throw emailError;
      }

    } else {
      console.log(`📋 استخدام فاتورة #${invoiceId}...`);
      
      // جلب بيانات الفاتورة
      const [invoices] = await db.execute(
        'SELECT * FROM Invoice WHERE id = ? AND deletedAt IS NULL',
        [invoiceId]
      );

      if (invoices.length === 0) {
        throw new Error(`الفاتورة #${invoiceId} غير موجودة`);
      }

      const invoice = invoices[0];
      console.log(`✅ تم العثور على فاتورة #${invoice.id}\n`);

      // جلب بيانات العميل
      let customerEmail = testEmail;
      if (invoice.customerId) {
        const [customers] = await db.execute(
          'SELECT * FROM Customer WHERE id = ?',
          [invoice.customerId]
        );
        if (customers.length > 0 && customers[0].email) {
          customerEmail = customers[0].email;
          console.log(`📧 بريد العميل: ${customerEmail}`);
        } else {
          console.log(`⚠️  لا يوجد بريد للعميل، استخدام: ${testEmail}`);
        }
      }

      // اختبار إرسال Email
      console.log('📤 إرسال Email...');
      try {
        const result = await emailService.sendInvoiceEmail(invoice.id, customerEmail, {
          attachPDF: false
        });

        console.log('\n✅ تم الإرسال بنجاح!');
        console.log('📊 النتيجة:');
        console.log(JSON.stringify(result, null, 2));
      } catch (emailError) {
        console.error('\n❌ خطأ في إرسال Email:');
        console.error(emailError.message);
        
        if (emailError.message.includes('Invalid login') || emailError.message.includes('Authentication failed')) {
          console.error('\n💡 نصيحة: تحقق من إعدادات SMTP في ملف .env:');
          console.error('   TEST_EMAIL_USER=your-email@gmail.com');
          console.error('   TEST_EMAIL_PASSWORD=your-app-password');
          console.error('   TEST_EMAIL_FROM=your-email@gmail.com');
        }
        
        throw emailError;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:');
    console.error(error.message);
    console.error('\n📋 Stack Trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// تشغيل الاختبار
testEmailWithSettings();
