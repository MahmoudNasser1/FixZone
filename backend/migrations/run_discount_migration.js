#!/usr/bin/env node

/**
 * Quick Migration Runner for discountPercent column
 * Usage: node run_discount_migration.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ',
  port: process.env.DB_PORT || 3306,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('Running discountPercent migration...', 'cyan');
  
  // Validate environment
  if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
    log('❌ DB_PASSWORD environment variable is required in production!', 'red');
    process.exit(1);
  }

  // Create database connection
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig).promise();
    log('✅ Database connection established', 'green');
  } catch (error) {
    log(`❌ Failed to connect to database: ${error.message}`, 'red');
    process.exit(1);
  }

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'add_discount_percent_to_invoice.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments and split by semicolons
    const statements = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\s*$/));

    log(`Found ${statements.length} statement(s) to execute`, 'cyan');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.query(statement);
        log(`✅ Statement ${i + 1}/${statements.length} executed successfully`, 'green');
      } catch (error) {
        // Check if it's a "duplicate column" error (expected if column already exists)
        if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column name')) {
          log(`⚠️  Column already exists (this is expected if migration was run before)`, 'yellow');
        } else {
          log(`❌ Statement ${i + 1} failed: ${error.message}`, 'red');
          throw error;
        }
      }
    }

    // Verify the column was added
    const [verify] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Invoice'
        AND COLUMN_NAME = 'discountPercent'
    `);

    if (verify.length > 0) {
      log('✅ Migration completed successfully!', 'green');
      log(`Column details: ${JSON.stringify(verify[0], null, 2)}`, 'cyan');
    } else {
      log('⚠️  Migration completed but column not found. Please check manually.', 'yellow');
    }

  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
    log('Database connection closed', 'cyan');
  }
}

// Run the script
main().catch(error => {
  log(`❌ Unhandled error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

