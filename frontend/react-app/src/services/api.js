import { loadSettings } from '../config/settings';
// API Service للتعامل مع Backend APIs
const API_BASE_URL = 'http://localhost:3001/api';

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
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status code
        }
        throw new Error(errorMessage);
      }
      
      // Parse JSON and return
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ==================
  // Auth APIs
  // ==================

  async authMe() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // ==================
  // Users APIs
  // ==================
  
  // جلب جميع المستخدمين مع إمكانية التصفية (مثلاً بالدور)
  async listUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/users${qs ? `?${qs}` : ''}`);
  }

  // تحديث مستخدم (دور/نشط/بيانات عامة)
  async updateUser(id, payload) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // حذف مستخدم (soft delete)
  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // جلب الفنيين فقط من راوتر مخصص
  async listTechnicians() {
    return this.request('/technicians');
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
    const url = `${API_BASE_URL}/customers/search?${qs}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { ok: true, json: () => Promise.resolve(data) };
    } catch (error) {
      console.error('Customer search request failed:', error);
      return { ok: false, status: 500 };
    }
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
  async deleteCompany(id, force = false) {
    const url = force ? `/companies/${id}?force=true` : `/companies/${id}`;
    return this.request(url, {
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
    return this.request(`/repairs/${id}/details`, {
      method: 'PATCH',
      body: JSON.stringify(repairData),
    });
  }

  // تحديث حالة طلب الإصلاح
  async updateRepairStatus(id, status) {
    // إرسال الحالة كما هي والسماح للخادم بالتعامل مع التحويل
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
  async getRepairLogs(id) {
    return this.request(`/repairs/${id}/logs`);
  }

  // إسناد فني للطلب
  async assignTechnician(id, technicianId) {
    return this.request(`/repairs/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ technicianId }),
    });
  }

  // ==================
  // Inspection APIs
  // ==================
  async createInspectionReport(payload) {
    return this.request('/inspectionreports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateInspectionReport(id, payload) {
    return this.request(`/inspectionreports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async listInspectionComponents(reportId) {
    return this.request(`/inspectioncomponents?reportId=${reportId}`);
  }

  async addInspectionComponent(payload) {
    return this.request('/inspectioncomponents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateInspectionComponent(id, payload) {
    return this.request(`/inspectioncomponents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
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

  // ==================
  // Invoice APIs
  // ==================
  
  // جلب جميع الفواتير
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/invoices${queryString ? `?${queryString}` : ''}`;
    console.log('getInvoices API call:', url, 'with params:', params);
    return this.request(url);
  }

  // جلب فاتورة واحدة
  async getInvoiceById(id) {
    return this.request(`/invoices/${id}`);
  }

  // إنشاء فاتورة جديدة
  async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  // إنشاء فاتورة من طلب إصلاح
  async createInvoiceFromRepair(repairId, invoiceData = {}) {
    return this.request(`/invoices/create-from-repair/${repairId}`, {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  // تحديث فاتورة
  async updateInvoice(id, invoiceData) {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
  }

  // حذف فاتورة
  async deleteInvoice(id) {
    return this.request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // جلب عناصر الفاتورة
  async getInvoiceItems(invoiceId) {
    return this.request(`/invoices/${invoiceId}/items`);
  }

  // إضافة عنصر للفاتورة
  async addInvoiceItem(invoiceId, itemData) {
    return this.request(`/invoices/${invoiceId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  // تحديث عنصر الفاتورة
  async updateInvoiceItem(invoiceId, itemId, itemData) {
    return this.request(`/invoices/${invoiceId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  // حذف عنصر من الفاتورة
  async removeInvoiceItem(invoiceId, itemId) {
    return this.request(`/invoices/${invoiceId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // جلب مدفوعات الفاتورة
  async getInvoicePayments(invoiceId) {
    return this.request(`/payments/invoice/${invoiceId}`);
  }

  // توليد PDF للفاتورة
  async generateInvoicePDF(invoiceId) {
    return this.request(`/invoices/${invoiceId}/pdf`);
  }

  // العمليات المجمعة للفواتير
  async bulkActionInvoices(action, invoiceIds) {
    return this.request('/invoices/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, invoiceIds }),
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

  // Repair Request Services APIs
  async getRepairRequestServices(repairRequestId) {
    return this.request(`/repairrequestservices?repairRequestId=${repairRequestId}`);
  }

  async updateRepairRequestService(serviceId, serviceData) {
    return this.request(`/repairrequestservices/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteRepairRequestService(serviceId) {
    return this.request(`/repairrequestservices/${serviceId}`, {
      method: 'DELETE',
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
    return this.request('/auditlogs', { method: 'POST', body: JSON.stringify(payload) });
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
  // ==================
  // Notifications APIs
  // ==================
  
  // Get all notifications (with filters and pagination)
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.isRead !== undefined) queryParams.append('isRead', params.isRead);
    if (params.channel) queryParams.append('channel', params.channel);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const query = queryParams.toString();
    return this.request(`/notifications${query ? `?${query}` : ''}`);
  }
  
  // Get unread notifications count
  async getUnreadNotificationsCount() {
    return this.request('/notifications/unread/count');
  }
  
  // Get notification by ID
  async getNotification(id) {
    return this.request(`/notifications/${id}`);
  }
  
  // Create a new notification
  async createNotification(data) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // Update a notification
  async updateNotification(id, data) {
    return this.request(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  // Mark notification as read
  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }
  
  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    return this.request('/notifications/read/all', {
      method: 'PATCH'
    });
  }
  
  // Delete a notification
  async deleteNotification(id) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }
  
  // ==================
  // Notification Templates APIs (Admin only)
  // ==================
  
  // Get all notification templates
  async getNotificationTemplates() {
    return this.request('/notificationtemplates');
  }
  
  // Get notification template by ID
  async getNotificationTemplate(id) {
    return this.request(`/notificationtemplates/${id}`);
  }
  
  // Create a new notification template
  async createNotificationTemplate(data) {
    return this.request('/notificationtemplates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // Update a notification template
  async updateNotificationTemplate(id, data) {
    return this.request(`/notificationtemplates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  // Delete a notification template
  async deleteNotificationTemplate(id) {
    return this.request(`/notificationtemplates/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================
  // Service APIs
  // ==================
  
  // جلب جميع الخدمات
  async getServices() {
    return this.request('/services');
  }

  // جلب خدمة واحدة
  async getService(id) {
    return this.request(`/services/${id}`);
  }

  // إنشاء خدمة جديدة
  async createService(serviceData) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  // تحديث خدمة
  async updateService(id, serviceData) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  // حذف خدمة
  async deleteService(id) {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // جلب إحصائيات الخدمة
  async getServiceStats(id) {
    return this.request(`/services/${id}/stats`);
  }

  // ==================
  // Inventory APIs
  // ==================
  
  // جلب جميع عناصر المخزون
  async getInventoryItems() {
    return this.request('/inventory/items');
  }

  // جلب عنصر مخزون واحد
  async getInventoryItem(id) {
    return this.request(`/inventory/items/${id}`);
  }

  // إنشاء عنصر مخزون جديد
  async createInventoryItem(itemData) {
    return this.request('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  // تحديث عنصر المخزون
  async updateInventoryItem(id, itemData) {
    return this.request(`/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  // حذف عنصر المخزون
  async deleteInventoryItem(id) {
    return this.request(`/inventory/items/${id}`, {
      method: 'DELETE',
    });
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

  // ==================
  // Roles & Permissions APIs
  // ==================
  async listRoles() {
    return this.request('/roles'); // Admin-only
  }

  async getRole(id) {
    return this.request(`/roles/${id}`);
  }

  async createRole(payload) {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateRole(id, payload) {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteRole(id) {
    return this.request(`/roles/${id}`, { method: 'DELETE' });
  }

  // ==================
  // Inventory APIs
  // ==================
  
  // جلب جميع عناصر المخزون
  async getInventoryItems(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/inventory${qs ? `?${qs}` : ''}`);
  }

  // جلب عنصر مخزون واحد
  async getInventoryItem(id) {
    return this.request(`/inventory/${id}`);
  }

  // جلب جميع الخدمات
  async getServices(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/services${qs ? `?${qs}` : ''}`);
  }

  // ==================
  // System Settings APIs
  // ==================
  async listSystemSettings() {
    return this.request('/systemsettings');
  }

  async getSystemSetting(key) {
    return this.request(`/systemsettings/${encodeURIComponent(key)}`);
  }

  async createSystemSetting(setting) {
    return this.request('/systemsettings', {
      method: 'POST',
      body: JSON.stringify(setting),
    });
  }

  async updateSystemSetting(key, setting) {
    return this.request(`/systemsettings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(setting),
    });
  }

  async deleteSystemSetting(key) {
    return this.request(`/systemsettings/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const apiService = new ApiService();

export default apiService;
export { apiService };
