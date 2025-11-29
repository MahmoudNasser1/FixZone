#!/usr/bin/env node

/**
 * Navigation System - Comprehensive Testing
 * اختبار شامل لنظام التنقل والبارات
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test results
const results = {
  backend: {
    passed: 0,
    failed: 0,
    errors: [],
    performance: []
  },
  frontend: {
    passed: 0,
    failed: 0,
    errors: []
  },
  integration: {
    passed: 0,
    failed: 0,
    errors: []
  }
};

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test API function
async function testAPI(category, name, testFn) {
  try {
    log(`\n  Testing: ${name}`, 'cyan');
    const start = Date.now();
    await testFn();
    const end = Date.now();
    const duration = end - start;
    
    log(`  ✅ PASSED (${duration}ms)`, 'green');
    results[category].passed++;
    results[category].performance.push(duration);
    return { success: true, duration };
  } catch (error) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    results[category].failed++;
    results[category].errors.push({ name, error: error.message });
    return { success: false, error: error.message };
  }
}

// Test Navigation Items API
async function testNavigationItems() {
  const response = await axios.get(`${API_BASE}/navigation/items`, {
    withCredentials: true,
    timeout: 5000
  });
  
  if (!response.data.success) {
    throw new Error('Response not successful');
  }
  
  const items = response.data.data;
  if (!Array.isArray(items)) {
    throw new Error('Items should be an array');
  }
  
  if (items.length === 0) {
    throw new Error('Items array is empty');
  }
  
  // Validate structure
  items.forEach((section, index) => {
    if (!section.section) {
      throw new Error(`Section ${index} missing 'section' field`);
    }
    if (!Array.isArray(section.items)) {
      throw new Error(`Section ${index} missing 'items' array`);
    }
    section.items.forEach((item, itemIndex) => {
      if (!item.label) {
        throw new Error(`Item ${index}.${itemIndex} missing 'label'`);
      }
      if (!item.icon && !item.href) {
        throw new Error(`Item ${index}.${itemIndex} missing both 'icon' and 'href'`);
      }
    });
  });
  
  log(`    Found ${items.length} sections`, 'green');
  items.forEach((section) => {
    log(`      - ${section.section}: ${section.items?.length || 0} items`, 'green');
  });
}

// Test Navigation Stats API
async function testNavigationStats() {
  const response = await axios.get(`${API_BASE}/navigation/stats`, {
    withCredentials: true,
    timeout: 5000
  });
  
  if (!response.data.success) {
    throw new Error('Response not successful');
  }
  
  const stats = response.data.data;
  if (!stats || typeof stats !== 'object') {
    throw new Error('Stats should be an object');
  }
  
  log(`    Stats received:`, 'green');
  Object.keys(stats).forEach(key => {
    log(`      - ${key}: ${stats[key]}`, 'green');
  });
}

// Test Quick Stats API
async function testQuickStats() {
  const response = await axios.get(`${API_BASE}/dashboard/quick-stats`, {
    withCredentials: true,
    timeout: 5000
  });
  
  if (!response.data.success) {
    throw new Error('Response not successful');
  }
  
  const stats = response.data.data;
  if (!stats || typeof stats !== 'object') {
    throw new Error('Stats should be an object');
  }
  
  log(`    Quick Stats received:`, 'green');
  Object.keys(stats).forEach(key => {
    log(`      - ${key}: ${stats[key]}`, 'green');
  });
}

// Test Frontend
async function testFrontend() {
  const response = await axios.get(FRONTEND_URL, {
    timeout: 5000,
    validateStatus: (status) => status < 500
  });
  
  if (response.status >= 400) {
    throw new Error(`Frontend returned status ${response.status}`);
  }
  
  log(`    Frontend is accessible (${response.status})`, 'green');
}

// Main test function
async function runTests() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  log('🧪 Navigation System - Comprehensive Testing', 'yellow');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  log(`API Base URL: ${API_BASE}`, 'blue');
  log(`Frontend URL: ${FRONTEND_URL}`, 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'yellow');
  
  // ==================== BACKEND TESTING ====================
  log('📡 Backend APIs Testing:', 'blue');
  
  // Test 1: Navigation Items
  await testAPI('backend', 'Navigation Items API', testNavigationItems);
  
  // Test 2: Navigation Stats
  await testAPI('backend', 'Navigation Stats API', testNavigationStats);
  
  // Test 3: Quick Stats
  await testAPI('backend', 'Quick Stats API', testQuickStats);
  
  // ==================== FRONTEND TESTING ====================
  log('\n🎨 Frontend Testing:', 'blue');
  
  // Test 4: Frontend Accessibility
  await testAPI('frontend', 'Frontend Accessibility', testFrontend);
  
  // ==================== INTEGRATION TESTING ====================
  log('\n🔗 Integration Testing:', 'blue');
  
  // Test 5: API Integration
  await testAPI('integration', 'API Integration', async () => {
    // Test that navigation items can be fetched and used
    const itemsResponse = await axios.get(`${API_BASE}/navigation/items`, {
      withCredentials: true
    });
    
    if (!itemsResponse.data.success) {
      throw new Error('Navigation items API failed');
    }
    
    const statsResponse = await axios.get(`${API_BASE}/navigation/stats`, {
      withCredentials: true
    });
    
    if (!statsResponse.data.success) {
      throw new Error('Navigation stats API failed');
    }
    
    log('    ✅ APIs work together correctly', 'green');
  });
  
  // ==================== PERFORMANCE TESTING ====================
  log('\n⚡ Performance Testing:', 'blue');
  
  if (results.backend.performance.length > 0) {
    const avgTime = results.backend.performance.reduce((a, b) => a + b, 0) / results.backend.performance.length;
    const maxTime = Math.max(...results.backend.performance);
    const minTime = Math.min(...results.backend.performance);
    
    log(`    Average Response Time: ${avgTime.toFixed(2)}ms`, 'cyan');
    log(`    Min Response Time: ${minTime}ms`, 'cyan');
    log(`    Max Response Time: ${maxTime}ms`, 'cyan');
    
    // Performance checks
    if (avgTime > 1000) {
      log(`    ⚠️  Warning: Average response time is high (>1s)`, 'yellow');
    }
    if (maxTime > 2000) {
      log(`    ⚠️  Warning: Max response time is very high (>2s)`, 'yellow');
    }
  }
  
  // ==================== SUMMARY ====================
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  log('📊 Test Summary', 'yellow');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  
  const totalPassed = results.backend.passed + results.frontend.passed + results.integration.passed;
  const totalFailed = results.backend.failed + results.frontend.failed + results.integration.failed;
  
  log(`\nBackend:`, 'blue');
  log(`  ✅ Passed: ${results.backend.passed}`, 'green');
  log(`  ❌ Failed: ${results.backend.failed}`, 'red');
  
  log(`\nFrontend:`, 'blue');
  log(`  ✅ Passed: ${results.frontend.passed}`, 'green');
  log(`  ❌ Failed: ${results.frontend.failed}`, 'red');
  
  log(`\nIntegration:`, 'blue');
  log(`  ✅ Passed: ${results.integration.passed}`, 'green');
  log(`  ❌ Failed: ${results.integration.failed}`, 'red');
  
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'yellow');
  log(`Total: ${totalPassed + totalFailed} tests`, 'cyan');
  log(`✅ Passed: ${totalPassed}`, 'green');
  log(`❌ Failed: ${totalFailed}`, 'red');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'yellow');
  
  // Errors
  const allErrors = [
    ...results.backend.errors,
    ...results.frontend.errors,
    ...results.integration.errors
  ];
  
  if (allErrors.length > 0) {
    log('❌ Errors:', 'red');
    allErrors.forEach((err, index) => {
      log(`  ${index + 1}. ${err.name}: ${err.error}`, 'red');
    });
    log('');
  }
  
  // Exit code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

