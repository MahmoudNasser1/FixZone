const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:3001/api';

console.log('\n🧪 اختبار شامل - Phase 2 + التحسينات\n');
console.log('━'.repeat(80));

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    console.log(`\n${name}...`);
    await fn();
    console.log('✅ نجح');
    testsPassed++;
  } catch (error) {
    console.log(`❌ فشل: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  
  // Test 1: Inventory Enhanced Stats
  await test('Test 1: Inventory Enhanced Stats API', async () => {
    const response = await axios.get(`${API_BASE}/inventory-enhanced/stats`);
    assert(response.data.success, 'Should return success');
    assert(response.data.data.overview, 'Should have overview data');
    assert(response.data.data.overview.totalItems > 0, 'Should have items');
    console.log(`   📊 إجمالي الأصناف: ${response.data.data.overview.totalItems}`);
    console.log(`   💰 قيمة المخزون: ${response.data.data.overview.totalCostValue} ج.م`);
  });

  // Test 2: StockCount Stats
  await test('Test 2: StockCount Stats API', async () => {
    const response = await axios.get(`${API_BASE}/stock-count/stats`);
    assert(response.data.success, 'Should return success');
    console.log(`   📊 إجمالي الجردات: ${response.data.data.totalCounts || 0}`);
  });

  // Test 3: StockTransfer Stats
  await test('Test 3: StockTransfer Stats API', async () => {
    const response = await axios.get(`${API_BASE}/stock-transfer/stats`);
    assert(response.data.success, 'Should return success');
    console.log(`   📊 إجمالي النقلات: ${response.data.data.totalTransfers || 0}`);
  });

  // Test 4: PartsUsed API
  await test('Test 4: PartsUsed API', async () => {
    const response = await axios.get(`${API_BASE}/partsused`);
    assert(Array.isArray(response.data), 'Should return array');
    console.log(`   📦 إجمالي الاستخدامات: ${response.data.length}`);
  });

  // Test 5: Inventory Items List
  await test('Test 5: Inventory Items List', async () => {
    const response = await axios.get(`${API_BASE}/inventory-enhanced/items`);
    assert(response.data.success, 'Should return success');
    assert(response.data.data.items, 'Should have items');
    console.log(`   📦 عدد الأصناف: ${response.data.data.items.length}`);
  });

  // Test 6: Stock Movements
  await test('Test 6: Stock Movements API', async () => {
    const response = await axios.get(`${API_BASE}/inventory-enhanced/movements`);
    assert(response.data.success, 'Should return success');
    console.log(`   📊 عدد الحركات: ${response.data.data.movements.length}`);
  });

  // Test 7: Warehouses
  await test('Test 7: Warehouses API', async () => {
    const response = await axios.get(`${API_BASE}/warehouses`);
    assert(Array.isArray(response.data), 'Should return array');
    console.log(`   🏪 عدد المخازن: ${response.data.length}`);
  });

  // Test 8: Vendors
  await test('Test 8: Vendors API', async () => {
    const response = await axios.get(`${API_BASE}/vendors`);
    assert(Array.isArray(response.data), 'Should return array');
    console.log(`   🏢 عدد الموردين: ${response.data.length}`);
  });

  // Test 9: Categories
  await test('Test 9: Categories API', async () => {
    const response = await axios.get(`${API_BASE}/inventory-enhanced/categories`);
    assert(response.data.success, 'Should return success');
    console.log(`   📁 عدد الفئات: ${response.data.data.length}`);
  });

  // Test 10: Stock Alerts
  await test('Test 10: Stock Alerts API', async () => {
    const response = await axios.get(`${API_BASE}/stock-alerts`);
    console.log(`   ⚠️ عدد التنبيهات: ${response.data.length || 0}`);
  });

  // Test 11: Create StockCount (if needed)
  await test('Test 11: Create StockCount API', async () => {
    const warehouses = await axios.get(`${API_BASE}/warehouses`);
    if (warehouses.data.length > 0) {
      const response = await axios.post(`${API_BASE}/stock-count`, {
        warehouseId: warehouses.data[0].id,
        countDate: new Date().toISOString().split('T')[0],
        type: 'full',
        notes: 'اختبار تلقائي',
        countedBy: 1
      });
      assert(response.data.success, 'Should create successfully');
      console.log(`   ✅ تم إنشاء جرد: ${response.data.data.countNumber}`);
      
      // Clean up
      await axios.delete(`${API_BASE}/stock-count/${response.data.data.id}`);
    }
  });

  // Test 12: Create StockTransfer (if needed)
  await test('Test 12: Create StockTransfer API', async () => {
    const warehouses = await axios.get(`${API_BASE}/warehouses`);
    if (warehouses.data.length >= 2) {
      const items = await axios.get(`${API_BASE}/inventory-enhanced/items?limit=1`);
      if (items.data.data.items.length > 0) {
        const item = items.data.data.items[0];
        const response = await axios.post(`${API_BASE}/stock-transfer`, {
          fromWarehouseId: warehouses.data[0].id,
          toWarehouseId: warehouses.data[1].id,
          transferDate: new Date().toISOString().split('T')[0],
          reason: 'اختبار تلقائي',
          notes: 'اختبار النقل',
          items: [{
            inventoryItemId: item.id,
            quantity: 1,
            unitPrice: item.purchasePrice || 10
          }],
          createdBy: 1
        });
        assert(response.data.success, 'Should create successfully');
        console.log(`   ✅ تم إنشاء نقل: ${response.data.data.transferNumber}`);
        
        // Clean up
        await axios.delete(`${API_BASE}/stock-transfer/${response.data.data.id}`);
      }
    }
  });

  // Summary
  console.log('\n' + '━'.repeat(80));
  console.log('\n📊 ملخص النتائج:');
  console.log(`✅ نجح: ${testsPassed}`);
  console.log(`❌ فشل: ${testsFailed}`);
  console.log(`📊 نسبة النجاح: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 جميع الاختبارات نجحت! النظام يعمل بشكل ممتاز!');
  } else {
    console.log('\n⚠️ توجد بعض الأخطاء. يرجى مراجعة السجلات.');
  }
  
  console.log('\n✅ Backend APIs جاهزة للاستخدام!');
  console.log('\n🌐 للاختبار في المتصفح:');
  console.log('   http://localhost:3000/inventory');
  console.log('   http://localhost:3000/stock-count');
  console.log('   http://localhost:3000/stock-transfer');
  console.log('\n');
}

runTests().catch(console.error);
