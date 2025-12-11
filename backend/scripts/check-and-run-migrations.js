/**
 * Script to check if tables exist and run migrations if needed
 * Usage: node scripts/check-and-run-migrations.js
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

async function checkTableExists(tableName) {
  try {
    const [result] = await db.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?
    `, [tableName]);
    return result[0].count > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function runMigration(migrationFile) {
  const filePath = path.join(migrationsDir, migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ الملف غير موجود: ${migrationFile}`);
    return false;
  }

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // تقسيم SQL إلى statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📄 تشغيل: ${migrationFile}`);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
        } catch (error) {
          // تجاهل الأخطاء إذا كان الجدول موجود بالفعل
          if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
            console.log(`   ⚠️  الجدول موجود بالفعل، تم التخطي`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log(`✅ تم بنجاح: ${migrationFile}\n`);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في ${migrationFile}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 التحقق من الجداول...\n');

  const tables = {
    'TimeTracking': '20250127_create_technician_time_tracking.sql',
    'Tasks': '20250127_create_technician_tasks.sql',
    'Notes': '20250127_create_technician_notes.sql',
    'TechnicianReports': '20250127_create_technician_reports.sql'
  };

  const missingTables = [];

  for (const [tableName, migrationFile] of Object.entries(tables)) {
    const exists = await checkTableExists(tableName);
    if (!exists) {
      console.log(`❌ الجدول ${tableName} غير موجود`);
      missingTables.push(migrationFile);
    } else {
      console.log(`✅ الجدول ${tableName} موجود`);
    }
  }

  if (missingTables.length === 0) {
    console.log('\n✅ جميع الجداول موجودة!');
    process.exit(0);
  }

  console.log(`\n🚀 بدء تشغيل Migrations للجداول المفقودة...\n`);

  for (const migration of missingTables) {
    await runMigration(migration);
  }

  // التحقق مرة أخرى
  console.log('\n🔍 التحقق النهائي...\n');
  let allExist = true;
  for (const [tableName] of Object.entries(tables)) {
    const exists = await checkTableExists(tableName);
    if (!exists) {
      console.log(`❌ الجدول ${tableName} لا يزال غير موجود`);
      allExist = false;
    } else {
      console.log(`✅ الجدول ${tableName} موجود`);
    }
  }

  if (allExist) {
    console.log('\n✅ تم إنشاء جميع الجداول بنجاح!');
    process.exit(0);
  } else {
    console.log('\n❌ فشل إنشاء بعض الجداول');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ خطأ عام:', error);
  process.exit(1);
});

