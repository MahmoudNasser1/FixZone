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
  Tag, 
  FileText,
  Building2,
  Receipt
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ExpenseForm = ({ expense, onSave, onCancel, onSuccess }) => {
  const notifications = useNotifications();
  const notify = (type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    } else if (notifications?.[type]) {
      notifications[type](message);
    }
  };

  const [formData, setFormData] = useState({
    categoryId: '',
    vendorId: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    invoiceId: '',
    receiptUrl: '',
    notes: ''
  });

  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load expense data if editing
  useEffect(() => {
    if (expense) {
      setFormData({
        categoryId: expense.categoryId || '',
        vendorId: expense.vendorId || '',
        amount: expense.amount || '',
        description: expense.description || '',
        expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
        invoiceId: expense.invoiceId || '',
        receiptUrl: expense.receiptUrl || '',
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([
        loadCategories(),
        loadVendors(),
        loadInvoices()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      notify('error', 'خطأ في تحميل البيانات');
    } finally {
      setLoadingData(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiService.getExpenseCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadVendors = async () => {
    try {
      // Try multiple API methods
      let response;
      try {
        response = await apiService.request('/vendors?status=active&limit=100');
      } catch (e) {
        // Fallback: try vendorService if available
        try {
          const vendorService = await import('../../services/vendorService');
          const result = await vendorService.default.getAllVendors({ status: 'active', limit: 100 });
          response = result?.data || result;
        } catch (e2) {
          response = null;
        }
      }
      
      if (Array.isArray(response)) {
        setVendors(response);
      } else if (response?.vendors) {
        setVendors(response.vendors);
      } else if (response?.data?.vendors) {
        setVendors(response.data.vendors);
      } else if (response?.data && Array.isArray(response.data)) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await apiService.getInvoices({ invoiceType: 'purchase', limit: 100 });
      if (Array.isArray(response)) {
        setInvoices(response);
      } else if (response?.invoices) {
        setInvoices(response.invoices);
      } else if (response?.data?.invoices) {
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
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

    if (!formData.categoryId) {
      newErrors.categoryId = 'فئة المصروف مطلوبة';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'تاريخ المصروف مطلوب';
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

      const expenseData = {
        categoryId: parseInt(formData.categoryId),
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || null,
        expenseDate: formData.expenseDate,
        invoiceId: formData.invoiceId ? parseInt(formData.invoiceId) : null,
        receiptUrl: formData.receiptUrl.trim() || null,
        notes: formData.notes.trim() || null
      };

      let response;
      if (expense) {
        response = await apiService.updateExpense(expense.id, expenseData);
      } else {
        response = await apiService.createExpense(expenseData);
      }

      if (response?.success !== false) {
        notify('success', expense ? 'تم تحديث المصروف بنجاح' : 'تم إنشاء المصروف بنجاح');
        if (onSuccess) {
          onSuccess();
        }
        if (onSave) {
          onSave(response?.data || response);
        }
      } else {
        throw new Error(response?.error || 'فشل حفظ المصروف');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      const errorMessage = error?.message || error?.error || (expense ? 'خطأ في تحديث المصروف' : 'خطأ في إنشاء المصروف');
      notify('error', errorMessage);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="inline w-4 h-4 ml-1" />
            فئة المصروف <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.categoryId?.toString()}
            onValueChange={(value) => handleInputChange('categoryId', value)}
          >
            <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 ml-1" />
            المبلغ (ج.م) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.00"
            className={errors.amount ? 'border-red-500' : ''}
            required
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Expense Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 ml-1" />
            تاريخ المصروف <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.expenseDate}
            onChange={(e) => handleInputChange('expenseDate', e.target.value)}
            className={errors.expenseDate ? 'border-red-500' : ''}
            required
          />
          {errors.expenseDate && (
            <p className="text-red-500 text-sm mt-1">{errors.expenseDate}</p>
          )}
        </div>

        {/* Vendor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="inline w-4 h-4 ml-1" />
            المورد (اختياري)
          </label>
          <Select
            value={formData.vendorId?.toString() || ''}
            onValueChange={(value) => handleInputChange('vendorId', value || '')}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المورد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">لا يوجد</SelectItem>
              {vendors.map(vendor => (
                <SelectItem key={vendor.id} value={vendor.id.toString()}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Receipt className="inline w-4 h-4 ml-1" />
            فاتورة الشراء (اختياري)
          </label>
          <Select
            value={formData.invoiceId?.toString() || ''}
            onValueChange={(value) => handleInputChange('invoiceId', value || '')}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الفاتورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">لا يوجد</SelectItem>
              {invoices.map(invoice => (
                <SelectItem key={invoice.id} value={invoice.id.toString()}>
                  {invoice.id} - {invoice.totalAmount ? `${invoice.totalAmount} ج.م` : 'فاتورة شراء'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Receipt URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Receipt className="inline w-4 h-4 ml-1" />
            رابط الإيصال (اختياري)
          </label>
          <Input
            type="url"
            value={formData.receiptUrl}
            onChange={(e) => handleInputChange('receiptUrl', e.target.value)}
            placeholder="https://example.com/receipt.jpg"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 ml-1" />
          الوصف (اختياري)
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="وصف المصروف..."
          rows={3}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 ml-1" />
          ملاحظات (اختياري)
        </label>
        <Textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="ملاحظات إضافية..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
          <Save className="w-4 h-4 ml-2" />
          {loading ? 'جاري الحفظ...' : (expense ? 'حفظ التعديلات' : 'حفظ المصروف')}
        </SimpleButton>
      </div>
    </form>
  );
};

export default ExpenseForm;

