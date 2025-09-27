import apiService from './api';

class NotificationService {
  
  // إرسال إشعار للمدفوعات المتأخرة
  async sendOverduePaymentNotification(paymentId, customerId) {
    try {
      const response = await apiService.request('/notifications/overdue-payment', {
        method: 'POST',
        body: JSON.stringify({
          paymentId,
          customerId,
          type: 'overdue_payment',
          priority: 'high'
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error sending overdue payment notification:', error);
      throw error;
    }
  }

  // إرسال تذكير للمدفوعات
  async sendPaymentReminder(paymentId, customerId, reminderType = 'gentle') {
    try {
      const response = await apiService.request('/notifications/payment-reminder', {
        method: 'POST',
        body: JSON.stringify({
          paymentId,
          customerId,
          reminderType, // gentle, firm, urgent
          type: 'payment_reminder'
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  // إرسال إشعار للفواتير الجديدة
  async sendNewInvoiceNotification(invoiceId, customerId) {
    try {
      const response = await apiService.request('/notifications/new-invoice', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId,
          customerId,
          type: 'new_invoice'
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error sending new invoice notification:', error);
      throw error;
    }
  }

  // إرسال إشعار لاستلام المدفوعات
  async sendPaymentReceivedNotification(paymentId, customerId) {
    try {
      const response = await apiService.request('/notifications/payment-received', {
        method: 'POST',
        body: JSON.stringify({
          paymentId,
          customerId,
          type: 'payment_received'
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error sending payment received notification:', error);
      throw error;
    }
  }

  // إرسال إشعارات مجمعة
  async sendBulkNotifications(notificationData) {
    try {
      const response = await apiService.request('/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify({
          notifications: notificationData,
          type: 'bulk_notification'
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // جدولة الإشعارات التلقائية
  async scheduleAutomaticNotifications() {
    try {
      const response = await apiService.request('/notifications/schedule', {
        method: 'POST',
        body: JSON.stringify({
          type: 'automatic_schedule',
          scheduleType: 'daily' // daily, weekly, monthly
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error scheduling automatic notifications:', error);
      throw error;
    }
  }

  // الحصول على قائمة الإشعارات
  async getNotifications(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await apiService.request(`/notifications?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // تحديث حالة الإشعار
  async updateNotificationStatus(notificationId, status) {
    try {
      const response = await apiService.request(`/notifications/${notificationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      return response;
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }

  // حذف الإشعار
  async deleteNotification(notificationId) {
    try {
      const response = await apiService.request(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // إعدادات الإشعارات
  async getNotificationSettings() {
    try {
      const response = await apiService.request('/notifications/settings');
      return response;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  }

  // تحديث إعدادات الإشعارات
  async updateNotificationSettings(settings) {
    try {
      const response = await apiService.request('/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      
      return response;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // قوالب الإشعارات
  async getNotificationTemplates() {
    try {
      const response = await apiService.request('/notifications/templates');
      return response;
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }
  }

  // إنشاء قالب إشعار جديد
  async createNotificationTemplate(template) {
    try {
      const response = await apiService.request('/notifications/templates', {
        method: 'POST',
        body: JSON.stringify(template)
      });
      
      return response;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  }

  // تحديث قالب الإشعار
  async updateNotificationTemplate(templateId, template) {
    try {
      const response = await apiService.request(`/notifications/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(template)
      });
      
      return response;
    } catch (error) {
      console.error('Error updating notification template:', error);
      throw error;
    }
  }

  // حذف قالب الإشعار
  async deleteNotificationTemplate(templateId) {
    try {
      const response = await apiService.request(`/notifications/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error('Error deleting notification template:', error);
      throw error;
    }
  }

  // إحصائيات الإشعارات
  async getNotificationStats() {
    try {
      const response = await apiService.request('/notifications/stats');
      return response;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  // إرسال إشعار فوري
  async sendInstantNotification(notificationData) {
    try {
      const response = await apiService.request('/notifications/instant', {
        method: 'POST',
        body: JSON.stringify({
          ...notificationData,
          type: 'instant_notification'
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error sending instant notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();


