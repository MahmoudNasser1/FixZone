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

    await db.query(
      `ALTER TABLE User 
       ADD COLUMN IF NOT EXISTS forcePasswordReset TINYINT(1) NOT NULL DEFAULT 0 
       AFTER deletedAt`
    );

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

