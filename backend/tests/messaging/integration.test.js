// backend/tests/messaging/integration.test.js
// Integration Tests for Messaging System

const messagingService = require('../../services/messaging.service');
const templateService = require('../../services/template.service');
const whatsappService = require('../../services/whatsapp.service');
const emailService = require('../../services/email.service');
const db = require('../../db');

describe('Messaging Integration Tests', () => {
  // تنظيف البيانات بعد كل اختبار
  afterEach(async () => {
    await db.execute('DELETE FROM MessagingLog WHERE recipient LIKE ?', ['test%']);
  });

  describe('End-to-End: Send Invoice via WhatsApp', () => {
    it('should send invoice message and log it', async () => {
      const invoice = {
        id: 999,
        customerId: null,
        totalAmount: 1000,
        amountPaid: 0,
        currency: 'EGP',
        createdAt: new Date(),
        status: 'unpaid'
      };

      const customer = {
        firstName: 'أحمد',
        phone: '01234567890'
      };

      const invoiceItems = [
        { totalPrice: 1000 }
      ];

      // تحضير المتغيرات
      const variables = await templateService.prepareInvoiceVariables(
        invoice,
        customer,
        invoiceItems
      );

      // تحضير الرسالة
      const template = await templateService.loadTemplate('defaultMessage', 'invoice');
      const message = templateService.render(template, variables);

      // إرسال الرسالة
      const result = await messagingService.sendMessage({
        entityType: 'invoice',
        entityId: invoice.id,
        customerId: invoice.customerId,
        channels: ['whatsapp'],
        recipient: customer.phone,
        message: message,
        template: 'defaultMessage',
        variables: variables,
        sentBy: null
      });

      expect(result.success).toBe(true);
      expect(result.channels.whatsapp).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.logs[0].status).toBe('sent');
    });
  });

  describe('Template + WhatsApp Integration', () => {
    it('should prepare and send repair notification', async () => {
      const repair = {
        id: 888,
        customerId: null,
        deviceBrand: 'Dell',
        deviceModel: 'Latitude 5520',
        problem: 'شاشة مكسورة',
        trackingNumber: 'TRACK888'
      };

      const customer = {
        firstName: 'محمد',
        phone: '01234567890'
      };

      // تحضير المتغيرات
      const variables = await templateService.prepareRepairVariables(repair, customer);

      // تحضير الرسالة
      const template = await templateService.loadTemplate('repairReceivedMessage', 'repair');
      const message = templateService.render(template, variables);

      // إرسال الرسالة
      const result = await messagingService.sendMessage({
        entityType: 'repair',
        entityId: repair.id,
        customerId: repair.customerId,
        channels: ['whatsapp'],
        recipient: customer.phone,
        message: message,
        template: 'repairReceivedMessage',
        variables: variables,
        sentBy: null
      });

      expect(result.success).toBe(true);
      expect(result.channels.whatsapp).toBeDefined();
      expect(result.logs[0].message).toContain('TRACK888');
      expect(result.logs[0].message).toContain('Dell');
    });
  });

  describe('Logging and Retrieval Integration', () => {
    it('should log message and retrieve it', async () => {
      // إرسال رسالة
      const sendResult = await messagingService.sendMessage({
        entityType: 'invoice',
        entityId: 777,
        customerId: null,
        channels: ['whatsapp'],
        recipient: 'test@example.com',
        message: 'Test message for retrieval',
        template: null,
        sentBy: null
      });

      expect(sendResult.logs.length).toBeGreaterThan(0);
      const logId = sendResult.logs[0].id;

      // جلب السجل
      const logs = await messagingService.getMessageLogs(
        { entityId: 777 },
        { limit: 10, offset: 0 }
      );

      expect(logs.logs.length).toBeGreaterThan(0);
      expect(logs.logs[0].message).toContain('Test message for retrieval');
    });
  });

  describe('Stats Integration', () => {
    it('should calculate stats correctly after sending messages', async () => {
      // إرسال عدة رسائل
      const messages = [
        { entityId: 100, status: 'sent' },
        { entityId: 101, status: 'sent' },
        { entityId: 102, status: 'failed' }
      ];

      for (const msg of messages) {
        await messagingService.sendMessage({
          entityType: 'invoice',
          entityId: msg.entityId,
          customerId: null,
          channels: ['whatsapp'],
          recipient: `test-${msg.entityId}@example.com`,
          message: 'Test message',
          template: null,
          sentBy: null
        });

        // تحديث الحالة يدوياً للاختبار
        if (msg.status === 'failed') {
          const logs = await messagingService.getMessageLogs(
            { entityId: msg.entityId },
            { limit: 1, offset: 0 }
          );
          if (logs.logs.length > 0) {
            await messagingService.updateMessageStatus(logs.logs[0].id, {
              status: 'failed',
              errorMessage: 'Test error'
            });
          }
        }
      }

      // جلب الإحصائيات
      const stats = await messagingService.getStats();

      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.sent).toBeGreaterThanOrEqual(2);
      expect(stats.failed).toBeGreaterThanOrEqual(1);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });
  });
});

