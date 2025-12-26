import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Save, X } from 'lucide-react';
import { formatCurrency } from '../../utils/numberFormat';

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
    discountPercent: 0,
    discountAmount: 0,
    discountType: 'fixed', // 'fixed' or 'percent'
    shippingAmount: 0,
    notes: '',
    dueDate: ''
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);

  // Load print settings
  useEffect(() => {
    async function loadPrintSettings() {
      try {
        const settings = await apiService.getPrintSettings();
        if (settings && settings.invoice) {
          setPrintSettings(settings.invoice);
        }
      } catch (error) {
        console.error('Error loading print settings:', error);
        // Use defaults if loading fails
        setPrintSettings({
          financial: {
            showTax: true,
            showShipping: true,
            defaultTaxPercent: 0,
            defaultShippingAmount: 0
          }
        });
      }
    }
    loadPrintSettings();
  }, []);

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
        const discountPercent = Number(invoiceData.discountPercent) || 0;
        const shippingAmount = Number(invoiceData.shippingAmount) || 0;

        // Determine discount type and values based on loaded data
        let initialDiscountType = 'fixed';
        if (discountPercent > 0) {
          initialDiscountType = 'percent';
        } else if (discountAmount > 0) {
          initialDiscountType = 'fixed';
        }

        setForm({
          totalAmount,
          amountPaid,
          status: invoiceData.status || 'draft',
          currency: invoiceData.currency || 'EGP',
          taxAmount,
          discountPercent,
          discountAmount,
          discountType: initialDiscountType,
          shippingAmount,
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

      // Calculate discount based on type
      let finalDiscountAmount = 0;
      let finalDiscountPercent = 0;

      if (form.discountType === 'percent') {
        finalDiscountPercent = form.discountPercent;
        finalDiscountAmount = form.totalAmount > 0
          ? (form.totalAmount * form.discountPercent) / 100
          : 0;
      } else {
        finalDiscountAmount = form.discountAmount;
        finalDiscountPercent = form.totalAmount > 0
          ? (finalDiscountAmount / form.totalAmount) * 100
          : 0;
      }

      const updateData = {
        totalAmount: form.totalAmount,
        amountPaid: form.amountPaid,
        status: form.status,
        currency: form.currency,
        taxAmount: form.taxAmount,
        discountPercent: finalDiscountPercent,
        discountAmount: finalDiscountAmount,
        shippingAmount: form.shippingAmount,
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
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-center py-8">
            <div className="text-muted-foreground">جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'الفواتير', href: '/invoices' },
              { label: `فاتورة #${id}`, href: `/invoices/${id}` },
              { label: 'تعديل', href: `/invoices/${id}/edit` },
            ]} />
            <h1 className="text-2xl font-bold text-foreground">تعديل فاتورة #{id}</h1>
            <p className="text-sm text-muted-foreground">تعديل بيانات الفاتورة والإعدادات المالية</p>
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
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">معلومات الفاتورة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">العميل: </span>
                      <span className="font-medium text-foreground">{invoice?.customerName || 'غير محدد'}</span>
                    </div>
                    {invoice?.deviceModel && (
                      <div>
                        <span className="text-muted-foreground">الجهاز: </span>
                        <span className="font-medium text-foreground">{invoice.deviceModel} {invoice.deviceBrand}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">تاريخ الإنشاء: </span>
                      <span className="font-medium text-foreground">
                        {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">آخر تحديث: </span>
                      <span className="font-medium text-foreground">
                        {invoice?.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">حالة الفاتورة</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                      <option value="draft">مسودة</option>
                      <option value="sent">مرسلة</option>
                      <option value="paid">مدفوعة</option>
                      <option value="overdue">متأخرة</option>
                      <option value="cancelled">ملغية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">العملة</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">المبلغ الإجمالي</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.totalAmount}
                      onChange={(e) => setForm(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">المبلغ المدفوع</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={form.totalAmount}
                      value={form.amountPaid}
                      onChange={(e) => setForm(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  {printSettings?.financial?.showTax !== false && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">الضريبة</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.taxAmount}
                        onChange={(e) => setForm(prev => ({ ...prev, taxAmount: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        placeholder="0.00"
                      />
                    </div>
                  )}



                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">الخصم</label>
                    <div className="flex gap-2">
                      <select
                        value={form.discountType}
                        onChange={(e) => setForm(prev => ({ ...prev, discountType: e.target.value }))}
                        className="w-1/3 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background text-foreground"
                      >
                        <option value="fixed">مبلغ ثابت</option>
                        <option value="percent">نسبة مئوية (%)</option>
                      </select>

                      {form.discountType === 'percent' ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={form.discountPercent}
                          onChange={(e) => setForm(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
                          className="w-2/3 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          placeholder="0.00"
                        />
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={form.totalAmount}
                          value={form.discountAmount}
                          onChange={(e) => setForm(prev => ({ ...prev, discountAmount: Number(e.target.value) }))}
                          className="w-2/3 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          placeholder="0.00"
                        />
                      )}
                    </div>

                    {form.discountType === 'percent' && form.discountPercent > 0 && form.totalAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        قيمة الخصم: {formatCurrency((form.totalAmount * form.discountPercent) / 100, form.currency)}
                      </p>
                    )}
                    {form.discountType === 'fixed' && form.discountAmount > 0 && form.totalAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        نسبة الخصم: {((form.discountAmount / form.totalAmount) * 100).toFixed(2)}%
                      </p>
                    )}
                  </div>

                  {printSettings?.financial?.showShipping !== false && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">الشحن</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.shippingAmount}
                        onChange={(e) => setForm(prev => ({ ...prev, shippingAmount: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ملاحظات</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
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
                  <span className="text-muted-foreground">المبلغ الأساسي:</span>
                  <span className="font-medium text-foreground">{formatCurrency(form.totalAmount, form.currency)}</span>
                </div>

                {(form.discountType === 'percent' ? form.discountPercent > 0 : form.discountAmount > 0) && form.totalAmount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>- الخصم ({form.discountType === 'percent' ? `${form.discountPercent}%` : 'مبلغ ثابت'}):</span>
                    <span>-{formatCurrency(
                      form.discountType === 'percent'
                        ? (form.totalAmount * form.discountPercent) / 100
                        : form.discountAmount,
                      form.currency
                    )}</span>
                  </div>
                )}

                {printSettings?.financial?.showTax !== false && form.taxAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>+ الضريبة:</span>
                    <span>+{formatCurrency(form.taxAmount, form.currency)}</span>
                  </div>
                )}

                {printSettings?.financial?.showShipping !== false && form.shippingAmount > 0 && (
                  <div className="flex justify-between text-primary dark:text-primary/80">
                    <span>+ الشحن:</span>
                    <span>+{formatCurrency(form.shippingAmount, form.currency)}</span>
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">الإجمالي النهائي:</span>
                    <span>{formatCurrency((
                      form.totalAmount -
                      (form.discountType === 'percent' ? (form.totalAmount * form.discountPercent / 100) : form.discountAmount) +
                      (printSettings?.financial?.showTax !== false ? form.taxAmount : 0) +
                      (printSettings?.financial?.showShipping !== false ? form.shippingAmount : 0)
                    ), form.currency)}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">المدفوع:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(form.amountPaid, form.currency)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">المتبقي:</span>
                  <span className={`font-medium ${(form.totalAmount - (form.discountType === 'percent' ? (form.totalAmount * form.discountPercent / 100) : form.discountAmount) + (printSettings?.financial?.showTax !== false ? form.taxAmount : 0) + (printSettings?.financial?.showShipping !== false ? form.shippingAmount : 0) - form.amountPaid) > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                    }`}>
                    {formatCurrency((
                      form.totalAmount -
                      (form.discountType === 'percent' ? (form.totalAmount * form.discountPercent / 100) : form.discountAmount) +
                      (printSettings?.financial?.showTax !== false ? form.taxAmount : 0) +
                      (printSettings?.financial?.showShipping !== false ? form.shippingAmount : 0) -
                      form.amountPaid
                    ), form.currency)}
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
                  <span className="text-muted-foreground">الحالة الحالية:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${form.status === 'paid' ? 'bg-green-100 text-green-700' :
                    form.status === 'sent' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      form.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-muted text-muted-foreground'
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
                    <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                    <span className="font-medium text-foreground">
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
    </div >
  );
}
