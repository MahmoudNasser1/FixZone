#!/usr/bin/env node
/**
 * تحويل البيانات من النظام القديم إلى النظام الجديد
 * Transform Data from Old to New System
 * 
 * هذا السكريبت يقوم بـ:
 * 1. قراءة البيانات المستخرجة
 * 2. تحويلها للصيغة المناسبة للنظام الجديد
 * 3. إنشاء ملفات SQL للاستيراد
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// المسارات
const EXTRACTED_DIR = path.join(__dirname, 'extracted_data');
const OUTPUT_DIR = path.join(__dirname, 'import_sql');

// إنشاء مجلد الإخراج
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔄 بدء تحويل البيانات...\n');

/**
 * إنشاء tracking token فريد
 */
function generateTrackingToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * تحويل حالة النظام القديم إلى الجديد
 */
function mapStatus(oldStatus) {
  const statusMap = {
    '1': 'RECEIVED',
    '2': 'INSPECTION',
    '3': 'AWAITING_APPROVAL',
    '4': 'UNDER_REPAIR',
    '5': 'READY_FOR_DELIVERY',
    '6': 'DELIVERED',
    '7': 'REJECTED',
    '8': 'WAITING_PARTS',
    '9': 'ON_HOLD'
  };
  
  return statusMap[oldStatus] || 'RECEIVED';
}

/**
 * escape SQL strings
 */
