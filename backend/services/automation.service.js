// backend/services/automation.service.js
// Automation Service - خدمة الأتمتة للإشعارات التلقائية

const db = require('../db');
const messagingService = require('./messaging.service');
const settingsRepository = require('../repositories/settingsRepository');

class AutomationService {
  /**
   * التحقق من تفعيل الأتمتة
   * @returns {Promise<boolean>}
   */
  async isAutomationEnabled() {
    try {
      const settings = await settingsRepository.findByKey('messaging_settings');
      if (!settings || !settings.value) {
        return false;
      }

      const messagingSettings = typeof settings.value === 'string' 
        ? JSON.parse(settings.value) 
        : settings.value;

      return messagingSettings.automation?.enabled === true;
    } catch (error) {
      console.error('Error checking automation settings:', error);
      return false;
    }
  }

  /**
   * الحصول على القنوات الافتراضية للأتمتة
   * @returns {Promise<array>}
   */
  async getDefaultChannels() {
    try {
      const settings = await settingsRepository.findByKey('messaging_settings');
      if (!settings || !settings.value) {
        return ['whatsapp']; // Default
      }

      const messagingSettings = typeof settings.value === 'string' 
        ? JSON.parse(settings.value) 
        : settings.value;

      return messagingSettings.automation?.defaultChannels || ['whatsapp'];
    } catch (error) {
      console.error('Error getting default channels:', error);
      return ['whatsapp'];
    }
  }

