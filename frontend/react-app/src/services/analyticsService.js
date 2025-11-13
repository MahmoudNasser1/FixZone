import apiService from './api';

class AnalyticsService {
  // Get analytics summary
  async getSummary() {
    return await apiService.request('/analytics/summary');
  }

  // Get inventory value analysis
  async getInventoryValue() {
    return await apiService.request('/analytics/inventory-value');
  }

  // Get turnover rate
  async getTurnoverRate(period = 30) {
    return await apiService.request(`/analytics/turnover-rate?period=${period}`);
  }

  // Get ABC analysis
  async getABCAnalysis() {
    return await apiService.request('/analytics/abc-analysis');
  }

  // Get slow moving items
  async getSlowMovingItems(days = 90) {
    return await apiService.request(`/analytics/slow-moving?days=${days}`);
  }

  // Get profit margin analysis
  async getProfitMarginAnalysis() {
    return await apiService.request('/analytics/profit-margin');
  }

  // Get forecasting
  async getForecasting(itemId = null, days = 30) {
    const params = new URLSearchParams();
    if (itemId) params.append('itemId', itemId);
    params.append('days', days);
    return await apiService.request(`/analytics/forecasting?${params.toString()}`);
  }
}

export default new AnalyticsService();

