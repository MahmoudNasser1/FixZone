// backend/scripts/seed-default-settings.js
// Seed default settings for Settings system
require('dotenv').config();
const db = require('../db');

const DEFAULT_SETTINGS = [
  // General Settings
  {
    key: 'company.name',
    value: 'FixZone',
    type: 'string',
    category: 'general',
    description: 'اسم الشركة',
    isSystem: false,
    isPublic: true,
    defaultValue: 'FixZone'
  },
  {
    key: 'company.address',
    value: 'مول البستان التجاري - الدور الأرضي',
    type: 'string',
    category: 'general',
    description: 'عنوان الشركة',
    isSystem: false,
    isPublic: true
  },
  {
    key: 'company.phone',
    value: '01270388043',
    type: 'string',
    category: 'general',
    description: 'رقم الهاتف',
    isSystem: false,
    isPublic: true
  },
  {
    key: 'company.website',
    value: 'https://fixzzone.com',
    type: 'string',
    category: 'general',
    description: 'الموقع الإلكتروني',
    isSystem: false,
    isPublic: true
  },
  {
    key: 'company.logoUrl',
    value: '/logo.png',
    type: 'string',
    category: 'general',
    description: 'رابط الشعار',
    isSystem: false,
    isPublic: true
  },
  
  // Currency Settings
  {
    key: 'currency.code',
    value: 'EGP',
    type: 'string',
    category: 'currency',
    description: 'رمز العملة',
    isSystem: false,
    isPublic: true,
    defaultValue: 'EGP'
  },
  {
    key: 'currency.symbol',
    value: 'ج.م',
    type: 'string',
    category: 'currency',
    description: 'رمز العملة',
    isSystem: false,
    isPublic: true,
    defaultValue: 'ج.م'
  },
  {
    key: 'currency.name',
    value: 'الجنيه المصري',
    type: 'string',
    category: 'currency',
    description: 'اسم العملة',
    isSystem: false,
    isPublic: true,
    defaultValue: 'الجنيه المصري'
  },
  {
    key: 'currency.locale',
    value: 'ar-EG',
    type: 'string',
    category: 'currency',
    description: 'اللغة المحلية',
    isSystem: false,
    isPublic: true,
    defaultValue: 'ar-EG'
  },
  {
    key: 'currency.minimumFractionDigits',
    value: '2',
    type: 'number',
    category: 'currency',
    description: 'عدد الأرقام العشرية',
    isSystem: false,
    isPublic: true,
    defaultValue: '2'
  },
  {
    key: 'currency.position',
    value: 'after',
    type: 'string',
    category: 'currency',
    description: 'موضع رمز العملة (before/after)',
    isSystem: false,
    isPublic: true,
    defaultValue: 'after'
  },
  
  // Printing Settings
  {
    key: 'printing.defaultCopy',
    value: 'customer',
    type: 'string',
    category: 'printing',
    description: 'نسخة الطباعة الافتراضية',
    isSystem: false,
    isPublic: false,
    defaultValue: 'customer'
  },
  {
    key: 'printing.showWatermark',
    value: 'true',
    type: 'boolean',
    category: 'printing',
    description: 'إظهار العلامة المائية',
    isSystem: false,
    isPublic: false,
    defaultValue: 'true'
  },
  {
    key: 'printing.paperSize',
    value: 'A4',
    type: 'string',
    category: 'printing',
    description: 'حجم الورق',
    isSystem: false,
    isPublic: false,
    defaultValue: 'A4'
  },
  {
    key: 'printing.showSerialBarcode',
    value: 'true',
    type: 'boolean',
    category: 'printing',
    description: 'إظهار الباركود التسلسلي',
    isSystem: false,
    isPublic: false,
    defaultValue: 'true'
  },
  
  // Locale Settings
  {
    key: 'locale.rtl',
    value: 'true',
    type: 'boolean',
    category: 'locale',
    description: 'اتجاه النص من اليمين لليسار',
    isSystem: false,
    isPublic: false,
    defaultValue: 'true'
  },
  {
    key: 'locale.dateFormat',
    value: 'yyyy/MM/dd',
    type: 'string',
    category: 'locale',
    description: 'تنسيق التاريخ',
    isSystem: false,
    isPublic: false,
    defaultValue: 'yyyy/MM/dd'
  },
  
  // System Settings
  {
    key: 'system.timezone',
    value: 'Africa/Cairo',
    type: 'string',
    category: 'system',
    description: 'المنطقة الزمنية',
    isSystem: true,
    isPublic: false,
    defaultValue: 'Africa/Cairo'
  },
  {
    key: 'system.language',
    value: 'ar',
    type: 'string',
    category: 'system',
    description: 'لغة النظام',
    isSystem: true,
    isPublic: false,
    defaultValue: 'ar'
  }
];

async function seedSettings() {
  console.log('🚀 Starting to seed default settings...\n');
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const setting of DEFAULT_SETTINGS) {
    try {
      // Check if setting already exists
      const [existing] = await db.execute(
        'SELECT id FROM SystemSetting WHERE `key` = ?',
        [setting.key]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${setting.key} (already exists)`);
        skipped++;
        continue;
      }
      
      // Insert new setting
      await db.execute(
        `INSERT INTO SystemSetting (
          \`key\`, value, type, category, description, 
          isSystem, isPublic, defaultValue, environment, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'all', NOW(), NOW())`,
        [
          setting.key,
          setting.value,
          setting.type,
          setting.category,
          setting.description,
          setting.isSystem ? 1 : 0,
          setting.isPublic ? 1 : 0,
          setting.defaultValue || null
        ]
      );
      
      console.log(`✅ Created ${setting.key} (${setting.category})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${setting.key}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n✅ Seed process completed!`);
}

async function main() {
  try {
    await seedSettings();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedSettings };

