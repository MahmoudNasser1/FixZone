import api from './api';

const purchaseOrderService = {
  // Get all purchase orders with filtering and pagination
  async getAllPurchaseOrders(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.request(`/purchaseorders?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

  // Get purchase order by ID
  async getPurchaseOrderById(id) {
    try {
      const response = await api.request(`/purchaseorders/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      throw error;
    }
  },

  // Create new purchase order
  async createPurchaseOrder(orderData) {
    try {
      const response = await api.request('/purchaseorders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return response;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  },

  // Update purchase order
  async updatePurchaseOrder(id, orderData) {
    try {
      const response = await api.request(`/purchaseorders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(orderData)
      });
      return response;
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  },

  // Approve purchase order
  async approvePurchaseOrder(id) {
    try {
      const response = await api.request(`/purchaseorders/${id}/approve`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error approving purchase order:', error);
      throw error;
    }
  },

  // Reject purchase order
  async rejectPurchaseOrder(id) {
    try {
      const response = await api.request(`/purchaseorders/${id}/reject`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error rejecting purchase order:', error);
      throw error;
    }
  },

  // Delete purchase order
  async deletePurchaseOrder(id) {
    try {
      const response = await api.request(`/purchaseorders/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  },

  // Get purchase order statistics
  async getPurchaseOrderStats() {
    try {
      const response = await api.request('/purchaseorders/stats');
      return response;
    } catch (error) {
      console.error('Error fetching purchase order stats:', error);
      throw error;
    }
  },

  // Get vendors for dropdown
  async getVendors() {
    try {
      const response = await api.request('/vendors');
      return response;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Get inventory items for dropdown
  async getInventoryItems() {
    try {
      const response = await api.request('/inventory');
      return response;
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }
};

export default purchaseOrderService;
