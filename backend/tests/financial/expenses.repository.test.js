// Expenses Repository Unit Tests
// Tests for expenses.repository.js

const expensesRepository = require('../../repositories/financial/expenses.repository');
const db = require('../../db');

// Mock dependencies
jest.mock('../../db');

describe('Expenses Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all expenses with filters and pagination', async () => {
      const mockExpenses = [
        { id: 1, amount: 100, description: 'Test expense 1', categoryName: 'Category 1' },
        { id: 2, amount: 200, description: 'Test expense 2', categoryName: 'Category 2' }
      ];
      const mockCount = [{ total: 2 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockExpenses]);

      const filters = { categoryId: 1 };
      const pagination = { page: 1, limit: 50 };
      const result = await expensesRepository.findAll(filters, pagination);

      expect(result.data).toEqual(mockExpenses);
      expect(result.pagination.total).toBe(2);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should filter by categoryId', async () => {
      const mockExpenses = [{ id: 1, categoryId: 1 }];
      const mockCount = [{ total: 1 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockExpenses]);

      const filters = { categoryId: 1 };
      await expensesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('categoryId = ?'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by branchId', async () => {
      const mockExpenses = [{ id: 1, branchId: 1 }];
      const mockCount = [{ total: 1 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockExpenses]);

      const filters = { branchId: 1 };
      await expensesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('branchId = ?'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by date range', async () => {
      const mockExpenses = [];
      const mockCount = [{ total: 0 }];

      db.query
        .mockResolvedValueOnce(mockCount)
        .mockResolvedValueOnce([mockExpenses]);

      const filters = { dateFrom: '2025-01-01', dateTo: '2025-01-31' };
      await expensesRepository.findAll(filters, { page: 1, limit: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE(e.date) >= ?'),
        expect.arrayContaining(['2025-01-01', '2025-01-31'])
      );
    });
  });

  describe('findById', () => {
    it('should return expense by ID', async () => {
      const mockExpense = { id: 1, amount: 100, description: 'Test expense' };
      db.query.mockResolvedValue([[mockExpense]]);

      const result = await expensesRepository.findById(1);

      expect(result).toEqual(mockExpense);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [1]
      );
    });

    it('should return null if expense not found', async () => {
      db.query.mockResolvedValue([[]]);

      const result = await expensesRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        categoryId: 1,
        amount: 100,
        description: 'Test expense',
        date: '2025-01-28',
        createdBy: 1
      };
      const mockResult = { insertId: 1 };

      db.query.mockResolvedValue([mockResult]);

      const result = await expensesRepository.create(expenseData);

      expect(result.id).toBe(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Expense'),
        expect.arrayContaining([1, 100, 'Test expense'])
      );
    });
  });

  describe('update', () => {
    it('should update an existing expense', async () => {
      const updateData = { description: 'Updated expense' };
      const mockResult = { affectedRows: 1 };

      db.query.mockResolvedValue([mockResult]);

      const result = await expensesRepository.update(1, updateData);

      expect(result).toBeDefined();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Expense'),
        expect.arrayContaining([1])
      );
    });
  });

  describe('delete', () => {
    it('should soft delete an expense', async () => {
      const mockResult = { affectedRows: 1 };
      db.query.mockResolvedValue([mockResult]);

      const result = await expensesRepository.delete(1);

      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('deletedAt = NOW()'),
        [1]
      );
    });
  });

  describe('getStats', () => {
    it('should return expense statistics', async () => {
      const mockStats = [{
        total: 1000,
        count: 10,
        average: 100
      }];

      db.query.mockResolvedValue([mockStats]);

      const result = await expensesRepository.getStats();

      expect(result.total).toBe(1000);
      expect(result.count).toBe(10);
      expect(result.average).toBe(100);
    });
  });
});

