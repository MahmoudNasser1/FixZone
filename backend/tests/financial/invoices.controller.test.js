// Invoices Controller Unit Tests
// Tests for invoices.controller.js

const invoicesController = require('../../controllers/financial/invoices.controller');
const invoicesService = require('../../services/financial/invoices.service');

// Mock dependencies
jest.mock('../../services/financial/invoices.service');

describe('Invoices Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 1 }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getAll', () => {
    it('should return all invoices with pagination', async () => {
      const mockResult = {
        data: [{ id: 1, totalAmount: 100, status: 'pending' }],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
      };

      invoicesService.getAll.mockResolvedValue(mockResult);

      await invoicesController.getAll(req, res);

      expect(invoicesService.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invoices retrieved successfully',
        data: mockResult.data,
        pagination: mockResult.pagination
      });
    });
  });

  describe('getById', () => {
    it('should return invoice by ID with items and payments', async () => {
      const mockInvoice = {
        id: 1,
        totalAmount: 100,
        items: [{ id: 1, description: 'Item 1' }],
        payments: [{ id: 1, amount: 50 }]
      };
      req.params.id = '1';

      invoicesService.getById.mockResolvedValue(mockInvoice);

      await invoicesController.getById(req, res);

      expect(invoicesService.getById).toHaveBeenCalledWith(1, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice retrieved successfully',
        data: mockInvoice
      });
    });
  });

  describe('create', () => {
    it('should create a new invoice', async () => {
      const invoiceData = {
        customerId: 1,
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
        currency: 'EGP'
      };
      const mockInvoice = { id: 1, ...invoiceData, totalAmount: 114 };
      req.body = invoiceData;

      invoicesService.create.mockResolvedValue(mockInvoice);

      await invoicesController.create(req, res);

      expect(invoicesService.create).toHaveBeenCalledWith(invoiceData, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice created successfully',
        data: mockInvoice
      });
    });
  });

  describe('createFromRepair', () => {
    it('should create invoice from repair request', async () => {
      const invoiceData = { currency: 'EGP' };
      const mockInvoice = { id: 1, repairRequestId: 1, totalAmount: 114 };
      req.params.repairId = '1';
      req.body = invoiceData;

      invoicesService.createFromRepair.mockResolvedValue(mockInvoice);

      await invoicesController.createFromRepair(req, res);

      expect(invoicesService.createFromRepair).toHaveBeenCalledWith(1, invoiceData, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice created from repair successfully',
        data: mockInvoice
      });
    });

    it('should handle repair not found error', async () => {
      req.params.repairId = '999';
      invoicesService.createFromRepair.mockRejectedValue(
        new Error('Repair request not found')
      );

      await invoicesController.createFromRepair(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getByRepair', () => {
    it('should return invoice by repair ID', async () => {
      const mockInvoice = { id: 1, repairRequestId: 1 };
      req.params.repairId = '1';

      invoicesService.getAll.mockResolvedValue({
        data: [mockInvoice],
        pagination: { total: 1 }
      });

      await invoicesController.getByRepair(req, res);

      expect(invoicesService.getAll).toHaveBeenCalledWith(
        { repairRequestId: 1 },
        { page: 1, limit: 1 },
        req.user
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice retrieved successfully',
        data: mockInvoice
      });
    });

    it('should return 404 if invoice not found for repair', async () => {
      req.params.repairId = '999';
      invoicesService.getAll.mockResolvedValue({
        data: [],
        pagination: { total: 0 }
      });

      await invoicesController.getByRepair(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invoice not found for this repair request'
      });
    });
  });

  describe('getStats', () => {
    it('should return invoice statistics', async () => {
      const mockStats = {
        total: 10000,
        count: 100,
        average: 100,
        paid: 50,
        pending: 30,
        overdue: 20
      };

      invoicesService.getStats.mockResolvedValue(mockStats);

      await invoicesController.getStats(req, res);

      expect(invoicesService.getStats).toHaveBeenCalledWith({}, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice statistics retrieved successfully',
        data: mockStats
      });
    });
  });

  describe('getOverdue', () => {
    it('should return overdue invoices', async () => {
      const mockOverdue = [
        { id: 1, totalAmount: 100, dueDate: '2025-01-01' }
      ];

      invoicesService.getOverdue.mockResolvedValue(mockOverdue);

      await invoicesController.getOverdue(req, res);

      expect(invoicesService.getOverdue).toHaveBeenCalledWith(req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Overdue invoices retrieved successfully',
        data: mockOverdue
      });
    });
  });
});

