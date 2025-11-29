// Expenses Service
// API service for Expenses

import apiService from '../api';

const expensesService = {
  /**
   * Get all expenses
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise}
   */
  async getAll(filters = {}, pagination = {}) {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 50
    };
    return await apiService.get('/api/financial/expenses', { params });
  },

  /**
   * Get expense by ID
   * @param {number} id - Expense ID
   * @returns {Promise}
   */
  async getById(id) {
    return await apiService.get(`/api/financial/expenses/${id}`);
  },

  /**
   * Create new expense
   * @param {Object} data - Expense data
   * @returns {Promise}
   */
  async create(data) {
    return await apiService.post('/api/financial/expenses', data);
  },

  /**
   * Update expense
   * @param {number} id - Expense ID
   * @param {Object} data - Expense data
   * @returns {Promise}
   */
  async update(id, data) {
    return await apiService.put(`/api/financial/expenses/${id}`, data);
  },

  /**
   * Delete expense
   * @param {number} id - Expense ID
   * @returns {Promise}
   */
  async delete(id) {
    return await apiService.delete(`/api/financial/expenses/${id}`);
  },

  /**
   * Get expense statistics
   * @param {Object} filters - Filter options
   * @returns {Promise}
   */
  async getStats(filters = {}) {
    return await apiService.get('/api/financial/expenses/stats', { params: filters });
  },

  /**
   * Export expenses to Excel
   * @param {Object} filters - Filter options
   * @returns {Promise}
   */
  async exportToExcel(filters = {}) {
    return await apiService.get('/api/financial/expenses/export/excel', {
      params: filters,
      responseType: 'blob'
    });
  }
};

export default expensesService;

