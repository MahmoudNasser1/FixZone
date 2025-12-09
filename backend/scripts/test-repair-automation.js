// Script لاختبار إشعارات طلبات الإصلاح
require('dotenv').config();
const automationService = require('../services/automation.service');
const db = require('../db');

async function testRepairAutomation() {
  try {
    console.log('🧪 اختبار إشعارات طلبات الإصلاح\n');
    console.log('='.repeat(50));

    // 1. التحقق من تفعيل الأتمتة
    console.log('\n1️⃣ التحقق من تفعيل الأتمتة...');
    const isEnabled = await automationService.isAutomationEnabled();
    console.log(`   ${isEnabled ? '✅' : '❌'} الأتمتة: ${isEnabled ? 'مفعلة' : 'معطلة'}`);
    
    if (!isEnabled) {
      console.log('\n⚠️  الأتمتة معطلة. يرجى تفعيلها من الإعدادات أولاً.');
      process.exit(0);
    }

    // 2. جلب طلب إصلاح للاختبار
    console.log('\n2️⃣ جلب طلب إصلاح للاختبار...');
    const [repairs] = await db.execute(
      `SELECT 
        r.id,
        r.status,
        r.customerId,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail
      FROM RepairRequest r
      LEFT JOIN Customer c ON r.customerId = c.id
      WHERE r.deletedAt IS NULL 
        AND (c.phone IS NOT NULL OR c.email IS NOT NULL)
      ORDER BY r.id DESC 
      LIMIT 1`
    );

    if (repairs.length === 0) {
      console.log('   ⚠️  لا توجد طلبات إصلاح للاختبار');
      process.exit(0);
    }

    const repair = repairs[0];
    console.log(`   📋 طلب الإصلاح: #${repair.id}`);
    console.log(`   📊 الحالة الحالية: ${repair.status}`);
    console.log(`   👤 العميل: ${repair.customerName}`);
    console.log(`   📞 الهاتف: ${repair.customerPhone || 'غير متوفر'}`);
    console.log(`   📧 البريد: ${repair.customerEmail || 'غير متوفر'}`);

    // 3. اختبار تغيير الحالة إلى WAITING_PARTS
    console.log('\n3️⃣ اختبار تغيير الحالة إلى WAITING_PARTS...');
    try {
      await automationService.onRepairStatusChange(
        repair.id,
        repair.status,
        'WAITING_PARTS',
        null
      );
      console.log('   ✅ تم استدعاء automation service');
    } catch (error) {
      console.log(`   ❌ خطأ: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    }

    // 4. اختبار تغيير الحالة إلى UNDER_REPAIR
    console.log('\n4️⃣ اختبار تغيير الحالة إلى UNDER_REPAIR...');
    try {
      await automationService.onRepairStatusChange(
        repair.id,
        'WAITING_PARTS',
        'UNDER_REPAIR',
        null
      );
      console.log('   ✅ تم استدعاء automation service');
    } catch (error) {
      console.log(`   ❌ خطأ: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    }

    // 5. عرض آخر الرسائل المرسلة
    console.log('\n5️⃣ آخر الرسائل المرسلة (آخر 5)...');
    const [logs] = await db.execute(
      `SELECT 
        id, entityType, entityId, channel, status, 
        recipient, sentAt, errorMessage, createdAt
       FROM MessagingLog 
       WHERE entityType = 'repair' 
         AND entityId = ?
       ORDER BY createdAt DESC 
       LIMIT 5`,
      [repair.id]
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
      console.log('   ⚠️  لا توجد رسائل مسجلة لهذا الطلب');
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

testRepairAutomation();





