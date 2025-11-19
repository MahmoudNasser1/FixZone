import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { 
  Save, 
  X, 
  DollarSign, 
  Calendar, 
  FileText,
  Wrench,
  Tag
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const QuotationForm = ({ quotation, onSave, onCancel, onSuccess }) => {
  const notifications = useNotifications();
  const notify = (type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    } else if (notifications?.[type]) {
      notifications[type](message);
    }
  };

  const [formData, setFormData] = useState({
    repairRequestId: '',
    totalAmount: '',
    taxAmount: '0',
    status: 'PENDING',
    currency: 'EGP',
    notes: '',
    sentAt: '',
    responseAt: ''
  });

  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load quotation data if editing
  useEffect(() => {
    if (quotation) {
      const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        repairRequestId: quotation.repairRequestId || '',
        totalAmount: quotation.totalAmount || '',
        taxAmount: quotation.taxAmount || '0',
        status: quotation.status || 'PENDING',
        currency: quotation.currency || 'EGP',
        notes: quotation.notes || '',
        sentAt: formatDateTimeLocal(quotation.sentAt),
        responseAt: formatDateTimeLocal(quotation.responseAt)
      });
    }
  }, [quotation]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      await loadRepairs();
    } catch (error) {
      console.error('Error loading initial data:', error);
      notify('error', 'خطأ في تحميل البيانات');
    } finally {
      setLoadingData(false);
    }
  };

  const loadRepairs = async () => {
    try {
      const response = await apiService.request('/repairs?limit=100');
      if (Array.isArray(response)) {
        setRepairs(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setRepairs(response.data);
      }
    } catch (error) {
      console.error('Error loading repairs:', error);
      setRepairs([]);
    }
  };

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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.repairRequestId) {
      newErrors.repairRequestId = 'طلب الإصلاح مطلوب';
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'المبلغ الإجمالي مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (formData.taxAmount && parseFloat(formData.taxAmount) < 0) {
      newErrors.taxAmount = 'مبلغ الضريبة يجب أن يكون أكبر من أو يساوي صفر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      notify('error', 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      setLoading(true);

      const quotationData = {
        repairRequestId: parseInt(formData.repairRequestId),
        totalAmount: parseFloat(formData.totalAmount),
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : 0,
        status: formData.status,
        currency: formData.currency || 'EGP',
        notes: formData.notes.trim() || null,
        sentAt: formData.sentAt ? new Date(formData.sentAt).toISOString() : null,
        responseAt: formData.responseAt ? new Date(formData.responseAt).toISOString() : null
      };

      let response;
      if (quotation) {
        response = await apiService.updateQuotation(quotation.id, quotationData);
      } else {
        response = await apiService.createQuotation(quotationData);
      }

      if (response?.success !== false) {
        notify('success', quotation ? 'تم تحديث العرض السعري بنجاح' : 'تم إنشاء العرض السعري بنجاح');
        if (onSuccess) {
          onSuccess();
        }
        if (onSave) {
          onSave(response?.data || response);
        }
      } else {
        throw new Error(response?.error || 'فشل حفظ العرض السعري');
      }
    } catch (error) {
      console.error('Error saving quotation:', error);
      const errorMessage = error?.message || error?.error || (quotation ? 'خطأ في تحديث العرض السعري' : 'خطأ في إنشاء العرض السعري');
      if (errorMessage.includes('already exists')) {
        notify('error', 'يوجد بالفعل عرض سعري لهذا طلب الإصلاح');
      } else {
        notify('error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" text="جاري تحميل البيانات..." />
      </div>
    );
  }

  const statusOptions = [
    { value: 'PENDING', label: 'قيد الانتظار' },
    { value: 'SENT', label: 'تم الإرسال' },
    { value: 'APPROVED', label: 'موافق عليه' },
    { value: 'REJECTED', label: 'مرفوض' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repair Request */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Wrench className="inline w-4 h-4 ml-1" />
            طلب الإصلاح <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.repairRequestId?.toString()}
            onValueChange={(value) => handleInputChange('repairRequestId', value)}
            disabled={!!quotation} // Cannot change repair request when editing
          >
            <SelectTrigger className={errors.repairRequestId ? 'border-red-500' : ''}>
              <SelectValue placeholder="اختر طلب الإصلاح" />
            </SelectTrigger>
            <SelectContent>
              {repairs.map(repair => (
                <SelectItem key={repair.id} value={repair.id.toString()}>
                  {repair.trackingToken || `طلب #${repair.id}`} - {repair.customerName || 'عميل'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.repairRequestId && (
            <p className="text-red-500 text-sm mt-1">{errors.repairRequestId}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="inline w-4 h-4 ml-1" />
            الحالة
          </label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Total Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 ml-1" />
            المبلغ الإجمالي (ج.م) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.totalAmount}
            onChange={(e) => handleInputChange('totalAmount', e.target.value)}
            placeholder="0.00"
            className={errors.totalAmount ? 'border-red-500' : ''}
            required
          />
          {errors.totalAmount && (
            <p className="text-red-500 text-sm mt-1">{errors.totalAmount}</p>
          )}
        </div>

        {/* Tax Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 ml-1" />
            مبلغ الضريبة (ج.م)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.taxAmount}
            onChange={(e) => handleInputChange('taxAmount', e.target.value)}
            placeholder="0.00"
            className={errors.taxAmount ? 'border-red-500' : ''}
          />
          {errors.taxAmount && (
            <p className="text-red-500 text-sm mt-1">{errors.taxAmount}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            العملة
          </label>
          <Input
            type="text"
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            placeholder="EGP"
            maxLength={10}
          />
        </div>

        {/* Sent At */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 ml-1" />
            تاريخ الإرسال
          </label>
          <Input
            type="datetime-local"
            value={formData.sentAt}
            onChange={(e) => handleInputChange('sentAt', e.target.value)}
          />
        </div>

        {/* Response At */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 ml-1" />
            تاريخ الرد
          </label>
          <Input
            type="datetime-local"
            value={formData.responseAt}
            onChange={(e) => handleInputChange('responseAt', e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 ml-1" />
          الملاحظات
        </label>
        <Textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="ملاحظات إضافية..."
          rows={4}
          maxLength={2000}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <SimpleButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 ml-2" />
          إلغاء
        </SimpleButton>
        <SimpleButton
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="ml-2" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              {quotation ? 'تحديث' : 'حفظ'}
            </>
          )}
        </SimpleButton>
      </div>
    </form>
  );
};

export default QuotationForm;

