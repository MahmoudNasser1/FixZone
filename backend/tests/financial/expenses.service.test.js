// Expenses Service Unit Tests
// Tests for expenses.service.js

const expensesService = require('../../services/financial/expenses.service');
const expensesRepository = require('../../repositories/financial/expenses.repository');

// Mock dependencies
jest.mock('../../repositories/financial/expenses.repository');

describe('Expenses Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all expenses with filters and pagination', async () => {
      const mockExpenses = [
        { id: 1, amount: 100, description: 'Test expense 1' },
        { id: 2, amount: 200, description: 'Test expense 2' }
      ];
      const mockResult = {
        data: mockExpenses,
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 }
      };

      expensesRepository.findAll.mockResolvedValue(mockResult);

      const filters = { categoryId: 1 };
      const pagination = { page: 1, limit: 50 };
      const result = await expensesService.getAll(filters, pagination);

      expect(result).toEqual(mockResult);
      expect(expensesRepository.findAll).toHaveBeenCalledWith(filters, pagination);
    });

    it('should handle errors gracefully', async () => {
      expensesRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(expensesService.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should return expense by ID', async () => {
      const mockExpense = { id: 1, amount: 100, description: 'Test expense' };
      expensesRepository.findById.mockResolvedValue(mockExpense);

      const result = await expensesService.getById(1);

      expect(result).toEqual(mockExpense);
      expect(expensesRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error if expense not found', async () => {
      expensesRepository.findById.mockResolvedValue(null);

      await expect(expensesService.getById(999)).rejects.toThrow('Expense not found');
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
      const mockUser = { id: 1 };

      expensesRepository.create.mockResolvedValue(mockExpense);

      const result = await expensesService.create(expenseData, mockUser);

      expect(result).toEqual(mockExpense);
      expect(expensesRepository.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing expense', async () => {
      const updateData = { description: 'Updated expense' };
      const mockExpense = { id: 1, ...updateData };
      const mockUser = { id: 1 };

      expensesRepository.findById.mockResolvedValue({ id: 1 });
      expensesRepository.update.mockResolvedValue(mockExpense);

      const result = await expensesService.update(1, updateData, mockUser);

      expect(result).toEqual(mockExpense);
      expect(expensesRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should throw error if expense not found', async () => {
      expensesRepository.findById.mockResolvedValue(null);

      await expect(expensesService.update(999, {}, { id: 1 })).rejects.toThrow('Expense not found');
    });
  });

  describe('delete', () => {
    it('should soft delete an expense', async () => {
      const mockExpense = { id: 1 };
      const mockUser = { id: 1 };

      expensesRepository.findById.mockResolvedValue(mockExpense);
      expensesRepository.delete.mockResolvedValue(true);

      const result = await expensesService.delete(1, mockUser);

      expect(result).toBe(true);
      expect(expensesRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error if expense not found', async () => {
      expensesRepository.findById.mockResolvedValue(null);

      await expect(expensesService.delete(999, { id: 1 })).rejects.toThrow('Expense not found');
    });
  });

  describe('getStats', () => {
    it('should return expense statistics', async () => {
      const mockStats = {
        total: 1000,
        count: 10,
        average: 100,
        byCategory: []
      };

      expensesRepository.getStats.mockResolvedValue(mockStats);

      const result = await expensesService.getStats();

      expect(result).toEqual(mockStats);
      expect(expensesRepository.getStats).toHaveBeenCalled();
    });
  });
});

