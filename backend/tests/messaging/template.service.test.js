// backend/tests/messaging/template.service.test.js
// Tests for Template Service

const templateService = require('../../services/template.service');
const settingsRepository = require('../../repositories/settingsRepository');

describe('Template Service', () => {
  describe('render()', () => {
    it('should replace variables in template', () => {
      const template = 'مرحباً {customerName}، فاتورتك رقم #{invoiceId}';
      const variables = {
        customerName: 'أحمد',
        invoiceId: '123'
      };

      const result = templateService.render(template, variables);

      expect(result).toBe('مرحباً أحمد، فاتورتك رقم #123');
    });

    it('should handle missing variables', () => {
      const template = 'مرحباً {customerName}، فاتورتك رقم #{invoiceId}';
      const variables = {
        customerName: 'أحمد'
      };

      const result = templateService.render(template, variables);

      expect(result).toContain('أحمد');
      expect(result).toContain('{invoiceId}'); // المتغير غير المستبدل يبقى
    });

    it('should handle empty template', () => {
      const result = templateService.render('', { customerName: 'أحمد' });
      expect(result).toBe('');
    });

    it('should handle null/undefined values', () => {
      const template = 'مرحباً {customerName}';
      const variables = {
        customerName: null
      };

      const result = templateService.render(template, variables);
      expect(result).toBe('مرحباً ');
    });
  });

  describe('prepareInvoiceVariables()', () => {
    it('should prepare invoice variables correctly', async () => {
      const invoice = {
        id: 123,
        totalAmount: 1000,
        amountPaid: 500,
        currency: 'EGP',
        createdAt: '2025-01-12T10:00:00Z',
        status: 'partial'
      };

      const customer = {
        firstName: 'أحمد',
        name: 'أحمد محمد'
      };

      const invoiceItems = [
        { totalPrice: 800 },
        { totalPrice: 200 }
      ];

      const variables = await templateService.prepareInvoiceVariables(
        invoice,
        customer,
        invoiceItems
      );

      expect(variables.customerName).toBe('أحمد');
      expect(variables.invoiceId).toBe(123);
      expect(variables.currency).toBe('EGP');
      expect(variables.totalAmount).toContain('1000.00');
      expect(variables.amountPaid).toContain('500.00');
      expect(variables.remainingAmount).toContain('500.00');
    });

    it('should handle missing customer data', async () => {
      const invoice = {
        id: 123,
        totalAmount: 1000,
        currency: 'EGP',
        createdAt: '2025-01-12T10:00:00Z'
      };

      const variables = await templateService.prepareInvoiceVariables(invoice, {}, []);

      expect(variables.customerName).toBe('العميل');
      expect(variables.invoiceId).toBe(123);
    });
  });

  describe('prepareRepairVariables()', () => {
    it('should prepare repair variables correctly', async () => {
      const repair = {
        id: 456,
        deviceBrand: 'Dell',
        deviceModel: 'Latitude 5520',
        problem: 'شاشة مكسورة',
        diagnosticNotes: 'يحتاج استبدال الشاشة',
        estimatedCost: 1500,
        currency: 'EGP',
        trackingNumber: 'TRACK123'
      };

      const customer = {
        firstName: 'محمد',
        name: 'محمد علي'
      };

      const variables = await templateService.prepareRepairVariables(repair, customer);

      expect(variables.customerName).toBe('محمد');
      expect(variables.repairNumber).toBe(456);
      expect(variables.deviceInfo).toContain('Dell');
      expect(variables.deviceInfo).toContain('Latitude 5520');
      expect(variables.problem).toBe('شاشة مكسورة');
      expect(variables.diagnosis).toBe('يحتاج استبدال الشاشة');
      expect(variables.trackingUrl).toContain('TRACK123');
    });
  });

  describe('getInvoiceStatusLabel()', () => {
    it('should return correct Arabic labels', () => {
      expect(templateService.getInvoiceStatusLabel('paid')).toBe('مدفوعة');
      expect(templateService.getInvoiceStatusLabel('unpaid')).toBe('غير مدفوعة');
      expect(templateService.getInvoiceStatusLabel('partial')).toBe('مدفوعة جزئياً');
      expect(templateService.getInvoiceStatusLabel('overdue')).toBe('متأخرة');
    });
  });

  describe('getRepairStatusLabel()', () => {
    it('should return correct Arabic labels', () => {
      expect(templateService.getRepairStatusLabel('received')).toBe('تم الاستلام');
      expect(templateService.getRepairStatusLabel('diagnosed')).toBe('تم التشخيص');
      expect(templateService.getRepairStatusLabel('completed')).toBe('اكتمل الإصلاح');
    });
  });
});

