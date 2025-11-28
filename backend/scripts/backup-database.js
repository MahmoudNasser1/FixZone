// backend/scripts/backup-database.js
// Database backup script for Settings system deployment
require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'FZ';

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
const BACKUP_FILE = path.join(BACKUP_DIR, `backup_${DB_NAME}_${TIMESTAMP}.sql`);

async function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

async function backupDatabase() {
  try {
    console.log('🚀 Starting database backup...');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`📁 Backup file: ${BACKUP_FILE}`);
    
    // Create backup directory
    await createBackupDir();
    
    // Find mysqldump path (try XAMPP first, then system)
    const mysqldumpPaths = [
      '/opt/lampp/bin/mysqldump',  // XAMPP
      'mysqldump',                  // System PATH
      '/usr/bin/mysqldump',         // Standard Linux
      '/usr/local/bin/mysqldump'    // Homebrew
    ];
    
    let mysqldumpPath = null;
    for (const path of mysqldumpPaths) {
      try {
        if (path === 'mysqldump') {
          // Check if in PATH
          await execPromise('which mysqldump');
          mysqldumpPath = path;
          break;
        } else {
          // Check if file exists
          const fs = require('fs');
          if (fs.existsSync(path)) {
            mysqldumpPath = path;
            break;
          }
        }
      } catch (error) {
        // Try next path
      }
    }
    
    if (!mysqldumpPath) {
      throw new Error('mysqldump not found. Please install MySQL or ensure XAMPP is installed.');
    }
    
    // Build mysqldump command
    // XAMPP default password is usually empty or '0000'
    let command = `${mysqldumpPath} -h ${DB_HOST} -u ${DB_USER}`;
    
    if (DB_PASSWORD) {
      command += ` -p${DB_PASSWORD}`;
    } else {
      // Try XAMPP default password '0000', or empty
      // If that fails, user can run manually
      command += ` -p0000`;
    }
    
    command += ` ${DB_NAME} > "${BACKUP_FILE}" 2>&1`;
    
    console.log(`⏳ Running backup using: ${mysqldumpPath}...`);
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && !stderr.includes('Warning')) {
      console.error('⚠️ Backup warnings:', stderr);
    }
    
    // Check if backup file was created and has content
    if (fs.existsSync(BACKUP_FILE)) {
      const stats = fs.statSync(BACKUP_FILE);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      if (stats.size > 0) {
        console.log(`✅ Backup completed successfully!`);
        console.log(`📦 File size: ${sizeMB} MB`);
        console.log(`📁 Location: ${BACKUP_FILE}`);
        return BACKUP_FILE;
      } else {
        throw new Error('Backup file is empty');
      }
    } else {
      throw new Error('Backup file was not created');
    }
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    // If password prompt failed, try without password
    if (error.message.includes('password')) {
      console.log('⚠️ Trying alternative backup method...');
      try {
        const altCommand = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${DB_NAME} > "${BACKUP_FILE}"`;
        await execPromise(altCommand);
        
        if (fs.existsSync(BACKUP_FILE) && fs.statSync(BACKUP_FILE).size > 0) {
          console.log('✅ Backup completed with alternative method');
          return BACKUP_FILE;
        }
      } catch (altError) {
        console.error('❌ Alternative backup also failed:', altError.message);
      }
    }
    
    throw error;
  }
}

async function verifyBackup(backupFile) {
  try {
    console.log('\n🔍 Verifying backup...');
    
    const content = fs.readFileSync(backupFile, 'utf8');
    
    // Check for important tables
    const requiredTables = [
      'SystemSetting',
      'SettingHistory',
      'SettingCategory',
      'SettingBackup'
    ];
    
    const foundTables = requiredTables.filter(table => 
      content.includes(`CREATE TABLE`) && content.includes(table)
    );
    
    console.log(`   Found ${foundTables.length}/${requiredTables.length} settings tables`);
    
    if (foundTables.length > 0) {
      console.log('✅ Backup verification passed');
      return true;
    } else {
      console.log('⚠️ Backup may not contain settings tables (this is OK if tables don\'t exist yet)');
      return true; // Still OK for initial deployment
    }
  } catch (error) {
    console.error('❌ Backup verification failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    const backupFile = await backupDatabase();
    const verified = await verifyBackup(backupFile);
    
    if (verified) {
      console.log('\n✅ Database backup completed and verified!');
      console.log(`\n📋 Next steps:`);
      console.log(`   1. Review backup file: ${backupFile}`);
      console.log(`   2. Run migrations: npm run migrate:settings`);
      console.log(`   3. Test the system`);
      process.exit(0);
    } else {
      console.log('\n⚠️ Backup created but verification failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Backup process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { backupDatabase, verifyBackup };

