import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerHeader from '../../components/customer/CustomerHeader';
import RepairTrackingTimeline from '../../components/customer/RepairTrackingTimeline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import ServiceRatingModal from '../../components/customer/ServiceRatingModal';
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
    FileText
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
 */

export default function CustomerRepairDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [repair, setRepair] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRatingModal, setShowRatingModal] = useState(false);

    // Mock Data (Replace with API call)
    useEffect(() => {
        setTimeout(() => {
            setRepair({
                id: id,
                device: 'iPhone 13 Pro Max',
                issue: 'كسر في الشاشة الأمامية',
                status: 'in_progress', // received, diagnosing, in_progress, testing, ready
                cost: 4500,
                technician: 'Eng. Ahmed', // Just for internal info, maybe hide from customer if requested
                receivedDate: '2024-01-20',
                expectedDate: '2024-01-22',
                notes: 'تم استلام الجهاز وجاري العمل على تغيير الشاشة.',
                warranty: '6 شهور على الشاشة'
            });
            setLoading(false);
        }, 1000);
    }, [id]);

    // Check if repair is completed to show rating
    useEffect(() => {
        if (repair?.status === 'ready' || repair?.status === 'completed') {
            // Show modal after a delay if not rated yet (mock logic)
            const timer = setTimeout(() => setShowRatingModal(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [repair]);

    const handleContactSupport = () => {
        // WhatsApp Link from fixzzone.com
        window.open('https://api.whatsapp.com/send/?phone=%2B201270388043&text&type=phone_number&app_absent=0', '_blank');
    };

    if (loading) return <div className="flex justify-center min-h-screen items-center"><LoadingSpinner /></div>;
    if (!repair) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <ServiceRatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmit={(data) => console.log('Rating:', data)}
            />

            <CustomerHeader user={user} notificationCount={2} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/customer/repairs')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6"
                >
                    <ArrowRight className="w-5 h-5" />
                    <span>عودة لقائمة الطلبات</span>
                </button>

                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">تفاصيل الطلب #{repair.id}</h1>
                        <p className="text-gray-600">تم الاستلام في {new Date(repair.receivedDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleContactSupport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-bold"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>تحدث مع الدعم الفني</span>
                        </button>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">تتبع حالة الإصلاح</h2>
                    <RepairTrackingTimeline currentStatus={repair.status} />

                    <div className="mt-8 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">آخر تحديث</h3>
                            <p className="text-blue-700 text-sm mt-1">{repair.notes}</p>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Device Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-gray-500" />
                            معلومات الجهاز
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">الجهاز</span>
                                <span className="font-medium text-gray-900">{repair.device}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">المشكلة</span>
                                <span className="font-medium text-gray-900">{repair.issue}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">الضمان</span>
                                <span className="font-medium text-green-600 flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4" />
                                    {repair.warranty}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Cost Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-gray-500" />
                            التكلفة والفاتورة
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">تكلفة الإصلاح</span>
                                <span className="font-medium text-gray-900">{repair.cost} ج.م</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">الضريبة (14%)</span>
                                <span className="font-medium text-gray-900">{repair.cost * 0.14} ج.م</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="font-bold text-lg text-gray-900">الإجمالي</span>
                                <span className="font-bold text-lg text-blue-600">{repair.cost * 1.14} ج.م</span>
                            </div>

                            <button className="w-full mt-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4" />
                                عرض الفاتورة
                            </button>
                        </div>
                    </div>

                </div>

                {/* Before & After Photos Section */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-gray-500" />
                        صور الجهاز (قبل وبعد)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Before Photo */}
                        <div className="space-y-3">
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                قبل الإصلاح
                            </span>
                            <div className="aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {/* Placeholder for image */}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <Smartphone className="w-12 h-12 text-gray-300" />
                                <p className="absolute bottom-4 text-sm text-gray-500 font-medium">اضغط للتكبير</p>
                            </div>
                            <p className="text-sm text-gray-500">تم التقاطها: {new Date(repair.receivedDate).toLocaleDateString('ar-EG')}</p>
                        </div>

                        {/* After Photo */}
                        <div className="space-y-3">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                بعد الإصلاح
                            </span>
                            <div className="aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {/* Placeholder for image */}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <CheckCircle className="w-12 h-12 text-green-500" />
                                <p className="absolute bottom-4 text-sm text-gray-500 font-medium">اضغط للتكبير</p>
                            </div>
                            <p className="text-sm text-gray-500">تم التقاطها: {new Date().toLocaleDateString('ar-EG')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
