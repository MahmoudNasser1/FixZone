import apiService from './api';

/**
 * Warehouse Service
 * Handles all warehouse-related API calls
 */
const warehouseService = {
  // Get all warehouses
  listWarehouses() {
    return apiService.request('/warehouses');
  },

  // Get all warehouses (alias for compatibility)
  getWarehouses() {
    return apiService.request('/warehouses');
  },

  // Get warehouse by ID
  getWarehouse(id) {
    return apiService.request(`/warehouses/${id}`);
  },

  // Create new warehouse
  createWarehouse(data) {
    return apiService.request('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update warehouse
  updateWarehouse(id, data) {
    return apiService.request(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete warehouse
  deleteWarehouse(id) {
    return apiService.request(`/warehouses/${id}`, {
      method: 'DELETE'
    });
  },

  // Get warehouse statistics
  getWarehouseStats() {
    return apiService.request('/warehouses/stats');
  }
};

export default warehouseService;
