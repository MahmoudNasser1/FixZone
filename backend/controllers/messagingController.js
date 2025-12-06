const messagingService = require('../services/messaging.service');
const templateService = require('../services/template.service');
const whatsappService = require('../services/whatsapp.service');
const emailService = require('../services/email.service');
const settingsRepository = require('../repositories/settingsRepository');
const db = require('../db');

class MessagingController {
  // إرسال بريد إلكتروني
  async sendEmail(req, res) {
    try {
      const { to, subject, body, invoiceId } = req.body;

      // جلب إعدادات البريد الإلكتروني
      const [settingsRows] = await db.execute(
        'SELECT value FROM SystemSettings WHERE `key` = ?',
        ['messaging_settings']
      );

      if (settingsRows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'إعدادات المراسلة غير موجودة' 
        });
      }

      const messagingSettings = JSON.parse(settingsRows[0].value);
      const emailSettings = messagingSettings.email;

      if (!emailSettings.enabled) {
        return res.status(400).json({ 
          success: false, 
          message: 'إعدادات البريد الإلكتروني غير مفعلة' 
        });
      }

      // إنشاء transporter
      const transporter = nodemailer.createTransporter({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
        secure: emailSettings.smtpPort === 465,
        auth: {
          user: emailSettings.smtpUser,
          pass: emailSettings.smtpPassword,
        },
      });

      // إرسال البريد
      const mailOptions = {
        from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
        to: to,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      };

      await transporter.sendMail(mailOptions);

