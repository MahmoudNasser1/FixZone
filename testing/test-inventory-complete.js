const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function
async function testAPI(name, fn) {
  testResults.total++;
  try {
    await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS', error: null });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ FAIL: ${name} - ${error.message}`);
  }
}

// ============================================
// المرحلة 1.1: Inventory Items APIs
// ============================================

async function testInventoryAPIs() {
  console.log('\n📦 اختبار Inventory Items APIs:\n');

  // GET /api/inventory-enhanced
  await testAPI('GET /inventory-enhanced - بدون فلاتر', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced`);
    if (!res.data.success || !res.data.data.items) throw new Error('Invalid response');
  });

  await testAPI('GET /inventory-enhanced - مع pagination', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced?page=1&limit=5`);
    if (!res.data.success || res.data.data.items.length > 5) throw new Error('Pagination not working');
  });

  await testAPI('GET /inventory-enhanced - مع search', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced?searchTerm=بطارية`);
    if (!res.data.success) throw new Error('Search not working');
  });

  await testAPI('GET /inventory-enhanced - مع category filter', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced?category=batteries`);
    if (!res.data.success) throw new Error('Category filter not working');
  });

  // GET /api/inventory-enhanced/stats
  await testAPI('GET /inventory-enhanced/stats', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced/stats`);
    if (!res.data.success || !res.data.data.overview) throw new Error('Stats not working');
  });

  // GET /api/inventory-enhanced/categories
  await testAPI('GET /inventory-enhanced/categories', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced/categories`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Categories not working');
  });

  // GET /api/inventory-enhanced/:id - موجود
  await testAPI('GET /inventory-enhanced/:id - صنف موجود', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced/1`);
    if (!res.data.success || !res.data.data) throw new Error('Item not found');
  });

  // GET /api/inventory-enhanced/:id - غير موجود
  await testAPI('GET /inventory-enhanced/:id - صنف غير موجود', async () => {
    try {
      await axios.get(`${API_BASE}/inventory-enhanced/99999`);
      throw new Error('Should return 404');
    } catch (error) {
      if (error.response && error.response.status === 404) return;
      throw error;
    }
  });
}

// ============================================
// المرحلة 1.2: Warehouse APIs
// ============================================

async function testWarehouseAPIs() {
  console.log('\n🏢 اختبار Warehouse APIs:\n');

  await testAPI('GET /warehouses', async () => {
    const res = await axios.get(`${API_BASE}/warehouses`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Warehouses not found');
  });

  await testAPI('GET /warehouses/:id', async () => {
    const res = await axios.get(`${API_BASE}/warehouses/1`);
    if (!res.data.success || !res.data.data) throw new Error('Warehouse not found');
  });
}

// ============================================
// المرحلة 1.3: Stock Movement APIs
// ============================================

async function testStockMovementAPIs() {
  console.log('\n📊 اختبار Stock Movement APIs:\n');

  await testAPI('GET /stock-movements', async () => {
    const res = await axios.get(`${API_BASE}/stock-movements`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Movements not found');
  });

  await testAPI('GET /stock-movements - فلترة حسب النوع', async () => {
    const res = await axios.get(`${API_BASE}/stock-movements?type=in`);
    if (!res.data.success) throw new Error('Type filter not working');
  });

  await testAPI('GET /stock-movements/:id', async () => {
    const res = await axios.get(`${API_BASE}/stock-movements/1`);
    if (!res.data.success || !res.data.data) throw new Error('Movement not found');
  });
}

// ============================================
// المرحلة 1.4: Stock Level APIs
// ============================================

async function testStockLevelAPIs() {
  console.log('\n📈 اختبار Stock Level APIs:\n');

  await testAPI('GET /stock-levels', async () => {
    const res = await axios.get(`${API_BASE}/stock-levels`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Stock levels not found');
  });

  await testAPI('GET /stock-levels/item/:itemId', async () => {
    const res = await axios.get(`${API_BASE}/stock-levels/item/1`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Item stock levels not found');
  });
}

// ============================================
// المرحلة 1.5: Stock Alerts APIs
// ============================================

async function testStockAlertsAPIs() {
  console.log('\n🚨 اختبار Stock Alerts APIs:\n');

  await testAPI('GET /stock-alerts', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts`);
    if (!Array.isArray(res.data)) throw new Error('Alerts not found');
  });

  await testAPI('GET /stock-alerts/low', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts/low`);
    if (!res.data.alerts) throw new Error('Low stock alerts not found');
  });

  await testAPI('GET /stock-alerts/settings', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts/settings`);
    if (!res.data.settings) throw new Error('Alert settings not found');
  });

  await testAPI('GET /stock-alerts/reorder-suggestions', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts/reorder-suggestions`);
    if (!res.data.suggestions) throw new Error('Reorder suggestions not found');
  });
}

// ============================================
// المرحلة 1.6: Stock Count APIs
// ============================================

async function testStockCountAPIs() {
  console.log('\n📋 اختبار Stock Count APIs:\n');

  await testAPI('GET /stock-count', async () => {
    const res = await axios.get(`${API_BASE}/stock-count`);
    if (!res.data.success || !res.data.data) throw new Error('Stock counts not found');
  });

  await testAPI('GET /stock-count/stats', async () => {
    const res = await axios.get(`${API_BASE}/stock-count/stats`);
    if (!res.data.success || !res.data.data) throw new Error('Stock count stats not found');
  });

  // Test with existing stock count ID
  await testAPI('GET /stock-count/:id', async () => {
    const listRes = await axios.get(`${API_BASE}/stock-count`);
    if (listRes.data.data.stockCounts && listRes.data.data.stockCounts.length > 0) {
      const firstId = listRes.data.data.stockCounts[0].id;
      const res = await axios.get(`${API_BASE}/stock-count/${firstId}`);
      if (!res.data.success || !res.data.data) throw new Error('Stock count not found');
    }
  });
}

// ============================================
// المرحلة 1.7: Stock Transfer APIs
// ============================================

async function testStockTransferAPIs() {
  console.log('\n🚚 اختبار Stock Transfer APIs:\n');

  await testAPI('GET /stock-transfer', async () => {
    const res = await axios.get(`${API_BASE}/stock-transfer`);
    if (!res.data.success || !res.data.data) throw new Error('Stock transfers not found');
  });

  await testAPI('GET /stock-transfer/stats', async () => {
    const res = await axios.get(`${API_BASE}/stock-transfer/stats`);
    if (!res.data.success || !res.data.data) throw new Error('Stock transfer stats not found');
  });
}

// ============================================
// المرحلة 1.8: Barcode APIs
// ============================================

async function testBarcodeAPIs() {
  console.log('\n📱 اختبار Barcode APIs:\n');

  await testAPI('GET /barcode/stats', async () => {
    const res = await axios.get(`${API_BASE}/barcode/stats`);
    if (!res.data.success || !res.data.data) throw new Error('Barcode stats not found');
  });

  await testAPI('GET /barcode/lookup/:code', async () => {
    try {
      await axios.get(`${API_BASE}/barcode/lookup/TEST123`);
    } catch (error) {
      // It's ok if not found, we're just testing the endpoint
      if (error.response && (error.response.status === 404 || error.response.status === 200)) return;
      throw error;
    }
  });
}

// ============================================
// المرحلة 1.9: Item Vendor APIs
// ============================================

async function testItemVendorAPIs() {
  console.log('\n🤝 اختبار Item Vendor APIs:\n');

  await testAPI('GET /item-vendors', async () => {
    const res = await axios.get(`${API_BASE}/item-vendors`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Item vendors not found');
  });

  await testAPI('GET /item-vendors/item/:itemId', async () => {
    const res = await axios.get(`${API_BASE}/item-vendors/item/1`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Item vendors not found');
  });
}

// ============================================
// تشغيل جميع الاختبارات
// ============================================

async function runAllTests() {
  console.log('\n🚀 بدء اختبار Backend APIs الشاملة...\n');
  console.log('='.repeat(60));

  try {
    await testInventoryAPIs();
    await testWarehouseAPIs();
    await testStockMovementAPIs();
    await testStockLevelAPIs();
    await testStockAlertsAPIs();
    await testStockCountAPIs();
    await testStockTransferAPIs();
    await testBarcodeAPIs();
    await testItemVendorAPIs();

    // النتائج النهائية
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 النتائج النهائية:\n');
    console.log(`✅ نجح: ${testResults.passed} من ${testResults.total}`);
    console.log(`❌ فشل: ${testResults.failed} من ${testResults.total}`);
    console.log(`📈 نسبة النجاح: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ الاختبارات الفاشلة:');
      testResults.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    }

    // حفظ التقرير
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      results: testResults,
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
      }
    };
    
    fs.writeFileSync(
      '/opt/lampp/htdocs/FixZone/testing/results/backend-apis-test-result.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 تم حفظ التقرير في: testing/results/backend-apis-test-result.json');

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ خطأ في تشغيل الاختبارات:', error.message);
    process.exit(1);
  }
}

runAllTests();
