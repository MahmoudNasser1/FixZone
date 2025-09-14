const db = require('./backend/db');

async function addTestPayment() {
  try {
    console.log('Adding test payment...');
    
    // First, check if we have any invoices
    const [invoices] = await db.query('SELECT id FROM Invoice LIMIT 1');
    if (invoices.length === 0) {
      console.log('No invoices found. Creating test invoice first...');
      
      // Create test customer
      const [customerResult] = await db.query(`
        INSERT INTO Customer (firstName, lastName, phone, email, address, cityId, companyId, createdBy)
        VALUES ('عميل', 'تجريبي', '01234567890', 'test@example.com', 'عنوان تجريبي', 1, 1, 1)
      `);
      const customerId = customerResult.insertId;
      console.log('Created test customer with ID:', customerId);
      
      // Create test invoice
      const [invoiceResult] = await db.query(`
        INSERT INTO Invoice (invoiceNumber, customerId, totalAmount, finalAmount, issueDate, dueDate, status, createdBy)
        VALUES ('INV-001', ?, 1000.00, 1000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'draft', 1)
      `, [customerId]);
      const invoiceId = invoiceResult.insertId;
      console.log('Created test invoice with ID:', invoiceId);
      
      // Create test payment
      const [paymentResult] = await db.query(`
        INSERT INTO Payment (invoiceId, amount, currency, paymentMethod, paymentDate, referenceNumber, notes, createdBy)
        VALUES (?, 500.00, 'EGP', 'cash', CURDATE(), 'REF-001', 'دفعة تجريبية', 1)
      `, [invoiceId]);
      console.log('Created test payment with ID:', paymentResult.insertId);
      
    } else {
      console.log('Found existing invoice with ID:', invoices[0].id);
      
      // Create test payment for existing invoice
      const [paymentResult] = await db.query(`
        INSERT INTO Payment (invoiceId, amount, currency, paymentMethod, paymentDate, referenceNumber, notes, createdBy)
        VALUES (?, 500.00, 'EGP', 'cash', CURDATE(), 'REF-001', 'دفعة تجريبية', 1)
      `, [invoices[0].id]);
      console.log('Created test payment with ID:', paymentResult.insertId);
    }
    
    console.log('Test payment added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding test payment:', error);
    process.exit(1);
  }
}

addTestPayment();

