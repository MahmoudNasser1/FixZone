import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Save, X } from 'lucide-react';

export default function EditInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  // Form state
  const [form, setForm] = useState({
    totalAmount: 0,
    amountPaid: 0,
    status: 'draft',
    currency: 'EGP',
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
    dueDate: ''
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);

  // Load invoice data
  useEffect(() => {
    async function loadInvoiceData() {
      if (!id) {
        console.error('No invoice ID provided');
        notifications.error('لم يتم توفير معرف الفاتورة');
        navigate('/invoices');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Loading invoice with ID:', id);
        const responseData = await apiService.getInvoiceById(id);
        console.log('API Response:', responseData);
        const invoiceData = responseData.data || responseData;
        setInvoice(invoiceData);
        
        // Ensure all numeric values are properly converted
        const totalAmount = Number(invoiceData.totalAmount) || 0;
        const amountPaid = Number(invoiceData.amountPaid) || 0;
        const taxAmount = Number(invoiceData.taxAmount) || 0;
        const discountAmount = Number(invoiceData.discountAmount) || 0;
        
        setForm({
          totalAmount,
          amountPaid,
          status: invoiceData.status || 'draft',
          currency: invoiceData.currency || 'EGP',
          taxAmount,
          discountAmount,
          notes: invoiceData.notes || '',
          dueDate: invoiceData.dueDate ? invoiceData.dueDate.split('T')[0] : ''
        });
      } catch (error) {
        console.error('Error loading invoice:', error);
        notifications.error('فشل في تحميل بيانات الفاتورة: ' + error.message);
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    }
    loadInvoiceData();
  }, [id, notifications, navigate]);



  // Save changes
  async function saveChanges() {
    try {
      setSaving(true);
      
      const updateData = {
        totalAmount: form.totalAmount,
        amountPaid: form.amountPaid,
        status: form.status,
        currency: form.currency,
        taxAmount: form.taxAmount,
        discountAmount: form.discountAmount,
        notes: form.notes,
        dueDate: form.dueDate || null
      };

      await apiService.updateInvoice(id, updateData);
      notifications.success('تم حفظ التغييرات بنجاح');
      navigate(`/invoices/${id}`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      notifications.error('فشل في حفظ التغييرات: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-center py-8">
            <div className="text-gray-500">جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'الفواتير', href: '/invoices' },
              { label: `فاتورة #${id}`, href: `/invoices/${id}` },
              { label: 'تعديل', href: `/invoices/${id}/edit` },
            ]} />
            <h1 className="text-2xl font-bold text-gray-900">تعديل فاتورة #{id}</h1>
            <p className="text-sm text-gray-500">تعديل بيانات الفاتورة والإعدادات المالية</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>تفاصيل الفاتورة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                {/* Customer and Repair Info (Read-only) */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">معلومات الفاتورة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">العميل: </span>
                      <span className="font-medium">{invoice?.customerName || 'غير محدد'}</span>
                    </div>
                    {invoice?.deviceModel && (
                      <div>
                        <span className="text-gray-600">الجهاز: </span>
                        <span className="font-medium">{invoice.deviceModel} {invoice.deviceBrand}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">تاريخ الإنشاء: </span>
                      <span className="font-medium">
                        {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">آخر تحديث: </span>
                      <span className="font-medium">
                        {invoice?.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة الفاتورة</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">مسودة</option>
                      <option value="sent">مرسلة</option>
                      <option value="paid">مدفوعة</option>
                      <option value="overdue">متأخرة</option>
                      <option value="cancelled">ملغية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الإجمالي</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.totalAmount}
                      onChange={(e) => setForm(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={form.totalAmount}
                      value={form.amountPaid}
                      onChange={(e) => setForm(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الضريبة</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.taxAmount}
                      onChange={(e) => setForm(prev => ({ ...prev, taxAmount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.discountAmount}
                      onChange={(e) => setForm(prev => ({ ...prev, discountAmount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>ملخص مالي</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">المبلغ الأساسي:</span>
                  <span className="font-medium">{form.totalAmount.toFixed(2)} {form.currency}</span>
                </div>
                
                {form.taxAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>+ الضريبة:</span>
                    <span>{form.taxAmount.toFixed(2)} {form.currency}</span>
                  </div>
                )}
                
                {form.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>- الخصم:</span>
                    <span>{form.discountAmount.toFixed(2)} {form.currency}</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>الإجمالي النهائي:</span>
                    <span>{(form.totalAmount + form.taxAmount - form.discountAmount).toFixed(2)} {form.currency}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">المدفوع:</span>
                  <span className="font-medium text-green-600">{form.amountPaid.toFixed(2)} {form.currency}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">المتبقي:</span>
                  <span className={`font-medium ${
                    (form.totalAmount + form.taxAmount - form.discountAmount - form.amountPaid) > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {(form.totalAmount + form.taxAmount - form.discountAmount - form.amountPaid).toFixed(2)} {form.currency}
                  </span>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Status Info */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>معلومات الحالة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">الحالة الحالية:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    form.status === 'paid' ? 'bg-green-100 text-green-700' :
                    form.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    form.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {form.status === 'draft' ? 'مسودة' :
                     form.status === 'sent' ? 'مرسلة' :
                     form.status === 'paid' ? 'مدفوعة' :
                     form.status === 'overdue' ? 'متأخرة' :
                     form.status === 'cancelled' ? 'ملغية' : form.status}
                  </span>
                </div>
                
                {form.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">تاريخ الاستحقاق:</span>
                    <span className="font-medium">
                      {new Date(form.dueDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Actions */}
          <SimpleCard>
            <SimpleCardContent>
              <div className="space-y-3">
                <SimpleButton
                  onClick={saveChanges}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 ml-2" />
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </SimpleButton>
                
                <SimpleButton
                  variant="outline"
                  onClick={() => navigate(`/invoices/${id}`)}
                  className="w-full"
                >
                  <X className="w-4 h-4 ml-2" />
                  إلغاء
                </SimpleButton>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>
    </div>
  );
}
