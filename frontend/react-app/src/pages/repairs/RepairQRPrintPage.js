import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { getFrontendBaseUrl } from '../../lib/apiConfig';

// صفحة طباعة QR لطلب الإصلاح
export default function RepairQRPrintPage() {
  const { id } = useParams();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const { settings } = useSettings();
  const copyType = (query.get('copy') || settings.printing?.defaultCopy || 'customer');
  const BRAND = useMemo(() => ({
    name: settings.company?.name || 'FixZone',
    subtitle: 'نظام إدارة الإصلاحات',
    logo: settings.company?.logoUrl || '/logo.png',
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
      } catch (e) {
        setError('تعذر تحميل بيانات الطلب');
      } finally {
        setLoading(false);
        setTimeout(() => { try { window.print(); } catch {} }, 300);
      }
    };
    load();
  }, [id]);

  const frontendBaseUrl = getFrontendBaseUrl();
  const qrTarget = `${frontendBaseUrl}/repairs/${id}`;
  const qrData = encodeURIComponent(qrTarget);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${qrData}`;

  if (loading) return <div style={{ padding: 24 }}>جاري التحضير للطباعة...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;

  const paperSize = settings.printing?.paperSize || 'A4';
  const showWatermark = settings.printing?.showWatermark !== false;

  return (
    <div className="print-page" dir="rtl">
      <style>{`
        @media print {
          @page { size: ${paperSize}; margin: 10mm; }
          .no-print { display: none !important; }
          .card { box-shadow: none !important; border: none !important; }
        }
        body { background: #f5f6f8; }
        .container { max-width: 800px; margin: 16px auto; padding: 0 12px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
        .title { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
        .muted { color: #6b7280; font-size: 12px; }
        .header { display:flex; justify-content: space-between; align-items:center; border-bottom:1px solid #f0f0f0; padding-bottom:10px; margin-bottom:12px; }
        .brand .name { font-size: 18px; font-weight: 800; }
        .brand .sub { color:#6b7280; font-size: 12px; }
        .brand img { max-height: 36px; display:block; margin-left:8px; }
        .meta { text-align:left; font-size:12px; color:#374151; }
        .meta .row { margin-bottom: 2px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; align-items:center; }
        .qr-wrap { text-align:center; }
        .qr { display:inline-block; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; background:#fff; }
        .info .label { font-size: 12px; color:#6b7280; margin-bottom:2px; }
        .info .value { font-size: 14px; color:#111827; }
        .table { width:100%; border-collapse: collapse; margin-top:8px; }
        .table th, .table td { border:1px solid #e5e7eb; padding:8px 10px; font-size:12px; }
        .table th { background:#f9fafb; text-align:right; }
        .hint { margin-top:12px; font-size:12px; color:#475569; }
      `}</style>
      <div className="container">
        <div className="no-print" style={{ marginBottom: 12, display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => window.print()} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff' }}>طباعة الآن</button>
          <button onClick={() => window.open(`${window.location.pathname}?copy=customer`, '_blank')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: copyType==='customer'?'#e0f2fe':'#fff' }}>نسخة العميل</button>
          <button onClick={() => window.open(`${window.location.pathname}?copy=archive`, '_blank')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: copyType==='archive'?'#fee2e2':'#fff' }}>نسخة الأرشيف</button>
        </div>
        <div className="card">
          <div className="header">
            <div className="brand">
              <img src={BRAND.logo} alt="logo" onError={(e)=>{e.currentTarget.style.display='none';}} />
              <div>
                <div className="name">{BRAND.name}</div>
                <div className="sub">{BRAND.subtitle}</div>
                <div style={{ fontSize:11, color:'#6b7280' }}>{BRAND.contact.address} • {BRAND.contact.phone} • {BRAND.contact.site}</div>
              </div>
            </div>
            <div className="meta">
              <div className="row">رقم الطلب: <strong>{repair?.requestNumber || `#${id}`}</strong></div>
              <div className="row">التاريخ: <strong>{new Date().toLocaleString('ar-SA')}</strong></div>
            </div>
          </div>

          <div className="grid">
            <div className="qr-wrap">
              <div className="title">رمز QR لتتبع الطلب</div>
              <div className="qr">
                <img src={qrUrl} alt="QR" width={320} height={320} />
              </div>
              <div className="muted" style={{ marginTop: 8 }}>{qrTarget}</div>
            </div>
            <div className="info">
              <table className="table">
                <tbody>
                  <tr>
                    <th>العميل</th>
                    <td>{repair?.customerName || '—'} {customerNameSuffix(repair)}</td>
                  </tr>
                  <tr>
                    <th>الهاتف</th>
                    <td>{repair?.customerPhone || '—'}</td>
                  </tr>
                  <tr>
                    <th>الجهاز</th>
                    <td>{repair?.deviceType || '—'}</td>
                  </tr>
                  <tr>
                    <th>الماركة/الموديل</th>
                    <td>{[repair?.deviceBrand, repair?.deviceModel].filter(Boolean).join(' ') || '—'}</td>
                  </tr>
                  <tr>
                    <th>الحالة</th>
                    <td>{repair?.status || 'غير محدد'}</td>
                  </tr>
                  <tr>
                    <th>التسليم المتوقع</th>
                    <td>{repair?.expectedDelivery ? new Date(repair.expectedDelivery).toLocaleString('ar-SA') : '—'}</td>
                  </tr>
                </tbody>
              </table>
              <div className="hint">امسح الرمز لمتابعة حالة الطلب مباشرةً. احتفظ بهذه الورقة لحين الاستلام.</div>
            </div>
          </div>
        </div>
        {showWatermark && (
          <div className="wm" style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <span style={{ fontSize:64, color:'#33415522', fontWeight:800 }}>{copyType === 'archive' ? 'نسخة الأرشيف' : 'نسخة العميل'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// مساعد صغير لإرفاق اسم إضافي إن وجد
function customerNameSuffix(rep) {
  if (!rep) return '';
  const extra = [rep?.customerCompanyName].filter(Boolean).join(' - ');
  return extra ? `(${extra})` : '';
}
