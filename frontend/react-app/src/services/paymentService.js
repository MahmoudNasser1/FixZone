import apiService from './api';

class PaymentService {
  // Get all payments with filters and pagination
  async getAllPayments(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    return await apiService.request(`/payments?${queryParams.toString()}`);
  }

  // Get payment by ID
  async getPaymentById(id) {
    return await apiService.request(`/payments/${id}`);
  }

  // Get payments by invoice ID
  async getPaymentsByInvoice(invoiceId) {
    return await apiService.request(`/payments/invoice/${invoiceId}`);
  }

  // Create new payment
  async createPayment(paymentData) {
    console.log('PaymentService.createPayment called with:', paymentData);
    const response = await apiService.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    return response;
  }

  // Update payment
  async updatePayment(id, paymentData) {
    return await apiService.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
  }

  // Delete payment
  async deletePayment(id) {
    return await apiService.request(`/payments/${id}`, {
      method: 'DELETE'
    });
  }

  // Get payment statistics
  async getPaymentStats(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    return await apiService.request(`/payments/stats/summary?${queryParams.toString()}`);
  }

  // Get overdue payments
  async getOverduePayments() {
    return await apiService.request('/payments/overdue/list');
  }

  // Get payment methods options
  getPaymentMethods() {
    return [
      { value: 'cash', label: 'نقدي', icon: '💵' },
      { value: 'card', label: 'بطاقة ائتمان', icon: '💳' },
      { value: 'bank_transfer', label: 'تحويل بنكي', icon: '🏦' },
      { value: 'check', label: 'شيك', icon: '📄' },
      { value: 'other', label: 'أخرى', icon: '📝' }
    ];
  }

  // Format payment amount
  formatAmount(amount, currency = 'EGP') {
    if (!amount && amount !== 0) {
      return '0.00 ج.م';
    }
    try {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(Number(amount));
    } catch (error) {
      console.error('Error formatting amount:', error, 'Amount:', amount);
      return `${Number(amount || 0).toFixed(2)} ${currency}`;
    }
  }

  // Format payment date
  formatDate(date) {
    if (!date) {
      return 'غير محدد';
    }
    
    try {
      const dateObj = new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'تاريخ غير صحيح';
      }
      
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'تاريخ غير صحيح';
    }
  }

  // Get payment status color
  getPaymentStatusColor(status) {
    const colors = {
      'paid': 'green',
      'partially_paid': 'yellow',
      'overdue': 'red',
      'draft': 'gray'
    };
    return colors[status] || 'gray';
  }

  // Get payment method icon
  getPaymentMethodIcon(method) {
    const icons = {
      'cash': '💵',
      'card': '💳',
      'bank_transfer': '🏦',
      'check': '📄',
      'other': '📝'
    };
    return icons[method] || '📝';
  }

  // Calculate payment progress
  calculateProgress(totalAmount, paidAmount) {
    if (totalAmount === 0) return 0;
    return Math.min((paidAmount / totalAmount) * 100, 100);
  }

  // Validate payment data
  validatePaymentData(data) {
    const errors = {};

    if (!data.amount || data.amount <= 0) {
      errors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (!data.paymentMethod) {
      errors.paymentMethod = 'طريقة الدفع مطلوبة';
    }

    if (!data.invoiceId) {
      errors.invoiceId = 'رقم الفاتورة مطلوب';
    }

    if (!data.paymentDate) {
      errors.paymentDate = 'تاريخ الدفع مطلوب';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new PaymentService();
