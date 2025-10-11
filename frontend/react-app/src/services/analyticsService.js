import apiService from './api';

class AnalyticsService {
  // Get analytics summary
  async getSummary() {
    return await apiService.get('/analytics/summary');
  }

  // Get inventory value analysis
  async getInventoryValue() {
    return await apiService.get('/analytics/inventory-value');
  }

  // Get turnover rate
  async getTurnoverRate(period = 30) {
    return await apiService.get(`/analytics/turnover-rate?period=${period}`);
  }

  // Get ABC analysis
  async getABCAnalysis() {
    return await apiService.get('/analytics/abc-analysis');
  }

  // Get slow moving items
  async getSlowMovingItems(days = 90) {
    return await apiService.get(`/analytics/slow-moving?days=${days}`);
  }

  // Get profit margin analysis
  async getProfitMarginAnalysis() {
    return await apiService.get('/analytics/profit-margin');
  }

  // Get forecasting
  async getForecasting(itemId = null, days = 30) {
    const params = new URLSearchParams();
    if (itemId) params.append('itemId', itemId);
    params.append('days', days);
    return await apiService.get(`/analytics/forecasting?${params.toString()}`);
  }
}

export default new AnalyticsService();

