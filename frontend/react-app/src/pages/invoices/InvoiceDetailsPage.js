import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import apiService from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { 
  ArrowRight, FileText, DollarSign, Calendar, User, Building2,
  CheckCircle, XCircle, Clock, AlertCircle, Download, Edit, 
  Plus, Eye, Printer, Send, CreditCard, Receipt
} from 'lucide-react';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  
  // Check if this is the new invoice route
  const isNewInvoice = location.pathname === '/invoices/new';
  const effectiveId = isNewInvoice ? 'new' : id;
  
  const { formatMoney } = useSettings();
  
  const [invoice, setInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (effectiveId) {
      fetchInvoiceDetails();
    } else {
      setLoading(false);
    }
  }, [effectiveId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if this is a new invoice
      if (effectiveId === 'new') {
        // For new invoice, set default values
        setInvoice({
          id: null,
          totalAmount: 0,
          amountPaid: 0,
          status: 'draft',
          currency: 'EGP',
          taxAmount: 0,
          discountAmount: 0,
          notes: '',
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setInvoiceItems([]);
        setPayments([]);
        setLoading(false);
        return;
      }
      
      // Fetch invoice details
      console.log('Fetching invoice with ID:', effectiveId);
      const invoiceResponse = await apiService.getInvoiceById(effectiveId);
      console.log('Invoice response status:', invoiceResponse.status);
      if (invoiceResponse.ok) {
        const responseData = await invoiceResponse.json();
        console.log('Invoice response data:', responseData);
        const invoiceData = responseData.data || responseData;
        console.log('Processed invoice data:', invoiceData);
        setInvoice(invoiceData);
        
        // Fetch invoice items
        const itemsResponse = await apiService.getInvoiceItems(effectiveId);
        console.log('Items response status:', itemsResponse.status);
        if (itemsResponse.ok) {
          const itemsResponseData = await itemsResponse.json();
          console.log('Items response data:', itemsResponseData);
          const itemsData = itemsResponseData.data || itemsResponseData;
          setInvoiceItems(Array.isArray(itemsData) ? itemsData : []);
        }
        
        // Fetch payments
        const paymentsResponse = await apiService.getInvoicePayments(effectiveId);
        console.log('Payments response status:', paymentsResponse.status);
        if (paymentsResponse.ok) {
          const paymentsResponseData = await paymentsResponse.json();
          console.log('Payments response data:', paymentsResponseData);
          const paymentsData = paymentsResponseData.data || paymentsResponseData;
          setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        }
    } else {
        throw new Error('Failed to fetch invoice details');
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError('حدث خطأ في تحميل تفاصيل الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { variant: 'default', icon: CheckCircle, text: 'مدفوعة', color: 'text-green-600' },
      'unpaid': { variant: 'destructive', icon: XCircle, text: 'غير مدفوعة', color: 'text-red-600' },
      'partial': { variant: 'secondary', icon: Clock, text: 'مدفوعة جزئياً', color: 'text-yellow-600' },
      'overdue': { variant: 'destructive', icon: AlertCircle, text: 'متأخرة', color: 'text-red-600' },
      'cancelled': { variant: 'outline', icon: XCircle, text: 'ملغاة', color: 'text-gray-600' }
    };

    const config = statusConfig[status] || statusConfig['unpaid'];
    const Icon = config.icon;

    return (
      <SimpleBadge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </SimpleBadge>
    );
  };

  const getPaymentMethodLabel = (method) => {
    const methodLabels = {
      'cash': 'نقدي',
      'card': 'بطاقة ائتمان',
      'bank_transfer': 'تحويل بنكي',
      'check': 'شيك',
      'other': 'أخرى'
    };
    return methodLabels[method] || method;
  };

  const formatCurrency = (amount, currency = 'EGP') => {
    return formatMoney(amount || 0, currency);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-SA');
  };

  const handlePrintInvoice = async () => {
    try {
      const response = await apiService.generateInvoicePDF(id);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('حدث خطأ في طباعة الفاتورة');
      }
    } catch (err) {
      console.error('Error printing invoice:', err);
      alert('حدث خطأ في طباعة الفاتورة');
    }
  };

  const handleSendInvoice = async () => {
    if (window.confirm('هل تريد إرسال الفاتورة للعميل؟')) {
      try {
        // Implement send invoice functionality
        alert('تم إرسال الفاتورة للعميل');
      } catch (err) {
        console.error('Error sending invoice:', err);
        alert('حدث خطأ في إرسال الفاتورة');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل الفاتورة...</p>
        </div>
      </div>
    );
  }

  console.log('Current state - loading:', loading, 'error:', error, 'invoice:', invoice);

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل الفاتورة</h3>
        <p className="text-gray-500 mb-6">{error || 'الفاتورة غير موجودة'}</p>
        <Link to="/invoices">
          <SimpleButton>
            العودة للفواتير
          </SimpleButton>
        </Link>
      </div>
    );
  }

  const remainingAmount = (invoice.totalAmount || 0) - (invoice.amountPaid || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Link to="/invoices">
              <SimpleButton variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              فاتورة #{invoice.id}
            </h1>
            {getStatusBadge(invoice.status)}
          </div>
          <p className="text-gray-600">
            تاريخ الإنشاء: {formatDate(invoice.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to={`/invoices/${invoice.id}/edit`}>
            <SimpleButton variant="outline">
              <Edit className="w-4 h-4 ml-2" />
              تعديل الفاتورة
            </SimpleButton>
          </Link>
          <SimpleButton onClick={handlePrintInvoice}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </SimpleButton>
          <SimpleButton onClick={handleSendInvoice}>
            <Send className="w-4 h-4 ml-2" />
            إرسال
          </SimpleButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
        <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center">
                <FileText className="w-5 h-5 ml-2" />
                معلومات الفاتورة
              </SimpleCardTitle>
            </SimpleCardHeader>
          <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">رقم الفاتورة</label>
                  <p className="text-lg font-semibold text-gray-900">#{invoice.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">تاريخ الإنشاء</label>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ الإجمالي</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.totalAmount, invoice.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ المدفوع</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.amountPaid, invoice.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ المتبقي</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(remainingAmount, invoice.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الضريبة</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</p>
                </div>
              </div>
          </SimpleCardContent>
        </SimpleCard>

          {/* Invoice Items */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>عناصر الفاتورة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
              {invoiceItems.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد عناصر في هذه الفاتورة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoiceItems.map((item, index) => (
                    <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.description}</h4>
                          <p className="text-sm text-gray-600">
                            الكمية: {item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}
                          </p>
                          <p className="text-sm text-gray-500">
                            النوع: {item.itemType === 'service' ? 'خدمة' : 'قطعة'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(item.totalPrice, invoice.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </SimpleCardContent>
            </SimpleCard>

          {/* Related Repair Request */}
          {invoice.repairRequestId && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <FileText className="w-5 h-5 ml-2" />
                  طلب الإصلاح المرتبط
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                  <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">طلب الإصلاح</p>
                    <p className="font-medium text-gray-900">#{invoice.repairRequestId}</p>
                  </div>
                  <Link to={`/repairs/${invoice.repairRequestId}`}>
                    <SimpleButton variant="outline" size="sm">
                      <Eye className="w-4 h-4 ml-2" />
                      عرض الطلب
                    </SimpleButton>
                  </Link>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 ml-2" />
                ملخص المدفوعات
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">المبلغ الإجمالي:</span>
                  <span className="font-semibold">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المدفوع:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المتبقي:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(remainingAmount, invoice.currency)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">نسبة الدفع:</span>
                    <span className="font-semibold">
                      {invoice.totalAmount > 0 ? 
                        Math.round((invoice.amountPaid / invoice.totalAmount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Payment History */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Receipt className="w-5 h-5 ml-2" />
                  تاريخ المدفوعات
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-sm text-gray-500">
                    {payments.length} مدفوعة
                  </span>
                  <Link to={`/payments/new?invoiceId=${invoice.id}`}>
                    <SimpleButton size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة مدفوعة
                    </SimpleButton>
                  </Link>
                </div>
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">لا توجد مدفوعات لهذه الفاتورة</p>
                  <Link to={`/payments/new?invoiceId=${invoice.id}`}>
                    <SimpleButton className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة أول مدفوعة
                    </SimpleButton>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Payment Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">إجمالي المدفوعات:</span>
                        <p className="text-blue-900 font-semibold text-lg">
                          {formatCurrency(payments.reduce((sum, p) => sum + parseFloat(p.amount), 0), invoice.currency)}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">المتبقي:</span>
                        <p className="text-blue-900 font-semibold text-lg">
                          {formatCurrency(remainingAmount, invoice.currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment List */}
                  <div className="space-y-3">
                    {payments.map((payment, index) => (
                      <div key={payment.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-lg text-gray-900">
                                {formatCurrency(payment.amount, payment.currency)}
                              </p>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Link to={`/payments/${payment.id}`}>
                                  <SimpleButton variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </SimpleButton>
                                </Link>
                                <Link to={`/payments/${payment.id}/edit`}>
                                  <SimpleButton variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </SimpleButton>
                                </Link>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">طريقة الدفع:</span>
                                <p className="text-gray-900">{getPaymentMethodLabel(payment.paymentMethod)}</p>
                              </div>
                              <div>
                                <span className="font-medium">تاريخ الدفع:</span>
                                <p className="text-gray-900">{formatDate(payment.paymentDate)}</p>
                              </div>
                              {payment.referenceNumber && (
                                <div>
                                  <span className="font-medium">رقم المرجع:</span>
                                  <p className="text-gray-900">{payment.referenceNumber}</p>
                                </div>
                              )}
                              {payment.notes && (
                                <div className="col-span-2">
                                  <span className="font-medium">الملاحظات:</span>
                                  <p className="text-gray-900">{payment.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>

          {/* Add Item Form - Only for new invoices */}
          {id === 'new' && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>إضافة عنصر للفاتورة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        وصف العنصر
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="مثال: إصلاح الشاشة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الكمية
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        سعر الوحدة
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        نوع العنصر
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="part">قطعة غيار</option>
                        <option value="service">خدمة</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SimpleButton className="flex-1">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة العنصر
                    </SimpleButton>
                    <SimpleButton variant="outline" className="flex-1">
                      حفظ الفاتورة
                    </SimpleButton>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* Quick Actions */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>إجراءات سريعة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-2">
                {id !== 'new' && (
                  <Link to={`/payments/new?invoiceId=${invoice.id}`} className="block">
                    <SimpleButton variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة دفعة
                    </SimpleButton>
                  </Link>
                )}
                <SimpleButton variant="outline" size="sm" className="w-full" onClick={handlePrintInvoice}>
                  <Download className="w-4 h-4 ml-2" />
                  تحميل PDF
                </SimpleButton>
                <SimpleButton variant="outline" size="sm" className="w-full" onClick={handleSendInvoice}>
                  <Send className="w-4 h-4 ml-2" />
                  إرسال للعميل
                </SimpleButton>
          </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;