  /**
   * إشعار عند تغيير حالة طلب الإصلاح
   * @param {number} repairId - معرف طلب الإصلاح
   * @param {string} oldStatus - الحالة القديمة
   * @param {string} newStatus - الحالة الجديدة
   * @param {number} userId - معرف المستخدم الذي قام بالتغيير
   */
  async onRepairStatusChange(repairId, oldStatus, newStatus, userId = null) {
    try {
      console.log(`[AUTOMATION] onRepairStatusChange called: repairId=${repairId}, oldStatus=${oldStatus}, newStatus=${newStatus}`);
      
      // التحقق من تفعيل الأتمتة
      const isEnabled = await this.isAutomationEnabled();
      console.log(`[AUTOMATION] Automation enabled: ${isEnabled}`);
      
      if (!isEnabled) {
        console.log('[AUTOMATION] Automation is disabled, skipping repair notification');
        return;
      }

      // جلب بيانات طلب الإصلاح
      const [repairs] = await db.execute(
        `SELECT 
          r.id,
          r.customerId,
          r.status,
          r.trackingToken,
          r.createdAt,
          r.estimatedCost,
          r.notes,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          d.deviceType,
          COALESCE(vo.label, d.brand) as deviceBrand,
          d.model as deviceModel,
          r.reportedProblem
        FROM RepairRequest r
        LEFT JOIN Customer c ON r.customerId = c.id
        LEFT JOIN Device d ON r.deviceId = d.id
        LEFT JOIN VariableOption vo ON d.brandId = vo.id
        WHERE r.id = ?`,
        [repairId]
      );

      if (repairs.length === 0) {
        console.warn(`Repair ${repairId} not found`);
        return;
      }

      const repair = repairs[0];
      const customer = {
        id: repair.customerId,
        name: repair.customerName || 'العميل',
        phone: repair.customerPhone,
        email: repair.customerEmail
      };

      // التحقق من وجود بيانات العميل
      if (!customer.phone && !customer.email) {
        console.warn(`No contact info for customer ${customer.id}, skipping notification`);
        return;
      }

      // تحويل حالة DB إلى حالة Frontend للمقارنة
      const frontendStatus = this.mapDbStatusToFrontend(newStatus);
      console.log(`[AUTOMATION] Mapped status: ${newStatus} -> ${frontendStatus}`);
      
      // التحقق من إعدادات الأتمتة المحددة
      const settings = await settingsRepository.findByKey('messaging_settings');
      let repairSettings = null;
      if (settings && settings.value) {
        const messagingSettings = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
        repairSettings = messagingSettings.automation?.repair;
        console.log(`[AUTOMATION] Repair settings:`, JSON.stringify(repairSettings, null, 2));
      } else {
        console.log('[AUTOMATION] No messaging settings found');
      }

      // تحديد القالب حسب الحالة الجديدة والتحقق من الإعدادات
      let template = null;
      let notificationType = null;
      let shouldNotify = false;

      // دعم حالات DB و Frontend مع التحقق من الإعدادات
      if (newStatus === 'RECEIVED' || frontendStatus === 'received') {
        shouldNotify = repairSettings?.notifyOnReceived !== false; // Default: true
        template = 'repairReceivedMessage';
        notificationType = 'repair_received';
      } else if (newStatus === 'INSPECTION' || frontendStatus === 'diagnosed') {
        shouldNotify = repairSettings?.notifyOnDiagnosed !== false; // Default: true
        template = 'diagnosisCompleteMessage';
        notificationType = 'repair_diagnosed';
      } else if (newStatus === 'AWAITING_APPROVAL' || frontendStatus === 'quote_ready') {
        shouldNotify = repairSettings?.notifyOnAwaitingApproval !== false; // Default: true
        template = 'awaitingApprovalMessage';
        notificationType = 'repair_awaiting_approval';
      } else if (newStatus === 'UNDER_REPAIR' || frontendStatus === 'in_progress' || frontendStatus === 'in-progress') {
        shouldNotify = repairSettings?.notifyOnUnderRepair !== false; // Default: true
        template = 'underRepairMessage';
        notificationType = 'repair_under_repair';
        console.log(`[AUTOMATION] Matched UNDER_REPAIR, shouldNotify: ${shouldNotify}`);
      } else if (newStatus === 'WAITING_PARTS' || frontendStatus === 'waiting_parts' || frontendStatus === 'waiting-parts') {
        shouldNotify = repairSettings?.notifyOnWaitingParts !== false; // Default: true
        template = 'waitingPartsMessage';
        notificationType = 'repair_waiting_parts';
        console.log(`[AUTOMATION] Matched WAITING_PARTS, shouldNotify: ${shouldNotify}`);
      } else if (newStatus === 'READY_FOR_PICKUP' || frontendStatus === 'ready_pickup') {
        shouldNotify = repairSettings?.notifyOnReadyPickup !== false; // Default: true
        template = 'readyPickupMessage';
        notificationType = 'repair_ready_pickup';
      } else if (newStatus === 'READY_FOR_DELIVERY' || newStatus === 'DELIVERED' || frontendStatus === 'completed' || frontendStatus === 'delivered') {
        shouldNotify = repairSettings?.notifyOnCompleted !== false; // Default: true
        if (newStatus === 'DELIVERED' || frontendStatus === 'delivered') {
          template = 'deliveredMessage';
          notificationType = 'repair_delivered';
        } else {
          template = 'repairCompletedMessage';
          notificationType = 'repair_completed';
        }
      } else if (newStatus === 'COMPLETED' || frontendStatus === 'completed') {
        shouldNotify = repairSettings?.notifyOnCompleted !== false; // Default: true
        template = 'completedMessage';
        notificationType = 'repair_completed';
      } else if (newStatus === 'REJECTED' || frontendStatus === 'cancelled') {
        shouldNotify = repairSettings?.notifyOnRejected !== false; // Default: false (اختياري)
        template = 'rejectedMessage';
        notificationType = 'repair_rejected';
      } else if (newStatus === 'ON_HOLD' || frontendStatus === 'on_hold') {
        shouldNotify = repairSettings?.notifyOnOnHold !== false; // Default: false (اختياري)
        template = 'onHoldMessage';
        notificationType = 'repair_on_hold';
      } else {
        // لا إشعار للحالات الأخرى
        console.log(`[AUTOMATION] ⚠️ Status not matched: newStatus=${newStatus}, frontendStatus=${frontendStatus}`);
        console.log(`[AUTOMATION] Available statuses: RECEIVED, INSPECTION, AWAITING_APPROVAL, UNDER_REPAIR, WAITING_PARTS, READY_FOR_PICKUP, READY_FOR_DELIVERY, DELIVERED, COMPLETED, REJECTED, ON_HOLD`);
        return;
      }

      // إذا كان الإشعار معطلاً في الإعدادات، لا نرسل
      if (!shouldNotify) {
        console.log(`[AUTOMATION] Notification ${notificationType} is disabled in settings for repair ${repairId}`);
        return;
      }

      // إذا كانت الحالة القديمة هي نفس الجديدة، لا حاجة للإشعار
      if (oldStatus === newStatus) {
        console.log(`[AUTOMATION] Status unchanged (${oldStatus} -> ${newStatus}), skipping notification`);
        return;
      }
      
      console.log(`[AUTOMATION] Proceeding to send notification: ${notificationType} for repair ${repairId}`);

      // الحصول على القنوات الافتراضية
      const channels = await this.getDefaultChannels();

      // إنشاء رقم الطلب (إذا لم يكن موجوداً)
      const repairDate = repair.createdAt ? new Date(repair.createdAt) : new Date();
      const year = repairDate.getFullYear();
      const month = String(repairDate.getMonth() + 1).padStart(2, '0');
      const day = String(repairDate.getDate()).padStart(2, '0');
      const repairNumber = `REP-${year}${month}${day}-${String(repair.id).padStart(3, '0')}`;

      // تحضير المتغيرات الأساسية
      const variables = {
        customerName: customer.name,
        repairNumber: repairNumber,
        deviceInfo: `${repair.deviceBrand || ''} ${repair.deviceModel || ''}`.trim() || 'غير محدد',
        problem: repair.reportedProblem || 'غير محدد',
        trackingUrl: (() => {
          const { getFrontendUrl } = require('../utils/frontendUrl');
          const trackingToken = repair.trackingToken || repair.id;
          return `${getFrontendUrl()}/track?trackingToken=${trackingToken}`;
        })(),
        status: this.getRepairStatusLabel(newStatus),
        location: process.env.COMPANY_ADDRESS || 'مول البستان التجاري - الدور الأرضي - باب اللوق - القاهرة'
      };

      // إضافة متغيرات إضافية حسب نوع القالب
      if (template === 'diagnosisCompleteMessage') {
        variables.diagnosis = repair.notes || 'قيد التشخيص';
        variables.estimatedCost = repair.estimatedCost 
          ? `${parseFloat(repair.estimatedCost).toFixed(2)} EGP` 
          : 'قيد التحديد';
      }
      if (template === 'awaitingApprovalMessage') {
        variables.estimatedCost = repair.estimatedCost 
          ? `${parseFloat(repair.estimatedCost).toFixed(2)} EGP` 
          : 'قيد التحديد';
      }
      if (template === 'rejectedMessage') {
        variables.rejectionReason = repair.notes || 'غير محدد';
      }
      if (template === 'onHoldMessage') {
        variables.holdReason = repair.notes || 'غير محدد';
      }

      // إرسال الإشعار
      console.log(`[AUTOMATION] Sending message: template=${template}, channels=${channels.join(',')}, recipient=${customer.phone || customer.email}`);
      
      await messagingService.sendMessage({
        entityType: 'repair',
        entityId: repairId,
        customerId: repair.customerId,
        channels: channels,
        recipient: customer.phone || customer.email,
        template: template,
        variables: variables,
        options: {
          emailRecipient: customer.email,
          whatsappRecipient: customer.phone
        },
        sentBy: userId
      });

      console.log(`[AUTOMATION] ✅ Sent ${notificationType} notification for repair ${repairId}`);
    } catch (error) {
      console.error(`[AUTOMATION] ❌ Error sending repair status notification for ${repairId}:`, error);
      console.error(`[AUTOMATION] Error stack:`, error.stack);
      // لا نرمي الخطأ حتى لا نوقف العملية الأساسية
    }
  }

