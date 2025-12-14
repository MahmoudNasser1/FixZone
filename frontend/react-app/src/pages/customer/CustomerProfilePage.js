import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import { User, Mail, Phone, MapPin, Save, X } from 'lucide-react';

/**
 * 👤 Customer Profile Page
 */

export default function CustomerProfilePage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!user || !isCustomer) {
            notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
            navigate('/login');
            return;
        }

        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await api.request('/auth/customer/profile');

            if (response.success && response.data) {
                setProfile(response.data);
                setFormData({
                    name: response.data.name || '',
                    email: response.data.email || '',
                    phone: response.data.phone || '',
                    address: response.data.address || ''
                });
            } else {
                // Fallback to user data
                setProfile({
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                });
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            notifications.error('خطأ', { message: 'فشل تحميل البيانات الشخصية' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.phone) {
            notifications.error('خطأ', { message: 'يرجى ملء جميع الحقول المطلوبة' });
            return;
        }

        try {
            setSaving(true);
            const response = await api.request('/customer/profile', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (response.success) {
                notifications.success('نجاح', { message: 'تم تحديث البيانات بنجاح' });
                setProfile(response.data);
                setEditing(false);
            } else {
                notifications.error('خطأ', { message: response.message || 'فشل تحديث البيانات' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            notifications.error('خطأ', { message: 'حدث خطأ أثناء تحديث البيانات' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: profile?.name || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
            address: profile?.address || ''
        });
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Page Title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground mb-2">الملف الشخصي</h1>
                    <p className="text-sm text-muted-foreground">إدارة معلوماتك الشخصية</p>
                </div>

                {/* Profile Card */}
                <div className="bg-card rounded-xl shadow-md overflow-hidden">
                    {/* Header with Avatar */}
                    <div
                        className="p-6 bg-gradient-to-r from-brand-blue to-brand-blue-light"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-white">
                                <h2 className="text-2xl font-bold">{profile?.name || 'عميل'}</h2>
                                <p className="text-sm opacity-90">{profile?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Name */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    الاسم الكامل <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!editing}
                                required
                                className="w-full px-4 py-3 rounded-lg border-2 border-input focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue disabled:bg-muted disabled:cursor-not-allowed transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    البريد الإلكتروني <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!editing}
                                required
                                className="w-full px-4 py-3 rounded-lg border-2 border-input focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue disabled:bg-muted disabled:cursor-not-allowed transition-all"
                            />
                        </div>

                        {/* Phone */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    رقم الهاتف <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!editing}
                                required
                                className="w-full px-4 py-3 rounded-lg border-2 border-input focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue disabled:bg-muted disabled:cursor-not-allowed transition-all"
                            />
                        </div>

                        {/* Address */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    العنوان
                                </div>
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={!editing}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border-2 border-input focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue disabled:bg-muted disabled:cursor-not-allowed transition-all resize-none"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {!editing ? (
                                <button
                                    type="button"
                                    onClick={() => setEditing(true)}
                                    className="px-6 py-3 rounded-lg font-medium text-white transition-all bg-gradient-to-r from-brand-blue to-brand-blue-light hover:-translate-y-0.5"
                                >
                                    تعديل البيانات
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50 bg-gradient-to-r from-brand-green to-emerald-600 hover:-translate-y-0.5"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-muted text-foreground transition-all disabled:opacity-50 hover:bg-muted/80"
                                    >
                                        <X className="w-4 h-4" />
                                        إلغاء
                                    </button>
                                </>
                            )}
                        </div>
                    </form>

                    {/* Stats */}
                    {profile?.totalRepairs !== undefined && (
                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                            <h3 className="font-semibold text-gray-900 mb-3">الإحصائيات</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">إجمالي الإصلاحات</p>
                                    <p className="text-2xl font-bold text-brand-blue">
                                        {profile.totalRepairs || 0}
                                    </p>
                                </div>
                                {profile.totalSpent !== undefined && (
                                    <div>
                                        <p className="text-sm text-gray-600">إجمالي المصروفات</p>
                                        <p className="text-2xl font-bold text-brand-green">
                                            {profile.totalSpent?.toFixed(2) || '0.00'} جنيه
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
