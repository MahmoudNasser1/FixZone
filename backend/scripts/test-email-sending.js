// اختبار إرسال Email
// Usage: node scripts/test-email-sending.js [invoiceId] [email]

const emailService = require('../services/email.service');
const db = require('../db');

async function testEmailSending() {
  try {
    console.log('🧪 اختبار إرسال Email...\n');

    // جلب invoice ID من arguments أو استخدام default
    const invoiceId = process.argv[2] ? parseInt(process.argv[2]) : null;
    const testEmail = process.argv[3] || 'test@example.com';

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
      console.log('\n📤 إرسال Email...');
      const result = await emailService.sendInvoiceEmail(invoice.id, customerEmail, {
        attachPDF: false // سنختبر PDF لاحقاً
      });

      console.log('\n✅ تم الإرسال بنجاح!');
      console.log('📊 النتيجة:');
      console.log(JSON.stringify(result, null, 2));

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
      console.log('\n📤 إرسال Email...');
      const result = await emailService.sendInvoiceEmail(invoice.id, customerEmail, {
        attachPDF: false
      });

      console.log('\n✅ تم الإرسال بنجاح!');
      console.log('📊 النتيجة:');
      console.log(JSON.stringify(result, null, 2));
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
testEmailSending();

