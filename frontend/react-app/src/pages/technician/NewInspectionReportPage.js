import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  X,
  Save,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  ClipboardList,
  FileText,
  Calendar,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import PageTransition from '../../components/ui/PageTransition';

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
        notifications.success('تم', { message: editingReportId ? 'تم تحديث التقرير بنجاح' : 'تم إنشاء التقرير بنجاح' });
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
      <PageTransition className="min-h-screen bg-background text-right" dir="rtl">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
          <LoadingSpinner message="جاري استرداد بيانات التقرير..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-28 md:pb-8 text-right font-sans" dir="rtl">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/technician/jobs/${id}?tab=reports`)}
              className="p-3 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl shadow-sm border border-border/40 transition-all active:scale-95"
              aria-label="العودة"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-foreground">
                {editingReportId ? 'تحديث التقرير الفني' : 'إعداد تقرير فحص'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {editingReportId ? `تعديل التقرير رقم #${editingReportId}` : `تسجيل نتائج الفحص للطلب رقم #${id}`}
              </p>
            </div>
          </div>
          {editingReportId && (
            <SimpleBadge variant="info" className="w-fit animate-pulse">وضع التعديل النشط</SimpleBadge>
          )}
        </div>

        {/* Form Container */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive animate-in zoom-in-95 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <SimpleCard className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md overflow-hidden">
            <SimpleCardHeader className="bg-muted/30 border-b border-border/50 px-6 py-5">
              <SimpleCardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                المعلومات الأساسية للفحص
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type Selection */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary" />
                    نوع التقرير / الفحص
                  </label>
                  <select
                    value={inspectionForm.inspectionTypeId}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionTypeId: e.target.value })}
                    className="w-full bg-muted/50 border-border text-foreground rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                  >
                    <option value="">-- اختر نوع التقرير --</option>
                    {inspectionTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    تاريخ الفحص *
                  </label>
                  <input
                    type="date"
                    value={inspectionForm.reportDate}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, reportDate: e.target.value })}
                    className="w-full bg-muted/50 border-border text-foreground rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Summary field */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  ملخص مختصر للحالة
                </label>
                <textarea
                  value={inspectionForm.summary}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, summary: e.target.value })}
                  placeholder="اكتب ملخصاً سريعاً عن حالة الجهاز..."
                  rows={3}
                  className="w-full bg-muted/50 border-border text-foreground rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                />
              </div>

              {/* Result field */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  النتيجة التفصيلية والتشخيص
                </label>
                <textarea
                  value={inspectionForm.result}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
                  placeholder="اشرح بالتفصيل المشاكل التي تم العثور عليها..."
                  rows={6}
                  className="w-full bg-muted/50 border-border text-foreground rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                />
              </div>

              {/* Recommendations field */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Info className="w-4 h-4 text-info" />
                  التوصيات وخطوات الإصلاح المقترحة
                </label>
                <textarea
                  value={inspectionForm.recommendations}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, recommendations: e.target.value })}
                  placeholder="ما هي القطع التي يجب تبديلها أو الإجراءات القادمة؟"
                  rows={4}
                  className="w-full bg-muted/50 border-border text-foreground rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                />
              </div>

              {/* Internal Notes */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-warning" />
                  ملاحظات فنية داخلية (اختياري)
                </label>
                <textarea
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية للفريق الفني..."
                  rows={3}
                  className="w-full bg-muted/20 border-border/50 text-foreground rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/50">
                <SimpleButton
                  variant="outline"
                  onClick={() => navigate(`/technician/jobs/${id}?tab=reports`)}
                  disabled={saving}
                  className="px-8 h-14 rounded-2xl border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  إلغاء العملية
                </SimpleButton>
                <SimpleButton
                  onClick={handleSave}
                  disabled={saving || !inspectionForm.reportDate}
                  className="flex-1 h-14 rounded-2xl shadow-xl shadow-primary/20 gap-3 text-base font-bold"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      جاري حفظ البيانات...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingReportId ? 'تحديث التقرير الآن' : 'اعتماد التقرير ونشره'}
                    </>
                  )}
                </SimpleButton>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>

      <TechnicianBottomNav />
    </PageTransition>
  );
}

