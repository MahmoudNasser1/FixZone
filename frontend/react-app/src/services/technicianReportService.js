import { getDefaultApiBaseUrl } from '../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

/**
 * خدمة تقارير الفنيين
 * تتيح تصدير التقارير بصيغ مختلفة (PDF, Excel)
 */
class TechnicianReportService {
  /**
   * تصدير تقرير الأداء
   * @param {number} technicianId - معرف الفني (اختياري - لجميع الفنيين)
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { startDate, endDate }
   */
  async exportPerformanceReport(technicianId = null, format = 'pdf', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = technicianId
        ? `/technicians/${technicianId}/reports/performance/export?${params.toString()}`
        : `/technicians/reports/performance/export?${params.toString()}`;

      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(format === 'excel' ? {} : { 'Content-Type': 'text/html; charset=utf-8' })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = format === 'excel' ? await response.blob() : await response.text();

      if (format === 'excel') {
        // تحميل ملف Excel
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance_report_${technicianId || 'all'}_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // فتح PDF في نافذة جديدة أو تحويل HTML إلى PDF
        const newWindow = window.open('', '_blank');
        newWindow.document.write(data);
        newWindow.document.close();
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting performance report:', error);
      throw error;
    }
  }

  /**
   * تصدير تقرير الأجور
   * @param {number} technicianId - معرف الفني
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { startDate, endDate }
   */
  async exportWagesReport(technicianId, format = 'pdf', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `/technicians/${technicianId}/reports/wages/export?${params.toString()}`;
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(format === 'excel' ? {} : { 'Content-Type': 'text/html; charset=utf-8' })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = format === 'excel' ? await response.blob() : await response.text();

      if (format === 'excel') {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wages_report_${technicianId}_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(data);
        newWindow.document.close();
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting wages report:', error);
      throw error;
    }
  }

  /**
   * تصدير تقرير المهارات
   * @param {number} technicianId - معرف الفني
   * @param {string} format - 'pdf' أو 'excel'
   */
  async exportSkillsReport(technicianId, format = 'pdf') {
    try {
      const params = new URLSearchParams();
      params.append('format', format);

      const url = `/technicians/${technicianId}/reports/skills/export?${params.toString()}`;
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(format === 'excel' ? {} : { 'Content-Type': 'text/html; charset=utf-8' })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = format === 'excel' ? await response.blob() : await response.text();

      if (format === 'excel') {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `skills_report_${technicianId}_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(data);
        newWindow.document.close();
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting skills report:', error);
      throw error;
    }
  }

  /**
   * تصدير تقرير الجدولة
   * @param {number} technicianId - معرف الفني
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { startDate, endDate }
   */
  async exportScheduleReport(technicianId, format = 'pdf', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `/technicians/${technicianId}/reports/schedule/export?${params.toString()}`;
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(format === 'excel' ? {} : { 'Content-Type': 'text/html; charset=utf-8' })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = format === 'excel' ? await response.blob() : await response.text();

      if (format === 'excel') {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `schedule_report_${technicianId}_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(data);
        newWindow.document.close();
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting schedule report:', error);
      throw error;
    }
  }

  /**
   * تصدير تقرير شامل لجميع الفنيين
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { startDate, endDate }
   */
  async exportAllTechniciansReport(format = 'pdf', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `/technicians/reports/performance/export?${params.toString()}`;
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(format === 'excel' ? {} : { 'Content-Type': 'text/html; charset=utf-8' })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = format === 'excel' ? await response.blob() : await response.text();

      if (format === 'excel') {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `all_technicians_report_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(data);
        newWindow.document.close();
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting all technicians report:', error);
      throw error;
    }
  }
}

export default new TechnicianReportService();