      // تسجيل العملية في قاعدة البيانات
      await db.execute(
        `INSERT INTO ActivityLog (userId, action, tableName, recordId, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user?.id || null,
          'email_sent',
          'invoices',
          invoiceId,
          JSON.stringify({ to, subject })
        ]
      );

      res.json({ 
        success: true, 
        message: 'تم إرسال البريد الإلكتروني بنجاح' 
      });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ 
        success: false, 
        message: 'فشل في إرسال البريد الإلكتروني',
        error: error.message 
      });
    }
  }

  // إرسال رسالة واتساب (عبر API خارجي)
  async sendWhatsApp(req, res) {
    try {
      const { phone, message, invoiceId } = req.body;

      // جلب إعدادات الواتساب
      const [settingsRows] = await db.execute(
        'SELECT value FROM SystemSettings WHERE `key` = ?',
        ['messaging_settings']
      );

      if (settingsRows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'إعدادات المراسلة غير موجودة' 
        });
      }

      const messagingSettings = JSON.parse(settingsRows[0].value);
      const whatsappSettings = messagingSettings.whatsapp;

      if (!whatsappSettings.enabled || !whatsappSettings.apiEnabled) {
        return res.status(400).json({ 
          success: false, 
          message: 'إعدادات الواتساب API غير مفعلة' 
        });
      }

      // إرسال عبر API خارجي
      const response = await fetch(whatsappSettings.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${whatsappSettings.apiToken}`
        },
        body: JSON.stringify({
          phone: phone.replace(/[^\d]/g, ''),
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API returned ${response.status}`);
      }

      // تسجيل العملية في قاعدة البيانات
      await db.execute(
        `INSERT INTO ActivityLog (userId, action, tableName, recordId, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user?.id || null,
          'whatsapp_sent',
          'invoices',
          invoiceId,
          JSON.stringify({ phone, messageLength: message.length })
        ]
      );

      res.json({ 
        success: true, 
        message: 'تم إرسال رسالة الواتساب بنجاح' 
      });
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      res.status(500).json({ 
        success: false, 
        message: 'فشل في إرسال رسالة الواتساب',
        error: error.message 
      });
    }
  }

  // جلب إعدادات المراسلة
  async getMessagingSettings(req, res) {
    try {
      const [rows] = await db.execute(
        'SELECT value FROM SystemSettings WHERE `key` = ?',
        ['messaging_settings']
      );

      if (rows.length === 0) {
        // إعدادات افتراضية
        const defaultSettings = {
          whatsapp: {
            enabled: true,
            apiEnabled: false,
            apiUrl: '',
            apiToken: '',
            webEnabled: true,
            defaultMessage: 'مرحباً {customerName}، فاتورتك رقم #{invoiceId} جاهزة بمبلغ {amount} {currency}. يمكنك تحميلها من: {invoiceLink}'
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

        res.json({ 
          success: true, 
          data: defaultSettings 
        });
      } else {
        const settings = JSON.parse(rows[0].value);
        res.json({ 
          success: true, 
          data: settings 
        });
      }
    } catch (error) {
      console.error('Error getting messaging settings:', error);
      res.status(500).json({ 
        success: false, 
        message: 'فشل في جلب إعدادات المراسلة',
        error: error.message 
      });
    }
  }

  // حفظ إعدادات المراسلة
  async saveMessagingSettings(req, res) {
    try {
      const settings = req.body;

      // التحقق من وجود الإعدادات مسبقاً
      const [existingRows] = await db.execute(
        'SELECT id FROM SystemSettings WHERE `key` = ?',
        ['messaging_settings']
      );

      if (existingRows.length > 0) {
        // تحديث
        await db.execute(
          'UPDATE SystemSettings SET value = ?, description = ? WHERE `key` = ?',
          [
            JSON.stringify(settings),
            'إعدادات المراسلة والإشعارات',
            'messaging_settings'
          ]
        );
      } else {
        // إنشاء جديد
        await db.execute(
          'INSERT INTO SystemSettings (`key`, value, description) VALUES (?, ?, ?)',
          [
            'messaging_settings',
            JSON.stringify(settings),
            'إعدادات المراسلة والإشعارات'
          ]
        );
      }

      res.json({ 
        success: true, 
        message: 'تم حفظ إعدادات المراسلة بنجاح' 
      });
    } catch (error) {
      console.error('Error saving messaging settings:', error);
      res.status(500).json({ 
        success: false, 
        message: 'فشل في حفظ إعدادات المراسلة',
        error: error.message 
      });
    }
  }

  // ============================================
  // وظائف جديدة باستخدام messagingService
  // ============================================

  /**
   * إرسال رسالة موحدة (يدعم WhatsApp و Email)
   * POST /api/messaging/send
   */
  async sendMessage(req, res) {
    try {
      const {
        entityType,
        entityId,
        customerId,
        channels,
        recipient,
        message,
        template,
        variables,
        options
      } = req.body;

      if (!entityType || !entityId || !channels || !recipient) {
        return res.status(400).json({
          success: false,
          message: 'بيانات الإرسال غير مكتملة'
        });
      }

      const result = await messagingService.sendMessage({
        entityType,
        entityId,
        customerId,
        channels: Array.isArray(channels) ? channels : [channels],
        recipient,
        message,
        template,
        variables,
        options,
        sentBy: req.user?.id
      });

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'تم إرسال الرسالة بنجاح' : 'حدث خطأ في إرسال بعض الرسائل'
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إرسال الرسالة',
        error: error.message
      });
    }
  }

  /**
   * الحصول على سجل المراسلات
   * GET /api/messaging/logs
   */
  async getMessageLogs(req, res) {
    try {
      const filters = {
        entityType: req.query.entityType,
        entityId: req.query.entityId ? parseInt(req.query.entityId) : undefined,
        customerId: req.query.customerId ? parseInt(req.query.customerId) : undefined,
        channel: req.query.channel,
        status: req.query.status,
        recipient: req.query.recipient,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const pagination = {
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      };

      const result = await messagingService.getMessageLogs(filters, pagination);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting message logs:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب سجل المراسلات',
        error: error.message
      });
    }
  }

  /**
   * الحصول على رسالة محددة
   * GET /api/messaging/logs/:id
   */
  async getMessageLog(req, res) {
    try {
      const { id } = req.params;

      const [logs] = await db.execute(
        'SELECT * FROM MessagingLog WHERE id = ?',
        [id]
      );

      if (logs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'السجل غير موجود'
        });
      }

      const log = logs[0];
      log.metadata = log.metadata ? JSON.parse(log.metadata) : {};

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('Error getting message log:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب السجل',
        error: error.message
      });
    }
  }

  /**
   * إعادة محاولة إرسال رسالة فاشلة
   * POST /api/messaging/retry/:id
   */
  async retryMessage(req, res) {
    try {
      const { id } = req.params;

      const result = await messagingService.retryMessage(parseInt(id));

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'تم إعادة إرسال الرسالة بنجاح' : 'فشلت إعادة المحاولة'
      });
    } catch (error) {
      console.error('Error retrying message:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إعادة المحاولة',
        error: error.message
      });
    }
  }

  /**
   * الحصول على إحصائيات المراسلات
   * GET /api/messaging/stats
   * Query params:
   *   - dateFrom: تاريخ البداية (YYYY-MM-DD)
   *   - dateTo: تاريخ النهاية (YYYY-MM-DD)
   *   - channel: القناة (whatsapp, email)
   *   - entityType: نوع الكيان (invoice, repair, quotation, payment)
   *   - groupBy: التجميع (day, week, month) - للاستخدام المستقبلي
   */
  async getStats(req, res) {
    try {
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        channel: req.query.channel,
        entityType: req.query.entityType,
        groupBy: req.query.groupBy
      };

      const stats = await messagingService.getStats(filters);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب الإحصائيات',
        error: error.message
      });
    }
  }

  /**
   * حذف سجل رسالة
   * DELETE /api/messaging/logs/:id
   */
  async deleteMessageLog(req, res) {
    try {
      const { id } = req.params;

      await db.execute(
        'DELETE FROM MessagingLog WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'تم حذف السجل بنجاح'
      });
    } catch (error) {
      console.error('Error deleting message log:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في حذف السجل',
        error: error.message
      });
    }
  }

  /**
   * التحقق من صحة إعدادات WhatsApp
   * GET /api/messaging/validate/whatsapp
   */
  async validateWhatsApp(req, res) {
    try {
      const validation = await whatsappService.validateSettings();

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error validating WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في التحقق من إعدادات WhatsApp',
        error: error.message
      });
    }
  }

  /**
   * التحقق من صحة إعدادات Email
   * GET /api/messaging/validate/email
   */
  async validateEmail(req, res) {
    try {
      const validation = await emailService.validateSettings();

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error validating Email:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في التحقق من إعدادات Email',
        error: error.message
      });
    }
  }
}

module.exports = new MessagingController();
