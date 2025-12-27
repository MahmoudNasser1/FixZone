import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import api from '../../services/api';
import { useTheme } from '../../components/ThemeProvider';
import { Settings as SettingsIcon, Lock, Bell, Globe, Trash2, Save, ArrowRight } from 'lucide-react';

/**
 * ⚙️ Technician Settings Page
 */

export default function TechnicianSettingsPage() {
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
        jobUpdates: true,
        urgentAlerts: true,
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

        // TODO: API call for technician password change
        try {
            // Assuming a similar endpoint or generic one
            const response = await api.request('/auth/change-password', {
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
            console.error('Change password error:', apiError);
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
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <TechnicianHeader user={user} notificationCount={5} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/technician/dashboard')}
                        aria-label="العودة إلى لوحة التحكم"
                        className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mb-4"
                    >
                        <ArrowRight className="w-5 h-5" />
                        <span className="font-medium">العودة للرئيسية</span>
                    </button>
                </div>

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
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
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
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <p className="font-medium text-foreground">تحديثات المهام</p>
                                        <p className="text-sm text-muted-foreground">إشعارات عند تعيين مهام جديدة أو تحديثها</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.jobUpdates}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                jobUpdates: e.target.checked
                                            })}
                                            className="sr-only peer"
                                            disabled={!notificationsEnabled}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-border">
                                    <div>
                                        <p className="font-medium text-foreground">تنبيهات عاجلة</p>
                                        <p className="text-sm text-muted-foreground">إشعارات للمهام ذات الأولوية العالية</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.urgentAlerts}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                urgentAlerts: e.target.checked
                                            })}
                                            className="sr-only peer"
                                            disabled={!notificationsEnabled}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
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
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation - Mobile Only */}
            <TechnicianBottomNav />
        </div>
    );
}
