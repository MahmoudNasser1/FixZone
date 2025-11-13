/**
 * 📤 خدمة التصدير للمدفوعات
 * 
 * تتيح تصدير المدفوعات بصيغ مختلفة (PDF, Excel)
 * مع تنسيق احترافي ودعم اللغة العربية
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
        title = 'تقرير المدفوعات',
        includeCharts = false
      } = options;

      // إنشاء مصنف جديد
      this.workbook = XLSX.utils.book_new();

      // إضافة ورقة المدفوعات
      const paymentsSheet = this.createPaymentsSheet(payments);
      XLSX.utils.book_append_sheet(this.workbook, paymentsSheet, 'المدفوعات');

      // إضافة ورقة الإحصائيات
      const statsSheet = this.createStatisticsSheet(payments);
      XLSX.utils.book_append_sheet(this.workbook, statsSheet, 'الإحصائيات');

      // إضافة الرسوم البيانية إذا طُلب
      if (includeCharts) {
        const chartsSheet = this.createChartsSheet(payments);
        XLSX.utils.book_append_sheet(this.workbook, chartsSheet, 'الرسوم البيانية');
      }

      return this.workbook;
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      throw error;
    }
  }

  // إنشاء ورقة المدفوعات
  createPaymentsSheet(payments) {
    const headers = [
      'رقم المدفوعة',
      'اسم العميل',
      'المبلغ',
      'طريقة الدفع',
      'تاريخ الدفع',
      'الحالة',
      'رقم المرجع',
      'ملاحظات'
    ];

    const data = payments.map(payment => [
      payment.id,
      `${payment.customerFirstName} ${payment.customerLastName}`,
      payment.amount,
      this.getPaymentMethodText(payment.paymentMethod),
      payment.paymentDate,
      this.getStatusText(payment.status),
      payment.referenceNumber || '',
      payment.notes || ''
    ]);

    return XLSX.utils.aoa_to_sheet([headers, ...data]);
  }

  // إنشاء ورقة الإحصائيات
  createStatisticsSheet(payments) {
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    const stats = [
      ['الإحصائيات', 'القيمة'],
      ['إجمالي المدفوعات', payments.length],
      ['إجمالي المبلغ', totalAmount],
      ['المدفوعات المكتملة', completedPayments],
      ['المدفوعات المعلقة', pendingPayments],
      ['متوسط المبلغ', totalAmount / payments.length]
    ];

    return XLSX.utils.aoa_to_sheet(stats);
  }

  // إنشاء ورقة الرسوم البيانية
  createChartsSheet(payments) {
    // حساب توزيع طرق الدفع
    const methodCounts = {};
    payments.forEach(payment => {
      methodCounts[payment.paymentMethod] = (methodCounts[payment.paymentMethod] || 0) + 1;
    });

    const chartData = [
      ['طريقة الدفع', 'العدد', 'النسبة المئوية']
    ];

    Object.entries(methodCounts).forEach(([method, count]) => {
      const percentage = ((count / payments.length) * 100).toFixed(1);
      chartData.push([
        this.getPaymentMethodText(method),
        count,
        `${percentage}%`
      ]);
    });

    return XLSX.utils.aoa_to_sheet(chartData);
  }

  // تحميل ملف PDF
  downloadPDF(filename = 'payments-report.pdf') {
    if (this.pdfDoc) {
      this.pdfDoc.save(filename);
    }
  }

  // تحميل ملف Excel
  downloadExcel(filename = 'payments-report.xlsx') {
    if (this.workbook) {
      XLSX.writeFile(this.workbook, filename);
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
        this.downloadExcel(`selected-payments-${Date.now()}.xlsx`);
      }
    } catch (error) {
      console.error('خطأ في تصدير المدفوعات المحددة:', error);
      throw error;
    }
  }
}

export default new ExportService();
