// backend/scripts/test-settings-api.js
// Manual API testing script for Settings system
require('dotenv').config();
const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:4000';
const API_TOKEN = process.env.TEST_API_TOKEN || ''; // Set this in .env

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testSettingsAPI() {
  console.log('🧪 Testing Settings API...\n');

  const tests = [
    {
      name: 'Get all settings',
      method: 'GET',
      path: '/api/settings',
      data: null
    },
    {
      name: 'Get settings by category',
      method: 'GET',
      path: '/api/settings/category/general',
      data: null
    },
    {
      name: 'Search settings',
      method: 'GET',
      path: '/api/settings/search?q=company',
      data: null
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📋 Test: ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);
      
      const result = await makeRequest(test.method, test.path, test.data);
      
      if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ Success (${result.status})`);
        if (result.data.success) {
          console.log(`   📊 Count: ${result.data.count || result.data.data?.length || 'N/A'}`);
        }
      } else if (result.status === 401) {
        console.log(`   ⚠️  Authentication required`);
        console.log(`   💡 Set TEST_API_TOKEN in .env file`);
      } else if (result.status === 403) {
        console.log(`   ⚠️  Access denied (need admin role)`);
      } else {
        console.log(`   ❌ Failed (${result.status})`);
        console.log(`   Error: ${result.data.message || JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ API testing completed!');
  console.log('\n💡 Note: Some tests may fail if:');
  console.log('   1. Server is not running');
  console.log('   2. TEST_API_TOKEN is not set');
  console.log('   3. User does not have admin role');
}

// Run tests
testSettingsAPI().catch(console.error);

