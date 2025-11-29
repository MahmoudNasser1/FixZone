// Invoices Service Unit Tests
// Tests for invoices.service.js

const { expect } = require('chai');
const sinon = require('sinon');
const invoicesService = require('../../services/financial/invoices.service');
const invoicesRepository = require('../../repositories/financial/invoices.repository');
const paymentsRepository = require('../../repositories/financial/payments.repository');
const db = require('../../db');

describe('Invoices Service', () => {
  let sandbox;
  let connection;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    connection = {
      query: sandbox.stub(),
      beginTransaction: sandbox.stub().resolves(),
      commit: sandbox.stub().resolves(),
      rollback: sandbox.stub().resolves(),
      release: sandbox.stub()
    };
    sandbox.stub(db, 'getConnection').resolves(connection);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getAll', () => {
    it('should return all invoices with filters and pagination', async () => {
      const mockInvoices = [
        { id: 1, totalAmount: 100, status: 'pending' },
        { id: 2, totalAmount: 200, status: 'paid' }
      ];
      const mockResult = {
        data: mockInvoices,
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 }
      };

      invoicesRepository.findAll.mockResolvedValue(mockResult);

      const filters = { status: 'pending' };
      const pagination = { page: 1, limit: 50 };
      const result = await invoicesService.getAll(filters, pagination);

      expect(result).toEqual(mockResult);
      expect(invoicesRepository.findAll).toHaveBeenCalledWith(filters, pagination);
    });
  });

  describe('getById', () => {
    it('should return invoice by ID with items and payments', async () => {
      const mockInvoice = { id: 1, totalAmount: 100, status: 'pending' };
      const mockItems = [
        { id: 1, description: 'Item 1', quantity: 1, unitPrice: 100 }
      ];
      const mockPayments = [
        { id: 1, amount: 50, invoiceId: 1 }
      ];

      invoicesRepository.findById.mockResolvedValue(mockInvoice);
      connection.query.mockResolvedValue([mockItems]);
      paymentsRepository.findByInvoice.mockResolvedValue(mockPayments);

      const result = await invoicesService.getById(1);

      expect(result.id).toBe(1);
      expect(result.items).toEqual(mockItems);
      expect(result.payments).toEqual(mockPayments);
    });

    it('should throw error if invoice not found', async () => {
      invoicesRepository.findById.mockResolvedValue(null);

      await expect(invoicesService.getById(999)).rejects.toThrow('Invoice not found');
    });
  });

  describe('create', () => {
    it('should create a new invoice with items', async () => {
      const invoiceData = {
        customerId: 1,
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100 }
        ],
        currency: 'EGP'
      };
      const mockInvoice = { id: 1, ...invoiceData, totalAmount: 114 };
      const mockUser = { id: 1 };

      invoicesRepository.generateInvoiceNumber.mockResolvedValue('INV-001');
      invoicesRepository.create.mockResolvedValue(mockInvoice);
      connection.query.mockResolvedValue([{ insertId: 1 }]);

      const result = await invoicesService.create(invoiceData, mockUser);

      expect(result).toBeDefined();
      expect(connection.commit).toHaveBeenCalled();
    });

    it('should calculate totals correctly', () => {
      const items = [
        { quantity: 2, unitPrice: 50 },
        { quantity: 1, unitPrice: 100 }
      ];

      const totals = invoicesService.calculateTotals(items);

      expect(totals.subtotal).toBe(200);
      expect(totals.taxAmount).toBe(28); // 14% of 200
      expect(totals.totalAmount).toBe(228);
    });
  });

  describe('createFromRepair', () => {
    it('should create invoice from repair request', async () => {
      const repairId = 1;
      const mockRepair = {
        id: 1,
        customerId: 1,
        laborCost: 50
      };
      const mockItems = [
        { description: 'Service', quantity: 1, unitPrice: 100 }
      ];
      const mockInvoice = { id: 1, repairRequestId: repairId, totalAmount: 114 };
      const mockUser = { id: 1 };

      connection.query
        .mockResolvedValueOnce([[mockRepair]]) // Get repair
        .mockResolvedValueOnce([[]]) // Get services
        .mockResolvedValueOnce([[]]) // Get parts
        .mockResolvedValueOnce([{ insertId: 1 }]) // Create invoice items
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Update repair status

      invoicesRepository.generateInvoiceNumber.mockResolvedValue('INV-001');
      invoicesRepository.create.mockResolvedValue(mockInvoice);
      jest.spyOn(invoicesService, 'generateItemsFromRepair').mockResolvedValue(mockItems);
      jest.spyOn(invoicesService, 'create').mockResolvedValue(mockInvoice);

      const result = await invoicesService.createFromRepair(repairId, {}, mockUser);

      expect(result).toBeDefined();
    });

    it('should throw error if repair request not found', async () => {
      connection.query.mockResolvedValue([[]]); // Empty repair result
      const mockUser = { id: 1 };

      await expect(invoicesService.createFromRepair(999, {}, mockUser)).rejects.toThrow('Repair request not found');
    });
  });

  describe('generateItemsFromRepair', () => {
    it('should generate items from repair services and parts', async () => {
      const mockRepair = { id: 1, laborCost: 50 };
      const mockServices = [
        { serviceId: 1, serviceName: 'Service 1', finalPrice: 100 }
      ];
      const mockParts = [
        { inventoryItemId: 1, inventoryItemName: 'Part 1', unitSellingPrice: 50, quantity: 2 }
      ];

      connection.query
        .mockResolvedValueOnce([mockServices])
        .mockResolvedValueOnce([mockParts]);

      const items = await invoicesService.generateItemsFromRepair(mockRepair);

      expect(items.length).toBeGreaterThan(0);
      expect(items.some(item => item.description.includes('Service'))).toBe(true);
      expect(items.some(item => item.description.includes('Part'))).toBe(true);
      expect(items.some(item => item.description.includes('تكلفة العمالة'))).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return invoice statistics', async () => {
      const mockStats = {
        total: 10000,
        count: 100,
        average: 100,
        byStatus: {}
      };

      invoicesRepository.getStats.mockResolvedValue(mockStats);

      const result = await invoicesService.getStats();

      expect(result).toEqual(mockStats);
      expect(invoicesRepository.getStats).toHaveBeenCalled();
    });
  });

  describe('getOverdue', () => {
    it('should return overdue invoices', async () => {
      const mockOverdue = [
        { id: 1, totalAmount: 100, dueDate: '2025-01-01' }
      ];

      invoicesRepository.getOverdue.mockResolvedValue(mockOverdue);

      const result = await invoicesService.getOverdue();

      expect(result).toEqual(mockOverdue);
      expect(invoicesRepository.getOverdue).toHaveBeenCalled();
    });
  });
});

