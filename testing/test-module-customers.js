/**
 * Module Test: Customers
 * 
 * Tests all endpoints and scenarios for the Customers module
 */

const fetch = globalThis.fetch;
const API_BASE_URL = 'http://localhost:3001/api';

// Test Results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

let authToken = '';
let createdCustomerId = null;

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

// Test 1: Get all customers
async function testGetAllCustomers() {
  console.log('\n👥 Test 1: GET /api/customers - Get all customers');
  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Get all customers', passed, 
      passed ? `Found ${data.length} customers` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get all customers', false, error.message);
    return false;
  }
}

// Test 2: Get single customer
async function testGetSingleCustomer() {
  console.log('\n👥 Test 2: GET /api/customers/:id - Get single customer');
  try {
    // Get list first to find a valid ID
    const listResponse = await fetch(`${API_BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const list = await listResponse.json();
    
    if (!list.length) {
      recordTest('Get single customer', false, 'No customers available to test');
      return false;
    }
    
    const firstId = list[0].id;
    
    const response = await fetch(`${API_BASE_URL}/customers/${firstId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && data.id === firstId;
    recordTest('Get single customer', passed,
      passed ? `Customer ID: ${data.id}` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get single customer', false, error.message);
    return false;
  }
}

// Test 3: Create customer (all fields)
async function testCreateCustomerFull() {
  console.log('\n👥 Test 3: POST /api/customers - Create customer (all fields)');
  try {
    const timestamp = Date.now();
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'أحمد',
        lastName: 'محمد',
        phone: `0109${timestamp.toString().slice(-7)}`,
        email: `test${timestamp}@example.com`,
        address: 'القاهرة، مصر',
        notes: 'عميل تجريبي - اختبار كامل'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success && data.customer?.id;
    
    if (passed) {
      createdCustomerId = data.customer.id;
    }
    
    recordTest('Create customer (all fields)', passed,
      passed ? `Created customer #${data.customer.id}` : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Create customer (all fields)', false, error.message);
    return false;
  }
}

// Test 4: Create customer (minimal fields)
async function testCreateCustomerMinimal() {
  console.log('\n👥 Test 4: POST /api/customers - Create customer (minimal)');
  try {
    const timestamp = Date.now();
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'علي',
        lastName: 'حسن',
        phone: `0109${timestamp.toString().slice(-7)}`
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success && data.customer?.id;
    recordTest('Create customer (minimal)', passed,
      passed ? `Created customer #${data.customer.id}` : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Create customer (minimal)', false, error.message);
    return false;
  }
}

// Test 5: Create customer - validation (missing required fields)
async function testCreateCustomerValidation() {
  console.log('\n👥 Test 5: POST /api/customers - Validation (missing phone)');
  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'محمد',
        lastName: 'علي'
        // Missing: phone (required)
      })
    });
    
    const data = await response.json();
    const passed = response.status === 400 && !data.success;
    recordTest('Customer validation - missing fields', passed,
      passed ? 'Correctly rejected' : `Status: ${response.status} - Should be 400`);
    
    return passed;
  } catch (error) {
    recordTest('Customer validation - missing fields', false, error.message);
    return false;
  }
}

// Test 6: Create customer - duplicate phone
async function testCreateCustomerDuplicate() {
  console.log('\n👥 Test 6: POST /api/customers - Duplicate phone (validation)');
  try {
    // First, get an existing customer's phone
    const listResponse = await fetch(`${API_BASE_URL}/customers?limit=1`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const list = await listResponse.json();
    
    if (!list.length) {
      recordTest('Duplicate phone validation', false, 'No existing customers to test');
      return false;
    }
    
    const existingPhone = list[0].phone;
    
    // Try to create customer with same phone
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'عميل',
        lastName: 'مكرر',
        phone: existingPhone
      })
    });
    
    const data = await response.json();
    const passed = response.status === 400 && !data.success;
    recordTest('Duplicate phone validation', passed,
      passed ? 'Correctly rejected duplicate' : `Status: ${response.status} - Should be 400`);
    
    return passed;
  } catch (error) {
    recordTest('Duplicate phone validation', false, error.message);
    return false;
  }
}

// Test 7: Update customer
async function testUpdateCustomer() {
  console.log('\n👥 Test 7: PUT /api/customers/:id - Update customer');
  try {
    if (!createdCustomerId) {
      recordTest('Update customer', false, 'No customer to update (previous test failed)');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/customers/${createdCustomerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'أحمد',
        lastName: 'محمد المحدّث',
        address: 'العنوان المحدّث - القاهرة',
        notes: 'تم التحديث'
      })
    });
    
    const data = await response.json();
    const passed = response.ok && data.success;
    recordTest('Update customer', passed,
      passed ? 'Customer updated' : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Update customer', false, error.message);
    return false;
  }
}

// Test 8: Search customers
async function testSearchCustomers() {
  console.log('\n👥 Test 8: GET /api/customers?search=... - Search customers');
  try {
    const response = await fetch(`${API_BASE_URL}/customers?search=محمد`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Search customers', passed,
      passed ? `Found ${data.length} matching customers` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Search customers', false, error.message);
    return false;
  }
}

// Test 9: Get customer with related data (tickets)
async function testGetCustomerWithRelations() {
  console.log('\n👥 Test 9: GET /api/customers/:id?includeTickets=true - With relations');
  try {
    // Get a customer with tickets
    const listResponse = await fetch(`${API_BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const list = await listResponse.json();
    
    if (!list.length) {
      recordTest('Get customer with relations', false, 'No customers available');
      return false;
    }
    
    const customerId = list[0].id;
    
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}?includeTickets=true`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && data.id === customerId;
    recordTest('Get customer with relations', passed,
      passed ? `Customer loaded` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get customer with relations', false, error.message);
    return false;
  }
}

// Test 10: Get non-existent customer (404)
async function testGetNonExistentCustomer() {
  console.log('\n👥 Test 10: GET /api/customers/99999 - Non-existent customer');
  try {
    const response = await fetch(`${API_BASE_URL}/customers/99999`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const passed = response.status === 404;
    recordTest('Get non-existent customer', passed,
      passed ? 'Correctly returned 404' : `Status: ${response.status} - Should be 404`);
    
    return passed;
  } catch (error) {
    recordTest('Get non-existent customer', false, error.message);
    return false;
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 CUSTOMERS MODULE TEST SUMMARY');
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
  const filename = `testing/results/customers-module-test-${timestamp}.json`;
  
  try {
    fs.writeFileSync(filename, JSON.stringify({
      module: 'Customers',
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
  console.log('║  🧪 CUSTOMERS MODULE - COMPREHENSIVE TEST SUITE     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n⏰ Started at:', new Date().toLocaleString());
  
  // Login first
  console.log('\n🔐 Authenticating...');
  authToken = await login();
  
  // Run all tests
  await testGetAllCustomers();
  await testGetSingleCustomer();
  await testCreateCustomerFull();
  await testCreateCustomerMinimal();
  await testCreateCustomerValidation();
  await testCreateCustomerDuplicate();
  await testUpdateCustomer();
  await testSearchCustomers();
  await testGetCustomerWithRelations();
  await testGetNonExistentCustomer();
  
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

