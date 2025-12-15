import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import PageTransition from '../../components/ui/PageTransition';
import { X, Save, RefreshCw, ArrowRight } from 'lucide-react';

const API_BASE_URL = getDefaultApiBaseUrl();

export default function NewInspectionReportPage() {
  const { id, reportId } = useParams(); // job ID and reportId (if editing)
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);
  
  const editingReportId = reportId;
  const [editingReport, setEditingReport] = useState(null);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [inspectionForm, setInspectionForm] = useState({
    inspectionTypeId: '',
    technicianId: user?.id || '',
    reportDate: new Date().toISOString().slice(0, 10),
    summary: '',
    result: '',
    recommendations: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInspectionTypes();
    if (editingReportId) {
      loadReportForEdit(editingReportId);
    }
  }, [editingReportId]);

  const loadInspectionTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspectiontypes`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const types = Array.isArray(data) ? data : (data.data || []);
        setInspectionTypes(types);
      }
    } catch (error) {
      console.error('Error loading inspection types:', error);
    }
  };

  const loadReportForEdit = async (reportId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inspectionreports/${reportId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const report = await response.json();
        setEditingReport(report);
        setInspectionForm({
          inspectionTypeId: report.inspectionTypeId || '',
          technicianId: report.technicianId || user?.id || '',
          reportDate: report.reportDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          summary: report.summary || '',
          result: report.result || '',
          recommendations: report.recommendations || '',
          notes: report.notes || '',
        });
      }
    } catch (error) {
      console.error('Error loading report:', error);
      notifications.error('خطأ', { message: 'فشل تحميل التقرير' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) {
      setError('لا يوجد طلب إصلاح مرتبط');
      return;
    }

    if (!inspectionForm.reportDate) {
      setError('تاريخ التقرير مطلوب');
      return;
    }

    try {
      setSaving(true);
      setError('');

      let reportDateISO = inspectionForm.reportDate;
      if (reportDateISO && reportDateISO.length === 10) {
        reportDateISO = new Date(reportDateISO + 'T00:00:00.000Z').toISOString();
      }
      
      const payload = {
        repairRequestId: id,
        inspectionTypeId: inspectionForm.inspectionTypeId || null,
        technicianId: user?.id || null,
        reportDate: reportDateISO,
        summary: inspectionForm.summary || null,
        result: inspectionForm.result || null,
        recommendations: inspectionForm.recommendations || null,
        notes: inspectionForm.notes || null,
      };

      const url = editingReportId
        ? `${API_BASE_URL}/inspectionreports/${editingReportId}`
        : `${API_BASE_URL}/inspectionreports`;
      
      const method = editingReportId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        notifications.success('تم', { message: editingReportId ? 'تم تحديث التقرير' : 'تم إنشاء التقرير' });
        // العودة للصفحة السابقة
        navigate(`/technician/jobs/${id}`, { state: { activeTab: 'reports' } });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'فشل حفظ التقرير');
      }
    } catch (error) {
      console.error('Error saving inspection report:', error);
      setError('حدث خطأ أثناء حفظ التقرير');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 pb-28 md:pb-8">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 pb-28 md:pb-8">
      <TechnicianHeader user={user} notificationCount={5} />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/technician/jobs/${id}?tab=reports`)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="font-medium">العودة</span>
          </button>
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {editingReportId ? 'تعديل التقرير' : 'تقرير فني جديد'}
          </h1>
          
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع التقرير</label>
            <select
              value={inspectionForm.inspectionTypeId}
              onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionTypeId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
            >
              <option value="">اختر نوع التقرير...</option>
              {inspectionTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تاريخ التقرير *</label>
            <input
              type="date"
              value={inspectionForm.reportDate}
              onChange={(e) => setInspectionForm({ ...inspectionForm, reportDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الملخص</label>
            <textarea
              value={inspectionForm.summary}
              onChange={(e) => setInspectionForm({ ...inspectionForm, summary: e.target.value })}
              placeholder="ملخص التقرير..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">النتيجة والتشخيص</label>
            <textarea
              value={inspectionForm.result}
              onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
              placeholder="نتيجة الفحص..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">التوصيات</label>
            <textarea
              value={inspectionForm.recommendations}
              onChange={(e) => setInspectionForm({ ...inspectionForm, recommendations: e.target.value })}
              placeholder="التوصيات..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => navigate(`/technician/jobs/${id}?tab=reports`)}
              disabled={saving}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !inspectionForm.reportDate}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <TechnicianBottomNav />
    </PageTransition>
  );
}

