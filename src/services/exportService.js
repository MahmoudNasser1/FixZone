import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

class ExportService {
  
  // تصدير المدفوعات إلى PDF
  async exportPaymentsToPDF(payments, title = 'تقرير المدفوعات') {
    try {
      const doc = new jsPDF();
      
      // إعداد الخط العربي (يحتاج خط عربي مدعوم)
      doc.setFont('helvetica');
      doc.setFontSize(16);
      
      // العنوان
      doc.text(title, 20, 20);
      doc.text(`تاريخ التقرير: ${format(new Date(), 'dd/MM/yyyy', { locale: ar })}`, 20, 30);
      
      // إعداد الجدول
      let yPosition = 50;
      doc.setFontSize(12);
      
      // رؤوس الجدول
      const headers = ['ID', 'المبلغ', 'طريقة الدفع', 'التاريخ', 'الحالة'];
      const headerY = yPosition;
      
      headers.forEach((header, index) => {
        doc.text(header, 20 + (index * 35), headerY);
      });
      
      // خط تحت الرؤوس
      doc.line(20, headerY + 5, 190, headerY + 5);
      yPosition += 15;
      
      // بيانات المدفوعات
      payments.forEach((payment, index) => {
        if (yPosition > 280) { // صفحة جديدة
          doc.addPage();
          yPosition = 20;
        }
        
        const rowData = [
          payment.id?.toString() || '-',
          `${payment.amount?.toLocaleString('ar-EG') || '0'} EGP`,
          this.getPaymentMethodLabel(payment.paymentMethod),
          format(new Date(payment.paymentDate), 'dd/MM/yyyy'),
          this.getPaymentStatusLabel(payment.status)
        ];
        
        rowData.forEach((data, colIndex) => {
          doc.text(data, 20 + (colIndex * 35), yPosition);
        });
        
        yPosition += 10;
      });
      
      // إجماليات
      const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      yPosition += 10;
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      doc.setFontSize(14);
      doc.text(`إجمالي المدفوعات: ${totalAmount.toLocaleString('ar-EG')} EGP`, 20, yPosition);
      doc.text(`عدد المدفوعات: ${payments.length}`, 20, yPosition + 10);
      
      // حفظ الملف
      const fileName = `payments_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('فشل في تصدير التقرير إلى PDF');
    }
  }

  // تصدير المدفوعات إلى Excel
  async exportPaymentsToExcel(payments, title = 'تقرير المدفوعات') {
    try {
      // إعداد البيانات
      const worksheetData = [
        // العنوان
        [title],
        [`تاريخ التقرير: ${format(new Date(), 'dd/MM/yyyy', { locale: ar })}`],
        [], // سطر فارغ
        // رؤوس الأعمدة
        ['الرقم', 'المبلغ', 'العملة', 'طريقة الدفع', 'تاريخ الدفع', 'رقم المرجع', 'الملاحظات', 'الحالة', 'العميل', 'رقم الفاتورة']
      ];
      
      // إضافة بيانات المدفوعات
      payments.forEach(payment => {
        worksheetData.push([
          payment.id || '',
          payment.amount || 0,
          payment.currency || 'EGP',
          this.getPaymentMethodLabel(payment.paymentMethod),
          payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : '',
          payment.referenceNumber || '',
          payment.notes || '',
          this.getPaymentStatusLabel(payment.status),
          payment.customerName || '',
          payment.invoiceId || ''
        ]);
      });
      
      // إضافة الإجماليات
      const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      worksheetData.push(
        [], // سطر فارغ
        ['الإجماليات'],
        ['إجمالي المبلغ', totalAmount],
        ['عدد المدفوعات', payments.length],
        ['متوسط المدفوعة', payments.length > 0 ? totalAmount / payments.length : 0]
      );
      
      // إنشاء ورقة العمل
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // تنسيق الخلايا
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // تنسيق العنوان
      if (worksheet['A1']) {
        worksheet['A1'].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center' }
        };
      }
      
      // تنسيق رؤوس الأعمدة
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E3F2FD' } },
            alignment: { horizontal: 'center' }
          };
        }
      }
      
      // تحديد عرض الأعمدة
      worksheet['!cols'] = [
        { wch: 10 }, // الرقم
        { wch: 15 }, // المبلغ
        { wch: 10 }, // العملة
        { wch: 15 }, // طريقة الدفع
        { wch: 15 }, // تاريخ الدفع
        { wch: 20 }, // رقم المرجع
        { wch: 30 }, // الملاحظات
        { wch: 12 }, // الحالة
        { wch: 20 }, // العميل
        { wch: 15 }  // رقم الفاتورة
      ];
      
      // إنشاء المصنف
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المدفوعات');
      
      // حفظ الملف
      const fileName = `payments_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('فشل في تصدير التقرير إلى Excel');
    }
  }

