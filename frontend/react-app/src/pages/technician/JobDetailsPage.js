import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTechJobDetails,
  updateTechJobStatus,
  addTechJobNotePart,
  addJobNote
} from '../../services/technicianService';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import JobTimer from '../../components/technician/JobTimer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
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
  Package
} from 'lucide-react';

/**
 * 🛠️ Job Details Page
 * 
 * صفحة تفاصيل المهمة الكاملة للفني.
 */

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  // Mock Parts Data (Should come from API)
  const availableParts = [
    { id: 1, name: 'شاشة iPhone 13 Original', price: 3500 },
    { id: 2, name: 'بطارية Samsung S21', price: 1200 },
    { id: 3, name: 'مدخل شحن Type-C', price: 250 },
    { id: 4, name: 'لاصقة حماية زجاجية', price: 100 },
  ];

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await getTechJobDetails(id);
      if (response.success) {
        setJob(response.data);
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
      // In real app, call API
      // await addJobPart(id, { partId: selectedPart, quantity: partQuantity });

      // Optimistic update
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
    try {
      // await addJobNote(id, { content: note });
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
    }
  };

  if (loading) return <div className="flex justify-center min-h-screen items-center"><LoadingSpinner /></div>;
  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/technician/jobs')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>عودة للقائمة</span>
          </button>

          <div className="flex items-center gap-3">
            {job.status !== 'completed' && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>إتمام المهمة</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content (Right Column) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Job Timer */}
            <JobTimer
              initialTime={job.elapsedTime || 0}
              isRunning={job.status === 'in_progress'}
              onStart={() => handleStatusUpdate('in_progress')}
              onPause={() => handleStatusUpdate('pending')} // Or keep in_progress but pause timer
              onStop={(time) => console.log('Stopped at', time)}
            />

            {/* Device & Issue Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Smartphone className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{job.deviceType}</h2>
                    <p className="text-gray-500">#{job.id} • {job.brand} {job.model}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${job.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                  {job.priority === 'high' ? 'عاجل' : 'عادي'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  وصف المشكلة
                </h3>
                <p className="text-gray-700 leading-relaxed">{job.issueDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>تاريخ الاستلام: {new Date(job.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Wrench className="w-4 h-4" />
                  <span>نوع الصيانة: {job.repairType || 'Hardware'}</span>
                </div>
              </div>
            </div>

            {/* Parts Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                قطع الغيار المستخدمة
              </h3>

              {/* Add Part Form */}
              <div className="flex gap-3 mb-6">
                <select
                  value={selectedPart}
                  onChange={(e) => setSelectedPart(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  onChange={(e) => setPartQuantity(parseInt(e.target.value))}
                  className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleAddPart}
                  disabled={!selectedPart}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Parts List */}
              {job.parts && job.parts.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500">القطعة</th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500">الكمية</th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500">السعر</th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {job.parts.map((part, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900">{part.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{part.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{part.price} ج.م</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{part.price * part.quantity} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4 text-sm">لم يتم إضافة قطع غيار بعد</p>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                الملاحظات والتقرير
              </h3>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                {job.notes && job.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-900">{note.author}</span>
                      <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleTimeString('ar-EG')}</span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="أضف ملاحظة فنية..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar (Left Column) */}
          <div className="space-y-6">

            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider text-gray-500">بيانات العميل</h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {job.customerName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{job.customerName}</p>
                  <p className="text-xs text-gray-500">عميل مميز</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{job.customerPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{job.customerAddress || 'العنوان غير مسجل'}</span>
                </div>
              </div>

              <button className="w-full mt-6 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                اتصال بالعميل
              </button>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider text-gray-500">سجل الحالة</h3>
              <div className="relative border-r border-gray-200 mr-2 space-y-6">
                <div className="relative pr-6">
                  <div className="absolute -right-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                  <p className="text-sm font-bold text-gray-900">قيد العمل</p>
                  <p className="text-xs text-gray-500">اليوم، 10:30 ص</p>
                </div>
                <div className="relative pr-6">
                  <div className="absolute -right-1.5 top-1.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white"></div>
                  <p className="text-sm font-medium text-gray-500">تم الاستلام</p>
                  <p className="text-xs text-gray-400">أمس، 04:15 م</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
