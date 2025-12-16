// frontend/react-app/src/services/messagingService.js
// Messaging Service - الخدمة الموحدة للمراسلة في Frontend

import apiService from './api';

class MessagingService {
  /**
   * تحميل إعدادات المراسلة
   * @returns {Promise<object>} - إعدادات المراسلة
   */
  async loadSettings() {
    try {
      const response = await apiService.request('/messaging/settings');
      return response.data || response;
    } catch (error) {
      console.error('Error loading messaging settings:', error);
      // إرجاع إعدادات افتراضية
      return {
        whatsapp: {
          enabled: true,
          webEnabled: true,
          apiEnabled: false,
          apiUrl: '',
          apiToken: '',
          defaultMessage: 'مرحباً {customerName}، فاتورتك رقم #{invoiceId} جاهزة بمبلغ {amount} {currency}. يمكنك تحميلها من: {invoiceLink}',
          repairReceivedMessage: 'جهازك وصل Fix Zone يا فندم\n\nده ملخص الطلب:\n• رقم الطلب: {repairNumber}\n• الجهاز: {deviceInfo}\n• المشكلة: {problem}{oldInvoiceNumber}\n\nتقدر تشوف التحديثات أول بأول من هنا:\n{trackingUrl}\n\nفريق الفنيين هيبدأ الفحص خلال الساعات القادمة.'
        },
        email: {
          enabled: false,
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: 'Fix Zone ERP',
          defaultSubject: 'فاتورة #{invoiceId} - Fix Zone',
          defaultTemplate: 'مرحباً {customerName},\n\nنرسل لك فاتورة الإصلاح رقم #{invoiceId}\n\nتفاصيل الفاتورة:\n- المبلغ الإجمالي: {amount} {currency}\n- تاريخ الإصدار: {issueDate}\n- حالة الدفع: {status}\n\nيمكنك تحميل الفاتورة من الرابط التالي:\n{invoiceLink}\n\nشكراً لتعاملكم معنا\nفريق Fix Zone'
        }
      };
    }
  }

