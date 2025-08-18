import apiService from './api';

/**
 * Invoice Templates Service
 * خدمة إدارة قوالب الفواتير
 */
const invoiceTemplatesService = {
  // جلب جميع قوالب الفواتير
  async listTemplates() {
    return apiService.request('/invoicetemplates');
  },

  // جلب قالب واحد
  async getTemplate(id) {
    return apiService.request(`/invoicetemplates/${id}`);
  },

  // إنشاء قالب جديد
  async createTemplate(templateData) {
    return apiService.request('/invoicetemplates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  },

  // تحديث قالب
  async updateTemplate(id, templateData) {
    return apiService.request(`/invoicetemplates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
  },

  // حذف قالب
  async deleteTemplate(id) {
    return apiService.request(`/invoicetemplates/${id}`, {
      method: 'DELETE'
    });
  },

  // تعيين قالب كافتراضي
  async setAsDefault(id) {
    return apiService.request(`/invoicetemplates/${id}/set-default`, {
      method: 'PATCH'
    });
  },

  // معاينة قالب
  async previewTemplate(id, invoiceId = null) {
    const url = invoiceId 
      ? `/invoicetemplates/${id}/preview?invoiceId=${invoiceId}`
      : `/invoicetemplates/${id}/preview`;
    return apiService.request(url);
  },

  // الحصول على القالب الافتراضي لنوع معين
  async getDefaultTemplate(type = 'standard') {
    const response = await this.listTemplates();
    const templates = response.success ? response.data : response;
    return templates.find(t => t.type === type && t.isDefault) || templates.find(t => t.isDefault) || templates[0];
  }
};

export default invoiceTemplatesService;