  /**
   * إشعار عند إنشاء فاتورة جديدة
   * @param {number} invoiceId - معرف الفاتورة
   * @param {number} userId - معرف المستخدم الذي أنشأ الفاتورة
   */
  async onInvoiceCreated(invoiceId, userId = null) {
    try {
      // التحقق من تفعيل الأتمتة
      if (!(await this.isAutomationEnabled())) {
        console.log('Automation is disabled, skipping invoice notification');
        return;
      }

      // التحقق من إعدادات الأتمتة - هل نرسل إشعار عند إنشاء الفاتورة؟
      const settings = await settingsRepository.findByKey('messaging_settings');
      if (settings && settings.value) {
        const messagingSettings = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
        
        // التحقق من إعدادات الفواتير
        const invoiceSettings = messagingSettings.automation?.invoice;
        if (invoiceSettings?.notifyOnCreated === false) {
          return; // معطل
        }
      }

      // جلب بيانات الفاتورة
      const [invoices] = await db.execute(
        `SELECT 
          i.id,
          i.customerId,
          i.totalAmount,
          i.currency,
          i.status,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail
        FROM Invoice i
        LEFT JOIN Customer c ON i.customerId = c.id
        WHERE i.id = ?`,
        [invoiceId]
      );

      if (invoices.length === 0) {
        console.warn(`Invoice ${invoiceId} not found`);
        return;
      }

      const invoice = invoices[0];
      const customer = {
        id: invoice.customerId,
        name: invoice.customerName || 'العميل',
        phone: invoice.customerPhone,
        email: invoice.customerEmail
      };

      // التحقق من وجود بيانات العميل
      if (!customer.phone && !customer.email) {
        console.warn(`No contact info for customer ${customer.id}, skipping notification`);
        return;
      }

      // الحصول على القنوات الافتراضية
      const channels = await this.getDefaultChannels();

      // جلب عناصر الفاتورة
      const [items] = await db.execute(
        `SELECT 
          ii.quantity,
          ii.unitPrice,
          ii.totalPrice,
          ii.description,
          ii.itemType
        FROM InvoiceItem ii
        WHERE ii.invoiceId = ?`,
        [invoiceId]
      );

      // تحضير المتغيرات
      const variables = {
        customerName: customer.name,
        invoiceId: invoice.id,
        totalAmount: `${parseFloat(invoice.totalAmount || 0).toFixed(2)} ${invoice.currency || 'EGP'}`,
        currency: invoice.currency || 'EGP',
        invoiceLink: (() => {
          const { getFrontendUrl } = require('../utils/frontendUrl');
          return `${getFrontendUrl()}/invoices/${invoice.id}`;
        })(),
        status: this.getInvoiceStatusLabel(invoice.status)
      };

      // إرسال الإشعار
      await messagingService.sendMessage({
        entityType: 'invoice',
        entityId: invoiceId,
        customerId: invoice.customerId,
        channels: channels,
        recipient: customer.phone || customer.email,
        template: 'defaultMessage',
        variables: variables,
        options: {
          emailRecipient: customer.email,
          whatsappRecipient: customer.phone,
          attachPDF: true // محاولة إرفاق PDF إذا كان متوفراً
        },
        sentBy: userId
      });

      console.log(`✅ Sent invoice created notification for invoice ${invoiceId}`);
    } catch (error) {
      console.error(`Error sending invoice created notification for ${invoiceId}:`, error);
    }
  }

