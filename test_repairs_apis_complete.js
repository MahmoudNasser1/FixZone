// QA Testing Script - Repair Module APIs (Fixed with /api prefix)
const http = require('http');

const API_BASE = 'http://localhost:3001/api';
const TEST_REPAIR_ID = 77;

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

const results = { passed: [], failed: [], warnings: [] };

function log(name, result, details = '') {
  if (result === 'PASS') {
    results.passed.push(name);
    console.log(`✅ ${name}`);
  } else if (result === 'FAIL') {
    results.failed.push({ name, details });
    console.log(`❌ ${name}${details ? ': ' + details : ''}`);
  } else {
    results.warnings.push({ name, details });
    console.log(`⚠️  ${name}${details ? ': ' + details : ''}`);
  }
}

async function test() {
  console.log('════════════════════════════════════════════════════════');
  console.log('🧪 QA Testing - Repair Module APIs');
  console.log('════════════════════════════════════════════════════════\n');

  // 1. GET /api/repairs
  console.log('📋 1. GET /api/repairs:');
  try {
    const r = await request('GET', `${API_BASE}/repairs`);
    log('GET /api/repairs', r.status === 401 ? 'PASS' : r.status === 200 ? 'WARN' : 'FAIL', `Status: ${r.status}`);
  } catch (e) {
    log('GET /api/repairs', 'FAIL', e.message);
  }

  // 2. GET /api/repairs/:id
  console.log('\n📋 2. GET /api/repairs/:id:');
  try {
    const r = await request('GET', `${API_BASE}/repairs/${TEST_REPAIR_ID}`);
    log(`GET /api/repairs/${TEST_REPAIR_ID}`, r.status === 401 ? 'PASS' : r.status === 200 ? 'WARN' : 'FAIL', `Status: ${r.status}`);
  } catch (e) {
    log('GET /api/repairs/:id', 'FAIL', e.message);
  }

  // 3. Print endpoints
  console.log('\n📋 3. Print Endpoints:');
  const prints = ['receipt', 'invoice', 'inspection', 'delivery', 'sticker'];
  for (const p of prints) {
    try {
      const r = await request('GET', `${API_BASE}/repairs/${TEST_REPAIR_ID}/print/${p}`);
      log(`GET /api/repairs/:id/print/${p}`, 
        r.status === 200 ? 'PASS' : r.status === 401 ? 'WARN' : 'FAIL',
        `Status: ${r.status}`);
    } catch (e) {
      log(`GET /api/repairs/:id/print/${p}`, 'FAIL', e.message);
    }
  }

  // 4. Tracking (public)
  console.log('\n📋 4. Tracking (Public):');
  try {
    const r = await request('GET', `${API_BASE}/repairs/${TEST_REPAIR_ID}/track`);
    log('GET /api/repairs/:id/track', 
      r.status === 200 ? 'PASS' : r.status === 404 ? 'WARN' : 'FAIL',
      `Status: ${r.status}`);
  } catch (e) {
    log('GET /api/repairs/:id/track', 'FAIL', e.message);
  }

  // 5. Parts Used
  console.log('\n📋 5. Parts Used APIs:');
  try {
    const r = await request('GET', `${API_BASE}/partsused?repairRequestId=${TEST_REPAIR_ID}`);
    log('GET /api/partsused', 
      r.status === 200 ? 'PASS' : r.status === 401 ? 'WARN' : 'FAIL',
      `Status: ${r.status}`);
  } catch (e) {
    log('GET /api/partsused', 'FAIL', e.message);
  }

  // 6. Services
  console.log('\n📋 6. Services APIs:');
  try {
    const r = await request('GET', `${API_BASE}/repairrequestservices?repairRequestId=${TEST_REPAIR_ID}`);
    log('GET /api/repairrequestservices', 
      r.status === 200 ? 'PASS' : r.status === 401 ? 'WARN' : 'FAIL',
      `Status: ${r.status}`);
  } catch (e) {
    log('GET /api/repairrequestservices', 'FAIL', e.message);
  }

  // 7. Inventory Issue
  console.log('\n📋 7. Inventory Integration:');
  try {
    const r = await request('POST', `${API_BASE}/inventory/issue`, {
      repairRequestId: TEST_REPAIR_ID,
      inventoryItemId: 1,
      warehouseId: 1,
      quantity: 1,
      userId: 1
    });
    log('POST /api/inventory/issue', 
      r.status === 401 ? 'PASS' : r.status === 400 ? 'WARN' : 'FAIL',
      `Status: ${r.status}`);
  } catch (e) {
    log('POST /api/inventory/issue', 'FAIL', e.message);
  }

  // Summary
  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log('════════════════════════════════════════════════════════\n');

  return {
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    details: { passed: results.passed, failed: results.failed, warnings: results.warnings }
  };
}

test().then(summary => {
  console.log('✅ API Testing Complete!\n');
  process.exit(summary.failed > 0 ? 1 : 0);
}).catch(e => {
  console.error('❌ Test Error:', e);
  process.exit(1);
});
