// backend/tests/messaging/whatsapp.service.test.js
// Tests for WhatsApp Service

const whatsappService = require('../../services/whatsapp.service');

describe('WhatsApp Service', () => {
  describe('cleanPhoneNumber()', () => {
    it('should clean phone number and add country code', () => {
      expect(whatsappService.cleanPhoneNumber('01234567890')).toBe('201234567890');
      expect(whatsappService.cleanPhoneNumber('1234567890')).toBe('201234567890');
      expect(whatsappService.cleanPhoneNumber('201234567890')).toBe('201234567890');
    });

    it('should remove spaces and special characters', () => {
      expect(whatsappService.cleanPhoneNumber('0123-456-7890')).toBe('201234567890');
      expect(whatsappService.cleanPhoneNumber('0123 456 7890')).toBe('201234567890');
      expect(whatsappService.cleanPhoneNumber('+20 123 456 7890')).toBe('201234567890');
    });

    it('should throw error for empty phone', () => {
      expect(() => whatsappService.cleanPhoneNumber('')).toThrow('رقم الهاتف مطلوب');
      expect(() => whatsappService.cleanPhoneNumber(null)).toThrow('رقم الهاتف مطلوب');
    });
  });

  describe('sendViaWeb()', () => {
    it('should generate WhatsApp Web URL', async () => {
      const result = await whatsappService.sendViaWeb('01234567890', 'Test message');

      expect(result.success).toBe(true);
      expect(result.method).toBe('web');
      expect(result.url).toContain('wa.me');
      expect(result.url).toContain('201234567890');
      expect(result.url).toContain('Test%20message');
    });
  });

  describe('validateSettings()', () => {
    it('should validate settings correctly', async () => {
      const validation = await whatsappService.validateSettings();

      expect(validation).toHaveProperty('enabled');
      expect(validation).toHaveProperty('webEnabled');
      expect(validation).toHaveProperty('apiEnabled');
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
      
      // حتى لو فشل تحميل الإعدادات، يجب أن يعيد object صحيح
      expect(typeof validation.enabled).toBe('boolean');
    });
  });
});

