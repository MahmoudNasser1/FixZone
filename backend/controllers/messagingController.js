const nodemailer = require('nodemailer');
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
}

module.exports = new MessagingController();
