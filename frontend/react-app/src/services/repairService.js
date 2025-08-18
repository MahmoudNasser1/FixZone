const API_BASE = 'http://localhost:3000/api';

const repairService = {
  // جلب خدمات طلب الإصلاح
  async getRepairRequestServices(repairRequestId) {
    const response = await fetch(`${API_BASE}/repairrequestservices?repairRequestId=${repairRequestId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // إضافة خدمة لطلب الإصلاح
  async addRepairRequestService(data) {
    const response = await fetch(`${API_BASE}/repairrequestservices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // تحديث خدمة طلب الإصلاح
  async updateRepairRequestService(id, data) {
    const response = await fetch(`${API_BASE}/repairrequestservices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // حذف خدمة طلب الإصلاح
  async deleteRepairRequestService(id) {
    const response = await fetch(`${API_BASE}/repairrequestservices/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // جلب قائمة الخدمات المتاحة
  async getAvailableServices() {
    const response = await fetch(`${API_BASE}/services`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // إضافة خدمات للفاتورة
  async addServicesToInvoice(invoiceId, serviceData) {
    const response = await fetch(`${API_BASE}/invoices/${invoiceId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
};

export default repairService;
