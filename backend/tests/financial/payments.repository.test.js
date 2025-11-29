// Payments Repository Unit Tests
// Tests for payments.repository.js

const paymentsRepository = require('../../repositories/financial/payments.repository');
const db = require('../../db');

// Mock dependencies
jest.mock('../../db');

describe('Payments Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all payments with filters and pagination', async () => {
      const mockPayments = [
        { id: 1, amount: 100, invoiceId: 1, invoiceNumber: 'INV-001' },
        { id: 2, amount: 200, invoiceId: 2, invoiceNumber: 'INV-002' }
      ];
      const mockCount = [{ total: 2 }];

      // Mock column check for deletedAt
      db.query
        .mockResolvedValueOnce([[{ exists: 0 }]]) // Column check
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockPayments]);

      const filters = { invoiceId: 1 };
      const pagination = { page: 1, limit: 50 };
      const result = await paymentsRepository.findAll(filters, pagination);

      expect(result.data).toEqual(mockPayments);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by invoiceId', async () => {
      const mockPayments = [{ id: 1, invoiceId: 1 }];
      const mockCount = [{ total: 1 }];

      db.query
        .mockResolvedValueOnce([[{ exists: 0 }]])
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockPayments]);

      const filters = { invoiceId: 1 };
      await paymentsRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('p.invoiceId = ?'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by companyId', async () => {
      const mockPayments = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce([[{ exists: 0 }]])
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockPayments]);

      const filters = { companyId: 1 };
      await paymentsRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.companyId = ?'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by branchId', async () => {
      const mockPayments = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce([[{ exists: 0 }]])
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockPayments]);

      const filters = { branchId: 1 };
      await paymentsRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.branchId = ?'),
        expect.arrayContaining([1])
      );
    });
  });

  describe('findById', () => {
    it('should return payment by ID', async () => {
      const mockPayment = { id: 1, amount: 100, invoiceId: 1 };
      db.query.mockResolvedValue([[mockPayment]]);

      const result = await paymentsRepository.findById(1);

      expect(result).toEqual(mockPayment);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [1]
      );
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 100,
        paymentMethod: 'cash',
        paymentDate: '2025-01-28',
        userId: 1
      };
      const mockResult = { insertId: 1 };

      db.query.mockResolvedValue([mockResult]);

      const result = await paymentsRepository.create(paymentData);

      expect(result.id).toBe(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Payment'),
        expect.arrayContaining([1, 100, 'cash'])
      );
    });
  });

  describe('findByInvoice', () => {
    it('should return payments for an invoice', async () => {
      const mockPayments = [
        { id: 1, amount: 100, invoiceId: 1 },
        { id: 2, amount: 50, invoiceId: 1 }
      ];

      db.query.mockResolvedValue([mockPayments]);

      const result = await paymentsRepository.findByInvoice(1);

      expect(result).toEqual(mockPayments);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE invoiceId = ?'),
        [1]
      );
    });
  });

  describe('getTotalPaid', () => {
    it('should return total paid amount for an invoice', async () => {
      const mockResult = [{ total: 150 }];
      db.query.mockResolvedValue([mockResult]);

      const result = await paymentsRepository.getTotalPaid(1);

      expect(result).toBe(150);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SUM(amount)'),
        [1]
      );
    });

    it('should return 0 if no payments found', async () => {
      const mockResult = [{ total: null }];
      db.query.mockResolvedValue([mockResult]);

      const result = await paymentsRepository.getTotalPaid(1);

      expect(result).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return payment statistics', async () => {
      const mockStats = [{
        total: 5000,
        count: 50,
        average: 100
      }];

      db.query.mockResolvedValue([mockStats]);

      const result = await paymentsRepository.getStats();

      expect(result.total).toBe(5000);
      expect(result.count).toBe(50);
      expect(result.average).toBe(100);
    });
  });
});

