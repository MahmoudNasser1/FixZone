// backend/services/pdf.service.js
// PDF Service - خدمة توليد PDF للفواتير

const db = require('../db');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  /**
   * توليد PDF للفاتورة
   * @param {number} invoiceId - معرف الفاتورة
   * @param {object} options - خيارات إضافية
   * @returns {Promise<Buffer>} - PDF كـ Buffer
   */
  async generateInvoicePDF(invoiceId, options = {}) {
    try {
      // جلب بيانات الفاتورة
      const [invoices] = await db.execute(`
        SELECT i.*, 
          rr.id as repairRequestId,
          d.deviceType,
          d.brand as deviceBrand,
          d.model as deviceModel,
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          c.address as customerAddress
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE i.id = ? AND i.deletedAt IS NULL
      `, [invoiceId]);

      if (invoices.length === 0) {
        throw new Error('الفاتورة غير موجودة');
      }

      const invoice = invoices[0];

      // جلب عناصر الفاتورة
      const [items] = await db.execute(`
        SELECT ii.*, 
          COALESCE(inv.name, s.name) as itemName,
          COALESCE(inv.sku, s.id) as itemCode
        FROM InvoiceItem ii
        LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id
        LEFT JOIN Service s ON ii.serviceId = s.id
        WHERE ii.invoiceId = ?
        ORDER BY ii.createdAt
      `, [invoiceId]);

      // توليد HTML للفاتورة
      const htmlContent = this.generateInvoiceHTML(invoice, items);

      // استخدام puppeteer أو مكتبة أخرى لتوليد PDF
      // في الوقت الحالي، سنستخدم طريقة بسيطة
      // يمكن استبدالها بـ puppeteer لاحقاً
      
      // Note: هذا يحتاج مكتبة PDF generation
      // سنستخدم طريقة بسيطة الآن ونضيف puppeteer لاحقاً
      
      throw new Error('PDF generation يحتاج مكتبة puppeteer أو pdfkit - سيتم إضافتها لاحقاً');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`فشل في توليد PDF: ${error.message}`);
    }
  }

  /**
   * توليد HTML للفاتورة (للاستخدام مع puppeteer)
   * @param {object} invoice - بيانات الفاتورة
   * @param {array} items - عناصر الفاتورة
   * @returns {string} - HTML
   */
  generateInvoiceHTML(invoice, items = []) {
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

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة #${invoice.id}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
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
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .customer-info, .invoice-details {
            width: 48%;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
          }
          table th {
            background-color: #f9fafb;
            font-weight: bold;
          }
          .totals {
            text-align: left;
            margin-top: 20px;
          }
          .totals table {
            width: 50%;
            margin-left: auto;
          }
          .total-row {
            font-weight: bold;
            font-size: 18px;
            background-color: #f0f9ff;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fix Zone</h1>
          <p>مول البستان التجاري - الدور الأرضي - باب اللوق - القاهرة</p>
          <p>هاتف: 01270388043</p>
        </div>

        <div class="invoice-info">
          <div class="customer-info">
            <h3>بيانات العميل</h3>
            <p><strong>الاسم:</strong> ${invoice.customerName || 'غير محدد'}</p>
            <p><strong>الهاتف:</strong> ${invoice.customerPhone || 'غير محدد'}</p>
            <p><strong>البريد:</strong> ${invoice.customerEmail || 'غير محدد'}</p>
            ${invoice.customerAddress ? `<p><strong>العنوان:</strong> ${invoice.customerAddress}</p>` : ''}
          </div>
          <div class="invoice-details">
            <h3>تفاصيل الفاتورة</h3>
            <p><strong>رقم الفاتورة:</strong> #${invoice.id}</p>
            <p><strong>التاريخ:</strong> ${formatDate(invoice.createdAt)}</p>
            <p><strong>الحالة:</strong> ${invoice.status || 'غير محدد'}</p>
          </div>
        </div>

        ${(invoice.deviceBrand || invoice.deviceModel) ? `
        <div class="section-title">تفاصيل الجهاز</div>
        <table>
          <tr>
            ${invoice.deviceBrand ? `<td><strong>الماركة:</strong> ${invoice.deviceBrand}</td>` : ''}
            ${invoice.deviceModel ? `<td><strong>الموديل:</strong> ${invoice.deviceModel}</td>` : ''}
          </tr>
        </table>
        ` : ''}

        <div class="section-title">عناصر الفاتورة</div>
        <table>
          <thead>
            <tr>
              <th>الوصف</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.itemName || 'عنصر غير محدد'}</td>
                <td>${item.quantity || 1}</td>
                <td>${formatMoney(item.unitPrice, invoice.currency)}</td>
                <td>${formatMoney(item.totalPrice, invoice.currency)}</td>
              </tr>
            `).join('')}
            ${items.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا توجد عناصر</td></tr>' : ''}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>المجموع الفرعي:</td>
              <td>${formatMoney(subtotal, invoice.currency)}</td>
            </tr>
            ${discountAmount > 0 ? `
            <tr>
              <td>الخصم:</td>
              <td>-${formatMoney(discountAmount, invoice.currency)}</td>
            </tr>
            ` : ''}
            ${taxAmount > 0 ? `
            <tr>
              <td>الضريبة:</td>
              <td>${formatMoney(taxAmount, invoice.currency)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td>الإجمالي:</td>
              <td>${formatMoney(total, invoice.currency)}</td>
            </tr>
            ${amountPaid > 0 ? `
            <tr>
              <td>المدفوع:</td>
              <td>${formatMoney(amountPaid, invoice.currency)}</td>
            </tr>
            <tr>
              <td>المتبقي:</td>
              <td><strong>${formatMoney(remaining, invoice.currency)}</strong></td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${invoice.notes ? `
        <div class="section-title">ملاحظات</div>
        <p>${invoice.notes}</p>
        ` : ''}

        <div class="footer">
          <p>شكراً لثقتكم بنا | Fix Zone</p>
          <p>هذه فاتورة رسمية صادرة بتاريخ ${formatDate(invoice.createdAt)}</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PDFService();

