// Financial Module Performance Tests
// Tests for load, query optimization, and response times

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

describe('Financial Module - Performance Tests', () => {
  describe('Response Time Tests', () => {
    it('should respond to GET /api/financial/expenses within 200ms', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/financial/expenses')
        .query({ page: 1, limit: 10 });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to GET /api/financial/invoices within 200ms', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/financial/invoices')
        .query({ page: 1, limit: 10 });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to GET /api/financial/payments within 200ms', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/financial/payments')
        .query({ page: 1, limit: 10 });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to GET /api/financial/expenses/stats within 200ms', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/financial/expenses/stats');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
    });
  });

  describe('Query Performance Tests', () => {
    it('should execute invoice stats query efficiently', async () => {
      const startTime = Date.now();
      
      const [result] = await db.query(
        `SELECT 
          COUNT(*) as totalInvoices,
          COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
          COALESCE(SUM(i.amountPaid), 0) as totalPaid,
          COALESCE(SUM(i.totalAmount - COALESCE(i.amountPaid, 0)), 0) as outstandingBalance
         FROM Invoice i
         WHERE (i.deletedAt IS NULL OR i.deletedAt = '')`
      );
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result.length).toBe(1);
      expect(queryTime).toBeLessThan(100); // Should be very fast
    });

    it('should execute payment summary query efficiently', async () => {
      const startTime = Date.now();
      
      const [result] = await db.query(
        `SELECT 
          COUNT(*) as totalPayments,
          COALESCE(SUM(p.amount), 0) as totalAmount,
          COUNT(DISTINCT p.invoiceId) as uniqueInvoices
         FROM Payment p
         INNER JOIN Invoice i ON p.invoiceId = i.id
         WHERE (i.deletedAt IS NULL OR i.deletedAt = '')`
      );
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result.length).toBe(1);
      expect(queryTime).toBeLessThan(100);
    });

    it('should execute expense stats query efficiently', async () => {
      const startTime = Date.now();
      
      const [result] = await db.query(
        `SELECT 
          COUNT(*) as totalExpenses,
          COALESCE(SUM(e.amount), 0) as totalAmount,
          AVG(e.amount) as averageAmount
         FROM Expense e
         WHERE (e.deletedAt IS NULL OR e.deletedAt = '')`
      );
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result.length).toBe(1);
      expect(queryTime).toBeLessThan(100);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle 10 concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/financial/expenses')
          .query({ page: 1, limit: 10 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (2 seconds for 10 requests)
      expect(totalTime).toBeLessThan(2000);
    });

    it('should handle 50 concurrent requests', async () => {
      const requests = Array(50).fill(null).map(() =>
        request(app)
          .get('/api/financial/invoices')
          .query({ page: 1, limit: 10 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (5 seconds for 50 requests)
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Database Index Tests', () => {
    it('should have indexes on Invoice table', async () => {
      const [indexes] = await db.query(
        `SHOW INDEXES FROM Invoice WHERE Key_name != 'PRIMARY'`
      );

      const indexNames = indexes.map(idx => idx.Key_name);
      
      // Check for important indexes
      expect(indexNames.some(name => name.includes('customerId'))).toBe(true);
      expect(indexNames.some(name => name.includes('status'))).toBe(true);
      expect(indexNames.some(name => name.includes('createdAt'))).toBe(true);
    });

    it('should have indexes on Payment table', async () => {
      const [indexes] = await db.query(
        `SHOW INDEXES FROM Payment WHERE Key_name != 'PRIMARY'`
      );

      const indexNames = indexes.map(idx => idx.Key_name);
      
      // Check for important indexes
      expect(indexNames.some(name => name.includes('invoiceId'))).toBe(true);
      expect(indexNames.some(name => name.includes('paymentDate'))).toBe(true);
    });

    it('should have indexes on Expense table', async () => {
      const [indexes] = await db.query(
        `SHOW INDEXES FROM Expense WHERE Key_name != 'PRIMARY'`
      );

      const indexNames = indexes.map(idx => idx.Key_name);
      
      // Check for important indexes
      expect(indexNames.some(name => name.includes('categoryId'))).toBe(true);
      expect(indexNames.some(name => name.includes('date'))).toBe(true);
    });
  });

  describe('Memory Leak Tests', () => {
    it('should not leak memory on repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/financial/expenses')
          .query({ page: 1, limit: 10 });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (< 50MB for 100 requests)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle large page numbers efficiently', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/financial/invoices')
        .query({ page: 100, limit: 10 });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300); // Should still be fast
    });

    it('should handle large limit values efficiently', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/financial/expenses')
        .query({ page: 1, limit: 100 });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300);
    });
  });
});

