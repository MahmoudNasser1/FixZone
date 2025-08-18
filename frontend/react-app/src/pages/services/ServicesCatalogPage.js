import React, { useEffect, useMemo, useState } from 'react';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '../../components/ui/SimpleCard';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';

const API_BASE = 'http://localhost:3000/api';

const ServicesCatalogPage = () => {
  const { success, error: notifyError, warning } = useNotifications();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', basePrice: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('id'); // id | name | basePrice | isActive
  const [sortDir, setSortDir] = useState('asc'); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const user = useAuthStore((s) => s.user);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        q: query,
        sortBy,
        sortDir,
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });
      const res = await fetch(`${API_BASE}/services?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
        setTotal(data.length);
      } else {
        setServices(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total || 0));
      }
    } catch (e) {
      setError('تعذر جلب الخدمات');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServices(); }, [query, sortBy, sortDir, page, pageSize]);

  const handleSave = async () => {
    try {
      if (!form.name || !form.basePrice) {
        warning('يرجى إدخال الاسم والسعر الأساسي');
        return;
      }
      setSaving(true);
      const url = editingId ? `${API_BASE}/services/${editingId}` : `${API_BASE}/services`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          description: form.description || '',
          basePrice: Number(form.basePrice),
          isActive: !!form.isActive
        })
      });
      if (!res.ok) throw new Error('failed');
      success(editingId ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح');
      setModalOpen(false);
      setForm({ name: '', basePrice: '', description: '', isActive: true });
      setEditingId(null);
      await loadServices();
    } catch (e) {
      notifyError('تعذر حفظ الخدمة');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', basePrice: '', description: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (svc) => {
    setEditingId(svc.id);
    setForm({
      name: svc.name || '',
      basePrice: svc.basePrice ?? '',
      description: svc.description || '',
      isActive: !!svc.isActive,
    });
    setModalOpen(true);
  };

  const toggleActive = async (svc) => {
    try {
      const res = await fetch(`${API_BASE}/services/${svc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: svc.name,
          description: svc.description,
          basePrice: Number(svc.basePrice || 0),
          isActive: !svc.isActive
        })
      });
      if (!res.ok) throw new Error();
      success(!svc.isActive ? 'تم تفعيل الخدمة' : 'تم تعطيل الخدمة');
      await loadServices();
    } catch (e) {
      notifyError('تعذر تغيير حالة الخدمة');
    }
  };

  const removeService = async (svc) => {
    try {
      const ok = window.confirm(`سيتم حذف الخدمة: ${svc.name}. هل أنت متأكد؟`);
      if (!ok) return;
      const res = await fetch(`${API_BASE}/services/${svc.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      success('تم حذف الخدمة');
      await loadServices();
    } catch (e) {
      notifyError('تعذر حذف الخدمة');
    }
  };

  // Server-side pagination results are already sliced, so render `services` directly
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = services;

  const canManage = useMemo(() => {
    // Backend sends { id, name, role } where role is numeric roleId (1=Admin)
    const roleId = user?.role;
    if (typeof roleId === 'number') {
      return roleId === 1; // Admin
    }
    const role = user?.role || user?.type || user?.userRole || '';
    const perms = new Set([...(user?.permissions || []), ...(user?.scopes || [])].map(String));
    return (
      ['admin', 'administrator', 'owner', 'manager'].includes(String(role).toLowerCase()) ||
      perms.has('manage_services') || perms.has('services:manage')
    );
  }, [user]);

  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="p-4 rounded border border-yellow-300 bg-yellow-50 text-yellow-800">
          ليست لديك صلاحية الوصول إلى كتالوج الخدمات. يرجى التواصل مع مدير النظام.
        </div>
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">كتالوج الخدمات</h1>
        <div className="flex items-center gap-2">
          <input
            className="w-64 p-2 border rounded"
            placeholder="بحث بالاسم/الوصف/الرقم"
            value={query}
            onChange={(e)=>{ setQuery(e.target.value); setPage(1); }}
          />
          <SimpleButton size="sm" onClick={openAdd} disabled={!canManage}>إضافة خدمة</SimpleButton>
        </div>
      </div>

      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>الخدمات المتاحة</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-600 text-sm">لا توجد خدمات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-right px-3 py-2 border cursor-pointer select-none" onClick={()=>{setSortBy('id'); setSortDir(sortBy==='id' && sortDir==='asc'?'desc':'asc'); setPage(1);}}>
                      # {sortBy==='id' ? (sortDir==='asc'?'↑':'↓') : ''}
                    </th>
                    <th className="text-right px-3 py-2 border cursor-pointer select-none" onClick={()=>{setSortBy('name'); setSortDir(sortBy==='name' && sortDir==='asc'?'desc':'asc'); setPage(1);}}>
                      الاسم {sortBy==='name' ? (sortDir==='asc'?'↑':'↓') : ''}
                    </th>
                    <th className="text-right px-3 py-2 border cursor-pointer select-none" onClick={()=>{setSortBy('basePrice'); setSortDir(sortBy==='basePrice' && sortDir==='asc'?'desc':'asc'); setPage(1);}}>
                      السعر الأساسي {sortBy==='basePrice' ? (sortDir==='asc'?'↑':'↓') : ''}
                    </th>
                    <th className="text-right px-3 py-2 border cursor-pointer select-none" onClick={()=>{setSortBy('isActive'); setSortDir(sortBy==='isActive' && sortDir==='asc'?'desc':'asc'); setPage(1);}}>
                      الحالة {sortBy==='isActive' ? (sortDir==='asc'?'↑':'↓') : ''}
                    </th>
                    <th className="text-right px-3 py-2 border">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border">{s.id}</td>
                      <td className="px-3 py-2 border">{s.name}</td>
                      <td className="px-3 py-2 border">{Number(s.basePrice || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border">{s.isActive ? 'مفعل' : 'غير مفعل'}</td>
                      <td className="px-3 py-2 border">
                        <div className="flex items-center gap-2 justify-start">
                          <SimpleButton size="sm" variant="outline" onClick={()=>openEdit(s)} disabled={!canManage}>تعديل</SimpleButton>
                          <SimpleButton size="sm" variant="ghost" onClick={()=>toggleActive(s)} disabled={!canManage}>
                            {s.isActive ? 'تعطيل' : 'تفعيل'}
                          </SimpleButton>
                          <SimpleButton size="sm" variant="destructive" onClick={()=>removeService(s)} disabled={!canManage}>حذف</SimpleButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between gap-2 p-3 border-t bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm">صفحة {currentPage} من {totalPages}</span>
                  <span className="text-sm text-gray-500">| إجمالي: {total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select className="p-1 border rounded" value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value)); setPage(1);}}>
                    {[5,10,20,50].map(n => <option key={n} value={n}>{n} / صفحة</option>)}
                  </select>
                  <SimpleButton size="sm" variant="outline" onClick={()=>setPage(Math.max(1, currentPage-1))} disabled={currentPage<=1}>السابق</SimpleButton>
                  <SimpleButton size="sm" variant="outline" onClick={()=>setPage(Math.min(totalPages, currentPage+1))} disabled={currentPage>=totalPages}>التالي</SimpleButton>
                </div>
              </div>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="text-lg font-semibold">{editingId ? 'تعديل خدمة' : 'إضافة خدمة'}</h3>
              <button className="text-gray-500" onClick={() => setModalOpen(false)}>إغلاق</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm mb-1">الاسم</label>
                <input className="w-full p-2 border rounded" value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">السعر الأساسي</label>
                  <input type="number" className="w-full p-2 border rounded" value={form.basePrice} onChange={(e)=>setForm(f=>({...f, basePrice:e.target.value}))} />
                </div>
                <div className="flex items-center gap-2">
                  <input id="isActive" type="checkbox" checked={!!form.isActive} onChange={(e)=>setForm(f=>({...f, isActive:e.target.checked}))} />
                  <label htmlFor="isActive" className="text-sm">مفعل</label>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">الوصف</label>
                <textarea className="w-full p-2 border rounded" rows={3} value={form.description} onChange={(e)=>setForm(f=>({...f, description:e.target.value}))} />
              </div>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <SimpleButton variant="ghost" onClick={()=>setModalOpen(false)} disabled={saving}>إلغاء</SimpleButton>
              <SimpleButton onClick={handleSave} disabled={saving || !form.name || !form.basePrice}>
                {saving ? 'جارٍ الحفظ...' : (editingId ? 'تحديث' : 'حفظ')}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesCatalogPage;
