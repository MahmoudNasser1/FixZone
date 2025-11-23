import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import CustomerHeader from '../../components/customer/CustomerHeader';
import { Settings as SettingsIcon, Lock, Bell, Globe, Trash2, Save } from 'lucide-react';

/**
 * ⚙️ Customer Settings Page
 */

export default function CustomerSettingsPage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [activeTab, setActiveTab] = useState('security');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        repairUpdates: true,
        invoiceReminders: true,
        promotions: false
    });

    const handlePasswordChange = (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            notifications.error('خطأ', { message: 'كلمات المرور غير متطابقة' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            notifications.error('خطأ', { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
            return;
        }

        // TODO: API call
        notifications.success('نجاح', { message: 'تم تغيير كلمة المرور بنجاح' });
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const handleSaveNotifications = () => {
        // TODO: API call
        notifications.success('نجاح', { message: 'تم حفظ إعدادات الإشعارات' });
    };

    const tabs = [
        { id: 'security', label: 'الأمان', icon: Lock },
        { id: 'notifications', label: 'الإشعارات', icon: Bell },
        { id: 'preferences', label: 'التفضيلات', icon: Globe }
    ];

    return (
        <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
            <CustomerHeader user={user} notificationCount={3} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' }}
                        >
                            <SettingsIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
                            <p className="text-sm text-gray-600">إدارة إعدادات الحساب والتفضيلات</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all"
                                style={{
                                    background: activeTab === tab.id
                                        ? 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
                                        : 'white',
                                    color: activeTab === tab.id ? 'white' : '#374151',
                                    border: `1px solid ${activeTab === tab.id ? '#053887' : '#E5E7EB'}`
                                }}
                            >
                                <TabIcon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">تغيير كلمة المرور</h2>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        كلمة المرور الحالية
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        كلمة المرور الجديدة
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        تأكيد كلمة المرور الجديدة
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all"
                                    style={{ background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)' }}
                                >
                                    <Save className="w-4 h-4" />
                                    حفظ التغييرات
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">إعدادات الإشعارات</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                    <div>
                                        <p className="font-medium text-gray-900">إشعارات البريد الإلكتروني</p>
                                        <p className="text-sm text-gray-600">استقبال الإشعارات عبر البريد</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.emailNotifications}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                emailNotifications: e.target.checked
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                    <div>
                                        <p className="font-medium text-gray-900">إشعارات SMS</p>
                                        <p className="text-sm text-gray-600">استقبال الإشعارات عبر الرسائل النصية</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.smsNotifications}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                smsNotifications: e.target.checked
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                    <div>
                                        <p className="font-medium text-gray-900">تحديثات الإصلاح</p>
                                        <p className="text-sm text-gray-600">إشعارات عند تغيير حالة الإصلاح</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.repairUpdates}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                repairUpdates: e.target.checked
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                    <div>
                                        <p className="font-medium text-gray-900">تذكير الفواتير</p>
                                        <p className="text-sm text-gray-600">إشعارات عند اقتراب موعد السداد</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.invoiceReminders}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                invoiceReminders: e.target.checked
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleSaveNotifications}
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all mt-4"
                                    style={{ background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)' }}
                                >
                                    <Save className="w-4 h-4" />
                                    حفظ الإعدادات
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">التفضيلات العامة</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        اللغة
                                    </label>
                                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="ar">العربية</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div className="pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                                        <Trash2 className="w-5 h-5" />
                                        منطقة الخطر
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        حذف الحساب سيؤدي إلى فقدان جميع بياناتك بشكل نهائي
                                    </p>
                                    <button
                                        onClick={() => {
                                            const confirm = window.confirm('هل أنت متأكد من رغبتك في حذف حسابك؟');
                                            if (confirm) {
                                                notifications.info('تنبيه', { message: 'يرجى التواصل مع الإدارة لحذف الحساب' });
                                            }
                                        }}
                                        className="px-6 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                                    >
                                        حذف الحساب
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
