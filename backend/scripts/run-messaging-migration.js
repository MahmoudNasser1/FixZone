// backend/scripts/run-messaging-migration.js
// Script لتشغيل Migration لجدول MessagingLog

const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 بدء تشغيل Migration لجدول MessagingLog...\n');

    // قراءة ملف SQL
    const sqlFile = path.join(__dirname, '../migrations/create_messaging_log_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 قراءة ملف Migration...');
    console.log('📝 تنفيذ SQL...\n');

    // تنفيذ SQL
    await db.execute(sql);

    console.log('✅ تم إنشاء جدول MessagingLog بنجاح!\n');

    // التحقق من الجدول
    console.log('🔍 التحقق من الجدول...');
    const [tables] = await db.execute(
      "SHOW TABLES LIKE 'MessagingLog'"
    );

    if (tables.length > 0) {
      console.log('✅ الجدول موجود في قاعدة البيانات\n');

      // عرض بنية الجدول
      const [columns] = await db.execute('DESCRIBE MessagingLog');
      console.log('📊 بنية الجدول:');
      console.table(columns);

      // عرض Indexes
      const [indexes] = await db.execute('SHOW INDEXES FROM MessagingLog');
      console.log('\n📑 Indexes:');
      console.table(indexes.map(idx => ({
        Key_name: idx.Key_name,
        Column_name: idx.Column_name,
        Non_unique: idx.Non_unique
      })));

      console.log('\n🎉 Migration مكتمل بنجاح!');
    } else {
      console.log('❌ خطأ: الجدول غير موجود بعد التنفيذ');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ خطأ في Migration:', error.message);
    
    // إذا كان الجدول موجود بالفعل
    if (error.message.includes('already exists') || error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('\n⚠️  الجدول موجود بالفعل. تخطي...');
      console.log('✅ Migration مكتمل (الجدول موجود مسبقاً)');
    } else {
      console.error('\n❌ فشل Migration');
      process.exit(1);
    }
  } finally {
    // إغلاق الاتصال
    process.exit(0);
  }
}

// تشغيل Migration
runMigration();

