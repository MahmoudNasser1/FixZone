// QA Testing Script - Repair Module APIs
// Comprehensive API Testing

const http = require('http');

const API_BASE = 'http://localhost:3001/api';
const TEST_REPAIR_ID = 77; // Using existing repair ID
let authToken = '';

// Helper function to make HTTP requests
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, result, details = '') {
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

// Test all APIs
async function runTests() {
  console.log('════════════════════════════════════════════════════════');
  console.log('🧪 QA Testing - Repair Module APIs');
  console.log('════════════════════════════════════════════════════════\n');

  // 1. Test Health Check
  console.log('\n📋 1. Health Check Tests:');
  try {
    const health = await request('GET', 'http://localhost:3001/health');
    logTest('Health Check', health.status === 200 ? 'PASS' : 'FAIL', `Status: ${health.status}`);
  } catch (e) {
    logTest('Health Check', 'FAIL', e.message);
  }

  // 2. Test GET /api/repairs
  console.log('\n📋 2. GET /api/repairs Tests:');
  try {
    const repairs = await request('GET', '/repairs');
    logTest('GET /api/repairs (without auth)', repairs.status === 401 ? 'PASS' : 'WARN', `Expected 401, got ${repairs.status}`);
    
    // With auth would require login first
    logTest('GET /api/repairs structure', 'WARN', 'Requires authentication');
  } catch (e) {
    logTest('GET /api/repairs', 'FAIL', e.message);
  }

  // 3. Test GET /api/repairs/:id
  console.log('\n📋 3. GET /api/repairs/:id Tests:');
  try {
    const repair = await request('GET', `/repairs/${TEST_REPAIR_ID}`);
    logTest(`GET /api/repairs/${TEST_REPAIR_ID} (without auth)`, repair.status === 401 ? 'PASS' : 'WARN', `Status: ${repair.status}`);
  } catch (e) {
    logTest('GET /api/repairs/:id', 'FAIL', e.message);
  }

  // 4. Test Print Endpoints (may not require auth)
  console.log('\n📋 4. Print Endpoints Tests:');
  const printEndpoints = [
    '/repairs/77/print/receipt',
    '/repairs/77/print/invoice',
    '/repairs/77/print/inspection',
    '/repairs/77/print/delivery',
    '/repairs/77/print/sticker'
  ];

  for (const endpoint of printEndpoints) {
    try {
      const response = await request('GET', endpoint);
      const type = endpoint.split('/').pop();
      logTest(`GET ${endpoint}`, 
        response.status === 200 ? 'PASS' : response.status === 401 ? 'WARN' : 'FAIL',
        `Status: ${response.status}`);
    } catch (e) {
      logTest(`GET ${endpoint}`, 'FAIL', e.message);
    }
  }

  // 5. Test Tracking (public endpoint)
  console.log('\n📋 5. Tracking Endpoints Tests:');
  try {
    const track = await request('GET', '/repairs/77/track');
    logTest('GET /api/repairs/:id/track (public)', 
      track.status === 200 || track.status === 404 ? 'PASS' : 'WARN',
      `Status: ${track.status}`);
  } catch (e) {
    logTest('GET /api/repairs/:id/track', 'FAIL', e.message);
  }

  // 6. Test Parts Used APIs
  console.log('\n📋 6. Parts Used APIs Tests:');
  try {
    const parts = await request('GET', '/partsused?repairRequestId=77');
    logTest('GET /api/partsused', 
      parts.status === 200 || parts.status === 401 ? 'PASS' : 'WARN',
      `Status: ${parts.status}`);
  } catch (e) {
    logTest('GET /api/partsused', 'FAIL', e.message);
  }

  // 7. Test Services APIs
  console.log('\n📋 7. Services APIs Tests:');
  try {
    const services = await request('GET', '/repairrequestservices?repairRequestId=77');
    logTest('GET /api/repairrequestservices', 
      services.status === 200 || services.status === 401 ? 'PASS' : 'WARN',
      `Status: ${services.status}`);
  } catch (e) {
    logTest('GET /api/repairrequestservices', 'FAIL', e.message);
  }

  // 8. Test Inventory Issue API
  console.log('\n📋 8. Inventory Integration APIs Tests:');
  try {
    const issue = await request('POST', '/inventory/issue', {
      repairRequestId: 77,
      inventoryItemId: 1,
      warehouseId: 1,
      quantity: 1,
      userId: 1
    });
    logTest('POST /api/inventory/issue (without auth)', 
      issue.status === 401 ? 'PASS' : issue.status === 400 ? 'WARN' : 'FAIL',
      `Status: ${issue.status}`);
  } catch (e) {
    logTest('POST /api/inventory/issue', 'FAIL', e.message);
  }

  // Summary
  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log('════════════════════════════════════════════════════════\n');

  if (results.failed.length > 0) {
    console.log('❌ Failed Tests:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.details}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(w => console.log(`  - ${w.name}: ${w.details}`));
  }
}

// Run tests
runTests().catch(console.error);
