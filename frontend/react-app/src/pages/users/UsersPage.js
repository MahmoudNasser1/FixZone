import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // فلاتر وتحكمات
  const [q, setQ] = useState('');
  const [roleId, setRoleId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [includeInactive, setIncludeInactive] = useState(true);

  // تحميل الأدوار والمستخدمين
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [rolesRes, usersRes] = await Promise.all([
          api.listRoles().catch(() => []),
          api.listUsers({ q, roleId, sortBy, sortDir, includeInactive: includeInactive ? 1 : 0 }).catch(() => []),
        ]);
        if (!mounted) return;
        setRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes.items || []));
        setUsers(Array.isArray(usersRes) ? usersRes : (usersRes.items || []));
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError('تعذر تحميل البيانات');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, roleId, sortBy, sortDir, includeInactive]);

  const handleToggleActive = async (user) => {
    const next = !user.isActive;
    // تحديث متفائل
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, isActive: next } : u)));
    try {
      await api.updateUser(user.id, { isActive: next });
    } catch (e) {
      // تراجع عند الفشل
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u)));
      alert('تعذر تحديث حالة المستخدم');
    }
  };

  const handleChangeRole = async (user, newRoleId) => {
    const prev = user.roleId;
    const nr = Number(newRoleId);
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, roleId: nr } : u)));
    try {
      await api.updateUser(user.id, { roleId: nr });
    } catch (e) {
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, roleId: prev } : u)));
      alert('تعذر تغيير دور المستخدم');
    }
  };

  const roleOptions = useMemo(() => [{ id: '', name: 'الكل' }, ...roles], [roles]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">إدارة المستخدمين</h1>

      {/* أدوات التحكم */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">بحث بالاسم/البريد</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث..." className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">الدور</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full border rounded p-2">
            {roleOptions.map((r) => (
              <option key={String(r.id)} value={r.id}>{r.name ?? r.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">الترتيب</label>
          <select value={`${sortBy}:${sortDir}`} onChange={(e) => {
            const [sb, sd] = e.target.value.split(':');
            setSortBy(sb); setSortDir(sd);
          }} className="w-full border rounded p-2">
            <option value="createdAt:desc">الأحدث أولاً</option>
            <option value="createdAt:asc">الأقدم أولاً</option>
            <option value="name:asc">الاسم (تصاعدي)</option>
            <option value="name:desc">الاسم (تنازلي)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
          تضمين غير النشطين
        </label>
      </div>

      {loading && <div>جاري التحميل...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">#</th>
                <th className="p-2 border">الاسم</th>
                <th className="p-2 border">البريد</th>
                <th className="p-2 border">الدور</th>
                <th className="p-2 border">نشط؟</th>
                <th className="p-2 border">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.isActive ? 'opacity-70' : ''}>
                  <td className="p-2 border">{u.id}</td>
                  <td className="p-2 border">{u.name}</td>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">
                    <select value={u.roleId ?? ''} onChange={(e) => handleChangeRole(u, e.target.value)} className="border rounded p-1">
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 border">{u.isActive ? 'نعم' : 'لا'}</td>
                  <td className="p-2 border">
                    <button onClick={() => handleToggleActive(u)} className={`px-3 py-1 rounded text-white ${u.isActive ? 'bg-red-600' : 'bg-green-600'}`}>
                      {u.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



