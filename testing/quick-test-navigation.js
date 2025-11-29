#!/usr/bin/env node

/**
 * Quick Navigation System Test
 * اختبار سريع لنظام التنقل
 */

const http = require('http');

const API_BASE = 'http://localhost:4000/api';
const tests = [];

// Helper to make request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const start = Date.now();
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, duration });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, duration, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      reject({ error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ error: 'Timeout' });
    });

    req.end();
  });
}

// Test function
async function test(name, path) {
  process.stdout.write(`\n🧪 Testing: ${name}... `);
  try {
    const result = await makeRequest(path);
    if (result.status === 200 || result.status === 401) {
      console.log(`✅ OK (${result.status} - ${result.duration}ms)`);
      if (result.status === 401) {
        console.log('   ⚠️  Needs authentication (expected)');
      }
      if (result.data && result.data.success) {
        console.log(`   ✓ Success: true`);
        if (Array.isArray(result.data.data)) {
          console.log(`   ✓ Items: ${result.data.data.length}`);
        }
      }
      tests.push({ name, status: 'PASSED', ...result });
      return true;
    } else {
      console.log(`❌ FAILED (${result.status})`);
      tests.push({ name, status: 'FAILED', ...result });
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.error || error.message}`);
    tests.push({ name, status: 'ERROR', error });
    return false;
  }
}

// Run tests
async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Navigation System - Quick Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`API Base: ${API_BASE}\n`);

  await test('Navigation Items', '/navigation/items');
  await test('Navigation Stats', '/navigation/stats');
  await test('Quick Stats', '/dashboard/quick-stats');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  
  const passed = tests.filter(t => t.status === 'PASSED').length;
  const failed = tests.filter(t => t.status !== 'PASSED').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    console.log('⚠️  Note: 401 (Unauthorized) is expected if not authenticated');
    console.log('   These endpoints require authentication.\n');
  }
}

run().catch(console.error);

