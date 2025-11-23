import React, { useState, useEffect } from 'react';
import CustomerHeader from '../../components/customer/CustomerHeader';
import useAuthStore from '../../stores/authStore';
import {
    Bell,
    CheckCircle,
    AlertCircle,
    FileText,
    Tag,
    Clock,
    Check
} from 'lucide-react';

/**
 * 🔔 Customer Notifications Page
 * 
 * صفحة لعرض جميع إشعارات العميل.
 * المميزات:
 * - تمييز الإشعارات المقروءة وغير المقروءة.
 * - أيقونات مختلفة حسب نوع الإشعار (إصلاح، فاتورة، عرض).
 * - زر "تحديد الكل كمقروء".
 */

export default function CustomerNotificationsPage() {
    const user = useAuthStore((state) => state.user);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock Data
        setTimeout(() => {
            setNotifications([
                {
                    id: 1,
                    type: 'repair_update',
                    title: 'تحديث حالة الإصلاح',
                    message: 'تم الانتهاء من إصلاح جهاز iPhone 13 Pro Max وهو جاهز للاستلام.',
                    date: '2024-01-23T14:30:00',
                    read: false,
                    link: '/customer/repairs/101'
                },
                {
                    id: 2,
                    type: 'invoice',
                    title: 'فاتورة جديدة',
                    message: 'تم إصدار فاتورة جديدة رقم #INV-101 بقيمة 5700 ج.م.',
                    date: '2024-01-23T10:00:00',
                    read: false,
                    link: '/customer/invoices/101'
                },
                {
                    id: 3,
                    type: 'promo',
                    title: 'عرض خاص لك!',
                    message: 'احصل على خصم 20% على جميع اكسسوارات الحماية.',
                    date: '2024-01-20T09:00:00',
                    read: true,
                    link: null
                },
                {
                    id: 4,
                    type: 'system',
                    title: 'تحديث النظام',
                    message: 'تم تحديث سياسة الخصوصية الخاصة بنا.',
                    date: '2024-01-15T12:00:00',
                    read: true,
                    link: null
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'repair_update': return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'invoice': return <FileText className="w-6 h-6 text-blue-500" />;
            case 'promo': return <Tag className="w-6 h-6 text-purple-500" />;
            default: return <Bell className="w-6 h-6 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <CustomerHeader user={user} notificationCount={notifications.filter(n => !n.read).length} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="w-6 h-6 text-blue-600" />
                            الإشعارات
                        </h1>
                        <p className="text-gray-600 mt-1">تابع آخر التحديثات والنشاطات</p>
                    </div>

                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <Check className="w-4 h-4" />
                            تحديد الكل كمقروء
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`bg-white rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md ${notification.read ? 'border-gray-200 opacity-75' : 'border-blue-200 shadow-sm bg-blue-50/30'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${notification.read ? 'bg-gray-100' : 'bg-white shadow-sm'
                                    }`}>
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(notification.date).toLocaleDateString('ar-EG')}
                                        </span>
                                    </div>
                                    <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                                        {notification.message}
                                    </p>
                                    {!notification.read && (
                                        <span className="inline-block mt-2 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                            جديد
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {notifications.length === 0 && !loading && (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">لا توجد إشعارات</h3>
                            <p className="text-gray-500">أنت مطلع على كل شيء!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
