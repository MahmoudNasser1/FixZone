/**
 * اختبار تكامل Navigation System
 * يمكن تشغيله باستخدام Node.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const config = {
  baseUrl: process.env.API_URL || 'http://localhost:4000/api',
  token: process.env.TOKEN || null,
  cookie: process.env.COOKIE || null,
  timeout: 5000
};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make HTTP request
function makeRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, config.baseUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(config.token && { 'Authorization': `Bearer ${config.token}` }),
        ...(config.cookie && { 'Cookie': config.cookie })
      },
      timeout: config.timeout
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: json
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test function
async function test(name, endpoint, expectedStatus = 200) {
  process.stdout.write(`\n${colors.blue}Testing:${colors.reset} ${name}... `);
  
  try {
    const response = await makeRequest(endpoint);
    
    if (response.statusCode === expectedStatus) {
      console.log(`${colors.green}✅ PASSED${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.data.success) {
        console.log(`   Success: ${response.data.success}`);
        if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            console.log(`   Items: ${response.data.data.length}`);
          } else if (typeof response.data.data === 'object') {
            console.log(`   Keys: ${Object.keys(response.data.data).join(', ')}`);
          }
        }
      }
      
      results.passed++;
      return { success: true, response };
    } else {
      console.log(`${colors.red}❌ FAILED${colors.reset}`);
      console.log(`   Expected: ${expectedStatus}, Got: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      results.failed++;
      results.errors.push({ name, error: `Expected ${expectedStatus}, got ${response.statusCode}` });
      return { success: false, response };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.errors.push({ name, error: error.message });
    return { success: false, error };
  }
}

// Main test suite
async function runTests() {
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}🧪 اختبار Navigation APIs${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Token: ${config.token ? '✅ Provided' : '❌ Not provided (using cookie auth)'}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  // Test 1: Navigation Items
  const test1 = await test(
    'Get Navigation Items',
    '/navigation/items',
    200
  );

  if (test1.success && test1.response?.data?.success) {
    const items = test1.response.data.data;
    if (Array.isArray(items) && items.length > 0) {
      console.log(`   ${colors.green}✓ Found ${items.length} sections${colors.reset}`);
      items.forEach((section, index) => {
        if (section.items) {
          console.log(`   ${colors.green}✓ Section ${index + 1}: ${section.section} (${section.items.length} items)${colors.reset}`);
        }
      });
    }
  }

  // Test 2: Navigation Stats
  const test2 = await test(
    'Get Navigation Stats',
    '/navigation/stats',
    200
  );

  if (test2.success && test2.response?.data?.success) {
    const stats = test2.response.data.data;
    if (stats && typeof stats === 'object') {
      console.log(`   ${colors.green}✓ Stats received:${colors.reset}`);
      Object.keys(stats).forEach(key => {
        console.log(`      - ${key}: ${stats[key]}`);
      });
    }
  }

  // Test 3: Quick Stats
  const test3 = await test(
    'Get Quick Stats',
    '/dashboard/quick-stats',
    200
  );

  if (test3.success && test3.response?.data?.success) {
    const stats = test3.response.data.data;
    if (stats && typeof stats === 'object') {
      console.log(`   ${colors.green}✓ Quick Stats received:${colors.reset}`);
      Object.keys(stats).forEach(key => {
        console.log(`      - ${key}: ${stats[key]}`);
      });
    }
  }

  // Test 4: Validate Navigation Structure
  if (test1.success && test1.response?.data?.data) {
    process.stdout.write(`\n${colors.blue}Validating Navigation Structure...${colors.reset} `);
    
    try {
      const items = test1.response.data.data;
      let valid = true;
      let errors = [];

      items.forEach((section, sectionIndex) => {
        if (!section.section) {
          valid = false;
          errors.push(`Section ${sectionIndex} missing 'section' field`);
        }
        if (!Array.isArray(section.items)) {
          valid = false;
          errors.push(`Section ${sectionIndex} missing 'items' array`);
        } else {
          section.items.forEach((item, itemIndex) => {
            if (!item.label) {
              valid = false;
              errors.push(`Item ${sectionIndex}.${itemIndex} missing 'label'`);
            }
            if (!item.icon && !item.href) {
              valid = false;
              errors.push(`Item ${sectionIndex}.${itemIndex} missing both 'icon' and 'href'`);
            }
            if (item.subItems && !Array.isArray(item.subItems)) {
              valid = false;
              errors.push(`Item ${sectionIndex}.${itemIndex} has invalid 'subItems'`);
            }
          });
        }
      });

      if (valid) {
        console.log(`${colors.green}✅ PASSED${colors.reset}`);
        results.passed++;
      } else {
        console.log(`${colors.red}❌ FAILED${colors.reset}`);
        errors.forEach(err => console.log(`   - ${err}`));
        results.failed++;
        results.errors.push({ name: 'Navigation Structure Validation', errors });
      }
    } catch (error) {
      console.log(`${colors.red}❌ ERROR${colors.reset}`);
      console.log(`   Error: ${error.message}`);
      results.failed++;
    }
  }

  // Summary
  console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}📊 Test Summary${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`Total: ${results.passed + results.failed}`);

  if (results.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    results.errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.name}: ${err.error || JSON.stringify(err.errors)}`);
    });
  }

  console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal Error:${colors.reset}`, error);
  process.exit(1);
});

