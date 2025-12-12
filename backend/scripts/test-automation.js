// backend/scripts/test-automation.js
// Script لاختبار نظام الأتمتة

require('dotenv').config();
const automationService = require('../services/automation.service');
const db = require('../db');

async function testAutomation() {
  try {
    console.log('🧪 اختبار نظام الأتمتة\n');
    console.log('='.repeat(50));

    // 1. التحقق من تفعيل الأتمتة
    console.log('\n1️⃣ التحقق من تفعيل الأتمتة...');
    const isEnabled = await automationService.isAutomationEnabled();
    console.log(`   ${isEnabled ? '✅' : '❌'} الأتمتة: ${isEnabled ? 'مفعلة' : 'معطلة'}`);
    
    if (!isEnabled) {
      console.log('\n⚠️  الأتمتة معطلة. يرجى تفعيلها من الإعدادات أولاً.');
      process.exit(0);
    }

    // 2. الحصول على القنوات الافتراضية
    console.log('\n2️⃣ القنوات الافتراضية...');
    const channels = await automationService.getDefaultChannels();
    console.log(`   ✅ القنوات: ${channels.join(', ')}`);

    // 3. اختبار إشعارات طلبات الإصلاح
    console.log('\n3️⃣ اختبار إشعارات طلبات الإصلاح...');
    
    // جلب طلب إصلاح للاختبار
    const [repairs] = await db.execute(
      `SELECT id, status, customerId FROM RepairRequest 
       WHERE deletedAt IS NULL 
       ORDER BY id DESC 
       LIMIT 1`
    );

    if (repairs.length > 0) {
      const repair = repairs[0];
      console.log(`   📋 طلب الإصلاح: #${repair.id}`);
      console.log(`   📊 الحالة الحالية: ${repair.status}`);
      
      // اختبار تغيير الحالة إلى RECEIVED
      console.log('\n   🔄 اختبار تغيير الحالة إلى RECEIVED...');
      try {
        await automationService.onRepairStatusChange(
          repair.id,
          repair.status,
          'RECEIVED',
          null
        );
        console.log('   ✅ تم إرسال الإشعار بنجاح');
      } catch (error) {
        console.log(`   ⚠️  خطأ: ${error.message}`);
      }
    } else {
      console.log('   ⚠️  لا توجد طلبات إصلاح للاختبار');
    }

    // 4. اختبار إشعارات الفواتير
    console.log('\n4️⃣ اختبار إشعارات الفواتير...');
    
    const [invoices] = await db.execute(
      `SELECT id, customerId FROM Invoice 
       WHERE deletedAt IS NULL 
       ORDER BY id DESC 
       LIMIT 1`
    );

    if (invoices.length > 0) {
      const invoice = invoices[0];
      console.log(`   📋 الفاتورة: #${invoice.id}`);
      
      console.log('\n   🔄 اختبار إشعار إنشاء الفاتورة...');
      try {
        await automationService.onInvoiceCreated(invoice.id, null);
        console.log('   ✅ تم إرسال الإشعار بنجاح');
      } catch (error) {
        console.log(`   ⚠️  خطأ: ${error.message}`);
      }
    } else {
      console.log('   ⚠️  لا توجد فواتير للاختبار');
    }

    // 5. اختبار تذكيرات الدفع
    console.log('\n5️⃣ اختبار تذكيرات الدفع المتأخرة...');
    try {
      const overdueCount = await automationService.checkOverduePayments();
      console.log(`   ✅ تم إرسال ${overdueCount} تذكير للدفعات المتأخرة`);
    } catch (error) {
      console.log(`   ⚠️  خطأ: ${error.message}`);
    }

    // 6. اختبار تذكيرات قبل الاستحقاق
    console.log('\n6️⃣ اختبار تذكيرات قبل الاستحقاق...');
    try {
      const reminderCount = await automationService.sendPaymentReminders();
      console.log(`   ✅ تم إرسال ${reminderCount} تذكير قبل الاستحقاق`);
    } catch (error) {
      console.log(`   ⚠️  خطأ: ${error.message}`);
    }

    // 7. عرض آخر الرسائل المرسلة
    console.log('\n7️⃣ آخر الرسائل المرسلة (آخر 5)...');
    const [logs] = await db.execute(
      `SELECT 
        id, entityType, entityId, channel, status, 
        recipient, sentAt, errorMessage
       FROM MessagingLog 
       ORDER BY createdAt DESC 
       LIMIT 5`
    );

    if (logs.length > 0) {
      logs.forEach((log, index) => {
        console.log(`\n   ${index + 1}. ${log.entityType} #${log.entityId}`);
        console.log(`      القناة: ${log.channel}`);
        console.log(`      الحالة: ${log.status}`);
        console.log(`      المستلم: ${log.recipient}`);
        console.log(`      الوقت: ${log.sentAt || 'لم يُرسل بعد'}`);
        if (log.errorMessage) {
          console.log(`      ⚠️  خطأ: ${log.errorMessage}`);
        }
      });
    } else {
      console.log('   ⚠️  لا توجد رسائل مسجلة');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ انتهى الاختبار\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testAutomation();








