/**
 * Script to add shippingAmount column to Invoice table
 * Can be run on both local and production
 * 
 * Usage:
 *   node backend/scripts/add_shipping_amount_column.js
 * 
 * Or with environment:
 *   NODE_ENV=production node backend/scripts/add_shipping_amount_column.js
 */

const db = require('../db');
const path = require('path');
const fs = require('fs');

async function addShippingAmountColumn() {
  const connection = await db.getConnection();
  
  try {
    console.log('🔧 Starting migration: Adding shippingAmount column to Invoice table...');
    
    await connection.beginTransaction();
    
    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Invoice'
        AND COLUMN_NAME = 'shippingAmount'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Column shippingAmount already exists. Skipping...');
      await connection.rollback();
      return;
    }
    
    // Add the column
    console.log('📝 Adding shippingAmount column...');
    await connection.execute(`
      ALTER TABLE Invoice 
      ADD COLUMN shippingAmount DECIMAL(12,2) DEFAULT 0.00 
      AFTER taxAmount
    `);
    
    // Update existing invoices
    console.log('🔄 Updating existing invoices...');
    const [updateResult] = await connection.execute(`
      UPDATE Invoice 
      SET shippingAmount = 0.00 
      WHERE shippingAmount IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows} invoices`);
    
    await connection.commit();
    console.log('✅ Migration completed successfully!');
    
    // Verify
    const [verify] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Invoice'
        AND COLUMN_NAME = 'shippingAmount'
    `);
    
    if (verify.length > 0) {
      console.log('✅ Verification successful:');
      console.log(verify[0]);
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the migration
if (require.main === module) {
  addShippingAmountColumn()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = addShippingAmountColumn;




