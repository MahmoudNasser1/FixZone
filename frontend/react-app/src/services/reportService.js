import api from './api';

/**
 * Report Service
 * خدمة التقارير للفنيين
 */

/**
 * إنشاء تقرير سريع
 * POST /api/technician-reports
 */
export async function createQuickReport(reportData) {
  try {
    const response = await api.request('/technician-reports', {
      method: 'POST',
      body: JSON.stringify({
        ...reportData,
        reportType: 'quick'
      })
    });
    return response;
  } catch (error) {
    console.error('Error creating quick report:', error);
    throw error;
  }
}

/**
 * إنشاء تقرير مفصل
 * POST /api/technician-reports
 */
export async function createDetailedReport(reportData) {
  try {
    const response = await api.request('/technician-reports', {
      method: 'POST',
      body: JSON.stringify({
        ...reportData,
        reportType: 'detailed'
      })
    });
    return response;
  } catch (error) {
    console.error('Error creating detailed report:', error);
    throw error;
  }
}

/**
 * جلب تقارير الفني
 * GET /api/technician-reports
 */
export async function getTechnicianReports(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/technician-reports${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
}

/**
 * جلب تقرير محدد
 * GET /api/technician-reports/:id
 */
export async function getReport(id) {
  try {
    const response = await api.request(`/technician-reports/${id}`);
    return response;
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
}

/**
 * تحديث تقرير
 * PUT /api/technician-reports/:id
 */
export async function updateReport(id, reportData) {
  try {
    const response = await api.request(`/technician-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData)
    });
    return response;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
}

/**
 * تقديم تقرير
 * POST /api/technician-reports/:id/submit
 */
export async function submitReport(id) {
  try {
    const response = await api.request(`/technician-reports/${id}/submit`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}



