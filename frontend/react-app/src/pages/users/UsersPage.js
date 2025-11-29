import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { TableSkeleton } from '../../components/ui/Skeletons';

export default function UsersPage() {
  const notifications = useNotifications();
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
        setRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes.data?.items || rolesRes.items || rolesRes.data || []));
        setUsers(Array.isArray(usersRes) ? usersRes : (usersRes.data?.items || usersRes.items || usersRes.data || usersRes));
        setError(null);
      } catch (e) {
        if (!mounted) return;
        const errorMsg = e.message || 'تعذر تحميل البيانات';
        setError(errorMsg);
        notifications.error('خطأ في التحميل', { message: errorMsg });
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
      const result = await api.updateUser(user.id, { isActive: next });
      if (result?.success) {
        notifications.success(`تم ${next ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`);
      } else {
        throw new Error(result?.message || 'فشل التحديث');
      }
    } catch (e) {
      // تراجع عند الفشل
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u)));
      const errorMsg = e.message || 'تعذر تحديث حالة المستخدم';
      notifications.error('خطأ في التحديث', { message: errorMsg });
    }
  };

  const handleChangeRole = async (user, newRoleId) => {
    const prev = user.roleId;
    const nr = Number(newRoleId);
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, roleId: nr } : u)));
    try {
      const result = await api.updateUser(user.id, { roleId: nr });
      if (result?.success) {
        const roleName = roles.find(r => r.id === nr)?.name || 'غير محدد';
        notifications.success(`تم تغيير دور المستخدم إلى ${roleName}`);
      } else {
        throw new Error(result?.message || 'فشل التحديث');
      }
    } catch (e) {
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, roleId: prev } : u)));
      const errorMsg = e.message || 'تعذر تغيير دور المستخدم';
      notifications.error('خطأ في التحديث', { message: errorMsg });
    }
  };

  const roleOptions = useMemo(() => [{ id: '', name: 'الكل' }, ...roles], [roles]);

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>

      {/* أدوات التحكم */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">بحث بالاسم/البريد</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث..."
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">الدور</label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {roleOptions.map((r) => (
              <option key={String(r.id)} value={r.id}>{r.name ?? r.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">الترتيب</label>
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(':');
              setSortBy(sb); setSortDir(sd);
            }}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="createdAt:desc">الأحدث أولاً</option>
            <option value="createdAt:asc">الأقدم أولاً</option>
            <option value="name:asc">الاسم (تصاعدي)</option>
            <option value="name:desc">الاسم (تنازلي)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-input text-primary focus:ring-primary"
          />
          تضمين غير النشطين
        </label>
      </div>

      {loading && <TableSkeleton rows={5} columns={6} />}
      {error && <div className="text-destructive">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">البريد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الدور</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">نشط؟</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-muted/50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{u.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{u.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={u.roleId ?? ''}
                      onChange={(e) => handleChangeRole(u, e.target.value)}
                      className="px-2 py-1 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {u.isActive ? 'نعم' : 'لا'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors ${u.isActive
                        ? 'bg-destructive hover:bg-destructive/90'
                        : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
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



