import apiService from './api';

class StockCountService {
  // إنشاء جرد جديد
  async createStockCount(data) {
    return apiService.request('/stock-count', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // جلب جميع الجردات
  async getStockCounts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiService.request(`/stock-count${queryString ? '?' + queryString : ''}`);
  }

  // جلب جرد واحد
  async getStockCount(id) {
    return apiService.request(`/stock-count/${id}`);
  }

  // إضافة عنصر للجرد
  async addStockCountItem(stockCountId, data) {
    return apiService.request(`/stock-count/${stockCountId}/items`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // تحديث حالة الجرد
  async updateStockCountStatus(id, status, options = {}) {
    return apiService.request(`/stock-count/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ 
        status,
        reviewedBy: options.reviewedBy,
        approvedBy: options.approvedBy,
        adjustedBy: options.adjustedBy
      })
    });
  }

  // حذف الجرد
  async deleteStockCount(id) {
    return apiService.request(`/stock-count/${id}`, {
      method: 'DELETE'
    });
  }

  // إحصائيات الجرد
  async getStockCountStats() {
    return apiService.request('/stock-count/stats');
  }

  // بدء الجرد
  async startStockCount(id) {
    return this.updateStockCountStatus(id, 'in_progress');
  }

  // إكمال الجرد
  async completeStockCount(id) {
    return this.updateStockCountStatus(id, 'completed');
  }

  // الموافقة على الجرد
  async approveStockCount(id) {
    return this.updateStockCountStatus(id, 'approved');
  }

  // إلغاء الجرد
  async cancelStockCount(id) {
    return this.updateStockCountStatus(id, 'cancelled');
  }
}

export default new StockCountService();


