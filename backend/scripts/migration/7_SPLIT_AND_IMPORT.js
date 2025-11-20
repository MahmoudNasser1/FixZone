#!/usr/bin/env node
/**
 * تقسيم واستيراد البيانات في batches
 * Split and Import Data in Batches
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BATCH_SIZE = 50; // عدد السجلات في كل batch

console.log('🔄 بدء التقسيم والاستيراد...\n');
console.log('═'.repeat(60));

/**
 * تقسيم ملف SQL كبير إلى batches
 */
function splitSQLFile(inputFile, outputPrefix, batchSize = BATCH_SIZE) {
  console.log(`\n📂 معالجة: ${path.basename(inputFile)}`);
  
  let content = fs.readFileSync(inputFile, 'utf8');
  
  // البحث عن INSERT INTO و VALUES
  const insertMatch = content.match(/INSERT INTO [`\w]+\s*\([^)]+\)\s*VALUES\s*/i);
  if (!insertMatch) {
    console.log('   ⚠️  لم يتم العثور على INSERT statement');
    return [];
  }
  
  const header = insertMatch[0].trim();
  const valuesStart = insertMatch.index + insertMatch[0].length;
  let valuesContent = content.substring(valuesStart);
  
  // إزالة ; النهائية
  valuesContent = valuesContent.replace(/;\s*$/, '').trim();
  
  // الآن نقسم VALUES - نبحث عن ),( مع مراعاة strings
  const values = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  let depth = 0;
  
  for (let i = 0; i < valuesContent.length; i++) {
    const char = valuesContent[i];
    const prev = i > 0 ? valuesContent[i - 1] : '';
    
    if ((char === '"' || char === "'") && prev !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }
    
    if (!inString) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      
      if (depth === 0 && char === ')' && valuesContent[i + 1] === ',') {
        current += char;
        values.push(current.trim());
        current = '';
        i++; // تخطي الفاصلة
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    values.push(current.trim());
  }
  
  console.log(`   📊 إجمالي السجلات: ${values.length}`);
  
  const batches = [];
  const numBatches = Math.ceil(values.length / batchSize);
  
  for (let i = 0; i < numBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, values.length);
    const batchValues = values.slice(start, end);
    
    // إصلاح الأقواس - إزالة الأقواس الزائدة وتنظيف
    const fixedValues = batchValues.map((v) => {
      let fixed = v.trim();
      // إزالة ( في البداية و ) في النهاية
      if (fixed.startsWith('(')) fixed = fixed.substring(1);
      if (fixed.endsWith(')')) fixed = fixed.substring(0, fixed.length - 1);
      // إزالة \n في البداية
      while (fixed.startsWith('\\n')) {
        fixed = fixed.substring(2);
      }
      return '(' + fixed.trim() + ')';
    });
    
    const batchSQL = header + '\n' + fixedValues.join(',\n') + ';\n';
    
    const batchFile = `${outputPrefix}_batch_${String(i + 1).padStart(3, '0')}.sql`;
    fs.writeFileSync(batchFile, batchSQL, 'utf8');
    batches.push(batchFile);
  }
  
  console.log(`   ✅ تم التقسيم إلى ${batches.length} batch`);
  return batches;
}

/**
 * استيراد batch واحد
 */
function importBatch(batchFile, dbName = 'FZ') {
  try {
    execSync(
      `/opt/lampp/bin/mysql -u root ${dbName} < ${batchFile}`,
      { stdio: 'pipe' }
    );
    return true;
  } catch (error) {
    console.error(`   ❌ خطأ في استيراد ${path.basename(batchFile)}: ${error.message}`);
    return false;
  }
}

try {
  const OUTPUT_DIR = path.join(__dirname, 'import_sql');
  const BATCHES_DIR = path.join(OUTPUT_DIR, 'batches');
  
  // إنشاء مجلد batches
  if (!fs.existsSync(BATCHES_DIR)) {
    fs.mkdirSync(BATCHES_DIR, { recursive: true });
  }
  
  console.log('\n📋 الخطوات:');
  console.log('   1. تقسيم ملفات SQL الكبيرة');
  console.log('   2. استيراد كل batch على حدة\n');
  
  // الملفات المراد تقسيمها
  const filesToSplit = [
    {
      input: path.join(OUTPUT_DIR, '14_customers_with_ids.sql'),
      prefix: path.join(BATCHES_DIR, '14_customers')
    },
    {
      input: path.join(OUTPUT_DIR, '16_devices_final.sql'),
      prefix: path.join(BATCHES_DIR, '16_devices')
    },
    {
      input: path.join(OUTPUT_DIR, '17_repairs_final.sql'),
      prefix: path.join(BATCHES_DIR, '17_repairs')
    }
  ];
  
  // 1. التقسيم
  console.log('\n📦 المرحلة 1: تقسيم الملفات');
  console.log('═'.repeat(60));
  
  const allBatches = {};
  
  for (const file of filesToSplit) {
    if (fs.existsSync(file.input)) {
      const batches = splitSQLFile(file.input, file.prefix);
      allBatches[path.basename(file.input)] = batches;
    }
  }
  
  // 2. الاستيراد
  console.log('\n\n📥 المرحلة 2: الاستيراد');
  console.log('═'.repeat(60));
  
  let totalImported = 0;
  let totalFailed = 0;
  
  // العميل العام أولاً
  console.log('\n1️⃣ العميل العام...');
  const generalCustomerFile = path.join(OUTPUT_DIR, '15_general_customer.sql');
  if (fs.existsSync(generalCustomerFile)) {
    if (importBatch(generalCustomerFile)) {
      console.log('   ✅ تم');
    } else {
      console.log('   ⚠️  تخطي (ربما موجود بالفعل)');
    }
  }
  
  // العملاء
  console.log('\n2️⃣ العملاء...');
  const customerBatches = allBatches['14_customers_with_ids.sql'] || [];
  for (let i = 0; i < customerBatches.length; i++) {
    process.stdout.write(`   Batch ${i + 1}/${customerBatches.length}... `);
    if (importBatch(customerBatches[i])) {
      console.log('✅');
      totalImported++;
    } else {
      console.log('❌');
      totalFailed++;
    }
  }
  
  // الأجهزة
  console.log('\n3️⃣ الأجهزة...');
  const deviceBatches = allBatches['16_devices_final.sql'] || [];
  for (let i = 0; i < deviceBatches.length; i++) {
    process.stdout.write(`   Batch ${i + 1}/${deviceBatches.length}... `);
    if (importBatch(deviceBatches[i])) {
      console.log('✅');
      totalImported++;
    } else {
      console.log('❌');
      totalFailed++;
    }
  }
  
  // طلبات الإصلاح
  console.log('\n4️⃣ طلبات الإصلاح...');
  const repairBatches = allBatches['17_repairs_final.sql'] || [];
  for (let i = 0; i < repairBatches.length; i++) {
    process.stdout.write(`   Batch ${i + 1}/${repairBatches.length}... `);
    if (importBatch(repairBatches[i])) {
      console.log('✅');
      totalImported++;
    } else {
      console.log('❌');
      totalFailed++;
    }
  }
  
  // النتيجة النهائية
  console.log('\n\n═'.repeat(60));
  console.log('🎉 اكتمل الاستيراد!');
  console.log('═'.repeat(60));
  console.log(`\n   ✅ Batches نجحت: ${totalImported}`);
  console.log(`   ❌ Batches فشلت: ${totalFailed}\n`);
  
  // التحقق
  console.log('🔍 التحقق النهائي...\n');
  try {
    const result = execSync(
      `/opt/lampp/bin/mysql -u root FZ -e "SELECT 'العملاء' as 'البيان', COUNT(*) as 'العدد' FROM Customer WHERE deletedAt IS NULL UNION ALL SELECT 'الأجهزة', COUNT(*) FROM Device WHERE deletedAt IS NULL UNION ALL SELECT 'طلبات الإصلاح', COUNT(*) FROM RepairRequest WHERE deletedAt IS NULL;"`,
      { encoding: 'utf8' }
    );
    console.log(result);
  } catch (e) {
    console.error('خطأ في التحقق:', e.message);
  }
  
  console.log('═'.repeat(60));
  console.log('✅ تم بنجاح!');
  console.log('═'.repeat(60));
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

