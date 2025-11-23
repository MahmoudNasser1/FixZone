/**
 * Module Test: Inventory
 * 
 * Tests all endpoints and scenarios for the Inventory module
 */

const fetch = globalThis.fetch;
const API_BASE_URL = 'http://localhost:4000/api';

// Test Results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

let authToken = '';
let createdItemId = null;

// Helper: Login and get token
async function login() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: 'admin@fixzone.com',
        password: 'password'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
          console.log('✅ Login successful');
          return tokenMatch[1];
        }
      }
      console.log('✅ Login successful');
      return 'cookie-auth';
    }
    throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  }
}

// Helper: Record test result
function recordTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  ✅ ${name}`);
  } else {
    results.failed++;
    console.log(`  ❌ ${name}`);
    if (details) console.log(`     Details: ${details}`);
  }
  results.tests.push({ name, passed, details });
}

// Test 1: Get all inventory items
async function testGetAllItems() {
  console.log('\n📦 Test 1: GET /api/inventory - Get all items');
  try {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Get all inventory items', passed, 
      passed ? `Found ${data.length} items` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get all inventory items', false, error.message);
    return false;
  }
}

// Test 2: Get single item
async function testGetSingleItem() {
  console.log('\n📦 Test 2: GET /api/inventory/:id - Get single item');
  try {
    // Get list first to find a valid ID
    const listResponse = await fetch(`${API_BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const list = await listResponse.json();
    
    if (!list.length) {
      recordTest('Get single item', false, 'No items available to test');
      return false;
    }
    
    const firstId = list[0].id;
    
    const response = await fetch(`${API_BASE_URL}/inventory/${firstId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && data.id === firstId;
    recordTest('Get single item', passed,
      passed ? `Item ID: ${data.id}` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get single item', false, error.message);
    return false;
  }
}

// Test 3: Create inventory item
async function testCreateItem() {
  console.log('\n📦 Test 3: POST /api/inventory - Create item');
  try {
    const timestamp = Date.now();
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: `قطعة اختبار ${timestamp}`,
        sku: `TEST-${timestamp}`,
        description: 'قطعة للاختبار',
        category: 'اختبار',
        purchasePrice: 50,
        sellingPrice: 100,
        minStockLevel: 5,
        currentQuantity: 20,
        unit: 'قطعة'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success && data.item?.id;
    
    if (passed) {
      createdItemId = data.item.id;
    }
    
    recordTest('Create inventory item', passed,
      passed ? `Created item #${data.item.id}` : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Create inventory item', false, error.message);
    return false;
  }
}

// Test 4: Update inventory item
async function testUpdateItem() {
  console.log('\n📦 Test 4: PUT /api/inventory/:id - Update item');
  try {
    if (!createdItemId) {
      recordTest('Update item', false, 'No item to update (previous test failed)');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/inventory/${createdItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'قطعة محدّثة',
        sellingPrice: 120,
        description: 'تم التحديث'
      })
    });
    
    const data = await response.json();
    const passed = response.ok && data.success;
    recordTest('Update item', passed,
      passed ? 'Item updated' : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Update item', false, error.message);
    return false;
  }
}

// Test 5: Adjust quantity (restock)
async function testAdjustQuantity() {
  console.log('\n📦 Test 5: POST /api/inventory/:id/adjust - Adjust quantity');
  try {
    if (!createdItemId) {
      recordTest('Adjust quantity', false, 'No item to adjust (previous test failed)');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/inventory/${createdItemId}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        quantity: 10,
        type: 'add',
        reason: 'restock',
        notes: 'اختبار إعادة التعبئة'
      })
    });
    
    const data = await response.json();
    const passed = response.ok && data.success;
    recordTest('Adjust quantity (restock)', passed,
      passed ? 'Quantity adjusted' : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Adjust quantity (restock)', false, error.message);
    return false;
  }
}

// Test 6: Get low stock items
async function testGetLowStock() {
  console.log('\n📦 Test 6: GET /api/inventory?lowStock=true - Low stock items');
  try {
    const response = await fetch(`${API_BASE_URL}/inventory?lowStock=true`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Get low stock items', passed,
      passed ? `Found ${data.length} low stock items` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get low stock items', false, error.message);
    return false;
  }
}

// Test 7: Search inventory
async function testSearchInventory() {
  console.log('\n📦 Test 7: GET /api/inventory?search=... - Search items');
  try {
    const response = await fetch(`${API_BASE_URL}/inventory?search=test`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Search inventory', passed,
      passed ? `Found ${data.length} matching items` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Search inventory', false, error.message);
    return false;
  }
}

// Test 8: Get non-existent item (404)
async function testGetNonExistentItem() {
  console.log('\n📦 Test 8: GET /api/inventory/99999 - Non-existent item');
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/99999`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const passed = response.status === 404;
    recordTest('Get non-existent item', passed,
      passed ? 'Correctly returned 404' : `Status: ${response.status} - Should be 404`);
    
    return passed;
  } catch (error) {
    recordTest('Get non-existent item', false, error.message);
    return false;
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 INVENTORY MODULE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
  }
  
  console.log('\n');
  
  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `testing/results/inventory-module-test-${timestamp}.json`;
  
  try {
    fs.writeFileSync(filename, JSON.stringify({
      module: 'Inventory',
      timestamp: new Date().toISOString(),
      results: results
    }, null, 2));
    console.log(`💾 Results saved to: ${filename}`);
  } catch (error) {
    console.log(`⚠️  Could not save results: ${error.message}`);
  }
}

// Main execution
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  🧪 INVENTORY MODULE - COMPREHENSIVE TEST SUITE     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n⏰ Started at:', new Date().toLocaleString());
  
  // Login first
  console.log('\n🔐 Authenticating...');
  authToken = await login();
  
  // Run all tests
  await testGetAllItems();
  await testGetSingleItem();
  await testCreateItem();
  await testUpdateItem();
  await testAdjustQuantity();
  await testGetLowStock();
  await testSearchInventory();
  await testGetNonExistentItem();
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

