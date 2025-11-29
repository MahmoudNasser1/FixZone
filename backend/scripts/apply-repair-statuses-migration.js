#!/usr/bin/env node

/**
 * Script to apply repair statuses migration (06_ADD_REPAIR_STATUSES.sql)
 * This script:
 * 1. Creates a backup of the database
 * 2. Applies the migration
 * 3. Verifies the changes
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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createBackup() {
  log('\n📦 Creating database backup...', 'cyan');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, '../../backups');
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
    
    log(`✅ Backup created: ${backupFile}`, 'green');
    return backupFile;
  } catch (error) {
    log(`⚠️  Warning: Could not create backup: ${error.message}`, 'yellow');
    log('   Continuing without backup...', 'yellow');
    return null;
  }
}

async function checkCurrentStatus() {
  log('\n🔍 Checking current status column definition...', 'cyan');
  
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
      const currentType = rows[0].COLUMN_TYPE;
      log(`   Current status ENUM: ${currentType}`, 'blue');
      return currentType;
    } else {
      log('   ⚠️  Status column not found!', 'yellow');
      return null;
    }
  } catch (error) {
    log(`   ❌ Error checking status: ${error.message}`, 'red');
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
    
    // Read migration file
    const migrationFile = path.join(__dirname, '../../migrations/06_ADD_REPAIR_STATUSES.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute migration
    await connection.query(migrationSQL);
    
    log('✅ Migration applied successfully!', 'green');
  } catch (error) {
    log(`❌ Error applying migration: ${error.message}`, 'red');
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
    
    // Check if READY_FOR_PICKUP is in the ENUM
    const [rows] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'RepairRequest' 
      AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);
    
    if (rows.length > 0) {
      const newType = rows[0].COLUMN_TYPE;
      log(`   New status ENUM: ${newType}`, 'blue');
      
      if (newType.includes('READY_FOR_PICKUP')) {
        log('   ✅ READY_FOR_PICKUP status added successfully!', 'green');
      } else {
        log('   ⚠️  READY_FOR_PICKUP not found in ENUM!', 'yellow');
      }
      
      if (newType.includes('WAITING_PARTS')) {
        log('   ✅ WAITING_PARTS status confirmed!', 'green');
      }
      
      // Test inserting a record with the new status (we'll rollback)
      try {
        await connection.beginTransaction();
        
        // Get a test repair request ID
        const [testRows] = await connection.execute(`
          SELECT id FROM RepairRequest LIMIT 1
        `);
        
        if (testRows.length > 0) {
          const testId = testRows[0].id;
          
          // Try to update with new status
          await connection.execute(`
            UPDATE RepairRequest 
            SET status = 'READY_FOR_PICKUP' 
            WHERE id = ?
          `, [testId]);
          
          // Rollback the test
          await connection.rollback();
          
          log('   ✅ Test update with READY_FOR_PICKUP succeeded!', 'green');
        }
      } catch (testError) {
        await connection.rollback();
        log(`   ⚠️  Test update failed: ${testError.message}`, 'yellow');
      }
      
      return true;
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
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  Repair Statuses Migration Script', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');
  
  log(`Database: ${dbConfig.database}`, 'blue');
  log(`Host: ${dbConfig.host}`, 'blue');
  log(`User: ${dbConfig.user}\n`, 'blue');
  
  try {
    // Step 1: Check current status
    const currentStatus = await checkCurrentStatus();
    
    // Step 2: Create backup
    const backupFile = await createBackup();
    
    // Step 3: Apply migration
    await applyMigration();
    
    // Step 4: Verify migration
    const verified = await verifyMigration();
    
    if (verified) {
      log('\n🎉 Migration completed successfully!', 'green');
      if (backupFile) {
        log(`📦 Backup saved at: ${backupFile}`, 'cyan');
      }
      log('\n✅ You can now test the new statuses in the application.', 'green');
    } else {
      log('\n⚠️  Migration applied but verification failed.', 'yellow');
      log('   Please check the database manually.', 'yellow');
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

module.exports = { applyMigration, verifyMigration, createBackup };

