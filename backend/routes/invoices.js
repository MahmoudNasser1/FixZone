const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');
const path = require('path');
const fs = require('fs');

// Load print settings helper
function loadPrintSettings() {
  try {
    const p = path.join(__dirname, '..', 'config', 'print-settings.json');
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      title: 'فاتورة',
      showLogo: false,
      logoUrl: '',
      margins: { top: 16, right: 16, bottom: 16, left: 16 },
      dateDisplay: 'both',
      companyName: 'FixZone'
    };
  }
}

// جميع المسارات تحتاج مصادقة
router.use(authMiddleware);

// قائمة الفواتير مع فلترة وترقيم
router.get('/', invoicesController.getAllInvoices);

// إحصائيات الفواتير
router.get('/stats', invoicesController.getStatistics);

// العمليات المجمعة للفواتير
router.post('/bulk-action', invoicesController.bulkAction);

// إنشاء فاتورة جديدة
router.post('/', invoicesController.createInvoice);

// صفحة إنشاء فاتورة جديدة (GET)
router.get('/new', invoicesController.getNewInvoicePage);

// جلب فاتورة طلب إصلاح
router.get('/by-repair/:repairId', invoicesController.getInvoiceByRepairId);

// إنشاء فاتورة من طلب إصلاح
router.post('/create-from-repair/:repairId', invoicesController.createInvoiceFromRepair);

// توليد PDF للفاتورة
router.get('/:id/pdf', invoicesController.generatePDF);

// حذف فاتورة (soft delete)
router.delete('/:id', invoicesController.deleteInvoice);

// جلب تفاصيل فاتورة محددة
router.get('/:id', invoicesController.getInvoiceById);

// تحديث فاتورة
router.put('/:id', invoicesController.updateInvoice);

// عمليات عناصر الفاتورة
router.get('/:id/items', invoicesController.getInvoiceItems);
router.post('/:id/items', invoicesController.addInvoiceItem);
router.put('/:id/items/:itemId', invoicesController.updateInvoiceItem);
router.delete('/:id/items/:itemId', invoicesController.removeInvoiceItem);

