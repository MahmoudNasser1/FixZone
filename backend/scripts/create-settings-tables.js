// backend/scripts/create-settings-tables.js
// Create remaining settings tables
require('dotenv').config();
const db = require('../db');

async function createTables() {
  try {
    console.log('🔄 Creating Settings tables...\n');

    // Create SettingHistory table
    console.log('Creating SettingHistory table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS SettingHistory (
        id INT PRIMARY KEY AUTO_INCREMENT,
        settingId INT NOT NULL,
        settingKey VARCHAR(100) NOT NULL,
        oldValue TEXT NULL,
        newValue TEXT NOT NULL,
        changedBy INT NOT NULL,
        changeReason TEXT NULL,
        ipAddress VARCHAR(45) NULL,
        userAgent TEXT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (settingId) REFERENCES SystemSetting(id) ON DELETE CASCADE,
        FOREIGN KEY (changedBy) REFERENCES User(id),
        INDEX idx_settingId (settingId),
        INDEX idx_settingKey (settingKey),
        INDEX idx_changedBy (changedBy),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ SettingHistory table created');

    // Create SettingCategory table
    console.log('Creating SettingCategory table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS SettingCategory (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        icon VARCHAR(50) NULL,
        sortOrder INT DEFAULT 0,
        parentCategoryId INT NULL,
        isActive TINYINT(1) DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parentCategoryId) REFERENCES SettingCategory(id),
        INDEX idx_code (code),
        INDEX idx_parentCategoryId (parentCategoryId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ SettingCategory table created');

    // Insert default categories
    console.log('Inserting default categories...');
    await db.execute(`
      INSERT INTO SettingCategory (code, name, description, icon, sortOrder) VALUES
      ('general', 'عام', 'الإعدادات العامة للنظام', 'Settings', 1),
      ('currency', 'العملة', 'إعدادات العملة والعرض المالي', 'DollarSign', 2),
      ('printing', 'الطباعة', 'إعدادات الطباعة والإيصالات', 'Printer', 3),
      ('messaging', 'المراسلة', 'إعدادات المراسلة والبريد الإلكتروني', 'MessageSquare', 4),
      ('locale', 'المحلية', 'إعدادات اللغة والتاريخ والوقت', 'Globe', 5),
      ('system', 'النظام', 'إعدادات النظام المتقدمة', 'Server', 6),
      ('variables', 'المتغيرات', 'متغيرات النظام (العلامات التجارية، الملحقات، إلخ)', 'List', 7),
      ('advanced', 'متقدم', 'الإعدادات المتقدمة', 'Cog', 8)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    console.log('✅ Default categories inserted');

    // Create SettingBackup table
    console.log('Creating SettingBackup table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS SettingBackup (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        settings JSON NOT NULL COMMENT 'Full settings snapshot',
        createdBy INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES User(id),
        INDEX idx_createdBy (createdBy),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ SettingBackup table created');

    console.log('\n✅ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
      console.log('⚠️  Table already exists, skipping...');
      process.exit(0);
    }
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

createTables();

