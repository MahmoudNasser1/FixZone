/**
 * 📤 خدمة التصدير للمدفوعات
 * 
 * تتيح تصدير المدفوعات بصيغ مختلفة (PDF, Excel)
 * مع تنسيق احترافي ودعم اللغة العربية
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

class ExportService {
  constructor() {
    this.pdfDoc = null;
    this.workbook = null;
  }

  // تصدير PDF للمدفوعات
  async exportPaymentsToPDF(payments, options = {}) {
    try {
      const {
        title = 'تقرير المدفوعات',
        includeCharts = false,
        dateRange = null,
        customerFilter = null
      } = options;

      // إنشاء مستند PDF جديد
      this.pdfDoc = new jsPDF('p', 'mm', 'a4');
      
      // إضافة العنوان
      this.pdfDoc.setFontSize(20);
      this.pdfDoc.text(title, 105, 20, { align: 'center' });

      // إضافة التاريخ
      const currentDate = new Date().toLocaleDateString('en-GB');
      this.pdfDoc.setFontSize(12);
      this.pdfDoc.text(`تاريخ التقرير: ${currentDate}`, 105, 30, { align: 'center' });

      // إضافة معلومات إضافية
      if (dateRange) {
        this.pdfDoc.text(`الفترة: ${dateRange.from} - ${dateRange.to}`, 105, 35, { align: 'center' });
      }

      if (customerFilter) {
        this.pdfDoc.text(`العميل: ${customerFilter}`, 105, 40, { align: 'center' });
      }

      // إضافة جدول المدفوعات
      this.addPaymentsTable(payments);

      // إضافة الإحصائيات
      this.addStatistics(payments);

      // إضافة الرسوم البيانية إذا طُلب
      if (includeCharts) {
        this.addCharts(payments);
      }

      // إضافة التذييل
      this.addFooter();

      return this.pdfDoc;
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      throw error;
    }
  }

  // إضافة جدول المدفوعات
  addPaymentsTable(payments) {
    const tableData = payments.map(payment => [
      payment.id,
      payment.customerFirstName + ' ' + payment.customerLastName,
      payment.amount.toLocaleString('ar-EG'),
      this.getPaymentMethodText(payment.paymentMethod),
      payment.paymentDate,
      this.getStatusText(payment.status)
    ]);

    const columns = [
      'رقم المدفوعة',
      'اسم العميل',
      'المبلغ',
      'طريقة الدفع',
      'تاريخ الدفع',
      'الحالة'
    ];

    this.pdfDoc.autoTable({
      head: [columns],
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
  }

  // إضافة الإحصائيات
  addStatistics(payments) {
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    const stats = [
      `إجمالي المدفوعات: ${payments.length}`,
      `إجمالي المبلغ: ${totalAmount.toLocaleString('ar-EG')} جنيه`,
      `المدفوعات المكتملة: ${completedPayments}`,
      `المدفوعات المعلقة: ${pendingPayments}`
    ];

    let yPosition = this.pdfDoc.lastAutoTable.finalY + 20;
    
    this.pdfDoc.setFontSize(14);
    this.pdfDoc.text('الإحصائيات', 20, yPosition);
    
    yPosition += 10;
    this.pdfDoc.setFontSize(12);
    
    stats.forEach(stat => {
      this.pdfDoc.text(stat, 20, yPosition);
      yPosition += 8;
    });
  }

  // إضافة الرسوم البيانية
  addCharts(payments) {
    // هنا يمكن إضافة رسوم بيانية بسيطة
    // للتعقيد، سنضيف نص بدلاً من الرسم البياني
    const yPosition = this.pdfDoc.lastAutoTable.finalY + 20;
    
    this.pdfDoc.setFontSize(14);
    this.pdfDoc.text('توزيع طرق الدفع', 20, yPosition);
    
    // حساب توزيع طرق الدفع
    const methodCounts = {};
    payments.forEach(payment => {
      methodCounts[payment.paymentMethod] = (methodCounts[payment.paymentMethod] || 0) + 1;
    });

    let chartY = yPosition + 10;
    this.pdfDoc.setFontSize(10);
    
    Object.entries(methodCounts).forEach(([method, count]) => {
      const percentage = ((count / payments.length) * 100).toFixed(1);
      this.pdfDoc.text(`${this.getPaymentMethodText(method)}: ${count} (${percentage}%)`, 20, chartY);
      chartY += 6;
    });
  }

  // إضافة التذييل
  addFooter() {
    const pageCount = this.pdfDoc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdfDoc.setPage(i);
      this.pdfDoc.setFontSize(8);
      this.pdfDoc.text(
        `صفحة ${i} من ${pageCount} - تم إنشاؤها بواسطة FixZone ERP`,
        105,
        290,
        { align: 'center' }
      );
    }
  }

  // تصدير Excel للمدفوعات
  async exportPaymentsToExcel(payments, options = {}) {
    try {
      const {
        includeCharts = false
      } = options;

      // إنشاء مصنف جديد
      this.workbook = new ExcelJS.Workbook();

      // إضافة ورقة المدفوعات
      await this.createPaymentsSheet(payments, this.workbook);

      // إضافة ورقة الإحصائيات
      await this.createStatisticsSheet(payments, this.workbook);

      // إضافة الرسوم البيانية إذا طُلب
      if (includeCharts) {
        await this.createChartsSheet(payments, this.workbook);
      }

      return this.workbook;
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      throw error;
    }
  }

  // إنشاء ورقة المدفوعات
  async createPaymentsSheet(payments, workbook) {
    const worksheet = workbook.addWorksheet('المدفوعات');
    
    // Define columns
    worksheet.columns = [
      { header: 'رقم المدفوعة', key: 'id', width: 15 },
      { header: 'اسم العميل', key: 'customerName', width: 30 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'طريقة الدفع', key: 'paymentMethod', width: 20 },
      { header: 'تاريخ الدفع', key: 'paymentDate', width: 20 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'رقم المرجع', key: 'referenceNumber', width: 20 },
      { header: 'ملاحظات', key: 'notes', width: 40 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    // Add data
    payments.forEach(payment => {
      worksheet.addRow({
        id: payment.id,
        customerName: `${payment.customerFirstName || ''} ${payment.customerLastName || ''}`.trim(),
        amount: payment.amount,
        paymentMethod: this.getPaymentMethodText(payment.paymentMethod),
        paymentDate: payment.paymentDate,
        status: this.getStatusText(payment.status),
        referenceNumber: payment.referenceNumber || '',
        notes: payment.notes || ''
      });
    });
  }

  // إنشاء ورقة الإحصائيات
  async createStatisticsSheet(payments, workbook) {
    const worksheet = workbook.addWorksheet('الإحصائيات');
    
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const averageAmount = payments.length > 0 ? totalAmount / payments.length : 0;

    // Define columns
    worksheet.columns = [
      { header: 'الإحصائيات', key: 'stat', width: 30 },
      { header: 'القيمة', key: 'value', width: 20 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    // Add data
    worksheet.addRow({ stat: 'إجمالي المدفوعات', value: payments.length });
    worksheet.addRow({ stat: 'إجمالي المبلغ', value: totalAmount });
    worksheet.addRow({ stat: 'المدفوعات المكتملة', value: completedPayments });
    worksheet.addRow({ stat: 'المدفوعات المعلقة', value: pendingPayments });
    worksheet.addRow({ stat: 'متوسط المبلغ', value: averageAmount });
  }

  // إنشاء ورقة الرسوم البيانية
  async createChartsSheet(payments, workbook) {
    const worksheet = workbook.addWorksheet('الرسوم البيانية');
    
    // حساب توزيع طرق الدفع
    const methodCounts = {};
    payments.forEach(payment => {
      methodCounts[payment.paymentMethod] = (methodCounts[payment.paymentMethod] || 0) + 1;
    });

    // Define columns
    worksheet.columns = [
      { header: 'طريقة الدفع', key: 'method', width: 25 },
      { header: 'العدد', key: 'count', width: 15 },
      { header: 'النسبة المئوية', key: 'percentage', width: 20 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    // Add data
    Object.entries(methodCounts).forEach(([method, count]) => {
      const percentage = payments.length > 0 ? ((count / payments.length) * 100).toFixed(1) : 0;
      worksheet.addRow({
        method: this.getPaymentMethodText(method),
        count: count,
        percentage: `${percentage}%`
      });
    });
  }

  // تحميل ملف PDF
  downloadPDF(filename = 'payments-report.pdf') {
    if (this.pdfDoc) {
      this.pdfDoc.save(filename);
    }
  }

  // تحميل ملف Excel
  async downloadExcel(filename = 'payments-report.xlsx') {
    if (this.workbook) {
      const buffer = await this.workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  // الحصول على نص طريقة الدفع
  getPaymentMethodText(method) {
    const methods = {
      'cash': 'نقد',
      'card': 'بطاقة ائتمان',
      'transfer': 'تحويل بنكي',
      'check': 'شيك',
      'other': 'أخرى'
    };
    return methods[method] || method;
  }

  // الحصول على نص الحالة
  getStatusText(status) {
    const statuses = {
      'completed': 'مكتمل',
      'pending': 'معلق',
      'failed': 'فشل',
      'cancelled': 'ملغي'
    };
    return statuses[status] || status;
  }

  // تصدير مدفوعات محددة
  async exportSelectedPayments(paymentIds, format = 'pdf') {
    try {
      // هنا يمكن جلب المدفوعات المحددة من API
      const payments = []; // سيتم جلبها من API
      
      if (format === 'pdf') {
        await this.exportPaymentsToPDF(payments);
        this.downloadPDF(`selected-payments-${Date.now()}.pdf`);
      } else if (format === 'excel') {
        await this.exportPaymentsToExcel(payments);
        await this.downloadExcel(`selected-payments-${Date.now()}.xlsx`);
      }
    } catch (error) {
      console.error('خطأ في تصدير المدفوعات المحددة:', error);
      throw error;
    }
  }
}

const exportService = new ExportService();
export default exportService;
