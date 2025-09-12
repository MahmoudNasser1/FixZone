const invoicesController = require('./controllers/invoicesController');

async function testInvoicesAPI() {
  console.log('🧪 Testing Invoices API...\n');

  // Test 1: Get All Invoices
  console.log('1️⃣ Testing GET /api/invoices');
  const req1 = { query: {} };
  const res1 = {
    json: (data) => {
      console.log('✅ Success:', data.success);
      console.log('📊 Total Invoices:', data.data?.invoices?.length || 0);
      if (data.data?.invoices?.[0]) {
        const invoice = data.data.invoices[0];
        console.log('📄 Sample Invoice:', {
          id: invoice.id,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          status: invoice.status,
          customerName: invoice.customerName
        });
      }
      console.log('📈 Stats:', data.data?.stats);
    },
    status: (code) => ({
      json: (data) => {
        console.log('❌ Error:', code, data);
      }
    })
  };

  await invoicesController.getAllInvoices(req1, res1);

  // Test 2: Get Invoice by ID
  console.log('\n2️⃣ Testing GET /api/invoices/1');
  const req2 = { params: { id: 1 } };
  const res2 = {
    json: (data) => {
      console.log('✅ Success:', data.success);
      if (data.data) {
        console.log('📄 Invoice Details:', {
          id: data.data.id,
          totalAmount: data.data.totalAmount,
          currency: data.data.currency,
          status: data.data.status,
          itemsCount: data.data.items?.length || 0
        });
      }
    },
    status: (code) => ({
      json: (data) => {
        console.log('❌ Error:', code, data);
      }
    })
  };

  await invoicesController.getInvoiceById(req2, res2);

  // Test 3: Get Invoice Statistics
  console.log('\n3️⃣ Testing GET /api/invoices/stats');
  const req3 = { query: {} };
  const res3 = {
    json: (data) => {
      console.log('✅ Success:', data.success);
      console.log('📊 Statistics:', data.data);
    },
    status: (code) => ({
      json: (data) => {
        console.log('❌ Error:', code, data);
      }
    })
  };

  await invoicesController.getStatistics(req3, res3);

  console.log('\n🎉 API Testing Complete!');
  process.exit(0);
}

testInvoicesAPI().catch(err => {
  console.error('❌ Test Error:', err);
  process.exit(1);
});
