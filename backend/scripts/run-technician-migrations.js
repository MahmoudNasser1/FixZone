/**
 * Script to run technician module migrations
 * Usage: node scripts/run-technician-migrations.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');

const migrationsDir = path.join(__dirname, '../migrations');

const migrations = [
  '20250127_create_technician_time_tracking.sql',
  '20250127_create_technician_tasks.sql',
  '20250127_create_technician_notes.sql',
  '20250127_create_technician_reports.sql'
];

async function runMigrations() {
  console.log('🚀 بدء تشغيل Migrations لمودول الفنيين...\n');

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ الملف غير موجود: ${migration}`);
      continue;
    }

    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // تقسيم SQL إلى statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📄 تشغيل: ${migration}`);

      for (const statement of statements) {
        if (statement.trim()) {
          await db.query(statement);
        }
      }

      console.log(`✅ تم بنجاح: ${migration}\n`);
    } catch (error) {
      console.error(`❌ خطأ في ${migration}:`, error.message);
      console.error(error);
      process.exit(1);
    }
  }

  console.log('✅ تم تشغيل جميع Migrations بنجاح!');
  process.exit(0);
}

runMigrations().catch(error => {
  console.error('❌ خطأ عام:', error);
  process.exit(1);
});

