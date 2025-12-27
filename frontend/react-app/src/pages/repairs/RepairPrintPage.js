import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

// صفحة طباعة إيصال/تفاصيل طلب الإصلاح
// - تعرض معلومات الطلب والعميل والجهاز
// - منسقة للطباعة (A4) وتستدعي window.print() تلقائيًا بعد التحميل
export default function RepairPrintPage() {
  const { id } = useParams();
  const [repair, setRepair] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const { settings, formatMoney } = useSettings();
  const copyType = (query.get('copy') || settings.printing?.defaultCopy || 'customer'); // customer | archive
  // Use defaultCopy from settings if available
  const effectiveCopyType = settings.printing?.defaultCopy || copyType;
  const BRAND = useMemo(() => ({
    name: settings.company?.name || 'FixZone',
    subtitle: 'نظام إدارة الإصلاحات',
    logo: settings.company?.logoUrl || '/Fav.png',
    contact: {
      address: settings.company?.address || '',
      phone: settings.company?.phone || '',
      site: settings.company?.website || '',
    },
  }), [settings]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rep = await apiService.getRepairRequest(id);
        setRepair(rep);
        if (rep?.customerId) {
          try {
            const cust = await apiService.getCustomer(rep.customerId);
            setCustomer(cust);
          } catch { }
        }
      } catch (e) {
        setError('تعذر تحميل تفاصيل الطلب للطباعة');
      } finally {
        setLoading(false);
        // منح وقت بسيط للرندر ثم الطباعة
        setTimeout(() => {
          try { window.print(); } catch { }
        }, 300);
      }
    };
    load();
  }, [id]);

  const fmt = (d) => {
    try { return new Date(d).toLocaleString('ar-SA'); } catch { return d || ''; }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'في الانتظار',
      'in-progress': 'قيد الإصلاح',
      'waiting-parts': 'بانتظار قطع غيار',
      'ready-for-pickup': 'جاهز للاستلام',
      'on-hold': 'معلق',
      'completed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status || 'غير محدد';
  };

  if (loading) return <div style={{ padding: 24 }}>جاري التحضير للطباعة...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;

  const paperSize = settings.printing?.paperSize || 'A4';
  const showWatermark = settings.printing?.showWatermark !== false;
  const showSerialBarcode = !!(settings.printing?.showSerialBarcode);
  const defaultCopy = settings.printing?.defaultCopy || 'customer';

  return (
    <div className="print-page" dir="rtl">
      <style>{`
        @media print {
          @page { size: ${paperSize}; margin: 10mm 10mm 12mm 10mm; }
          .no-print { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #eee !important; }
          .cut-line { display:none; }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .label, .sub, .meta, .muted, .sig, .terms, .contact { color: #000 !important; }
          .value, strong { color: #000 !important; font-weight: 800 !important; }
        }
        body { background: #f5f6f8; color: #000; }
        .container { max-width: 900px; margin: 16px auto; padding: 0 12px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #f0f0f0; }
        .brand { display:flex; align-items:center; gap:12px; }
        .brand .name { font-size: 18px; font-weight: 800; }
        .brand .sub { color:#6b7280; font-size: 12px; }
        .brand img { max-height: 36px; display:block; }
        .meta { text-align:left; font-size:12px; color:#374151; }
        .meta .row { margin-bottom: 2px; }
        .title { font-size: 18px; font-weight: 700; }
        .muted { color: #000; font-size: 13px; }
        .content { padding: 16px 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
        .label { font-size: 13px; color: #000; font-weight: 700; margin-bottom: 4px; }
        .value { font-size: 15px; color: #000; font-weight: 800; }
        .section { margin-top: 16px; }
        .section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
        .divider { height: 1px; background:#f0f0f0; margin: 12px 0; }
        .notes { white-space: pre-wrap; background:#fafafa; border:1px solid #eee; border-radius:6px; padding:10px; }
        .footer { display:flex; justify-content: space-between; margin-top:18px; gap:16px; }
        .sig { flex:1; border-top: 1px dashed #000; text-align:center; padding-top:8px; font-size:13px; color:#000; font-weight: 700; }
        .table { width:100%; border-collapse: collapse; }
        .table th, .table td { border:1px solid #e5e7eb; padding:8px 10px; font-size:12px; }
        .table th { background:#f9fafb; text-align:right; }
        .badges { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .badge { display:inline-block; padding:4px 8px; border-radius:6px; font-size:12px; }
        .badge-yellow { background:#fef3c7; color:#92400e; }
        .badge-blue { background:#dbeafe; color:#1e40af; }
        .badge-green { background:#dcfce7; color:#166534; }
        .badge-red { background:#fee2e2; color:#991b1b; }
        .terms { margin-top:12px; font-size:12px; color:#000; line-height:1.6; font-weight: 500; }
        .highlight { background:#fff7ed; border:1px solid #fed7aa; border-radius:6px; padding:8px 10px; font-size:12px; }
        .contact { margin-top:6px; font-size:12px; color:#000; font-weight: 700; }
        .wm { position: fixed; inset: 0; display:flex; justify-content:center; align-items:center; pointer-events:none; }
        .wm span { opacity: 0.07; font-size: 96px; transform: rotate(-25deg); color:#0f172a; font-weight:800; }
        .bar-row { display:flex; align-items:center; gap:12px; margin-top:8px; }
        .barcode { border:1px dashed #e5e7eb; padding:6px 10px; border-radius:6px; background:#fff; }
      `}</style>

      <div className="container">
        <div className="no-print" style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff' }}>طباعة الآن</button>
          <button onClick={() => window.open(`${window.location.pathname}?copy=customer`, '_blank')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: copyType === 'customer' ? '#e0f2fe' : '#fff' }}>نسخة العميل</button>
          <button onClick={() => window.open(`${window.location.pathname}?copy=archive`, '_blank')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: copyType === 'archive' ? '#fee2e2' : '#fff' }}>نسخة الأرشيف</button>
        </div>

        <div className="card">
          <div className="header">
            <div className="brand">
              <img src={BRAND.logo} alt="logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div>
                <div className="name">{BRAND.name}</div>
                <div className="sub">{BRAND.subtitle}</div>
                <div className="contact">{BRAND.contact.address} • {BRAND.contact.phone} • {BRAND.contact.site}</div>
              </div>
            </div>
            <div className="meta">
              <div className="row">رقم الطلب: <strong>{repair?.requestNumber || `#${id}`}</strong></div>
              <div className="row">التاريخ: <strong>{fmt(repair?.createdAt) || fmt(new Date())}</strong></div>
              {repair?.expectedDelivery && (
                <div className="row">التسليم المتوقع: <strong>{fmt(repair.expectedDelivery)}</strong></div>
              )}
              <div className="badges" style={{ marginTop: 6 }}>
                <span className={`badge ${repair?.status === 'completed' ? 'badge-green' :
                  repair?.status === 'ready-for-pickup' ? 'badge-green' :
                    repair?.status === 'waiting-parts' ? 'badge-orange' :
                      repair?.status === 'in-progress' ? 'badge-blue' :
                        repair?.status === 'pending' ? 'badge-yellow' :
                          repair?.status === 'cancelled' ? 'badge-red' : ''
                  }`}>
                  حالة: {getStatusText(repair?.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="content">
            <div className="grid">
              <div>
                <div className="label">اسم العميل</div>
                <div className="value">{customer?.name || repair?.customerName || '-'}</div>
              </div>
              <div>
                <div className="label">هاتف العميل</div>
                <div className="value">{customer?.phone || '-'}</div>
              </div>
              <div>
                <div className="label">نوع الجهاز</div>
                <div className="value">{repair?.deviceType || '-'}</div>
              </div>
              <div>
                <div className="label">الماركة/الموديل</div>
                <div className="value">{[repair?.deviceBrand, repair?.deviceModel].filter(Boolean).join(' ') || '-'}</div>
              </div>
              <div>
                <div className="label">تاريخ الإنشاء</div>
                <div className="value">{fmt(repair?.createdAt)}</div>
              </div>
              <div>
                <div className="label">تاريخ التحديث</div>
                <div className="value">{fmt(repair?.updatedAt)}</div>
              </div>
              <div>
                <div className="label">التكلفة التقديرية</div>
                <div className="value">{repair?.estimatedCost != null ? formatMoney(repair.estimatedCost) : '-'}</div>
              </div>
              <div>
                <div className="label">التكلفة الفعلية</div>
                <div className="value">{repair?.actualCost != null ? formatMoney(repair.actualCost) : '-'}</div>
              </div>
            </div>

            {/* باركود الرقم التسلسلي إن وُجد */}
            {showSerialBarcode && (repair?.deviceSerial || repair?.serialNumber) && (
              <div className="bar-row">
                <div className="label">الرقم التسلسلي (Barcode)</div>
                <div className="barcode">
                  <img
                    alt="barcode"
                    src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(repair?.deviceSerial || repair?.serialNumber)}&scale=2&height=10&includetext`}
                  />
                </div>
              </div>
            )}

            {/* تفاصيل إضافية عملية */}
            <div className="section">
              <div className="section-title">تفاصيل إضافية</div>
              <table className="table">
                <tbody>
                  <tr>
                    <th>ملحقات مستلمة</th>
                    <td>{repair?.receivedAccessories || '—'}</td>
                  </tr>
                  <tr>
                    <th>كلمة مرور/نمط</th>
                    <td>{repair?.devicePassword || '—'}</td>
                  </tr>
                  <tr>
                    <th>سجل الماء/السقوط</th>
                    <td>{repair?.damageHistory || '—'}</td>
                  </tr>
                  <tr>
                    <th>الموافقة على النسخ الاحتياطي</th>
                    <td>{repair?.backupApproved ? 'نعم' : 'غير محدد'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">وصف المشكلة</div>
              <div className="notes">{repair?.problemDescription || '-'}</div>
            </div>

            {repair?.technicianNotes && (
              <div className="section">
                <div className="section-title">ملاحظات الفني</div>
                <div className="notes">{repair.technicianNotes}</div>
              </div>
            )}

            {repair?.customerNotes && (
              <div className="section">
                <div className="section-title">تعليقات العميل</div>
                <div className="notes">{repair.customerNotes}</div>
              </div>
            )}

            <div className="section highlight">
              برجاء الاحتفاظ بهذا الإيصال لمراجعة حالة الطلب واستلام الجهاز.
            </div>

            <div className="divider" />
            <div className="footer">
              <div className="sig">توقيع المستلم</div>
              <div className="sig">توقيع الفني</div>
            </div>

            <div className="terms">
              {settings.receipt?.terms || 'الشروط غير محددة.'}
            </div>
          </div>
        </div>

        <div className="cut-line no-print" style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 8 }}>— — — — — — — — — — — — — — — —</div>
        {/* وسم مائي حسب نوع النسخة */}
        {showWatermark && (
          <div className="wm">
            <span>{copyType === 'archive' ? 'نسخة الأرشيف' : 'نسخة العميل'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
