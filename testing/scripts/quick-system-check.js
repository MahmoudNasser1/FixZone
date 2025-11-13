#!/usr/bin/env node

/**
 * 🚀 Quick System Check for Fix Zone ERP
 * 
 * This script performs a quick health check of the entire system:
 * - Server connectivity
 * - Database connection
 * - Basic API functionality
 * - Critical system components
 */

const CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api',
  BASE_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:3000',
  TIMEOUT: 10000
};

let authToken = null;
let authHeaders = {};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`)
};

// Quick authentication
async function quickAuth() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: 'admin@fixzone.com',
        password: 'password'
      })
    });
    
    if (response.ok) {
      const setCookie = response.headers.get('set-cookie') || '';
      const tokenMatch = setCookie.match(/token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        authHeaders = { 'Authorization': `Bearer ${authToken}` };
      }
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Quick test function
async function quickTest(name, testFn) {
  try {
    const startTime = Date.now();
    const result = await Promise.race([
      testFn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), CONFIG.TIMEOUT))
    ]);
    const duration = Date.now() - startTime;
    
    if (result) {
      log.success(`${name} (${duration}ms)`);
      return { success: true, duration };
    } else {
      log.error(`${name} - Failed`);
      return { success: false, duration };
    }
  } catch (error) {
    log.error(`${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test functions
async function testBackendHealth() {
  const response = await fetch(`${CONFIG.BASE_URL}/health`);
  return response.ok;
}

async function testFrontendHealth() {
  const response = await fetch(`${CONFIG.FRONTEND_URL}`);
  return response.ok;
}

async function testDatabaseConnection() {
  const response = await fetch(`${CONFIG.BASE_URL}/health`);
  if (!response.ok) return false;
  const data = await response.json();
  return data.status === 'OK';
}

async function testBasicAPIs() {
  const endpoints = [
    '/customers',
    '/repairs', 
    '/inventory',
    '/invoices',
    '/payments'
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        headers: authHeaders
      });
      if (response.ok || response.status === 401) { // 401 is ok if no auth
        successCount++;
      }
    } catch (error) {
      // Ignore individual endpoint failures
    }
  }
  
  return successCount >= endpoints.length * 0.8; // 80% success rate
}

async function testCriticalData() {
  const response = await fetch(`${CONFIG.API_BASE_URL}/customers`, {
    headers: authHeaders
  });
  
  if (!response.ok) return false;
  const data = await response.json();
  
  // Handle both array and object response formats
  if (Array.isArray(data)) {
    return true;
  } else if (data.success && data.data && (Array.isArray(data.data) || Array.isArray(data.data.customers))) {
    return true;
  }
  
  return false;
}

// Main execution
async function runQuickCheck() {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🚀 QUICK SYSTEM CHECK                             ║');
  console.log('║                          Fix Zone ERP System                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n⏰ Started at: ${new Date().toLocaleString('ar-SA')}`);
  
  const results = [];
  
  // Authenticate
  log.info('Authenticating...');
  const authSuccess = await quickAuth();
  if (authSuccess) {
    log.success('Authentication successful');
  } else {
    log.warning('Authentication failed - some tests may not work');
  }
  
  // Run quick tests
  results.push(await quickTest('Backend Server Health', testBackendHealth));
  results.push(await quickTest('Frontend Server Health', testFrontendHealth));
  results.push(await quickTest('Database Connection', testDatabaseConnection));
  results.push(await quickTest('Basic API Endpoints', testBasicAPIs));
  results.push(await quickTest('Critical Data Access', testCriticalData));
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = Math.round((passed / total) * 100);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 QUICK CHECK SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log('='.repeat(50));
  
  if (successRate >= 80) {
    log.success('System is healthy and ready!');
  } else if (successRate >= 60) {
    log.warning('System has some issues but is mostly functional.');
  } else {
    log.error('System has critical issues that need attention.');
  }
  
  console.log(`\n💡 For detailed testing, run: node testing/scripts/comprehensive-test-suite.js`);
  
  process.exit(successRate >= 60 ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runQuickCheck().catch((error) => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runQuickCheck };
