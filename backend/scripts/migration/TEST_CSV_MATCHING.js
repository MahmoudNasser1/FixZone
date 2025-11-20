#!/usr/bin/env node
/**
 * اختبار ربط الفواتير بالعملاء من ملف CSV
 * Test Matching Invoices to Customers from CSV File
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 بدء اختبار ربط الفواتير بالعملاء...\n');
console.log('═'.repeat(60));

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
  clientsData.rows.forEach(client => {
    if (!client.deleted_at && client.name) {
      // تطبيع الاسم: إزالة المسافات الزائدة، توحيد الحروف
      const normalizedName = client.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه');
      
      if (!clientsByName.has(normalizedName)) {
        clientsByName.set(normalizedName, []);
      }
      clientsByName.get(normalizedName).push(client);
    }
  });
  
  console.log('🗂️  خريطة العملاء جاهزة');
  console.log(`   أسماء فريدة: ${clientsByName.size}\n`);
  
  // اختبار على أول 20 سجل
  console.log('═'.repeat(60));
  console.log('🧪 اختبار الربط على أول 20 سجل:\n');
  
  const testLines = lines.slice(1, 21); // تخطي السطر الأول (headers)
  const results = {
    success: 0,
    multipleMatches: 0,
    noMatch: 0,
    invalidFormat: 0,
    details: []
  };
  
  testLines.forEach((line, index) => {
    // تحليل السطر - افتراض أن التنسيق: رقم_الفاتورة,اسم_العميل
    const parts = line.split(',');
    
    if (parts.length < 2) {
      results.invalidFormat++;
      return;
    }
    
    const invoiceId = parts[0].trim();
    const customerName = parts.slice(1).join(',').trim(); // في حالة وجود فواصل في الاسم
    
    // تطبيع اسم العميل من CSV
    const normalizedCustomerName = customerName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ة/g, 'ه');
    
    // البحث عن العميل
    const matchedClients = clientsByName.get(normalizedCustomerName) || [];
    
    const result = {
      index: index + 1,
      invoiceId,
      customerName,
      normalizedName: normalizedCustomerName,
      matches: matchedClients.length,
      clientIds: matchedClients.map(c => c.id),
      status: 'unknown'
    };
    
    if (matchedClients.length === 0) {
      results.noMatch++;
      result.status = 'no_match';
      console.log(`❌ [${index + 1}] فاتورة ${invoiceId} - "${customerName}"`);
      console.log(`     لم يتم العثور على العميل\n`);
    } else if (matchedClients.length === 1) {
      results.success++;
      result.status = 'success';
      result.clientId = matchedClients[0].id;
      console.log(`✅ [${index + 1}] فاتورة ${invoiceId} - "${customerName}"`);
      console.log(`     → Client ID: ${matchedClients[0].id}\n`);
    } else {
      results.multipleMatches++;
      result.status = 'multiple';
      console.log(`⚠️  [${index + 1}] فاتورة ${invoiceId} - "${customerName}"`);
      console.log(`     → عدة تطابقات: ${matchedClients.map(c => c.id).join(', ')}\n`);
    }
    
    results.details.push(result);
  });
  
  // النتائج النهائية
  console.log('═'.repeat(60));
  console.log('📊 نتائج الاختبار:\n');
  console.log(`   ✅ نجح الربط: ${results.success} (${((results.success/testLines.length)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  تطابقات متعددة: ${results.multipleMatches} (${((results.multipleMatches/testLines.length)*100).toFixed(1)}%)`);
  console.log(`   ❌ لم يتم العثور: ${results.noMatch} (${((results.noMatch/testLines.length)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  صيغة خاطئة: ${results.invalidFormat}\n`);
  
  // حفظ النتائج
  const outputPath = path.join(__dirname, 'CSV_MATCHING_TEST_RESULTS.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`💾 تم حفظ النتائج في: ${outputPath}\n`);
  
  // التوصيات
  console.log('═'.repeat(60));
  console.log('💡 التوصيات:\n');
  
  const successRate = (results.success / testLines.length) * 100;
  
  if (successRate >= 80) {
    console.log('✅ معدل النجاح ممتاز! (' + successRate.toFixed(1) + '%)');
    console.log('   يمكننا المتابعة باستيراد جميع البيانات!\n');
  } else if (successRate >= 50) {
    console.log('⚠️  معدل النجاح جيد (' + successRate.toFixed(1) + '%)');
    console.log('   يمكننا المتابعة مع معالجة الحالات الخاصة\n');
  } else {
    console.log('❌ معدل النجاح منخفض (' + successRate.toFixed(1) + '%)');
    console.log('   نحتاج لمراجعة تنسيق البيانات\n');
  }
  
  console.log('═'.repeat(60));
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

