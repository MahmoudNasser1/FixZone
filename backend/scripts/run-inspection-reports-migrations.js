/**
 * Run inspection reports enhancement migrations
 * - Add inspection type "فحص أثناء الإصلاح"
 * - Create FinalInspectionComponentTemplate table
 */

require('dotenv').config();
const db = require('../db');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../migrations');

const migrations = [
  'add_inspection_during_repair_type.sql',
  'create_final_inspection_template.sql'
];

async function runMigrations() {
  console.log('🚀 بدء تشغيل Migrations لتحسين نظام التقارير الفنية...\n');

  try {
    // التحقق من الاتصال
    await db.query('SELECT 1');
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    for (const migration of migrations) {
      const filePath = path.join(migrationsDir, migration);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ الملف غير موجود: ${migration}`);
        continue;
      }

      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`📄 تشغيل: ${migration}`);
        
        // تقسيم SQL إلى statements منفصلة بشكل صحيح
        try {
          // إزالة التعليقات أولاً
          let cleanSql = sql
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* ... */ comments
            .replace(/--.*$/gm, '') // Remove -- comments
            .trim();
          
          // تقسيم على ; مع الحفاظ على النصوص داخل quotes
          const statements = [];
          let currentStatement = '';
          let inQuotes = false;
          let quoteChar = null;
          
          for (let i = 0; i < cleanSql.length; i++) {
            const char = cleanSql[i];
            const nextChar = cleanSql[i + 1];
            
            if (!inQuotes && (char === '"' || char === "'" || char === '`')) {
              inQuotes = true;
              quoteChar = char;
              currentStatement += char;
            } else if (inQuotes && char === quoteChar && (nextChar !== quoteChar)) {
              inQuotes = false;
              quoteChar = null;
              currentStatement += char;
            } else if (!inQuotes && char === ';') {
              if (currentStatement.trim()) {
                statements.push(currentStatement.trim());
              }
              currentStatement = '';
            } else {
              currentStatement += char;
            }
          }
          
          // إضافة آخر statement إن وجد
          if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
          }
          
          // تنفيذ كل statement
          for (const statement of statements) {
            if (statement.trim()) {
              try {
                await db.query(statement);
              } catch (error) {
                // تجاهل الأخطاء المتعلقة بالوجود
                if (error.message.includes('already exists') || 
                    error.message.includes('Duplicate') ||
                    error.message.includes('Duplicate key') ||
                    error.code === 'ER_DUP_ENTRY' ||
                    error.code === 'ER_TABLE_EXISTS_ERROR' ||
                    error.code === '42S01') {
                  console.log(`   ⚠️  تخطي (موجود مسبقاً): ${error.message.substring(0, 100)}`);
                } else {
                  throw error;
                }
              }
            }
          }
        } catch (error) {
          // تجاهل الأخطاء المتعلقة بالوجود
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate') ||
              error.message.includes('Duplicate key') ||
              error.code === 'ER_DUP_ENTRY' ||
              error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.code === '42S01') {
            console.log(`   ⚠️  تخطي (موجود مسبقاً): ${error.message.substring(0, 100)}`);
          } else {
            throw error;
          }
        }

        console.log(`✅ تم تشغيل ${migration} بنجاح\n`);
      } catch (error) {
        console.error(`❌ خطأ في تشغيل ${migration}:`, error.message);
        // الاستمرار مع migration التالية
        continue;
      }
    }

    console.log('✅ تم تنفيذ جميع migrations بنجاح!');
    
    // التحقق من النتائج
    console.log('\n📊 التحقق من النتائج...');
    
    // التحقق من أنواع الفحص
    const [inspectionTypes] = await db.query('SELECT id, name, description FROM InspectionType WHERE deletedAt IS NULL ORDER BY name');
    console.log('\n📋 أنواع الفحص المتاحة:');
    inspectionTypes.forEach(type => {
      console.log(`   - ${type.name} (ID: ${type.id}): ${type.description || 'بدون وصف'}`);
    });

    // التحقق من جدول القوالب
    const [tableCheck] = await db.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'FinalInspectionComponentTemplate'
    `);
    
    if (tableCheck[0].count > 0) {
      const [templates] = await db.query('SELECT COUNT(*) as count FROM FinalInspectionComponentTemplate');
      console.log(`\n✅ جدول FinalInspectionComponentTemplate موجود ويحتوي على ${templates[0].count} قالب`);
      
      const [sampleTemplates] = await db.query('SELECT name, deviceCategory, displayOrder FROM FinalInspectionComponentTemplate ORDER BY displayOrder LIMIT 5');
      if (sampleTemplates.length > 0) {
        console.log('\n📝 أمثلة على القوالب:');
        sampleTemplates.forEach(template => {
          console.log(`   - ${template.name} (${template.deviceCategory})`);
        });
      }
    } else {
      console.log('\n⚠️  جدول FinalInspectionComponentTemplate غير موجود');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runMigrations();

