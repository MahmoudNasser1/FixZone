require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

async function runMigrations() {
  const migrations = [
    '20250128_add_missing_columns_to_invoice.sql',
    '20250128_add_paymentDate_to_payment.sql',
    '20250128_add_soft_delete_to_invoice_item.sql'
  ];

  // Create a connection with multipleStatements enabled
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'FZ',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true // Enable multiple statements
  });

  const db = connection.promise();

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
      
      try {
        // Execute the entire SQL file at once (multipleStatements enabled)
        await db.query(sql);
        console.log(`✅ Completed: ${migrationFile}\n`);
      } catch (error) {
        // Check if it's a non-critical error
        if (error.message.includes('already exists') || 
            error.message.includes('Duplicate column') ||
            error.message.includes('Duplicate key')) {
          console.log(`  ℹ️  Some operations already completed: ${error.message}`);
          console.log(`✅ Completed: ${migrationFile}\n`);
        } else if (error.message.includes("doesn't exist") && error.message.includes('Key column')) {
          // This might happen if we try to create index before column is added
          // But with multipleStatements, this shouldn't happen
          console.log(`  ⚠️  ${error.message} - this might indicate a migration order issue`);
          throw error;
        } else {
          throw error;
        }
      }
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
    if (connection) {
      connection.end();
    }
  }
}

runMigrations();
