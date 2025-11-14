import apiService from './api';

class StockTransferService {
  // إنشاء نقل جديد
  async createStockTransfer(data) {
    return apiService.request('/stock-transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // جلب جميع النقلات
  async getStockTransfers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiService.request(`/stock-transfer${queryString ? '?' + queryString : ''}`);
    
    // Handle different response formats
    if (response && response.success) {
      return response;
    } else if (response && response.data) {
      return { success: true, data: response.data };
    } else if (Array.isArray(response)) {
      return { success: true, data: { transfers: response } };
    }
    
    return response;
  }

  // جلب نقل واحد
  async getStockTransfer(id) {
    return apiService.request(`/stock-transfer/${id}`);
  }

  // الموافقة على النقل
  async approveStockTransfer(id, approvedBy) {
    // approvedBy is optional - will use req.user.id from authMiddleware
    const body = approvedBy ? { approvedBy } : {};
    return apiService.request(`/stock-transfer/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // شحن النقل
  async shipStockTransfer(id, shippedBy) {
    // shippedBy is optional - will use req.user.id from authMiddleware
    const body = shippedBy ? { shippedBy } : {};
    return apiService.request(`/stock-transfer/${id}/ship`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // استلام النقل
  async receiveStockTransfer(id, receivedBy) {
    // receivedBy is optional - will use req.user.id from authMiddleware
    const body = receivedBy ? { receivedBy } : {};
    return apiService.request(`/stock-transfer/${id}/receive`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // إكمال النقل
  async completeStockTransfer(id) {
    return apiService.request(`/stock-transfer/${id}/complete`, {
      method: 'PUT'
    });
  }

  // حذف النقل
  async deleteStockTransfer(id) {
    return apiService.request(`/stock-transfer/${id}`, {
      method: 'DELETE'
    });
  }

  // إحصائيات النقل
  async getStockTransferStats() {
    return apiService.request('/stock-transfer/stats');
  }
}

export default new StockTransferService();


