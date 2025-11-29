#!/usr/bin/env node
/**
 * Apply Financial Migrations - Final Version
 * Executes each statement separately
 */

const db = require('../db');

async function executePreparedStatement(connection, checkQuery, alterQuery) {
  // Check if column/index exists
  const [checkResult] = await connection.query(checkQuery);
  const exists = checkResult[0].colExists > 0;
  
  if (!exists) {
    // Execute the ALTER/CREATE statement
    await connection.query(alterQuery);
    return true;
  }
  return false;
}

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
    const added1 = await executePreparedStatement(
      connection,
      `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Invoice' 
       AND COLUMN_NAME = 'discountAmount'`,
      `ALTER TABLE Invoice ADD COLUMN discountAmount DECIMAL(12,2) DEFAULT 0.00 AFTER taxAmount`
    );
    console.log(`   ${added1 ? '✅' : '⏭️ '} discountAmount ${added1 ? 'added' : 'already exists'}`);

    // dueDate
    const added2 = await executePreparedStatement(
      connection,
      `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Invoice' 
       AND COLUMN_NAME = 'dueDate'`,
      `ALTER TABLE Invoice ADD COLUMN dueDate DATE NULL AFTER currency`
    );
    console.log(`   ${added2 ? '✅' : '⏭️ '} dueDate ${added2 ? 'added' : 'already exists'}`);

    // companyId
    const added3 = await executePreparedStatement(
      connection,
      `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Invoice' 
       AND COLUMN_NAME = 'companyId'`,
      `ALTER TABLE Invoice ADD COLUMN companyId INT(11) NULL AFTER customerId`
    );
    console.log(`   ${added3 ? '✅' : '⏭️ '} companyId ${added3 ? 'added' : 'already exists'}`);

    // branchId
    const added4 = await executePreparedStatement(
      connection,
      `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Invoice' 
       AND COLUMN_NAME = 'branchId'`,
      `ALTER TABLE Invoice ADD COLUMN branchId INT(11) NULL AFTER companyId`
    );
    console.log(`   ${added4 ? '✅' : '⏭️ '} branchId ${added4 ? 'added' : 'already exists'}`);

    // Create indexes
    const indexes = [
      { name: 'idx_invoice_customer', table: 'Invoice', column: 'customerId' },
      { name: 'idx_invoice_company', table: 'Invoice', column: 'companyId' },
      { name: 'idx_invoice_branch', table: 'Invoice', column: 'branchId' },
      { name: 'idx_invoice_dueDate', table: 'Invoice', column: 'dueDate' }
    ];

    for (const idx of indexes) {
      const idxAdded = await executePreparedStatement(
        connection,
        `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = '${idx.table}' 
         AND INDEX_NAME = '${idx.name}'`,
        `CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column})`
      );
      if (idxAdded) {
        console.log(`   ✅ Index ${idx.name} created`);
      }
    }
    console.log('');

    // Migration 2: Add paymentDate to Payment (already exists)
    console.log('📋 Migration 2: Add paymentDate to Payment');
    const paymentDateExists = await executePreparedStatement(
      connection,
      `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Payment' 
       AND COLUMN_NAME = 'paymentDate'`,
      `ALTER TABLE Payment ADD COLUMN paymentDate DATE NULL AFTER amount`
    );
    console.log(`   ${paymentDateExists ? '✅' : '⏭️ '} paymentDate ${paymentDateExists ? 'added' : 'already exists'}\n`);

    // Migration 3: Add Soft Delete to InvoiceItem
    console.log('📋 Migration 3: Add Soft Delete to InvoiceItem');
    
    const deletedAtAdded = await executePreparedStatement(
      connection,
      `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'InvoiceItem' 
       AND COLUMN_NAME = 'deletedAt'`,
      `ALTER TABLE InvoiceItem ADD COLUMN deletedAt DATETIME NULL AFTER updatedAt`
    );
    console.log(`   ${deletedAtAdded ? '✅' : '⏭️ '} deletedAt ${deletedAtAdded ? 'added' : 'already exists'}`);

    // Create indexes for InvoiceItem
    const itemIndexes = [
      { name: 'idx_invoice_item_deletedAt', table: 'InvoiceItem', column: 'deletedAt' },
      { name: 'idx_invoice_item_invoiceId', table: 'InvoiceItem', column: 'invoiceId' },
      { name: 'idx_invoice_item_inventoryItemId', table: 'InvoiceItem', column: 'inventoryItemId' }
    ];

    for (const idx of itemIndexes) {
      const idxAdded = await executePreparedStatement(
        connection,
        `SELECT COUNT(*) as colExists FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = '${idx.table}' 
         AND INDEX_NAME = '${idx.name}'`,
        `CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column})`
      );
      if (idxAdded) {
        console.log(`   ✅ Index ${idx.name} created`);
      }
    }
    console.log('');

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
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

