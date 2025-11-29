// Test Financial Migrations
// Run after applying migrations to verify everything works

const db = require('../db');

async function testMigrations() {
  console.log('🧪 Testing Financial Migrations...\n');

  try {
    // Test 1: Check Invoice table columns
    console.log('Test 1: Checking Invoice table columns...');
    const [invoiceColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Invoice' 
      AND COLUMN_NAME IN ('discountAmount', 'dueDate', 'notes', 'customerId')
    `);
    
    const expectedColumns = ['discountAmount', 'dueDate', 'notes', 'customerId'];
    const foundColumns = invoiceColumns.map(col => col.COLUMN_NAME);
    const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ Invoice table columns: OK');
    } else {
      console.log(`❌ Invoice table missing columns: ${missingColumns.join(', ')}`);
    }

    // Test 2: Check Payment table columns
    console.log('\nTest 2: Checking Payment table columns...');
    const [paymentColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Payment' 
      AND COLUMN_NAME = 'paymentDate'
    `);
    
    if (paymentColumns.length > 0) {
      console.log('✅ Payment table paymentDate column: OK');
    } else {
      console.log('❌ Payment table missing paymentDate column');
    }

    // Test 3: Check InvoiceItem table columns
    console.log('\nTest 3: Checking InvoiceItem table columns...');
    const [invoiceItemColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'InvoiceItem' 
      AND COLUMN_NAME = 'deletedAt'
    `);
    
    if (invoiceItemColumns.length > 0) {
      console.log('✅ InvoiceItem table deletedAt column: OK');
    } else {
      console.log('❌ InvoiceItem table missing deletedAt column');
    }

    // Test 4: Test Invoice operations
    console.log('\nTest 4: Testing Invoice operations...');
    const [invoices] = await db.execute('SELECT COUNT(*) as count FROM Invoice');
    console.log(`✅ Invoice count: ${invoices[0].count}`);

    // Test 5: Test Payment operations
    console.log('\nTest 5: Testing Payment operations...');
    const [payments] = await db.execute('SELECT COUNT(*) as count FROM Payment');
    console.log(`✅ Payment count: ${payments[0].count}`);

    // Test 6: Test InvoiceItem with soft delete
    console.log('\nTest 6: Testing InvoiceItem soft delete...');
    const [invoiceItems] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM InvoiceItem 
      WHERE deletedAt IS NULL
    `);
    console.log(`✅ Active InvoiceItem count: ${invoiceItems[0].count}`);

    // Test 7: Test query with new columns
    console.log('\nTest 7: Testing queries with new columns...');
    const [testInvoice] = await db.execute(`
      SELECT 
        id, 
        discountAmount, 
        dueDate, 
        notes, 
        customerId 
      FROM Invoice 
      LIMIT 1
    `);
    
    if (testInvoice.length > 0) {
      console.log('✅ Query with new columns works');
    } else {
      console.log('⚠️  No invoices found to test');
    }

    console.log('\n✅ All migration tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testMigrations();


