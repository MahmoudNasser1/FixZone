#!/usr/bin/env node

/**
 * Migration Runner Script
 * Runs all SQL migration files in the specified order
 * Usage: node run_migrations.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true, // Allow multiple statements
};

// Migration files to run (in order)
const migrationFiles = [
  'create_messaging_log_table.sql',
  'add_shipping_amount_to_invoice.sql', // This one has IF check, so it's safe to run first
  'PRODUCTION_ADD_SHIPPING_AMOUNT.sql',
  'add_shipping_amount_production.sql',
  'add_shipping_amount_production_final.sql',
  'add_shipping_amount_local.sql',
];

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

/**
 * Read and parse SQL file
 * Removes comments and splits by semicolons
 */
function parseSQLFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove SQL comments (-- comments and /* */ comments)
    let cleaned = content
      .replace(/--.*$/gm, '') // Remove -- comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
    
    // Split by semicolons, but keep multi-line statements together
    const statements = cleaned
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\s*$/));
    
    return statements;
  } catch (error) {
    throw new Error(`Failed to read SQL file ${filePath}: ${error.message}`);
  }
}

/**
 * Execute a single SQL statement
 */
async function executeStatement(connection, statement, filePath) {
  try {
    // Skip SELECT statements (verification queries)
    if (statement.trim().toUpperCase().startsWith('SELECT')) {
      logInfo(`Skipping SELECT statement (verification query)`);
      const [results] = await connection.query(statement);
      if (Array.isArray(results) && results.length > 0) {
        logInfo(`Verification result: ${JSON.stringify(results[0], null, 2)}`);
      }
      return { success: true, skipped: true };
    }

    // Execute the statement
    const [results] = await connection.query(statement);
    
    // Check if it's an ALTER/UPDATE/INSERT that might have warnings
    if (results.warningCount > 0) {
      const [warnings] = await connection.query('SHOW WARNINGS');
      warnings.forEach(warning => {
        if (warning.Level === 'Error') {
          throw new Error(warning.Message);
        } else if (warning.Level === 'Warning') {
          logWarning(`Warning: ${warning.Message}`);
        }
      });
    }

    return { success: true, results };
  } catch (error) {
    // Check if it's a "duplicate column" error (expected for shipping amount migrations)
    if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column name')) {
      logWarning(`Column already exists (this is expected if migration was run before): ${error.message}`);
      return { success: true, skipped: true, reason: 'duplicate_column' };
    }
    
    // Check if it's a "table already exists" error (expected for messaging log)
    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
      logWarning(`Table already exists (this is expected if migration was run before): ${error.message}`);
      return { success: true, skipped: true, reason: 'table_exists' };
    }
    
    throw error;
  }
}

/**
 * Run a single migration file
 */
async function runMigration(connection, filePath) {
  const fileName = path.basename(filePath);
  logHeader(`Running: ${fileName}`);
  
  try {
    const statements = parseSQLFile(filePath);
    logInfo(`Found ${statements.length} statement(s) to execute`);
    
    const results = {
      file: fileName,
      total: statements.length,
      executed: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      logInfo(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const result = await executeStatement(connection, statement, filePath);
        if (result.skipped) {
          results.skipped++;
        } else {
          results.executed++;
        }
      } catch (error) {
        results.errors.push({
          statement: i + 1,
          error: error.message,
        });
        logError(`Statement ${i + 1} failed: ${error.message}`);
        
        // Continue with next statement (don't stop on error)
        // Some migrations might fail if already applied
      }
    }

    // Summary
    if (results.errors.length === 0) {
      logSuccess(`Migration completed: ${results.executed} executed, ${results.skipped} skipped`);
    } else {
      logWarning(`Migration completed with ${results.errors.length} error(s): ${results.executed} executed, ${results.skipped} skipped`);
      results.errors.forEach(err => {
        logError(`  Statement ${err.statement}: ${err.error}`);
      });
    }

    return results;
  } catch (error) {
    logError(`Failed to run migration ${fileName}: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  logHeader('Database Migration Runner');
  
  // Validate environment
  if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
    logError('DB_PASSWORD environment variable is required in production!');
    process.exit(1);
  }

  logInfo(`Database: ${dbConfig.database}`);
  logInfo(`Host: ${dbConfig.host}`);
  logInfo(`User: ${dbConfig.user}`);
  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Create database connection
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig).promise();
    logSuccess('Database connection established');
  } catch (error) {
    logError(`Failed to connect to database: ${error.message}`);
    process.exit(1);
  }

  // Get migrations directory
  const migrationsDir = __dirname;
  const allResults = [];

  try {
    // Run each migration file
    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationsDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        logWarning(`Migration file not found: ${fileName} (skipping)`);
        allResults.push({
          file: fileName,
          status: 'skipped',
          reason: 'file_not_found',
        });
        continue;
      }

      try {
        const result = await runMigration(connection, filePath);
        allResults.push({
          ...result,
          status: result.errors.length === 0 ? 'success' : 'partial',
        });
      } catch (error) {
        logError(`Migration ${fileName} failed: ${error.message}`);
        allResults.push({
          file: fileName,
          status: 'failed',
          error: error.message,
        });
      }

      // Small delay between migrations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final summary
    logHeader('Migration Summary');
    
    const successful = allResults.filter(r => r.status === 'success').length;
    const partial = allResults.filter(r => r.status === 'partial').length;
    const failed = allResults.filter(r => r.status === 'failed').length;
    const skipped = allResults.filter(r => r.status === 'skipped').length;

    logInfo(`Total migrations: ${migrationFiles.length}`);
    logSuccess(`Successful: ${successful}`);
    if (partial > 0) logWarning(`Partial (with warnings): ${partial}`);
    if (failed > 0) logError(`Failed: ${failed}`);
    if (skipped > 0) logWarning(`Skipped: ${skipped}`);

    if (failed > 0) {
      logError('\nSome migrations failed. Please review the errors above.');
      process.exit(1);
    } else {
      logSuccess('\nAll migrations completed successfully!');
    }

  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    await connection.end();
    logInfo('Database connection closed');
  }
}

// Run the script
main().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

