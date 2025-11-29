// Expenses Service
// Business logic for Expenses

const expensesRepository = require('../../repositories/financial/expenses.repository');
const auditLogService = require('../auditLog.service');
const websocketService = require('../websocketService');

class ExpensesService {
  /**
   * Get all expenses
   */
  async getAll(filters = {}, pagination = {}, user = null) {
    try {
      const result = await expensesRepository.findAll(filters, pagination);
      return result;
    } catch (error) {
      console.error('Error in expensesService.getAll:', error);
      throw error;
    }
  }

  /**
   * Get expense by ID
   */
  async getById(id, user = null) {
    try {
      const expense = await expensesRepository.findById(id);
      if (!expense) {
        throw new Error('Expense not found');
      }
      return expense;
    } catch (error) {
      console.error('Error in expensesService.getById:', error);
      throw error;
    }
  }

  /**
   * Create new expense
   */
  async create(data, user) {
    try {
      // Validate data
      await this.validateExpenseData(data);

      // Create expense
      const expense = await expensesRepository.create({
        ...data,
        createdBy: user.id
      });

      // Log audit
      if (auditLogService) {
        await auditLogService.log({
          action: 'expense_created',
          entityType: 'Expense',
          entityId: expense.id,
          userId: user.id,
          changes: expense
        });
      }

      // Emit WebSocket event
      if (websocketService) {
        websocketService.broadcastToAll({
          type: 'expense_created',
          expenseId: expense.id,
          message: 'تم إنشاء نفقة جديدة',
          timestamp: new Date().toISOString()
        });
      }

      return expense;
    } catch (error) {
      console.error('Error in expensesService.create:', error);
      throw error;
    }
  }

  /**
   * Update expense
   */
  async update(id, data, user) {
    try {
      // Get existing expense
      const existing = await expensesRepository.findById(id);
      if (!existing) {
        throw new Error('Expense not found');
      }

      // Validate data
      await this.validateExpenseData(data, id);

      // Update expense
      const updated = await expensesRepository.update(id, data);

      // Log audit
      if (auditLogService) {
        await auditLogService.log({
          action: 'expense_updated',
          entityType: 'Expense',
          entityId: id,
          userId: user.id,
          changes: { before: existing, after: updated }
        });
      }

      // Emit WebSocket event
      if (websocketService) {
        websocketService.broadcastToAll({
          type: 'expense_updated',
          expenseId: id,
          message: 'تم تحديث النفقة',
          timestamp: new Date().toISOString()
        });
      }

      return updated;
    } catch (error) {
      console.error('Error in expensesService.update:', error);
      throw error;
    }
  }

  /**
   * Delete expense (soft delete)
   */
  async delete(id, user) {
    try {
      // Get existing expense
      const existing = await expensesRepository.findById(id);
      if (!existing) {
        throw new Error('Expense not found');
      }

      // Soft delete
      await expensesRepository.softDelete(id);

      // Log audit
      if (auditLogService) {
        await auditLogService.log({
          action: 'expense_deleted',
          entityType: 'Expense',
          entityId: id,
          userId: user.id,
          changes: existing
        });
      }

      // Emit WebSocket event
      if (websocketService) {
        websocketService.broadcastToAll({
          type: 'expense_deleted',
          expenseId: id,
          message: 'تم حذف النفقة',
          timestamp: new Date().toISOString()
        });
      }

      return true;
    } catch (error) {
      console.error('Error in expensesService.delete:', error);
      throw error;
    }
  }

  /**
   * Get expense statistics
   */
  async getStats(filters = {}, user = null) {
    try {
      const stats = await expensesRepository.getStats(filters);
      return stats;
    } catch (error) {
      console.error('Error in expensesService.getStats:', error);
      throw error;
    }
  }

  /**
   * Validate expense data
   */
  async validateExpenseData(data, id = null) {
    // Validate required fields
    if (!data.categoryId) {
      throw new Error('Category is required');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (!data.date) {
      throw new Error('Date is required');
    }

    // Validate date is not in the future
    const expenseDate = new Date(data.date);
    const today = new Date();
    if (expenseDate > today) {
      throw new Error('Expense date cannot be in the future');
    }

    return true;
  }
}

module.exports = new ExpensesService();


