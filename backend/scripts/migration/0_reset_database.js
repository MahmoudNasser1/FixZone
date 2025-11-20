#!/usr/bin/env node
/**
 * إعادة تعيين قاعدة البيانات للبدء من جديد
 * Reset Database for Fresh Start
 * 
 * هذا السكريبت يقوم بـ:
 * 1. حذف جميع البيانات من الجداول الرئيسية
 * 2. إعادة تعيين AUTO_INCREMENT
 * 3. الاحتفاظ ببنية الجداول فقط
 * 4. الاستعداد للاستيراد النظيف
 */

const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'FZ'
};

console.log('🔄 بدء إعادة تعيين قاعدة البيانات...\n');

async function resetDatabase() {
  let connection;
  
  try {
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بقاعدة البيانات\n');
    
    // تعطيل فحص المفاتيح الخارجية مؤقتاً
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('⚙️  تم تعطيل فحص المفاتيح الخارجية مؤقتاً\n');
    
    // قائمة الجداول المراد إعادة تعيينها (بالترتيب العكسي للتبعيات)
    const tablesToReset = [
      // جداول الإصلاحات والعلاقات
      'RepairRequestService',
      'RepairStatusHistory',
      'RepairRequest',
      'Device',
      
      // جداول العملاء والشركات
      'Customer',
      'Company',
      
      // جداول القيم المتغيرة
      'VariableOption',
      'VariableCategory',
      
      // جداول المخزون (إذا كنت تريد حذفها)
      // 'InventoryTransaction',
      // 'InventoryItem',
      
      // جداول الخدمات والمدفوعات
      'InvoiceItem',
      'Invoice',
      'Payment',
      'Service',
      
      // جداول المستخدمين والفروع (احذف التعليق إذا أردت حذفها)
      // 'User',
      // 'Branch',
    ];
    
    console.log('📋 الجداول المراد إعادة تعيينها:\n');
    
    for (const table of tablesToReset) {
      try {
        // التحقق من وجود الجدول
        const [tables] = await connection.query(
          'SHOW TABLES LIKE ?',
          [table]
        );
        
        if (tables.length === 0) {
          console.log(`   ⚠️  ${table} - الجدول غير موجود، تخطي...`);
          continue;
        }
        
        // عد السجلات قبل الحذف
        const [countResult] = await connection.query(
          `SELECT COUNT(*) as count FROM \`${table}\``
        );
        const count = countResult[0].count;
        
        // حذف جميع البيانات
        await connection.query(`TRUNCATE TABLE \`${table}\``);
        
        console.log(`   ✅ ${table} - تم حذف ${count} سجل`);
        
      } catch (error) {
        console.log(`   ❌ ${table} - خطأ: ${error.message}`);
      }
    }
    
    // إعادة تفعيل فحص المفاتيح الخارجية
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n⚙️  تم إعادة تفعيل فحص المفاتيح الخارجية\n');
    
    console.log('═'.repeat(50));
    console.log('✅ تم إعادة تعيين قاعدة البيانات بنجاح!');
    console.log('═'.repeat(50));
    console.log('\n🎯 قاعدة البيانات الآن نظيفة وجاهزة للاستيراد!\n');
    console.log('⏭️  الخطوة التالية:');
    console.log('   1. تشغيل سكريبت الاستخراج: node 1_extract_old_data.js');
    console.log('   2. تشغيل سكريبت التحويل: node 2_transform_data.js');
    console.log('   3. استيراد البيانات بالترتيب\n');
    
  } catch (error) {
    console.error('\n❌ خطأ في إعادة تعيين قاعدة البيانات:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ تم إغلاق الاتصال بقاعدة البيانات\n');
    }
  }
}

// تشغيل السكريبت
resetDatabase();

