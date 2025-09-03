import apiService from './api';

/**
 * Invoices Service - Enhanced with new API endpoints
 * Supports: Advanced filtering, pagination, bulk actions, statistics
 */
const invoicesService = {
  // جلب قائمة الفواتير مع فلترة متقدمة
  async listInvoices(params = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      customerId = '',
      repairRequestId = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = params;
    
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(customerId && { customerId }),
      ...(repairRequestId && { repairRequestId }),
      sortBy,
      sortOrder
    });
    
    return apiService.request(`/invoices?${query}`);
  },

  // جلب فاتورة واحدة مع التفاصيل الكاملة
  async getInvoice(id) {
    return apiService.request(`/invoices/${id}`);
  },

  // إنشاء فاتورة جديدة مع ربط تلقائي للقطع والخدمات
  async createInvoice(data) {
    return apiService.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // تحديث فاتورة
  async updateInvoice(id, data) {
    return apiService.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // حذف فاتورة (soft delete)
  async deleteInvoice(id) {
    return apiService.request(`/invoices/${id}`, {
      method: 'DELETE'
    });
  },

  // العمليات المجمعة للفواتير
  async bulkAction(action, invoiceIds, data = {}) {
    return apiService.request('/invoices/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, invoiceIds, data })
    });
  },

  // جلب إحصائيات الفواتير
  async getStatistics(period = '30') {
    return apiService.request(`/invoices/stats?period=${period}`);
  },

  // إنشاء PDF للفاتورة
  async generatePDF(invoiceId) {
    return apiService.request(`/invoices/${invoiceId}/pdf`);
  },

  // تحديث حالة فاتورة
  async updateStatus(invoiceId, status) {
    return this.updateInvoice(invoiceId, { status });
  },

  // تحديد فاتورة كمدفوعة
  async markAsPaid(invoiceId, amountPaid = null) {
    const updateData = { status: 'paid' };
    if (amountPaid !== null) {
      updateData.amountPaid = amountPaid;
    }
    return this.updateInvoice(invoiceId, updateData);
  },

  // إرسال فاتورة
  async sendInvoice(invoiceId) {
    return this.updateInvoice(invoiceId, { status: 'sent' });
  },

  // جلب عناصر الفاتورة (يتم تضمينها في getInvoice الآن)
  async getInvoiceItems(invoiceId) {
    const invoice = await this.getInvoice(invoiceId);
    return invoice.success ? invoice.data.items || [] : [];
  },

  // إضافة عنصر إلى الفاتورة (قطعة أو خدمة)
  async addItem(invoiceId, payload) {
    // payload: { inventoryItemId?, serviceId?, quantity?, unitPrice?, partsUsedId?, description? }
    return apiService.request(`/invoices/${invoiceId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // تحديث عنصر في الفاتورة
  async updateInvoiceItem(invoiceId, itemId, data) {
    return apiService.request(`/invoices/${invoiceId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // حذف عنصر من الفاتورة
  async removeItem(invoiceId, itemId) {
    return apiService.request(`/invoices/${invoiceId}/items/${itemId}`, {
      method: 'DELETE'
    });
  }
};

export default invoicesService;
