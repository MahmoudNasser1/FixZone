require('dotenv').config();
const db = require('./db');

async function runMigration() {
  try {
    console.log('🔄 Running migration: add forcePasswordReset column...');
    console.log('📊 DB Config:', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'FZ',
      user: process.env.DB_USER || 'root'
    });

    // Check if column exists first
    const [columns] = await db.query(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'User' 
         AND COLUMN_NAME = 'forcePasswordReset'`,
      [process.env.DB_NAME || 'FZ']
    );

    if (columns[0].count === 0) {
      await db.query(
        `ALTER TABLE User 
         ADD COLUMN forcePasswordReset TINYINT(1) NOT NULL DEFAULT 0 
         AFTER deletedAt`
      );
      console.log('✅ Column added successfully!');
    } else {
      console.log('ℹ️  Column already exists, skipping...');
    }

    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists, skipping...');
      process.exit(0);
    }
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    process.exit(1);
  } finally {
    await db.end();
  }
}

runMigration();

