import api from './api';

const vendorPaymentService = {
  // Get all payments for a vendor
  async getVendorPayments(vendorId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.request(`/vendors/${vendorId}/payments?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching vendor payments:', error);
      throw error;
    }
  },

  // Get single payment
  async getVendorPaymentById(vendorId, paymentId) {
    try {
      const response = await api.request(`/vendors/${vendorId}/payments/${paymentId}`);
      return response;
    } catch (error) {
      console.error('Error fetching vendor payment:', error);
      throw error;
    }
  },

  // Create new payment
  async createVendorPayment(vendorId, paymentData) {
    try {
      const response = await api.request(`/vendors/${vendorId}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return response;
    } catch (error) {
      console.error('Error creating vendor payment:', error);
      throw error;
    }
  },

  // Update payment
  async updateVendorPayment(vendorId, paymentId, paymentData) {
    try {
      const response = await api.request(`/vendors/${vendorId}/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify(paymentData)
      });
      return response;
    } catch (error) {
      console.error('Error updating vendor payment:', error);
      throw error;
    }
  },

  // Delete payment
  async deleteVendorPayment(vendorId, paymentId) {
    try {
      const response = await api.request(`/vendors/${vendorId}/payments/${paymentId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting vendor payment:', error);
      throw error;
    }
  },

  // Get vendor balance
  async getVendorBalance(vendorId) {
    try {
      const response = await api.request(`/vendors/${vendorId}/payments/balance`);
      return response;
    } catch (error) {
      console.error('Error fetching vendor balance:', error);
      throw error;
    }
  },

  // Get vendor payment stats
  async getVendorPaymentStats(vendorId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);

      const response = await api.request(`/vendors/${vendorId}/payments/stats?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching vendor payment stats:', error);
      throw error;
    }
  },

  // Update payment status
  async updatePaymentStatus(vendorId, paymentId, status) {
    try {
      const response = await api.request(`/vendors/${vendorId}/payments/${paymentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
};

export default vendorPaymentService;

