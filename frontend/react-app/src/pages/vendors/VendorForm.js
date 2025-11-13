import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';

const VendorForm = ({ vendor, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    taxNumber: '',
    paymentTerms: 'net30',
    creditLimit: 0,
    notes: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        contactPerson: vendor.contactPerson || '',
        address: vendor.address || '',
        taxNumber: vendor.taxNumber || '',
        paymentTerms: vendor.paymentTerms || 'net30',
        creditLimit: vendor.creditLimit || 0,
        notes: vendor.notes || '',
        status: vendor.status || 'active'
      });
    }
  }, [vendor]);

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

    if (!formData.name.trim()) {
      newErrors.name = 'اسم المورد مطلوب';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'حد الائتمان يجب أن يكون أكبر من أو يساوي صفر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const paymentTermsOptions = [
    { value: 'net15', label: '15 يوم' },
    { value: 'net30', label: '30 يوم' },
    { value: 'net45', label: '45 يوم' },
    { value: 'net60', label: '60 يوم' },
    { value: 'cod', label: 'الدفع عند التسليم' },
    { value: 'prepaid', label: 'الدفع المسبق' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">المعلومات الأساسية</h3>
          
          <div>
            <Label htmlFor="name">اسم المورد *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="أدخل اسم المورد"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contactPerson">اسم الشخص المسؤول</Label>
            <Input
              id="contactPerson"
              type="text"
              value={formData.contactPerson}
              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              placeholder="أدخل اسم الشخص المسؤول"
            />
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="أدخل رقم الهاتف"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">المعلومات التجارية</h3>
          
          <div>
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="أدخل العنوان"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="taxNumber">الرقم الضريبي</Label>
            <Input
              id="taxNumber"
              type="text"
              value={formData.taxNumber}
              onChange={(e) => handleInputChange('taxNumber', e.target.value)}
              placeholder="أدخل الرقم الضريبي"
            />
          </div>

          <div>
            <Label htmlFor="paymentTerms">شروط الدفع</Label>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => handleInputChange('paymentTerms', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر شروط الدفع" />
              </SelectTrigger>
              <SelectContent>
                {paymentTermsOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="creditLimit">حد الائتمان</Label>
            <Input
              id="creditLimit"
              type="number"
              min="0"
              step="0.01"
              value={formData.creditLimit}
              onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
              placeholder="أدخل حد الائتمان"
              className={errors.creditLimit ? 'border-red-500' : ''}
            />
            {errors.creditLimit && (
              <p className="mt-1 text-sm text-red-600">{errors.creditLimit}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">الحالة</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="أدخل أي ملاحظات إضافية"
          rows={4}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? 'جاري الحفظ...' : (vendor ? 'تحديث' : 'إنشاء')}
        </Button>
      </div>
    </form>
  );
};

export default VendorForm;