  /**
   * تذكيرات الدفع المتأخرة
   * @returns {Promise<number>} - عدد التذكيرات المرسلة
   */
  async checkOverduePayments() {
    try {
      // التحقق من تفعيل الأتمتة
      if (!(await this.isAutomationEnabled())) {
        console.log('Automation is disabled, skipping overdue payment reminders');
        return 0;
      }

      // التحقق من تفعيل تذكيرات المتأخرة
      const settings = await settingsRepository.findByKey('messaging_settings');
      if (settings && settings.value) {
        const messagingSettings = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
        
        const paymentSettings = messagingSettings.automation?.payment;
        if (paymentSettings?.overdueReminders?.enabled === false) {
          console.log('Overdue payment reminders are disabled in settings');
          return 0;
        }
      }

      // جلب الفواتير المتأخرة (unpaid أو partially_paid مع dueDate في الماضي)
      const [overdueInvoices] = await db.execute(
        `SELECT 
          i.id,
          i.customerId,
          i.totalAmount,
          i.amountPaid,
          i.currency,
          i.dueDate,
          i.status,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail
        FROM Invoice i
        LEFT JOIN Customer c ON i.customerId = c.id
        WHERE i.status IN ('unpaid', 'partially_paid', 'overdue')
          AND i.dueDate < CURDATE()
          AND (i.amountPaid IS NULL OR i.amountPaid < i.totalAmount)
        ORDER BY i.dueDate ASC
        LIMIT 100`
      );

      if (overdueInvoices.length === 0) {
        console.log('No overdue invoices found');
        return 0;
      }

      const channels = await this.getDefaultChannels();
      let sentCount = 0;

      for (const invoice of overdueInvoices) {
        try {
          const customer = {
            id: invoice.customerId,
            name: invoice.customerName || 'العميل',
            phone: invoice.customerPhone,
            email: invoice.customerEmail
          };

          // التحقق من وجود بيانات العميل
          if (!customer.phone && !customer.email) {
            continue;
          }

          // الحصول على الحد الأدنى للأيام بين التذكيرات
          const minDays = settings && settings.value 
            ? (typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value)
                .automation?.payment?.overdueReminders?.minDaysBetweenReminders || 1
            : 1;

          // التحقق من عدم إرسال تذكير في آخر X يوم
          const [recentReminders] = await db.execute(
            `SELECT id FROM MessagingLog 
             WHERE entityType = 'invoice' 
               AND entityId = ? 
               AND template = 'payment_overdue_reminder'
               AND sentAt > DATE_SUB(NOW(), INTERVAL ? DAY)
             LIMIT 1`,
            [invoice.id, minDays]
          );

          if (recentReminders.length > 0) {
            continue; // تم إرسال تذكير مؤخراً
          }

          const remainingAmount = parseFloat(invoice.totalAmount || 0) - parseFloat(invoice.amountPaid || 0);

          // تحضير المتغيرات
          const variables = {
            customerName: customer.name,
            invoiceId: invoice.id,
            totalAmount: `${parseFloat(invoice.totalAmount || 0).toFixed(2)} ${invoice.currency || 'EGP'}`,
            amountPaid: `${parseFloat(invoice.amountPaid || 0).toFixed(2)} ${invoice.currency || 'EGP'}`,
            remainingAmount: `${remainingAmount.toFixed(2)} ${invoice.currency || 'EGP'}`,
            currency: invoice.currency || 'EGP',
            dueDate: new Date(invoice.dueDate).toLocaleDateString('ar-EG'),
            invoiceLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}`
          };

          // إرسال التذكير
          await messagingService.sendMessage({
            entityType: 'invoice',
            entityId: invoice.id,
            customerId: invoice.customerId,
            channels: channels,
            recipient: customer.phone || customer.email,
            template: 'payment_overdue_reminder',
            variables: variables,
            options: {
              emailRecipient: customer.email,
              whatsappRecipient: customer.phone
            }
          });

          sentCount++;
          console.log(`✅ Sent overdue payment reminder for invoice ${invoice.id}`);
        } catch (error) {
          console.error(`Error sending reminder for invoice ${invoice.id}:`, error);
        }
      }

      console.log(`✅ Sent ${sentCount} overdue payment reminders`);
      return sentCount;
    } catch (error) {
      console.error('Error checking overdue payments:', error);
      return 0;
    }
  }

  /**
   * تذكيرات قبل الاستحقاق
   * @returns {Promise<number>} - عدد التذكيرات المرسلة
   */
  async sendPaymentReminders() {
    try {
      // التحقق من تفعيل الأتمتة
      if (!(await this.isAutomationEnabled())) {
        return 0;
      }

      // الحصول على إعدادات التذكيرات
      const settings = await settingsRepository.findByKey('messaging_settings');
      let daysBeforeDue = 3;
      let minDaysBetween = 1;
      
      if (settings && settings.value) {
        const messagingSettings = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
        
        const paymentSettings = messagingSettings.automation?.payment;
        if (paymentSettings?.beforeDueReminders?.enabled === false) {
          console.log('Before due payment reminders are disabled in settings');
          return 0;
        }
        
        daysBeforeDue = paymentSettings?.beforeDueReminders?.daysBeforeDue || 3;
        minDaysBetween = paymentSettings?.beforeDueReminders?.minDaysBetweenReminders || 1;
      }

      // جلب الفواتير المستحقة خلال X أيام
      const [upcomingInvoices] = await db.execute(
        `SELECT 
          i.id,
          i.customerId,
          i.totalAmount,
          i.amountPaid,
          i.currency,
          i.dueDate,
          i.status,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail
        FROM Invoice i
        LEFT JOIN Customer c ON i.customerId = c.id
        WHERE i.status IN ('unpaid', 'partially_paid')
          AND i.dueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
          AND (i.amountPaid IS NULL OR i.amountPaid < i.totalAmount)
        ORDER BY i.dueDate ASC
        LIMIT 100`,
        [daysBeforeDue]
      );

      if (upcomingInvoices.length === 0) {
        return 0;
      }

      const channels = await this.getDefaultChannels();
      let sentCount = 0;

      for (const invoice of upcomingInvoices) {
        try {
          const customer = {
            id: invoice.customerId,
            name: invoice.customerName || 'العميل',
            phone: invoice.customerPhone,
            email: invoice.customerEmail
          };

          if (!customer.phone && !customer.email) {
            continue;
          }

          // التحقق من عدم إرسال تذكير في آخر X يوم
          const [recentReminders] = await db.execute(
            `SELECT id FROM MessagingLog 
             WHERE entityType = 'invoice' 
               AND entityId = ? 
               AND template = 'payment_reminder_3days'
               AND sentAt > DATE_SUB(NOW(), INTERVAL ? DAY)
             LIMIT 1`,
            [invoice.id, minDaysBetween]
          );

          if (recentReminders.length > 0) {
            continue;
          }

          const remainingAmount = parseFloat(invoice.totalAmount || 0) - parseFloat(invoice.amountPaid || 0);

          const variables = {
            customerName: customer.name,
            invoiceId: invoice.id,
            totalAmount: `${parseFloat(invoice.totalAmount || 0).toFixed(2)} ${invoice.currency || 'EGP'}`,
            amountPaid: `${parseFloat(invoice.amountPaid || 0).toFixed(2)} ${invoice.currency || 'EGP'}`,
            remainingAmount: `${remainingAmount.toFixed(2)} ${invoice.currency || 'EGP'}`,
            currency: invoice.currency || 'EGP',
            dueDate: new Date(invoice.dueDate).toLocaleDateString('ar-EG'),
            invoiceLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}`
          };

          await messagingService.sendMessage({
            entityType: 'invoice',
            entityId: invoice.id,
            customerId: invoice.customerId,
            channels: channels,
            recipient: customer.phone || customer.email,
            template: 'payment_before_due_reminder',
            variables: variables,
            options: {
              emailRecipient: customer.email,
              whatsappRecipient: customer.phone
            }
          });

          sentCount++;
        } catch (error) {
          console.error(`Error sending reminder for invoice ${invoice.id}:`, error);
        }
      }

      return sentCount;
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      return 0;
    }
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

  /**
   * الحصول على نص حالة الفاتورة
   */
  getInvoiceStatusLabel(status) {
    const labels = {
      'paid': 'مدفوعة',
      'unpaid': 'غير مدفوعة',
      'partially_paid': 'مدفوعة جزئياً',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة',
      'draft': 'مسودة'
    };
    return labels[status] || status;
  }

  /**
   * تحويل حالة DB إلى حالة Frontend (للمقارنة)
   */
  mapDbStatusToFrontend(dbStatus) {
    const statusMap = {
      'RECEIVED': 'received',
      'INSPECTION': 'diagnosed',
      'AWAITING_APPROVAL': 'quote_ready',
      'UNDER_REPAIR': 'in_progress',
      'WAITING_PARTS': 'waiting_parts',
      'READY_FOR_PICKUP': 'ready_pickup',
      'READY_FOR_DELIVERY': 'completed',
      'DELIVERED': 'delivered',
      'REJECTED': 'cancelled',
      'ON_HOLD': 'on_hold'
    };
    return statusMap[dbStatus] || dbStatus?.toLowerCase();
  }
}

module.exports = new AutomationService();

