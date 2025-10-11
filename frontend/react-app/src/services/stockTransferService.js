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
    return apiService.request(`/stock-transfer${queryString ? '?' + queryString : ''}`);
  }

  // جلب نقل واحد
  async getStockTransfer(id) {
    return apiService.request(`/stock-transfer/${id}`);
  }

  // الموافقة على النقل
  async approveStockTransfer(id, approvedBy) {
    return apiService.request(`/stock-transfer/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvedBy })
    });
  }

  // شحن النقل
  async shipStockTransfer(id, shippedBy) {
    return apiService.request(`/stock-transfer/${id}/ship`, {
      method: 'PUT',
      body: JSON.stringify({ shippedBy })
    });
  }

  // استلام النقل
  async receiveStockTransfer(id, receivedBy) {
    return apiService.request(`/stock-transfer/${id}/receive`, {
      method: 'PUT',
      body: JSON.stringify({ receivedBy })
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


