#!/usr/bin/env node

/**
 * FixZone ERP - Inventory Module Phase 1 Testing (Simplified)
 * اختبار مبسط لـ Phase 1
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function runSimpleTests() {
  console.log('\n🧪 اختبار Phase 1 - Inventory Module\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Get all inventory items
  try {
    console.log('Test 1: جلب الأصناف...');
    const response = await axios.get(`${BASE_URL}/inventory`);
    console.log(`✅ نجح: ${response.data.length} صنف`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 2: Get vendors
  try {
    console.log('Test 2: جلب الموردين...');
    const response = await axios.get(`${BASE_URL}/vendors`);
    console.log(`✅ نجح: ${response.data.length} مورد`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 3: Get warehouses
  try {
    console.log('Test 3: جلب المخازن...');
    const response = await axios.get(`${BASE_URL}/warehouses`);
    console.log(`✅ نجح: ${response.data.length} مخزن`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 4: Get stock movements
  try {
    console.log('Test 4: جلب الحركات المخزنية...');
    const response = await axios.get(`${BASE_URL}/stockmovements`);
    console.log(`✅ نجح: ${response.data.length} حركة`);
    passed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    failed++;
  }

  // Test 5: Enhanced inventory API
  try {
    console.log('Test 5: جلب الأصناف المحسنة...');
    const response = await axios.get(`${BASE_URL}/inventory-enhanced/items`);
    console.log(`✅ نجح: ${response.data.data.items.length} صنف`);
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
    console.log('\n🎉 تهانينا! جميع الاختبارات نجحت!');
    console.log('✅ Phase 1 يعمل بشكل صحيح 100%');
  } else {
    console.log('\n⚠️ توجد بعض الأخطاء. يرجى مراجعة السجلات.');
  }
}

runSimpleTests().catch(console.error);
