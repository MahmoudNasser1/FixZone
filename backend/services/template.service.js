// backend/services/template.service.js
// Template Service - خدمة معالجة قوالب الرسائل

const settingsRepository = require('../repositories/settingsRepository');

class TemplateService {
  /**
   * تحميل قالب من الإعدادات
   * @param {string} templateName - اسم القالب
   * @param {string} entityType - نوع الكيان (invoice, repair, quotation, payment)
   * @returns {Promise<string>} - القالب كـ string
   */
  async loadTemplate(templateName, entityType = null) {
    try {
      const settings = await settingsRepository.findByKey('messaging_settings');
      
      // Default messaging settings if not found
      let messagingSettings = null;
      if (settings && settings.value) {
        messagingSettings = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
      } else {
        // Use default settings when messaging_settings doesn't exist
        messagingSettings = {
          whatsapp: {
            enabled: true,
            webEnabled: true,
            apiEnabled: false,
            defaultMessage: 'مرحباً {customerName}، فاتورتك رقم #{invoiceId} جاهزة بمبلغ {amount} {currency}. يمكنك تحميلها من: {invoiceLink}',
            repairReceivedMessage: 'جهازك وصل Fix Zone يا فندم\n\nده ملخص الطلب:\n• رقم الطلب: {repairNumber}\n• الجهاز: {deviceInfo}\n• المشكلة: {problem}{oldInvoiceNumber}\n\nتقدر تشوف التحديثات أول بأول من هنا:\n{trackingUrl}\n\nفريق الفنيين هيبدأ الفحص خلال الساعات القادمة.'
          },
          email: {
            enabled: false
          }
        };
      }

      // البحث عن القالب حسب النوع والاسم
      // قوالب الفواتير
      if (entityType === 'invoice' && messagingSettings.whatsapp?.defaultMessage) {
        return messagingSettings.whatsapp.defaultMessage;
      }
      
      // قوالب طلبات الإصلاح
      if (entityType === 'repair') {
        if (templateName === 'repairReceivedMessage' && messagingSettings.whatsapp?.repairReceivedMessage) {
          return messagingSettings.whatsapp.repairReceivedMessage;
        }
        if (templateName === 'diagnosisCompleteMessage' && messagingSettings.whatsapp?.diagnosisCompleteMessage) {
          return messagingSettings.whatsapp.diagnosisCompleteMessage;
        }
        if (templateName === 'repairCompletedMessage' && messagingSettings.whatsapp?.repairCompletedMessage) {
          return messagingSettings.whatsapp.repairCompletedMessage;
        }
        if (templateName === 'readyPickupMessage' && messagingSettings.whatsapp?.readyPickupMessage) {
          return messagingSettings.whatsapp.readyPickupMessage;
        }
        if (templateName === 'waitingPartsMessage' && messagingSettings.whatsapp?.waitingPartsMessage) {
          return messagingSettings.whatsapp.waitingPartsMessage;
        }
        if (templateName === 'awaitingApprovalMessage' && messagingSettings.whatsapp?.awaitingApprovalMessage) {
          return messagingSettings.whatsapp.awaitingApprovalMessage;
        }
        if (templateName === 'underRepairMessage' && messagingSettings.whatsapp?.underRepairMessage) {
          return messagingSettings.whatsapp.underRepairMessage;
        }
        if (templateName === 'deliveredMessage' && messagingSettings.whatsapp?.deliveredMessage) {
          return messagingSettings.whatsapp.deliveredMessage;
        }
        if (templateName === 'completedMessage' && messagingSettings.whatsapp?.completedMessage) {
          return messagingSettings.whatsapp.completedMessage;
        }
        if (templateName === 'rejectedMessage' && messagingSettings.whatsapp?.rejectedMessage) {
          return messagingSettings.whatsapp.rejectedMessage;
        }
        if (templateName === 'onHoldMessage' && messagingSettings.whatsapp?.onHoldMessage) {
          return messagingSettings.whatsapp.onHoldMessage;
        }
        // افتراضي لطلبات الإصلاح
        if (messagingSettings.whatsapp?.repairReceivedMessage) {
          return messagingSettings.whatsapp.repairReceivedMessage;
        }
      }

      // قوالب العروض السعرية
      if (entityType === 'quotation') {
        if (templateName === 'quotation_default' && messagingSettings.whatsapp?.quotationDefaultMessage) {
          return messagingSettings.whatsapp.quotationDefaultMessage;
        }
        if (templateName === 'quotation_approved' && messagingSettings.whatsapp?.quotationApprovedMessage) {
          return messagingSettings.whatsapp.quotationApprovedMessage;
        }
        // افتراضي للعروض
        if (messagingSettings.whatsapp?.quotationDefaultMessage) {
          return messagingSettings.whatsapp.quotationDefaultMessage;
        }
      }

      // قوالب تذكيرات الدفع
      if (templateName === 'payment_overdue_reminder' && messagingSettings.whatsapp?.paymentOverdueReminder) {
        return messagingSettings.whatsapp.paymentOverdueReminder;
      }
      if (templateName === 'payment_before_due_reminder' && messagingSettings.whatsapp?.paymentBeforeDueReminder) {
        return messagingSettings.whatsapp.paymentBeforeDueReminder;
      }

      // البحث في قوالب محددة (legacy)
      if (messagingSettings.templates && messagingSettings.templates[templateName]) {
        return messagingSettings.templates[templateName];
      }

      // قالب افتراضي
      return templateName || 'مرحباً {customerName}';
    } catch (error) {
      console.error('Error loading template:', error);
      // Return default template instead of throwing
      // This prevents the system from crashing when settings are missing
      if (entityType === 'repair') {
        return 'جهازك وصل Fix Zone يا فندم\n\nده ملخص الطلب:\n• رقم الطلب: {repairNumber}\n• الجهاز: {deviceInfo}\n• المشكلة: {problem}{oldInvoiceNumber}\n\nتقدر تشوف التحديثات أول بأول من هنا:\n{trackingUrl}\n\nفريق الفنيين هيبدأ الفحص خلال الساعات القادمة.';
      }
      return templateName || 'مرحباً {customerName}';
    }
  }