function escapeSql(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * تحويل العملاء
 */
function transformCustomers(clientsData) {
  console.log('👥 تحويل العملاء...');
  
  const customers = [];
  const activeClients = clientsData.rows.filter(row => !row.deleted_at);
  
  console.log(`   إجمالي: ${clientsData.rows.length}`);
  console.log(`   نشط: ${activeClients.length}`);
  console.log(`   محذوف: ${clientsData.rows.length - activeClients.length}\n`);
  
  activeClients.forEach((client, index) => {
    const customFields = JSON.stringify({
      old_system_id: client.id,
      price_type: client.price_type,
      balance: client.balance,
      imported_at: new Date().toISOString()
    });
    
    // تحويل تاريخ ISO إلى MySQL datetime format
    const createdAt = client.created_at ? 
      new Date(client.created_at).toISOString().slice(0, 19).replace('T', ' ') : 
      new Date().toISOString().slice(0, 19).replace('T', ' ');
    const updatedAt = client.updated_at ? 
      new Date(client.updated_at).toISOString().slice(0, 19).replace('T', ' ') : 
      new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    customers.push({
      // id سيتم إنشاؤه تلقائياً (AUTO_INCREMENT)
      name: client.name,
      phone: client.mobile,
      email: null, // لا يوجد في النظام القديم
      address: client.address,
      companyId: null, // لا يوجد في النظام القديم
      customFields: customFields,
      createdAt: createdAt,
      updatedAt: updatedAt,
      deletedAt: null
    });
  });
  
  // إنشاء SQL
  let sql = '-- استيراد العملاء من النظام القديم\n';
  sql += '-- Import Customers from Old System\n';
  sql += `-- Total: ${customers.length} customers\n\n`;
  
  sql += 'INSERT INTO `Customer` (`name`, `phone`, `email`, `address`, `companyId`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
  
  const values = customers.map(c => 
    `(${escapeSql(c.name)}, ${escapeSql(c.phone)}, ${escapeSql(c.email)}, ${escapeSql(c.address)}, ${escapeSql(c.companyId)}, ${escapeSql(c.customFields)}, ${escapeSql(c.createdAt)}, ${escapeSql(c.updatedAt)}, ${escapeSql(c.deletedAt)})`
  );
  
  sql += values.join(',\n');
  sql += ';\n';
  
  console.log(`   ✅ تم تحويل ${customers.length} عميل\n`);
  
  return { sql, count: customers.length, data: customers };
}

/**
 * تحويل Lookups إلى VariableOptions
 */
function transformLookups(lookupsData) {
  console.log('🏷️  تحويل القيم المساعدة...');
  
  // تجميع حسب النوع
  const byType = {};
  lookupsData.rows.forEach(lookup => {
    const type = lookup.type || 'brand';
    if (!byType[type]) {
      byType[type] = [];
    }
    byType[type].push(lookup);
  });
  
  console.log('   الأنواع المكتشفة:');
  Object.keys(byType).forEach(type => {
    console.log(`     - ${type}: ${byType[type].length} قيمة`);
  });
  console.log('');
  
  // أولاً: إنشاء VariableCategories
  let categoriesSql = '-- إنشاء فئات المتغيرات\n';
  categoriesSql += '-- Create Variable Categories\n\n';
  
  const categories = Object.keys(byType).map(type => {
    const nameMap = {
      'brand': 'الماركات',
      'deviceType': 'أنواع الأجهزة',
      'accessories': 'الملحقات',
      'examination': 'نتائج الفحص',
      'category': 'الفئات'
    };
    
    return {
      code: type,
      name: nameMap[type] || type,
      scope: type === 'brand' || type === 'deviceType' ? 'DEVICE' : 'GLOBAL'
    };
  });
  
  categoriesSql += 'INSERT INTO `VariableCategory` (`code`, `name`, `scope`) VALUES\n';
  categoriesSql += categories.map(c => 
    `(${escapeSql(c.code)}, ${escapeSql(c.name)}, ${escapeSql(c.scope)})`
  ).join(',\n');
  categoriesSql += '\nON DUPLICATE KEY UPDATE `name` = VALUES(`name`);\n\n';
  
  // ثانياً: إنشاء VariableOptions
  let optionsSql = '-- إضافة قيم المتغيرات\n';
  optionsSql += '-- Add Variable Options\n\n';
  
  let totalOptions = 0;
  
  Object.keys(byType).forEach(type => {
    optionsSql += `-- ${type} (${byType[type].length} options)\n`;
    
    const options = byType[type].map((lookup, idx) => {
      const categoryIdSubquery = `(SELECT id FROM \`VariableCategory\` WHERE code = ${escapeSql(type)})`;
      return `(${categoryIdSubquery}, ${escapeSql(lookup.name)}, ${escapeSql(lookup.name)}, 1, ${idx + 1})`;
    });
    
    if (options.length > 0) {
      optionsSql += `INSERT INTO \`VariableOption\` (\`categoryId\`, \`label\`, \`value\`, \`isActive\`, \`sortOrder\`) VALUES\n`;
      optionsSql += options.join(',\n');
      optionsSql += ';\n\n';
    }
    
    totalOptions += byType[type].length;
  });
  
  console.log(`   ✅ تم تحويل ${categories.length} فئة و ${totalOptions} قيمة\n`);
  
  return {
    sql: categoriesSql + optionsSql,
    categoriesCount: categories.length,
    optionsCount: totalOptions
  };
}

// تنفيذ التحويل
try {
  console.log(`📂 قراءة البيانات من: ${EXTRACTED_DIR}\n`);
  
  // قراءة الملخص
  const summaryFile = path.join(EXTRACTED_DIR, '_summary.json');
  if (!fs.existsSync(summaryFile)) {
    console.error('❌ لم يتم العثور على ملف الملخص. قم بتشغيل 1_extract_old_data.js أولاً');
    process.exit(1);
  }
  
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  console.log('📊 الملخص:');
  summary.tables.forEach(t => {
    console.log(`   ${t.name}: ${t.rows} سجل`);
  });
  console.log('');
  
  // تحويل العملاء
  const clientsFile = path.join(EXTRACTED_DIR, 'clients.json');
  if (fs.existsSync(clientsFile)) {
    const clientsData = JSON.parse(fs.readFileSync(clientsFile, 'utf8'));
    const customersResult = transformCustomers(clientsData);
    
    const customersOutput = path.join(OUTPUT_DIR, '5_import_customers.sql');
    fs.writeFileSync(customersOutput, customersResult.sql, 'utf8');
    console.log(`💾 حفظ: ${customersOutput}`);
  }
  
  // تحويل Lookups
  const lookupsFile = path.join(EXTRACTED_DIR, 'lookups.json');
  if (fs.existsSync(lookupsFile)) {
    const lookupsData = JSON.parse(fs.readFileSync(lookupsFile, 'utf8'));
    const lookupsResult = transformLookups(lookupsData);
    
    const lookupsOutput = path.join(OUTPUT_DIR, '4_import_lookups.sql');
    fs.writeFileSync(lookupsOutput, lookupsResult.sql, 'utf8');
    console.log(`💾 حفظ: ${lookupsOutput}`);
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ تم التحويل بنجاح!');
  console.log('═'.repeat(50));
  console.log(`\n📁 ملفات SQL في: ${OUTPUT_DIR}`);
  console.log('\n⏭️  الخطوة التالية: تشغيل ملفات SQL بالترتيب');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

