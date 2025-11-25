/**
 * السكربت الرئيسي لتنفيذ جميع عمليات الاستيراد بالتسلسل
 * Master Import Script
 */

const fs = require('fs').promises;
const path = require('path');
const { closeAllConnections, displayStats, saveLog } = require('./config');
const { importCustomers } = require('./import-customers');
const { importServices } = require('./import-services');
const { importRepairs } = require('./import-repairs');
const { importInvoices } = require('./import-invoices');

/**
 * إنشاء نسخة احتياطية من قاعدة البيانات
 */
async function createBackup() {
  console.log('\n📦 إنشاء نسخة احتياطية...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, 'output', `backup_before_import_${timestamp}.sql`);
  
  // استخدام mysqldump لإنشاء نسخة احتياطية
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPass = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'fixzone';
    
    const command = `mysqldump -h ${dbHost} -u ${dbUser} ${dbPass ? `-p${dbPass}` : ''} ${dbName} > ${backupFile}`;
    
    await execPromise(command);
    console.log(`✅ تم إنشاء النسخة الاحتياطية: ${backupFile}\n`);
    return true;
  } catch (error) {
    console.error('❌ فشل إنشاء النسخة الاحتياطية:', error.message);
    console.log('⚠️ استمرار بدون نسخة احتياطية...\n');
    return false;
  }
}

/**
 * التحقق من المتطلبات الأساسية
 */
