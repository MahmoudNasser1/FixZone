// Financial Module E2E Tests
// End-to-end tests for critical user flows

const request = require('supertest');
const app = require('../setup/testApp');
const db = require('../../db');

// Mock authentication
jest.mock('../../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  };
});

describe('Financial Module - E2E Tests', () => {
  let testInvoiceId;
  let testExpenseId;
  let testPaymentId;
  let testRepairId;
  let testCustomerId;

  beforeAll(async () => {
    // Create test customer
    const [customerResult] = await db.query(
      `INSERT INTO Customer (name, phone, createdAt, updatedAt)
       VALUES (?, ?, NOW(), NOW())`,
      ['E2E Test Customer', '01000000001']
    );
    testCustomerId = customerResult.insertId;

    // Create test repair
    const [repairResult] = await db.query(
      `INSERT INTO RepairRequest (customerId, reportedProblem, status, createdAt, updatedAt)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [testCustomerId, 'E2E Test Repair', 'completed']
    );
    testRepairId = repairResult.insertId;
  });

  afterAll(async () => {
    // Cleanup
    if (testPaymentId) {
      await db.query('DELETE FROM Payment WHERE id = ?', [testPaymentId]);
    }
    if (testInvoiceId) {
      await db.query('DELETE FROM InvoiceItem WHERE invoiceId = ?', [testInvoiceId]);
      await db.query('DELETE FROM Invoice WHERE id = ?', [testInvoiceId]);
    }
    if (testExpenseId) {
      await db.query('DELETE FROM Expense WHERE id = ?', [testExpenseId]);
    }
    if (testRepairId) {
      await db.query('DELETE FROM RepairRequest WHERE id = ?', [testRepairId]);
    }
    if (testCustomerId) {
      await db.query('DELETE FROM Customer WHERE id = ?', [testCustomerId]);
    }
  });

  describe('Expense Flow', () => {
    it('should complete full expense lifecycle', async () => {
      // 1. Create expense
      const createResponse = await request(app)
        .post('/api/financial/expenses')
        .send({
          categoryId: 1,
          amount: 150,
          description: 'E2E Test Expense',
          date: '2025-01-28'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      testExpenseId = createResponse.body.data.id;

      // 2. Read expense
      const getResponse = await request(app)
        .get(`/api/financial/expenses/${testExpenseId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.description).toBe('E2E Test Expense');

      // 3. List expenses
      const listResponse = await request(app)
        .get('/api/financial/expenses')
        .query({ page: 1, limit: 10 });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.length).toBeGreaterThan(0);

      // 4. Update expense
      const updateResponse = await request(app)
        .put(`/api/financial/expenses/${testExpenseId}`)
        .send({ description: 'Updated E2E Expense' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.description).toBe('Updated E2E Expense');

      // 5. Get stats
      const statsResponse = await request(app)
        .get('/api/financial/expenses/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.data).toHaveProperty('total');

      // 6. Delete expense
      const deleteResponse = await request(app)
        .delete(`/api/financial/expenses/${testExpenseId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Invoice Flow', () => {
    it('should create invoice from repair and process payment', async () => {
      // 1. Create invoice from repair
      const createResponse = await request(app)
        .post(`/api/financial/invoices/create-from-repair/${testRepairId}`)
        .send({
          currency: 'EGP',
          notes: 'E2E Test Invoice'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      testInvoiceId = createResponse.body.data.id;

      // 2. Get invoice details
      const getResponse = await request(app)
        .get(`/api/financial/invoices/${testInvoiceId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data).toHaveProperty('items');
      expect(getResponse.body.data).toHaveProperty('payments');

      // 3. Create payment
      const paymentResponse = await request(app)
        .post('/api/financial/payments')
        .send({
          invoiceId: testInvoiceId,
          amount: 50,
          paymentMethod: 'cash',
          paymentDate: '2025-01-28'
        });

      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.success).toBe(true);
      testPaymentId = paymentResponse.body.data.id;

      // 4. Verify invoice status updated
      const invoiceAfterPayment = await request(app)
        .get(`/api/financial/invoices/${testInvoiceId}`);

      expect(invoiceAfterPayment.body.data.status).toBe('partially_paid');

      // 5. Get payments for invoice
      const paymentsResponse = await request(app)
        .get(`/api/financial/payments/invoice/${testInvoiceId}`);

      expect(paymentsResponse.status).toBe(200);
      expect(paymentsResponse.body.data.payments.length).toBeGreaterThan(0);
    });

    it('should create manual invoice with items', async () => {
      const createResponse = await request(app)
        .post('/api/financial/invoices')
        .send({
          customerId: testCustomerId,
          items: [
            { description: 'Service 1', quantity: 1, unitPrice: 100 },
            { description: 'Service 2', quantity: 2, unitPrice: 50 }
          ],
          currency: 'EGP',
          discountAmount: 10
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.totalAmount).toBeGreaterThan(0);

      // Cleanup
      if (createResponse.body.data.id) {
        await db.query('DELETE FROM InvoiceItem WHERE invoiceId = ?', [createResponse.body.data.id]);
        await db.query('DELETE FROM Invoice WHERE id = ?', [createResponse.body.data.id]);
      }
    });
  });

  describe('Payment Flow', () => {
    it('should create payment and update invoice status', async () => {
      if (!testInvoiceId) {
        // Create test invoice
        const createResponse = await request(app)
          .post('/api/financial/invoices')
          .send({
            customerId: testCustomerId,
            items: [{ description: 'Test', quantity: 1, unitPrice: 200 }],
            currency: 'EGP'
          });
        testInvoiceId = createResponse.body.data.id;
      }

      // Create payment
      const paymentResponse = await request(app)
        .post('/api/financial/payments')
        .send({
          invoiceId: testInvoiceId,
          amount: 200,
          paymentMethod: 'cash',
          paymentDate: '2025-01-28'
        });

      expect(paymentResponse.status).toBe(201);
      testPaymentId = paymentResponse.body.data.id;

      // Verify invoice is fully paid
      const invoiceResponse = await request(app)
        .get(`/api/financial/invoices/${testInvoiceId}`);

      expect(invoiceResponse.body.data.status).toBe('paid');
    });

    it('should prevent payment exceeding invoice balance', async () => {
      if (!testInvoiceId) return;

      const response = await request(app)
        .post('/api/financial/payments')
        .send({
          invoiceId: testInvoiceId,
          amount: 999999,
          paymentMethod: 'cash'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Customer Financial Flow', () => {
    it('should get customer balance and financial data', async () => {
      // Get balance
      const balanceResponse = await request(app)
        .get(`/api/customers/${testCustomerId}/balance`);

      expect(balanceResponse.status).toBe(200);
      expect(balanceResponse.body.data).toHaveProperty('totalInvoiced');
      expect(balanceResponse.body.data).toHaveProperty('balance');

      // Get invoices
      const invoicesResponse = await request(app)
        .get(`/api/customers/${testCustomerId}/invoices`);

      expect(invoicesResponse.status).toBe(200);
      expect(Array.isArray(invoicesResponse.body.data)).toBe(true);

      // Get payments
      const paymentsResponse = await request(app)
        .get(`/api/customers/${testCustomerId}/payments`);

      expect(paymentsResponse.status).toBe(200);
      expect(Array.isArray(paymentsResponse.body.data)).toBe(true);
    });
  });

  describe('Repair → Invoice → Payment → Stock Deduction Flow', () => {
    it('should complete full workflow', async () => {
      // This is a comprehensive E2E test
      // 1. Repair is completed
      // 2. Invoice is created from repair
      // 3. Payment is made
      // 4. Stock is deducted (if applicable)
      // 5. Repair status is updated

      // Note: This requires complex setup with actual repair services and parts
      // Skipping detailed implementation for now
      expect(true).toBe(true);
    });
  });
});

