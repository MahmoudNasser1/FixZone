import React, { useState, useEffect, useRef } from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import vendorPaymentService from '../../services/vendorPaymentService';
import apiService from '../../services/api';

const VendorPaymentForm = ({
  vendorId,
  payment = null,
  purchaseOrder = null,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    invoiceId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    bankName: '',
    checkNumber: '',
    notes: '',
    status: 'pending'
  });

  const [errors, setErrors] = useState({});
  const [availablePurchaseOrders, setAvailablePurchaseOrders] = useState([]);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const loadedRef = useRef(false);
  const vendorIdRef = useRef(vendorId);

  // Update vendorIdRef when vendorId changes
  useEffect(() => {
    if (vendorIdRef.current !== vendorId) {
      vendorIdRef.current = vendorId;
      loadedRef.current = false;
    }
  }, [vendorId]);

  const loadAvailablePurchaseOrders = async () => {
    if (!vendorId || loadedRef.current) return;
    
    try {
      setLoadingPurchaseOrders(true);
      loadedRef.current = true;
      const response = await apiService.request(`/purchaseorders?vendorId=${vendorId}&status=approved,received,pending&limit=100`);
      const purchaseOrders = response.data?.purchaseOrders || response.purchaseOrders || response || [];
      setAvailablePurchaseOrders(Array.isArray(purchaseOrders) ? purchaseOrders : []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      loadedRef.current = false;
    } finally {
      setLoadingPurchaseOrders(false);
    }
  };

  const loadAvailableInvoices = async () => {
    if (!vendorId) return;
    
    try {
      setLoadingInvoices(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f156c2bc-9f08-4c5c-8680-c47fa95669dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VendorPaymentForm.js:71',message:'loadAvailableInvoices called',data:{vendorId,invoiceType:'purchase'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      const response = await apiService.getInvoices({ vendorId, invoiceType: 'purchase', limit: 100 });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f156c2bc-9f08-4c5c-8680-c47fa95669dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VendorPaymentForm.js:73',message:'loadAvailableInvoices response received',data:{responseStructure:Object.keys(response),hasData:!!response.data,hasInvoices:!!response.invoices,invoicesCount:Array.isArray(response.data?.invoices||response.invoices||response.data||response)?(response.data?.invoices||response.invoices||response.data||response).length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      const invoices = response.data?.invoices || response.invoices || response.data || response || [];
      const invoicesArray = Array.isArray(invoices) ? invoices : [];
      
      // فلترة الفواتير غير المدفوعة فقط (outstanding balance > 0)
      // والتأكد من أن الفواتير مرتبطة بالمورد المحدد
      const unpaidInvoices = invoicesArray.filter(inv => {
        // التأكد من أن الفاتورة مرتبطة بالمورد المحدد
        const invVendorId = inv.vendorId || inv.vendor?.id;
        if (invVendorId && parseInt(invVendorId) !== parseInt(vendorId)) {
          return false; // تجاهل الفواتير التي لا تنتمي لهذا المورد
        }
        
        const totalAmount = parseFloat(inv.totalAmount || 0);
        const amountPaid = parseFloat(inv.amountPaid || inv.paidAmount || 0);
        const remaining = totalAmount - amountPaid;
        return remaining > 0;
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f156c2bc-9f08-4c5c-8680-c47fa95669dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VendorPaymentForm.js:90',message:'loadAvailableInvoices filtered',data:{totalInvoices:invoicesArray.length,unpaidInvoices:unpaidInvoices.length,vendorIds:invoicesArray.map(inv=>inv.vendorId||inv.vendor?.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      setAvailableInvoices(unpaidInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f156c2bc-9f08-4c5c-8680-c47fa95669dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VendorPaymentForm.js:95',message:'loadAvailableInvoices error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (payment) {
      setFormData({
        purchaseOrderId: payment.purchaseOrderId || '',
        invoiceId: payment.invoiceId || '',
        amount: payment.amount || '',
        paymentMethod: payment.paymentMethod || 'cash',
        paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
        referenceNumber: payment.referenceNumber || '',
        bankName: payment.bankName || '',
        checkNumber: payment.checkNumber || '',
        notes: payment.notes || '',
        status: payment.status || 'pending'
      });
      loadedRef.current = true; // Prevent loading when editing payment
    } else if (purchaseOrder) {
      // إذا كان هناك طلب شراء محدد، املأ المعلومات
      setFormData(prev => ({
        ...prev,
        purchaseOrderId: purchaseOrder.id || '',
        amount: purchaseOrder.totalAmount || ''
      }));
      setSelectedPurchaseOrder(purchaseOrder);
      loadedRef.current = true; // Prevent loading when purchaseOrder is provided
    } else if (vendorId && !payment && !purchaseOrder && !loadedRef.current) {
      // جلب طلبات الشراء والفواتير المتاحة فقط عند الحاجة
      loadAvailablePurchaseOrders();
      loadAvailableInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, purchaseOrder, vendorId]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // إذا تم اختيار طلب شراء، املأ المبلغ تلقائياً
    if (field === 'purchaseOrderId' && value) {
      const po = availablePurchaseOrders.find(p => p.id === parseInt(value));
      if (po && !payment) {
        setFormData(prev => ({
          ...prev,
          amount: po.totalAmount || ''
        }));
        setSelectedPurchaseOrder(po);
      }
    }

    // إذا تم اختيار فاتورة شراء، املأ المبلغ المتبقي تلقائياً
    if (field === 'invoiceId' && value) {
      const inv = availableInvoices.find(i => i.id === parseInt(value));
      if (inv && !payment) {
        const totalAmount = parseFloat(inv.totalAmount || 0);
        const paidAmount = parseFloat(inv.amountPaid || inv.paidAmount || 0);
        const remaining = totalAmount - paidAmount;
        setFormData(prev => ({
          ...prev,
          amount: remaining > 0 ? remaining.toFixed(2) : ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'تاريخ الدفع مطلوب';
    }

    // إذا كانت طريقة الدفع بنكي أو شيك، يفضل إدخال رقم المرجع أو رقم الشيك
    if ((formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'check') && !formData.referenceNumber && !formData.checkNumber) {
      newErrors.referenceNumber = 'يرجى إدخال رقم المرجع أو رقم الشيك';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      purchaseOrderId: formData.purchaseOrderId || null,
      invoiceId: formData.invoiceId || null,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
      referenceNumber: formData.referenceNumber || null,
      bankName: formData.bankName || null,
      checkNumber: formData.checkNumber || null,
      notes: formData.notes || null,
      status: formData.status
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SimpleCardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purchase Order */}
          <div className="md:col-span-2">
            <Label htmlFor="purchaseOrderId">طلب الشراء (اختياري)</Label>
            <Select
              value={formData.purchaseOrderId}
              onValueChange={(value) => handleInputChange('purchaseOrderId', value)}
              disabled={!!payment || loadingPurchaseOrders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingPurchaseOrders ? "جاري التحميل..." : "اختر طلب شراء"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون طلب شراء</SelectItem>
                {availablePurchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id.toString()}>
                    {po.orderNumber} - {po.totalAmount ? `${parseFloat(po.totalAmount).toFixed(2)} ج.م` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purchaseOrderId && (
              <p className="text-red-500 text-sm mt-1">{errors.purchaseOrderId}</p>
            )}
          </div>

          {/* Invoice */}
          <div className="md:col-span-2">
            <Label htmlFor="invoiceId">فاتورة الشراء (اختياري)</Label>
            <Select
              value={formData.invoiceId}
              onValueChange={(value) => handleInputChange('invoiceId', value)}
              disabled={!!payment || loadingInvoices}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingInvoices ? "جاري التحميل..." : "اختر فاتورة شراء"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون فاتورة</SelectItem>
                {availableInvoices.map((inv) => {
                  const totalAmount = parseFloat(inv.totalAmount || 0);
                  const paidAmount = parseFloat(inv.amountPaid || 0);
                  const remaining = totalAmount - paidAmount;
                  return (
                    <SelectItem key={inv.id} value={inv.id.toString()}>
                      فاتورة #{inv.id} - {totalAmount.toFixed(2)} ج.م (متبقي: {remaining.toFixed(2)} ج.م)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.invoiceId && (
              <p className="text-red-500 text-sm mt-1">{errors.invoiceId}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">المبلغ *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                <SelectItem value="check">شيك</SelectItem>
                <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date */}
          <div>
            <Label htmlFor="paymentDate">تاريخ الدفع *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => handleInputChange('paymentDate', e.target.value)}
              disabled={loading}
            />
            {errors.paymentDate && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">الحالة *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number (for bank transfer) */}
          {(formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'check') && (
            <>
              <div>
                <Label htmlFor="referenceNumber">رقم المرجع / رقم الحوالة</Label>
                <Input
                  id="referenceNumber"
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                  placeholder="رقم المرجع"
                  disabled={loading}
                />
                {errors.referenceNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.referenceNumber}</p>
                )}
              </div>

              {/* Bank Name (for bank transfer) */}
              {formData.paymentMethod === 'bank_transfer' && (
                <div>
                  <Label htmlFor="bankName">اسم البنك</Label>
                  <Input
                    id="bankName"
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="اسم البنك"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Check Number (for check) */}
              {formData.paymentMethod === 'check' && (
                <div>
                  <Label htmlFor="checkNumber">رقم الشيك</Label>
                  <Input
                    id="checkNumber"
                    type="text"
                    value={formData.checkNumber}
                    onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                    placeholder="رقم الشيك"
                    disabled={loading}
                  />
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div className="md:col-span-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <SimpleButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            إلغاء
          </SimpleButton>
          <SimpleButton
            type="submit"
            variant="default"
            disabled={loading}
            loading={loading}
          >
            {payment ? 'تحديث' : 'حفظ'}
          </SimpleButton>
        </div>
      </SimpleCardContent>
    </form>
  );
};

export default VendorPaymentForm;

