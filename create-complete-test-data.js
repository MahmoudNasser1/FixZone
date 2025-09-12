const db = require('./db');

async function createCompleteTestData() {
  try {
    console.log('🧪 Creating complete test data for invoices...');
    
    // Create invoice items for existing invoices
    console.log('📄 Adding invoice items...');
    
    // Items for Invoice 1
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 425.00, 425.00, 1, 'إصلاح شاشة الهاتف', 'service']
    );
    
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 75.00, 75.00, 1, 'ضريبة القيمة المضافة', 'service']
    );
    
    // Items for Invoice 2
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 255.00, 255.00, 2, 'استبدال البطارية', 'part']
    );
    
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 45.00, 45.00, 2, 'ضريبة القيمة المضافة', 'service']
    );
    
    console.log('✅ Invoice items created');
    
    // Create payments
    console.log('💳 Adding payments...');
    
    // Payment for Invoice 2 (partial payment)
    await db.query(
      'INSERT INTO Payment (amount, paymentMethod, invoiceId, userId, currency, reference) VALUES (?, ?, ?, ?, ?, ?)',
      [150.00, 'cash', 2, 1, 'EGP', 'PAY-001']
    );
    
    console.log('✅ Payments created');
    
    // Create a new paid invoice
    console.log('📄 Creating new paid invoice...');
    
    const [invoiceResult] = await db.query(
      'INSERT INTO Invoice (totalAmount, amountPaid, status, repairRequestId, currency, taxAmount) VALUES (?, ?, ?, ?, ?, ?)',
      [750.00, 750.00, 'paid', 3, 'EGP', 112.50]
    );
    
    const invoiceId3 = invoiceResult.insertId;
    console.log('✅ New invoice created with ID:', invoiceId3);
    
    // Add items to new invoice
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 637.50, 637.50, invoiceId3, 'إصلاح شاشة + بطارية', 'service']
    );
    
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 112.50, 112.50, invoiceId3, 'ضريبة القيمة المضافة', 'service']
    );
    
    // Add payment for new invoice
    await db.query(
      'INSERT INTO Payment (amount, paymentMethod, invoiceId, userId, currency, reference) VALUES (?, ?, ?, ?, ?, ?)',
      [750.00, 'bank_transfer', invoiceId3, 1, 'EGP', 'PAY-002']
    );
    
    console.log('✅ Complete test data created successfully!');
    
    // Show summary
    const [invoices] = await db.query('SELECT COUNT(*) as count FROM Invoice WHERE deletedAt IS NULL');
    const [items] = await db.query('SELECT COUNT(*) as count FROM InvoiceItem');
    const [payments] = await db.query('SELECT COUNT(*) as count FROM Payment');
    
    console.log('\n📊 Summary:');
    console.log('- Total Invoices:', invoices[0].count);
    console.log('- Total Invoice Items:', items[0].count);
    console.log('- Total Payments:', payments[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createCompleteTestData();
