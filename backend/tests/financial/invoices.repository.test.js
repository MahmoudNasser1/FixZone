// Invoices Repository Unit Tests
// Tests for invoices.repository.js

const invoicesRepository = require('../../repositories/financial/invoices.repository');
const db = require('../../db');

// Mock dependencies
jest.mock('../../db');

describe('Invoices Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all invoices with filters and pagination', async () => {
      const mockInvoices = [
        { id: 1, totalAmount: 100, status: 'pending', customerName: 'Customer 1' },
        { id: 2, totalAmount: 200, status: 'paid', customerName: 'Customer 2' }
      ];
      const mockCount = [{ total: 2 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockInvoices]);

      const filters = { status: 'pending' };
      const pagination = { page: 1, limit: 50 };
      const result = await invoicesRepository.findAll(filters, pagination);

      expect(result.data).toEqual(mockInvoices);
      expect(result.pagination.total).toBe(2);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should filter by repairRequestId', async () => {
      const mockInvoices = [{ id: 1, repairRequestId: 1 }];
      const mockCount = [{ total: 1 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockInvoices]);

      const filters = { repairRequestId: 1 };
      await invoicesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.repairRequestId = ?'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by customerId', async () => {
      const mockInvoices = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockInvoices]);

      const filters = { customerId: 1 };
      await invoicesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('(i.customerId = ? OR rr.customerId = ?)'),
        expect.arrayContaining([1, 1])
      );
    });

    it('should filter by companyId', async () => {
      const mockInvoices = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockInvoices]);

      const filters = { companyId: 1 };
      await invoicesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.companyId = ?'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by branchId', async () => {
      const mockInvoices = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockInvoices]);

      const filters = { branchId: 1 };
      await invoicesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.branchId = ?'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by status', async () => {
      const mockInvoices = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockInvoices]);

      const filters = { status: 'paid' };
      await invoicesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.status = ?'),
        expect.arrayContaining(['paid'])
      );
    });

    it('should filter by paymentStatus (overdue)', async () => {
      const mockInvoices = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockInvoices]);

      const filters = { paymentStatus: 'overdue' };
      await invoicesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.dueDate IS NOT NULL AND i.dueDate < CURDATE()'),
        expect.arrayContaining(['paid'])
      );
    });
  });

  describe('findById', () => {
    it('should return invoice by ID', async () => {
      const mockInvoice = { id: 1, totalAmount: 100, status: 'pending' };
      db.query.mockResolvedValue([[mockInvoice]]);

      const result = await invoicesRepository.findById(1);

      expect(result).toEqual(mockInvoice);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [1]
      );
    });

    it('should return null if invoice not found', async () => {
      db.query.mockResolvedValue([[]]);

      const result = await invoicesRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new invoice', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        customerId: 1,
        totalAmount: 114,
        status: 'draft',
        createdBy: 1
      };
      const mockResult = { insertId: 1 };

      db.query.mockResolvedValue([mockResult]);

      const result = await invoicesRepository.create(invoiceData);

      expect(result.id).toBe(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Invoice'),
        expect.arrayContaining(['INV-001', 1, 114])
      );
    });
  });

  describe('update', () => {
    it('should update an existing invoice', async () => {
      const updateData = { status: 'paid' };
      const mockResult = { affectedRows: 1 };

      db.query.mockResolvedValue([mockResult]);

      const result = await invoicesRepository.update(1, updateData);

      expect(result).toBeDefined();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Invoice'),
        expect.arrayContaining([1])
      );
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate a unique invoice number', async () => {
      const mockResult = [{ count: 0 }];
      db.query.mockResolvedValue([mockResult]);

      const result = await invoicesRepository.generateInvoiceNumber();

      expect(result).toMatch(/^INV-\d{8}-\d+$/);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return invoice statistics', async () => {
      const mockStats = [{
        total: 10000,
        count: 100,
        average: 100,
        paid: 50,
        pending: 30,
        overdue: 20
      }];

      db.query.mockResolvedValue([mockStats]);

      const result = await invoicesRepository.getStats();

      expect(result.total).toBe(10000);
      expect(result.count).toBe(100);
      expect(result.paid).toBe(50);
      expect(result.pending).toBe(30);
      expect(result.overdue).toBe(20);
    });
  });

  describe('getOverdue', () => {
    it('should return overdue invoices', async () => {
      const mockOverdue = [
        { id: 1, totalAmount: 100, dueDate: '2025-01-01' },
        { id: 2, totalAmount: 200, dueDate: '2025-01-15' }
      ];

      db.query.mockResolvedValue([mockOverdue]);

      const result = await invoicesRepository.getOverdue();

      expect(result).toEqual(mockOverdue);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('i.dueDate IS NOT NULL AND i.dueDate < CURDATE()'),
        expect.any(Array)
      );
    });
  });
});

