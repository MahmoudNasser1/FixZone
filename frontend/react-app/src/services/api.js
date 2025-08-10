import { loadSettings } from '../config/settings';
// API Service للتعامل مع Backend APIs
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  // Helper method للطلبات
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    // عند استخدام FormData اترك المتصفح يحدد Content-Type مع boundary
    if (isFormData && headers['Content-Type']) {
      delete headers['Content-Type'];
    }
    const config = {
      headers,
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
  // Users APIs
  // ==================
  
  // جلب جميع المستخدمين مع إمكانية التصفية (مثلاً بالدور)
  async listUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/users${qs ? `?${qs}` : ''}`);
  }

  // جلب الفنيين فقط (يفترض أن الـ backend يدعم التصفية عبر الدور)
  async listTechnicians() {
    // ملاحظة: وفق المخطط، الفني هو سجل في جدول User مع دور يشير إلى Role('Technician').
    // إذا كان الـ backend يستخدم اسم دور مختلف (مثل TECHNICIAN)، حدث القيمة أدناه.
    return this.listUsers({ role: 'Technician' });
  }

  // ==================
  // Customer APIs
  // ==================
  
  // جلب جميع العملاء
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  // البحث عن العملاء بالاسم أو الهاتف مع ترقيم الصفحات
  async searchCustomers(q, page = 1, pageSize = 20) {
    const qs = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) }).toString();
    return this.request(`/customers/search?${qs}`);
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

  // جلب إحصائيات العميل
  async getCustomerStats(id) {
    return this.request(`/customers/${id}/stats`);
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

  // حذف طلب إصلاح
  async deleteRepairRequest(id) {
    return this.request(`/repairs/${id}`, {
      method: 'DELETE',
    });
  }

  // سجلات/خط زمني لطلب الإصلاح
  async getRepairLogs(id, params = {}) {
    // لا يوجد مسار /repairs/:id/logs في الـ backend الحالي.
    // سنستخدم /audit-logs ونرشح في الواجهة.
    const all = await this.request(`/audit-logs`);
    const logs = (Array.isArray(all) ? all : []).filter(
      (l) => (l.entityType === 'RepairRequest' && String(l.entityId) === String(id))
    );
    // تحويل الصيغة لتناسق العرض
    return logs.map((l) => ({
      id: l.id,
      content: l.details || '',
      author: l.userId ? `مستخدم #${l.userId}` : 'غير معروف',
      createdAt: l.createdAt || l.timestamp || new Date().toISOString(),
      type: l.action || 'note',
    }));
  }

  // إسناد فني للطلب
  async assignTechnician(id, technicianId) {
    return this.request(`/repairs/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ technicianId }),
    });
  }

  // المرفقات: قائمة/رفع/حذف
  async listAttachments(id) {
    return this.request(`/repairs/${id}/attachments`);
  }

  // ==================
  // Print Settings APIs
  // ==================
  async getPrintSettings() {
    return this.request(`/repairs/print-settings`);
  }

  async updatePrintSettings(payload) {
    return this.request(`/repairs/print-settings`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async uploadAttachment(id, file, extra = {}) {
    const form = new FormData();
    form.append('file', file);
    Object.entries(extra || {}).forEach(([k, v]) => form.append(k, v));
    return this.request(`/repairs/${id}/attachments`, {
      method: 'POST',
      body: form,
    });
  }

  async deleteAttachment(id, attachmentId) {
    return this.request(`/repairs/${id}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // فواتير الطلب
  async listRepairInvoices(id, params = {}) {
    // الراوتر الخلفي يستخدم /invoices مع إمكانية تمرير repairRequestId
    const query = new URLSearchParams({ ...(params || {}), repairRequestId: id }).toString();
    return this.request(`/invoices${query ? `?${query}` : ''}`);
  }

  async createRepairInvoice(id, invoiceData) {
    // backend يتوقع: totalAmount, amountPaid, status, repairRequestId, currency, taxAmount
    const payload = {
      totalAmount: invoiceData?.totalAmount ?? invoiceData?.amount ?? 0,
      amountPaid: invoiceData?.amountPaid ?? 0,
      status: invoiceData?.status ?? 'unpaid',
      repairRequestId: Number(id),
      currency: invoiceData?.currency ?? (loadSettings()?.currency?.code || 'EGP'),
      taxAmount: invoiceData?.taxAmount ?? 0,
    };
    return this.request(`/invoices`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // طباعة إيصال/ملصق
  async printRepair(id, type = 'receipt') {
    const endpoint = `/repairs/${id}/print/${type}`;
    const url = `${API_BASE_URL}${endpoint}`;
    const resp = await fetch(url, { method: 'GET', headers: { Accept: '*/*' } });
    // إذا أعاد السيرفر JSON بدلاً من ملف، اعتبرها رسالة خطأ مقروءة
    const contentType = resp.headers.get('content-type') || '';
    if (!resp.ok) {
      if (contentType.includes('application/json')) {
        const errJson = await resp.json().catch(() => ({}));
        const msg = errJson.message || `HTTP error! status: ${resp.status}`;
        throw new Error(msg);
      }
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    // افتراض الاستلام كـ Blob (PDF/PNG...)
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { blob, objectUrl, contentType };
  }

  // ==================
  // Notes via Audit Logs
  // ==================
  async addRepairNote(repairId, content, currentUserId = 1) {
    // يستخدم جدول AuditLog لتخزين الملاحظات المرتبطة بطلب الإصلاح
    const payload = {
      action: 'repair_note',
      actionType: 'NOTE',
      details: content,
      entityType: 'RepairRequest',
      entityId: Number(repairId),
      userId: currentUserId,
      ipAddress: '127.0.0.1',
      beforeValue: null,
      afterValue: null,
    };
    return this.request('/audit-logs', { method: 'POST', body: JSON.stringify(payload) });
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

  // ==================
  // Variables APIs
  // ==================
  async getVariables({ category, deviceType, active } = {}) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (deviceType) params.set('deviceType', deviceType);
    if (typeof active !== 'undefined') params.set('active', active ? '1' : '0');
    return this.request(`/variables${params.toString() ? `?${params.toString()}` : ''}`);
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const apiService = new ApiService();

export default apiService;
