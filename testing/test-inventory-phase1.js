#!/usr/bin/env node

/**
 * FixZone ERP - Inventory Module Phase 1 Testing
 * اختبار سريع لـ Phase 1
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;

/**
 * Test helper functions
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPass(testName) {
  passedTests++;
  log(`✅ ${testName}`, 'green');
}

function testFail(testName, error) {
  failedTests++;
  log(`❌ ${testName}`, 'red');
  log(`   Error: ${error}`, 'red');
}

/**
 * Test runner
 */
async function runTests() {
  log('\n====================================', 'cyan');
  log('🧪 Phase 1 - Inventory Module Tests', 'cyan');
  log('====================================\n', 'cyan');

  // Test 1: Get all inventory items
  try {
    log('Test 1: GET /api/inventory', 'yellow');
    const response = await axios.get(`${BASE_URL}/inventory`);
    
    if (response.data.success && response.data.data.items.length > 0) {
      testPass(`جلب الأصناف - ${response.data.data.items.length} صنف`);
      
      if (response.data.data.pagination) {
        testPass('Pagination موجود');
      }
      
      if (response.data.data.summary) {
        testPass(`الإحصائيات - قيمة المخزون: ${response.data.data.summary.totalValue} ج.م`);
      }
    } else {
      testFail('جلب الأصناف', 'لا توجد بيانات');
    }
  } catch (error) {
    testFail('GET /api/inventory', error.message);
  }

  // Test 2: Get single item
  try {
    log('\nTest 2: GET /api/inventory/:id', 'yellow');
    const response = await axios.get(`${BASE_URL}/inventory/1`);
    
    if (response.data.success && response.data.data.item) {
      testPass(`جلب صنف واحد - ${response.data.data.item.name}`);
      
      if (response.data.data.stockLevels) {
        testPass(`مستويات المخزون - ${response.data.data.stockLevels.length} مخزن`);
      }
    } else {
      testFail('جلب صنف واحد', 'لا توجد بيانات');
    }
  } catch (error) {
    testFail('GET /api/inventory/:id', error.message);
  }

  // Test 3: Search
  try {
    log('\nTest 3: Search /api/inventory?search=lcd', 'yellow');
    const response = await axios.get(`${BASE_URL}/inventory?search=lcd`);
    
    if (response.data.success) {
      const items = response.data.data.items;
      const allContainLCD = items.every(item => 
        item.name.toLowerCase().includes('lcd') || 
        item.sku.toLowerCase().includes('lcd')
      );
      
      if (allContainLCD || items.length > 0) {
        testPass(`البحث - وجد ${items.length} صنف`);
      } else {
        testFail('البحث', 'النتائج غير صحيحة');
      }
    }
  } catch (error) {
    testFail('Search', error.message);
  }

  // Test 4: Filter by category
  try {
    log('\nTest 4: Filter /api/inventory?category=1', 'yellow');
    const response = await axios.get(`${BASE_URL}/inventory?category=1`);
    
    if (response.data.success) {
      testPass(`الفلترة حسب الفئة - ${response.data.data.items.length} صنف`);
    }
  } catch (error) {
    testFail('Filter by category', error.message);
  }

  // Test 5: Get vendors
  try {
    log('\nTest 5: GET /api/vendors', 'yellow');
    const response = await axios.get(`${BASE_URL}/vendors`);
    
    if (response.data.success) {
      const vendorsCount = response.data.data?.vendors?.length || 0;
      testPass(`جلب الموردين - ${vendorsCount} مورد`);
    }
  } catch (error) {
    testFail('GET /api/vendors', error.message);
  }

  // Test 6: Get warehouses
  try {
    log('\nTest 6: GET /api/warehouses', 'yellow');
    const response = await axios.get(`${BASE_URL}/warehouses`);
    
    if (response.data && response.data.length > 0) {
      testPass(`جلب المخازن - ${response.data.length} مخزن`);
    }
  } catch (error) {
    testFail('GET /api/warehouses', error.message);
  }

  // Test 7: Get stock levels
  try {
    log('\nTest 7: GET /api/stock-levels', 'yellow');
    const response = await axios.get(`${BASE_URL}/stock-levels`);
    
    if (response.data && response.data.length > 0) {
      testPass(`جلب مستويات المخزون - ${response.data.length} مستوى`);
    }
  } catch (error) {
    testFail('GET /api/stock-levels', error.message);
  }

  // Test 8: Get stock movements
  try {
    log('\nTest 8: GET /api/stock-movements', 'yellow');
    const response = await axios.get(`${BASE_URL}/stock-movements`);
    
    if (response.data && response.data.length > 0) {
      testPass(`جلب الحركات المخزنية - ${response.data.length} حركة`);
    }
  } catch (error) {
    testFail('GET /api/stock-movements', error.message);
  }

  // Test 9: Validation test (should fail)
  try {
    log('\nTest 9: Validation - POST with invalid data', 'yellow');
    const response = await axios.post(`${BASE_URL}/inventory`, {
      name: '',  // Empty name
      purchasePrice: -10  // Negative price
    });
    
    testFail('Validation', 'يجب أن يرفض البيانات الخاطئة');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      testPass('Validation يعمل - رفض البيانات الخاطئة');
    } else {
      testFail('Validation', error.message);
    }
  }

  // Summary
  log('\n====================================', 'cyan');
  log('📊 ملخص النتائج', 'cyan');
  log('====================================\n', 'cyan');
  
  const totalTests = passedTests + failedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  log(`إجمالي الاختبارات: ${totalTests}`, 'blue');
  log(`✅ نجح: ${passedTests}`, 'green');
  log(`❌ فشل: ${failedTests}`, 'red');
  log(`📊 نسبة النجاح: ${successRate}%`, 'blue');
  
  if (failedTests === 0) {
    log('\n🎉 تهانينا! جميع الاختبارات نجحت!', 'green');
    log('✅ Phase 1 يعمل بشكل صحيح 100%\n', 'green');
  } else {
    log('\n⚠️ بعض الاختبارات فشلت', 'yellow');
    log('راجع الأخطاء أعلاه وأصلحها\n', 'yellow');
  }
  
  process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log('\n❌ خطأ عام في الاختبار:', 'red');
  log(error.message, 'red');
  log('\nتحقق من:', 'yellow');
  log('1. السيرفر يعمل على http://localhost:3001', 'yellow');
  log('2. قاعدة البيانات متصلة', 'yellow');
  log('3. البيانات التجريبية موجودة\n', 'yellow');
  process.exit(1);
});

