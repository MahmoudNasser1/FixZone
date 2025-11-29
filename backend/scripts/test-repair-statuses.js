#!/usr/bin/env node

/**
 * Test script to verify the new repair statuses work correctly
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testStatuses() {
  log('\n🧪 Testing new repair statuses...', 'cyan');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Test 1: Check ENUM values
    log('\n📋 Test 1: Checking ENUM values...', 'blue');
    const [enumRows] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'RepairRequest' 
      AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);
    
    const enumType = enumRows[0].COLUMN_TYPE;
    log(`   ENUM: ${enumType}`, 'blue');
    
    const hasWaitingParts = enumType.includes('WAITING_PARTS');
    const hasReadyForPickup = enumType.includes('READY_FOR_PICKUP');
    
    if (hasWaitingParts && hasReadyForPickup) {
      log('   ✅ Both new statuses are in ENUM!', 'green');
    } else {
      log('   ❌ Missing statuses!', 'red');
      if (!hasWaitingParts) log('      - WAITING_PARTS missing', 'red');
      if (!hasReadyForPickup) log('      - READY_FOR_PICKUP missing', 'red');
    }
    
    // Test 2: Try to insert/update with new statuses
    log('\n📋 Test 2: Testing status updates...', 'blue');
    
    // Get a test repair request
    const [testRepairs] = await connection.execute(`
      SELECT id, status 
      FROM RepairRequest 
      WHERE deletedAt IS NULL 
      LIMIT 1
    `);
    
    if (testRepairs.length > 0) {
      const testId = testRepairs[0].id;
      const originalStatus = testRepairs[0].status;
      
      log(`   Testing with repair ID: ${testId} (current status: ${originalStatus})`, 'blue');
      
      // Test WAITING_PARTS
      try {
        await connection.beginTransaction();
        await connection.execute(`
          UPDATE RepairRequest 
          SET status = 'WAITING_PARTS' 
          WHERE id = ?
        `, [testId]);
        await connection.rollback();
        log('   ✅ WAITING_PARTS update works!', 'green');
      } catch (error) {
        log(`   ❌ WAITING_PARTS update failed: ${error.message}`, 'red');
      }
      
      // Test READY_FOR_PICKUP
      try {
        await connection.beginTransaction();
        await connection.execute(`
          UPDATE RepairRequest 
          SET status = 'READY_FOR_PICKUP' 
          WHERE id = ?
        `, [testId]);
        await connection.rollback();
        log('   ✅ READY_FOR_PICKUP update works!', 'green');
      } catch (error) {
        log(`   ❌ READY_FOR_PICKUP update failed: ${error.message}`, 'red');
      }
    } else {
      log('   ⚠️  No repair requests found for testing', 'yellow');
    }
    
    // Test 3: Check status distribution
    log('\n📋 Test 3: Current status distribution...', 'blue');
    const [statusCounts] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM RepairRequest 
      WHERE deletedAt IS NULL
      GROUP BY status
      ORDER BY count DESC
    `);
    
    statusCounts.forEach(row => {
      log(`   ${row.status}: ${row.count} records`, 'blue');
    });
    
    // Test 4: Verify all statuses are valid
    log('\n📋 Test 4: Verifying all statuses are valid...', 'blue');
    const [invalidStatuses] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM RepairRequest 
      WHERE deletedAt IS NULL
      AND status NOT IN (
        'RECEIVED', 'INSPECTION', 'AWAITING_APPROVAL', 'UNDER_REPAIR',
        'WAITING_PARTS', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
        'DELIVERED', 'REJECTED', 'ON_HOLD'
      )
      GROUP BY status
    `);
    
    if (invalidStatuses.length === 0) {
      log('   ✅ All statuses are valid!', 'green');
    } else {
      log('   ❌ Found invalid statuses:', 'red');
      invalidStatuses.forEach(row => {
        log(`      ${row.status}: ${row.count} records`, 'red');
      });
    }
    
    log('\n✅ All tests completed!', 'green');
    
  } catch (error) {
    log(`\n❌ Test error: ${error.message}`, 'red');
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

async function main() {
  try {
    await testStatuses();
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