// Print invoice
router.get('/:id/print', async (req, res) => {
  const { id } = req.params;
  try {
    const allSettings = loadPrintSettings();
    const settings = allSettings.invoice || allSettings || {};
    
    // Get invoice with customer and repair details
    const [invoiceRows] = await db.query(`
      SELECT 
        i.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        c.address as customerAddress,
        rr.deviceModel as deviceModel,
        rr.deviceBrand as deviceBrand,
        rr.reportedProblem as problemDescription,
        rr.requestNumber as repairRequestNumber,
        d.serialNumber as deviceSerial,
        u.name as technicianName
      FROM Invoice i
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON COALESCE(rr.customerId, i.customerId) = c.id
      LEFT JOIN User u ON rr.technicianId = u.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      WHERE i.id = ? AND i.deletedAt IS NULL
    `, [id]);

    if (!invoiceRows || invoiceRows.length === 0) {
      return res.status(404).send('الفاتورة غير موجودة');
    }

    const invoice = invoiceRows[0];

    // Get invoice items
    const [items] = await db.query(`
      SELECT 
        ii.*,
        COALESCE(inv.name, s.name, ii.description, 'عنصر غير محدد') as itemName,
        COALESCE(inv.sku, CONCAT('SVC-', s.id), '') as itemCode,
        rrs.notes as serviceNotes
      FROM InvoiceItem ii
      LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id
      LEFT JOIN Service s ON ii.serviceId = s.id
      LEFT JOIN Invoice i ON ii.invoiceId = i.id
      LEFT JOIN RepairRequestService rrs ON (
        (rrs.serviceId = ii.serviceId AND rrs.repairRequestId = i.repairRequestId)
        OR (rrs.serviceId IS NULL AND ii.serviceId IS NULL AND rrs.repairRequestId = i.repairRequestId AND rrs.notes IS NOT NULL)
      )
      WHERE ii.invoiceId = ?
      ORDER BY ii.createdAt
    `, [id]);

    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      subtotal += qty * price;
    });
    
    const taxAmount = Number(invoice.taxAmount) || 0;
    const discountAmount = Number(invoice.discountAmount) || 0;
    const total = Number(invoice.totalAmount) || (subtotal + taxAmount - discountAmount);

    // Status text mapping
    const statusTextMap = {
      'draft': 'مسودة',
      'sent': 'تم الإرسال',
      'paid': 'مدفوعة',
      'partially_paid': 'مدفوعة جزئياً',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة'
    };
    const statusText = statusTextMap[invoice.status] || invoice.status;

    const invoiceDate = new Date(invoice.createdAt || Date.now());
    const invoiceNumber = `INV-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${String(invoiceDate.getDate()).padStart(2, '0')}-${String(invoice.id).padStart(3, '0')}`;

    const html = `<!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة - ${invoiceNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Tajawal','Cairo', Arial, sans-serif; font-size:14px; line-height:1.6; color:#1f2937; background:#fff; direction:rtl; }
        .container { max-width:800px; margin:0 auto; padding:20px; }
        .header { text-align:center; margin-bottom:24px; border-bottom:2px solid #3b82f6; padding-bottom:16px; }
        .logo { font-size:24px; font-weight:bold; color:#3b82f6; margin-bottom:8px; }
        .company-info { font-size:12px; color:#6b7280; }
        .invoice-info { display:flex; justify-content:space-between; margin-bottom:24px; gap:20px; }
        .invoice-details, .customer-details { flex:1; }
        .section-title { font-weight:bold; color:#374151; margin-bottom:8px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; }
        .info-row { margin-bottom:4px; }
        .label { font-weight:500; color:#6b7280; }
        .table { width:100%; border-collapse:collapse; margin:20px 0; }
        .table th, .table td { padding:12px 8px; text-align:right; border-bottom:1px solid #e5e7eb; }
        .table th { background:#f9fafb; font-weight:600; color:#374151; }
        .table .number { text-align:center; font-family:monospace; }
        .totals { margin-top:20px; }
        .totals-table { width:300px; margin-right:auto; }
        .totals-table td { padding:8px 12px; }
        .total-row { font-weight:bold; font-size:16px; border-top:2px solid #374151; }
        .footer { text-align:center; margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; }
        @media print { .no-print { display:none; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${settings.companyName || 'FixZone'}</div>
          <div class="company-info">
            ${settings.branchAddress || settings.address || 'العنوان غير محدد'}<br>
            هاتف: ${settings.branchPhone || settings.phone || 'غير محدد'} | بريد إلكتروني: ${settings.email || 'غير محدد'}
          </div>
        </div>

        <div class="invoice-info">
          <div class="invoice-details">
            <div class="section-title">تفاصيل الفاتورة</div>
            <div class="info-row"><span class="label">رقم الفاتورة:</span> ${invoiceNumber}</div>
            ${invoice.repairRequestNumber ? `<div class="info-row"><span class="label">رقم طلب الإصلاح:</span> ${invoice.repairRequestNumber}</div>` : ''}
            <div class="info-row"><span class="label">تاريخ الإصدار:</span> ${invoiceDate.toLocaleDateString('ar-SA')}</div>
            <div class="info-row"><span class="label">الحالة:</span> ${statusText}</div>
            ${invoice.dueDate ? `<div class="info-row"><span class="label">تاريخ الاستحقاق:</span> ${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</div>` : ''}
          </div>
          <div class="customer-details">
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="label">الاسم:</span> ${invoice.customerName || 'غير محدد'}</div>
            <div class="info-row"><span class="label">الهاتف:</span> ${invoice.customerPhone || 'غير محدد'}</div>
            ${invoice.customerEmail ? `<div class="info-row"><span class="label">البريد:</span> ${invoice.customerEmail}</div>` : ''}
            ${invoice.customerAddress ? `<div class="info-row"><span class="label">العنوان:</span> ${invoice.customerAddress}</div>` : ''}
          </div>
        </div>

        ${(invoice.deviceBrand || invoice.deviceModel) ? `
        <div class="section-title">تفاصيل الجهاز</div>
        <table class="table">
          <tr>
            ${invoice.deviceBrand ? `<td><strong>الماركة:</strong> ${invoice.deviceBrand}</td>` : ''}
            ${invoice.deviceModel ? `<td><strong>الموديل:</strong> ${invoice.deviceModel}</td>` : ''}
            ${invoice.deviceSerial ? `<td><strong>الرقم التسلسلي:</strong> ${invoice.deviceSerial}</td>` : ''}
          </tr>
        </table>
        ` : ''}

        <div class="section-title">عناصر الفاتورة</div>
        <table class="table">
          <thead>
            <tr>
              <th>الوصف</th>
              <th class="number">الكمية</th>
              <th class="number">سعر الوحدة</th>
              <th class="number">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>
                  ${item.itemName || 'عنصر غير محدد'}${item.itemCode ? ` (${item.itemCode})` : ''}
                  ${settings.showServiceNotes !== false && item.serviceNotes ? `<br/><small style="color: #666; font-size: 0.9em;"><strong>ملاحظات:</strong> ${item.serviceNotes}</small>` : ''}
                </td>
                <td class="number">${Number(item.quantity) || 1}</td>
                <td class="number">${(Number(item.unitPrice) || 0).toFixed(2)} ${invoice.currency || 'ج.م'}</td>
                <td class="number">${(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))).toFixed(2)} ${invoice.currency || 'ج.م'}</td>
              </tr>
            `).join('')}
            ${items.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#6b7280;">لا توجد عناصر في الفاتورة</td></tr>' : ''}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>المجموع الفرعي:</td>
              <td class="number">${subtotal.toFixed(2)} ${invoice.currency || 'ج.م'}</td>
            </tr>
            ${discountAmount > 0 ? `
            <tr>
              <td>الخصم:</td>
              <td class="number">-${discountAmount.toFixed(2)} ${invoice.currency || 'ج.م'}</td>
            </tr>
            ` : ''}
            ${taxAmount > 0 ? `
            <tr>
              <td>الضريبة:</td>
              <td class="number">${taxAmount.toFixed(2)} ${invoice.currency || 'ج.م'}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td>الإجمالي:</td>
              <td class="number">${total.toFixed(2)} ${invoice.currency || 'ج.م'}</td>
            </tr>
            <tr>
              <td>المدفوع:</td>
              <td class="number">${(Number(invoice.amountPaid) || 0).toFixed(2)} ${invoice.currency || 'ج.م'}</td>
            </tr>
            <tr>
              <td>المتبقي:</td>
              <td class="number"><strong>${(total - (Number(invoice.amountPaid) || 0)).toFixed(2)} ${invoice.currency || 'ج.م'}</strong></td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
          <div style="margin-top:20px;">
            <div class="section-title">ملاحظات</div>
            <div style="background:#f9fafb; padding:12px; border-radius:6px; margin-top:8px;">
              ${invoice.notes}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          شكراً لثقتكم بنا | ${settings.companyName || 'FixZone'}<br>
          هذه فاتورة رسمية صادرة بتاريخ ${invoiceDate.toLocaleDateString('ar-SA')}
        </div>

        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 20px; border:1px solid #e5e7eb; border-radius:6px; background:#3b82f6; color:#fff; cursor:pointer;">طباعة الفاتورة</button>
        </div>
      </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing invoice:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
