import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import apiService from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { 
  ArrowRight, FileText, DollarSign, Calendar, User, Building2,
  CheckCircle, XCircle, Clock, AlertCircle, Download, Edit, 
  Plus, Eye, Printer, Send, CreditCard, Receipt, Wrench, 
  Paperclip, Copy, Check
} from 'lucide-react';
import SendButton from '../../components/messaging/SendButton';
import MessageLogViewer from '../../components/messaging/MessageLogViewer';
import { getDefaultApiBaseUrl, getFrontendBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

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
  const [trackingLinkCopied, setTrackingLinkCopied] = useState(false);

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
      const invoiceData = await apiService.getInvoiceById(effectiveId);
      console.log('Invoice response data:', invoiceData);
      const invoice = invoiceData.data || invoiceData;
      console.log('Processed invoice data:', invoice);
      setInvoice(invoice);
      
      // Fetch invoice items (with error handling)
      try {
        const itemsData = await apiService.getInvoiceItems(effectiveId);
        console.log('Items response data:', itemsData);
        const items = itemsData.data || itemsData;
        setInvoiceItems(Array.isArray(items) ? items : []);
      } catch (itemsErr) {
        console.warn('Could not fetch invoice items:', itemsErr.message);
        setInvoiceItems([]);
      }
      
      // Fetch payments (with error handling)
      try {
        const paymentsData = await apiService.getInvoicePayments(effectiveId);
        console.log('Payments response data:', paymentsData);
        // API returns { payments: [...], summary: {...} }
        const payments = paymentsData.payments || paymentsData.data || (Array.isArray(paymentsData) ? paymentsData : []);
        setPayments(Array.isArray(payments) ? payments : []);
      } catch (paymentsErr) {
        console.warn('Could not fetch invoice payments:', paymentsErr.message);
        setPayments([]);
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
    if (!date) return 'غير محدد';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
      return dateObj.toLocaleDateString('en-GB');
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'تاريخ غير صحيح';
    }
  };

  const handlePrintInvoice = () => {
    // Use invoice.id if available, otherwise fall back to id from params
    const invoiceId = invoice?.id || id;
    
    console.log('Print invoice clicked:', { invoiceId, invoice: invoice?.id, id });
    
    if (!invoiceId || invoiceId === 'new') {
      console.error('Cannot print: Invoice ID is missing or invalid', { invoiceId, invoice: invoice?.id, id });
      alert('لا يمكن طباعة الفاتورة: رقم الفاتورة غير صحيح');
      return;
    }
    
    try {
      const base = `${API_BASE_URL}/invoices`;
      const url = `${base}/${invoiceId}/print`;
      console.log('Opening print URL:', url, 'API_BASE_URL:', API_BASE_URL);
      
      const printWindow = window.open(url, '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window - popup blocked');
        alert('فشل فتح نافذة الطباعة. يرجى التحقق من إعدادات منع النوافذ المنبثقة.');
      } else {
        console.log('Print window opened successfully');
      }
    } catch (error) {
      console.error('Error opening print window:', error);
      alert('حدث خطأ أثناء محاولة فتح صفحة الطباعة');
    }
  };

  // Handle successful send
  const handleSendSuccess = (result) => {
    console.log('Message sent successfully:', result);
    // Optionally refresh invoice data or show success message
  };

  // Handle send error
  const handleSendError = (error) => {
    console.error('Error sending message:', error);
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

  // 🔧 Fix: Calculate totalAmount from invoiceItems if available (more accurate than stored value)
  const calculatedTotalFromItems = invoiceItems.reduce((sum, item) => {
    return sum + (parseFloat(item.totalPrice) || 0);
  }, 0);
  
  // Use calculated total if items exist, otherwise use stored totalAmount
  const subtotal = invoiceItems.length > 0 && calculatedTotalFromItems > 0 
    ? calculatedTotalFromItems 
    : (invoice.totalAmount || 0);
  
  // Calculate discount, tax, and shipping
  const discountPercent = Number(invoice.discountPercent) || 0;
  const discountAmount = discountPercent > 0 && subtotal > 0 
    ? (subtotal * discountPercent) / 100 
    : (Number(invoice.discountAmount) || 0);
  const taxAmount = Number(invoice.taxAmount) || 0;
  const shippingAmount = Number(invoice.shippingAmount) || 0;
  
  // Calculate final total
  const effectiveTotalAmount = subtotal - discountAmount + taxAmount + shippingAmount;
  
  const remainingAmount = effectiveTotalAmount - (invoice.amountPaid || 0);

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
          {invoice.customerPhone && (
            <div className="space-y-2">
              <SendButton
                entityType="invoice"
                entityId={invoice.id}
                customerId={invoice.customerId}
                recipient={invoice.customerPhone}
                template="defaultMessage"
                onSuccess={handleSendSuccess}
                onError={handleSendError}
                showChannelSelector={true}
                defaultChannels={['whatsapp']}
              />
              <p className="text-xs text-gray-500">
                يمكنك اختيار إرسال الفاتورة عبر واتساب أو البريد الإلكتروني أو كليهما
              </p>
            </div>
          )}
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
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(effectiveTotalAmount, invoice.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ المدفوع</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.amountPaid, invoice.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ المتبقي</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(remainingAmount, invoice.currency)}</p>
                </div>
                {taxAmount > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">الضريبة</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(taxAmount, invoice.currency)}</p>
                  </div>
                )}
                {(discountPercent > 0 || discountAmount > 0) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">الخصم {discountPercent > 0 ? `(${discountPercent}%)` : ''}</label>
                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(discountAmount, invoice.currency)}</p>
                  </div>
                )}
                {shippingAmount > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">الشحن</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(shippingAmount, invoice.currency)}</p>
                  </div>
                )}
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
                          <h4 className="font-medium text-gray-900">
                            {item.itemType === 'part' && item.partName ? item.partName : (item.itemType === 'service' && item.serviceName ? item.serviceName : item.description)}
                          </h4>
                          
                          {/* Part Details */}
                          {item.itemType === 'part' && item.partName && (
                            <div className="mt-2 space-y-1">
                              {item.partSku && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">رمز الصنف:</span> {item.partSku}
                                </p>
                              )}
                              {item.partSerialNumber && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">رقم السيريال:</span> {item.partSerialNumber}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Service Details */}
                          {item.itemType === 'service' && item.serviceName && item.serviceDescription && (
                            <p className="text-sm text-gray-600 mt-2">{item.serviceDescription}</p>
                          )}
                          
                          {/* Service Additional Notes */}
                          {item.itemType === 'service' && item.serviceNotes && (() => {
                            // تنظيف serviceNotes من رابط invoiceItemId
                            let cleanNotes = item.serviceNotes;
                            if (cleanNotes && cleanNotes.includes('[invoiceItemId:')) {
                              cleanNotes = cleanNotes.replace(/\s*\[invoiceItemId:\d+\]\s*/g, '').trim();
                            }
                            return cleanNotes ? (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">ملاحظات:</span> {cleanNotes}
                              </p>
                            ) : null;
                          })()}
                          
                          {/* Common Details */}
                          <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            الكمية: {item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}
                          </p>
                          <p className="text-sm text-gray-500">
                            النوع: {item.itemType === 'service' ? 'خدمة' : 'قطعة'}
                          </p>
                            {item.description && (!item.partName && !item.serviceName) && (
                              <p className="text-sm text-gray-500 italic">{item.description}</p>
                            )}
                          </div>
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
              
              {/* Invoice Summary - Discount, Tax, Shipping */}
              {(discountPercent > 0 || discountAmount > 0 || taxAmount > 0 || shippingAmount > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المجموع الفرعي:</span>
                      <span className="font-medium">{formatCurrency(subtotal, invoice.currency)}</span>
                    </div>
                    
                    {(discountPercent > 0 || discountAmount > 0) && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>الخصم {discountPercent > 0 ? `(${discountPercent}%)` : ''}:</span>
                        <span className="font-medium">-{formatCurrency(discountAmount, invoice.currency)}</span>
                      </div>
                    )}
                    
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>الضريبة:</span>
                        <span className="font-medium">+{formatCurrency(taxAmount, invoice.currency)}</span>
                      </div>
                    )}
                    
                    {shippingAmount > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>الشحن:</span>
                        <span className="font-medium">+{formatCurrency(shippingAmount, invoice.currency)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-semibold pt-3 border-t border-gray-300">
                      <span>الإجمالي النهائي:</span>
                      <span>{formatCurrency(effectiveTotalAmount, invoice.currency)}</span>
                    </div>
                  </div>
                </div>
              )}
              </SimpleCardContent>
            </SimpleCard>

          {/* Related Repair Request */}
          {invoice.repairRequestId && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 ml-2" />
                  طلب الإصلاح المرتبط
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-4">
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

                  {/* تاريخ الاستلام */}
                  {invoice.repair?.createdAt && (
                    <div className="border-t pt-3">
                      <label className="text-sm font-medium text-gray-500">تاريخ الاستلام:</label>
                      <p className="text-sm text-gray-900 mt-1">{formatDate(invoice.repair.createdAt)}</p>
                    </div>
                  )}

                  {/* مواصفات الجهاز */}
                  {invoice.repair?.deviceSpecs && (invoice.repair.deviceSpecs.cpu || invoice.repair.deviceSpecs.gpu || invoice.repair.deviceSpecs.ram || invoice.repair.deviceSpecs.storage) && (
                    <div className="border-t pt-3">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">مواصفات الجهاز:</label>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {invoice.repair.deviceSpecs.cpu && (
                          <div>
                            <span className="text-gray-600">المعالج:</span>
                            <p className="text-gray-900 font-medium">{invoice.repair.deviceSpecs.cpu}</p>
                          </div>
                        )}
                        {invoice.repair.deviceSpecs.gpu && (
                          <div>
                            <span className="text-gray-600">كارت الشاشة:</span>
                            <p className="text-gray-900 font-medium">{invoice.repair.deviceSpecs.gpu}</p>
                          </div>
                        )}
                        {invoice.repair.deviceSpecs.ram && (
                          <div>
                            <span className="text-gray-600">الذاكرة:</span>
                            <p className="text-gray-900 font-medium">{invoice.repair.deviceSpecs.ram}</p>
                          </div>
                        )}
                        {invoice.repair.deviceSpecs.storage && (
                          <div>
                            <span className="text-gray-600">التخزين:</span>
                            <p className="text-gray-900 font-medium">{invoice.repair.deviceSpecs.storage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* المتعلقات المستلمة */}
                  {invoice.repair?.accessories && Array.isArray(invoice.repair.accessories) && invoice.repair.accessories.length > 0 && (
                    <div className="border-t pt-3">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">المتعلقات المستلمة:</label>
                      <div className="flex flex-wrap gap-2">
                        {invoice.repair.accessories.filter(a => a != null).map((a, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {typeof a === 'string' ? a : (a?.label || a?.name || a?.value || 'Unknown')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* رابط التتبع */}
                  {invoice.repair?.trackingToken && (
                    <div className="border-t pt-3">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">رابط التتبع:</label>
                      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 max-w-md">
                        <span className="text-sm text-blue-600 font-mono truncate flex-1">
                          {getFrontendBaseUrl()}/track?trackingToken={invoice.repair.trackingToken}
                        </span>
                        <SimpleButton
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const trackingUrl = `${getFrontendBaseUrl()}/track?trackingToken=${invoice.repair.trackingToken}`;
                            try {
                              await navigator.clipboard.writeText(trackingUrl);
                              setTrackingLinkCopied(true);
                              setTimeout(() => setTrackingLinkCopied(false), 2000);
                            } catch (err) {
                              // Fallback for older browsers
                              const textArea = document.createElement('textarea');
                              textArea.value = trackingUrl;
                              textArea.style.position = 'fixed';
                              textArea.style.opacity = '0';
                              document.body.appendChild(textArea);
                              textArea.select();
                              try {
                                document.execCommand('copy');
                                setTrackingLinkCopied(true);
                                setTimeout(() => setTrackingLinkCopied(false), 2000);
                              } catch (fallbackErr) {
                                console.error('Failed to copy tracking link');
                              }
                              document.body.removeChild(textArea);
                            }
                          }}
                          className="p-1 h-auto"
                          title="نسخ رابط التتبع"
                        >
                          {trackingLinkCopied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                          )}
                        </SimpleButton>
                      </div>
                    </div>
                  )}
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
                  <span className="font-semibold">{formatCurrency(effectiveTotalAmount, invoice.currency)}</span>
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
                      {effectiveTotalAmount > 0 ? 
                        Math.round((invoice.amountPaid / effectiveTotalAmount) * 100) : 0}%
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
                {invoice.customerPhone && (
                  <div className="w-full space-y-2">
                    <SendButton
                      entityType="invoice"
                      entityId={invoice.id}
                      customerId={invoice.customerId}
                      recipient={invoice.customerPhone}
                      template="defaultMessage"
                      onSuccess={handleSendSuccess}
                      onError={handleSendError}
                      showChannelSelector={true}
                      defaultChannels={['whatsapp']}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      اختر القناة: واتساب أو بريد إلكتروني
                    </p>
                  </div>
                )}
          </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Message Log */}
          {id && id !== 'new' && invoice && (
            <MessageLogViewer
              entityType="invoice"
              entityId={parseInt(id)}
              customerId={invoice.customerId}
              limit={5}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;