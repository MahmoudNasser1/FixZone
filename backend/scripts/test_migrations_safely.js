#!/usr/bin/env node
/**
 * Safe Migration Testing Script
 * Tests migrations without applying them
 * 
 * Usage: node test_migrations_safely.js [environment]
 * Example: node test_migrations_safely.js staging
 */

const db = require('../db');
const fs = require('fs');
const path = require('path');

const ENVIRONMENT = process.argv[2] || 'staging';

// Migration files to test
const MIGRATIONS = [
  '20250128_add_missing_columns_to_invoice.sql',
  '20250128_add_paymentDate_to_payment.sql',
  '20250128_add_soft_delete_to_invoice_item.sql'
];

/**
 * Check if column exists
 */
async function columnExists(tableName, columnName) {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as colExists 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );
    return rows[0].colExists > 0;
  } catch (error) {
    console.error(`Error checking column ${columnName} in ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Check if index exists
 */
async function indexExists(tableName, indexName) {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as idxExists 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND INDEX_NAME = ?`,
      [tableName, indexName]
    );
    return rows[0].idxExists > 0;
  } catch (error) {
    console.error(`Error checking index ${indexName} on ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Get table row count
 */
async function getRowCount(tableName) {
  try {
    const [rows] = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return rows[0].count;
  } catch (error) {
    console.error(`Error getting row count for ${tableName}:`, error.message);
    return -1;
  }
}

/**
 * Test migration 1: Add Missing Columns to Invoice
 */
async function testMigration1() {
  console.log('\n📋 Testing Migration 1: Add Missing Columns to Invoice');
  console.log('='.repeat(60));

  const columns = [
    { name: 'discountAmount', type: 'DECIMAL(10,2)' },
    { name: 'dueDate', type: 'DATE' },
    { name: 'notes', type: 'TEXT' },
    { name: 'customerId', type: 'INT' },
    { name: 'companyId', type: 'INT' },
    { name: 'branchId', type: 'INT' }
  ];

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  for (const column of columns) {
    const exists = await columnExists('Invoice', column.name);
    if (exists) {
      console.log(`  ✅ Column '${column.name}' already exists`);
      results.skipped++;
    } else {
      console.log(`  ⚠️  Column '${column.name}' does not exist (will be added)`);
      results.passed++;
    }
  }

  // Check row count
  const rowCount = await getRowCount('Invoice');
  console.log(`  📊 Current Invoice count: ${rowCount}`);

  return results;
}

/**
 * Test migration 2: Add paymentDate to Payment
 */
async function testMigration2() {
  console.log('\n📋 Testing Migration 2: Add paymentDate to Payment');
  console.log('='.repeat(60));

  const exists = await columnExists('Payment', 'paymentDate');
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  if (exists) {
    console.log(`  ✅ Column 'paymentDate' already exists`);
    results.skipped++;
  } else {
    console.log(`  ⚠️  Column 'paymentDate' does not exist (will be added)`);
    results.passed++;
  }

  // Check row count
  const rowCount = await getRowCount('Payment');
  console.log(`  📊 Current Payment count: ${rowCount}`);

  // Check if any payments need date update
  if (rowCount > 0 && !exists) {
    console.log(`  ⚠️  ${rowCount} payments will have paymentDate set to createdAt`);
  }

  return results;
}

/**
 * Test migration 3: Add Soft Delete to InvoiceItem
 */
async function testMigration3() {
  console.log('\n📋 Testing Migration 3: Add Soft Delete to InvoiceItem');
  console.log('='.repeat(60));

  const exists = await columnExists('InvoiceItem', 'deletedAt');
  const idxExists = await indexExists('InvoiceItem', 'idx_invoice_item_deleted_at');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  if (exists) {
    console.log(`  ✅ Column 'deletedAt' already exists`);
    results.skipped++;
  } else {
    console.log(`  ⚠️  Column 'deletedAt' does not exist (will be added)`);
    results.passed++;
  }

  if (idxExists) {
    console.log(`  ✅ Index 'idx_invoice_item_deletedAt' already exists`);
    results.skipped++;
  } else {
    console.log(`  ⚠️  Index 'idx_invoice_item_deletedAt' does not exist (will be added)`);
    results.passed++;
  }

  // Check row count
  const rowCount = await getRowCount('InvoiceItem');
  console.log(`  📊 Current InvoiceItem count: ${rowCount}`);

  return results;
}

/**
 * Test database connectivity
 */
async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection');
  console.log('='.repeat(60));

  try {
    const [rows] = await db.query('SELECT DATABASE() as db, USER() as user, VERSION() as version');
    console.log(`  ✅ Connected to database: ${rows[0].db}`);
    console.log(`  ✅ User: ${rows[0].user}`);
    console.log(`  ✅ Version: ${rows[0].version}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Database connection failed:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🧪 Financial Module - Safe Migration Testing');
  console.log('='.repeat(60));
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Date: ${new Date().toISOString()}`);

  // Test database connection
  const connected = await testDatabaseConnection();
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  // Test migrations
  const results1 = await testMigration1();
  const results2 = await testMigration2();
  const results3 = await testMigration3();

  // Summary
  console.log('\n📊 Summary');
  console.log('='.repeat(60));
  console.log(`Migration 1: ${results1.passed} changes, ${results1.skipped} already applied`);
  console.log(`Migration 2: ${results2.passed} changes, ${results2.skipped} already applied`);
  console.log(`Migration 3: ${results3.passed} changes, ${results3.skipped} already applied`);

  const totalChanges = results1.passed + results2.passed + results3.passed;
  const totalSkipped = results1.skipped + results2.skipped + results3.skipped;

  console.log(`\nTotal: ${totalChanges} changes needed, ${totalSkipped} already applied`);

  if (totalChanges === 0) {
    console.log('\n✅ All migrations have already been applied!');
  } else {
    console.log(`\n⚠️  ${totalChanges} migration(s) need to be applied`);
    console.log('   Run: ./apply_financial_migrations.sh ' + ENVIRONMENT);
  }

  // Close database connection
  await db.end();
  console.log('\n✅ Testing completed');
}

// Run
main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});