  /**
   * استبدال المتغيرات في القالب
   * @param {string} template - القالب
   * @param {object} variables - المتغيرات
   * @returns {string} - القالب بعد الاستبدال
   */
  render(template, variables = {}) {
    if (!template || typeof template !== 'string') {
      return '';
    }

    let rendered = template;

    // استبدال جميع المتغيرات بالصيغة {variableName}
    Object.keys(variables).forEach(key => {
      const value = variables[key] !== null && variables[key] !== undefined 
        ? String(variables[key]) 
        : '';
      
      // استبدال {key} أو {key} في أي مكان
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    // إزالة المتغيرات غير المستبدلة (اختياري - يمكن إبقاؤها للتحقق)
    // rendered = rendered.replace(/\{[^}]+\}/g, '');

    return rendered;
  }

  /**
   * تحضير متغيرات القالب للفاتورة
   * @param {object} invoice - بيانات الفاتورة
   * @param {object} customer - بيانات العميل
   * @param {array} invoiceItems - عناصر الفاتورة
   * @returns {object} - المتغيرات
   */
  async prepareInvoiceVariables(invoice, customer = {}, invoiceItems = []) {
    try {
      // حساب المبالغ
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

      // تنسيق التاريخ
      const formatDate = (date) => {
        if (!date) return 'غير محدد';
        try {
          const d = new Date(date);
          return d.toLocaleDateString('en-GB');
        } catch {
          return 'تاريخ غير صحيح';
        }
      };

      // تنسيق المبلغ
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
        invoiceLink: (() => {
          const { getFrontendUrl } = require('../utils/frontendUrl');
          return `${getFrontendUrl()}/invoices/${invoice.id}`;
        })(),
        status: this.getInvoiceStatusLabel(invoice.status)
      };
    } catch (error) {
      console.error('Error preparing invoice variables:', error);
      throw error;
    }
  }

  /**
   * تحضير متغيرات القالب لطلب الإصلاح
   * @param {object} repair - بيانات طلب الإصلاح
   * @param {object} customer - بيانات العميل
   * @returns {object} - المتغيرات
   */
  async prepareRepairVariables(repair, customer = {}) {
    try {
      // تسجيل للتحقق من البيانات المستلمة
      console.log('[TEMPLATE] ==========================================');
      console.log('[TEMPLATE] prepareRepairVariables called with:', {
        repairId: repair.id,
        reportedProblem: repair.reportedProblem,
        reportedProblemValue: repair.reportedProblem ? `${String(repair.reportedProblem).substring(0, 100)}...` : 'NULL/EMPTY',
        hasReportedProblem: !!repair.reportedProblem,
        reportedProblemType: typeof repair.reportedProblem,
        reportedProblemLength: repair.reportedProblem ? String(repair.reportedProblem).length : 0,
        problemDescription: repair.problemDescription,
        problemDescriptionValue: repair.problemDescription ? `${String(repair.problemDescription).substring(0, 50)}...` : 'NULL/EMPTY',
        allRepairKeys: Object.keys(repair).filter(k => k.toLowerCase().includes('problem') || k.toLowerCase().includes('description') || k.toLowerCase().includes('note'))
      });
      
      const formatDate = (date) => {
        if (!date) return 'غير محدد';
        try {
          const d = new Date(date);
          return d.toLocaleDateString('en-GB');
        } catch {
          return 'تاريخ غير صحيح';
        }
      };

      // الحقول الصحيحة من قاعدة البيانات
      const deviceInfo = `${repair.deviceBrand || ''} ${repair.deviceModel || ''}`.trim() || 'غير محدد';
      
      // التحقق من reportedProblem بشكل صريح
      // الحقل reportedProblem موجود في قاعدة البيانات، لكن قد يكون NULL أو empty
      let problem = 'غير محدد';
      
      // التحقق من جميع المصادر المحتملة
      // reportedProblem هو الحقل الأساسي في قاعدة البيانات
      const problemSources = [
        { value: repair.reportedProblem, name: 'reportedProblem' },
        { value: repair.problem, name: 'problem' },
        { value: repair.problemDescription, name: 'problemDescription' },
        { value: repair.description, name: 'description' },
        { value: repair.issueDescription, name: 'issueDescription' }, // من migrations القديمة
        { value: repair.customerNotes, name: 'customerNotes' } // قد يحتوي على وصف المشكلة
      ];
      
      let foundSource = null;
      for (const source of problemSources) {
        if (source.value !== null && source.value !== undefined) {
          const trimmed = String(source.value).trim();
          if (trimmed && 
              trimmed !== 'null' && 
              trimmed !== 'undefined' && 
              trimmed !== 'NULL' && 
              trimmed !== 'UNDEFINED' &&
              trimmed.length > 0) {
            problem = trimmed;
            foundSource = source.name;
            console.log(`[TEMPLATE] ✅✅✅ Found problem from ${source.name}:`, trimmed.substring(0, 100));
            console.log(`[TEMPLATE] ✅✅✅ Full problem value:`, trimmed);
            break; // استخدم أول قيمة صالحة
          }
        }
      }
      
      // إذا لم نجد قيمة صالحة، استخدم 'غير محدد'
      if (!foundSource || !problem || problem === '' || problem === 'null' || problem === 'undefined' || problem === 'NULL' || problem === 'UNDEFINED') {
        problem = 'غير محدد';
        console.warn('[TEMPLATE] ⚠️ No valid problem found for repair:', repair.id);
        console.warn('[TEMPLATE] All sources checked:', problemSources.map(s => ({
          name: s.name,
          hasValue: s.value !== null && s.value !== undefined,
          value: s.value ? String(s.value).substring(0, 50) : 'null/undefined',
          type: typeof s.value
        })));
      }
      
      // رقم الطلب - يتم إنشاؤه ديناميكياً من التاريخ والـ ID
      let repairNumber = 'غير محدد';
      if (repair.id && repair.createdAt) {
        try {
          const created = new Date(repair.createdAt);
          const year = created.getFullYear();
          const month = String(created.getMonth() + 1).padStart(2, '0');
          const day = String(created.getDate()).padStart(2, '0');
          const id = String(repair.id).padStart(3, '0');
          repairNumber = `REP-${year}${month}${day}-${id}`;
        } catch (e) {
          console.error('[TEMPLATE] Error generating repairNumber:', e);
          repairNumber = repair.requestNumber || `REP-${repair.id}` || String(repair.id);
        }
      } else if (repair.requestNumber) {
        repairNumber = repair.requestNumber;
      } else if (repair.id) {
        repairNumber = `REP-${repair.id}`;
      }
      
      // رابط التتبع - trackingToken أو id
      const trackingToken = repair.trackingToken || repair.id;
      const { getFrontendUrl } = require('../utils/frontendUrl');
      const frontendUrl = getFrontendUrl();
      const trackingUrl = `${frontendUrl}/track?trackingToken=${trackingToken}`;

      // التشخيص - technicianReport أو notes أو diagnosticNotes
      const diagnosis = repair.technicianReport || repair.notes || repair.diagnosticNotes || 'قيد التشخيص';
      
      // التكلفة المتوقعة
      const estimatedCost = repair.estimatedCost 
        ? `${parseFloat(repair.estimatedCost).toFixed(2)} ${repair.currency || 'EGP'}` 
        : 'قيد التحديد';

      // فاتورة قديمة إن وجدت
      let oldInvoiceNumberText = '';
      if (repair.oldInvoiceNumber) {
        oldInvoiceNumberText = `\n• فاتورة قديمة: #${repair.oldInvoiceNumber}`;
      }

      // أسباب إضافية
      const rejectionReason = repair.rejectionReason || repair.reason || 'غير محدد';
      const holdReason = repair.holdReason || repair.reason || 'غير محدد';

      const result = {
        customerName: customer.firstName || customer.name || 'العميل',
        repairNumber: repairNumber,
        deviceInfo: deviceInfo,
        problem: problem,
        diagnosis: diagnosis,
        estimatedCost: estimatedCost,
        trackingUrl: trackingUrl,
        oldInvoiceNumber: oldInvoiceNumberText,
        status: this.getRepairStatusLabel(repair.status),
        location: process.env.COMPANY_ADDRESS || 'مول البستان التجاري - الدور الأرضي - باب اللوق - القاهرة',
        rejectionReason: rejectionReason,
        holdReason: holdReason,
        // متغيرات إضافية
        deviceBrand: repair.deviceBrand || 'غير محدد',
        deviceModel: repair.deviceModel || 'غير محدد',
        deviceType: repair.deviceType || 'غير محدد',
        createdAt: formatDate(repair.createdAt),
        updatedAt: formatDate(repair.updatedAt)
      };
      
      // 🔍 DEBUG: تسجيل القيمة النهائية
      console.log('[TEMPLATE] 🔍 Final problem value to return:', result.problem);
      console.log('[TEMPLATE] 🔍 Problem length:', result.problem.length);
      console.log('[TEMPLATE] 🔍 Full result.problem:', result.problem);
      console.log('[TEMPLATE] ==========================================');
      
      return result;
    } catch (error) {
      console.error('[TEMPLATE] Error preparing repair variables:', error);
      throw error;
    }
  }

  /**
   * تحضير متغيرات القالب للعرض السعري
   * @param {object} quotation - بيانات العرض
   * @param {object} customer - بيانات العميل
   * @param {object} repair - بيانات طلب الإصلاح
   * @returns {object} - المتغيرات
   */
  async prepareQuotationVariables(quotation, customer = {}, repair = {}) {
    try {
      const formatDate = (date) => {
        if (!date) return 'غير محدد';
        try {
          const d = new Date(date);
          return d.toLocaleDateString('en-GB');
        } catch {
          return 'تاريخ غير صحيح';
        }
      };

      const formatMoney = (amount, currency = 'EGP') => {
        return `${parseFloat(amount || 0).toFixed(2)} ${currency}`;
      };

      // حساب تاريخ الصلاحية (30 يوم من الإنشاء)
      const validUntil = quotation.validUntil 
        ? formatDate(quotation.validUntil)
        : (() => {
            const d = new Date(quotation.createdAt || new Date());
            d.setDate(d.getDate() + 30);
            return formatDate(d);
          })();

      return {
        customerName: customer.firstName || customer.name || 'العميل',
        quotationId: quotation.id || 'غير محدد',
        repairNumber: repair.id || quotation.repairRequestId || 'غير محدد',
        totalAmount: formatMoney(quotation.totalAmount, quotation.currency || 'EGP'),
        currency: quotation.currency || 'EGP',
        validUntil: validUntil,
        quotationLink: (() => {
          const { getFrontendUrl } = require('../utils/frontendUrl');
          return `${getFrontendUrl()}/quotations/${quotation.id}`;
        })()
      };
    } catch (error) {
      console.error('Error preparing quotation variables:', error);
      throw error;
    }
  }

  /**
   * تحضير متغيرات القالب للمدفوعات
   * @param {object} payment - بيانات الدفعة
   * @param {object} invoice - بيانات الفاتورة
   * @param {object} customer - بيانات العميل
   * @returns {object} - المتغيرات
   */
  async preparePaymentVariables(payment, invoice = {}, customer = {}) {
    try {
      const formatDate = (date) => {
        if (!date) return 'غير محدد';
        try {
          const d = new Date(date);
          return d.toLocaleDateString('en-GB');
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
        paymentLink: (() => {
          const { getFrontendUrl } = require('../utils/frontendUrl');
          return `${getFrontendUrl()}/payments/${payment.id}`;
        })()
      };
    } catch (error) {
      console.error('Error preparing payment variables:', error);
      throw error;
    }
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

module.exports = new TemplateService();

