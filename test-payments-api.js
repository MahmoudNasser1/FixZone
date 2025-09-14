const express = require('express');
const cors = require('cors');
const db = require('./backend/db');

const app = express();
app.use(cors());
app.use(express.json());

// Test payments endpoint
app.get('/test-payments', async (req, res) => {
  try {
    console.log('Testing payments query...');
    
    const query = `
      SELECT 
        p.*,
        i.invoiceNumber,
        i.totalAmount as invoiceTotal,
        i.finalAmount as invoiceFinal,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        c.phone as customerPhone,
        u.firstName as createdByFirstName,
        u.lastName as createdByLastName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId) as totalPaid,
        (i.finalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId)) as remainingAmount
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN Customer c ON i.customerId = c.id
      LEFT JOIN User u ON p.createdBy = u.id
      ORDER BY p.paymentDate DESC, p.createdAt DESC
      LIMIT 10
    `;
    
    const [rows] = await db.query(query);
    console.log('Query successful, found', rows.length, 'payments');
    
    res.json({
      success: true,
      payments: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error in test-payments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

app.listen(3002, () => {
  console.log('Test server running on port 3002');
  console.log('Test URL: http://localhost:3002/test-payments');
});

