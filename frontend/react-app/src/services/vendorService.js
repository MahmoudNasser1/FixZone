import api from './api';

const vendorService = {
  // Get all vendors with filtering and pagination
  async getAllVendors(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.request(`/vendors?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Get vendor by ID
  async getVendorById(id) {
    try {
      const response = await api.request(`/vendors/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  },

  // Create new vendor
  async createVendor(vendorData) {
    try {
      const response = await api.request('/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorData)
      });
      return response;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  // Update vendor
  async updateVendor(id, vendorData) {
    try {
      const response = await api.request(`/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vendorData)
      });
      return response;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  // Update vendor status
  async updateVendorStatus(id, status) {
    try {
      const response = await api.request(`/vendors/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Error updating vendor status:', error);
      throw error;
    }
  },

  // Delete vendor
  async deleteVendor(id) {
    try {
      const response = await api.request(`/vendors/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },

  // Get vendor statistics
  async getVendorStats() {
    try {
      const response = await api.request('/vendors/stats');
      return response;
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      throw error;
    }
  }
};

export default vendorService;
