// API Service للتعامل مع Backend APIs
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  // Helper method للطلبات
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ==================
  // Customer APIs
  // ==================
  
  // جلب جميع العملاء
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  // جلب عميل واحد
  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  // إنشاء عميل جديد
  async createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  // تحديث عميل
  async updateCustomer(id, customerData) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  // حذف عميل (soft delete)
  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================
  // Company APIs
  // ==================
  
  // جلب جميع الشركات
  async getCompanies(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/companies${queryString ? `?${queryString}` : ''}`);
  }

  // جلب شركة واحدة
  async getCompany(id) {
    return this.request(`/companies/${id}`);
  }

  // إنشاء شركة جديدة
  async createCompany(companyData) {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  // تحديث شركة
  async updateCompany(id, companyData) {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  // حذف شركة
  async deleteCompany(id) {
    return this.request(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // جلب عملاء شركة معينة
  async getCompanyCustomers(companyId) {
    return this.request(`/companies/${companyId}/customers`);
  }

  // ==================
  // Repair Request APIs
  // ==================
  
  // جلب جميع طلبات الإصلاح
  async getRepairRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/repairs${queryString ? `?${queryString}` : ''}`);
  }

  async getRepairRequest(id) {
    return this.request(`/repairs/${id}`);
  }

  async createRepairRequest(repairData) {
    return this.request('/repairs', {
      method: 'POST',
      body: JSON.stringify(repairData),
    });
  }

  // تحديث طلب إصلاح
  async updateRepairRequest(id, repairData) {
    return this.request(`/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(repairData),
    });
  }

  // تحديث حالة طلب الإصلاح
  async updateRepairStatus(id, status) {
    return this.request(`/repairs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ==================
  // Dashboard APIs
  // ==================
  
  // جلب إحصائيات لوحة التحكم
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // جلب الطلبات الحديثة
  async getRecentRepairs(limit = 10) {
    return this.request(`/dashboard/recent-repairs?limit=${limit}`);
  }

  // جلب الإشعارات
  async getNotifications() {
    return this.request('/notifications');
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const apiService = new ApiService();

export default apiService;
