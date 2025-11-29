#!/usr/bin/env node
/**
 * Create Full Backup Script
 * Creates a complete backup of the database before deployment
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'FZ';

const BACKUP_DIR = path.join(__dirname, '../../backups');
const FULL_BACKUP_DIR = path.join(BACKUP_DIR, 'full');

async function ensureDirectories() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(FULL_BACKUP_DIR, { recursive: true });
    console.log('✅ Backup directories ready');
  } catch (error) {
    console.error('❌ Failed to create backup directories:', error.message);
    throw error;
  }
}

async function findMysqldump() {
  const possiblePaths = [
    'mysqldump',
    '/opt/lampp/bin/mysqldump',
    '/usr/bin/mysqldump',
    '/usr/local/bin/mysqldump',
  ];

  for (const dumpPath of possiblePaths) {
    try {
      if (dumpPath === 'mysqldump') {
        await execPromise('which mysqldump');
        return 'mysqldump';
      } else {
        await fs.access(dumpPath);
        return dumpPath;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error('mysqldump not found. Please install MySQL or ensure XAMPP is installed.');
}

async function createBackup() {
  try {
    console.log('📦 Creating full database backup...');
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`   User: ${DB_USER}`);

    await ensureDirectories();

    const mysqldumpPath = await findMysqldump();
    console.log(`   Using: ${mysqldumpPath}`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const backupFilename = `full_backup_${DB_NAME}_${timestamp}.sql`;
    const backupPath = path.join(FULL_BACKUP_DIR, backupFilename);

    let command = `${mysqldumpPath} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER}`;

    if (DB_PASSWORD) {
      command += ` -p${DB_PASSWORD}`;
    }

    command += ` --single-transaction --routines --triggers ${DB_NAME} > "${backupPath}" 2>&1`;

    console.log('⏳ Executing backup...');
    await execPromise(command);

    // Verify backup file exists and has content
    const stats = await fs.stat(backupPath);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }

    console.log(`✅ Backup created successfully!`);
    console.log(`   File: ${backupFilename}`);
    console.log(`   Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Location: ${backupPath}`);

    // Create a metadata file
    const metadata = {
      timestamp: new Date().toISOString(),
      database: DB_NAME,
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      filename: backupFilename,
      size: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      type: 'full',
      description: 'Full database backup before settings system deployment'
    };

    const metadataPath = path.join(FULL_BACKUP_DIR, `metadata_${timestamp}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`✅ Metadata saved: ${path.basename(metadataPath)}`);

    return {
      success: true,
      backupPath,
      metadataPath,
      metadata
    };

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    // Try without password if initial attempt failed
    if (DB_PASSWORD && error.message.includes('Access denied')) {
      console.log('⚠️ Trying backup without password...');
      try {
        const mysqldumpPath = await findMysqldump();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
        const backupFilename = `full_backup_${DB_NAME}_${timestamp}.sql`;
        const backupPath = path.join(FULL_BACKUP_DIR, backupFilename);
        
        const command = `${mysqldumpPath} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} --single-transaction --routines --triggers ${DB_NAME} > "${backupPath}" 2>&1`;
        await execPromise(command);
        
        const stats = await fs.stat(backupPath);
        if (stats.size > 0) {
          console.log(`✅ Backup created successfully (without password)!`);
          console.log(`   File: ${backupFilename}`);
          console.log(`   Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
          return {
            success: true,
            backupPath,
            metadata: {
              timestamp: new Date().toISOString(),
              database: DB_NAME,
              filename: backupFilename,
              size: stats.size
            }
          };
        }
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
      }
    }
    
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createBackup()
    .then((result) => {
      console.log('\n✅ Full backup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Full backup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createBackup };

