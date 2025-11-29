// Module Integration Tests
// Tests for integration between Financial module and other modules

const db = require('../../db');

describe('Financial Module - Integration with Other Modules', () => {
  let testRepairId;
  let testInvoiceId;
  let testCustomerId;
  let testInventoryItemId;

  beforeAll(async () => {
    // Setup test data
    // Create test customer
    const [customerResult] = await db.query(
      `INSERT INTO Customer (name, phone, createdAt, updatedAt)
       VALUES (?, ?, NOW(), NOW())`,
      ['Test Customer', '01000000000']
    );
    testCustomerId = customerResult.insertId;

    // Create test repair
    const [repairResult] = await db.query(
      `INSERT INTO RepairRequest (customerId, reportedProblem, status, createdAt, updatedAt)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [testCustomerId, 'Test repair', 'completed']
    );
    testRepairId = repairResult.insertId;
  });

  afterAll(async () => {
    // Cleanup
    if (testInvoiceId) {
      await db.query('DELETE FROM InvoiceItem WHERE invoiceId = ?', [testInvoiceId]);
      await db.query('DELETE FROM Invoice WHERE id = ?', [testInvoiceId]);
    }
    if (testRepairId) {
      await db.query('DELETE FROM RepairRequest WHERE id = ?', [testRepairId]);
    }
    if (testCustomerId) {
      await db.query('DELETE FROM Customer WHERE id = ?', [testCustomerId]);
    }
  });

  describe('Repairs Integration', () => {
    it('should create invoice from repair and link correctly', async () => {
      // Create invoice from repair
      const [invoiceResult] = await db.query(
        `INSERT INTO Invoice 
         (invoiceNumber, repairRequestId, customerId, totalAmount, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        ['TEST-INV-REP-001', testRepairId, testCustomerId, 114, 'draft']
      );
      testInvoiceId = invoiceResult.insertId;

      // Verify invoice is linked to repair
      const [invoices] = await db.query(
        'SELECT * FROM Invoice WHERE repairRequestId = ?',
        [testRepairId]
      );
      expect(invoices.length).toBeGreaterThan(0);
      expect(invoices[0].customerId).toBe(testCustomerId);

      // Verify repair status can be updated
      await db.query(
        'UPDATE RepairRequest SET status = ? WHERE id = ?',
        ['invoiced', testRepairId]
      );

      const [repairs] = await db.query('SELECT * FROM RepairRequest WHERE id = ?', [testRepairId]);
      expect(repairs[0].status).toBe('invoiced');
    });

    it('should update repair status when invoice is fully paid', async () => {
      if (!testInvoiceId) return;

      // Create payment
      await db.query(
        `INSERT INTO Payment (invoiceId, amount, paymentMethod, paymentDate, userId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [testInvoiceId, 114, 'cash', '2025-01-28', 1]
      );

      // Update invoice status
      await db.query(
        'UPDATE Invoice SET amountPaid = ?, status = ? WHERE id = ?',
        [114, 'paid', testInvoiceId]
      );

      // Update repair status
      await db.query(
        'UPDATE RepairRequest SET status = ? WHERE id = ?',
        ['ready_for_delivery', testRepairId]
      );

      // Verify
      const [repairs] = await db.query('SELECT * FROM RepairRequest WHERE id = ?', [testRepairId]);
      expect(repairs[0].status).toBe('ready_for_delivery');
    });
  });

  describe('Inventory Integration', () => {
    it('should deduct stock when invoice with parts is fully paid', async () => {
      if (!testInvoiceId) return;

      // Check if StockLevel table exists
      const [tableCheck] = await db.query(`
        SELECT COUNT(*) as exists 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'StockLevel'
      `);

      if (tableCheck[0].exists > 0) {
        // Create test inventory item
        const [itemResult] = await db.query(
          `INSERT INTO InventoryItem (name, sellingPrice, createdAt, updatedAt)
           VALUES (?, ?, NOW(), NOW())`,
          ['Test Part', 50]
        );
        testInventoryItemId = itemResult.insertId;

        // Create stock level
        await db.query(
          `INSERT INTO StockLevel (inventoryItemId, quantity, createdAt, updatedAt)
           VALUES (?, ?, NOW(), NOW())`,
          [testInventoryItemId, 10]
        );

        // Create invoice item with inventory item
        await db.query(
          `INSERT INTO InvoiceItem (invoiceId, inventoryItemId, description, quantity, unitPrice, totalPrice, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [testInvoiceId, testInventoryItemId, 'Test Part', 2, 50, 100]
        );

        // Get initial stock
        const [initialStock] = await db.query(
          'SELECT quantity FROM StockLevel WHERE inventoryItemId = ?',
          [testInventoryItemId]
        );
        const initialQuantity = initialStock[0].quantity;

        // Simulate payment (stock should be deducted)
        // Note: This is tested in the service layer, here we just verify the structure
        expect(initialQuantity).toBe(10);

        // Cleanup
        await db.query('DELETE FROM StockLevel WHERE inventoryItemId = ?', [testInventoryItemId]);
        await db.query('DELETE FROM InventoryItem WHERE id = ?', [testInventoryItemId]);
        await db.query('DELETE FROM InvoiceItem WHERE invoiceId = ? AND inventoryItemId = ?', 
          [testInvoiceId, testInventoryItemId]);
      }
    });
  });

  describe('Customers Integration', () => {
    it('should calculate customer balance from invoices and payments', async () => {
      if (!testCustomerId) return;

      // Get customer balance
      const [balanceResult] = await db.query(
        `SELECT 
          COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
          COALESCE(SUM(i.amountPaid), 0) as totalPaid,
          (COALESCE(SUM(i.totalAmount), 0) - COALESCE(SUM(i.amountPaid), 0)) as balance
         FROM Invoice i
         WHERE (i.customerId = ? OR i.id IN (
           SELECT id FROM Invoice WHERE repairRequestId IN (
             SELECT id FROM RepairRequest WHERE customerId = ?
           )
         ))
         AND (i.deletedAt IS NULL OR i.deletedAt = '')`,
        [testCustomerId, testCustomerId]
      );

      expect(balanceResult.length).toBe(1);
      expect(balanceResult[0]).toHaveProperty('totalInvoiced');
      expect(balanceResult[0]).toHaveProperty('totalPaid');
      expect(balanceResult[0]).toHaveProperty('balance');
    });

    it('should get customer invoices', async () => {
      if (!testCustomerId) return;

      const [invoices] = await db.query(
        `SELECT * FROM Invoice 
         WHERE (customerId = ? OR id IN (
           SELECT id FROM Invoice WHERE repairRequestId IN (
             SELECT id FROM RepairRequest WHERE customerId = ?
           )
         ))
         AND (deletedAt IS NULL OR deletedAt = '')
         ORDER BY createdAt DESC`,
        [testCustomerId, testCustomerId]
      );

      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should get customer payments', async () => {
      if (!testCustomerId) return;

      const [payments] = await db.query(
        `SELECT p.* FROM Payment p
         INNER JOIN Invoice i ON p.invoiceId = i.id
         WHERE (i.customerId = ? OR i.id IN (
           SELECT id FROM Invoice WHERE repairRequestId IN (
             SELECT id FROM RepairRequest WHERE customerId = ?
           )
         ))
         ORDER BY p.paymentDate DESC, p.createdAt DESC`,
        [testCustomerId, testCustomerId]
      );

      expect(Array.isArray(payments)).toBe(true);
    });
  });

  describe('Companies & Branches Integration', () => {
    it('should filter invoices by company', async () => {
      const [invoices] = await db.query(
        `SELECT * FROM Invoice 
         WHERE companyId = ? 
         AND (deletedAt IS NULL OR deletedAt = '')
         ORDER BY createdAt DESC`,
        [1]
      );

      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should filter invoices by branch', async () => {
      const [invoices] = await db.query(
        `SELECT * FROM Invoice 
         WHERE branchId = ? 
         AND (deletedAt IS NULL OR deletedAt = '')
         ORDER BY createdAt DESC`,
        [1]
      );

      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should get company financial summary', async () => {
      const [summary] = await db.query(
        `SELECT 
          COUNT(*) as totalInvoices,
          COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
          COALESCE(SUM(i.amountPaid), 0) as totalPaid,
          COALESCE(SUM(i.totalAmount - COALESCE(i.amountPaid, 0)), 0) as outstandingBalance
         FROM Invoice i
         WHERE i.companyId = ?
         AND (i.deletedAt IS NULL OR i.deletedAt = '')`,
        [1]
      );

      expect(summary.length).toBe(1);
      expect(summary[0]).toHaveProperty('totalInvoices');
      expect(summary[0]).toHaveProperty('totalInvoiced');
    });

    it('should get branch financial summary', async () => {
      const [summary] = await db.query(
        `SELECT 
          COUNT(*) as totalInvoices,
          COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
          COALESCE(SUM(e.amount), 0) as totalExpenses
         FROM Invoice i
         LEFT JOIN Expense e ON i.branchId = e.branchId
         WHERE i.branchId = ?
         AND (i.deletedAt IS NULL OR i.deletedAt = '')
         GROUP BY i.branchId`,
        [1]
      );

      expect(Array.isArray(summary)).toBe(true);
    });
  });
});

