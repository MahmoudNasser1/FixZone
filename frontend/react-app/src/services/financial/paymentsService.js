// Payments Service
// API service for Payments

import apiService from '../api';

const paymentsService = {
  /**
   * Get all payments
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
    return await apiService.get('/api/financial/payments', { params });
  },

  /**
   * Get payment by ID
   * @param {number} id - Payment ID
   * @returns {Promise}
   */
  async getById(id) {
    return await apiService.get(`/api/financial/payments/${id}`);
  },

  /**
   * Create new payment
   * @param {Object} data - Payment data
   * @returns {Promise}
   */
  async create(data) {
    return await apiService.post('/api/financial/payments', data);
  },

  /**
   * Get payments by invoice ID
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise}
   */
  async getByInvoice(invoiceId) {
    return await apiService.get(`/api/financial/payments/invoice/${invoiceId}`);
  },

  /**
   * Get payment statistics
   * @param {Object} filters - Filter options
   * @returns {Promise}
   */
  async getStats(filters = {}) {
    return await apiService.get('/api/financial/payments/stats/summary', { params: filters });
  },

  /**
   * Get overdue payments
   * @param {number} days - Days overdue (default: 0)
   * @returns {Promise}
   */
  async getOverdue(days = 0) {
    return await apiService.get('/api/financial/payments/overdue', { params: { days } });
  }
};

export default paymentsService;

