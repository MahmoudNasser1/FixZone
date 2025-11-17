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
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
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

  useEffect(() => {
    if (payment) {
      setFormData({
        purchaseOrderId: payment.purchaseOrderId || '',
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
      // جلب طلبات الشراء المتاحة فقط عند الحاجة
      loadAvailablePurchaseOrders();
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

