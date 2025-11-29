// backend/services/database/databaseBackupService.js
/**
 * Comprehensive Database Backup Service
 * Handles automated backups, restoration, and management
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const { promisify } = require('util');

const execPromise = util.promisify(exec);
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'FZ';
const DB_PORT = process.env.DB_PORT || 3306;

// Backup directory
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups', 'database');
const BACKUP_METADATA_FILE = path.join(BACKUP_DIR, 'backups_metadata.json');

class DatabaseBackupService {
  constructor() {
    this.mysqldumpPath = null;
    this.init();
  }

  /**
   * Initialize service - find mysqldump path
   */
  async init() {
    const mysqldumpPaths = [
      '/opt/lampp/bin/mysqldump',  // XAMPP
      'mysqldump',                  // System PATH
      '/usr/bin/mysqldump',         // Standard Linux
      '/usr/local/bin/mysqldump'    // Homebrew
    ];

    for (const p of mysqldumpPaths) {
      try {
        if (p === 'mysqldump') {
          await execPromise('which mysqldump');
          this.mysqldumpPath = p;
          break;
        } else {
          try {
            await fs.access(p);
            this.mysqldumpPath = p;
            break;
          } catch {
            // Try next path
          }
        }
      } catch {
        // Try next path
      }
    }

    if (!this.mysqldumpPath) {
      console.warn('⚠️ mysqldump not found. Backups may not work.');
    }

    // Ensure backup directory exists
    await this.ensureBackupDir();
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDir() {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating backup directory:', error);
    }
  }

  /**
   * Create database backup
   */
  async createBackup(options = {}) {
    const {
      name = null,
      description = null,
      compress = true,
      includeData = true,
      includeStructure = true,
      tables = null, // Specific tables to backup
      userId = null
    } = options;

    try {
      if (!this.mysqldumpPath) {
        throw new Error('mysqldump not found. Please install MySQL or ensure XAMPP is installed.');
      }

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      // Sanitize backup name: remove special characters, spaces, and non-ASCII characters
      const sanitizedName = name 
        ? name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\s+/g, '_').substring(0, 50)
        : null;
      const backupName = sanitizedName || `backup_${DB_NAME}_${timestamp}`;
      const sqlFile = path.join(BACKUP_DIR, `${backupName}.sql`);
      const compressedFile = path.join(BACKUP_DIR, `${backupName}.sql.gz`);

      // Build mysqldump command
      let command = `${this.mysqldumpPath} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER}`;

      // Note: Password should be passed via environment variable or config file
      // Using -p without password will prompt, which doesn't work in scripts
      // Try with password first, then without if it fails
      if (DB_PASSWORD && DB_PASSWORD.trim() !== '') {
        command += ` -p${DB_PASSWORD}`;
      }
      // Don't add -p if no password (will try to connect without password)

      // Add options
      if (includeStructure && includeData) {
        // Default: backup everything
      } else if (includeStructure && !includeData) {
        command += ' --no-data';
      } else if (!includeStructure && includeData) {
        command += ' --no-create-info';
      }

      // Specific tables
      if (tables && Array.isArray(tables) && tables.length > 0) {
        command += ` ${DB_NAME} ${tables.join(' ')}`;
      } else {
        command += ` ${DB_NAME}`;
      }

      command += ` > "${sqlFile}" 2>&1`;

      console.log(`⏳ Creating backup: ${backupName}...`);
      
      // Try to execute backup command
      let stats;
      let backupSucceeded = false;
      let lastError = null;
      
      try {
        const { stdout, stderr } = await execPromise(command);
        // Check if backup file was created
        try {
          stats = await fs.stat(sqlFile);
          if (stats.size > 0) {
            backupSucceeded = true;
          } else {
            lastError = new Error('Backup file is empty');
          }
        } catch (fileError) {
          // File not created, try alternative methods
          lastError = fileError;
        }
      } catch (execError) {
        // Command failed, try alternative methods
        lastError = execError;
        console.log('⚠️ First backup attempt failed, trying alternatives...');
      }

      // If backup failed and we used a password, try without password
      if (!backupSucceeded && DB_PASSWORD && DB_PASSWORD.trim() !== '') {
        try {
          console.log('⚠️ Trying backup without password...');
          const altCommand = command.replace(`-p${DB_PASSWORD}`, '');
          await execPromise(altCommand);
          stats = await fs.stat(sqlFile);
          if (stats.size > 0) {
            backupSucceeded = true;
          } else {
            lastError = new Error('Backup file is empty (alternative method)');
          }
        } catch (altError) {
          console.error('❌ Alternative backup method also failed:', altError.message);
          lastError = altError;
        }
      }

      // If still failed, throw error with helpful message
      if (!backupSucceeded) {
        const errorMessage = lastError?.message || 'Unknown error';
        const helpfulMessage = `Backup failed. Please check:
1. MySQL credentials in .env file (DB_USER, DB_PASSWORD)
2. MySQL server is running
3. User has backup permissions
4. Database name is correct (${DB_NAME})

Original error: ${errorMessage}`;
        throw new Error(helpfulMessage);
      }

      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      let finalFile = sqlFile;
      let fileSize = stats.size;

      // Compress if requested
      if (compress) {
        console.log('📦 Compressing backup...');
        const sqlContent = await fs.readFile(sqlFile);
        const compressed = await gzip(sqlContent);
        await fs.writeFile(compressedFile, compressed);
        await fs.unlink(sqlFile); // Delete uncompressed file
        finalFile = compressedFile;
        fileSize = compressed.length;
      }

      // Save metadata (use original name for display, sanitized for filename)
      const metadata = {
        id: Date.now().toString(),
        name: name || backupName, // Use original name for display
        description: description || null,
        filename: path.basename(finalFile),
        filepath: finalFile,
        size: fileSize,
        sizeMB: (fileSize / (1024 * 1024)).toFixed(2),
        compressed: compress,
        database: DB_NAME,
        createdAt: new Date().toISOString(),
        createdBy: userId || null,
        type: tables ? 'partial' : 'full'
      };

      await this.saveMetadata(metadata);

      console.log(`✅ Backup created: ${backupName}`);
      console.log(`   Size: ${metadata.sizeMB} MB`);
      console.log(`   Location: ${finalFile}`);

      return metadata;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  /**
   * List all backups
   */
  async listBackups(filters = {}) {
    try {
      const metadata = await this.loadMetadata();
      
      let backups = metadata.backups || [];

      // Apply filters
      if (filters.startDate) {
        backups = backups.filter(b => new Date(b.createdAt) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        backups = backups.filter(b => new Date(b.createdAt) <= new Date(filters.endDate));
      }
      if (filters.type) {
        backups = backups.filter(b => b.type === filters.type);
      }

      // Sort by date (newest first)
      backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return backups;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Get backup by ID
   * Note: This method is used for getting backup details (e.g., for restore)
   * For deletion, use deleteBackup() which doesn't require file to exist
   */
  async getBackup(backupId) {
    try {
      const metadata = await this.loadMetadata();
      // Normalize ID for comparison
      const normalizedId = String(backupId);
      const backup = (metadata.backups || []).find(b => {
        const bId = String(b.id || '');
        return bId === normalizedId || bId === String(backupId);
      });
      
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Check if file still exists (warn but don't fail for restore operations)
      try {
        await fs.access(backup.filepath);
      } catch {
        // File doesn't exist - return backup metadata anyway but log warning
        console.warn(`⚠️ Backup file not found on disk: ${backup.filepath}`);
        // Don't throw error - return backup metadata anyway
        // This allows viewing backup info even if file is missing
      }

      return backup;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupId, options = {}) {
    const {
      dropDatabase = false,
      createDatabase = true,
      userId = null
    } = options;

    try {
      const backup = await this.getBackup(backupId);
      
      console.log(`🔄 Restoring backup: ${backup.name}...`);

      // Find mysql path
      const mysqlPaths = [
        '/opt/lampp/bin/mysql',
        'mysql',
        '/usr/bin/mysql',
        '/usr/local/bin/mysql'
      ];

      let mysqlPath = null;
      for (const p of mysqlPaths) {
        try {
          if (p === 'mysql') {
            await execPromise('which mysql');
            mysqlPath = p;
            break;
          } else {
            await fs.access(p);
            mysqlPath = p;
            break;
          }
        } catch {
          // Try next
        }
      }

      if (!mysqlPath) {
        throw new Error('mysql client not found');
      }

      // Read backup file
      let sqlContent;
      if (backup.compressed) {
        const compressed = await fs.readFile(backup.filepath);
        sqlContent = (await gunzip(compressed)).toString();
      } else {
        sqlContent = await fs.readFile(backup.filepath, 'utf8');
      }

      // Helper function to build mysql command with password handling
      const buildMysqlCommand = (includePassword = true) => {
        let cmd = `${mysqlPath} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER}`;
        if (includePassword && DB_PASSWORD && DB_PASSWORD.trim() !== '') {
          cmd += ` -p${DB_PASSWORD}`;
        }
        // Don't add -p if no password (will try to connect without password)
        return cmd;
      };

      // Drop database if requested
      if (dropDatabase) {
        console.log('⚠️ Dropping existing database...');
        let dropCommand = `${buildMysqlCommand(true)} -e "DROP DATABASE IF EXISTS ${DB_NAME};"`;
        try {
          await execPromise(dropCommand);
          console.log(`✅ Database ${DB_NAME} dropped.`);
        } catch (dropError) {
          // If drop fails with password, try without password
          if (DB_PASSWORD && DB_PASSWORD.trim() !== '') {
            console.log('⚠️ Drop failed with password, trying without password...');
            dropCommand = `${buildMysqlCommand(false)} -e "DROP DATABASE IF EXISTS ${DB_NAME};"`;
            await execPromise(dropCommand);
            console.log(`✅ Database ${DB_NAME} dropped (without password).`);
          } else {
            throw dropError;
          }
        }
      }

      // Create database if requested
      if (createDatabase) {
        console.log('📝 Creating database...');
        let createCommand = `${buildMysqlCommand(true)} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"`;
        try {
          await execPromise(createCommand);
          console.log(`✅ Database ${DB_NAME} created.`);
        } catch (createError) {
          // If create fails with password, try without password
          if (DB_PASSWORD && DB_PASSWORD.trim() !== '') {
            console.log('⚠️ Create failed with password, trying without password...');
            createCommand = `${buildMysqlCommand(false)} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"`;
            await execPromise(createCommand);
            console.log(`✅ Database ${DB_NAME} created (without password).`);
          } else {
            throw createError;
          }
        }
      }

      // Restore - For compressed files, we need to decompress first
      if (backup.compressed) {
        const tempFile = path.join(BACKUP_DIR, `temp_restore_${Date.now()}.sql`);
        await fs.writeFile(tempFile, sqlContent);
        let restoreCommand = `${buildMysqlCommand(true)} ${DB_NAME} < "${tempFile}"`;
        try {
          await execPromise(restoreCommand);
          await fs.unlink(tempFile);
          console.log(`✅ Database restored from compressed backup.`);
        } catch (restoreError) {
          // If restore fails with password, try without password
          if (DB_PASSWORD && DB_PASSWORD.trim() !== '') {
            console.log('⚠️ Restore failed with password, trying without password...');
            restoreCommand = `${buildMysqlCommand(false)} ${DB_NAME} < "${tempFile}"`;
            await execPromise(restoreCommand);
            await fs.unlink(tempFile);
            console.log(`✅ Database restored (without password).`);
          } else {
            // Clean up temp file before throwing
            try {
              await fs.unlink(tempFile);
            } catch {}
            throw restoreError;
          }
        }
      } else {
        // Restore from uncompressed file
        let restoreCommand = `${buildMysqlCommand(true)} ${DB_NAME} < "${backup.filepath}"`;
        try {
          await execPromise(restoreCommand);
          console.log(`✅ Database restored from uncompressed backup.`);
        } catch (restoreError) {
          // If restore fails with password, try without password
          if (DB_PASSWORD && DB_PASSWORD.trim() !== '') {
            console.log('⚠️ Restore failed with password, trying without password...');
            restoreCommand = `${buildMysqlCommand(false)} ${DB_NAME} < "${backup.filepath}"`;
            await execPromise(restoreCommand);
            console.log(`✅ Database restored (without password).`);
          } else {
            throw restoreError;
          }
        }
      }

      // Log restoration
      await this.logRestoration(backupId, userId);

      console.log(`✅ Backup restored successfully: ${backup.name}`);
      return { success: true, backup: backup.name };
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId) {
    try {
      // Normalize backupId (handle both string and number)
      const normalizedId = String(backupId);
      
      // Get backup from metadata (don't check if file exists)
      const metadata = await this.loadMetadata();
      // Try to find by string ID first, then by number ID
      const backup = (metadata.backups || []).find(b => {
        const bId = String(b.id || '');
        return bId === normalizedId || bId === String(backupId);
      });
      
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Try to delete file if it exists (don't fail if it doesn't)
      if (backup.filepath) {
        try {
          await fs.access(backup.filepath);
          await fs.unlink(backup.filepath);
          console.log(`✅ Backup file deleted: ${backup.filepath}`);
        } catch (fileError) {
          // File doesn't exist or can't be deleted - that's okay, continue with metadata deletion
          console.warn(`⚠️ Backup file not found or can't be deleted: ${backup.filepath}`, fileError.message);
        }
      }

      // Remove from metadata (always do this, even if file deletion failed)
      metadata.backups = (metadata.backups || []).filter(b => 
        String(b.id) !== normalizedId && String(b.id) !== String(backupId)
      );
      await this.saveMetadataFile(metadata);

      console.log(`✅ Backup deleted from metadata: ${backup.name || backupId}`);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cleanup old backups
   */
  async cleanupOldBackups(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const backups = await this.listBackups();
      const toDelete = backups.filter(b => new Date(b.createdAt) < cutoffDate);

      let deleted = 0;
      for (const backup of toDelete) {
        try {
          await this.deleteBackup(backup.id);
          deleted++;
        } catch (error) {
          console.error(`Error deleting backup ${backup.id}:`, error.message);
        }
      }

      console.log(`✅ Cleaned up ${deleted} old backup(s)`);
      return { deleted, total: toDelete.length };
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getStatistics() {
    try {
      const backups = await this.listBackups();
      
      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      const byType = backups.reduce((acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1;
        return acc;
      }, {});

      const byMonth = backups.reduce((acc, b) => {
        const month = new Date(b.createdAt).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      return {
        total: backups.length,
        totalSizeMB: parseFloat(totalSizeMB),
        byType,
        byMonth,
        oldest: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
        newest: backups.length > 0 ? backups[0].createdAt : null
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        total: 0,
        totalSizeMB: 0,
        byType: {},
        byMonth: {},
        oldest: null,
        newest: null
      };
    }
  }

  /**
   * Load metadata
   */
  async loadMetadata() {
    try {
      const content = await fs.readFile(BACKUP_METADATA_FILE, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return { backups: [] };
    }
  }

  /**
   * Save metadata (for adding new backup)
   */
  async saveMetadata(metadata) {
    try {
      const data = await this.loadMetadata();
      if (!data.backups) {
        data.backups = [];
      }
      data.backups.push(metadata);
      await fs.writeFile(BACKUP_METADATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  /**
   * Save metadata (for updating existing metadata - e.g., after deletion)
   */
  async saveMetadataFile(metadata) {
    try {
      await fs.writeFile(BACKUP_METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error saving metadata file:', error);
      throw error;
    }
  }

  /**
   * Log restoration
   */
  async logRestoration(backupId, userId) {
    try {
      const metadata = await this.loadMetadata();
      if (!metadata.restorations) {
        metadata.restorations = [];
      }
      metadata.restorations.push({
        backupId,
        restoredAt: new Date().toISOString(),
        restoredBy: userId
      });
      await fs.writeFile(BACKUP_METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error logging restoration:', error);
    }
  }
}

module.exports = new DatabaseBackupService();

