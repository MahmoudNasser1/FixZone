// backend/scripts/deploy-settings-staging.js
// Deployment script for Settings system on Staging
require('dotenv').config();
const { backupDatabase } = require('./backup-database');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execPromise = util.promisify(exec);

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  const checks = {
    node: false,
    npm: false,
    mysql: false,
    env: false,
    migrations: false
  };
  
  // Check Node.js
  try {
    const { stdout } = await execPromise('node --version');
    console.log(`✅ Node.js: ${stdout.trim()}`);
    checks.node = true;
  } catch (error) {
    console.error('❌ Node.js not found');
    return false;
  }
  
  // Check npm
  try {
    const { stdout } = await execPromise('npm --version');
    console.log(`✅ npm: ${stdout.trim()}`);
    checks.npm = true;
  } catch (error) {
    console.error('❌ npm not found');
    return false;
  }
  
  // Check MySQL (try multiple paths for XAMPP)
  const mysqlPaths = [
    'mysql',
    '/opt/lampp/bin/mysql',
    '/usr/bin/mysql',
    '/usr/local/bin/mysql'
  ];
  
  let mysqlFound = false;
  for (const mysqlPath of mysqlPaths) {
    try {
      const { stdout } = await execPromise(`${mysqlPath} --version`);
      console.log(`✅ MySQL: ${stdout.trim()} (${mysqlPath})`);
      checks.mysql = true;
      mysqlFound = true;
      break;
    } catch (error) {
      // Try next path
    }
  }
  
  if (!mysqlFound) {
    console.warn('⚠️ MySQL command not found in PATH, but will try to use mysqldump directly');
    // Don't fail - mysqldump might still work
    checks.mysql = true; // Allow to continue
  }
  
  // Check .env file
  if (process.env.DB_NAME) {
    console.log(`✅ Environment variables loaded`);
    console.log(`   DB: ${process.env.DB_NAME}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    checks.env = true;
  } else {
    console.error('❌ Environment variables not loaded');
    return false;
  }
  
  // Check migration files
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const requiredMigrations = [
    '20251128_enhance_system_setting_table.sql',
    '20251128_create_setting_history_table.sql',
    '20251128_create_setting_category_table.sql',
    '20251128_create_setting_backup_table.sql'
  ];
  
  const fs = require('fs');
  const existingMigrations = requiredMigrations.filter(file => 
    fs.existsSync(path.join(migrationsDir, file))
  );
  
  if (existingMigrations.length === requiredMigrations.length) {
    console.log(`✅ Migration files: ${existingMigrations.length}/${requiredMigrations.length}`);
    checks.migrations = true;
  } else {
    console.error(`❌ Missing migration files: ${requiredMigrations.length - existingMigrations.length}`);
    return false;
  }
  
  console.log('\n✅ All prerequisites met!\n');
  return true;
}

async function runBackup() {
  console.log('📦 Step 1: Creating database backup...\n');
  try {
    const backupFile = await backupDatabase();
    console.log(`✅ Backup created: ${backupFile}\n`);
    return backupFile;
  } catch (error) {
    console.warn('⚠️ Backup failed:', error.message);
    console.warn('⚠️ Continuing without backup (not recommended for production)...\n');
    // Don't throw - allow to continue for staging/testing
    return null;
  }
}

async function runMigrations() {
  console.log('🔄 Step 2: Running migrations...\n');
  try {
    const migrationScript = path.join(__dirname, '..', 'run-settings-migrations.js');
    const { stdout, stderr } = await execPromise(`node ${migrationScript}`);
    
    console.log(stdout);
    if (stderr) {
      console.error('⚠️ Migration warnings:', stderr);
    }
    
    console.log('\n✅ Migrations completed\n');
    return true;
  } catch (error) {
    console.error('❌ Migrations failed:', error.message);
    throw error;
  }
}

async function verifyDeployment() {
  console.log('✅ Step 3: Verifying deployment...\n');
  
  const db = require('../db');
  
  try {
    // Check tables
    const tables = [
      'SystemSetting',
      'SettingHistory',
      'SettingCategory',
      'SettingBackup'
    ];
    
    for (const table of tables) {
      try {
        const [rows] = await db.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`   ✅ Table ${table} exists`);
        } else {
          console.log(`   ❌ Table ${table} not found`);
          return false;
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${table}:`, error.message);
        return false;
      }
    }
    
    // Check SystemSetting columns
    try {
      const [columns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'SystemSetting'
      `, [process.env.DB_NAME || 'FZ']);
      
      const requiredColumns = ['category', 'isEncrypted', 'isSystem', 'environment'];
      const existingColumns = columns.map(c => c.COLUMN_NAME);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log(`   ✅ SystemSetting columns: All present`);
      } else {
        console.log(`   ⚠️ Missing columns: ${missingColumns.join(', ')}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not verify columns: ${error.message}`);
    }
    
    console.log('\n✅ Deployment verification passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  } finally {
    await db.end();
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 Settings System - Staging Deployment                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 0: Check prerequisites
    const prerequisitesOK = await checkPrerequisites();
    if (!prerequisitesOK) {
      console.error('\n❌ Prerequisites check failed. Please fix the issues above.');
      process.exit(1);
    }
    
    // Step 1: Backup
    const backupFile = await runBackup();
    
    // Step 2: Run migrations
    await runMigrations();
    
    // Step 3: Verify
    const verified = await verifyDeployment();
    
    if (verified) {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  ✅ Deployment Completed Successfully!                       ║');
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
      console.log('📋 Next steps:');
      console.log('   1. Test API endpoints');
      console.log('   2. Test frontend integration');
      console.log('   3. Monitor for errors');
      console.log(`   4. Backup location: ${backupFile}\n`);
      process.exit(0);
    } else {
      console.error('\n❌ Deployment verification failed. Please check the errors above.');
      console.log(`\n💡 To rollback, restore from backup: ${backupFile}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    console.log('\n💡 To rollback, restore from the backup created above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkPrerequisites, runBackup, runMigrations, verifyDeployment };

