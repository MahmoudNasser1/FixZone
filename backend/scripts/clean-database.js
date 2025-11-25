#!/usr/bin/env node

/**
 * Clean Database Script - تنظيف قاعدة البيانات
 * 
 * هذا السكربت يقوم بمسح جميع البيانات من الجداول
 * مع الحفاظ على بنية الجداول (Structure)
 * 
 * Usage:
 *   node backend/scripts/clean-database.js
 *   node backend/scripts/clean-database.js --database=marina
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const dbNameArg = args.find(arg => arg.startsWith('--database='));
const databaseName = dbNameArg ? dbNameArg.split('=')[1] : (process.env.DB_NAME || 'FZ');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: databaseName,
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true
};

async function cleanDatabase() {
    let connection;
    
    try {
        console.log('🔌 جاري الاتصال بقاعدة البيانات...');
        console.log(`📊 قاعدة البيانات: ${databaseName}`);
        console.log(`🔗 Host: ${dbConfig.host}:${dbConfig.port}`);
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ تم الاتصال بنجاح\n');
        
        // Get all table names
        console.log('📋 جاري الحصول على قائمة الجداول...');
        const [tables] = await connection.execute(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = ? 
             AND table_type = 'BASE TABLE'`,
            [databaseName]
        );
        
        if (tables.length === 0) {
            console.log('⚠️  لا توجد جداول في قاعدة البيانات');
            return;
        }
        
        console.log(`✅ تم العثور على ${tables.length} جدول\n`);
        
        // Disable foreign key checks
        console.log('🔒 تعطيل فحص المفاتيح الخارجية...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('✅ تم التعطيل\n');
        
        // Truncate all tables
        console.log('🗑️  جاري مسح البيانات من الجداول...\n');
        let successCount = 0;
        let errorCount = 0;
        
        for (const table of tables) {
            const tableName = table.table_name;
            try {
                await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
                console.log(`  ✅ ${tableName}`);
                successCount++;
            } catch (error) {
                console.error(`  ❌ ${tableName}: ${error.message}`);
                errorCount++;
            }
        }
        
        // Re-enable foreign key checks
        console.log('\n🔓 إعادة تفعيل فحص المفاتيح الخارجية...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ تم التفعيل\n');
        
        // Summary
        console.log('═'.repeat(50));
        console.log('📊 ملخص العملية:');
        console.log(`  ✅ نجح: ${successCount} جدول`);
        if (errorCount > 0) {
            console.log(`  ❌ فشل: ${errorCount} جدول`);
        }
        console.log(`  📋 إجمالي: ${tables.length} جدول`);
        console.log('═'.repeat(50));
        console.log('\n✅ تم تنظيف قاعدة البيانات بنجاح!');
        console.log('📌 ملاحظة: تم الحفاظ على بنية الجداول (Structure)');
        
    } catch (error) {
        console.error('\n❌ حدث خطأ أثناء تنظيف قاعدة البيانات:');
        console.error(`   ${error.message}`);
        if (error.code) {
            console.error(`   Error Code: ${error.code}`);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
        }
    }
}

// Run the script
if (require.main === module) {
    cleanDatabase().catch(error => {
        console.error('❌ خطأ غير متوقع:', error);
        process.exit(1);
    });
}

module.exports = { cleanDatabase };

