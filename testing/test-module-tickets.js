/**
 * Module Test: Tickets/Repairs
 * 
 * Tests all endpoints and scenarios for the Tickets module
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
let createdTicketId = null;

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
    console.log('Login response:', { status: response.status, data });
    
    if (response.ok) {
      console.log('✅ Login successful');
      // Token is in httpOnly cookie, we'll use cookie in subsequent requests
      return 'logged-in'; 
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

// Test 1: Get all tickets
async function testGetAllTickets() {
  console.log('\n📋 Test 1: GET /api/repairs - Get all tickets');
  try {
    const response = await fetch(`${API_BASE_URL}/repairs`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Get all tickets', passed, 
      passed ? `Found ${data.length} tickets` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get all tickets', false, error.message);
    return false;
  }
}

// Test 2: Get single ticket
async function testGetSingleTicket() {
  console.log('\n📋 Test 2: GET /api/repairs/:id - Get single ticket');
  try {
    // First get list to find a valid ID
    const listResponse = await fetch(`${API_BASE_URL}/repairs`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const list = await listResponse.json();
    
    if (!list.length) {
      recordTest('Get single ticket', false, 'No tickets available to test');
      return false;
    }
    
    const firstId = list[0].id;
    
    // Now get single ticket
    const response = await fetch(`${API_BASE_URL}/repairs/${firstId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && data.id === firstId;
    recordTest('Get single ticket', passed,
      passed ? `Ticket ID: ${data.id}` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get single ticket', false, error.message);
    return false;
  }
}

// Test 3: Create ticket with existing customer
async function testCreateTicketExisting() {
  console.log('\n📋 Test 3: POST /api/repairs - Create ticket (existing customer)');
  try {
    const response = await fetch(`${API_BASE_URL}/repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        customerId: 1,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S21 Test',
        reportedProblem: 'Test problem - Screen broken',
        priority: 'high',
        estimatedCost: 500
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success && data.data?.id;
    
    if (passed) {
      createdTicketId = data.data.id;
    }
    
    recordTest('Create ticket (existing customer)', passed,
      passed ? `Created ticket #${data.data.id}` : `Status: ${response.status} - ${data.error || 'Unknown error'}`);
    
    return passed;
  } catch (error) {
    recordTest('Create ticket (existing customer)', false, error.message);
    return false;
  }
}

// Test 4: Create ticket with new customer inline
async function testCreateTicketNewCustomer() {
  console.log('\n📋 Test 4: POST /api/repairs - Create ticket (new customer)');
  try {
    const response = await fetch(`${API_BASE_URL}/repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        customer: {
          firstName: 'محمد',
          lastName: 'علي',
          phone: '01099887766',
          email: 'test@example.com'
        },
        deviceBrand: 'iPhone',
        deviceModel: '13 Pro',
        reportedProblem: 'البطارية تنفذ بسرعة - Test',
        priority: 'medium'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success && data.data?.id;
    recordTest('Create ticket (new customer)', passed,
      passed ? `Created ticket #${data.data.id}` : `Status: ${response.status} - ${data.error || 'Unknown error'}`);
    
    return passed;
  } catch (error) {
    recordTest('Create ticket (new customer)', false, error.message);
    return false;
  }
}

// Test 5: Create ticket - missing required fields (validation)
async function testCreateTicketValidation() {
  console.log('\n📋 Test 5: POST /api/repairs - Validation (missing fields)');
  try {
    const response = await fetch(`${API_BASE_URL}/repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        deviceBrand: 'Samsung'
        // Missing: customerId/customer, deviceModel, reportedProblem
      })
    });
    
    const data = await response.json();
    const passed = response.status === 400 && !data.success;
    recordTest('Validation - missing fields', passed,
      passed ? 'Correctly rejected' : `Status: ${response.status} - Should be 400`);
    
    return passed;
  } catch (error) {
    recordTest('Validation - missing fields', false, error.message);
    return false;
  }
}

// Test 6: Update ticket (status field in PUT)
async function testUpdateTicketStatus() {
  console.log('\n📋 Test 6: PUT /api/repairs/:id - Update ticket (with status)');
  
  if (!createdTicketId) {
    recordTest('Update ticket status', false, 'No ticket to update (previous test failed)');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/repairs/${createdTicketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        status: 'in_progress',
        notes: 'بدء الفحص الأولي - Test'
      })
    });
    
    const data = await response.json();
    const passed = response.ok && data.success;
    recordTest('Update ticket status', passed,
      passed ? `Updated to 'in_progress'` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Update ticket status', false, error.message);
    return false;
  }
}

// Test 7: Search tickets
async function testSearchTickets() {
  console.log('\n📋 Test 7: GET /api/repairs?search=... - Search tickets');
  try {
    const response = await fetch(`${API_BASE_URL}/repairs?search=Samsung`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Search tickets', passed,
      passed ? `Found ${data.length} matching tickets` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Search tickets', false, error.message);
    return false;
  }
}

// Test 8: Filter by status
async function testFilterByStatus() {
  console.log('\n📋 Test 8: GET /api/repairs?status=... - Filter by status');
  try {
    const response = await fetch(`${API_BASE_URL}/repairs?status=in_progress`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Filter by status', passed,
      passed ? `Found ${data.length} in_progress tickets` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Filter by status', false, error.message);
    return false;
  }
}

// Test 9: Get non-existent ticket (404)
async function testGetNonExistentTicket() {
  console.log('\n📋 Test 9: GET /api/repairs/99999 - Non-existent ticket');
  try {
    const response = await fetch(`${API_BASE_URL}/repairs/99999`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const passed = response.status === 404;
    recordTest('Get non-existent ticket', passed,
      passed ? 'Correctly returned 404' : `Status: ${response.status} - Should be 404`);
    
    return passed;
  } catch (error) {
    recordTest('Get non-existent ticket', false, error.message);
    return false;
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TICKETS MODULE TEST SUMMARY');
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
  const filename = `testing/results/tickets-module-test-${timestamp}.json`;
  
  try {
    fs.writeFileSync(filename, JSON.stringify({
      module: 'Tickets/Repairs',
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
  console.log('║  🧪 TICKETS MODULE - COMPREHENSIVE TEST SUITE       ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n⏰ Started at:', new Date().toLocaleString());
  
  // Login first
  console.log('\n🔐 Authenticating...');
  authToken = await login();
  
  // Run all tests
  await testGetAllTickets();
  await testGetSingleTicket();
  await testCreateTicketExisting();
  await testCreateTicketNewCustomer();
  await testCreateTicketValidation();
  await testUpdateTicketStatus();
  await testSearchTickets();
  await testFilterByStatus();
  await testGetNonExistentTicket();
  
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

