const db = require('./db');

async function createTestInvoices() {
  try {
    console.log('Creating test invoices...');
    
    // Create first invoice
    const [invoiceResult] = await db.query(
      'INSERT INTO Invoice (totalAmount, amountPaid, status, repairRequestId, currency, taxAmount) VALUES (?, ?, ?, ?, ?, ?)',
      [500.00, 0.00, 'unpaid', 1, 'SAR', 75.00]
    );
    
    const invoiceId1 = invoiceResult.insertId;
    console.log('Created invoice 1 with ID:', invoiceId1);
    
    // Create invoice items for first invoice
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 425.00, 425.00, invoiceId1, 'إصلاح شاشة الهاتف', 'service']
    );
    
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 75.00, 75.00, invoiceId1, 'ضريبة القيمة المضافة', 'service']
    );
    
    // Create second invoice
    const [invoiceResult2] = await db.query(
      'INSERT INTO Invoice (totalAmount, amountPaid, status, repairRequestId, currency, taxAmount) VALUES (?, ?, ?, ?, ?, ?)',
      [300.00, 150.00, 'partial', 2, 'SAR', 45.00]
    );
    
    const invoiceId2 = invoiceResult2.insertId;
    console.log('Created invoice 2 with ID:', invoiceId2);
    
    // Create invoice items for second invoice
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 255.00, 255.00, invoiceId2, 'استبدال البطارية', 'part']
    );
    
    await db.query(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 45.00, 45.00, invoiceId2, 'ضريبة القيمة المضافة', 'service']
    );
    
    // Create a payment for the second invoice
    await db.query(
      'INSERT INTO Payment (amount, paymentMethod, invoiceId, userId, currency) VALUES (?, ?, ?, ?, ?)',
      [150.00, 'cash', invoiceId2, 1, 'SAR']
    );
    
    console.log('Test data created successfully!');
    
    // Show created invoices
    const [invoices] = await db.query('SELECT * FROM Invoice ORDER BY id DESC LIMIT 2');
    console.log('Created invoices:', invoices);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestInvoices();
