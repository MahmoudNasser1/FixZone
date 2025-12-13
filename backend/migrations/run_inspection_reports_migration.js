#!/usr/bin/env node

/**
 * Migration Script: Add deletedAt to InspectionReport table
 * Production Safe Migration Script
 * 
 * Usage:
 *   node run_inspection_reports_migration.js
 * 
 * Environment Variables Required:
 *   DB_HOST (default: localhost)
 *   DB_USER (default: root)
 *   DB_PASSWORD (required in production)
 *   DB_NAME (default: FZ)
 *   DB_PORT (default: 3306)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(message, 'bright');
  log('='.repeat(60), 'bright');
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ',
  port: parseInt(process.env.DB_PORT) || 3306,
  multipleStatements: true,
};

async function checkColumnExists(connection, tableName, columnName) {
  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );
    return rows[0].count > 0;
  } catch (error) {
    throw new Error(`Failed to check column existence: ${error.message}`);
  }
}

async function checkIndexExists(connection, tableName, indexName) {
  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND INDEX_NAME = ?`,
      [tableName, indexName]
    );
    return rows[0].count > 0;
  } catch (error) {
    throw new Error(`Failed to check index existence: ${error.message}`);
  }
}

async function addDeletedAtColumn(connection) {
  const tableName = 'InspectionReport';
  const columnName = 'deletedAt';
  
  logInfo(`Checking if column '${columnName}' exists in table '${tableName}'...`);
  
  const columnExists = await checkColumnExists(connection, tableName, columnName);
  
  if (columnExists) {
    logWarning(`Column '${columnName}' already exists in table '${tableName}'. Skipping...`);
    return false;
  }
  
  logInfo(`Adding column '${columnName}' to table '${tableName}'...`);
  
  try {
    await connection.execute(
      `ALTER TABLE ${tableName} 
       ADD COLUMN ${columnName} datetime DEFAULT NULL 
       COMMENT 'Soft delete timestamp'`
    );
    logSuccess(`Column '${columnName}' added successfully!`);
    return true;
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      logWarning(`Column '${columnName}' already exists. This is safe to ignore.`);
      return false;
    }
    throw error;
  }
}

async function addIndex(connection) {
  const tableName = 'InspectionReport';
  const indexName = 'idx_inspection_report_deletedAt';
  
  logInfo(`Checking if index '${indexName}' exists...`);
  
  const indexExists = await checkIndexExists(connection, tableName, indexName);
  
  if (indexExists) {
    logWarning(`Index '${indexName}' already exists. Skipping...`);
    return false;
  }
  
  logInfo(`Creating index '${indexName}'...`);
  
  try {
    await connection.execute(
      `CREATE INDEX ${indexName} ON ${tableName}(${indexName.replace('idx_inspection_report_', '')})`
    );
    logSuccess(`Index '${indexName}' created successfully!`);
    return true;
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      logWarning(`Index '${indexName}' already exists. This is safe to ignore.`);
      return false;
    }
    throw error;
  }
}

async function verifyMigration(connection) {
  logInfo('Verifying migration...');
  
  try {
    // Check column
    const columnExists = await checkColumnExists(connection, 'InspectionReport', 'deletedAt');
    if (!columnExists) {
      throw new Error('Column deletedAt was not created!');
    }
    logSuccess('Column deletedAt exists ✓');
    
    // Check index
    const indexExists = await checkIndexExists(connection, 'InspectionReport', 'idx_inspection_report_deletedAt');
    if (!indexExists) {
      logWarning('Index idx_inspection_report_deletedAt does not exist (this is optional)');
    } else {
      logSuccess('Index idx_inspection_report_deletedAt exists ✓');
    }
    
    // Check data integrity
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as total, COUNT(deletedAt) as deleted FROM InspectionReport'
    );
    logInfo(`Total reports: ${rows[0].total}, Deleted reports: ${rows[0].deleted}`);
    
    return true;
  } catch (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }
}

async function runMigration() {
  logHeader('InspectionReport Migration: Add deletedAt Column');
  
  // Validate environment
  if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
    logError('DB_PASSWORD environment variable is required in production!');
    process.exit(1);
  }
  
  logInfo(`Database: ${dbConfig.database}`);
  logInfo(`Host: ${dbConfig.host}:${dbConfig.port}`);
  logInfo(`User: ${dbConfig.user}`);
  logWarning('⚠️  Running on PRODUCTION database!');
  
  let connection;
  
  try {
    // Create database connection
    logInfo('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    logSuccess('Database connection established');
    
    // Get current database name
    const [dbRows] = await connection.execute('SELECT DATABASE() as db');
    const currentDb = dbRows[0].db;
    logInfo(`Current database: ${currentDb}`);
    
    // Check if table exists
    const [tableRows] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'InspectionReport'`
    );
    
    if (tableRows[0].count === 0) {
      logError('Table InspectionReport does not exist!');
      process.exit(1);
    }
    
    logSuccess('Table InspectionReport exists');
    
    // Run migration steps
    let columnAdded = false;
    let indexAdded = false;
    
    try {
      columnAdded = await addDeletedAtColumn(connection);
      indexAdded = await addIndex(connection);
    } catch (error) {
      logError(`Migration step failed: ${error.message}`);
      throw error;
    }
    
    // Verify migration
    await verifyMigration(connection);
    
    // Summary
    logHeader('Migration Summary');
    if (columnAdded) {
      logSuccess('✓ Column deletedAt was added');
    } else {
      logInfo('ℹ Column deletedAt already exists (no changes needed)');
    }
    
    if (indexAdded) {
      logSuccess('✓ Index idx_inspection_report_deletedAt was created');
    } else {
      logInfo('ℹ Index idx_inspection_report_deletedAt already exists (no changes needed)');
    }
    
    logSuccess('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    logError(`\n❌ Migration failed: ${error.message}`);
    logError(`Error code: ${error.code || 'N/A'}`);
    logError(`SQL State: ${error.sqlState || 'N/A'}`);
    if (error.sql) {
      logError(`SQL: ${error.sql}`);
    }
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      logInfo('Database connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logError(`Unexpected error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMigration };




