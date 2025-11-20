#!/usr/bin/env node
/**
 * اختبار ربط الفواتير بالعملاء من ملف CSV (محسّن)
 * Test Matching Invoices to Customers from CSV File (Fixed)
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 بدء اختبار ربط الفواتير بالعملاء (محسّن)...\n');
console.log('═'.repeat(60));

/**
 * تحليل سطر CSV مع معالجة الفواصل داخل علامات التنصيص
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

try {
  // قراءة ملف CSV
  const csvPath = path.join(__dirname, '../../../IN/الفواتير المنتهيه.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  // قراءة بيانات العملاء والفواتير
  const clientsData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'extracted_data/clients.json'), 'utf8'
  ));
  const invoicesData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'extracted_data/invoices.json'), 'utf8'
  ));
  
  console.log('\n📊 البيانات المحملة:');
  console.log(`   العملاء: ${clientsData.rowCount}`);
  console.log(`   الفواتير: ${invoicesData.rowCount}`);
  
  // تحليل CSV
  const lines = csvContent.split('\n').filter(line => line.trim());
  console.log(`   سجلات CSV: ${lines.length}\n`);
  
  // إنشاء خريطة للعملاء حسب الاسم (مع تطبيع الأسماء)
  const clientsByName = new Map();
  const activeClients = clientsData.rows.filter(c => !c.deleted_at);
  
  activeClients.forEach(client => {
    if (client.name) {
      // تطبيع الاسم
      const normalizedName = client.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
      
      if (!clientsByName.has(normalizedName)) {
        clientsByName.set(normalizedName, []);
      }
      clientsByName.get(normalizedName).push(client);
    }
  });
  
  console.log('🗂️  خريطة العملاء جاهزة');
  console.log(`   عملاء نشطين: ${activeClients.length}`);
  console.log(`   أسماء فريدة: ${clientsByName.size}\n`);
  
  // تخطي أول 3 أسطر (headers)
  const dataLines = lines.slice(3);
  
  // اختبار على أول 30 سجل
  console.log('═'.repeat(60));
  console.log('🧪 اختبار الربط على أول 30 سجل:\n');
  
  const testLines = dataLines.slice(0, 30);
  const results = {
    success: 0,
    multipleMatches: 0,
    noMatch: 0,
    invalidFormat: 0,
    details: []
  };
  
  testLines.forEach((line, index) => {
    // تحليل السطر
    const fields = parseCSVLine(line);
    
    if (fields.length < 8) {
      results.invalidFormat++;
      return;
    }
    
    // الحقول:
    // 0: فارغ
    // 1: رقم الفاتورة
    // 2: الفرع
    // 3: التاريخ
    // 4: النوع
    // 5: الحالة
    // 6: المستخدم
    // 7: العميل ← هذا ما نحتاجه!
    
    const invoiceId = fields[1].trim();
    const customerName = fields[7].trim();
    
    if (!invoiceId || !customerName) {
      results.invalidFormat++;
      return;
    }
    
    // تطبيع اسم العميل من CSV
    const normalizedCustomerName = customerName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
    
    // البحث عن العميل
    const matchedClients = clientsByName.get(normalizedCustomerName) || [];
    
    const result = {
      index: index + 1,
      invoiceId,
      customerName,
      normalizedName: normalizedCustomerName,
      matches: matchedClients.length,
      clientIds: matchedClients.map(c => c.id),
      clientNames: matchedClients.map(c => c.name),
      status: 'unknown'
    };
    
    if (matchedClients.length === 0) {
      results.noMatch++;
      result.status = 'no_match';
      console.log(`❌ [${index + 1}] فاتورة ${invoiceId}`);
      console.log(`     العميل: "${customerName}"`);
      console.log(`     لم يتم العثور على تطابق\n`);
    } else if (matchedClients.length === 1) {
      results.success++;
      result.status = 'success';
      result.clientId = matchedClients[0].id;
      console.log(`✅ [${index + 1}] فاتورة ${invoiceId}`);
      console.log(`     العميل: "${customerName}"`);
      console.log(`     → Client ID: ${matchedClients[0].id} (${matchedClients[0].name})\n`);
    } else {
      results.multipleMatches++;
      result.status = 'multiple';
      console.log(`⚠️  [${index + 1}] فاتورة ${invoiceId}`);
      console.log(`     العميل: "${customerName}"`);
      console.log(`     → تطابقات متعددة:`);
      matchedClients.forEach(c => {
        console.log(`        • ID ${c.id}: ${c.name}`);
      });
      console.log();
    }
    
    results.details.push(result);
  });
  
  // النتائج النهائية
  console.log('═'.repeat(60));
  console.log('📊 نتائج الاختبار:\n');
  
  const totalTests = results.success + results.multipleMatches + results.noMatch;
  
  console.log(`   ✅ نجح الربط: ${results.success} (${((results.success/totalTests)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  تطابقات متعددة: ${results.multipleMatches} (${((results.multipleMatches/totalTests)*100).toFixed(1)}%)`);
  console.log(`   ❌ لم يتم العثور: ${results.noMatch} (${((results.noMatch/totalTests)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  صيغة خاطئة: ${results.invalidFormat}\n`);
  
  // حفظ النتائج
  const outputPath = path.join(__dirname, 'CSV_MATCHING_TEST_RESULTS.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`💾 تم حفظ النتائج في: ${outputPath}\n`);
  
  // التوصيات
  console.log('═'.repeat(60));
  console.log('💡 التوصيات:\n');
  
  const successRate = (results.success / totalTests) * 100;
  const combinedSuccessRate = ((results.success + results.multipleMatches) / totalTests) * 100;
  
  if (successRate >= 80) {
    console.log(`✅ معدل النجاح ممتاز! (${successRate.toFixed(1)}%)`);
    console.log('   يمكننا المتابعة باستيراد جميع البيانات!\n');
  } else if (combinedSuccessRate >= 70) {
    console.log(`⚠️  معدل الربط جيد (${combinedSuccessRate.toFixed(1)}% مع التطابقات المتعددة)`);
    console.log(`   الربط المباشر: ${successRate.toFixed(1)}%`);
    console.log('   يمكننا المتابعة مع معالجة التطابقات المتعددة\n');
  } else if (successRate >= 40) {
    console.log(`⚠️  معدل النجاح متوسط (${successRate.toFixed(1)}%)`);
    console.log('   يمكننا المتابعة مع إنشاء عميل عام للحالات المتبقية\n');
  } else {
    console.log(`❌ معدل النجاح منخفض (${successRate.toFixed(1)}%)`);
    console.log('   نحتاج لمراجعة البيانات أو استخدام العميل العام\n');
  }
  
  // اقتراح الاستراتيجية
  console.log('📋 الاستراتيجية المقترحة:');
  if (results.success > 0) {
    console.log(`   1. استيراد ${results.success} فاتورة مع ربط مباشر`);
  }
  if (results.multipleMatches > 0) {
    console.log(`   2. معالجة ${results.multipleMatches} فاتورة (تطابقات متعددة) - اختيار الأول`);
  }
  if (results.noMatch > 0) {
    console.log(`   3. ربط ${results.noMatch} فاتورة بعميل عام`);
  }
  
  console.log('\n═'.repeat(60));
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

