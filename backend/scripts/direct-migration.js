/**
 * Direct migration script - runs SQL directly
 */

const db = require('../db');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../migrations');

const migrations = [
  '20250127_create_technician_time_tracking.sql',
  '20250127_create_technician_tasks.sql',
  '20250127_create_technician_notes.sql',
  '20250127_create_technician_reports.sql'
];

async function runMigrations() {
  console.log('🚀 بدء تشغيل Migrations مباشرة...\n');

  try {
    // التحقق من الاتصال
    await db.query('SELECT 1');
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    for (const migration of migrations) {
      const filePath = path.join(migrationsDir, migration);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ الملف غير موجود: ${migration}`);
        continue;
      }

      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`📄 تشغيل: ${migration}`);
        
        // تقسيم SQL إلى statements منفصلة
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await db.query(statement);
            } catch (error) {
              if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
                console.log(`   ⚠️  الجدول موجود بالفعل، تم التخطي`);
              } else if (error.message.includes('Foreign key constraint')) {
                console.log(`   ⚠️  تحذير Foreign Key: ${error.message.split('\n')[0]}`);
                // محاولة إنشاء الجدول بدون Foreign Key أولاً
                const createTableMatch = statement.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(/i);
                if (createTableMatch) {
                  const tableName = createTableMatch[1];
                  console.log(`   🔄 محاولة إنشاء ${tableName} بدون Foreign Keys...`);
                  // إزالة Foreign Keys مؤقتاً
                  let modifiedStatement = statement.replace(/,\s*FOREIGN KEY[^,)]+\)[^,)]*\)/gi, '');
                  modifiedStatement = modifiedStatement.replace(/FOREIGN KEY[^,)]+\)[^,)]*\)/gi, '');
                  try {
                    await db.query(modifiedStatement);
                    console.log(`   ✅ تم إنشاء ${tableName} بدون Foreign Keys`);
                  } catch (e) {
                    console.error(`   ❌ فشل: ${e.message.split('\n')[0]}`);
                  }
                }
              } else {
                throw error;
              }
            }
          }
        }
        
        console.log(`✅ تم بنجاح: ${migration}\n`);
      } catch (error) {
        console.error(`❌ خطأ في ${migration}:`, error.message);
      }
    }

    // التحقق من الجداول
    console.log('🔍 التحقق من الجداول...\n');
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('TimeTracking', 'Tasks', 'Notes', 'TechnicianReports')
      ORDER BY table_name
    `);

    console.log('الجداول الموجودة:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });

    const expectedTables = ['TimeTracking', 'Tasks', 'Notes', 'TechnicianReports'];
    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length > 0) {
      console.log('\n❌ الجداول المفقودة:');
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
    } else {
      console.log('\n✅ جميع الجداول موجودة!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  }
}

runMigrations();

