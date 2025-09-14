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
    
    const response = await apiService.request(`/payments?${queryParams.toString()}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Get payment by ID
  async getPaymentById(id) {
    const response = await apiService.request(`/payments/${id}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Get payments by invoice ID
  async getPaymentsByInvoice(invoiceId) {
    const response = await apiService.request(`/payments/invoice/${invoiceId}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Create new payment
  async createPayment(paymentData) {
    const response = await apiService.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Update payment
  async updatePayment(id, paymentData) {
    const response = await apiService.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Delete payment
  async deletePayment(id) {
    const response = await apiService.request(`/payments/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Get payment statistics
  async getPaymentStats(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await apiService.request(`/payments/stats/summary?${queryParams.toString()}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Get overdue payments
  async getOverduePayments() {
    const response = await apiService.request('/payments/overdue/list');
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Format payment date
  formatDate(date) {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
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
