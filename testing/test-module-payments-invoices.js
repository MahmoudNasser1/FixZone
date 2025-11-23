/**
 * Module Test: Payments & Invoices
 * 
 * Tests all endpoints and scenarios for Payments and Invoices modules
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
let createdInvoiceId = null;
let createdPaymentId = null;
let testRepairId = null;

// Helper: Login and get token from cookie
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
      // Extract token from Set-Cookie header
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
          console.log('✅ Login successful - Token extracted');
          return tokenMatch[1];
        }
      }
      console.log('✅ Login successful - Using cookie-based auth');
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

// Helper: Get a valid repair ID for testing
async function getValidRepairId() {
  try {
    const response = await fetch(`${API_BASE_URL}/repairs?status=completed`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const repairs = await response.json();
    
    if (repairs.length > 0) {
      return repairs[0].id;
    }
    
    // If no completed repair, get any repair
    const allResponse = await fetch(`${API_BASE_URL}/repairs`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const allRepairs = await allResponse.json();
    return allRepairs.length > 0 ? allRepairs[0].id : null;
  } catch (error) {
    console.error('Error getting valid repair ID:', error);
    return null;
  }
}

// ======================
// INVOICES TESTS
// ======================

// Test 1: Get all invoices
async function testGetAllInvoices() {
  console.log('\n💰 Test 1: GET /api/invoices - Get all invoices');
  try {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && (Array.isArray(data) || (data.data && Array.isArray(data.data)) || (data.invoices && Array.isArray(data.invoices)));
    const invoices = Array.isArray(data) ? data : (data.data || data.invoices || []);
    recordTest('Get all invoices', passed, 
      passed ? `Found ${invoices.length} invoices` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get all invoices', false, error.message);
    return false;
  }
}

// Test 2: Get single invoice
async function testGetSingleInvoice() {
  console.log('\n💰 Test 2: GET /api/invoices/:id - Get single invoice');
  try {
    // Get list first to find a valid ID
    const listResponse = await fetch(`${API_BASE_URL}/invoices`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const listData = await listResponse.json();
    const invoices = Array.isArray(listData) ? listData : (listData.data || listData.invoices || []);
    
    if (!invoices.length) {
      recordTest('Get single invoice', false, 'No invoices available to test');
      return false;
    }
    
    const firstId = invoices[0].id;
    
    const response = await fetch(`${API_BASE_URL}/invoices/${firstId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const invoice = data.data || data;
    const passed = response.ok && invoice.id === firstId;
    recordTest('Get single invoice', passed,
      passed ? `Invoice ID: ${invoice.id}` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get single invoice', false, error.message);
    return false;
  }
}

// Test 3: Create invoice for repair
async function testCreateInvoice() {
  console.log('\n💰 Test 3: POST /api/invoices - Create invoice');
  try {
    // Get a valid repair ID
    testRepairId = await getValidRepairId();
    
    if (!testRepairId) {
      recordTest('Create invoice', false, 'No repair requests available');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        repairRequestId: testRepairId,
        totalAmount: 500,
        currency: 'EGP',
        taxAmount: 70,
        status: 'draft'
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success && data.id;
    
    if (passed) {
      createdInvoiceId = data.id;
    }
    
    recordTest('Create invoice', passed,
      passed ? `Created invoice #${data.id}` : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Create invoice', false, error.message);
    return false;
  }
}

// Test 4: Create invoice - validation (missing fields)
async function testCreateInvoiceValidation() {
  console.log('\n💰 Test 4: POST /api/invoices - Validation (missing totalAmount)');
  try {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        repairRequestId: 1
        // Missing: totalAmount
      })
    });
    
    const data = await response.json();
    const passed = response.status === 400 && !data.success;
    recordTest('Invoice validation - missing fields', passed,
      passed ? 'Correctly rejected' : `Status: ${response.status} - Should be 400`);
    
    return passed;
  } catch (error) {
    recordTest('Invoice validation - missing fields', false, error.message);
    return false;
  }
}

// ======================
// PAYMENTS TESTS
// ======================

// Test 5: Get all payments
async function testGetAllPayments() {
  console.log('\n💳 Test 5: GET /api/payments - Get all payments');
  try {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    // Check if response is ok AND data has expected structure
    const passed = response.ok && (Array.isArray(data) || (data.payments && Array.isArray(data.payments)) || (data.success && Array.isArray(data.data)));
    const payments = Array.isArray(data) ? data : (data.payments || data.data || []);
    recordTest('Get all payments', passed, 
      passed ? `Found ${payments.length} payments` : `Status: ${response.status} - ${JSON.stringify(data).substring(0, 100)}`);
    
    return passed;
  } catch (error) {
    recordTest('Get all payments', false, error.message);
    return false;
  }
}

// Test 6: Get payment statistics
async function testGetPaymentStats() {
  console.log('\n💳 Test 6: GET /api/payments/stats - Payment statistics');
  try {
    const response = await fetch(`${API_BASE_URL}/payments/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && data.totalPayments !== undefined;
    recordTest('Get payment statistics', passed,
      passed ? `Total: ${data.totalPayments || 0}` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get payment statistics', false, error.message);
    return false;
  }
}

// Test 7: Create payment (full payment)
async function testCreatePayment() {
  console.log('\n💳 Test 7: POST /api/payments - Create payment');
  try {
    if (!createdInvoiceId) {
      recordTest('Create payment', false, 'No invoice to pay (previous test failed)');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        invoiceId: createdInvoiceId,
        amount: 500,
        currency: 'EGP',
        paymentMethod: 'cash',
        createdBy: 1 // Admin user ID
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success;
    
    if (passed && data.paymentId) {
      createdPaymentId = data.paymentId;
    }
    
    recordTest('Create payment', passed,
      passed ? `Payment created` : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Create payment', false, error.message);
    return false;
  }
}

// Test 8: Create payment - partial payment
async function testCreatePartialPayment() {
  console.log('\n💳 Test 8: POST /api/payments - Create partial payment');
  try {
    // Create another invoice first
    const invoiceResponse = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        repairRequestId: testRepairId,
        totalAmount: 1000,
        currency: 'EGP',
        taxAmount: 140
      })
    });
    
    const invoiceData = await invoiceResponse.json();
    
    if (!invoiceData.success) {
      recordTest('Create partial payment', false, 'Could not create test invoice');
      return false;
    }
    
    const partialInvoiceId = invoiceData.id;
    
    // Create partial payment (50% of 1000)
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        invoiceId: partialInvoiceId,
        amount: 500,
        currency: 'EGP',
        paymentMethod: 'card',
        createdBy: 1 // Admin user ID
      })
    });
    
    const data = await response.json();
    const passed = response.status === 201 && data.success;
    recordTest('Create partial payment', passed,
      passed ? 'Partial payment created' : `Status: ${response.status} - ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Create partial payment', false, error.message);
    return false;
  }
}

// Test 9: Create payment - validation (missing fields)
async function testCreatePaymentValidation() {
  console.log('\n💳 Test 9: POST /api/payments - Validation (missing amount)');
  try {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        invoiceId: 1,
        paymentMethod: 'cash'
        // Missing: amount
      })
    });
    
    const data = await response.json();
    const passed = response.status === 400 && !data.success;
    recordTest('Payment validation - missing fields', passed,
      passed ? 'Correctly rejected' : `Status: ${response.status} - Should be 400`);
    
    return passed;
  } catch (error) {
    recordTest('Payment validation - missing fields', false, error.message);
    return false;
  }
}

// Test 10: Get payments for specific invoice
async function testGetPaymentsByInvoice() {
  console.log('\n💳 Test 10: GET /api/payments?invoiceId=... - Filter by invoice');
  try {
    if (!createdInvoiceId) {
      recordTest('Get payments by invoice', false, 'No invoice to test');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/payments?invoiceId=${createdInvoiceId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && (Array.isArray(data) || (data.payments && Array.isArray(data.payments)));
    const payments = Array.isArray(data) ? data : (data.payments || []);
    recordTest('Get payments by invoice', passed,
      passed ? `Found ${payments.length} payment(s) for invoice ${createdInvoiceId}` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get payments by invoice', false, error.message);
    return false;
  }
}

// Test 11: Get overdue invoices (if route exists)
async function testGetOverduePayments() {
  console.log('\n💰 Test 11: GET /api/payments/overdue/list - Get overdue payments');
  try {
    const response = await fetch(`${API_BASE_URL}/payments/overdue/list`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const passed = response.ok && Array.isArray(data);
    recordTest('Get overdue payments', passed,
      passed ? `Found ${data.length} overdue payment(s)` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Get overdue payments', false, error.message);
    return false;
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PAYMENTS & INVOICES MODULE TEST SUMMARY');
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
  const filename = `testing/results/payments-invoices-test-${timestamp}.json`;
  
  try {
    fs.writeFileSync(filename, JSON.stringify({
      module: 'Payments & Invoices',
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
  console.log('║  🧪 PAYMENTS & INVOICES - COMPREHENSIVE TEST SUITE  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n⏰ Started at:', new Date().toLocaleString());
  
  // Login first
  console.log('\n🔐 Authenticating...');
  authToken = await login();
  
  // Run all tests
  await testGetAllInvoices();
  await testGetSingleInvoice();
  await testCreateInvoice();
  await testCreateInvoiceValidation();
  await testGetAllPayments();
  await testGetPaymentStats();
  await testCreatePayment();
  await testCreatePartialPayment();
  await testCreatePaymentValidation();
  await testGetPaymentsByInvoice();
  await testGetOverduePayments();
  
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

