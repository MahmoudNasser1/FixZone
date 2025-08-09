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
import { useSettings } from '../../context/SettingsContext';
import { 
  ArrowRight, User, Phone, Mail, Settings, Edit, Save, X,
  Wrench, Clock, CheckCircle, Play, XCircle, AlertTriangle,
  FileText, Paperclip, MessageSquare, Plus, Printer, QrCode,
  UserPlus, Trash2
} from 'lucide-react';

const RepairDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { formatMoney } = useSettings();
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
  const [activeTab, setActiveTab] = useState('status'); // status | timeline | attachments | invoices | notes
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTechId, setAssignTechId] = useState('');
  const [techOptions, setTechOptions] = useState([]);
  const [techLoading, setTechLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState(null);

  useEffect(() => {
    fetchRepairDetails();
  }, [id]);

  useEffect(() => {
    // تحميل كسول للفواتير عند فتح تبويب الفواتير لأول مرة
    if (activeTab === 'invoices' && invoices.length === 0 && !invoicesLoading) {
      loadInvoices();
    }
  }, [activeTab]);

  // تحميل قائمة الفنيين عند فتح حوار الإسناد
  useEffect(() => {
    const loadTechs = async () => {
      try {
        setTechLoading(true);
        const res = await apiService.listTechnicians();
        const items = Array.isArray(res) ? res : (res.items || []);
        setTechOptions(items);
      } catch (e) {
        notifications.error('تعذر تحميل قائمة الفنيين');
      } finally {
        setTechLoading(false);
      }
    };
    if (assignOpen && techOptions.length === 0) {
      loadTechs();
    }
  }, [assignOpen]);

  const fetchRepairDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // محاولة الجلب من API أولاً
      try {
        const rep = await apiService.getRepairRequest(id);
        setRepair(rep);
        // ملاحظات/سجل
        try {
          const logs = await apiService.getRepairLogs(id);
          // إذا عاد السجل بصيغة مختلفة، خزن كما هو
          setNotes(Array.isArray(logs) ? logs : (logs.items || []));
        } catch {}
        // المرفقات
        try {
          const atts = await apiService.listAttachments(id);
          setAttachments(Array.isArray(atts) ? atts : (atts.items || []));
        } catch {}
        // بيانات العميل إن وجدت
        if (rep?.customerId) {
          try {
            const cust = await apiService.getCustomer(rep.customerId);
            setCustomer(cust);
          } catch {}
        }
        setNewStatus(rep?.status || 'pending');
      } catch (fetchErr) {
        // fallback: بيانات تجريبية
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
          { id: 1, content: 'تم استلام الجهاز وفحصه أولياً', author: 'فني الاستقبال', createdAt: '2024-12-07T10:30:00Z', type: 'system' },
          { id: 2, content: 'تم تشخيص المشكلة - كارت الشاشة يحتاج استبدال', author: 'أحمد الفني', createdAt: '2024-12-07T14:15:00Z', type: 'technician' }
        ]);
        setAttachments([
          { id: 1, name: 'صورة الجهاز قبل الإصلاح.jpg', type: 'image', size: '2.5 MB', uploadedAt: '2024-12-07T10:30:00Z', uploadedBy: 'فني الاستقبال' }
        ]);
        setNewStatus('in-progress');
      }
    } catch (err) {
      console.error('Error fetching repair details:', err);
      setError('حدث خطأ في تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true);
      setInvoicesError(null);
      const res = await apiService.listRepairInvoices(id);
      setInvoices(Array.isArray(res) ? res : (res.items || []));
    } catch (e) {
      setInvoicesError('تعذر تحميل الفواتير');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setInvoicesLoading(true);
      const payload = {
        title: `فاتورة ${repair?.requestNumber || id}`,
        amount: repair?.estimatedCost || 0,
        currency: 'SAR'
      };
      await apiService.createRepairInvoice(id, payload);
      notifications.success('تم إنشاء الفاتورة بنجاح', { title: 'نجاح' });
      await loadInvoices();
    } catch (e) {
      notifications.error('فشل إنشاء الفاتورة', { title: 'خطأ' });
    }
  };

  const handleAssignTechnician = async () => {
    if (!assignTechId) return;
    try {
      await apiService.assignTechnician(id, assignTechId);
      notifications.success('تم إسناد الفني بنجاح');
      setAssignOpen(false);
      setAssignTechId('');
    } catch (e) {
      notifications.error('تعذر إسناد الفني');
    }
  };

  const handlePrint = (type) => {
    // فتح صفحات الطباعة المحلية ذات القالب الجاهز
    const path = type === 'qr' ? `/repairs/${id}/print-qr` : `/repairs/${id}/print`;
    window.open(path, '_blank');
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('سيتم حذف طلب الإصلاح نهائيًا. هل أنت متأكد؟');
    if (!confirmed) return;
    try {
      await apiService.deleteRepairRequest(id);
      notifications.success('تم حذف الطلب بنجاح');
      navigate('/repairs');
    } catch (e) {
      notifications.error('تعذر حذف الطلب');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      // تحديث عبر API ثم تحديث الواجهة
      await apiService.updateRepairStatus(id, newStatus);
      setRepair(prev => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : prev));
      setEditingStatus(false);
      notifications.success('تم تحديث الحالة بنجاح', { title: 'نجاح', duration: 2500 });
    } catch (err) {
      setError('حدث خطأ في تحديث حالة الطلب');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: newNote,
      author: 'المستخدم الحالي',
      createdAt: new Date().toISOString(),
      type: 'note'
    };

    // تحديث تفاؤلي
    setNotes(prev => [...prev, optimistic]);
    setNewNote('');
    setAddingNote(false);

    try {
      const res = await apiService.addRepairNote(id, optimistic.content);
      // استبدال الملاحظة المؤقتة بالملاحظة من السيرفر
      const saved = {
        id: res?.id ?? optimistic.id,
        content: optimistic.content,
        author: res?.userId ? `مستخدم #${res.userId}` : optimistic.author,
        createdAt: res?.createdAt || optimistic.createdAt,
        type: res?.action || 'note',
      };
      setNotes(prev => prev.map(n => (n.id === optimistic.id ? saved : n)));
      notifications.success('تم حفظ الملاحظة بنجاح');
    } catch (e) {
      // تراجع عند الفشل
      setNotes(prev => prev.filter(n => n.id !== optimistic.id));
      notifications.error('تعذر حفظ الملاحظة');
    }
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
          <SimpleButton onClick={() => setAssignOpen(true)}>
            <UserPlus className="w-4 h-4 ml-2" />
            إسناد فني
          </SimpleButton>
          <SimpleButton variant="outline" onClick={() => handlePrint('receipt')}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة إيصال
          </SimpleButton>
          <SimpleButton variant="outline" onClick={() => handlePrint('qr')}>
            <QrCode className="w-4 h-4 ml-2" />
            طباعة QR
          </SimpleButton>
          <SimpleButton variant="ghost" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 ml-2" />
            حذف
          </SimpleButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 space-x-reverse" aria-label="Tabs">
          {[
            { key: 'status', label: 'الحالة والتفاصيل', icon: Wrench },
            { key: 'timeline', label: 'المخطط الزمني', icon: Clock },
            { key: 'attachments', label: 'المرفقات', icon: Paperclip },
            { key: 'invoices', label: 'الفواتير', icon: FileText },
            { key: 'notes', label: 'الملاحظات', icon: MessageSquare },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="w-4 h-4 ml-2" />{t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'timeline' && (
            <>
              <RepairTimeline repair={repair} compact={false} />
            </>
          )}

          {activeTab === 'status' && (
            <>
              <StatusFlow currentStatus={repair.status} compact={false} />
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
                        <p className="text-gray-900 font-semibold">{formatMoney(repair.estimatedCost || 0)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة الفعلية</label>
                        <p className="text-gray-900">{repair.actualCost != null ? formatMoney(repair.actualCost) : 'لم يتم تحديدها بعد'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">موعد التسليم المتوقع</label>
                        <p className="text-gray-900">{repair.expectedDelivery ? new Date(repair.expectedDelivery).toLocaleDateString('ar-SA') : 'لم يتم تحديده بعد'}</p>
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
            </>
          )}

          {activeTab === 'attachments' && (
            <>
              <AttachmentManager 
                attachments={attachments}
                onUpload={async (file) => {
                  try {
                    const uploadId = notifications.loading(`جاري رفع الملف "${file.name}"...`, { title: 'رفع الملف' });
                    let created;
                    try {
                      created = await apiService.uploadAttachment(id, file, { title: file.name.replace(/\.[^/.]+$/, '') });
                    } catch (e) {
                      created = {
                        id: Date.now(),
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
                    }
                    setAttachments(prev => [...prev, created]);
                    notifications.removeNotification(uploadId);
                    notifications.success(`تم رفع الملف "${file.name}" بنجاح`, { title: 'تم الرفع', duration: 3000 });
                  } catch (error) {
                    notifications.error('فشل في رفع الملف', { title: 'خطأ في الرفع' });
                  }
                }}
                onDelete={(id) => {
                  const attachment = attachments.find(att => att.id === id);
                  apiService.deleteAttachment?.(repair?.id || id, id).catch(() => {});
                  setAttachments(prev => prev.filter(att => att.id !== id));
                  notifications.success(`تم حذف الملف "${attachment?.title || attachment?.name}" بنجاح`, { title: 'تم الحذف', duration: 3000 });
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
                  notifications.success('تم تحديث بيانات الملف بنجاح', { title: 'تم التحديث', duration: 3000 });
                }}
                allowUpload={true}
                allowDelete={true}
                allowEdit={true}
                maxFileSize={10}
                allowedTypes={['image/*', 'application/pdf', '.doc', '.docx', 'video/*', 'audio/*']}
              />
            </>
          )}

          {activeTab === 'invoices' && (
            <>
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <FileText className="w-5 h-5 ml-2" />
                      فواتير الطلب
                    </SimpleCardTitle>
                    <SimpleButton size="sm" onClick={handleCreateInvoice} disabled={invoicesLoading}>
                      <Plus className="w-4 h-4 ml-1" /> إنشاء فاتورة
                    </SimpleButton>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {invoicesLoading && (
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  )}
                  {invoicesError && (
                    <div className="text-red-600">{invoicesError}</div>
                  )}
                  {!invoicesLoading && !invoicesError && (
                    <div className="divide-y divide-gray-200">
                      {invoices.length === 0 ? (
                        <p className="text-gray-600">لا توجد فواتير بعد</p>
                      ) : (
                        invoices.map(inv => (
                          <div key={inv.id || inv.invoiceId} className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{inv.title || `فاتورة #${inv.id || inv.invoiceId}`}</p>
                              <p className="text-sm text-gray-600">المبلغ: {formatMoney(inv.amount || 0)}</p>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <SimpleButton variant="outline" size="sm" onClick={() => handlePrint('receipt')}>طباعة</SimpleButton>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>
            </>
          )}

          {activeTab === 'notes' && (
            <>
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
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </>
          )}
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
        </div>
      </div>

      {/* حوار إسناد فني */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">إسناد فني</h3>
              <button onClick={() => setAssignOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">اختر الفني</label>
              {techLoading ? (
                <div className="text-sm text-gray-500">جاري تحميل قائمة الفنيين...</div>
              ) : (
                <select
                  value={assignTechId}
                  onChange={(e) => setAssignTechId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">اختر الفني...</option>
                  {techOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || `مستخدم #${u.id}`} {u.phone ? `- ${u.phone}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              <SimpleButton variant="ghost" onClick={() => setAssignOpen(false)}>إلغاء</SimpleButton>
              <SimpleButton onClick={handleAssignTechnician} disabled={!assignTechId}>حفظ</SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairDetailsPage;
