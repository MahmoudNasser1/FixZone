import apiService from './api';

/**
 * Inventory Service - Enhanced with new API endpoints
 * Supports: Advanced filtering, stock management, bulk actions, statistics
 */
const inventoryService = {
  // Inventory Items with enhanced filtering
  listItems(params = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      stockStatus = '',
      warehouseId = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = params;
    
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(type && { type }),
      ...(stockStatus && { stockStatus }),
      ...(warehouseId && { warehouseId }),
      sortBy,
      sortOrder
    });
    
    return apiService.request(`/inventory?${query}`);
  },
  getItem(id) {
    return apiService.request(`/inventory/${id}`);
  },
  createItem(payload) {
    return apiService.request('/inventory', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateItem(id, payload) {
    return apiService.request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteItem(id) {
    return apiService.request(`/inventory/${id}`, { method: 'DELETE' });
  },

  // Bulk actions for inventory items
  async bulkAction(action, itemIds, data = {}) {
    return apiService.request('/inventoryitems/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, itemIds, data })
    });
  },

  // Stock adjustment
  async adjustStock(itemId, warehouseId, quantity, type, notes = '') {
    return apiService.request(`/inventoryitems/${itemId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ warehouseId, quantity, type, notes })
    });
  },

  // Get inventory statistics
  async getStatistics() {
    return apiService.request('/inventoryitems/stats');
  },

  // Get low stock alerts
  async getLowStockAlerts() {
    return apiService.request('/inventoryitems/low-stock');
  },

  // Get inventory types
  async getInventoryTypes() {
    return apiService.request('/inventoryitems/types');
  },

  // Warehouses
  listWarehouses() {
    return apiService.request('/warehouses');
  },

  // Stock Levels (legacy endpoints - kept for compatibility)
  listStockLevels(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiService.request(`/stocklevels${qs ? `?${qs}` : ''}`);
  },
  getStockLevel(id) {
    return apiService.request(`/stocklevels/${id}`);
  },
  createStockLevel(payload) {
    return apiService.request('/stocklevels', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateStockLevel(id, payload) {
    return apiService.request(`/stocklevels/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteStockLevel(id) {
    return apiService.request(`/stocklevels/${id}`, { method: 'DELETE' });
  },
  listLowStock() {
    return apiService.request('/stocklevels/low-stock');
  },

  // Stock Movements (legacy endpoints - kept for compatibility)
  listMovements(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiService.request(`/stockmovements${qs ? `?${qs}` : ''}`);
  },
  createMovement(payload) {
    return apiService.request('/stockmovements', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateMovement(id, payload) {
    return apiService.request(`/stockmovements/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteMovement(id) {
    return apiService.request(`/stockmovements/${id}`, { method: 'DELETE' });
  },

  // Issue a part to a repair request (transactional backend endpoint)
  issuePart({ repairRequestId, inventoryItemId, warehouseId, quantity, userId, invoiceItemId = null, invoiceId = null }) {
    const payload = { repairRequestId, inventoryItemId, warehouseId, quantity, userId, invoiceItemId, invoiceId };
    return apiService.request('/inventory/issue', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Legacy invoice helpers - now handled by invoicesService
  fetchInvoiceItems(invoiceId) {
    // Backend doesn't expose /invoices/:id/items; use /invoices/:id which returns { success, data: { ... , items: [] } }
    return apiService.request(`/invoices/${invoiceId}`)
      .then(res => {
        if (Array.isArray(res)) return res; // fallback (shouldn't happen)
        return res?.data?.items || res?.items || [];
      });
  },
};

export default inventoryService;
