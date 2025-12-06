// backend/tests/messaging/messaging.service.test.js
// Tests for Messaging Service

const messagingService = require('../../services/messaging.service');
const db = require('../../db');

describe('Messaging Service', () => {
  // تنظيف البيانات بعد كل اختبار
  afterEach(async () => {
    await db.execute('DELETE FROM MessagingLog WHERE recipient LIKE ?', ['test%']);
  });

  describe('logMessage()', () => {
    it('should log message to database', async () => {
      const logData = {
        entityType: 'invoice',
        entityId: 999,
        customerId: null,
        channel: 'whatsapp',
        recipient: 'test@example.com',
        message: 'Test message',
        template: 'defaultMessage',
        status: 'sent',
        sentBy: null,
        sentAt: new Date(),
        errorMessage: null,
        retryCount: 0,
        metadata: '{}'
      };

      const logId = await messagingService.logMessage(logData);

      expect(logId).toBeGreaterThan(0);

      // التحقق من السجل
      const [logs] = await db.execute(
        'SELECT * FROM MessagingLog WHERE id = ?',
        [logId]
      );

      expect(logs.length).toBe(1);
      expect(logs[0].entityType).toBe('invoice');
      expect(logs[0].entityId).toBe(999);
      expect(logs[0].channel).toBe('whatsapp');
      expect(logs[0].recipient).toBe('test@example.com');
      expect(logs[0].status).toBe('sent');
    });
  });

  describe('updateMessageStatus()', () => {
    it('should update message status', async () => {
      // إنشاء سجل أولاً
      const logData = {
        entityType: 'invoice',
        entityId: 999,
        customerId: null,
        channel: 'whatsapp',
        recipient: 'test@example.com',
        message: 'Test message',
        template: null,
        status: 'pending',
        sentBy: null,
        sentAt: null,
        errorMessage: null,
        retryCount: 0,
        metadata: '{}'
      };

      const logId = await messagingService.logMessage(logData);

      // تحديث الحالة
      const updated = await messagingService.updateMessageStatus(logId, {
        status: 'sent',
        sentAt: new Date()
      });

      expect(updated).toBe(true);

      // التحقق من التحديث
      const [logs] = await db.execute(
        'SELECT * FROM MessagingLog WHERE id = ?',
        [logId]
      );

      expect(logs[0].status).toBe('sent');
      expect(logs[0].sentAt).not.toBeNull();
    });
  });

  describe('getMessageLogs()', () => {
    beforeEach(async () => {
      // إنشاء سجلات اختبار
      const testLogs = [
        {
          entityType: 'invoice',
          entityId: 100,
          channel: 'whatsapp',
          recipient: 'test1@example.com',
          message: 'Test 1',
          status: 'sent'
        },
        {
          entityType: 'invoice',
          entityId: 101,
          channel: 'email',
          recipient: 'test2@example.com',
          message: 'Test 2',
          status: 'failed'
        },
        {
          entityType: 'repair',
          entityId: 200,
          channel: 'whatsapp',
          recipient: 'test3@example.com',
          message: 'Test 3',
          status: 'sent'
        }
      ];

      for (const log of testLogs) {
        await messagingService.logMessage({
          ...log,
          customerId: null,
          template: null,
          sentBy: null,
          sentAt: log.status === 'sent' ? new Date() : null,
          errorMessage: log.status === 'failed' ? 'Test error' : null,
          retryCount: 0,
          metadata: '{}'
        });
      }
    });

    it('should get all logs', async () => {
      const result = await messagingService.getMessageLogs({}, { limit: 10, offset: 0 });

      expect(result.logs.length).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter by entityType', async () => {
      const result = await messagingService.getMessageLogs(
        { entityType: 'invoice' },
        { limit: 10, offset: 0 }
      );

      expect(result.logs.every(log => log.entityType === 'invoice')).toBe(true);
    });

    it('should filter by channel', async () => {
      const result = await messagingService.getMessageLogs(
        { channel: 'whatsapp' },
        { limit: 10, offset: 0 }
      );

      expect(result.logs.every(log => log.channel === 'whatsapp')).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await messagingService.getMessageLogs(
        { status: 'sent' },
        { limit: 10, offset: 0 }
      );

      expect(result.logs.every(log => log.status === 'sent')).toBe(true);
    });

    it('should support pagination', async () => {
      const page1 = await messagingService.getMessageLogs({}, { limit: 2, offset: 0 });
      const page2 = await messagingService.getMessageLogs({}, { limit: 2, offset: 2 });

      expect(page1.logs.length).toBeLessThanOrEqual(2);
      expect(page2.logs.length).toBeLessThanOrEqual(2);
      expect(page1.logs[0]?.id).not.toBe(page2.logs[0]?.id);
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      // إنشاء سجلات اختبار
      const testLogs = [
        { entityType: 'invoice', channel: 'whatsapp', status: 'sent' },
        { entityType: 'invoice', channel: 'whatsapp', status: 'sent' },
        { entityType: 'invoice', channel: 'email', status: 'failed' },
        { entityType: 'repair', channel: 'whatsapp', status: 'sent' }
      ];

      for (const log of testLogs) {
        await messagingService.logMessage({
          ...log,
          entityId: 999,
          customerId: null,
          recipient: `test-${Date.now()}@example.com`,
          message: 'Test',
          template: null,
          sentBy: null,
          sentAt: log.status === 'sent' ? new Date() : null,
          errorMessage: log.status === 'failed' ? 'Test error' : null,
          retryCount: 0,
          metadata: '{}'
        });
      }
    });

    it('should return statistics', async () => {
      const stats = await messagingService.getStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('sent');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('byChannel');
      expect(stats).toHaveProperty('byEntity');

      expect(stats.total).toBeGreaterThanOrEqual(4);
      expect(stats.sent).toBeGreaterThanOrEqual(3);
      expect(stats.failed).toBeGreaterThanOrEqual(1);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
    });

    it('should filter stats by date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stats = await messagingService.getStats({
        dateFrom: yesterday.toISOString(),
        dateTo: tomorrow.toISOString()
      });

      expect(stats.total).toBeGreaterThanOrEqual(0);
    });
  });
});

