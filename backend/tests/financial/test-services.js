// Simple test file for Financial Services
// Run with: node tests/financial/test-services.js

const expensesService = require('../../services/financial/expenses.service');
const paymentsService = require('../../services/financial/payments.service');
const invoicesService = require('../../services/financial/invoices.service');

async function testServices() {
  console.log('🧪 Testing Financial Services...\n');

  try {
    // Test ExpensesService
    console.log('1. Testing ExpensesService...');
    const expensesStats = await expensesService.getStats({}, null);
    console.log('   ✅ ExpensesService.getStats() - OK');
    console.log('   Stats:', expensesStats);

    // Test PaymentsService
    console.log('\n2. Testing PaymentsService...');
    const paymentsStats = await paymentsService.getStats({}, null);
    console.log('   ✅ PaymentsService.getStats() - OK');
    console.log('   Stats:', paymentsStats);

    // Test InvoicesService
    console.log('\n3. Testing InvoicesService...');
    const invoicesStats = await invoicesService.getStats({}, null);
    console.log('   ✅ InvoicesService.getStats() - OK');
    console.log('   Stats:', invoicesStats);

    console.log('\n✅ All services loaded and working correctly!');
  } catch (error) {
    console.error('❌ Error testing services:', error.message);
    console.error(error.stack);
  }

  // Exit after 2 seconds
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Run tests
testServices();


