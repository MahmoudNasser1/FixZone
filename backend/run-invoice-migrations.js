require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  const migrations = [
    '20250128_add_missing_columns_to_invoice.sql',
    '20250128_add_paymentDate_to_payment.sql',
    '20250128_add_soft_delete_to_invoice_item.sql'
  ];

  try {
    console.log('🔄 Starting invoice migrations...\n');

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, 'migrations', migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found: ${migrationFile}`);
        continue;
      }

      console.log(`📄 Running migration: ${migrationFile}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by semicolons but keep prepared statements intact
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.query(statement);
          } catch (error) {
            // Ignore "already exists" messages from SELECT statements
            if (error.message.includes('already exists') || 
                error.message.includes('Duplicate column') ||
                error.message.includes('Duplicate key')) {
              console.log(`  ℹ️  ${error.message}`);
            } else {
              throw error;
            }
          }
        }
      }

      console.log(`✅ Completed: ${migrationFile}\n`);
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    process.exit(1);
  } finally {
    if (db && typeof db.end === 'function') {
      await db.end();
    }
  }
}

runMigrations();

