import apiService from './api';

const paymentsService = {
  // Get all payments
  getAllPayments: async () => {
    const response = await apiService.request('/payments', {
      method: 'GET'
    });
    return response.json();
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    const response = await apiService.request(`/payments/${id}`, {
      method: 'GET'
    });
    return response.json();
  },

  // Get payments by invoice ID
  getPaymentsByInvoice: async (invoiceId) => {
    const response = await apiService.request(`/payments/invoice/${invoiceId}`, {
      method: 'GET'
    });
    return response.json();
  },

  // Create a new payment
  createPayment: async (paymentData) => {
    const response = await apiService.request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    return response.json();
  },

  // Update a payment
  updatePayment: async (id, paymentData) => {
    const response = await apiService.request(`/payments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    return response.json();
  },

  // Delete a payment
  deletePayment: async (id) => {
    const response = await apiService.request(`/payments/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};

export default paymentsService;
