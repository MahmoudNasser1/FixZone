/**
 * Check Device table columns
 */

const db = require('../db');

async function checkColumns() {
  try {
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Device'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('أعمدة جدول Device:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // التحقق من RepairRequest أيضاً
    const [repairColumns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'RepairRequest'
      AND COLUMN_NAME LIKE '%repair%' OR COLUMN_NAME LIKE '%number%'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nأعمدة جدول RepairRequest (repair/number):');
    repairColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

checkColumns();



