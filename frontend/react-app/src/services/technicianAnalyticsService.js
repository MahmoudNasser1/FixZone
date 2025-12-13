import apiService from './api';

/**
 * خدمة التحليلات للفنيين
 */
class TechnicianAnalyticsService {
  /**
   * الحصول على اتجاهات الأداء
   * @param {number} technicianId - معرف الفني
   * @param {string} period - 'week' | 'month' | 'year'
   */
  async getPerformanceTrends(technicianId, period = 'month') {
    try {
      const response = await apiService.request(`/technicians/${technicianId}/analytics/trends?period=${period}`);
      return response;
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      throw error;
    }
  }

  /**
   * تحليل الكفاءة
   * @param {number} technicianId - معرف الفني
   * @param {string} period - 'week' | 'month' | 'year'
   */
  async getEfficiencyAnalysis(technicianId, period = 'month') {
    try {
      const response = await apiService.request(`/technicians/${technicianId}/analytics/efficiency?period=${period}`);
      return response;
    } catch (error) {
      console.error('Error fetching efficiency analysis:', error);
      throw error;
    }
  }

  /**
   * مقارنة بين الفنيين
   * @param {object} filters - { startDate, endDate, technicianIds }
   */
  async getComparativeAnalysis(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.technicianIds) params.append('technicianIds', filters.technicianIds.join(','));

      const response = await apiService.request(`/technicians/analytics/comparative?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching comparative analysis:', error);
      throw error;
    }
  }

  /**
   * توقعات الأداء
   * @param {number} technicianId - معرف الفني
   */
  async getPredictiveInsights(technicianId) {
    try {
      const response = await apiService.request(`/technicians/${technicianId}/analytics/predictions`);
      return response;
    } catch (error) {
      console.error('Error fetching predictive insights:', error);
      throw error;
    }
  }

  /**
   * تحليل فجوات المهارات
   * @param {number} technicianId - معرف الفني
   */
  async getSkillGapAnalysis(technicianId) {
    try {
      const response = await apiService.request(`/technicians/${technicianId}/analytics/skill-gaps`);
      return response;
    } catch (error) {
      console.error('Error fetching skill gap analysis:', error);
      throw error;
    }
  }
}

export default new TechnicianAnalyticsService();


