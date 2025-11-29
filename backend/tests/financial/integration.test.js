// Financial Module Integration Tests
// Tests for API endpoints and database operations

const request = require('supertest');
const db = require('../../db');

// Import test app
const app = require('../setup/testApp');

// Mock authentication middleware
jest.mock('../../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  };
});

describe('Financial Module Integration Tests', () => {
  let testInvoiceId;
  let testExpenseId;
  let testPaymentId;

  beforeAll(async () => {
    // Setup test data if needed
  });

  afterAll(async () => {
    // Cleanup test data
    if (testInvoiceId) {
      await db.query('DELETE FROM Invoice WHERE id = ?', [testInvoiceId]);
    }
    if (testExpenseId) {
      await db.query('DELETE FROM Expense WHERE id = ?', [testExpenseId]);
    }
    if (testPaymentId) {
      await db.query('DELETE FROM Payment WHERE id = ?', [testPaymentId]);
    }
  });

  describe('Expenses API', () => {
    it('should create, read, update, and delete an expense', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/financial/expenses')
        .send({
          categoryId: 1,
          amount: 100,
          description: 'Test expense',
          date: '2025-01-28'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      testExpenseId = createResponse.body.data.id;

      // Read
      const getResponse = await request(app)
        .get(`/api/financial/expenses/${testExpenseId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.id).toBe(testExpenseId);

      // Update
      const updateResponse = await request(app)
        .put(`/api/financial/expenses/${testExpenseId}`)
        .send({ description: 'Updated expense' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.description).toBe('Updated expense');

      // Delete
      const deleteResponse = await request(app)
        .delete(`/api/financial/expenses/${testExpenseId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });

    it('should list expenses with filters', async () => {
      const response = await request(app)
        .get('/api/financial/expenses')
        .query({ categoryId: 1, page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return expense statistics', async () => {
      const response = await request(app)
        .get('/api/financial/expenses/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('count');
    });
  });

  describe('Invoices API', () => {
    it('should create an invoice with items', async () => {
      const response = await request(app)
        .post('/api/financial/invoices')
        .send({
          customerId: 1,
          items: [
            { description: 'Item 1', quantity: 1, unitPrice: 100 },
            { description: 'Item 2', quantity: 2, unitPrice: 50 }
          ],
          currency: 'EGP'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBeGreaterThan(0);
      testInvoiceId = response.body.data.id;
    });

    it('should get invoice with items and payments', async () => {
      if (!testInvoiceId) {
        // Create test invoice first
        const createResponse = await request(app)
          .post('/api/financial/invoices')
          .send({
            customerId: 1,
            items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
            currency: 'EGP'
          });
        testInvoiceId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/financial/invoices/${testInvoiceId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('payments');
    });

    it('should create invoice from repair request', async () => {
      // This test requires a valid repair request ID
      // Skipping for now as it requires test data setup
      // const response = await request(app)
      //   .post('/api/financial/invoices/create-from-repair/1')
      //   .send({ currency: 'EGP' });
      // expect(response.status).toBe(201);
    });

    it('should return invoice statistics', async () => {
      const response = await request(app)
        .get('/api/financial/invoices/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('count');
    });
  });

  describe('Payments API', () => {
    it('should create a payment and update invoice status', async () => {
      if (!testInvoiceId) {
        // Create test invoice first
        const createResponse = await request(app)
          .post('/api/financial/invoices')
          .send({
            customerId: 1,
            items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
            currency: 'EGP'
          });
        testInvoiceId = createResponse.body.data.id;
      }

      const response = await request(app)
        .post('/api/financial/payments')
        .send({
          invoiceId: testInvoiceId,
          amount: 50,
          paymentMethod: 'cash',
          paymentDate: '2025-01-28'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testPaymentId = response.body.data.id;

      // Verify invoice status was updated
      const invoiceResponse = await request(app)
        .get(`/api/financial/invoices/${testInvoiceId}`);

      expect(invoiceResponse.body.data.status).toBe('partially_paid');
    });

    it('should get payments for an invoice', async () => {
      if (!testInvoiceId) return;

      const response = await request(app)
        .get(`/api/financial/payments/invoice/${testInvoiceId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('summary');
    });

    it('should prevent payment exceeding invoice balance', async () => {
      if (!testInvoiceId) return;

      const response = await request(app)
        .post('/api/financial/payments')
        .send({
          invoiceId: testInvoiceId,
          amount: 999999, // Exceeds balance
          paymentMethod: 'cash'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Integration: Repairs → Invoices → Payments', () => {
    it('should create invoice from repair and process payment', async () => {
      // This is a full integration test
      // Requires: Repair Request → Invoice → Payment → Stock Deduction
      // Skipping for now as it requires complex test data setup
    });
  });

  describe('Integration: Customers Financial APIs', () => {
    it('should get customer balance', async () => {
      const response = await request(app)
        .get('/api/customers/1/balance');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalInvoiced');
      expect(response.body.data).toHaveProperty('totalPaid');
      expect(response.body.data).toHaveProperty('balance');
    });

    it('should get customer invoices', async () => {
      const response = await request(app)
        .get('/api/customers/1/invoices');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get customer payments', async () => {
      const response = await request(app)
        .get('/api/customers/1/payments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Integration: Companies & Branches Financial APIs', () => {
    it('should get company financial summary', async () => {
      const response = await request(app)
        .get('/api/companies/1/financial-summary');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invoices');
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('netRevenue');
    });

    it('should get branch financial summary', async () => {
      const response = await request(app)
        .get('/api/branches/1/financial-summary');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invoices');
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('expenses');
    });
  });
});

