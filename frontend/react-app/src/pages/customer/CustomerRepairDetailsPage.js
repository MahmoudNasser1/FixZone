import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import RepairTrackingTimeline from '../../components/customer/RepairTrackingTimeline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import ServiceRatingModal from '../../components/customer/ServiceRatingModal';
import ImageLightbox from '../../components/customer/ImageLightbox';
import RepairShareModal from '../../components/customer/RepairShareModal';
import {
    ArrowRight,
    MessageCircle,
    Phone,
    MapPin,
    Calendar,
    Smartphone,
    CreditCard,
    ShieldCheck,
    CheckCircle,
    FileText,
    AlertCircle,
    Image,
    Share2,
    Printer,
    Download
} from 'lucide-react';

/**
 * 📱 Customer Repair Details Page
 * 
 * صفحة تفاصيل الطلب للعميل.
 * المميزات:
 * - Timeline لتتبع الحالة
 * - زر تواصل مع الدعم الفني
 * - تفاصيل الجهاز والتكلفة
 * - تقييم الخدمة
 * - صور الجهاز قبل وبعد
 */

export default function CustomerRepairDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [repair, setRepair] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);

    // Fetch repair details from API
    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!user || !isCustomer) {
            notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
            navigate('/login');
            return;
        }

        loadRepairDetails();
        loadNotificationCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

        const loadRepairDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch repair details
            const response = await api.getRepairRequest(id);
            
            if (response.success && response.data) {
                const repairData = response.data;
                
                // Transform API response to component format
                setRepair({
                    id: repairData.id,
                    device: `${repairData.deviceBrand || ''} ${repairData.deviceModel || repairData.deviceType || 'جهاز'}`.trim(),
                    deviceType: repairData.deviceType,
                    deviceBrand: repairData.deviceBrand,
                    deviceModel: repairData.deviceModel,
                    serialNumber: repairData.serialNumber,
                    issue: repairData.issueDescription || repairData.problemDescription || repairData.reportedProblem || 'لا يوجد وصف',
                    status: repairData.status || 'pending',
                    cost: repairData.estimatedCost || repairData.actualCost || 0,
                    actualCost: repairData.actualCost,
                    estimatedCost: repairData.estimatedCost,
                    technician: repairData.technicianName || repairData.assignedTechnicianId,
                    receivedDate: repairData.createdAt,
                    expectedDate: repairData.expectedCompletionDate,
                    completedDate: repairData.completedAt,
                    notes: repairData.customerNotes || repairData.technicianNotes || 'لا توجد ملاحظات',
                    technicianNotes: repairData.technicianNotes,
                    customerNotes: repairData.customerNotes,
                    warranty: repairData.warrantyPeriod || '3 شهور',
                    priority: repairData.priority,
                    invoiceId: repairData.invoiceId
                });

                // Fetch attachments
                try {
                    const attachmentsResponse = await api.listAttachments(id);
                    if (attachmentsResponse.success && attachmentsResponse.data) {
                        setAttachments(attachmentsResponse.data || []);
                    }
                } catch (attachErr) {
                    console.warn('Failed to load attachments:', attachErr);
                }
            } else {
                setError('لم يتم العثور على طلب الإصلاح');
            }
        } catch (err) {
            console.error('Error loading repair details:', err);
            setError(err.message || 'فشل تحميل تفاصيل الطلب');
            notifications.error('خطأ', { message: 'فشل تحميل تفاصيل الطلب' });
        } finally {
            setLoading(false);
        }
    };

    const loadNotificationCount = async () => {
        try {
            const response = await api.getCustomerNotifications({ unreadOnly: 'true', limit: 1 });
            if (response.success && response.data) {
                setNotificationCount(response.data.unreadCount || 0);
            }
        } catch (err) {
            console.warn('Failed to load notification count:', err);
        }
    };

    // Check if repair is completed to show rating
    useEffect(() => {
        // Only show rating modal if repair is completed/delivered and user hasn't rated it yet
        // Check if repair has been rated (you may need to add a rating field to the repair object)
        const isCompleted = repair?.status === 'ready' || repair?.status === 'completed' || repair?.status === 'delivered';
        const hasBeenRated = repair?.ratingId || repair?.hasRating; // Adjust based on your data structure
        
        if (isCompleted && !hasBeenRated) {
            // Show modal after a delay only if repair is completed and not rated
            const timer = setTimeout(() => setShowRatingModal(true), 3000);
            return () => clearTimeout(timer);
        } else {
            setShowRatingModal(false);
        }
    }, [repair]);

    const handleContactSupport = () => {
        // WhatsApp Link from fixzzone.com
        window.open('https://api.whatsapp.com/send/?phone=%2B201270388043&text&type=phone_number&app_absent=0', '_blank');
    };

    const handleViewInvoice = () => {
        if (repair?.invoiceId) {
            navigate(`/customer/invoices/${repair.invoiceId}`);
        } else {
            notifications.info('تنبيه', { message: 'لم يتم إنشاء فاتورة لهذا الطلب بعد' });
        }
    };

    // Get before/after images from attachments
    const beforeImages = attachments.filter(att => att.type === 'before' || att.category === 'before');
    const afterImages = attachments.filter(att => att.type === 'after' || att.category === 'after');

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !repair) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-16">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">حدث خطأ</h2>
                        <p className="text-muted-foreground mb-6">{error || 'لم يتم العثور على طلب الإصلاح'}</p>
                        <button
                            onClick={() => navigate('/customer/repairs')}
                            className="px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors"
                        >
                            العودة لقائمة الطلبات
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // All images for lightbox
    const allImages = attachments.map(att => ({
        ...att,
        category: att.type || att.category
    }));

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setShowLightbox(true);
    };

    const handlePrint = () => {
        window.open(`/repairs/${id}/print`, '_blank');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 pb-12">
            <ServiceRatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmit={(data) => {
                    console.log('Rating:', data);
                    notifications.success('شكراً', { message: 'تم إرسال تقييمك بنجاح' });
                    setShowRatingModal(false);
                }}
            />

            <ImageLightbox
                images={allImages}
                initialIndex={lightboxIndex}
                isOpen={showLightbox}
                onClose={() => setShowLightbox(false)}
            />

            <RepairShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                repairId={repair.id}
                repairInfo={{ device: repair.device }}
            />

            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/customer/repairs')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowRight className="w-5 h-5" />
                    <span>عودة لقائمة الطلبات</span>
                </button>

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">تفاصيل الطلب #{repair.id}</h1>
                        <p className="text-muted-foreground">
                            تم الاستلام في {repair.receivedDate ? new Date(repair.receivedDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors shadow-sm font-bold"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="hidden sm:inline">مشاركة</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-bold"
                        >
                            <Printer className="w-5 h-5" />
                            <span className="hidden sm:inline">طباعة</span>
                        </button>
                        <button
                            onClick={handleContactSupport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-bold"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">تحدث مع الدعم الفني</span>
                            <span className="sm:hidden">تواصل</span>
                        </button>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 mb-8">
                    <h2 className="text-lg font-bold text-foreground mb-6">تتبع حالة الإصلاح</h2>
                    <RepairTrackingTimeline currentStatus={repair.status} />

                    {repair.notes && (
                        <div className="mt-8 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 dark:text-blue-100">آخر تحديث</h3>
                                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">{repair.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Device Info */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                            معلومات الجهاز
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">الجهاز</span>
                                <span className="font-medium text-foreground">{repair.device}</span>
                            </div>
                            {repair.serialNumber && (
                                <div className="flex justify-between border-b border-border pb-2">
                                    <span className="text-muted-foreground">الرقم التسلسلي</span>
                                    <span className="font-medium text-foreground font-mono text-sm">{repair.serialNumber}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">المشكلة</span>
                                <span className="font-medium text-foreground text-left max-w-[60%]">{repair.issue}</span>
                            </div>
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">الضمان</span>
                                <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4" />
                                    {repair.warranty}
                                </span>
                            </div>
                            {repair.priority && (
                                <div className="flex justify-between pb-2">
                                    <span className="text-muted-foreground">الأولوية</span>
                                    <span className={`font-medium ${
                                        repair.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                                        repair.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                        'text-green-600 dark:text-green-400'
                                    }`}>
                                        {repair.priority === 'high' ? 'عالية' : repair.priority === 'medium' ? 'متوسطة' : 'عادية'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cost Info */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                            التكلفة والفاتورة
                        </h3>
                        <div className="space-y-4">
                            {repair.estimatedCost > 0 && (
                                <div className="flex justify-between border-b border-border pb-2">
                                    <span className="text-muted-foreground">التكلفة المقدرة</span>
                                    <span className="font-medium text-foreground">{repair.estimatedCost.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            )}
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">تكلفة الإصلاح</span>
                                <span className="font-medium text-foreground">{(repair.actualCost || repair.cost || 0).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">الضريبة (14%)</span>
                                <span className="font-medium text-foreground">{((repair.actualCost || repair.cost || 0) * 0.14).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="font-bold text-lg text-foreground">الإجمالي</span>
                                <span className="font-bold text-lg text-brand-blue">{((repair.actualCost || repair.cost || 0) * 1.14).toLocaleString('ar-EG')} ج.م</span>
                            </div>

                            <button 
                                onClick={handleViewInvoice}
                                className="w-full mt-4 py-2.5 border-2 border-brand-blue text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                عرض الفاتورة
                            </button>
                        </div>
                    </div>

                </div>

                {/* Before & After Photos Section */}
                <div className="mt-8 bg-card rounded-xl shadow-sm border border-border p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        <Image className="w-5 h-5 text-muted-foreground" />
                        صور الجهاز
                    </h2>

                    {attachments.length === 0 ? (
                        <div className="text-center py-8">
                            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">لا توجد صور مرفقة لهذا الطلب</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Before Photos */}
                            <div className="space-y-3">
                                <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                                    قبل الإصلاح ({beforeImages.length})
                                </span>
                                {beforeImages.length > 0 ? (
                                    <div className="grid gap-3">
                                        {beforeImages.map((img, index) => {
                                            const globalIndex = allImages.findIndex(a => a.id === img.id || (a.url === img.url && a.path === img.path));
                                            return (
                                                <div 
                                                    key={img.id || index}
                                                    className="aspect-video bg-muted rounded-xl border border-border overflow-hidden relative group cursor-pointer"
                                                    onClick={() => openLightbox(globalIndex >= 0 ? globalIndex : index)}
                                                >
                                                    <img 
                                                        src={img.url || img.path} 
                                                        alt={`قبل الإصلاح ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    <div className="hidden items-center justify-center absolute inset-0 bg-muted">
                                                        <Smartphone className="w-12 h-12 text-muted-foreground" />
                                                    </div>
                                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity flex items-center justify-center">
                                                        <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-sm">اضغط للتكبير</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center">
                                        <Smartphone className="w-12 h-12 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">لا توجد صور</p>
                                    </div>
                                )}
                                {beforeImages.length > 0 && beforeImages[0].createdAt && (
                                    <p className="text-sm text-muted-foreground">
                                        تم التقاطها: {new Date(beforeImages[0].createdAt).toLocaleDateString('ar-EG')}
                                    </p>
                                )}
                            </div>

                            {/* After Photos */}
                            <div className="space-y-3">
                                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">
                                    بعد الإصلاح ({afterImages.length})
                                </span>
                                {afterImages.length > 0 ? (
                                    <div className="grid gap-3">
                                        {afterImages.map((img, index) => {
                                            const globalIndex = allImages.findIndex(a => a.id === img.id || (a.url === img.url && a.path === img.path));
                                            return (
                                                <div 
                                                    key={img.id || index}
                                                    className="aspect-video bg-muted rounded-xl border border-border overflow-hidden relative group cursor-pointer"
                                                    onClick={() => openLightbox(globalIndex >= 0 ? globalIndex : index)}
                                                >
                                                    <img 
                                                        src={img.url || img.path} 
                                                        alt={`بعد الإصلاح ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    <div className="hidden items-center justify-center absolute inset-0 bg-muted">
                                                        <CheckCircle className="w-12 h-12 text-green-500" />
                                                    </div>
                                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity flex items-center justify-center">
                                                        <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-sm">اضغط للتكبير</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center">
                                        <CheckCircle className="w-12 h-12 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {repair.status === 'completed' || repair.status === 'delivered' 
                                                ? 'لم تتم إضافة صور بعد الإصلاح' 
                                                : 'سيتم إضافتها بعد إتمام الإصلاح'}
                                        </p>
                                    </div>
                                )}
                                {afterImages.length > 0 && afterImages[0].createdAt && (
                                    <p className="text-sm text-muted-foreground">
                                        تم التقاطها: {new Date(afterImages[0].createdAt).toLocaleDateString('ar-EG')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* All Attachments if no before/after categorization */}
                    {attachments.length > 0 && beforeImages.length === 0 && afterImages.length === 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            {attachments.map((img, index) => (
                                <div 
                                    key={img.id || index}
                                    className="aspect-video bg-muted rounded-xl border border-border overflow-hidden relative group cursor-pointer"
                                    onClick={() => window.open(img.url || img.path, '_blank')}
                                >
                                    <img 
                                        src={img.url || img.path} 
                                        alt={`صورة ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Technician Notes (if available) */}
                {repair.technicianNotes && (
                    <div className="mt-6 bg-card rounded-xl shadow-sm border border-border p-6">
                        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            ملاحظات الفني
                        </h3>
                        <p className="text-muted-foreground">{repair.technicianNotes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
