// backend/services/email.service.js
// Email Service - خدمة إرسال رسائل البريد الإلكتروني

const nodemailer = require('nodemailer');
const settingsRepository = require('../repositories/settingsRepository');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  /**
   * تحميل إعدادات Email
   * @returns {Promise<object>} - إعدادات Email
   */
  async loadSettings() {
    try {
      const settings = await settingsRepository.findByKey('messaging_settings');
      
      if (!settings || !settings.value) {
        throw new Error('إعدادات المراسلة غير موجودة');
      }

      const messagingSettings = typeof settings.value === 'string' 
        ? JSON.parse(settings.value) 
        : settings.value;

      return messagingSettings.email || {};
    } catch (error) {
      console.error('Error loading Email settings:', error);
      throw new Error(`فشل في تحميل إعدادات Email: ${error.message}`);
    }
  }

  /**
   * إنشاء Email Transporter
   * @param {object} emailSettings - إعدادات Email
   * @returns {object} - Nodemailer transporter
   */
  createTransporter(emailSettings) {
    if (!emailSettings.enabled) {
      throw new Error('Email غير مفعل في الإعدادات');
    }

    if (!emailSettings.smtpHost || !emailSettings.smtpPort) {
      throw new Error('إعدادات SMTP غير مكتملة');
    }

    const isSecure = emailSettings.smtpPort === 465;

    return nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: parseInt(emailSettings.smtpPort),
      secure: isSecure,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword
      },
      tls: {
        rejectUnauthorized: false // للسماح بـ self-signed certificates
      }
    });
  }

  /**
   * تحويل نص عادي إلى HTML
   * @param {string} text - النص العادي
   * @returns {string} - HTML
   */
  textToHtml(text) {
    if (!text) return '';
    
    return text
      .replace(/\n/g, '<br>')
      .replace(/\r/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * إنشاء قالب HTML للرسالة
   * @param {string} content - محتوى الرسالة
   * @param {object} options - خيارات إضافية
   * @returns {string} - HTML كامل
   */
  createHtmlTemplate(content, options = {}) {
    const companyName = options.companyName || 'Fix Zone';
    const companyAddress = options.companyAddress || 'مول البستان التجاري - الدور الأرضي - باب اللوق - القاهرة';
    const companyPhone = options.companyPhone || '01270388043';
    const companyWebsite = options.companyWebsite || 'https://fixzzone.com';

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.subject || 'رسالة من Fix Zone'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #22c55e;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #22c55e;
            margin: 0;
            font-size: 28px;
        }
        .content {
            margin: 30px 0;
            font-size: 16px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #22c55e;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #16a34a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${companyName}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>${companyAddress}</p>
            <p>الهاتف: ${companyPhone}</p>
            <p>الموقع: <a href="${companyWebsite}">${companyWebsite}</a></p>
            <p style="margin-top: 20px; color: #999; font-size: 12px;">
                هذه رسالة تلقائية، يرجى عدم الرد عليها.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * إرسال فاتورة عبر البريد الإلكتروني
   * @param {number} invoiceId - معرف الفاتورة
   * @param {string} customerEmail - بريد العميل
   * @param {object} options - خيارات إضافية
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendInvoiceEmail(invoiceId, customerEmail, options = {}) {
    try {
      // جلب بيانات الفاتورة
      const db = require('../db');
      const [invoices] = await db.execute(
        'SELECT * FROM Invoice WHERE id = ? AND deletedAt IS NULL',
        [invoiceId]
      );

      if (invoices.length === 0) {
        throw new Error('الفاتورة غير موجودة');
      }

      const invoice = invoices[0];

      // جلب بيانات العميل
      let customer = {};
      if (invoice.customerId) {
        const [customers] = await db.execute(
          'SELECT * FROM Customer WHERE id = ?',
          [invoice.customerId]
        );
        if (customers.length > 0) {
          customer = customers[0];
        }
      }

      // جلب عناصر الفاتورة
      const [items] = await db.execute(
        'SELECT * FROM InvoiceItem WHERE invoiceId = ?',
        [invoiceId]
      );

      // تحضير محتوى الرسالة
      const templateService = require('./template.service');
      const variables = await templateService.prepareInvoiceVariables(invoice, customer, items);
      
      const emailSettings = await this.loadSettings();
      const subject = options.subject || emailSettings.defaultSubject
        .replace(/{invoiceId}/g, invoice.id)
        .replace(/#{invoiceId}/g, invoice.id);

      // بناء محتوى HTML
      const htmlContent = this.createInvoiceEmailHTML(invoice, customer, items, variables);

      // تحضير المرفقات (PDF)
      const attachments = [];
      if (options.attachPDF !== false) {
        try {
          // محاولة توليد PDF
          const pdfService = require('./pdf.service');
          try {
            const pdfBuffer = await pdfService.generateInvoicePDF(invoiceId, options);
            attachments.push({
              filename: `invoice-${invoiceId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            });
            console.log(`✅ تم إضافة PDF كمرفق: invoice-${invoiceId}.pdf`);
          } catch (pdfError) {
            // إذا فشل توليد PDF، نستمر بدون مرفق
            console.warn('⚠️  لم يتم إرفاق PDF:', pdfError.message);
            console.warn('   سيتم إرسال Email بدون PDF');
          }
        } catch (pdfError) {
          console.warn('Could not attach PDF:', pdfError.message);
        }
      }

      // إرسال البريد
      return await this.sendEmail(
        customerEmail,
        subject,
        htmlContent,
        {
          isHtml: true,
          forceHtml: true,
          attachments: attachments,
          ...options
        }
      );
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw new Error(`فشل في إرسال الفاتورة عبر البريد: ${error.message}`);
    }
  }

  /**
   * إنشاء محتوى HTML لرسالة الفاتورة
   * @param {object} invoice - بيانات الفاتورة
   * @param {object} customer - بيانات العميل
   * @param {array} items - عناصر الفاتورة
   * @param {object} variables - متغيرات القالب
   * @returns {string} - HTML
   */
  createInvoiceEmailHTML(invoice, customer, items = [], variables = {}) {
    const formatMoney = (amount, currency = 'EGP') => {
      return `${parseFloat(amount || 0).toFixed(2)} ${currency}`;
    };

    const formatDate = (date) => {
      if (!date) return 'غير محدد';
      try {
        return new Date(date).toLocaleDateString('ar-EG');
      } catch {
        return 'تاريخ غير صحيح';
      }
    };

    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.totalPrice) || 0);
    }, 0) || parseFloat(invoice.totalAmount) || 0;

    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const taxAmount = parseFloat(invoice.taxAmount) || 0;
    const shippingAmount = parseFloat(invoice.shippingAmount) || 0;
    const total = subtotal - discountAmount + taxAmount + shippingAmount;
    const amountPaid = parseFloat(invoice.amountPaid) || 0;
    const remaining = total - amountPaid;

    const invoiceLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}`;

    const content = `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #22c55e; margin-bottom: 20px;">فاتورة رقم #${invoice.id}</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">تفاصيل الفاتورة</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>العميل:</strong></td>
              <td style="padding: 8px 0;">${variables.customerName || customer.firstName || 'غير محدد'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>تاريخ الإصدار:</strong></td>
              <td style="padding: 8px 0;">${formatDate(invoice.createdAt)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>المبلغ الإجمالي:</strong></td>
              <td style="padding: 8px 0; font-size: 18px; color: #22c55e; font-weight: bold;">${formatMoney(total, invoice.currency)}</td>
            </tr>
            ${amountPaid > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>المبلغ المدفوع:</strong></td>
              <td style="padding: 8px 0;">${formatMoney(amountPaid, invoice.currency)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>المبلغ المتبقي:</strong></td>
              <td style="padding: 8px 0; font-weight: bold;">${formatMoney(remaining, invoice.currency)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>حالة الدفع:</strong></td>
              <td style="padding: 8px 0;">
                <span style="background: ${invoice.status === 'paid' ? '#22c55e' : invoice.status === 'partial' ? '#f59e0b' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">
                  ${variables.status || invoice.status}
                </span>
              </td>
            </tr>
          </table>
        </div>

        ${items.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; margin-bottom: 15px;">عناصر الفاتورة</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">الوصف</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">الكمية</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">السعر</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.itemName || 'عنصر'}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${item.quantity || 1}</td>
                  <td style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">${formatMoney(item.unitPrice, invoice.currency)}</td>
                  <td style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">${formatMoney(item.totalPrice, invoice.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceLink}" style="display: inline-block; padding: 12px 30px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
            عرض الفاتورة الكاملة
          </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          يمكنك تحميل الفاتورة من الرابط أعلاه أو من خلال حسابك في النظام.
        </p>
    `;

    return this.createHtmlTemplate(content, {
      subject: `فاتورة رقم #${invoice.id}`,
      companyName: 'Fix Zone',
      companyAddress: 'مول البستان التجاري - الدور الأرضي - باب اللوق - القاهرة',
      companyPhone: '01270388043',
      companyWebsite: 'https://fixzzone.com'
    });
  }

  /**
   * إرسال رسالة بريد إلكتروني
   * @param {string} to - عنوان البريد الإلكتروني
   * @param {string} subject - عنوان الرسالة
   * @param {string} body - محتوى الرسالة (نص عادي أو HTML)
   * @param {object} options - خيارات إضافية
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendEmail(to, subject, body, options = {}) {
    try {
      const emailSettings = await this.loadSettings();

      if (!emailSettings.enabled) {
        throw new Error('Email غير مفعل في الإعدادات');
      }

      // التحقق من صحة عنوان البريد
      if (!to || !to.includes('@')) {
        throw new Error('عنوان بريد إلكتروني غير صحيح');
      }

      const transporter = this.createTransporter(emailSettings);

      // تحضير المرفقات
      const attachments = [];
      if (options.attachments && Array.isArray(options.attachments)) {
        for (const attachment of options.attachments) {
          if (attachment.path) {
            try {
              const fileContent = await fs.readFile(attachment.path);
              attachments.push({
                filename: attachment.filename || path.basename(attachment.path),
                content: fileContent,
                contentType: attachment.contentType || 'application/pdf'
              });
            } catch (fileError) {
              console.warn('Could not attach file:', attachment.path, fileError.message);
            }
          } else if (attachment.content) {
            attachments.push({
              filename: attachment.filename || 'attachment',
              content: attachment.content,
              contentType: attachment.contentType || 'application/pdf'
            });
          }
        }
      }

      // تحديد ما إذا كان المحتوى HTML أم نص عادي
      const isHtml = options.isHtml !== false && (body.includes('<') || options.forceHtml);
      const htmlContent = isHtml ? body : this.createHtmlTemplate(this.textToHtml(body), {
        subject,
        ...options
      });
      const textContent = isHtml ? this.extractTextFromHtml(body) : body;

      const mailOptions = {
        from: `"${emailSettings.fromName || 'Fix Zone ERP'}" <${emailSettings.fromEmail}>`,
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`فشل في إرسال البريد الإلكتروني: ${error.message}`);
    }
  }

  /**
   * استخراج نص من HTML
   * @param {string} html - HTML
   * @returns {string} - نص عادي
   */
  extractTextFromHtml(html) {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * التحقق من صحة إعدادات Email
   * @returns {Promise<object>} - حالة الإعدادات
   */
  async validateSettings() {
    try {
      const emailSettings = await this.loadSettings();

      const validation = {
        enabled: emailSettings.enabled || false,
        smtpConfigured: !!(emailSettings.smtpHost && emailSettings.smtpPort),
        authConfigured: !!(emailSettings.smtpUser && emailSettings.smtpPassword),
        fromConfigured: !!(emailSettings.fromEmail && emailSettings.fromName),
        isValid: false,
        errors: []
      };

      if (!validation.enabled) {
        validation.errors.push('Email غير مفعل');
      }

      if (!validation.smtpConfigured) {
        validation.errors.push('إعدادات SMTP غير مكتملة (Host أو Port مفقود)');
      }

      if (!validation.authConfigured) {
        validation.errors.push('بيانات المصادقة غير مكتملة (User أو Password مفقود)');
      }

      if (!validation.fromConfigured) {
        validation.errors.push('عنوان المرسل غير مكتمل (From Email أو From Name مفقود)');
      }

      validation.isValid = validation.errors.length === 0;

      return validation;
    } catch (error) {
      console.error('Error validating Email settings:', error);
      return {
        enabled: false,
        smtpConfigured: false,
        authConfigured: false,
        fromConfigured: false,
        isValid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * اختبار إرسال بريد إلكتروني
   * @param {string} testEmail - عنوان بريد للاختبار
   * @returns {Promise<object>} - نتيجة الاختبار
   */
  async testConnection(testEmail = null) {
    try {
      const emailSettings = await this.loadSettings();
      const transporter = this.createTransporter(emailSettings);

      // التحقق من الاتصال
      await transporter.verify();

      // إرسال بريد اختبار إذا تم توفير عنوان
      if (testEmail) {
        await this.sendEmail(
          testEmail,
          'اختبار إرسال من Fix Zone',
          'هذه رسالة اختبار من نظام Fix Zone. إذا وصلتك هذه الرسالة، فالإعدادات صحيحة.',
          { isHtml: false }
        );
      }

      return {
        success: true,
        message: 'الاتصال بـ SMTP ناجح'
      };
    } catch (error) {
      console.error('Error testing email connection:', error);
      throw new Error(`فشل في اختبار الاتصال: ${error.message}`);
    }
  }
}

module.exports = new EmailService();

