/**
 * Verify tables exist
 */

const db = require('../db');

async function verify() {
  try {
    // التحقق من جميع الجداول
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY table_name
    `);

    console.log('جميع الجداول في قاعدة البيانات:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // التحقق من الجداول المطلوبة
    const requiredTables = ['TimeTracking', 'Tasks', 'Notes', 'TechnicianReports'];
    console.log('\nالتحقق من الجداول المطلوبة:');
    
    for (const tableName of requiredTables) {
      const exists = tables.some(t => t.table_name === tableName);
      if (exists) {
        console.log(`  ✅ ${tableName} موجود`);
      } else {
        console.log(`  ❌ ${tableName} غير موجود`);
      }
    }

    // محاولة SELECT من كل جدول
    console.log('\nاختبار SELECT من الجداول:');
    for (const tableName of requiredTables) {
      try {
        const [result] = await db.query(`SELECT COUNT(*) as count FROM ??`, [tableName]);
        console.log(`  ✅ ${tableName}: ${result[0].count} صف`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: ${error.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

verify();




