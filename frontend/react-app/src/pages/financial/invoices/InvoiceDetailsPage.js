// Invoice Details Page
// Page for viewing invoice details

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Edit } from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../../components/ui/SimpleCard';
import SimpleButton from '../../../components/ui/SimpleButton';
import SimpleBadge from '../../../components/ui/SimpleBadge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useInvoices } from '../../../hooks/financial/useInvoices';
import { usePayments } from '../../../hooks/financial/usePayments';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, generatePDF, loading: invoiceLoading } = useInvoices();
  const { getByInvoice, loading: paymentsLoading } = usePayments();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const invoiceData = await getById(id);
        setInvoice(invoiceData);

        // Fetch payments
        try {
          const paymentsData = await getByInvoice(id);
          setPayments(paymentsData.payments || []);
          setPaymentsSummary(paymentsData.summary || null);
        } catch (err) {
          console.error('Error fetching payments:', err);
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, getById, getByInvoice]);

  const handlePrint = async () => {
    try {
      const pdfBlob = await generatePDF(id);
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/financial/invoices/${id}/edit`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  };

  const getStatusLabel = (status) => {
    const statuses = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      partially_paid: 'مدفوعة جزئياً',
      overdue: 'متأخرة',
      cancelled: 'ملغاة'
    };
    return statuses[status] || status;
  };

  const getStatusVariant = (status) => {
    const variants = {
      draft: 'secondary',
      sent: 'default',
      paid: 'success',
      partially_paid: 'warning',
      overdue: 'destructive',
      cancelled: 'secondary'
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background p-6">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <p className="text-destructive mb-4">الفاتورة غير موجودة</p>
            <SimpleButton onClick={() => navigate('/financial/invoices')}>
              رجوع
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/financial/invoices')}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              رجوع
            </SimpleButton>
            <h1 className="text-3xl font-bold text-foreground">
              فاتورة #{invoice.invoiceNumber || invoice.id}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </SimpleButton>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </SimpleButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <SimpleCard>
              <SimpleCardHeader>
                <h2 className="text-xl font-semibold text-foreground">معلومات الفاتورة</h2>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">رقم الفاتورة</p>
                    <p className="font-semibold text-foreground">
                      {invoice.invoiceNumber || `#${invoice.id}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الحالة</p>
                    <SimpleBadge variant={getStatusVariant(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </SimpleBadge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">العميل</p>
                    <p className="text-foreground">{invoice.customerName || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">تاريخ الإصدار</p>
                    <p className="text-foreground">
                      {formatDate(invoice.issueDate || invoice.createdAt)}
                    </p>
                  </div>

                  {invoice.dueDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">تاريخ الاستحقاق</p>
                      <p className="text-foreground">{formatDate(invoice.dueDate)}</p>
                    </div>
                  )}

                  {invoice.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
                      <p className="text-foreground">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Invoice Items */}
            <SimpleCard>
              <SimpleCardHeader>
                <h2 className="text-xl font-semibold text-foreground">عناصر الفاتورة</h2>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">الوصف</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">الكمية</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">سعر الوحدة</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, index) => (
                          <tr key={item.id || index} className="border-b border-border last:border-0">
                            <td className="py-3 px-4 text-foreground">{item.description}</td>
                            <td className="py-3 px-4 text-foreground">{item.quantity}</td>
                            <td className="py-3 px-4 text-foreground">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 px-4 font-semibold text-foreground">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted-foreground">
                            لا توجد عناصر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">المجموع الفرعي</span>
                      <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
                    </div>

                    {invoice.taxAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">الضريبة (14%)</span>
                        <span className="text-foreground">{formatCurrency(invoice.taxAmount)}</span>
                      </div>
                    )}

                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">الخصم</span>
                        <span className="text-destructive">-{formatCurrency(invoice.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-lg font-semibold text-foreground">الإجمالي</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Payments Sidebar */}
          <div className="lg:col-span-1">
            <SimpleCard>
              <SimpleCardHeader>
                <h2 className="text-xl font-semibold text-foreground">المدفوعات</h2>
              </SimpleCardHeader>
              <SimpleCardContent>
                {paymentsSummary && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">المدفوع</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(paymentsSummary.totalPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">المتبقي</p>
                      <p className="text-xl font-bold text-destructive">
                        {formatCurrency(paymentsSummary.remaining)}
                      </p>
                    </div>
                  </div>
                )}

                {paymentsLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground mb-2">سجل المدفوعات</h3>
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <p className="font-semibold text-foreground mb-1">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate || payment.createdAt)} - {payment.paymentMethod}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد مدفوعات
                  </p>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;
