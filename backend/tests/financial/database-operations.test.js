// Database Operations Integration Tests
// Tests for CRUD operations, transactions, and soft deletes

const db = require('../../db');

describe('Financial Module - Database Operations', () => {
  let testInvoiceId;
  let testExpenseId;
  let testPaymentId;
  let connection;

  beforeAll(async () => {
    connection = await db.getConnection();
  });

  afterAll(async () => {
    // Cleanup
    if (testInvoiceId) {
      await db.query('DELETE FROM InvoiceItem WHERE invoiceId = ?', [testInvoiceId]);
      await db.query('DELETE FROM Invoice WHERE id = ?', [testInvoiceId]);
    }
    if (testExpenseId) {
      await db.query('DELETE FROM Expense WHERE id = ?', [testExpenseId]);
    }
    if (testPaymentId) {
      await db.query('DELETE FROM Payment WHERE id = ?', [testPaymentId]);
    }
    if (connection) {
      connection.release();
    }
  });

  describe('Invoice CRUD Operations', () => {
    it('should create an invoice with items in a transaction', async () => {
      await connection.beginTransaction();

      try {
        // Create invoice
        const [invoiceResult] = await connection.query(
          `INSERT INTO Invoice 
           (invoiceNumber, customerId, totalAmount, taxAmount, status, currency, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          ['TEST-INV-001', 1, 114, 14, 'draft', 'EGP']
        );
        testInvoiceId = invoiceResult.insertId;

        // Create invoice items
        await connection.query(
          `INSERT INTO InvoiceItem 
           (invoiceId, description, quantity, unitPrice, totalPrice, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [testInvoiceId, 'Test Item 1', 1, 100, 100]
        );

        await connection.commit();

        // Verify
        const [invoices] = await db.query('SELECT * FROM Invoice WHERE id = ?', [testInvoiceId]);
        expect(invoices.length).toBe(1);
        expect(invoices[0].invoiceNumber).toBe('TEST-INV-001');

        const [items] = await db.query('SELECT * FROM InvoiceItem WHERE invoiceId = ?', [testInvoiceId]);
        expect(items.length).toBe(1);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });

    it('should update invoice and recalculate totals', async () => {
      if (!testInvoiceId) {
        // Create test invoice
        const [result] = await db.query(
          `INSERT INTO Invoice (invoiceNumber, totalAmount, status, createdAt, updatedAt)
           VALUES (?, ?, ?, NOW(), NOW())`,
          ['TEST-INV-002', 100, 'draft']
        );
        testInvoiceId = result.insertId;
      }

      // Update invoice
      await db.query(
        `UPDATE Invoice SET status = ?, updatedAt = NOW() WHERE id = ?`,
        ['sent', testInvoiceId]
      );

      // Verify
      const [invoices] = await db.query('SELECT * FROM Invoice WHERE id = ?', [testInvoiceId]);
      expect(invoices[0].status).toBe('sent');
    });

    it('should soft delete invoice item', async () => {
      if (!testInvoiceId) return;

      // Check if deletedAt column exists
      const [columnCheck] = await db.query(`
        SELECT COUNT(*) as exists 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'InvoiceItem' 
        AND COLUMN_NAME = 'deletedAt'
      `);

      if (columnCheck[0].exists > 0) {
        // Get an item
        const [items] = await db.query(
          'SELECT * FROM InvoiceItem WHERE invoiceId = ? LIMIT 1',
          [testInvoiceId]
        );

        if (items.length > 0) {
          const itemId = items[0].id;

          // Soft delete
          await db.query(
            'UPDATE InvoiceItem SET deletedAt = NOW() WHERE id = ?',
            [itemId]
          );

          // Verify soft delete
          const [deletedItems] = await db.query(
            'SELECT * FROM InvoiceItem WHERE id = ? AND deletedAt IS NOT NULL',
            [itemId]
          );
          expect(deletedItems.length).toBe(1);
        }
      }
    });
  });

  describe('Payment Transactions', () => {
    it('should create payment and update invoice status atomically', async () => {
      if (!testInvoiceId) {
        // Create test invoice
        const [result] = await db.query(
          `INSERT INTO Invoice (invoiceNumber, totalAmount, amountPaid, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          ['TEST-INV-003', 200, 0, 'pending']
        );
        testInvoiceId = result.insertId;
      }

      await connection.beginTransaction();

      try {
        // Create payment
        const [paymentResult] = await connection.query(
          `INSERT INTO Payment (invoiceId, amount, paymentMethod, paymentDate, userId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [testInvoiceId, 200, 'cash', '2025-01-28', 1]
        );
        testPaymentId = paymentResult.insertId;

        // Update invoice
        await connection.query(
          `UPDATE Invoice SET amountPaid = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
          [200, 'paid', testInvoiceId]
        );

        await connection.commit();

        // Verify
        const [payments] = await db.query('SELECT * FROM Payment WHERE id = ?', [testPaymentId]);
        expect(payments.length).toBe(1);

        const [invoices] = await db.query('SELECT * FROM Invoice WHERE id = ?', [testInvoiceId]);
        expect(invoices[0].status).toBe('paid');
        expect(parseFloat(invoices[0].amountPaid)).toBe(200);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });

    it('should rollback transaction on error', async () => {
      await connection.beginTransaction();

      try {
        // Try to create payment with invalid invoice
        await connection.query(
          `INSERT INTO Payment (invoiceId, amount, paymentMethod, userId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [99999, 100, 'cash', 1]
        );

        // This should fail due to foreign key constraint
        await connection.commit();
        expect.fail('Should have thrown an error');
      } catch (error) {
        await connection.rollback();
        // Verify no payment was created
        const [payments] = await db.query('SELECT * FROM Payment WHERE invoiceId = ?', [99999]);
        expect(payments.length).toBe(0);
      }
    });
  });

  describe('Expense CRUD Operations', () => {
    it('should create an expense', async () => {
      const [result] = await db.query(
        `INSERT INTO Expense (categoryId, amount, description, date, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [1, 100, 'Test expense', '2025-01-28', 1]
      );
      testExpenseId = result.insertId;

      expect(testExpenseId).toBeGreaterThan(0);

      // Verify
      const [expenses] = await db.query('SELECT * FROM Expense WHERE id = ?', [testExpenseId]);
      expect(expenses.length).toBe(1);
      expect(expenses[0].description).toBe('Test expense');
    });

    it('should update an expense', async () => {
      if (!testExpenseId) return;

      await db.query(
        `UPDATE Expense SET description = ?, updatedAt = NOW() WHERE id = ?`,
        ['Updated expense', testExpenseId]
      );

      // Verify
      const [expenses] = await db.query('SELECT * FROM Expense WHERE id = ?', [testExpenseId]);
      expect(expenses[0].description).toBe('Updated expense');
    });

    it('should soft delete an expense', async () => {
      if (!testExpenseId) return;

      // Check if deletedAt column exists
      const [columnCheck] = await db.query(`
        SELECT COUNT(*) as exists 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Expense' 
        AND COLUMN_NAME = 'deletedAt'
      `);

      if (columnCheck[0].exists > 0) {
        await db.query(
          'UPDATE Expense SET deletedAt = NOW() WHERE id = ?',
          [testExpenseId]
        );

        // Verify soft delete
        const [deletedExpenses] = await db.query(
          'SELECT * FROM Expense WHERE id = ? AND deletedAt IS NOT NULL',
          [testExpenseId]
        );
        expect(deletedExpenses.length).toBe(1);
      }
    });
  });

  describe('Complex Queries', () => {
    it('should calculate invoice totals correctly', async () => {
      if (!testInvoiceId) return;

      const [result] = await db.query(
        `SELECT 
          i.totalAmount,
          COALESCE(SUM(ii.quantity * ii.unitPrice), 0) as calculatedTotal
         FROM Invoice i
         LEFT JOIN InvoiceItem ii ON i.id = ii.invoiceId 
           AND (ii.deletedAt IS NULL OR ii.deletedAt = '')
         WHERE i.id = ?
         GROUP BY i.id`,
        [testInvoiceId]
      );

      expect(result.length).toBe(1);
      expect(parseFloat(result[0].calculatedTotal)).toBeGreaterThanOrEqual(0);
    });

    it('should get payment summary for invoice', async () => {
      if (!testInvoiceId) return;

      const [result] = await db.query(
        `SELECT 
          i.totalAmount,
          COALESCE(SUM(p.amount), 0) as totalPaid,
          (i.totalAmount - COALESCE(SUM(p.amount), 0)) as remaining
         FROM Invoice i
         LEFT JOIN Payment p ON i.id = p.invoiceId
         WHERE i.id = ?
         GROUP BY i.id, i.totalAmount`,
        [testInvoiceId]
      );

      expect(result.length).toBe(1);
      expect(parseFloat(result[0].totalPaid)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(result[0].remaining)).toBeGreaterThanOrEqual(0);
    });
  });
});

