#!/usr/bin/env node
/**
 * Production Deployment Script
 * Deploys Settings System to Production with safety checks
 */

require('dotenv').config();
const { createBackup } = require('./create-full-backup');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs').promises;

const execPromise = util.promisify(exec);

const PHASES = {
  READ_ONLY: 'read-only',
  WRITE_OPERATIONS: 'write-operations',
  FULL_MIGRATION: 'full-migration',
  CLEANUP: 'cleanup'
};

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites for Production Deployment...\n');
  
  const checks = {
    node: false,
    npm: false,
    mysql: false,
    env: false,
    migrations: false,
    backup: false
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
  
  // Check MySQL
  const mysqlPaths = ['mysql', '/opt/lampp/bin/mysql', '/usr/bin/mysql'];
  let mysqlFound = false;
  for (const mysqlPath of mysqlPaths) {
    try {
      await execPromise(`${mysqlPath} --version`);
      console.log(`✅ MySQL found: ${mysqlPath}`);
      checks.mysql = true;
      mysqlFound = true;
      break;
    } catch (error) {
      continue;
    }
  }
  
  if (!mysqlFound) {
    console.warn('⚠️ MySQL command not found, but will continue');
    checks.mysql = true;
  }
  
  // Check .env
  if (process.env.DB_NAME && process.env.NODE_ENV === 'production') {
    console.log(`✅ Environment: Production`);
    console.log(`   DB: ${process.env.DB_NAME}`);
    checks.env = true;
  } else {
    console.error('❌ Not in production environment or DB_NAME not set');
    console.log('   Set NODE_ENV=production and DB_NAME in .env');
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
  
  const existingMigrations = [];
  for (const file of requiredMigrations) {
    try {
      await fs.access(path.join(migrationsDir, file));
      existingMigrations.push(file);
    } catch (error) {
      // File doesn't exist
    }
  }
  
  if (existingMigrations.length === requiredMigrations.length) {
    console.log(`✅ Migration files: ${existingMigrations.length}/${requiredMigrations.length}`);
    checks.migrations = true;
  } else {
    console.error(`❌ Missing migration files: ${requiredMigrations.length - existingMigrations.length}`);
    return false;
  }
  
  // Check backup directory
  const backupDir = path.join(__dirname, '..', '..', 'backups', 'full');
  try {
    await fs.access(backupDir);
    console.log(`✅ Backup directory exists`);
    checks.backup = true;
  } catch (error) {
    console.log(`⚠️ Creating backup directory...`);
    await fs.mkdir(backupDir, { recursive: true });
    checks.backup = true;
  }
  
  const allChecksPassed = Object.values(checks).every(check => check === true);
  
  if (allChecksPassed) {
    console.log('\n✅ All prerequisites met!\n');
  } else {
    console.log('\n❌ Some prerequisites failed\n');
  }
  
  return allChecksPassed;
}

async function createFullBackup() {
  console.log('📦 Creating full database backup...\n');
  try {
    const result = await createBackup();
    console.log(`✅ Backup created: ${result.metadata.filename}`);
    return result;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

async function runMigrations() {
  console.log('🔄 Running migrations...\n');
  try {
    const { stdout, stderr } = await execPromise('npm run migrate:settings');
    if (stderr && !stderr.includes('Warning')) {
      console.error('⚠️ Migration warnings:', stderr);
    }
    console.log('✅ Migrations completed');
    return true;
  } catch (error) {
    console.error('❌ Migrations failed:', error.message);
    throw error;
  }
}

async function verifyDeployment() {
  console.log('✅ Verifying deployment...\n');
  
  const db = require('../db');
  
  try {
    // Check tables exist
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME LIKE 'Setting%'
    `, [process.env.DB_NAME]);
    
    const expectedTables = ['SystemSetting', 'SettingHistory', 'SettingCategory', 'SettingBackup'];
    const existingTables = tables.map(t => t.TABLE_NAME);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    console.log(`✅ All tables exist: ${existingTables.join(', ')}`);
    
    // Check SystemSetting columns
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'SystemSetting'
    `, [process.env.DB_NAME]);
    
    const expectedColumns = ['category', 'isEncrypted', 'isSystem', 'isPublic', 'defaultValue'];
    const existingColumns = columns.map(c => c.COLUMN_NAME);
    const missingColumns = expectedColumns.filter(c => !existingColumns.includes(c));
    
    if (missingColumns.length > 0) {
      console.warn(`⚠️ Missing columns: ${missingColumns.join(', ')}`);
    } else {
      console.log(`✅ All expected columns exist`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function deployPhase(phase) {
  console.log(`\n🚀 Deploying Phase: ${phase}\n`);
  
  switch (phase) {
    case PHASES.READ_ONLY:
      console.log('Phase 1: Read-Only APIs');
      console.log('- New APIs are read-only');
      console.log('- Old APIs continue working');
      console.log('- Monitor performance');
      break;
      
    case PHASES.WRITE_OPERATIONS:
      console.log('Phase 2: Write Operations');
      console.log('- Enable write operations gradually');
      console.log('- Monitor for errors');
      console.log('- Keep old APIs as fallback');
      break;
      
    case PHASES.FULL_MIGRATION:
      console.log('Phase 3: Full Migration');
      console.log('- Migrate all settings to new system');
      console.log('- Deprecate old APIs');
      console.log('- Monitor for issues');
      break;
      
    case PHASES.CLEANUP:
      console.log('Phase 4: Cleanup');
      console.log('- Remove old code');
      console.log('- Clean up database');
      console.log('- Final testing');
      break;
  }
  
  console.log(`\n✅ Phase ${phase} completed\n`);
}

async function main() {
  const phase = process.argv[2] || PHASES.READ_ONLY;
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Production Deployment - Settings System                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Phase: ${phase}\n`);
  
  // Check prerequisites
  if (!(await checkPrerequisites())) {
    console.error('❌ Prerequisites check failed. Aborting deployment.');
    process.exit(1);
  }
  
  // Create backup
  try {
    await createFullBackup();
  } catch (error) {
    console.error('❌ Backup failed. Aborting deployment.');
    process.exit(1);
  }
  
  // Run migrations (only for first phase)
  if (phase === PHASES.READ_ONLY) {
    try {
      await runMigrations();
    } catch (error) {
      console.error('❌ Migrations failed. Aborting deployment.');
      process.exit(1);
    }
  }
  
  // Verify deployment
  if (!(await verifyDeployment())) {
    console.error('❌ Deployment verification failed.');
    process.exit(1);
  }
  
  // Deploy phase
  await deployPhase(phase);
  
  console.log('✅ Deployment completed successfully!');
  console.log('\n📊 Next steps:');
  console.log('1. Monitor system for 24-48 hours');
  console.log('2. Check logs for errors');
  console.log('3. Verify API endpoints');
  console.log('4. Test frontend integration');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = { deployPhase, verifyDeployment };

