import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import invoicesService from '../../services/invoicesService';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const invoiceId = id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [savingTotal, setSavingTotal] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await invoicesService.getInvoice(invoiceId);
        if (!mounted) return;
        // res expected: { success, data: { ...invoice, items: [] } }
        if (res?.success) {
          setInvoice(res.data || null);
          setItems(Array.isArray(res.data?.items) ? res.data.items : []);
        } else {
          // fallback to legacy
          const legacyItems = Array.isArray(res?.items) ? res.items : [];
          setInvoice(res?.data || null);
          setItems(legacyItems);
        }
      } catch (e) {
        console.error(e);
        setError(e?.message || 'تعذر تحميل عناصر الفاتورة');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (invoiceId) load();
    return () => { mounted = false; };
  }, [invoiceId]);

  // Auto-sync stored totalAmount with calculated subtotal on first load if they differ
  useEffect(() => {
    if (loading) return;
    if (autoSynced) return;
    if (!invoice) return;
    // Only auto-sync when there are items to base calculation on
    const subtotal = (items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
    if (items.length === 0) return;
    const stored = Number(invoice.totalAmount || 0);
    // Avoid tiny float diffs
    const diff = Math.abs(stored - subtotal);
    if (diff > 0.005) {
      (async () => {
        try {
          setSavingTotal(true);
          const res = await invoicesService.updateInvoice(invoiceId, { totalAmount: Number(subtotal.toFixed(2)) });
          if (res?.success && res?.data) {
            setInvoice(res.data);
          } else {
            setInvoice((prev) => ({ ...(prev || {}), totalAmount: Number(subtotal.toFixed(2)) }));
          }
        } catch (e) {
          console.error(e);
          // لا نعرض خطأ للمستخدم كي لا نزعجه على التحميل الأول
        } finally {
          setSavingTotal(false);
          setAutoSynced(true);
        }
      })();
    } else {
      setAutoSynced(true);
    }
  }, [loading, items, invoice, invoiceId, autoSynced]);

  const totals = useMemo(() => {
    const subtotal = (items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
    // Prefer stored totalAmount if present; otherwise use calculated subtotal
    const storedTotal = Number(invoice?.totalAmount ?? NaN);
    const finalTotal = Number.isFinite(storedTotal) && storedTotal > 0 ? storedTotal : subtotal;
    return { subtotal, total: finalTotal };
  }, [items, invoice]);

  async function handleRecalculateTotal() {
    try {
      setSavingTotal(true);
      const newTotal = Number(totals.subtotal || 0);
      const res = await invoicesService.updateInvoice(invoiceId, { totalAmount: newTotal });
      if (res?.success && res?.data) {
        setInvoice(res.data);
      } else {
        // fallback: update locally if API returns legacy shape
        setInvoice((prev) => ({ ...(prev || {}), totalAmount: newTotal }));
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || 'تعذر تحديث إجمالي الفاتورة');
    } finally {
      setSavingTotal(false);
    }
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
              { label: `فاتورة #${invoiceId}`, href: `/invoices/${invoiceId}` },
            ]} />
            <h1 className="text-2xl font-bold text-gray-900">فاتورة #{invoiceId}</h1>
            <p className="text-sm text-gray-500">عرض عناصر الفاتورة وإجمالي المبلغ</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/invoices">
              <SimpleButton variant="outline">رجوع إلى الفواتير</SimpleButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
          </SimpleCardContent>
        </SimpleCard>
      ) : error ? (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>عناصر الفاتورة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="overflow-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-right text-gray-600">
                        <th className="px-3 py-2">العنصر</th>
                        <th className="px-3 py-2">الوصف</th>
                        <th className="px-3 py-2">الكمية</th>
                        <th className="px-3 py-2">سعر الوحدة</th>
                        <th className="px-3 py-2">الإجمالي</th>
                        <th className="px-3 py-2">المصدر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">{it.itemName || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{it.itemDescription || '—'}</td>
                          <td className="px-3 py-2 text-gray-900">{Number(it.quantity ?? 0)}</td>
                          <td className="px-3 py-2 text-gray-900">{Number(it.unitPrice ?? 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-gray-900">{(Number(it.quantity || 0) * Number(it.unitPrice || 0)).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            {it.itemType === 'part' ? (
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">قطعة غيار</span>
                            ) : it.itemType === 'service' ? (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">خدمة صيانة</span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">عنصر آخر</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>لا توجد عناصر في هذه الفاتورة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>

          <div className="lg:col-span-1">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>ملخص الفاتورة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">الإجمالي الفرعي</span>
                    <span className="font-semibold text-gray-900">{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {Number(invoice?.discountAmount || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">الخصم</span>
                      <span className="text-gray-900">-{Number(invoice?.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(invoice?.taxAmount || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">الضريبة</span>
                      <span className="text-gray-900">{Number(invoice?.taxAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 my-2" />
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-gray-900 font-bold">الإجمالي</span>
                    <span className="font-bold text-gray-900">{totals.total.toFixed(2)}</span>
                  </div>
                  {Number(invoice?.amountPaid || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">المدفوع</span>
                      <span className="text-gray-900">{Number(invoice?.amountPaid || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3">
                    <SimpleButton onClick={handleRecalculateTotal} disabled={savingTotal}>
                      {savingTotal ? 'جارٍ التحديث...' : 'تحديث الإجمالي من العناصر'}
                    </SimpleButton>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      )}
    </div>
  );
}
