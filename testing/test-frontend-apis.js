#!/usr/bin/env node

/**
 * FixZone ERP - Frontend APIs Testing
 * اختبار APIs Frontend مع Enhanced Backend
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testFrontendAPIs() {
  console.log('\n🧪 اختبار Frontend APIs مع Enhanced Backend\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Enhanced Inventory Items API
  try {
    console.log('Test 1: Enhanced Inventory Items API...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/items`);
    console.log(`✅ نجح: ${response.data.data.items.length} صنف`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 2: Enhanced Stock Movements API
  try {
    console.log('Test 2: Enhanced Stock Movements API...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/movements`);
    console.log(`✅ نجح: ${response.data.data.movements.length} حركة`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 3: Enhanced Statistics API
  try {
    console.log('Test 3: Enhanced Statistics API...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/stats`);
    console.log(`✅ نجح: إحصائيات متاحة`);
    console.log(`   - إجمالي الأصناف: ${response.data.data.overview.totalItems}`);
    console.log(`   - قيمة المخزون: ${response.data.data.overview.totalCostValue} ج.م`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 4: Vendors API
  try {
    console.log('Test 4: Vendors API...');
    const response = await axios.get(`${BASE_URL}/vendors`);
    console.log(`✅ نجح: ${response.data.length} مورد`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 5: Warehouses API
  try {
    console.log('Test 5: Warehouses API...');
    const response = await axios.get(`${BASE_URL}/warehouses`);
    console.log(`✅ نجح: ${response.data.length} مخزن`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 6: Create Item Test (Validation)
  try {
    console.log('Test 6: Create Item Validation...');
    await axios.post(`${BASE_URL}/inventory-enhanced/items`, {
      name: 'صنف اختبار',
      // Missing required fields to test validation
    });
    console.log(`❌ فشل: لم يتم رفض البيانات الناقصة`);
    failed++;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`✅ نجح: Validation يعمل - رفض البيانات الناقصة`);
      passed++;
    } else {
      console.log(`❌ فشل: ${error.message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n📊 ملخص النتائج:');
  console.log(`✅ نجح: ${passed}`);
  console.log(`❌ فشل: ${failed}`);
  console.log(`📊 نسبة النجاح: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 تهانينا! جميع APIs تعمل بشكل صحيح!');
    console.log('✅ Frontend جاهز للاستخدام مع Enhanced APIs');
  } else {
    console.log('\n⚠️ توجد بعض الأخطاء. يرجى مراجعة السجلات.');
  }

  console.log('\n🌐 للاختبار في المتصفح:');
  console.log('1. افتح http://localhost:3000');
  console.log('2. سجل دخول');
  console.log('3. اذهب لقسم "المخزون"');
  console.log('4. شوف الصفحات المحدثة');
}

testFrontendAPIs().catch(console.error);

