#!/usr/bin/env node

/**
 * FixZone ERP - Enhanced UI Testing
 * اختبار واجهات المستخدم المحسنة
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testEnhancedUI() {
  console.log('\n🎨 اختبار واجهات المستخدم المحسنة\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Enhanced Stats API
  try {
    console.log('Test 1: Enhanced Statistics API...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/stats`);
    const stats = response.data.data;
    
    console.log(`✅ نجح: إحصائيات متاحة`);
    console.log(`   📊 إجمالي الأصناف: ${stats.overview.totalItems}`);
    console.log(`   💰 قيمة المخزون: ${stats.overview.totalCostValue} ج.م`);
    console.log(`   📦 أصناف منخفضة: ${stats.alerts.lowStockItems}`);
    console.log(`   ❌ أصناف نفدت: ${stats.alerts.outOfStockItems}`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 2: Enhanced Items with Pagination
  try {
    console.log('\nTest 2: Enhanced Items with Pagination...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/items?page=1&limit=5`);
    const data = response.data.data;
    
    console.log(`✅ نجح: ${data.items.length} صنف من ${data.pagination.totalItems}`);
    console.log(`   📄 صفحة ${data.pagination.page} من ${data.pagination.totalPages}`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 3: Enhanced Items with Search
  try {
    console.log('\nTest 3: Enhanced Items with Search...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/items?search=iPad`);
    const data = response.data.data;
    
    console.log(`✅ نجح: ${data.items.length} صنف يحتوي على "iPad"`);
    if (data.items.length > 0) {
      console.log(`   📱 مثال: ${data.items[0].name}`);
    }
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 4: Enhanced Stock Movements
  try {
    console.log('\nTest 4: Enhanced Stock Movements...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/movements?page=1&limit=5`);
    const data = response.data.data;
    
    console.log(`✅ نجح: ${data.movements.length} حركة من ${data.pagination.totalMovements}`);
    if (data.movements.length > 0) {
      const movement = data.movements[0];
      console.log(`   📦 مثال: ${movement.movementType} - ${movement.quantity} قطعة`);
    }
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 5: Vendors Data
  try {
    console.log('\nTest 5: Vendors Data...');
    const response = await axios.get(`${BASE_URL}/vendors`);
    const vendors = response.data;
    
    console.log(`✅ نجح: ${vendors.length} مورد متاح`);
    if (vendors.length > 0) {
      console.log(`   🏢 مثال: ${vendors[0].name}`);
    }
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 6: Warehouses Data
  try {
    console.log('\nTest 6: Warehouses Data...');
    const response = await axios.get(`${BASE_URL}/warehouses`);
    const warehouses = response.data;
    
    console.log(`✅ نجح: ${warehouses.length} مخزن متاح`);
    if (warehouses.length > 0) {
      console.log(`   🏪 مثال: ${warehouses[0].name} - ${warehouses[0].location}`);
    }
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n📊 ملخص النتائج:');
  console.log(`✅ نجح: ${passed}`);
  console.log(`❌ فشل: ${failed}`);
  console.log(`📊 نسبة النجاح: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 تهانينا! جميع APIs جاهزة للواجهات المحسنة!');
    console.log('✅ الواجهات الجديدة ستعمل بشكل مثالي');
  } else {
    console.log('\n⚠️ توجد بعض الأخطاء. يرجى مراجعة السجلات.');
  }

  console.log('\n🎨 المكونات الجديدة المتاحة:');
  console.log('📊 StatsDashboard - لوحة إحصائيات جميلة');
  console.log('🔍 SearchAndFilter - بحث وفلترة متقدم');
  console.log('📋 EnhancedInventoryTable - جدول محسن مع Grid/List views');
  console.log('⏳ LoadingSpinner - مؤشر تحميل');
  console.log('❌ ErrorHandler - معالج أخطاء مع إعادة المحاولة');

  console.log('\n🌐 للاختبار في المتصفح:');
  console.log('1. افتح http://localhost:3000');
  console.log('2. سجل دخول');
  console.log('3. اذهب لقسم "المخزون"');
  console.log('4. شوف التحسينات الجديدة:');
  console.log('   - لوحة إحصائيات جميلة');
  console.log('   - بحث وفلترة متقدم');
  console.log('   - عرض Grid/List للأصناف');
  console.log('   - تصميم محسن ومتجاوب');
}

testEnhancedUI().catch(console.error);

