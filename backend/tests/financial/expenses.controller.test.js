// Expenses Controller Unit Tests
// Tests for expenses.controller.js

const expensesController = require('../../controllers/financial/expenses.controller');
const expensesService = require('../../services/financial/expenses.service');

// Mock dependencies
jest.mock('../../services/financial/expenses.service');

describe('Expenses Controller', () => {
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
    it('should return all expenses with pagination', async () => {
      const mockResult = {
        data: [{ id: 1, amount: 100 }],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
      };

      expensesService.getAll.mockResolvedValue(mockResult);

      await expensesController.getAll(req, res);

      expect(expensesService.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Expenses retrieved successfully',
        data: mockResult.data,
        pagination: mockResult.pagination
      });
    });

    it('should handle errors', async () => {
      expensesService.getAll.mockRejectedValue(new Error('Database error'));

      await expensesController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error retrieving expenses',
        error: 'Database error'
      });
    });
  });

  describe('getById', () => {
    it('should return expense by ID', async () => {
      const mockExpense = { id: 1, amount: 100, description: 'Test' };
      req.params.id = '1';

      expensesService.getById.mockResolvedValue(mockExpense);

      await expensesController.getById(req, res);

      expect(expensesService.getById).toHaveBeenCalledWith(1, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Expense retrieved successfully',
        data: mockExpense
      });
    });

    it('should return 404 if expense not found', async () => {
      req.params.id = '999';
      expensesService.getById.mockRejectedValue(new Error('Expense not found'));

      await expensesController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        categoryId: 1,
        amount: 100,
        description: 'Test expense',
        date: '2025-01-28'
      };
      const mockExpense = { id: 1, ...expenseData };
      req.body = expenseData;

      expensesService.create.mockResolvedValue(mockExpense);

      await expensesController.create(req, res);

      expect(expensesService.create).toHaveBeenCalledWith(expenseData, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Expense created successfully',
        data: mockExpense
      });
    });

    it('should handle validation errors', async () => {
      req.body = { amount: 100 }; // Missing required fields
      expensesService.create.mockRejectedValue(new Error('Validation error'));

      await expensesController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('update', () => {
    it('should update an existing expense', async () => {
      const updateData = { description: 'Updated expense' };
      const mockExpense = { id: 1, ...updateData };
      req.params.id = '1';
      req.body = updateData;

      expensesService.update.mockResolvedValue(mockExpense);

      await expensesController.update(req, res);

      expect(expensesService.update).toHaveBeenCalledWith(1, updateData, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Expense updated successfully',
        data: mockExpense
      });
    });

    it('should return 404 if expense not found', async () => {
      req.params.id = '999';
      expensesService.update.mockRejectedValue(new Error('Expense not found'));

      await expensesController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete an expense', async () => {
      req.params.id = '1';
      expensesService.delete.mockResolvedValue(true);

      await expensesController.delete(req, res);

      expect(expensesService.delete).toHaveBeenCalledWith(1, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Expense deleted successfully'
      });
    });
  });

  describe('getStats', () => {
    it('should return expense statistics', async () => {
      const mockStats = {
        total: 1000,
        count: 10,
        average: 100
      };
      req.query = {};

      expensesService.getStats.mockResolvedValue(mockStats);

      await expensesController.getStats(req, res);

      expect(expensesService.getStats).toHaveBeenCalledWith({}, req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Expense statistics retrieved successfully',
        data: mockStats
      });
    });
  });
});

