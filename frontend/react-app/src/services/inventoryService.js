import apiService from './api';

/**
 * Inventory Service - Enhanced with new API endpoints
 * Supports: Advanced filtering, stock management, bulk actions, statistics
 */
const inventoryService = {
  // Inventory Items with enhanced filtering (using new Enhanced APIs)
  listItems(params = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      stockStatus = '',
      warehouseId = '',
      categoryId = '',
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
      ...(categoryId && { categoryId }),
      sortBy,
      sortOrder
    });
    
    return apiService.request(`/inventory-enhanced/items?${query}`);
  },
  getItem(id) {
    return apiService.request(`/inventory-enhanced/items/${id}`);
  },
  createItem(payload) {
    return apiService.request('/inventory-enhanced/items', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateItem(id, payload) {
    return apiService.request(`/inventory-enhanced/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteItem(id) {
    return apiService.request(`/inventory-enhanced/items/${id}`, { method: 'DELETE' });
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

  // Get inventory statistics (using Enhanced API)
  async getStatistics() {
    return apiService.request('/inventory-enhanced/stats');
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

  // Vendors
  listVendors(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiService.request(`/vendors${qs ? `?${qs}` : ''}`);
  },
  getVendor(id) {
    return apiService.request(`/vendors/${id}`);
  },
  createVendor(payload) {
    return apiService.request('/vendors', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateVendor(id, payload) {
    return apiService.request(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteVendor(id) {
    return apiService.request(`/vendors/${id}`, { method: 'DELETE' });
  },

  // Categories
  listCategories() {
    return apiService.request('/inventoryitems/categories');
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

  // Stock Movements (Enhanced APIs)
  listMovements(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiService.request(`/stock-movements${qs ? `?${qs}` : ''}`);
  },
  getMovement(id) {
    return apiService.request(`/stock-movements/${id}`);
  },
  getMovementsByItem(itemId) {
    return apiService.request(`/stock-movements/inventory/${itemId}`);
  },
  createMovement(payload) {
    return apiService.request('/stock-movements', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateMovement(id, payload) {
    return apiService.request(`/stock-movements/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteMovement(id) {
    return apiService.request(`/stock-movements/${id}`, { method: 'DELETE' });
  },
  getMovementStats(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiService.request(`/stock-movements/stats/summary${qs ? `?${qs}` : ''}`);
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
