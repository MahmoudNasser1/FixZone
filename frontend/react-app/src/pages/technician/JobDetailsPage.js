import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getTechJobDetails,
  updateTechJobStatus,
  addTechJobNote
} from '../../services/technicianService';
import { JobStatusBadge, TimelineView, MediaGallery, MediaUploadModal, statusMap, SparePartsRequest } from '../../components/technician';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  Calendar,
  Package,
  Wrench,
  MessageCircle,
  Save,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Video,
  Shield
} from 'lucide-react';

/**
 * JobDetailsPage
 * صفحة تفاصيل الجهاز - الصفحة الأهم للفني
 */

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [timeline, setTimeline] = useState([]);
  
  // Status update form
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Note form
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  
  // Media upload modal
  const [showMediaModal, setShowMediaModal] = useState(false);

  useEffect(() => {
    // التحقق من أن المستخدم فني
    const roleId = user?.roleId || user?.role;
    const isTechnician = user && (roleId === 3 || roleId === '3');

    if (!user || !isTechnician) {
      notifications.error('خطأ', { message: 'يجب تسجيل الدخول كفني للوصول لهذه الصفحة' });
      navigate('/login');
      return;
    }

    loadJobDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await getTechJobDetails(id);
      
      if (response.success && response.data) {
        setJob(response.data.job);
        setTimeline(response.data.timeline || []);
        setNewStatus(response.data.job.status || '');
      } else {
        notifications.error('خطأ', { message: 'فشل تحميل تفاصيل الجهاز' });
        navigate('/tech/jobs');
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      notifications.error('خطأ', { message: 'فشل تحميل تفاصيل الجهاز' });
      navigate('/tech/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    
    if (!newStatus) {
      notifications.warning('تنبيه', { message: 'يرجى اختيار الحالة الجديدة' });
      return;
    }

    if (newStatus === job.status) {
      notifications.warning('تنبيه', { message: 'الحالة لم تتغير' });
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await updateTechJobStatus(id, {
        status: newStatus,
        notes: statusNotes
      });

      if (response.success) {
        notifications.success('نجاح', { message: 'تم تحديث الحالة بنجاح' });
        setStatusNotes('');
        await loadJobDetails(); // Reload to get updated timeline
      } else {
        notifications.error('خطأ', { message: response.message || 'فشل تحديث الحالة' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      notifications.error('خطأ', { message: 'فشل تحديث الحالة' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      notifications.warning('تنبيه', { message: 'يرجى كتابة الملاحظة' });
      return;
    }

    try {
      setAddingNote(true);
      const response = await addTechJobNote(id, { note: newNote });

      if (response.success) {
        notifications.success('نجاح', { message: 'تم إضافة الملاحظة بنجاح' });
        setNewNote('');
        await loadJobDetails(); // Reload to get updated timeline
      } else {
        notifications.error('خطأ', { message: response.message || 'فشل إضافة الملاحظة' });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      notifications.error('خطأ', { message: 'فشل إضافة الملاحظة' });
    } finally {
      setAddingNote(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">الجهاز غير موجود</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tech/jobs')}
              >
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  طلب #{job.requestNumber || job.id}
                </h1>
                <p className="text-sm text-gray-600">
                  {job.deviceBrand} {job.deviceModel}
                </p>
              </div>
            </div>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={loadJobDetails}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </SimpleButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Device Info */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  معلومات الجهاز
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">نوع الجهاز</p>
                    <p className="font-medium">{job.deviceType || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">الموديل</p>
                    <p className="font-medium">{job.deviceBrand} {job.deviceModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">السيريال</p>
                    <p className="font-medium">{job.serialNumber || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاريخ الاستلام</p>
                    <p className="font-medium">{formatDate(job.createdAt)}</p>
                  </div>
                  {job.reportedProblem && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">المشكلة المبلغ عنها</p>
                      <p className="font-medium text-gray-900">{job.reportedProblem}</p>
                    </div>
                  )}
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Customer Info */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات العميل
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">اسم العميل</p>
                      <p className="font-medium">{job.customerName || 'غير محدد'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">رقم الهاتف</p>
                      <p className="font-medium">{job.customerPhone || 'غير محدد'}</p>
                    </div>
                  </div>
                  {job.customerEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                        <p className="font-medium">{job.customerEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Timeline */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  سجل الأحداث (Timeline)
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <TimelineView timeline={timeline} />
              </SimpleCardContent>
            </SimpleCard>

            {/* Media Gallery */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  معرض الوسائط
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <MediaGallery 
                  jobId={id} 
                  onUploadClick={() => setShowMediaModal(true)}
                />
              </SimpleCardContent>
            </SimpleCard>

            {/* Spare Parts Request */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  طلب قطع غيار
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <SparePartsRequest jobId={id} onSubmitted={loadJobDetails} />
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Current Status */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>الحالة الحالية</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="flex justify-center py-4">
                  <JobStatusBadge status={job.status} showIcon={true} className="text-lg px-4 py-2" />
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Update Status */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  تحديث الحالة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحالة الجديدة
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(statusMap).map((statusKey) => {
                        const status = statusMap[statusKey];
                        return (
                          <option key={statusKey} value={statusKey}>
                            {status.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات (اختياري)
                    </label>
                    <Textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="أضف ملاحظات حول التحديث..."
                      rows={3}
                    />
                  </div>
                  <SimpleButton
                    type="submit"
                    className="w-full"
                    disabled={updatingStatus || newStatus === job.status}
                  >
                    {updatingStatus ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        جاري التحديث...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        حفظ التحديث
                      </>
                    )}
                  </SimpleButton>
                </form>
              </SimpleCardContent>
            </SimpleCard>

            {/* Add Note */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  إضافة ملاحظة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <div>
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="اكتب ملاحظة..."
                      rows={4}
                    />
                  </div>
                  <SimpleButton
                    type="submit"
                    className="w-full"
                    disabled={addingNote || !newNote.trim()}
                  >
                    {addingNote ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        إضافة ملاحظة
                      </>
                    )}
                  </SimpleButton>
                </form>
              </SimpleCardContent>
            </SimpleCard>

            {/* Quick Actions */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>إجراءات سريعة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-2">
                  <SimpleButton
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowMediaModal(true)}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    رفع وسائط
                  </SimpleButton>
                  <a href="#spare-parts" className="block">
                    <SimpleButton
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      طلب قطع غيار
                    </SimpleButton>
                  </a>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </div>

      {/* Media Upload Modal */}
      <MediaUploadModal
        jobId={id}
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSuccess={() => {
          // Refresh page to show new media
          loadJobDetails();
        }}
      />
    </div>
  );
}

