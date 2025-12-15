import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { useTheme } from '../../components/ThemeProvider';
import { Settings as SettingsIcon, Lock, Bell, Globe, Trash2, Save } from 'lucide-react';

/**
 * ⚙️ Customer Settings Page
 */

export default function CustomerSettingsPage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);
    const markPasswordResetComplete = useAuthStore((state) => state.markPasswordResetComplete);

    const [activeTab, setActiveTab] = useState('security');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        repairUpdates: true,
        invoiceReminders: true,
        promotions: false
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const { theme, setTheme } = useTheme();
    const [nightMode, setNightMode] = useState(theme === 'dark');

    useEffect(() => {
        setNightMode(theme === 'dark');
    }, [theme]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            notifications.error('خطأ', { message: 'كلمات المرور غير متطابقة' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            notifications.error('خطأ', { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
            return;
        }

        setPasswordLoading(true);

        // TODO: API call
        try {
            const response = await api.request('/auth/customer/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (response.success) {
                notifications.success('نجاح', { message: 'تم تغيير كلمة المرور بنجاح' });
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                markPasswordResetComplete();
            } else {
                throw new Error(response.message || 'فشل تغيير كلمة المرور');
            }
        } catch (apiError) {
            console.error('Change customer password error:', apiError);
            notifications.error('خطأ', { message: apiError.message || 'خطأ في تغيير كلمة المرور' });
        } finally {
            setPasswordLoading(false);
        }
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
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-500 to-gray-600"
                        >
                            <SettingsIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
                            <p className="text-sm text-muted-foreground">إدارة إعدادات الحساب والتفضيلات</p>
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
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-brand-blue to-brand-blue-light text-white border border-brand-blue'
                                        : 'bg-card text-foreground border border-border hover:bg-muted'
                                    }`}
                            >
                                <TabIcon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="bg-card rounded-xl shadow-md p-6 border border-border">
                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">تغيير كلمة المرور</h2>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        كلمة المرور الحالية
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        كلمة المرور الجديدة
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        تأكيد كلمة المرور الجديدة
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-brand-blue to-brand-blue-light hover:-translate-y-0.5"
                                >
                                    <Save className="w-4 h-4" />
                                    {passwordLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                                <p className="text-xs text-muted-foreground mt-3">
                                    في حالة نسيان كلمة المرور، يرجى التواصل مع مركز Fix Zone مباشرةً ولا يتم إعادة التعيين تلقائياً.
                                </p>
                            </form>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">إعدادات الإشعارات</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <p className="font-medium text-foreground">إشعارات البريد الإلكتروني</p>
                                        <p className="text-sm text-muted-foreground">استقبال الإشعارات عبر البريد</p>
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
                                            disabled={!notificationsEnabled}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <p className="font-medium text-foreground">إشعارات SMS</p>
                                        <p className="text-sm text-muted-foreground">استقبال الإشعارات عبر الرسائل النصية</p>
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
                                            disabled={!notificationsEnabled}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <p className="font-medium text-foreground">تحديثات الإصلاح</p>
                                        <p className="text-sm text-muted-foreground">إشعارات عند تغيير حالة الإصلاح</p>
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
                                            disabled={!notificationsEnabled}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <p className="font-medium text-foreground">تذكير الفواتير</p>
                                        <p className="text-sm text-muted-foreground">إشعارات عند اقتراب موعد السداد</p>
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
                                            disabled={!notificationsEnabled}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleSaveNotifications}
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all mt-4 bg-gradient-to-r from-brand-blue to-brand-blue-light hover:-translate-y-0.5"
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
                            <h2 className="text-xl font-bold text-foreground mb-4">التفضيلات العامة</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">الوضع الليلي</p>
                                        <p className="text-sm text-muted-foreground">فعّل الثيم الداكن في الواجهة</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={nightMode}
                                            onChange={() => setTheme(nightMode ? 'light' : 'dark')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">الإشعارات</p>
                                        <p className="text-sm text-muted-foreground">أوقف أو شغّل كل الإشعارات دفعة واحدة</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationsEnabled}
                                            onChange={() => setNotificationsEnabled(prev => !prev)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        اللغة
                                    </label>
                                    <select className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all">
                                        <option value="ar">العربية</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <h3 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
                                        <Trash2 className="w-5 h-5" />
                                        منطقة الخطر
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
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
