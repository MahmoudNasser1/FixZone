// Invoices Service
// API service for Invoices

import apiService from '../api';

const invoicesService = {
  /**
   * Get all invoices
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
    return await apiService.get('/api/financial/invoices', { params });
  },

  /**
   * Get invoice by ID
   * @param {number} id - Invoice ID
   * @returns {Promise}
   */
  async getById(id) {
    return await apiService.get(`/api/financial/invoices/${id}`);
  },

  /**
   * Create new invoice
   * @param {Object} data - Invoice data
   * @returns {Promise}
   */
  async create(data) {
    return await apiService.post('/api/financial/invoices', data);
  },

  /**
   * Create invoice from repair request
   * @param {number} repairId - Repair Request ID
   * @param {Object} data - Invoice data
   * @returns {Promise}
   */
  async createFromRepair(repairId, data = {}) {
    return await apiService.post(`/api/financial/invoices/create-from-repair/${repairId}`, data);
  },

  /**
   * Get invoice by repair request ID
   * @param {number} repairId - Repair Request ID
   * @returns {Promise}
   */
  async getByRepair(repairId) {
    return await apiService.get(`/api/financial/invoices/by-repair/${repairId}`);
  },

  /**
   * Get invoice statistics
   * @param {Object} filters - Filter options
   * @returns {Promise}
   */
  async getStats(filters = {}) {
    return await apiService.get('/api/financial/invoices/stats', { params: filters });
  },

  /**
   * Get overdue invoices
   * @returns {Promise}
   */
  async getOverdue() {
    return await apiService.get('/api/financial/invoices/overdue');
  },

  /**
   * Generate invoice PDF
   * @param {number} id - Invoice ID
   * @returns {Promise}
   */
  async generatePDF(id) {
    return await apiService.get(`/api/financial/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
  }
};

export default invoicesService;

