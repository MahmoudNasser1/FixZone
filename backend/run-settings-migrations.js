// backend/run-settings-migrations.js
// Safe migration runner for Settings system
require('dotenv').config();
const db = require('./db');
const fs = require('fs').promises;
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'migration_history';

// Migration files in order
const MIGRATIONS = [
  '20251128_enhance_system_setting_table.sql',
  '20251128_create_setting_history_table.sql',
  '20251128_create_setting_category_table.sql',
  '20251128_create_setting_backup_table.sql'
];

async function ensureMigrationsTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id INT PRIMARY KEY AUTO_INCREMENT,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_by VARCHAR(100),
        status ENUM('success', 'failed') DEFAULT 'success',
        error_message TEXT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Migrations table ready');
  } catch (error) {
    console.error('❌ Error creating migrations table:', error);
    throw error;
  }
}

async function checkMigrationStatus(migrationName) {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM ${MIGRATIONS_TABLE} WHERE migration_name = ? AND status = 'success'`,
      [migrationName]
    );
    return rows.length > 0;
  } catch (error) {
    return false;
  }
}

async function recordMigration(migrationName, status, errorMessage = null) {
  try {
    await db.execute(
      `INSERT INTO ${MIGRATIONS_TABLE} (migration_name, status, error_message, executed_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         error_message = VALUES(error_message),
         executed_at = CURRENT_TIMESTAMP`,
      [migrationName, status, errorMessage, process.env.USER || 'system']
    );
  } catch (error) {
    console.error('Error recording migration:', error);
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = ? 
         AND COLUMN_NAME = ?`,
      [process.env.DB_NAME || 'FZ', tableName, columnName]
    );
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function checkIndexExists(tableName, indexName) {
  try {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = ? 
         AND INDEX_NAME = ?`,
      [process.env.DB_NAME || 'FZ', tableName, indexName]
    );
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function runMigration(migrationFile) {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  
  try {
    // Check if migration file exists
    await fs.access(migrationPath);
    
    console.log(`\n🔄 Running migration: ${migrationFile}`);
    
    // Handle specific migrations
    if (migrationFile === '20251128_enhance_system_setting_table.sql') {
      // Enhance SystemSetting table
      const columns = [
        { name: 'category', sql: "ALTER TABLE SystemSetting ADD COLUMN category VARCHAR(50) DEFAULT 'general' AFTER type" },
        { name: 'isEncrypted', sql: 'ALTER TABLE SystemSetting ADD COLUMN isEncrypted TINYINT(1) DEFAULT 0 AFTER description' },
        { name: 'isSystem', sql: 'ALTER TABLE SystemSetting ADD COLUMN isSystem TINYINT(1) DEFAULT 0 AFTER isEncrypted' },
        { name: 'isPublic', sql: 'ALTER TABLE SystemSetting ADD COLUMN isPublic TINYINT(1) DEFAULT 0 AFTER isSystem' },
        { name: 'defaultValue', sql: 'ALTER TABLE SystemSetting ADD COLUMN defaultValue TEXT NULL AFTER isPublic' },
        { name: 'validationRules', sql: 'ALTER TABLE SystemSetting ADD COLUMN validationRules JSON NULL AFTER defaultValue' },
        { name: 'dependencies', sql: 'ALTER TABLE SystemSetting ADD COLUMN dependencies JSON NULL AFTER validationRules' },
        { name: 'environment', sql: "ALTER TABLE SystemSetting ADD COLUMN environment VARCHAR(20) DEFAULT 'all' AFTER dependencies" },
        { name: 'permissions', sql: 'ALTER TABLE SystemSetting ADD COLUMN permissions JSON NULL AFTER environment' },
        { name: 'metadata', sql: 'ALTER TABLE SystemSetting ADD COLUMN metadata JSON NULL AFTER permissions' }
      ];
      
      for (const column of columns) {
        const exists = await checkColumnExists('SystemSetting', column.name);
        if (!exists) {
          await db.execute(column.sql);
          console.log(`   ✅ Added column: ${column.name}`);
        } else {
          console.log(`   ⏭️  Column ${column.name} already exists`);
        }
      }
      
      // Add indexes
      const indexes = [
        { name: 'idx_category', sql: 'CREATE INDEX idx_category ON SystemSetting (category)' },
        { name: 'idx_environment', sql: 'CREATE INDEX idx_environment ON SystemSetting (environment)' },
        { name: 'idx_key', sql: 'CREATE INDEX idx_key ON SystemSetting (`key`)' }
      ];
      
      for (const index of indexes) {
        const exists = await checkIndexExists('SystemSetting', index.name);
        if (!exists) {
          await db.execute(index.sql);
          console.log(`   ✅ Created index: ${index.name}`);
        } else {
          console.log(`   ⏭️  Index ${index.name} already exists`);
        }
      }
    } else {
      // For other migrations, read and execute SQL
      const sql = await fs.readFile(migrationPath, 'utf8');
      
      // Split by semicolons and filter empty statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`   Found ${statements.length} SQL statements`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length > 0) {
          try {
            await db.execute(statement);
            console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
          } catch (error) {
            // Check if it's a "already exists" error (safe to ignore)
            if (error.code === 'ER_DUP_FIELDNAME' || 
                error.code === 'ER_DUP_KEYNAME' ||
                error.code === 'ER_TABLE_EXISTS_ERROR' ||
                error.message.includes('already exists') ||
                error.message.includes('Duplicate key name')) {
              console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
            } else {
              throw error;
            }
          }
        }
      }
    }
    
    // Record successful migration
    await recordMigration(migrationFile, 'success');
    console.log(`✅ Migration ${migrationFile} completed successfully`);
    
    return true;
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    await recordMigration(migrationFile, 'failed', error.message);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Starting Settings System Migrations...');
    console.log('📊 DB Config:', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'FZ',
      user: process.env.DB_USER || 'root'
    });
    
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    // Run migrations in order
    for (const migrationFile of MIGRATIONS) {
      // Check if already executed
      const alreadyExecuted = await checkMigrationStatus(migrationFile);
      
      if (alreadyExecuted) {
        console.log(`⏭️  Skipping ${migrationFile} (already executed)`);
        skippedCount++;
        continue;
      }
      
      // Run migration
      const success = await runMigration(migrationFile);
      
      if (success) {
        successCount++;
      } else {
        failedCount++;
        console.error(`\n⚠️  Migration ${migrationFile} failed. Stopping...`);
        break; // Stop on first failure
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    
    if (failedCount === 0) {
      console.log('\n✅ All migrations completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some migrations failed. Please check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migrations
runMigrations();

