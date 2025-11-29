#!/usr/bin/env node

/**
 * Script to fix existing repair statuses before applying migration
 * This converts invalid statuses to valid ones
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

async function fixStatuses() {
  log('\n🔧 Fixing repair statuses before migration...', 'cyan');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check current statuses
    const [statusCounts] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM RepairRequest 
      WHERE deletedAt IS NULL
      GROUP BY status
    `);
    
    log('\n📊 Current status distribution:', 'blue');
    statusCounts.forEach(row => {
      log(`   ${row.status}: ${row.count} records`, 'blue');
    });
    
    // Fix COMPLETED -> DELIVERED
    const [completedRows] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM RepairRequest 
      WHERE status = 'COMPLETED' AND deletedAt IS NULL
    `);
    
    if (completedRows[0].count > 0) {
      log(`\n🔄 Converting ${completedRows[0].count} records from COMPLETED to DELIVERED...`, 'yellow');
      
      await connection.execute(`
        UPDATE RepairRequest 
        SET status = 'DELIVERED' 
        WHERE status = 'COMPLETED' AND deletedAt IS NULL
      `);
      
      log('   ✅ Conversion completed!', 'green');
    }
    
    // Check for any other invalid statuses
    const [invalidRows] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM RepairRequest 
      WHERE deletedAt IS NULL
      AND status NOT IN (
        'RECEIVED', 'INSPECTION', 'AWAITING_APPROVAL', 'UNDER_REPAIR',
        'WAITING_PARTS', 'READY_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'ON_HOLD'
      )
      GROUP BY status
    `);
    
    if (invalidRows.length > 0) {
      log('\n⚠️  Found invalid statuses:', 'yellow');
      invalidRows.forEach(row => {
        log(`   ${row.status}: ${row.count} records`, 'yellow');
      });
      
      // Convert unknown statuses to RECEIVED as default
      for (const row of invalidRows) {
        log(`\n🔄 Converting ${row.count} records from ${row.status} to RECEIVED...`, 'yellow');
        await connection.execute(`
          UPDATE RepairRequest 
          SET status = 'RECEIVED' 
          WHERE status = ? AND deletedAt IS NULL
        `, [row.status]);
        log('   ✅ Conversion completed!', 'green');
      }
    }
    
    // Final status distribution
    const [finalCounts] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM RepairRequest 
      WHERE deletedAt IS NULL
      GROUP BY status
    `);
    
    log('\n📊 Final status distribution:', 'green');
    finalCounts.forEach(row => {
      log(`   ${row.status}: ${row.count} records`, 'green');
    });
    
    log('\n✅ Status fixing completed!', 'green');
    
  } catch (error) {
    log(`\n❌ Error fixing statuses: ${error.message}`, 'red');
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

async function main() {
  try {
    await fixStatuses();
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

