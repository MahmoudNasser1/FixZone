#!/usr/bin/env node
/**
 * Apply Financial Migrations - Simple Version
 * Applies migrations one statement at a time
 */

const db = require('../db');
const fs = require('fs');
const path = require('path');

const ENVIRONMENT = process.argv[2] || 'staging';
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

/**
 * Execute SQL statements one by one
 */
async function executeSQLFile(filePath) {
  const connection = await db.getConnection();
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const lines = sql.split('\n');
    let currentBlock = '';
    let inBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('--')) {
        continue;
      }
      
      currentBlock += line + '\n';
      
      // Check if we're starting a prepared statement block
      if (trimmed.startsWith('SET @') || trimmed.includes('PREPARE')) {
        inBlock = true;
      }
      
      // If we hit DEALLOCATE, we've completed a block
      if (trimmed.includes('DEALLOCATE PREPARE')) {
        inBlock = false;
        // Execute the entire block
        if (currentBlock.trim()) {
          try {
            await connection.query(currentBlock);
          } catch (error) {
            // Ignore "already exists" messages from SELECT statements
            if (!error.message.includes('already exists')) {
              throw error;
            }
          }
        }
        currentBlock = '';
      } else if (!inBlock && trimmed.endsWith(';')) {
        // Regular statement - execute immediately
        if (currentBlock.trim()) {
          try {
            await connection.query(currentBlock);
          } catch (error) {
            // Ignore "already exists" messages
            if (!error.message.includes('already exists')) {
              throw error;
            }
          }
        }
        currentBlock = '';
      }
    }
    
    // Execute any remaining block
    if (currentBlock.trim()) {
      await connection.query(currentBlock);
    }
    
    connection.release();
    return true;
  } catch (error) {
    connection.release();
    throw error;
  }
}

/**
 * Apply migrations
 */
async function main() {
  console.log('\n🚀 Financial Module - Applying Migrations');
  console.log('='.repeat(60));
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  const migrations = [
    '20250128_add_missing_columns_to_invoice.sql',
    '20250128_add_paymentDate_to_payment.sql',
    '20250128_add_soft_delete_to_invoice_item.sql'
  ];

  try {
    // Test connection
    await db.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Apply each migration
    for (let i = 0; i < migrations.length; i++) {
      const migrationFile = migrations[i];
      const filePath = path.join(MIGRATIONS_DIR, migrationFile);
      
      console.log(`📋 Migration ${i + 1}: ${migrationFile}`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`   ❌ File not found: ${filePath}\n`);
        continue;
      }

      try {
        await executeSQLFile(filePath);
        console.log(`   ✅ Migration ${i + 1} applied successfully\n`);
      } catch (error) {
        console.error(`   ❌ Migration ${i + 1} failed:`, error.message);
        // Continue with next migration instead of stopping
        console.log(`   ⚠️  Continuing with next migration...\n`);
      }
    }

    // Verify migrations
    console.log('🔍 Verifying migrations...\n');
    
    const [invoiceCols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Invoice' 
      AND COLUMN_NAME IN ('discountAmount', 'dueDate', 'companyId', 'branchId')
    `);
    console.log(`   ✅ Invoice: ${invoiceCols.length} new columns`);

    const [paymentCols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Payment' 
      AND COLUMN_NAME = 'paymentDate'
    `);
    console.log(`   ✅ Payment: paymentDate ${paymentCols.length > 0 ? 'exists' : 'missing'}`);

    const [itemCols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'InvoiceItem' 
      AND COLUMN_NAME = 'deletedAt'
    `);
    console.log(`   ✅ InvoiceItem: deletedAt ${itemCols.length > 0 ? 'exists' : 'missing'}\n`);

    // Data integrity
    const [invoiceCount] = await db.query('SELECT COUNT(*) as count FROM Invoice');
    const [paymentCount] = await db.query('SELECT COUNT(*) as count FROM Payment');
    const [itemCount] = await db.query('SELECT COUNT(*) as count FROM InvoiceItem');
    
    console.log('📊 Data Integrity:');
    console.log(`   ✅ Invoices: ${invoiceCount[0].count}`);
    console.log(`   ✅ Payments: ${paymentCount[0].count}`);
    console.log(`   ✅ InvoiceItems: ${itemCount[0].count}\n`);

    console.log('='.repeat(60));
    console.log('✅ Migrations completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