  /**
   * إرسال فاتورة
   * @param {number} invoiceId - معرف الفاتورة
   * @param {object} options - خيارات الإرسال
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendInvoice(invoiceId, options = {}) {
    try {
      // جلب بيانات الفاتورة
      const invoice = await apiService.getInvoiceById(invoiceId);
      const invoiceData = invoice.data || invoice;

      // جلب بيانات العميل
      let customer = {};
      if (invoiceData.customerId) {
        try {
          const customerData = await apiService.getCustomer(invoiceData.customerId);
          customer = customerData.data || customerData;
        } catch (e) {
          console.warn('Could not load customer data:', e);
        }
      }

      // جلب عناصر الفاتورة
      let invoiceItems = [];
      try {
        const itemsData = await apiService.getInvoiceItems(invoiceId);
        invoiceItems = Array.isArray(itemsData.data) ? itemsData.data : (Array.isArray(itemsData) ? itemsData : []);
      } catch (e) {
        console.warn('Could not load invoice items:', e);
      }

      // تحديد القنوات
      let channels = options.channels || ['whatsapp'];
      if (!Array.isArray(channels)) {
        channels = [channels];
      }

      // تحديد المستلم
      const recipient = options.recipient || customer.phone || customer.phoneNumber;
      if (!recipient) {
        throw new Error('لا يوجد رقم هاتف أو بريد إلكتروني للعميل');
      }

      // تحديد المستلم حسب القناة
      let emailRecipient = null;
      let whatsappRecipient = null;

      if (channels.includes('email')) {
        emailRecipient = options.emailRecipient || customer.email || customer.emailAddress;
        if (!emailRecipient) {
          throw new Error('لا يوجد بريد إلكتروني للعميل');
        }
      }

      if (channels.includes('whatsapp')) {
        whatsappRecipient = recipient;
      }

      // إرسال الرسالة
      const result = await apiService.request('/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'invoice',
          entityId: invoiceId,
          customerId: invoiceData.customerId,
          channels: channels,
          recipient: whatsappRecipient || emailRecipient || recipient,
          template: 'defaultMessage',
          variables: await this.prepareInvoiceVariables(invoiceData, customer, invoiceItems),
          options: {
            preferAPI: options.preferAPI !== false,
            preferWeb: options.preferWeb !== false,
            isHtml: options.isHtml !== false,
            subject: options.subject,
            attachPDF: options.attachPDF !== false,
            emailRecipient: emailRecipient
          }
        })
      });

      // إذا كان WhatsApp Web، فتح الرابط
      if (result.data?.channels?.whatsapp?.url) {
        window.open(result.data.channels.whatsapp.url, '_blank');
      }

      return result;
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * إرسال إشعار طلب إصلاح
   * @param {number} repairId - معرف طلب الإصلاح
   * @param {string} notificationType - نوع الإشعار
   * @param {object} options - خيارات الإرسال
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendRepairNotification(repairId, notificationType, options = {}) {
    try {
      // جلب بيانات طلب الإصلاح
      const repair = await apiService.getRepairRequest(repairId);
      const repairData = repair.data || repair;

      // جلب بيانات العميل
      let customer = {};
      if (repairData.customerId) {
        try {
          const customerData = await apiService.getCustomer(repairData.customerId);
          customer = customerData.data || customerData;
        } catch (e) {
          console.warn('Could not load customer data:', e);
        }
      }

      // تحديد القنوات
      let channels = options.channels || ['whatsapp'];
      if (!Array.isArray(channels)) {
        channels = [channels];
      }

      // تحديد المستلم
      const recipient = options.recipient || customer.phone || customer.phoneNumber;
      if (!recipient) {
        throw new Error('لا يوجد رقم هاتف أو بريد إلكتروني للعميل');
      }

      // تحديد القالب حسب نوع الإشعار
      let template = 'repairReceivedMessage';
      if (notificationType === 'diagnosis_complete') {
        template = 'diagnosisCompleteMessage';
      } else if (notificationType === 'completed') {
        template = 'repairCompletedMessage';
      } else if (notificationType === 'ready_pickup') {
        template = 'readyPickupMessage';
      }

      // إرسال الرسالة
      const result = await apiService.request('/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'repair',
          entityId: repairId,
          customerId: repairData.customerId,
          channels: channels,
          recipient: recipient,
          template: template,
          variables: await this.prepareRepairVariables(repairData, customer),
          options: {
            preferAPI: options.preferAPI !== false,
            preferWeb: options.preferWeb !== false
          }
        })
      });

      // إذا كان WhatsApp Web، فتح الرابط
      if (result.data?.channels?.whatsapp?.url) {
        window.open(result.data.channels.whatsapp.url, '_blank');
      }

      return result;
    } catch (error) {
      console.error('Error sending repair notification:', error);
      throw error;
    }
  }

  /**
   * إرسال عرض سعر
   * @param {number} quotationId - معرف العرض
   * @param {object} options - خيارات الإرسال
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendQuotation(quotationId, options = {}) {
    try {
      // جلب بيانات العرض (يحتاج API endpoint)
      // TODO: إضافة API endpoint للعروض
      throw new Error('Not implemented yet - يحتاج API endpoint للعروض');
    } catch (error) {
      console.error('Error sending quotation:', error);
      throw error;
    }
  }

  /**
   * إرسال تذكير دفع
   * @param {number} paymentId - معرف الدفعة
   * @param {object} options - خيارات الإرسال
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendPaymentReminder(paymentId, options = {}) {
    try {
      // جلب بيانات الدفعة
      const payment = await apiService.getPaymentById(paymentId);
      const paymentData = payment.data || payment;

      // جلب بيانات الفاتورة
      let invoice = {};
      if (paymentData.invoiceId) {
        try {
          const invoiceData = await apiService.getInvoiceById(paymentData.invoiceId);
          invoice = invoiceData.data || invoiceData;
        } catch (e) {
          console.warn('Could not load invoice data:', e);
        }
      }

      // جلب بيانات العميل
      let customer = {};
      if (invoice.customerId) {
        try {
          const customerData = await apiService.getCustomer(invoice.customerId);
          customer = customerData.data || customerData;
        } catch (e) {
          console.warn('Could not load customer data:', e);
        }
      }

      // تحديد القنوات
      let channels = options.channels || ['whatsapp'];
      if (!Array.isArray(channels)) {
        channels = [channels];
      }

      // تحديد المستلم
      const recipient = options.recipient || customer.phone || customer.phoneNumber;
      if (!recipient) {
        throw new Error('لا يوجد رقم هاتف أو بريد إلكتروني للعميل');
      }

      // إرسال الرسالة
      const result = await apiService.request('/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'payment',
          entityId: paymentId,
          customerId: invoice.customerId,
          channels: channels,
          recipient: recipient,
          template: 'paymentReminderMessage',
          variables: await this.preparePaymentVariables(paymentData, invoice, customer),
          options: {
            preferAPI: options.preferAPI !== false,
            preferWeb: options.preferWeb !== false
          }
        })
      });

      // إذا كان WhatsApp Web، فتح الرابط
      if (result.data?.channels?.whatsapp?.url) {
        window.open(result.data.channels.whatsapp.url, '_blank');
      }

      return result;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  /**
   * الحصول على سجل المراسلات
   * @param {object} filters - فلاتر البحث
   * @param {object} pagination - معلومات الصفحات
   * @returns {Promise<object>} - السجلات
   */
  async getMessageLogs(filters = {}, pagination = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.entityId) params.append('entityId', filters.entityId);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.status) params.append('status', filters.status);
      if (filters.recipient) params.append('recipient', filters.recipient);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      if (pagination.limit) params.append('limit', pagination.limit);
      if (pagination.offset) params.append('offset', pagination.offset);

      const response = await apiService.request(`/messaging/logs?${params.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error('Error getting message logs:', error);
      throw error;
    }
  }

  /**
   * إعادة محاولة إرسال رسالة فاشلة
   * @param {number} logId - معرف السجل
   * @returns {Promise<object>} - نتيجة إعادة المحاولة
   */
  async retryMessage(logId) {
    try {
      const response = await apiService.request(`/messaging/retry/${logId}`, {
        method: 'POST'
      });
      return response.data || response;
    } catch (error) {
      console.error('Error retrying message:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المراسلات
   * @param {object} filters - فلاتر البحث
   * @returns {Promise<object>} - الإحصائيات
   */
  /**
   * الحصول على إحصائيات المراسلات
   * @param {object} filters - فلاتر الإحصائيات
   * @param {string} filters.dateFrom - تاريخ البداية (YYYY-MM-DD)
   * @param {string} filters.dateTo - تاريخ النهاية (YYYY-MM-DD)
   * @param {string} filters.channel - القناة (whatsapp, email)
   * @param {string} filters.entityType - نوع الكيان (invoice, repair, quotation, payment)
   * @param {string} filters.groupBy - التجميع (day, week, month)
   * @returns {Promise<object>} - الإحصائيات
   */
  async getStats(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);

      const response = await apiService.request(`/messaging/stats?${params.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  // ============================================
  // Helper Functions - تحضير المتغيرات
  // ============================================

  /**
   * تحضير متغيرات القالب للفاتورة
   */
  async prepareInvoiceVariables(invoice, customer, invoiceItems = []) {
    const calculatedTotal = invoiceItems.reduce((sum, item) => {
      return sum + (parseFloat(item.totalPrice) || 0);
    }, 0);
    
    const subtotal = invoiceItems.length > 0 && calculatedTotal > 0 
      ? calculatedTotal 
      : (parseFloat(invoice.totalAmount) || 0);
    
    const discountPercent = parseFloat(invoice.discountPercent) || 0;
    const discountAmount = discountPercent > 0 && subtotal > 0 
      ? (subtotal * discountPercent) / 100 
      : (parseFloat(invoice.discountAmount) || 0);
    
    const taxAmount = parseFloat(invoice.taxAmount) || 0;
    const shippingAmount = parseFloat(invoice.shippingAmount) || 0;
    const finalTotal = subtotal - discountAmount + taxAmount + shippingAmount;
    const amountPaid = parseFloat(invoice.amountPaid) || 0;
    const remainingAmount = finalTotal - amountPaid;

    const formatDate = (date) => {
      if (!date) return 'غير محدد';
      try {
        return new Date(date).toLocaleDateString('en-GB');
      } catch {
        return 'تاريخ غير صحيح';
      }
    };

    const formatMoney = (amount, currency = 'EGP') => {
      return `${parseFloat(amount || 0).toFixed(2)} ${currency}`;
    };

    return {
      customerName: customer.firstName || customer.name || 'العميل',
      invoiceId: invoice.id || 'غير محدد',
      invoiceDate: formatDate(invoice.createdAt),
      totalAmount: formatMoney(finalTotal, invoice.currency || 'EGP'),
      amountPaid: formatMoney(amountPaid, invoice.currency || 'EGP'),
      remainingAmount: formatMoney(remainingAmount, invoice.currency || 'EGP'),
      currency: invoice.currency || 'EGP',
      dueDate: formatDate(invoice.dueDate),
      invoiceLink: `${window.location.origin}/invoices/${invoice.id}`,
      status: this.getInvoiceStatusLabel(invoice.status)
    };
  }

  /**
   * تحضير متغيرات القالب لطلب الإصلاح
   */
  async prepareRepairVariables(repair, customer) {
    const formatDate = (date) => {
      if (!date) return 'غير محدد';
      try {
        return new Date(date).toLocaleDateString('en-GB');
      } catch {
        return 'تاريخ غير صحيح';
      }
    };

    const deviceInfo = `${repair.deviceBrand || ''} ${repair.deviceModel || ''}`.trim() || 'غير محدد';
    // استخدام reportedProblem أو problemDescription (الحقول الفعلية من API)
    const problem = repair.reportedProblem || repair.problemDescription || repair.problem || repair.description || 'غير محدد';
    
    // تسجيل للمساعدة في التصحيح
    if (!problem || problem === 'غير محدد') {
      console.warn('[MESSAGING] ⚠️ Problem statement is missing or undefined:', {
        repairId: repair.id,
        hasReportedProblem: !!repair.reportedProblem,
        hasProblemDescription: !!repair.problemDescription,
        reportedProblem: repair.reportedProblem ? `${String(repair.reportedProblem).substring(0, 50)}...` : 'NULL',
        problemDescription: repair.problemDescription ? `${String(repair.problemDescription).substring(0, 50)}...` : 'NULL'
      });
    }
    
    // استخدام trackingToken بدلاً من ID في رابط التتبع
    const trackingToken = repair.trackingToken || repair.id;
    const trackingUrl = `${window.location.origin}/track?trackingToken=${trackingToken}`;

    let oldInvoiceNumberText = '';
    if (repair.oldInvoiceNumber) {
      oldInvoiceNumberText = `\n• فاتورة قديمة: #${repair.oldInvoiceNumber}`;
    }

    // استخدام requestNumber إذا كان متوفراً، وإلا استخدم id
    const repairNumber = repair.requestNumber || repair.id || 'غير محدد';

    return {
      customerName: customer.firstName || customer.name || 'العميل',
      repairNumber: repairNumber,
      deviceInfo: deviceInfo,
      problem: problem,
      diagnosis: repair.diagnosticNotes || repair.technicianReport || 'قيد التشخيص',
      estimatedCost: repair.estimatedCost ? `${repair.estimatedCost} ${repair.currency || 'EGP'}` : 'قيد التحديد',
      trackingUrl: trackingUrl,
      oldInvoiceNumber: oldInvoiceNumberText,
      status: this.getRepairStatusLabel(repair.status),
      location: 'مول البستان التجاري - الدور الأرضي - باب اللوق - القاهرة'
    };
  }

  /**
   * تحضير متغيرات القالب للمدفوعات
   */
  async preparePaymentVariables(payment, invoice, customer) {
    const formatDate = (date) => {
      if (!date) return 'غير محدد';
      try {
        return new Date(date).toLocaleDateString('en-GB');
      } catch {
        return 'تاريخ غير صحيح';
      }
    };

    const formatMoney = (amount, currency = 'EGP') => {
      return `${parseFloat(amount || 0).toFixed(2)} ${currency}`;
    };

    const invoiceTotal = parseFloat(invoice.totalAmount) || 0;
    const amountPaid = parseFloat(payment.amount) || 0;
    const previousPaid = parseFloat(invoice.amountPaid) || 0;
    const remainingAmount = invoiceTotal - (previousPaid + amountPaid);

    return {
      customerName: customer.firstName || customer.name || 'العميل',
      paymentAmount: formatMoney(amountPaid, payment.currency || 'EGP'),
      invoiceId: invoice.id || 'غير محدد',
      remainingAmount: formatMoney(remainingAmount, invoice.currency || 'EGP'),
      currency: payment.currency || invoice.currency || 'EGP',
      paymentDate: formatDate(payment.paymentDate || payment.createdAt),
      dueDate: formatDate(invoice.dueDate),
      paymentLink: `${window.location.origin}/payments/${payment.id}`
    };
  }

  /**
   * الحصول على نص حالة الفاتورة
   */
  getInvoiceStatusLabel(status) {
    const labels = {
      'paid': 'مدفوعة',
      'unpaid': 'غير مدفوعة',
      'partial': 'مدفوعة جزئياً',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة',
      'draft': 'مسودة'
    };
    return labels[status] || status;
  }

  /**
   * الحصول على نص حالة طلب الإصلاح
   */
  getRepairStatusLabel(status) {
    const labels = {
      'received': 'تم الاستلام',
      'diagnosed': 'تم التشخيص',
      'quote_ready': 'العرض جاهز',
      'quote_sent': 'تم إرسال العرض',
      'in_progress': 'قيد الإصلاح',
      'completed': 'اكتمل الإصلاح',
      'ready_pickup': 'جاهز للاستلام',
      'delivered': 'تم التسليم'
    };
    return labels[status] || status;
  }
}

export default new MessagingService();

