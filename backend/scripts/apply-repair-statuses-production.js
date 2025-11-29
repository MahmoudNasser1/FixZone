#!/usr/bin/env node

/**
 * Production Migration Script for Repair Statuses
 * 
 * This script applies the repair statuses migration to production.
 * It includes:
 * - Environment validation
 * - Backup creation
 * - Status fixing
 * - Migration application
 * - Verification
 * 
 * Usage:
 *   NODE_ENV=production node backend/scripts/apply-repair-statuses-production.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ',
  multipleStatements: true
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironment() {
  log('\n🔐 Validating environment...', 'cyan');
  
  if (process.env.NODE_ENV !== 'production') {
    log('⚠️  WARNING: NODE_ENV is not set to "production"', 'yellow');
    log('   This script is designed for production use.', 'yellow');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      readline.question('\n   Do you want to continue anyway? (yes/no): ', (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
          log('\n❌ Migration cancelled by user.', 'red');
          process.exit(0);
        }
        resolve();
      });
    });
  }
  
  if (!dbConfig.database || dbConfig.database === 'FZ') {
    log('⚠️  WARNING: Using default database name "FZ"', 'yellow');
    log('   Make sure this is the correct production database!', 'yellow');
  }
  
  log(`   Database: ${dbConfig.database}`, 'blue');
  log(`   Host: ${dbConfig.host}`, 'blue');
  log(`   User: ${dbConfig.user}`, 'blue');
  log('   ✅ Environment validated', 'green');
}

async function createBackup() {
  log('\n📦 Creating production backup...', 'cyan');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, '../../backups/production');
  const backupFile = path.join(backupDir, `backup_before_repair_statuses_${timestamp}.sql`);
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  try {
    const mysqldumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
    let command = `${mysqldumpPath} -h ${dbConfig.host} -u ${dbConfig.user}`;
    
    if (dbConfig.password) {
      command += ` -p${dbConfig.password}`;
    }
    
    command += ` --single-transaction --routines --triggers ${dbConfig.database} > "${backupFile}" 2>&1`;
    
    execSync(command, { stdio: 'inherit' });
    
    // Verify backup file exists and has content
    if (fs.existsSync(backupFile) && fs.statSync(backupFile).size > 0) {
      log(`   ✅ Backup created: ${backupFile}`, 'green');
      log(`   📊 Backup size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`, 'blue');
      return backupFile;
    } else {
      throw new Error('Backup file is empty or does not exist');
    }
  } catch (error) {
    log(`   ❌ ERROR: Could not create backup: ${error.message}`, 'red');
    log('   ⚠️  Migration cannot proceed without a backup!', 'red');
    throw error;
  }
}

async function fixStatuses() {
  log('\n🔧 Fixing existing statuses...', 'cyan');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Fix COMPLETED -> DELIVERED
    const [completedRows] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM RepairRequest 
      WHERE status = 'COMPLETED' AND deletedAt IS NULL
    `);
    
    if (completedRows[0].count > 0) {
      log(`   Converting ${completedRows[0].count} records from COMPLETED to DELIVERED...`, 'yellow');
      await connection.execute(`
        UPDATE RepairRequest 
        SET status = 'DELIVERED' 
        WHERE status = 'COMPLETED' AND deletedAt IS NULL
      `);
      log('   ✅ Conversion completed!', 'green');
    }
    
    // Fix any other invalid statuses
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
      for (const row of invalidRows) {
        log(`   Converting ${row.count} records from ${row.status} to RECEIVED...`, 'yellow');
        await connection.execute(`
          UPDATE RepairRequest 
          SET status = 'RECEIVED' 
          WHERE status = ? AND deletedAt IS NULL
        `, [row.status]);
      }
      log('   ✅ All conversions completed!', 'green');
    } else {
      log('   ✅ No invalid statuses found!', 'green');
    }
    
  } catch (error) {
    log(`   ❌ Error fixing statuses: ${error.message}`, 'red');
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

async function applyMigration() {
  log('\n🚀 Applying migration...', 'cyan');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const migrationFile = path.join(__dirname, '../../migrations/06_ADD_REPAIR_STATUSES.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    await connection.query(migrationSQL);
    
    log('   ✅ Migration applied successfully!', 'green');
  } catch (error) {
    log(`   ❌ Error applying migration: ${error.message}`, 'red');
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

async function verifyMigration() {
  log('\n✅ Verifying migration...', 'cyan');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'RepairRequest' 
      AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);
    
    if (rows.length > 0) {
      const newType = rows[0].COLUMN_TYPE;
      
      if (newType.includes('READY_FOR_PICKUP') && newType.includes('WAITING_PARTS')) {
        log('   ✅ READY_FOR_PICKUP status added!', 'green');
        log('   ✅ WAITING_PARTS status confirmed!', 'green');
        
        // Test update
        const [testRows] = await connection.execute(`SELECT id FROM RepairRequest LIMIT 1`);
        if (testRows.length > 0) {
          await connection.beginTransaction();
          await connection.execute(`UPDATE RepairRequest SET status = 'READY_FOR_PICKUP' WHERE id = ?`, [testRows[0].id]);
          await connection.rollback();
          log('   ✅ Test update successful!', 'green');
        }
        
        return true;
      } else {
        log('   ❌ Migration verification failed!', 'red');
        return false;
      }
    } else {
      log('   ❌ Status column not found!', 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ Error verifying migration: ${error.message}`, 'red');
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════════', 'magenta');
  log('  Production Migration: Repair Statuses', 'magenta');
  log('═══════════════════════════════════════════════════════\n', 'magenta');
  
  try {
    // Step 1: Validate environment
    await validateEnvironment();
    
    // Step 2: Create backup
    const backupFile = await createBackup();
    
    // Step 3: Fix existing statuses
    await fixStatuses();
    
    // Step 4: Apply migration
    await applyMigration();
    
    // Step 5: Verify migration
    const verified = await verifyMigration();
    
    if (verified) {
      log('\n🎉 Production migration completed successfully!', 'green');
      log(`📦 Backup saved at: ${backupFile}`, 'cyan');
      log('\n✅ The new statuses are now available in production.', 'green');
      log('   - WAITING_PARTS (بانتظار قطع غيار)', 'green');
      log('   - READY_FOR_PICKUP (جاهز للاستلام)', 'green');
    } else {
      log('\n⚠️  Migration applied but verification failed!', 'yellow');
      log('   Please check the database manually.', 'yellow');
      log(`   Backup available at: ${backupFile}`, 'cyan');
    }
    
  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    log('\n💡 If a backup was created, you can restore it using:', 'yellow');
    log('   mysql -u root -p FZ < backup_file.sql', 'yellow');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { applyMigration, verifyMigration, createBackup, fixStatuses };

