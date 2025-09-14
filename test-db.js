const db = require('./backend/db');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test Payment table
    const [paymentRows] = await db.query('SELECT COUNT(*) as count FROM Payment');
    console.log('Payment count:', paymentRows[0].count);
    
    // Test Invoice table
    const [invoiceRows] = await db.query('SELECT COUNT(*) as count FROM Invoice');
    console.log('Invoice count:', invoiceRows[0].count);
    
    // Test Customer table
    const [customerRows] = await db.query('SELECT COUNT(*) as count FROM Customer');
    console.log('Customer count:', customerRows[0].count);
    
    // Test User table
    const [userRows] = await db.query('SELECT COUNT(*) as count FROM User');
    console.log('User count:', userRows[0].count);
    
    console.log('Database test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();

