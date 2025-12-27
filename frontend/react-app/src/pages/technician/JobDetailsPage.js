import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTechJobDetails,
  updateTechJobStatus,
} from '../../services/technicianService';
import { getTimeTrackings } from '../../services/timeTrackingService';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import JobTimer from '../../components/technician/JobTimer';
import Stopwatch from '../../components/technician/Stopwatch';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import PageTransition from '../../components/ui/PageTransition';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import InspectionComponentsList from '../../components/reports/InspectionComponentsList';
import {
  User,
  Phone,
  MapPin,
  Smartphone,
  Calendar,
  AlertCircle,
  CheckCircle,
  Wrench,
  Plus,
  Save,
  ArrowRight,
  MessageSquare,
  Package,
  FileText,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Clock,
  Image,
  ChevronLeft,
  Play,
  Pause,
  Laptop,
  Tablet,
  Timer,
  Send
} from 'lucide-react';

/**
 * 🛠️ Job Details Page - Redesigned with Tabs
 * 
 * تصميم جديد مع Tabs منظمة:
 * - نظرة عامة (Overview)
 * - التقارير (Reports)
 * - قطع الغيار (Parts)
 * - الملاحظات (Notes)
 * - الوسائط (Media)
 */

const API_BASE_URL = getDefaultApiBaseUrl();

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Notes state
  const [note, setNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Parts state
  const [selectedPart, setSelectedPart] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  // Inspection Reports state
  const [inspectionReports, setInspectionReports] = useState([]);
  const [inspectionReportsLoading, setInspectionReportsLoading] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);
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
  const [inspectionSaving, setInspectionSaving] = useState(false);
  const [inspectionError, setInspectionError] = useState('');

  // Time tracking state
  const [timeTrackings, setTimeTrackings] = useState([]);
  const [timeTrackingsLoading, setTimeTrackingsLoading] = useState(false);
  const [totalTime, setTotalTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Mock Parts Data
  const availableParts = [
    { id: 1, name: 'شاشة iPhone 13 Original', price: 3500 },
    { id: 2, name: 'بطارية Samsung S21', price: 1200 },
    { id: 3, name: 'مدخل شحن Type-C', price: 250 },
    { id: 4, name: 'لاصقة حماية زجاجية', price: 100 },
  ];

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: Smartphone },
    { id: 'reports', label: 'التقارير', icon: FileText },
    { id: 'parts', label: 'قطع الغيار', icon: Package },
    { id: 'notes', label: 'الملاحظات', icon: MessageSquare },
    { id: 'media', label: 'الوسائط', icon: Image },
  ];

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  useEffect(() => {
    if (job?.id && activeTab === 'reports') {
      loadInspectionReports();
    }
  }, [job?.id, activeTab]);

  useEffect(() => {
    if (inspectionOpen) {
      loadInspectionTypes();
    }
  }, [inspectionOpen]);

  useEffect(() => {
    if (job?.id) {
      loadTimeTrackings();
    }
  }, [job?.id]);

  // Debug: Log modal and button positions when modal opens


  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await getTechJobDetails(id);
      if (response.success) {
        const jobData = response.data?.job || response.data;
        setJob(jobData);
      } else {
        notifications.error('خطأ', { message: 'لم يتم العثور على المهمة' });
        navigate('/technician/jobs');
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      notifications.error('خطأ', { message: 'فشل تحميل تفاصيل المهمة' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await updateTechJobStatus(id, { status: newStatus });
      if (response.success) {
        setJob(prev => ({ ...prev, status: newStatus }));
        notifications.success('تم', { message: 'تم تحديث حالة المهمة بنجاح' });
      }
    } catch (error) {
      notifications.error('خطأ', { message: 'فشل تحديث الحالة' });
    }
  };

  const handleAddPart = async () => {
    if (!selectedPart) return;
    try {
      const part = availableParts.find(p => p.id === parseInt(selectedPart));
      const newPart = { ...part, quantity: partQuantity };
      setJob(prev => ({
        ...prev,
        parts: [...(prev.parts || []), newPart]
      }));
      setSelectedPart('');
      setPartQuantity(1);
      notifications.success('تم', { message: 'تم إضافة قطعة الغيار' });
    } catch (error) {
      notifications.error('خطأ', { message: 'فشل إضافة قطعة الغيار' });
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setNoteSaving(true);
    try {
      setJob(prev => ({
        ...prev,
        notes: [...(prev.notes || []), {
          id: Date.now(),
          content: note,
          createdAt: new Date().toISOString(),
          author: user.name
        }]
      }));
      setNote('');
      notifications.success('تم', { message: 'تم إضافة الملاحظة' });
    } catch (error) {
      notifications.error('خطأ', { message: 'فشل إضافة الملاحظة' });
    } finally {
      setNoteSaving(false);
    }
  };

  const loadInspectionReports = async () => {
    if (!job?.id) return;

    try {
      setInspectionReportsLoading(true);
      const response = await fetch(`${API_BASE_URL}/inspectionreports/repair/${job.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        let reportsList = [];
        if (data.success && data.data) {
          reportsList = Array.isArray(data.data) ? data.data : [];
        } else if (Array.isArray(data)) {
          reportsList = data;
        }
        setInspectionReports(reportsList);
      }
    } catch (error) {
      console.error('Error loading inspection reports:', error);
    } finally {
      setInspectionReportsLoading(false);
    }
  };

  const loadInspectionTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspectiontypes`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const types = Array.isArray(data) ? data : (data.data || []);
        // Backend already filters by deletedAt and isActive, so we just use all returned types
        setInspectionTypes(types);
      }
    } catch (error) {
      console.error('Error loading inspection types:', error);
    }
  };

  const loadTimeTrackings = async () => {
    if (!job?.id) return;

    try {
      setTimeTrackingsLoading(true);
      const response = await getTimeTrackings({ repairId: job.id });

      if (response.success && response.data?.trackings) {
        const trackings = response.data.trackings;
        setTimeTrackings(trackings);

        // Calculate total time
        const totalSeconds = trackings.reduce((sum, t) => {
          return sum + (t.duration || 0);
        }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setTotalTime({ hours, minutes, seconds });
      }
    } catch (error) {
      console.error('Error loading time trackings:', error);
    } finally {
      setTimeTrackingsLoading(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSaveInspectionReport = async () => {
    // #region agent log
    // #endregion
    if (!job?.id) {
      setInspectionError('لا يوجد طلب إصلاح مرتبط');
      return;
    }

    if (!inspectionForm.reportDate) {
      setInspectionError('تاريخ التقرير مطلوب');
      return;
    }

    try {
      setInspectionSaving(true);
      setInspectionError('');

      let reportDateISO = inspectionForm.reportDate;
      if (reportDateISO && reportDateISO.length === 10) {
        reportDateISO = new Date(reportDateISO + 'T00:00:00.000Z').toISOString();
      }

      const payload = {
        repairRequestId: job.id,
        inspectionTypeId: inspectionForm.inspectionTypeId || null,
        technicianId: user?.id || null,
        reportDate: reportDateISO,
        summary: inspectionForm.summary || null,
        result: inspectionForm.result || null,
        recommendations: inspectionForm.recommendations || null,
        notes: inspectionForm.notes || null,
      };

      const url = editingReport
        ? `${API_BASE_URL}/inspectionreports/${editingReport.id}`
        : `${API_BASE_URL}/inspectionreports`;

      const method = editingReport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const responseData = await response.json();
        notifications.success('تم', { message: editingReport ? 'تم تحديث التقرير' : 'تم إنشاء التقرير' });
        setInspectionOpen(false);
        setEditingReport(null);
        setInspectionForm({
          inspectionTypeId: '',
          technicianId: user?.id || '',
          reportDate: new Date().toISOString().slice(0, 10),
          summary: '',
          result: '',
          recommendations: '',
          notes: '',
        });
        loadInspectionReports();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setInspectionError(errorData.error || 'فشل حفظ التقرير');
      }
    } catch (error) {
      console.error('Error saving inspection report:', error);
      setInspectionError('حدث خطأ أثناء حفظ التقرير');
    } finally {
      setInspectionSaving(false);
    }
  };

  const handleEditReport = (report) => {
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
    setInspectionError('');
    setInspectionOpen(true);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/inspectionreports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        notifications.success('تم', { message: 'تم حذف التقرير' });
        loadInspectionReports();
      } else {
        notifications.error('خطأ', { message: 'فشل حذف التقرير' });
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      notifications.error('خطأ', { message: 'حدث خطأ أثناء حذف التقرير' });
    }
  };

  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    return Smartphone;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle };
      case 'in_progress':
        return { label: 'قيد العمل', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Wrench };
      case 'pending':
        return { label: 'في الانتظار', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock };
      default:
        return { label: status || 'غير محدد', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: AlertCircle };
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const DeviceIcon = getDeviceIcon(job.deviceType);
  const statusConfig = getStatusConfig(job.status);
  const StatusIcon = statusConfig.icon;

  return (
    <PageTransition className="min-h-screen bg-background pb-28 md:pb-8">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/technician/jobs')}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="font-medium">العودة</span>
          </button>

          <div className="flex items-center gap-2">
            {job.status !== 'completed' && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg shadow-emerald-500/25 font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                <span>إتمام المهمة</span>
              </button>
            )}
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800 overflow-hidden mb-6">
          {/* Top Banner */}
          <div className="h-24 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/2" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 -mt-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Device Icon */}
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-900">
                <DeviceIcon className="w-12 h-12 text-teal-600 dark:text-teal-400" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {job.deviceType || 'جهاز'}
                  </h1>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                  {job.priority === 'high' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm font-medium">
                      عاجل
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  #{job.id} • {job.deviceBrand || ''} {job.deviceModel || ''}
                </p>
              </div>

              {/* Customer Quick Info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{job.customerName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400" dir="ltr">{job.customerPhone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stopwatch Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 p-4 mb-6">
          <Stopwatch
            repairId={job.id}
            onStop={() => {
              // Reload time trackings when stopwatch stops
              loadTimeTrackings();
            }}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex overflow-x-auto border-b border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === tab.id
                    ? 'text-teal-600 dark:text-teal-400 border-teal-500 bg-white dark:bg-slate-900'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Problem Description */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    وصف المشكلة
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {job.issueDescription || job.reportedProblem || 'لا توجد تفاصيل'}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white">معلومات الجهاز</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 w-24">نوع الجهاز:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{job.deviceType || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 w-24">الماركة:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{job.deviceBrand || job.brand || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 w-24">الموديل:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{job.deviceModel || job.model || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 w-24">نوع الصيانة:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{job.repairType || 'Hardware'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 w-24">تاريخ الاستلام:</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white">معلومات العميل</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-medium">{job.customerName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-medium" dir="ltr">{job.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-medium">{job.customerAddress || 'غير مسجل'}</span>
                      </div>
                    </div>
                    <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors font-medium">
                      <Phone className="w-4 h-4" />
                      اتصال بالعميل
                    </button>
                  </div>
                </div>

                {/* Time Tracking Section - Full Width */}
                <div className="mt-6 space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Timer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    الوقت المستغرق
                  </h3>
                  {timeTrackingsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Total Time Display */}
                      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-teal-200 dark:border-teal-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">إجمالي الوقت:</span>
                          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                            {totalTime.hours > 0 ? `${totalTime.hours}:` : ''}{totalTime.minutes.toString().padStart(2, '0')}:{totalTime.seconds.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {timeTrackings.length > 0 ? `${timeTrackings.length} جلسة عمل` : 'لا توجد جلسات عمل مسجلة'}
                        </div>
                      </div>

                      {/* Time Sessions List */}
                      {timeTrackings.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {timeTrackings.map((tracking) => (
                            <div key={tracking.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {formatTime(tracking.duration || 0)}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${tracking.status === 'running'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                  }`}>
                                  {tracking.status === 'running' ? 'جاري' : 'مكتمل'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDateTime(tracking.startTime)}
                                {tracking.endTime && ` - ${formatDateTime(tracking.endTime)}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">التقارير الفنية</h3>
                  <button
                    onClick={() => {
                      setEditingReport(null);
                      setInspectionForm({
                        inspectionTypeId: '',
                        technicianId: user?.id || '',
                        reportDate: new Date().toISOString().slice(0, 10),
                        summary: '',
                        result: '',
                        recommendations: '',
                        notes: '',
                      });
                      setInspectionError('');
                      setInspectionOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    تقرير جديد
                  </button>
                </div>

                {inspectionReportsLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
                    <p className="text-slate-500">جاري تحميل التقارير...</p>
                  </div>
                ) : inspectionReports.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">لا توجد تقارير فنية</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">أضف تقريراً جديداً لتوثيق العمل</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inspectionReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border-r-4 border-blue-500"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {report.inspectionTypeName || 'تقرير فحص'}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {report.reportDate ? new Date(report.reportDate).toLocaleDateString('ar-EG') : 'تاريخ غير محدد'}
                              </p>
                            </div>
                          </div>

                          {report.technicianId === user?.id && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditReport(report)}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {report.summary && (
                          <div className="bg-white/70 dark:bg-slate-900/50 rounded-xl p-3 mb-2">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">الملخص:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{report.summary}</p>
                          </div>
                        )}

                        {report.result && (
                          <div className="bg-white/70 dark:bg-slate-900/50 rounded-xl p-3 mb-2">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">النتيجة:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{report.result}</p>
                          </div>
                        )}

                        {report.recommendations && (
                          <div className="bg-white/70 dark:bg-slate-900/50 rounded-xl p-3">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">التوصيات:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{report.recommendations}</p>
                          </div>
                        )}

                        {/* Inspection Components */}
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                          <InspectionComponentsList
                            reportId={report.id}
                            onComponentUpdate={loadInspectionReports}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Parts Tab */}
            {activeTab === 'parts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">قطع الغيار المستخدمة</h3>
                </div>

                {/* Add Part Form */}
                <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <select
                    value={selectedPart}
                    onChange={(e) => setSelectedPart(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                  >
                    <option value="">اختر قطعة غيار...</option>
                    {availableParts.map(part => (
                      <option key={part.id} value={part.id}>{part.name} ({part.price} ج.م)</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddPart}
                    disabled={!selectedPart}
                    className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Parts List */}
                {job.parts && job.parts.length > 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-right">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">القطعة</th>
                          <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">الكمية</th>
                          <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">السعر</th>
                          <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {job.parts.map((part, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{part.name}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{part.quantity}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{part.price} ج.م</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{part.price * part.quantity} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">لم يتم إضافة قطع غيار</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-900 dark:text-white">الملاحظات والتعليقات</h3>

                {/* Notes List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {job.notes && job.notes.length > 0 ? (
                    job.notes.map((n) => (
                      <div key={n.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{n.author}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(n.createdAt).toLocaleString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{n.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">لا توجد ملاحظات</p>
                    </div>
                  )}
                </div>

                {/* Add Note Form */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="أضف ملاحظة..."
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!note.trim() || noteSaving}
                    className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">الصور والفيديوهات</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors font-medium text-sm">
                    <Plus className="w-4 h-4" />
                    إضافة وسائط
                  </button>
                </div>

                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <Image className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">لا توجد صور أو فيديوهات</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">أضف صوراً لتوثيق حالة الجهاز</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspection Report Modal */}
      {inspectionOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-0 sm:p-4 md:p-4">
          <div
            data-modal="inspection-report"
            className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[calc(100vh-88px)] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 absolute bottom-[88px] left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingReport ? 'تعديل التقرير' : 'تقرير فني جديد'}
                </h2>
                <button
                  onClick={() => {
                    setInspectionOpen(false);
                    setEditingReport(null);
                    setInspectionError('');
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {inspectionError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{inspectionError}</p>
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
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">النتيجة والتشخيص</label>
                <textarea
                  value={inspectionForm.result}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
                  placeholder="نتيجة الفحص..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">التوصيات</label>
                <textarea
                  value={inspectionForm.recommendations}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, recommendations: e.target.value })}
                  placeholder="التوصيات..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 pb-[100px] sm:pb-6">
                <button
                  data-save-btn="inspection"
                  onClick={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/f156c2bc-9f08-4c5c-8680-c47fa95669dd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'JobDetailsPage.js:1032', message: 'Save button clicked', data: { saving: inspectionSaving, hasDate: !!inspectionForm.reportDate, formData: Object.keys(inspectionForm) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
                    // #endregion
                    handleSaveInspectionReport();
                  }}
                  disabled={inspectionSaving || !inspectionForm.reportDate}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inspectionSaving ? (
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
                <button
                  onClick={() => {
                    setInspectionOpen(false);
                    setEditingReport(null);
                    setInspectionError('');
                  }}
                  disabled={inspectionSaving}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <TechnicianBottomNav />
    </PageTransition>
  );
}
