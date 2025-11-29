import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../stores/authStore';
import { ROLE_CUSTOMER } from '../../constants/roles';
import CustomerHeader from '../../components/customer/CustomerHeader';
import { Package, Smartphone, Laptop, Tablet, Watch, PackageOpen } from 'lucide-react';

/**
 * 📱 Customer Devices Page
 */

export default function CustomerDevicesPage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || numericRoleId === ROLE_CUSTOMER);

        if (!user || !isCustomer) {
            notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
            navigate('/login');
            return;
        }

        loadDevices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const response = await api.getCustomerDevices();

            const devicesData = response.success
                ? (response.data?.devices || response.data || [])
                : (Array.isArray(response) ? response : []);

            setDevices(devicesData);

        } catch (error) {
            console.error('Error loading devices:', error);
            notifications.error('خطأ', { message: 'فشل تحميل الأجهزة' });
        } finally {
            setLoading(false);
        }
    };

    const getDeviceIcon = (deviceType) => {
        const type = deviceType?.toLowerCase() || '';
        if (type.includes('iphone') || type.includes('phone')) return Smartphone;
        if (type.includes('ipad') || type.includes('tablet')) return Tablet;
        if (type.includes('macbook') || type.includes('laptop')) return Laptop;
        if (type.includes('watch')) return Watch;
        return Package;
    };

    const getStatusColor = (status) => {
        const statusMap = {
            in_repair: 'text-warning',
            completed: 'text-success',
            pending: 'text-info'
        };
        return statusMap[status] || 'text-muted-foreground';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <CustomerHeader user={user} notificationCount={3} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-purple to-purple-600"
                        >
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">أجهزتي</h1>
                            <p className="text-sm text-muted-foreground">عرض جميع الأجهزة المسجلة وسجل الإصلاحات</p>
                        </div>
                    </div>
                </div>

                {/* Devices Grid */}
                {devices.length === 0 ? (
                    <div className="text-center py-16">
                        <div
                            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted"
                        >
                            <PackageOpen className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد أجهزة مسجلة</h3>
                        <p className="text-muted-foreground">لم تقم بإضافة أي أجهزة بعد</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {devices.map((device) => {
                            const DeviceIcon = getDeviceIcon(device.deviceType);
                            const statusColor = getStatusColor(device.status);

                            return (
                                <div
                                    key={device.id}
                                    className="bg-card rounded-xl shadow-md p-6 transition-all duration-300 cursor-pointer border border-border hover:-translate-y-1 hover:shadow-xl hover:border-brand-purple"
                                    onClick={() => navigate(`/customer/devices/${device.id}`)}
                                >
                                    {/* Icon */}
                                    <div
                                        className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-brand-purple to-purple-600"
                                    >
                                        <DeviceIcon className="w-8 h-8 text-white" />
                                    </div>

                                    {/* Device Info */}
                                    <div className="text-center mb-4">
                                        <h3 className="font-bold text-gray-900 mb-1">{device.deviceType}</h3>
                                        <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
                                        {device.serialNumber && (
                                            <p className="text-xs text-gray-500 mt-1">S/N: {device.serialNumber}</p>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">عدد الإصلاحات</p>
                                            <p className="text-lg font-bold text-brand-purple">
                                                {device.totalRepairs || 0}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">الحالة</p>
                                            <p
                                                className={`text-sm font-semibold ${statusColor}`}
                                            >
                                                {device.status === 'in_repair' ? 'قيد الإصلاح' :
                                                    device.status === 'completed' ? 'مكتمل' : 'معلق'}
                                            </p>
                                        </div>
                                    </div>

                                    {device.lastRepairDate && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                                            <p className="text-xs text-gray-500">
                                                آخر إصلاح: {new Date(device.lastRepairDate).toLocaleDateString('ar-EG')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
