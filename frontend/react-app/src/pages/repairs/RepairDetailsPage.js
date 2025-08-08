import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import RepairTimeline from '../../components/ui/RepairTimeline';
import StatusFlow from '../../components/ui/StatusFlow';
import AttachmentManager from '../../components/ui/AttachmentManager';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  ArrowRight, User, Phone, Mail, Settings, Edit, Save, X,
  Wrench, Clock, CheckCircle, Play, XCircle, AlertTriangle,
  FileText, Paperclip, MessageSquare, Plus
} from 'lucide-react';

const RepairDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [repair, setRepair] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchRepairDetails();
  }, [id]);

  const fetchRepairDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // استخدام بيانات تجريبية
      setRepair({
        id: id,
        requestNumber: 'REP-20241207-001',
        deviceType: 'لابتوب',
        deviceBrand: 'Dell',
        deviceModel: 'Inspiron 15 3000',
        problemDescription: 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل.',
        status: 'in-progress',
        priority: 'high',
        estimatedCost: 450.00,
        actualCost: null,
        technicianNotes: 'تم فحص الجهاز، المشكلة في كارت الشاشة',
        customerNotes: 'الجهاز توقف فجأة أثناء العمل',
        createdAt: '2024-12-07T10:30:00Z',
        updatedAt: '2024-12-07T14:15:00Z',
        expectedDelivery: '2024-12-10T16:00:00Z',
        customerId: 1,
        customerName: 'أحمد محمد علي',
        customerPhone: '+966501234567'
      });
      
      setCustomer({
        id: 1,
        name: 'أحمد محمد علي',
        phone: '+966501234567',
        email: 'ahmed.ali@email.com',
        address: 'الرياض، حي النرجس'
      });
      
      setNotes([
        {
          id: 1,
          content: 'تم استلام الجهاز وفحصه أولياً',
          author: 'فني الاستقبال',
          createdAt: '2024-12-07T10:30:00Z',
          type: 'system'
        },
        {
          id: 2,
          content: 'تم تشخيص المشكلة - كارت الشاشة يحتاج استبدال',
          author: 'أحمد الفني',
          createdAt: '2024-12-07T14:15:00Z',
          type: 'technician'
        }
      ]);
      
      setAttachments([
        {
          id: 1,
          name: 'صورة الجهاز قبل الإصلاح.jpg',
          type: 'image',
          size: '2.5 MB',
          uploadedAt: '2024-12-07T10:30:00Z',
          uploadedBy: 'فني الاستقبال'
        }
      ]);
      
      setNewStatus('in-progress');
    } catch (err) {
      console.error('Error fetching repair details:', err);
      setError('حدث خطأ في تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setRepair(prev => ({ ...prev, status: newStatus, updatedAt: new Date().toISOString() }));
      setEditingStatus(false);
    } catch (err) {
      setError('حدث خطأ في تحديث حالة الطلب');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    const newNoteEntry = {
      id: notes.length + 1,
      content: newNote,
      author: 'المستخدم الحالي',
      createdAt: new Date().toISOString(),
      type: 'user'
    };
    
    setNotes(prev => [...prev, newNoteEntry]);
    setNewNote('');
    setAddingNote(false);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in-progress': { text: 'قيد الإصلاح', color: 'bg-blue-100 text-blue-800', icon: Play },
      'on-hold': { text: 'معلق', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      completed: { text: 'مكتمل', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { text: 'ملغي', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      low: { text: 'منخفضة', color: 'bg-gray-100 text-gray-800' },
      medium: { text: 'متوسطة', color: 'bg-yellow-100 text-yellow-800' },
      high: { text: 'عالية', color: 'bg-red-100 text-red-800' }
    };
    return priorityMap[priority] || priorityMap.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="p-8">
        <p className="text-gray-600">الطلب غير موجود</p>
        <Link to="/repairs" className="mt-4 inline-block">
          <SimpleButton variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لقائمة الطلبات
          </SimpleButton>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(repair.status);
  const priorityInfo = getPriorityInfo(repair.priority);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Link to="/repairs">
              <SimpleButton variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              تفاصيل الطلب: {repair.requestNumber}
            </h1>
            <SimpleBadge className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 ml-1" />
              {statusInfo.text}
            </SimpleBadge>
            <SimpleBadge className={priorityInfo.color}>
              {priorityInfo.text}
            </SimpleBadge>
          </div>
          <p className="text-gray-600">
            تاريخ الإنشاء: {new Date(repair.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <SimpleButton 
            variant="outline"
            onClick={() => setEditingStatus(!editingStatus)}
          >
            <Edit className="w-4 h-4 ml-2" />
            تحديث الحالة
          </SimpleButton>
          <SimpleButton>
            <Settings className="w-4 h-4 ml-2" />
            إعدادات الطلب
          </SimpleButton>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          {/* المخطط الزمني */}
          <RepairTimeline repair={repair} compact={false} />
          
          {/* مخطط انسيابي للحالات */}
          <StatusFlow currentStatus={repair.status} compact={false} />

          {/* تفاصيل الجهاز والمشكلة */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center">
                <Wrench className="w-5 h-5 ml-2" />
                تفاصيل الجهاز والمشكلة
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجهاز</label>
                    <p className="text-gray-900">{repair.deviceType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الماركة والموديل</label>
                    <p className="text-gray-900">{repair.deviceBrand} {repair.deviceModel}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة المقدرة</label>
                    <p className="text-gray-900 font-semibold">{repair.estimatedCost} ر.س</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة الفعلية</label>
                    <p className="text-gray-900">{repair.actualCost ? `${repair.actualCost} ر.س` : 'لم يتم تحديدها بعد'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">موعد التسليم المتوقع</label>
                    <p className="text-gray-900">
                      {repair.expectedDelivery ? new Date(repair.expectedDelivery).toLocaleDateString('ar-SA') : 'لم يتم تحديده بعد'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف المشكلة</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{repair.problemDescription}</p>
                </div>
              </div>
              
              {repair.technicianNotes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الفني</label>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-900">{repair.technicianNotes}</p>
                  </div>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>

          {/* سجل الملاحظات */}
          <SimpleCard>
            <SimpleCardHeader>
              <div className="flex items-center justify-between">
                <SimpleCardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 ml-2" />
                  سجل الملاحظات والتحديثات
                </SimpleCardTitle>
                <SimpleButton size="sm" onClick={() => setAddingNote(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة ملاحظة
                </SimpleButton>
              </div>
            </SimpleCardHeader>
            <SimpleCardContent>
              {addingNote && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-3"
                    rows={3}
                  />
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <SimpleButton size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Save className="w-4 h-4 ml-1" />
                      حفظ
                    </SimpleButton>
                    <SimpleButton size="sm" variant="ghost" onClick={() => { setAddingNote(false); setNewNote(''); }}>
                      <X className="w-4 h-4 ml-1" />
                      إلغاء
                    </SimpleButton>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="flex space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{note.author}</p>
                        <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString('ar-SA')}</p>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {editingStatus && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>تحديث حالة الطلب</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-4">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="in-progress">قيد الإصلاح</option>
                    <option value="on-hold">معلق</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                  <div className="flex space-x-2 space-x-reverse">
                    <SimpleButton size="sm" onClick={() => {
                      // تحديث الحالة
                      setRepair(prev => ({ ...prev, status: newStatus }));
                      setEditingStatus(false);
                      
                      // إشعار نجاح
                      notifications.success('تم تحديث حالة الطلب بنجاح', {
                        title: 'تم الحفظ',
                        duration: 3000
                      });
                    }}>
                      <Save className="w-4 h-4 ml-1" />
                      حفظ
                    </SimpleButton>
                    <SimpleButton size="sm" variant="ghost" onClick={() => setEditingStatus(false)}>
                      <X className="w-4 h-4 ml-1" />
                      إلغاء
                    </SimpleButton>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {customer && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <User className="w-5 h-5 ml-2" />
                  معلومات العميل
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الاسم</label>
                    <p className="text-gray-900">{customer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الهاتف</label>
                    <p className="text-gray-900 en-text">{customer.phone}</p>
                  </div>
                  {customer.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                      <p className="text-gray-900 en-text">{customer.email}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Link to={`/customers/${customer.id}`}>
                    <SimpleButton variant="outline" size="sm" className="w-full">
                      <User className="w-4 h-4 ml-1" />
                      عرض ملف العميل
                    </SimpleButton>
                  </Link>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          <AttachmentManager 
            attachments={attachments}
            onUpload={async (file) => {
              try {
                // إظهار إشعار التحميل
                const uploadId = notifications.loading(`جاري رفع الملف "${file.name}"...`, {
                  title: 'رفع الملف'
                });
                
                // محاكاة زمن الرفع
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const newAttachment = {
                  id: attachments.length + 1,
                  name: file.name,
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  description: '',
                  type: file.type,
                  size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
                  fileSize: file.size,
                  uploadedAt: new Date().toISOString(),
                  uploadedBy: 'المستخدم الحالي',
                  url: URL.createObjectURL(file)
                };
                
                setAttachments(prev => [...prev, newAttachment]);
                
                // إزالة إشعار التحميل وإظهار إشعار النجاح
                notifications.removeNotification(uploadId);
                notifications.success(`تم رفع الملف "${file.name}" بنجاح`, {
                  title: 'تم الرفع',
                  duration: 3000
                });
              } catch (error) {
                notifications.error('فشل في رفع الملف', {
                  title: 'خطأ في الرفع'
                });
              }
            }}
            onDelete={(id) => {
              const attachment = attachments.find(att => att.id === id);
              setAttachments(prev => prev.filter(att => att.id !== id));
              
              notifications.success(`تم حذف الملف "${attachment?.title || attachment?.name}" بنجاح`, {
                title: 'تم الحذف',
                duration: 3000
              });
            }}
            onView={(attachment) => {
              if (attachment.url) {
                window.open(attachment.url, '_blank');
              } else {
                alert('رابط الملف غير متوفر');
              }
            }}
            onDownload={(attachment) => {
              if (attachment.url) {
                const link = document.createElement('a');
                link.href = attachment.url;
                link.download = attachment.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                alert('رابط التحميل غير متوفر');
              }
            }}
            onEdit={(id, updates) => {
              setAttachments(prev => prev.map(att => 
                att.id === id ? { ...att, ...updates } : att
              ));
              
              notifications.success('تم تحديث بيانات الملف بنجاح', {
                title: 'تم التحديث',
                duration: 3000
              });
            }}
            allowUpload={true}
            allowDelete={true}
            allowEdit={true}
            maxFileSize={10}
            allowedTypes={['image/*', 'application/pdf', '.doc', '.docx', 'video/*', 'audio/*']}
          />
        </div>
      </div>
    </div>
  );
};

export default RepairDetailsPage;
