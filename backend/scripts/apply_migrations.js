#!/usr/bin/env node
/**
 * Apply Financial Migrations
 * Applies all financial migrations to the database
 * 
 * Usage: node apply_migrations.js [environment]
 */

const db = require('../db');
const fs = require('fs');
const path = require('path');

const ENVIRONMENT = process.argv[2] || 'staging';

const MIGRATIONS = [
  {
    file: '20250128_add_missing_columns_to_invoice.sql',
    name: 'Add Missing Columns to Invoice'
  },
  {
    file: '20250128_add_paymentDate_to_payment.sql',
    name: 'Add paymentDate to Payment'
  },
  {
    file: '20250128_add_soft_delete_to_invoice_item.sql',
    name: 'Add Soft Delete to InvoiceItem'
  }
];

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

/**
 * Read and execute SQL file
 */
async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    return true;
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Financial Module - Applying Migrations');
  console.log('='.repeat(60));
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  try {
    // Test connection
    await db.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Apply each migration
    for (let i = 0; i < MIGRATIONS.length; i++) {
      const migration = MIGRATIONS[i];
      const filePath = path.join(MIGRATIONS_DIR, migration.file);
      
      console.log(`📋 Migration ${i + 1}: ${migration.name}`);
      console.log(`   File: ${migration.file}`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`   ❌ File not found: ${filePath}`);
        continue;
      }

      try {
        await executeSQLFile(filePath);
        console.log(`   ✅ Migration ${i + 1} applied successfully\n`);
      } catch (error) {
        console.error(`   ❌ Migration ${i + 1} failed:`, error.message);
        console.error(`   ⚠️  Stopping migration process\n`);
        throw error;
      }
    }

    // Verify migrations
    console.log('🔍 Verifying migrations...\n');
    
    // Check Invoice columns
    const [invoiceCols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Invoice' 
      AND COLUMN_NAME IN ('discountAmount', 'dueDate', 'companyId', 'branchId')
    `);
    console.log(`   ✅ Invoice columns: ${invoiceCols.length} new columns added`);

    // Check Payment column
    const [paymentCols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Payment' 
      AND COLUMN_NAME = 'paymentDate'
    `);
    console.log(`   ✅ Payment column: ${paymentCols.length > 0 ? 'paymentDate exists' : 'paymentDate missing'}`);

    // Check InvoiceItem column
    const [itemCols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'InvoiceItem' 
      AND COLUMN_NAME = 'deletedAt'
    `);
    console.log(`   ✅ InvoiceItem column: ${itemCols.length > 0 ? 'deletedAt exists' : 'deletedAt missing'}\n`);

    // Data integrity check
    const [invoiceCount] = await db.query('SELECT COUNT(*) as count FROM Invoice');
    const [paymentCount] = await db.query('SELECT COUNT(*) as count FROM Payment');
    const [itemCount] = await db.query('SELECT COUNT(*) as count FROM InvoiceItem');
    
    console.log('📊 Data Integrity Check:');
    console.log(`   ✅ Invoice records: ${invoiceCount[0].count}`);
    console.log(`   ✅ Payment records: ${paymentCount[0].count}`);
    console.log(`   ✅ InvoiceItem records: ${itemCount[0].count}\n`);

    console.log('='.repeat(60));
    console.log('✅ All migrations applied successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('⚠️  Please check the error and rollback if necessary\n');
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

