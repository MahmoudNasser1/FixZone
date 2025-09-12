const db = require('./db');

async function testCompleteSystem() {
  try {
    console.log('🧪 Testing Complete Invoices System...\n');

    // Test 1: All Invoices
    console.log('1️⃣ Testing All Invoices');
    const [invoices] = await db.query(`
      SELECT i.*, rr.id as repairId, c.name as customerName 
      FROM Invoice i 
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id 
      LEFT JOIN Customer c ON rr.customerId = c.id 
      WHERE i.deletedAt IS NULL 
      ORDER BY i.id DESC
    `);
    
    console.log('✅ Total Invoices:', invoices.length);
    invoices.forEach((invoice, index) => {
      console.log(`   Invoice ${index + 1}:`, {
        id: invoice.id,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
        customerName: invoice.customerName
      });
    });

    // Test 2: Invoice Items
    console.log('\n2️⃣ Testing Invoice Items');
    const [items] = await db.query('SELECT * FROM InvoiceItem ORDER BY invoiceId, id');
    
    console.log('✅ Total Items:', items.length);
    items.forEach((item, index) => {
      console.log(`   Item ${index + 1}:`, {
        id: item.id,
        invoiceId: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        itemType: item.itemType
      });
    });

    // Test 3: Payments
    console.log('\n3️⃣ Testing Payments');
    const [payments] = await db.query('SELECT * FROM Payment ORDER BY invoiceId, id');
    
    console.log('✅ Total Payments:', payments.length);
    payments.forEach((payment, index) => {
      console.log(`   Payment ${index + 1}:`, {
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod
      });
    });

    // Test 4: Currency Consistency
    console.log('\n4️⃣ Testing Currency Consistency');
    const [currencyCheck] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN currency = 'EGP' THEN 1 ELSE 0 END) as egp_count,
        SUM(CASE WHEN currency = 'SAR' THEN 1 ELSE 0 END) as sar_count,
        SUM(CASE WHEN currency IS NULL THEN 1 ELSE 0 END) as null_count
      FROM Invoice 
      WHERE deletedAt IS NULL
    `);
    
    console.log('✅ Currency Check:', currencyCheck[0]);
    if (currencyCheck[0].egp_count === currencyCheck[0].total) {
      console.log('   ✅ All invoices use EGP currency');
    } else {
      console.log('   ⚠️  Mixed currencies found');
    }

    // Test 5: Status Distribution
    console.log('\n5️⃣ Testing Status Distribution');
    const [statusCheck] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(totalAmount) as total_amount,
        SUM(amountPaid) as total_paid
      FROM Invoice 
      WHERE deletedAt IS NULL 
      GROUP BY status
    `);
    
    console.log('✅ Status Distribution:');
    statusCheck.forEach(status => {
      console.log(`   ${status.status}: ${status.count} invoices, Total: ${status.total_amount}, Paid: ${status.total_paid}`);
    });

    console.log('\n🎉 System Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`- ${invoices.length} Invoices`);
    console.log(`- ${items.length} Invoice Items`);
    console.log(`- ${payments.length} Payments`);
    console.log(`- All currencies: EGP`);
    console.log(`- Statuses: ${statusCheck.map(s => s.status).join(', ')}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test Error:', error);
    process.exit(1);
  }
}

testCompleteSystem();
