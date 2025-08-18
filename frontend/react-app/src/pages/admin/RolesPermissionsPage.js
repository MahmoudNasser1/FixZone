import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.request('/roles'); // GET admin-only
        setRoles(Array.isArray(res) ? res : (res.items || []));
      } catch (e) {
        setError('تعذر تحميل الأدوار');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">إدارة الأدوار والصلاحيات</h1>
      <p className="text-sm text-gray-600">عرض الأدوار الحالية وقيم حقل الصلاحيات (JSON). في هذه النسخة القراءة فقط. سنضيف تعديل الصلاحيات في الخطوة القادمة (يتطلب Endpoint تحديث الدور).</p>
      {loading && <div>جاري التحميل...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="border rounded p-3 bg-white">
              <div className="font-semibold">{r.name} (ID: {r.id})</div>
              <div className="text-xs text-gray-500 mt-1">Parent: {r.parentRoleId ?? 'N/A'}</div>
              <div className="mt-2">
                <div className="text-sm font-medium mb-1">الصلاحيات (JSON):</div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
{JSON.stringify(sanitizePermissions(r.permissions), null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function sanitizePermissions(perms) {
  try {
    if (perms == null) return {};
    if (typeof perms === 'string') return JSON.parse(perms);
    if (typeof perms === 'object') return perms;
    return {};
  } catch {
    return { _raw: String(perms) };
  }
}
