// Payments Service Unit Tests
// Tests for payments.service.js

const { expect } = require('chai');
const sinon = require('sinon');
const paymentsService = require('../../services/financial/payments.service');
const paymentsRepository = require('../../repositories/financial/payments.repository');
const invoicesRepository = require('../../repositories/financial/invoices.repository');
const db = require('../../db');

describe('Payments Service', () => {
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
    it('should return all payments with filters and pagination', async () => {
      const mockPayments = [
        { id: 1, amount: 100, invoiceId: 1 },
        { id: 2, amount: 200, invoiceId: 2 }
      ];
      const mockResult = {
        data: mockPayments,
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 }
      };

      paymentsRepository.findAll.mockResolvedValue(mockResult);

      const filters = { invoiceId: 1 };
      const pagination = { page: 1, limit: 50 };
      const result = await paymentsService.getAll(filters, pagination);

      expect(result).toEqual(mockResult);
      expect(paymentsRepository.findAll).toHaveBeenCalledWith(filters, pagination);
    });
  });

  describe('getById', () => {
    it('should return payment by ID', async () => {
      const mockPayment = { id: 1, amount: 100, invoiceId: 1 };
      paymentsRepository.findById.mockResolvedValue(mockPayment);

      const result = await paymentsService.getById(1);

      expect(result).toEqual(mockPayment);
      expect(paymentsRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error if payment not found', async () => {
      paymentsRepository.findById.mockResolvedValue(null);

      await expect(paymentsService.getById(999)).rejects.toThrow('Payment not found');
    });
  });

  describe('create', () => {
    it('should create a new payment and update invoice status', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 100,
        paymentMethod: 'cash',
        paymentDate: '2025-01-28'
      };
      const mockInvoice = {
        id: 1,
        totalAmount: 200,
        amountPaid: 0,
        status: 'pending',
        repairRequestId: null
      };
      const mockPayment = { id: 1, ...paymentData };
      const mockUser = { id: 1 };

      invoicesRepository.findById.mockResolvedValue(mockInvoice);
      paymentsRepository.getTotalPaid.mockResolvedValue(0);
      paymentsRepository.create.mockResolvedValue(mockPayment);
      invoicesRepository.update.mockResolvedValue(true);
      connection.query.mockResolvedValue([]);

      const result = await paymentsService.create(paymentData, mockUser);

      expect(result).toBeDefined();
      expect(invoicesRepository.update).toHaveBeenCalled();
      expect(connection.commit).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      const paymentData = { invoiceId: 999, amount: 100 };
      const mockUser = { id: 1 };

      invoicesRepository.findById.mockResolvedValue(null);

      await expect(paymentsService.create(paymentData, mockUser)).rejects.toThrow('Invoice not found');
      expect(connection.rollback).toHaveBeenCalled();
    });

    it('should throw error if payment amount exceeds remaining balance', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 300, // Exceeds total
        paymentMethod: 'cash'
      };
      const mockInvoice = {
        id: 1,
        totalAmount: 200,
        amountPaid: 0
      };
      const mockUser = { id: 1 };

      invoicesRepository.findById.mockResolvedValue(mockInvoice);
      paymentsRepository.getTotalPaid.mockResolvedValue(0);

      await expect(paymentsService.create(paymentData, mockUser)).rejects.toThrow('exceeds remaining balance');
      expect(connection.rollback).toHaveBeenCalled();
    });

    it('should update repair status to ready_for_delivery when invoice is fully paid', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 200,
        paymentMethod: 'cash'
      };
      const mockInvoice = {
        id: 1,
        totalAmount: 200,
        amountPaid: 0,
        status: 'pending',
        repairRequestId: 1
      };
      const mockPayment = { id: 1, ...paymentData };
      const mockUser = { id: 1 };

      invoicesRepository.findById.mockResolvedValue(mockInvoice);
      paymentsRepository.getTotalPaid.mockResolvedValue(0);
      paymentsRepository.create.mockResolvedValue(mockPayment);
      invoicesRepository.update.mockResolvedValue(true);
      connection.query.mockResolvedValue([]);

      await paymentsService.create(paymentData, mockUser);

      expect(connection.query).toHaveBeenCalledWith(
        expect.any(String),
        [1]
      );
    });
  });

  describe('getByInvoice', () => {
    it('should return payments for an invoice', async () => {
      const mockPayments = [
        { id: 1, amount: 100, invoiceId: 1 },
        { id: 2, amount: 50, invoiceId: 1 }
      ];
      const mockInvoice = { id: 1, totalAmount: 200 };

      paymentsRepository.findByInvoice.mockResolvedValue(mockPayments);
      paymentsRepository.getTotalPaid.mockResolvedValue(150);
      invoicesRepository.findById.mockResolvedValue(mockInvoice);

      const result = await paymentsService.getByInvoice(1);

      expect(result.payments).toEqual(mockPayments);
      expect(result.summary.totalPaid).toBe(150);
      expect(result.summary.totalAmount).toBe(200);
      expect(result.summary.remaining).toBe(50);
    });
  });

  describe('getStats', () => {
    it('should return payment statistics', async () => {
      const mockStats = {
        total: 5000,
        count: 50,
        average: 100,
        byMethod: {}
      };

      paymentsRepository.getStats.mockResolvedValue(mockStats);

      const result = await paymentsService.getStats();

      expect(result).toEqual(mockStats);
      expect(paymentsRepository.getStats).toHaveBeenCalled();
    });
  });
});

