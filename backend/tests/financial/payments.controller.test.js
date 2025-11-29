// Payments Controller Unit Tests
// Tests for payments.controller.js

const paymentsController = require('../../controllers/financial/payments.controller');
const paymentsService = require('../../services/financial/payments.service');

// Mock dependencies
jest.mock('../../services/financial/payments.service');

describe('Payments Controller', () => {
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
    it('should return all payments with pagination', async () => {
      const mockResult = {
        data: [{ id: 1, amount: 100, invoiceId: 1 }],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
      };

      paymentsService.getAll.mockResolvedValue(mockResult);

      await paymentsController.getAll(req, res);

      expect(paymentsService.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payments retrieved successfully',
        data: mockResult.data,
        pagination: mockResult.pagination
      });
    });
  });

  describe('getById', () => {
    it('should return payment by ID', async () => {
      const mockPayment = { id: 1, amount: 100, invoiceId: 1 };
      req.params.id = '1';

      paymentsService.getById.mockResolvedValue(mockPayment);

      await paymentsController.getById(req, res);

      expect(paymentsService.getById).toHaveBeenCalledWith(1, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment retrieved successfully',
        data: mockPayment
      });
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 100,
        paymentMethod: 'cash',
        paymentDate: '2025-01-28'
      };
      const mockPayment = { id: 1, ...paymentData };
      req.body = paymentData;

      paymentsService.create.mockResolvedValue(mockPayment);

      await paymentsController.create(req, res);

      expect(paymentsService.create).toHaveBeenCalledWith(paymentData, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment created successfully',
        data: mockPayment
      });
    });

    it('should handle validation errors', async () => {
      req.body = { amount: 100 }; // Missing invoiceId
      paymentsService.create.mockRejectedValue(new Error('Invoice not found'));

      await paymentsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle amount exceeds balance error', async () => {
      req.body = {
        invoiceId: 1,
        amount: 1000 // Exceeds balance
      };
      paymentsService.create.mockRejectedValue(
        new Error('Payment amount exceeds remaining balance')
      );

      await paymentsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getByInvoice', () => {
    it('should return payments for an invoice', async () => {
      const mockResult = {
        payments: [{ id: 1, amount: 100 }],
        summary: { totalPaid: 100, totalAmount: 200, remaining: 100 }
      };
      req.params.invoiceId = '1';

      paymentsService.getByInvoice.mockResolvedValue(mockResult);

      await paymentsController.getByInvoice(req, res);

      expect(paymentsService.getByInvoice).toHaveBeenCalledWith(1, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payments retrieved successfully',
        data: mockResult
      });
    });
  });

  describe('getStats', () => {
    it('should return payment statistics', async () => {
      const mockStats = {
        total: 5000,
        count: 50,
        average: 100
      };

      paymentsService.getStats.mockResolvedValue(mockStats);

      await paymentsController.getStats(req, res);

      expect(paymentsService.getStats).toHaveBeenCalledWith({}, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: mockStats
      });
    });
  });
});