async function checkPrerequisites() {
  console.log('\n🔍 التحقق من المتطلبات الأساسية...\n');
  
  const checks = {
    'متغيرات البيئة': false,
    'قاعدة البيانات القديمة': false,
    'قاعدة البيانات الجديدة': false,
    'المستخدم الافتراضي': false,
    'الفرع الافتراضي': false
  };
  
  try {
    // التحقق من متغيرات البيئة
    const envFile = path.join(__dirname, '../../.env');
    try {
      await fs.access(envFile);
      checks['متغيرات البيئة'] = true;
      console.log('✅ ملف .env موجود');
    } catch (e) {
      console.error('❌ ملف .env غير موجود');
    }
    
    // التحقق من الاتصال بقاعدة البيانات
    const { getOldDb, getNewDb } = require('./config');
    
    try {
      const oldDb = await getOldDb();
      const [oldResult] = await oldDb.query('SELECT 1');
      checks['قاعدة البيانات القديمة'] = true;
      console.log('✅ الاتصال بقاعدة البيانات القديمة');
    } catch (e) {
      console.error('❌ فشل الاتصال بقاعدة البيانات القديمة:', e.message);
    }
    
    try {
      const newDb = await getNewDb();
      const [newResult] = await newDb.query('SELECT 1');
      checks['قاعدة البيانات الجديدة'] = true;
      console.log('✅ الاتصال بقاعدة البيانات الجديدة');
      
      // التحقق من المستخدم الافتراضي
      const [users] = await newDb.query('SELECT id FROM User WHERE id = 1');
      if (users.length > 0) {
        checks['المستخدم الافتراضي'] = true;
        console.log('✅ المستخدم الافتراضي موجود');
      } else {
        console.error('❌ المستخدم الافتراضي (id: 1) غير موجود');
      }
      
      // التحقق من الفرع الافتراضي
      const [branches] = await newDb.query('SELECT id FROM Branch WHERE id = 1');
      if (branches.length > 0) {
        checks['الفرع الافتراضي'] = true;
        console.log('✅ الفرع الافتراضي موجود');
      } else {
        console.error('❌ الفرع الافتراضي (id: 1) غير موجود');
      }
      
    } catch (e) {
      console.error('❌ فشل الاتصال بقاعدة البيانات الجديدة:', e.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من المتطلبات:', error.message);
  }
  
  console.log('');
  
  // التحقق من نجاح جميع الفحوصات
  const allChecksPass = Object.values(checks).every(check => check === true);
  
  if (!allChecksPass) {
    console.error('❌ فشلت بعض الفحوصات. يرجى التأكد من المتطلبات قبل المتابعة.\n');
    return false;
  }
  
  console.log('✅ جميع المتطلبات متوفرة\n');
  return true;
}

/**
 * عرض ملخص قبل البدء
 */
async function displayPreImportSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 ملخص عملية الاستيراد');
  console.log('='.repeat(80));
  
  const { getOldDb } = require('./config');
  const oldDb = await getOldDb();
  
  // عد السجلات في النظام القديم
  const [clientsCount] = await oldDb.query('SELECT COUNT(*) as count FROM clients WHERE deleted_at IS NULL');
  const [invoicesCount] = await oldDb.query('SELECT COUNT(*) as count FROM invoices');
  const [servicesCount] = await oldDb.query('SELECT COUNT(DISTINCT title) as count FROM invoice_services');
  
  console.log('\n📊 البيانات في النظام القديم:');
  console.log(`  العملاء: ${clientsCount[0].count}`);
  console.log(`  الفواتير: ${invoicesCount[0].count}`);
  console.log(`  الخدمات الفريدة: ${servicesCount[0].count}`);
  
  console.log('\n🔄 مراحل الاستيراد:');
  console.log('  1. استيراد العملاء');
  console.log('  2. استيراد الخدمات');
  console.log('  3. استيراد الأجهزة وطلبات الإصلاح');
  console.log('  4. استيراد الفواتير');
  
  console.log('\n⏱️ الوقت المتوقع: 5-15 دقيقة (حسب حجم البيانات)');
  console.log('='.repeat(80) + '\n');
}

/**
 * إنشاء تقرير شامل
 */
async function generateReport(results, totalDuration) {
  console.log('\n📝 إنشاء التقرير الشامل...');
  
  const timestamp = new Date().toISOString();
  const reportFile = path.join(__dirname, 'output', `import-report-${timestamp.split('T')[0]}.md`);
  
  let report = `# تقرير استيراد البيانات من النظام القديم\n\n`;
  report += `**تاريخ الاستيراد:** ${timestamp}\n`;
  report += `**إجمالي الوقت المستغرق:** ${totalDuration} ثانية\n\n`;
  report += `---\n\n`;
  
  // ملخص النتائج
  report += `## 📊 ملخص النتائج\n\n`;
  
  for (const [stage, result] of Object.entries(results)) {
    report += `### ${stage}\n\n`;
    report += `**الحالة:** ${result.success ? '✅ نجح' : '❌ فشل'}\n\n`;
    
    if (result.stats) {
      report += `**الإحصائيات:**\n\n`;
      for (const [key, value] of Object.entries(result.stats)) {
        report += `- ${key}: ${value}\n`;
      }
      report += `\n`;
    }
    
    if (result.error) {
      report += `**الخطأ:** ${result.error}\n\n`;
    }
  }
  
  report += `---\n\n`;
  
  // ملفات الـ mapping
  report += `## 📁 ملفات الـ Mapping\n\n`;
  report += `- \`customer-mapping.json\` - ربط العملاء القدامى بالجدد\n`;
  report += `- \`service-mapping.json\` - ربط الخدمات\n`;
  report += `- \`device-mapping.json\` - ربط الأجهزة\n`;
  report += `- \`repair-request-mapping.json\` - ربط طلبات الإصلاح\n`;
  report += `- \`invoice-mapping.json\` - ربط الفواتير\n\n`;
  
  report += `---\n\n`;
  
  // التوصيات
  report += `## 💡 التوصيات\n\n`;
  
  const totalFailed = Object.values(results).reduce((sum, r) => {
    return sum + (r.stats?.failed || 0);
  }, 0);
  
  if (totalFailed > 0) {
    report += `⚠️ فشل استيراد ${totalFailed} سجل. يرجى مراجعة ملفات الـ logs للتفاصيل.\n\n`;
  }
  
  report += `1. مراجعة السجلات الفاشلة في مجلد \`logs/\`\n`;
  report += `2. التحقق من صحة البيانات المستوردة\n`;
  report += `3. الاحتفاظ بالنسخة الاحتياطية القديمة\n`;
  report += `4. إجراء اختبارات على النظام الجديد\n\n`;
  
  await fs.writeFile(reportFile, report, 'utf8');
  console.log(`✅ تم إنشاء التقرير: ${reportFile}\n`);
  
  return reportFile;
}

/**
 * التنفيذ الرئيسي
 */
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 بدء عملية الاستيراد الشاملة من النظام القديم إلى النظام الجديد');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  const results = {};
  
  try {
    // 1. التحقق من المتطلبات
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) {
      console.error('\n❌ فشلت المتطلبات الأساسية. إنهاء العملية.\n');
      process.exit(1);
    }
    
    // 2. عرض الملخص
    await displayPreImportSummary();
    
    // 3. سؤال المستخدم للتأكيد
    console.log('⚠️  هل تريد المتابعة؟ (سيتم تعديل قاعدة البيانات)');
    console.log('   اضغط Ctrl+C للإلغاء، أو انتظر 10 ثوان للمتابعة...\n');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 4. إنشاء نسخة احتياطية (اختياري)
    await createBackup();
    
    // === بدء مراحل الاستيراد ===
    
    // المرحلة 1: العملاء
    console.log('\n' + '='.repeat(80));
    console.log('المرحلة 1/4: استيراد العملاء');
    console.log('='.repeat(80));
    results['1. استيراد العملاء'] = await importCustomers();
    
    if (!results['1. استيراد العملاء'].success) {
      throw new Error('فشل استيراد العملاء');
    }
    
    // المرحلة 2: الخدمات
    console.log('\n' + '='.repeat(80));
    console.log('المرحلة 2/4: استيراد الخدمات');
    console.log('='.repeat(80));
    results['2. استيراد الخدمات'] = await importServices();
    
    if (!results['2. استيراد الخدمات'].success) {
      throw new Error('فشل استيراد الخدمات');
    }
    
    // المرحلة 3: الأجهزة وطلبات الإصلاح
    console.log('\n' + '='.repeat(80));
    console.log('المرحلة 3/4: استيراد الأجهزة وطلبات الإصلاح');
    console.log('='.repeat(80));
    results['3. استيراد الأجهزة وطلبات الإصلاح'] = await importRepairs();
    
    if (!results['3. استيراد الأجهزة وطلبات الإصلاح'].success) {
      throw new Error('فشل استيراد الأجهزة وطلبات الإصلاح');
    }
    
    // المرحلة 4: الفواتير
    console.log('\n' + '='.repeat(80));
    console.log('المرحلة 4/4: استيراد الفواتير');
    console.log('='.repeat(80));
    results['4. استيراد الفواتير'] = await importInvoices();
    
    if (!results['4. استيراد الفواتير'].success) {
      throw new Error('فشل استيراد الفواتير');
    }
    
    // === النهاية ===
    
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // إنشاء التقرير الشامل
    await generateReport(results, totalDuration);
    
    // عرض الملخص النهائي
    console.log('\n' + '='.repeat(80));
    console.log('✅ اكتملت عملية الاستيراد بنجاح!');
    console.log('='.repeat(80));
    
    displayStats('الملخص النهائي', {
      'إجمالي الوقت المستغرق': `${totalDuration} ثانية`,
      'المراحل المكتملة': `${Object.keys(results).length}/4`,
      'العملاء المستوردون': results['1. استيراد العملاء'].stats.success,
      'الخدمات المستوردة': results['2. استيراد الخدمات'].stats.imported,
      'الأجهزة المنشأة': results['3. استيراد الأجهزة وطلبات الإصلاح'].stats.devicesCreated,
      'طلبات الإصلاح المنشأة': results['3. استيراد الأجهزة وطلبات الإصلاح'].stats.repairsCreated,
      'الفواتير المنشأة': results['4. استيراد الفواتير'].stats.invoicesCreated
    });
    
    console.log('📁 الملفات المنشأة:');
    console.log('   - mappings/*.json (ملفات الربط)');
    console.log('   - logs/*.log (سجلات الأخطاء)');
    console.log('   - output/import-report-*.md (التقرير الشامل)');
    console.log('\n✅ تم الانتهاء بنجاح!\n');
    
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ فشلت عملية الاستيراد!');
    console.error('='.repeat(80));
    console.error('\nالخطأ:', error.message);
    
    await saveLog('master-import-critical.log', {
      error: error.message,
      stack: error.stack,
      results
    });
    
    console.error('\n💡 يرجى مراجعة ملفات الـ logs للمزيد من التفاصيل.\n');
    
    await closeAllConnections();
    process.exit(1);
  }
  
  await closeAllConnections();
  process.exit(0);
}

// تشغيل السكربت
if (require.main === module) {
  main().catch(async (error) => {
    console.error('❌ خطأ فادح:', error);
    await closeAllConnections();
    process.exit(1);
  });
}

module.exports = { main };