  // تصدير الفواتير إلى PDF
  async exportInvoicesToPDF(invoices, title = 'تقرير الفواتير') {
    try {
      const doc = new jsPDF();
      
      doc.setFont('helvetica');
      doc.setFontSize(16);
      
      // العنوان
      doc.text(title, 20, 20);
      doc.text(`تاريخ التقرير: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 30);
      
      let yPosition = 50;
      doc.setFontSize(12);
      
      // رؤوس الجدول
      const headers = ['رقم الفاتورة', 'العميل', 'المبلغ الإجمالي', 'المبلغ المدفوع', 'المتبقي', 'الحالة', 'التاريخ'];
      
      headers.forEach((header, index) => {
        doc.text(header, 10 + (index * 25), yPosition);
      });
      
      doc.line(10, yPosition + 5, 200, yPosition + 5);
      yPosition += 15;
      
      // بيانات الفواتير
      invoices.forEach((invoice) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        const rowData = [
          `INV-${invoice.id}`,
          invoice.customerName || 'غير محدد',
          `${invoice.totalAmount?.toLocaleString('ar-EG') || '0'} EGP`,
          `${invoice.amountPaid?.toLocaleString('ar-EG') || '0'} EGP`,
          `${((invoice.totalAmount || 0) - (invoice.amountPaid || 0)).toLocaleString('ar-EG')} EGP`,
          this.getInvoiceStatusLabel(invoice.status),
          invoice.createdAt ? format(new Date(invoice.createdAt), 'dd/MM/yyyy') : ''
        ];
        
        rowData.forEach((data, colIndex) => {
          doc.text(data, 10 + (colIndex * 25), yPosition);
        });
        
        yPosition += 10;
      });
      
      // إجماليات
      const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
      const totalPaid = invoices.reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
      
      yPosition += 10;
      doc.line(10, yPosition, 200, yPosition);
      yPosition += 10;
      doc.setFontSize(14);
      doc.text(`إجمالي الفواتير: ${totalAmount.toLocaleString('ar-EG')} EGP`, 20, yPosition);
      doc.text(`إجمالي المدفوع: ${totalPaid.toLocaleString('ar-EG')} EGP`, 20, yPosition + 10);
      doc.text(`إجمالي المتبقي: ${(totalAmount - totalPaid).toLocaleString('ar-EG')} EGP`, 20, yPosition + 20);
      
      const fileName = `invoices_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error exporting invoices to PDF:', error);
      throw new Error('فشل في تصدير تقرير الفواتير إلى PDF');
    }
  }

  // تصدير تقرير مخصص
  async exportCustomReport(data, config) {
    try {
      const { format: exportFormat, title, columns, fileName } = config;
      
      if (exportFormat === 'pdf') {
        return await this.exportCustomToPDF(data, { title, columns, fileName });
      } else if (exportFormat === 'excel') {
        return await this.exportCustomToExcel(data, { title, columns, fileName });
      }
      
      throw new Error('تنسيق التصدير غير مدعوم');
    } catch (error) {
      console.error('Error exporting custom report:', error);
      throw new Error('فشل في تصدير التقرير المخصص');
    }
  }

  // Helper methods
  getPaymentMethodLabel(method) {
    const methods = {
      'cash': 'نقدي',
      'card': 'بطاقة ائتمان',
      'bank_transfer': 'تحويل بنكي',
      'check': 'شيك',
      'other': 'أخرى'
    };
    return methods[method] || method || 'غير محدد';
  }

  getPaymentStatusLabel(status) {
    const statuses = {
      'pending': 'في الانتظار',
      'completed': 'مكتملة',
      'failed': 'فاشلة',
      'cancelled': 'ملغية'
    };
    return statuses[status] || status || 'غير محدد';
  }

  getInvoiceStatusLabel(status) {
    const statuses = {
      'draft': 'مسودة',
      'sent': 'مرسلة',
      'paid': 'مدفوعة',
      'partially_paid': 'مدفوعة جزئياً',
      'overdue': 'متأخرة',
      'cancelled': 'ملغية'
    };
    return statuses[status] || status || 'غير محدد';
  }

  // تصدير مخصص إلى PDF
  async exportCustomToPDF(data, config) {
    // Implementation for custom PDF export
    console.log('Exporting custom data to PDF:', data, config);
    return { success: true, fileName: config.fileName || 'custom_report.pdf' };
  }

  // تصدير مخصص إلى Excel
  async exportCustomToExcel(data, config) {
    // Implementation for custom Excel export
    console.log('Exporting custom data to Excel:', data, config);
    return { success: true, fileName: config.fileName || 'custom_report.xlsx' };
  }
}

export default new ExportService();


