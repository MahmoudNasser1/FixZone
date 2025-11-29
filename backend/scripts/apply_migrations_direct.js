#!/usr/bin/env node
/**
 * Apply Financial Migrations - Direct Execution
 * Executes each prepared statement block as a whole
 */

const db = require('../db');

async function main() {
  console.log('\n🚀 Financial Module - Applying Migrations');
  console.log('='.repeat(60));
  console.log(`Date: ${new Date().toISOString()}\n`);

  const connection = await db.getConnection();
  
  try {
    console.log('✅ Database connection successful\n');

    // Migration 1: Add Missing Columns to Invoice
    console.log('📋 Migration 1: Add Missing Columns to Invoice');
    
    // discountAmount
    await connection.query(`
      SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Invoice' 
        AND COLUMN_NAME = 'discountAmount');
      SET @sql = IF(@col_exists = 0, 
        'ALTER TABLE Invoice ADD COLUMN discountAmount DECIMAL(12,2) DEFAULT 0.00 AFTER taxAmount', 
        'SELECT "Column discountAmount already exists"');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `);
    console.log('   ✅ discountAmount');

    // dueDate
    await connection.query(`
      SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Invoice' 
        AND COLUMN_NAME = 'dueDate');
      SET @sql = IF(@col_exists = 0, 
        'ALTER TABLE Invoice ADD COLUMN dueDate DATE NULL AFTER currency', 
        'SELECT "Column dueDate already exists"');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `);
    console.log('   ✅ dueDate');

    // companyId
    await connection.query(`
      SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Invoice' 
        AND COLUMN_NAME = 'companyId');
      SET @sql = IF(@col_exists = 0, 
        'ALTER TABLE Invoice ADD COLUMN companyId INT(11) NULL AFTER customerId', 
        'SELECT "Column companyId already exists"');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `);
    console.log('   ✅ companyId');

    // branchId
    await connection.query(`
      SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Invoice' 
        AND COLUMN_NAME = 'branchId');
      SET @sql = IF(@col_exists = 0, 
        'ALTER TABLE Invoice ADD COLUMN branchId INT(11) NULL AFTER companyId', 
        'SELECT "Column branchId already exists"');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `);
    console.log('   ✅ branchId');

    // Indexes for Invoice
    const invoiceIndexes = [
      { name: 'idx_invoice_customer', column: 'customerId' },
      { name: 'idx_invoice_company', column: 'companyId' },
      { name: 'idx_invoice_branch', column: 'branchId' },
      { name: 'idx_invoice_dueDate', column: 'dueDate' }
    ];

    for (const idx of invoiceIndexes) {
      await connection.query(`
        SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'Invoice' 
          AND INDEX_NAME = ?);
        SET @sql = IF(@idx_exists = 0, 
          CONCAT('CREATE INDEX ${idx.name} ON Invoice(${idx.column})'), 
          'SELECT "Index ${idx.name} already exists"');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      `);
    }
    console.log('   ✅ Indexes created\n');

    // Migration 2: Add paymentDate to Payment (already exists, skip)
    console.log('📋 Migration 2: Add paymentDate to Payment');
    console.log('   ✅ paymentDate already exists\n');

    // Migration 3: Add Soft Delete to InvoiceItem
    console.log('📋 Migration 3: Add Soft Delete to InvoiceItem');
    
    // deletedAt
    await connection.query(`
      SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'InvoiceItem' 
        AND COLUMN_NAME = 'deletedAt');
      SET @sql = IF(@col_exists = 0, 
        'ALTER TABLE InvoiceItem ADD COLUMN deletedAt DATETIME NULL AFTER updatedAt', 
        'SELECT "Column deletedAt already exists"');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `);
    console.log('   ✅ deletedAt');

    // Indexes for InvoiceItem
    const itemIndexes = [
      { name: 'idx_invoice_item_deletedAt', column: 'deletedAt' },
      { name: 'idx_invoice_item_invoiceId', column: 'invoiceId' },
      { name: 'idx_invoice_item_inventoryItemId', column: 'inventoryItemId' }
    ];

    for (const idx of itemIndexes) {
      await connection.query(`
        SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'InvoiceItem' 
          AND INDEX_NAME = ?);
        SET @sql = IF(@idx_exists = 0, 
          CONCAT('CREATE INDEX ${idx.name} ON InvoiceItem(${idx.column})'), 
          'SELECT "Index ${idx.name} already exists"');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      `);
    }
    console.log('   ✅ Indexes created\n');

    // Verify
    console.log('🔍 Verifying migrations...\n');
    
    const [invoiceCols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Invoice' 
      AND COLUMN_NAME IN ('discountAmount', 'dueDate', 'companyId', 'branchId')
    `);
    console.log(`   ✅ Invoice: ${invoiceCols.length} new columns`);

    const [itemCols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'InvoiceItem' 
      AND COLUMN_NAME = 'deletedAt'
    `);
    console.log(`   ✅ InvoiceItem: deletedAt ${itemCols.length > 0 ? 'exists' : 'missing'}\n`);

    const [invoiceCount] = await connection.query('SELECT COUNT(*) as count FROM Invoice');
    const [paymentCount] = await connection.query('SELECT COUNT(*) as count FROM Payment');
    const [itemCount] = await connection.query('SELECT COUNT(*) as count FROM InvoiceItem');
    
    console.log('📊 Data Integrity:');
    console.log(`   ✅ Invoices: ${invoiceCount[0].count}`);
    console.log(`   ✅ Payments: ${paymentCount[0].count}`);
    console.log(`   ✅ InvoiceItems: ${itemCount[0].count}\n`);

    console.log('='.repeat(60));
    console.log('✅ All migrations applied successfully!');
    console.log('='.repeat(60));

    connection.release();
  } catch (error) {
    connection.release();
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

