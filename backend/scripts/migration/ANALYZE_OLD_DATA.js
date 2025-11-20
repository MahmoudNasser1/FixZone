#!/usr/bin/env node
/**
 * تحليل عميق للبيانات القديمة لإيجاد طريقة للربط
 * Deep Analysis of Old Data to Find Linking Method
 */

const fs = require('fs');
const path = require('path');

const EXTRACTED_DIR = path.join(__dirname, 'extracted_data');

console.log('🔍 تحليل عميق للبيانات القديمة...\n');
console.log('═'.repeat(60));

try {
  // قراءة البيانات
  const invoicesData = JSON.parse(fs.readFileSync(path.join(EXTRACTED_DIR, 'invoices.json'), 'utf8'));
  const clientsData = JSON.parse(fs.readFileSync(path.join(EXTRACTED_DIR, 'clients.json'), 'utf8'));
  
  console.log('\n📊 إحصائيات أساسية:');
  console.log(`   العملاء: ${clientsData.rowCount}`);
  console.log(`   الفواتير: ${invoicesData.rowCount}`);
  
  // تحليل 1: نمط التواريخ في client_id
  console.log('\n📅 تحليل 1: نمط client_id');
  const clientIdPatterns = {};
  invoicesData.rows.forEach(inv => {
    const cid = String(inv.client_id || '');
    if (cid.includes('-')) {
      // تاريخ
      const date = cid.split(' ')[0];
      clientIdPatterns[date] = (clientIdPatterns[date] || 0) + 1;
    }
  });
  
  console.log('   أكثر التواريخ تكراراً في client_id:');
  Object.entries(clientIdPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([date, count]) => {
      console.log(`      ${date}: ${count} فاتورة`);
    });
  
  // تحليل 2: ربما client_id هو created_at للعميل؟
  console.log('\n🔗 تحليل 2: محاولة الربط بناءً على التاريخ');
  
  // إنشاء خريطة العملاء حسب تاريخ الإنشاء
  const clientsByDate = new Map();
  clientsData.rows.forEach(client => {
    if (client.created_at) {
      const date = client.created_at.split(' ')[0];
      if (!clientsByDate.has(date)) {
        clientsByDate.set(date, []);
      }
      clientsByDate.get(date).push(client);
    }
  });
  
  console.log(`   عدد التواريخ الفريدة للعملاء: ${clientsByDate.size}`);
  
  // محاولة الربط
  let possibleMatches = 0;
  let multipleMatches = 0;
  let noMatches = 0;
  
  invoicesData.rows.slice(0, 100).forEach(inv => {
    if (inv.deleted_at) return;
    
    const cidDate = String(inv.client_id || '').split(' ')[0];
    if (cidDate && clientsByDate.has(cidDate)) {
      const matches = clientsByDate.get(cidDate);
      if (matches.length === 1) {
        possibleMatches++;
      } else {
        multipleMatches++;
      }
    } else {
      noMatches++;
    }
  });
  
  console.log(`\n   نتائج محاولة الربط (أول 100 فاتورة):`);
  console.log(`      ✅ ربط فريد محتمل: ${possibleMatches}`);
  console.log(`      ⚠️  ربط متعدد: ${multipleMatches}`);
  console.log(`      ❌ بدون ربط: ${noMatches}`);
  
  // تحليل 3: فحص creator_id
  console.log('\n👤 تحليل 3: فحص creator_id');
  const withCreator = invoicesData.rows.filter(r => r.creator_id && !isNaN(r.creator_id) && r.creator_id > 0);
  const uniqueCreators = [...new Set(withCreator.map(r => r.creator_id))];
  
  console.log(`   فواتير بها creator_id: ${withCreator.length}`);
  console.log(`   عدد المنشئين الفريدين: ${uniqueCreators.length}`);
  console.log(`   معرفات المنشئين: ${uniqueCreators.slice(0, 20).join(', ')}`);
  
  // تحليل 4: فحص ref_num
  console.log('\n🔢 تحليل 4: فحص ref_num');
  const withRefNum = invoicesData.rows.filter(r => r.ref_num);
  console.log(`   فواتير بها ref_num: ${withRefNum.length}`);
  if (withRefNum.length > 0) {
    console.log(`   أمثلة: ${withRefNum.slice(0, 5).map(r => r.ref_num).join(', ')}`);
  }
  
  // تحليل 5: فحص الحقول النصية
  console.log('\n📝 تحليل 5: البحث عن معلومات العميل في الحقول');
  const invoice = invoicesData.rows.find(r => !r.deleted_at) || invoicesData.rows[0];
  if (invoice) {
    console.log('   الحقول المتاحة في الفاتورة:');
    Object.keys(invoice).forEach(key => {
      const val = invoice[key];
      if (val !== null && val !== undefined) {
        console.log(`      ${key}: ${typeof val} ${Array.isArray(val) ? '(array)' : ''}`);
      }
    });
  }
  
  // تحليل 6: إحصائيات الحقول المهمة
  console.log('\n📊 تحليل 6: إحصائيات الحقول المهمة');
  
  const stats = {
    hasSerial: invoicesData.rows.filter(r => r.device_sn && !r.deleted_at).length,
    hasBrand: invoicesData.rows.filter(r => r.brand && !r.deleted_at).length,
    hasModel: invoicesData.rows.filter(r => r.device_model && !r.deleted_at).length,
    hasProblem: invoicesData.rows.filter(r => r.problem_description && !r.deleted_at).length,
    hasPayment: invoicesData.rows.filter(r => r.payment && !r.deleted_at).length,
  };
  
  console.log('   الفواتير النشطة التي تحتوي على:');
  Object.entries(stats).forEach(([key, count]) => {
    const pct = ((count / invoicesData.rowCount) * 100).toFixed(1);
    console.log(`      ${key}: ${count} (${pct}%)`);
  });
  
  // الاستنتاج والتوصيات
  console.log('\n' + '═'.repeat(60));
  console.log('💡 الاستنتاجات والحلول المقترحة:\n');
  
  if (possibleMatches > 50) {
    console.log('✅ حل 1: الربط بناءً على تاريخ الإنشاء');
    console.log('   - يمكن ربط بعض الفواتير بناءً على تطابق التاريخ');
    console.log('   - لكن هناك حالات متعددة للربط تحتاج معالجة\n');
  }
  
  console.log('✅ حل 2: استيراد الفواتير بدون ربط كامل');
  console.log('   - إنشاء عميل عام باسم "عملاء النظام القديم"');
  console.log(`   - ربط جميع الـ ${invoicesData.rowCount} فاتورة به`);
  console.log('   - حفظ client_id الأصلي في customFields للمراجعة اليدوية لاحقاً\n');
  
  console.log('✅ حل 3: الربط الذكي بخطوات متعددة');
  console.log('   - ربط بناءً على التاريخ للحالات الفريدة');
  console.log('   - إنشاء عميل عام للحالات الغامضة');
  console.log('   - السماح بالمراجعة اليدوية لاحقاً من الواجهة\n');
  
  console.log('✅ حل 4: استيراد البيانات كـ "مرجع تاريخي"');
  console.log('   - استيراد معلومات الأجهزة فقط');
  console.log('   - بدون ربط بالعملاء');
  console.log('   - للرجوع إليها عند الحاجة\n');
  
  console.log('═'.repeat(60));
  console.log('\n💡 التوصية النهائية:');
  console.log('   استخدام "الحل 2 + الحل 3" معاً:');
  console.log('   1. إنشاء عميل عام للفواتير غير المرتبطة');
  console.log('   2. محاولة الربط الذكي للحالات الممكنة');
  console.log('   3. حفظ جميع المعلومات للمراجعة اليدوية\n');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}

