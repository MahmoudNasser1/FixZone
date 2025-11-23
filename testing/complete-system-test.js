const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:4000/api';
let issues = [];
let successCount = 0;
let failCount = 0;

// Helper to test API
async function testAPI(category, name, testFn) {
  try {
    await testFn();
    successCount++;
    console.log(`✅ ${category} > ${name}`);
  } catch (error) {
    failCount++;
    const issue = {
      category,
      name,
      error: error.response ? {
        status: error.response.status,
        message: error.response.data
      } : {
        message: error.message
      }
    };
    issues.push(issue);
    console.log(`❌ ${category} > ${name}`);
    console.log(`   السبب: ${JSON.stringify(issue.error)}`);
  }
}

async function runCompleteTest() {
  console.log('\n🚀 بدء الاختبار الكامل من الصفر...\n');
  console.log('='.repeat(70));

  // 1. Inventory Enhanced APIs
  console.log('\n📦 1. Inventory Enhanced APIs:');
  await testAPI('Inventory Enhanced', 'GET /', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Inventory Enhanced', 'GET /stats', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced/stats`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Inventory Enhanced', 'GET /categories', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced/categories`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Inventory Enhanced', 'GET /:id', async () => {
    const res = await axios.get(`${API_BASE}/inventory-enhanced/1`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  // 2. Warehouses APIs
  console.log('\n🏢 2. Warehouses APIs:');
  await testAPI('Warehouses', 'GET /', async () => {
    const res = await axios.get(`${API_BASE}/warehouses`);
    if (!res.data || !res.data.success) throw new Error('Invalid response structure');
  });

  await testAPI('Warehouses', 'GET /:id', async () => {
    const res = await axios.get(`${API_BASE}/warehouses/1`);
    if (!res.data || !res.data.success) throw new Error('Invalid response structure');
  });

  // 3. Stock Movements APIs
  console.log('\n📊 3. Stock Movements APIs:');
  await testAPI('Stock Movements', 'GET /', async () => {
    const res = await axios.get(`${API_BASE}/stock-movements`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Stock Movements', 'GET /:id', async () => {
    // Get first available id
    const listRes = await axios.get(`${API_BASE}/stock-movements`);
    if (listRes.data.data && listRes.data.data.length > 0) {
      const id = listRes.data.data[0].id;
      const res = await axios.get(`${API_BASE}/stock-movements/${id}`);
      if (!res.data.success) throw new Error('Response not successful');
    } else {
      throw new Error('No stock movements found');
    }
  });

  // 4. Stock Levels APIs
  console.log('\n📈 4. Stock Levels APIs:');
  await testAPI('Stock Levels', 'GET /', async () => {
    const res = await axios.get(`${API_BASE}/stock-levels`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Stock Levels', 'GET /item/:id', async () => {
    const res = await axios.get(`${API_BASE}/stock-levels/item/1`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  // 5. Stock Alerts APIs
  console.log('\n🚨 5. Stock Alerts APIs:');
  await testAPI('Stock Alerts', 'GET /', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts`);
    if (!Array.isArray(res.data)) throw new Error('Expected array response');
  });

  await testAPI('Stock Alerts', 'GET /low', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts/low`);
    if (!res.data.alerts) throw new Error('Missing alerts property');
  });

  await testAPI('Stock Alerts', 'GET /settings', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts/settings`);
    if (!res.data.settings) throw new Error('Missing settings property');
  });

  await testAPI('Stock Alerts', 'GET /reorder-suggestions', async () => {
    const res = await axios.get(`${API_BASE}/stock-alerts/reorder-suggestions`);
    if (!res.data.suggestions) throw new Error('Missing suggestions property');
  });

  // 6. Stock Count APIs
  console.log('\n📋 6. Stock Count APIs:');
  await testAPI('Stock Count', 'GET /', async () => {
    const res = await axios.get(`${API_BASE}/stock-count`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Stock Count', 'GET /stats', async () => {
    const res = await axios.get(`${API_BASE}/stock-count/stats`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Stock Count', 'GET /:id', async () => {
    const listRes = await axios.get(`${API_BASE}/stock-count`);
    if (listRes.data.data.stockCounts && listRes.data.data.stockCounts.length > 0) {
      const id = listRes.data.data.stockCounts[0].id;
      const res = await axios.get(`${API_BASE}/stock-count/${id}`);
      if (!res.data.success) throw new Error('Response not successful');
    }
  });

  // 7. Stock Transfer APIs
  console.log('\n🚚 7. Stock Transfer APIs:');
  await testAPI('Stock Transfer', 'GET /', async () => {
    const res = await axios.get(`${API_BASE}/stock-transfer`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Stock Transfer', 'GET /stats', async () => {
    const res = await axios.get(`${API_BASE}/stock-transfer/stats`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  // 8. Barcode APIs
  console.log('\n📱 8. Barcode APIs:');
  await testAPI('Barcode', 'GET /stats', async () => {
    const res = await axios.get(`${API_BASE}/barcode/stats`);
    if (!res.data.success) throw new Error('Response not successful');
  });

  await testAPI('Barcode', 'GET /lookup/:code', async () => {
    try {
      await axios.get(`${API_BASE}/barcode/lookup/TEST123`);
    } catch (err) {
      if (err.response && (err.response.status === 404 || err.response.status === 200)) return;
      throw err;
    }
  });

  // النتائج النهائية
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 النتائج النهائية:\n');
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${failCount}`);
  console.log(`📈 نسبة النجاح: ${((successCount / (successCount + failCount)) * 100).toFixed(2)}%`);

  // حصر المشاكل
  if (issues.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('\n❌ حصر المشاكل المكتشفة:\n');

    // تصنيف المشاكل
    const problemsByType = {
      'SQL Errors': [],
      '404 Not Found': [],
      '500 Server Error': [],
      'Response Structure': [],
      'Other': []
    };

    issues.forEach(issue => {
      const errorMsg = JSON.stringify(issue.error);
      
      if (errorMsg.includes('Unknown column') || errorMsg.includes('SQL')) {
        problemsByType['SQL Errors'].push(issue);
      } else if (issue.error.status === 404) {
        problemsByType['404 Not Found'].push(issue);
      } else if (issue.error.status === 500) {
        problemsByType['500 Server Error'].push(issue);
      } else if (errorMsg.includes('structure') || errorMsg.includes('Invalid response')) {
        problemsByType['Response Structure'].push(issue);
      } else {
        problemsByType['Other'].push(issue);
      }
    });

    // طباعة المشاكل مصنفة
    Object.keys(problemsByType).forEach(type => {
      if (problemsByType[type].length > 0) {
        console.log(`\n🔴 ${type} (${problemsByType[type].length}):`);
        problemsByType[type].forEach((issue, idx) => {
          console.log(`   ${idx + 1}. ${issue.category} > ${issue.name}`);
          console.log(`      ${JSON.stringify(issue.error, null, 6)}`);
        });
      }
    });

    // حفظ التقرير
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: successCount + failCount,
        success: successCount,
        failed: failCount,
        successRate: ((successCount / (successCount + failCount)) * 100).toFixed(2) + '%'
      },
      issues: issues,
      issuesByType: problemsByType
    };

    fs.writeFileSync(
      '/opt/lampp/htdocs/FixZone/testing/results/complete-test-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n📄 تم حفظ التقرير الكامل في: testing/results/complete-test-report.json');
  }

  console.log('\n' + '='.repeat(70));
  process.exit(failCount > 0 ? 1 : 0);
}

runCompleteTest().catch(err => {
  console.error('\n❌ خطأ في تشغيل الاختبار:', err);
  process.exit(1);
});
