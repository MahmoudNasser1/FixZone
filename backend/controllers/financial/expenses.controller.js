// Expenses Controller
// Handles HTTP requests for Expenses

const expensesService = require('../../services/financial/expenses.service');

class ExpensesController {
  /**
   * Get all expenses
   * GET /api/financial/expenses
   */
  async getAll(req, res) {
    try {
      const result = await expensesService.getAll(req.query, {
        page: req.query.page || 1,
        limit: req.query.limit || 50
      }, req.user);

      res.json({
        success: true,
        message: 'Expenses retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in expensesController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving expenses',
        error: error.message
      });
    }
  }

  /**
   * Get expense by ID
   * GET /api/financial/expenses/:id
   */
  async getById(req, res) {
    try {
      const expense = await expensesService.getById(req.params.id, req.user);

      res.json({
        success: true,
        message: 'Expense retrieved successfully',
        data: expense
      });
    } catch (error) {
      console.error('Error in expensesController.getById:', error);
      const statusCode = error.message === 'Expense not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error retrieving expense',
        error: error.message
      });
    }
  }

  /**
   * Create new expense
   * POST /api/financial/expenses
   */
  async create(req, res) {
    try {
      const expense = await expensesService.create(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: expense
      });
    } catch (error) {
      console.error('Error in expensesController.create:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating expense',
        error: error.message
      });
    }
  }

  /**
   * Update expense
   * PUT /api/financial/expenses/:id
   */
  async update(req, res) {
    try {
      const expense = await expensesService.update(req.params.id, req.body, req.user);

      res.json({
        success: true,
        message: 'Expense updated successfully',
        data: expense
      });
    } catch (error) {
      console.error('Error in expensesController.update:', error);
      const statusCode = error.message === 'Expense not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error updating expense',
        error: error.message
      });
    }
  }

  /**
   * Delete expense
   * DELETE /api/financial/expenses/:id
   */
  async delete(req, res) {
    try {
      await expensesService.delete(req.params.id, req.user);

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      console.error('Error in expensesController.delete:', error);
      const statusCode = error.message === 'Expense not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error deleting expense',
        error: error.message
      });
    }
  }

  /**
   * Get expense statistics
   * GET /api/financial/expenses/stats
   */
  async getStats(req, res) {
    try {
      const stats = await expensesService.getStats(req.query, req.user);

      res.json({
        success: true,
        message: 'Expense statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error in expensesController.getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving expense statistics',
        error: error.message
      });
    }
  }
}

module.exports = new ExpensesController();


