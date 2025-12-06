// backend/services/whatsapp.service.js
// WhatsApp Service - خدمة إرسال رسائل WhatsApp

const settingsRepository = require('../repositories/settingsRepository');

class WhatsAppService {
  /**
   * تحميل إعدادات WhatsApp
   * @returns {Promise<object>} - إعدادات WhatsApp
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

      return messagingSettings.whatsapp || {};
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
      throw new Error(`فشل في تحميل إعدادات WhatsApp: ${error.message}`);
    }
  }

  /**
   * تنظيف رقم الهاتف وإضافة رمز الدولة
   * @param {string} phone - رقم الهاتف
   * @returns {string} - رقم الهاتف المنظف
   */
  cleanPhoneNumber(phone) {
    if (!phone) {
      throw new Error('رقم الهاتف مطلوب');
    }

    // إزالة جميع المسافات والرموز
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');

    // إضافة رمز الدولة 20 إذا لم يكن موجوداً
    if (cleanPhone.startsWith('20')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      return '20' + cleanPhone.substring(1);
    } else {
      return '20' + cleanPhone;
    }
  }

  /**
   * إرسال رسالة عبر WhatsApp Web (رابط)
   * @param {string} phone - رقم الهاتف
   * @param {string} message - نص الرسالة
   * @returns {object} - رابط WhatsApp Web
   */
  async sendViaWeb(phone, message) {
    try {
      const cleanPhone = this.cleanPhoneNumber(phone);
      const encodedMessage = encodeURIComponent(message);
      
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      return {
        success: true,
        method: 'web',
        url: whatsappUrl,
        phone: cleanPhone,
        message: 'سيتم فتح WhatsApp Web في المتصفح'
      };
    } catch (error) {
      console.error('Error preparing WhatsApp Web URL:', error);
      throw new Error(`فشل في تحضير رابط WhatsApp Web: ${error.message}`);
    }
  }

  /**
   * إرسال رسالة عبر WhatsApp API
   * @param {string} phone - رقم الهاتف
   * @param {string} message - نص الرسالة
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendViaAPI(phone, message) {
    try {
      const settings = await this.loadSettings();

      if (!settings.enabled || !settings.apiEnabled) {
        throw new Error('WhatsApp API غير مفعل');
      }

      if (!settings.apiUrl || !settings.apiToken) {
        throw new Error('إعدادات WhatsApp API غير مكتملة');
      }

      const cleanPhone = this.cleanPhoneNumber(phone);

      // إرسال الطلب للـ API
      const response = await fetch(settings.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiToken}`
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: message
        })
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.message || 
          responseData.error || 
          `WhatsApp API returned ${response.status}`
        );
      }

      return {
        success: true,
        method: 'api',
        phone: cleanPhone,
        messageId: responseData.messageId || responseData.id || null,
        status: responseData.status || 'sent',
        response: responseData
      };
    } catch (error) {
      console.error('Error sending WhatsApp via API:', error);
      throw new Error(`فشل في إرسال WhatsApp عبر API: ${error.message}`);
    }
  }

  /**
   * إرسال رسالة عبر WhatsApp (Web أو API حسب الإعدادات)
   * @param {string} phone - رقم الهاتف
   * @param {string} message - نص الرسالة
   * @param {object} options - خيارات إضافية
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async send(phone, message, options = {}) {
    try {
      const settings = await this.loadSettings();

      if (!settings.enabled) {
        throw new Error('WhatsApp غير مفعل في الإعدادات');
      }

      // تحديد طريقة الإرسال
      const preferAPI = options.preferAPI !== false && settings.apiEnabled;
      const preferWeb = options.preferWeb !== false && settings.webEnabled;

      // محاولة API أولاً إذا كان مفعلاً
      if (preferAPI && settings.apiUrl && settings.apiToken) {
        try {
          return await this.sendViaAPI(phone, message);
        } catch (apiError) {
          console.warn('WhatsApp API failed, falling back to Web:', apiError.message);
          
          // Fallback إلى Web إذا فشل API
          if (preferWeb) {
            return await this.sendViaWeb(phone, message);
          }
          
          throw apiError;
        }
      }

      // استخدام Web إذا كان مفعلاً
      if (preferWeb) {
        return await this.sendViaWeb(phone, message);
      }

      throw new Error('لا توجد طريقة إرسال مفعلة (WhatsApp Web أو API)');
    } catch (error) {
      console.error('Error in WhatsApp send:', error);
      throw error;
    }
  }

  /**
   * التحقق من صحة إعدادات WhatsApp
   * @returns {Promise<object>} - حالة الإعدادات
   */
  async validateSettings() {
    try {
      const settings = await this.loadSettings();

      const validation = {
        enabled: settings.enabled || false,
        webEnabled: settings.webEnabled || false,
        apiEnabled: settings.apiEnabled || false,
        apiConfigured: !!(settings.apiUrl && settings.apiToken),
        isValid: false,
        errors: []
      };

      if (!validation.enabled) {
        validation.errors.push('WhatsApp غير مفعل');
      }

      if (!validation.webEnabled && !validation.apiEnabled) {
        validation.errors.push('يجب تفعيل WhatsApp Web أو API على الأقل');
      }

      if (validation.apiEnabled && !validation.apiConfigured) {
        validation.errors.push('إعدادات WhatsApp API غير مكتملة (API URL أو Token مفقود)');
      }

      validation.isValid = validation.errors.length === 0;

      return validation;
    } catch (error) {
      console.error('Error validating WhatsApp settings:', error);
      return {
        enabled: false,
        webEnabled: false,
        apiEnabled: false,
        apiConfigured: false,
        isValid: false,
        errors: [error.message]
      };
    }
  }
}

module.exports = new WhatsAppService();

