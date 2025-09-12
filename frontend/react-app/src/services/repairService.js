import apiService from './api';

const repairService = {
  // جلب خدمات طلب الإصلاح
  async getRepairRequestServices(repairRequestId) {
    return apiService.request(`/repairrequestservices?repairRequestId=${repairRequestId}`);
  },

  // إضافة خدمة لطلب الإصلاح
  async addRepairRequestService(data) {
    return apiService.request('/repairrequestservices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // تحديث خدمة طلب الإصلاح
  async updateRepairRequestService(id, data) {
    return apiService.request(`/repairrequestservices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // حذف خدمة طلب الإصلاح
  async deleteRepairRequestService(id) {
    return apiService.request(`/repairrequestservices/${id}`, {
      method: 'DELETE'
    });
  },

  // جلب قائمة الخدمات المتاحة
  async getAvailableServices() {
    return apiService.request('/services');
  },

  // إضافة خدمات للفاتورة
  async addServicesToInvoice(invoiceId, serviceData) {
    return apiService.request(`/invoices/${invoiceId}/items`, {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  }
};

export default repairService;
