import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import api from '../services/api';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../components/ui/SimpleCard';
import SimpleButton from '../components/ui/SimpleButton';
import { LogOut, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * 🛠️ صفحة Debug للمطورين
 * Debug/Developer Tools Page
 * 
 * الاستخدام:
 * - تسجيل خروج سريع
 * - مسح الـ session
 * - إعادة تعيين الـ state
 */

export default function DebugPage() {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    const handleQuickLogout = async () => {
        try {
            // حاول تعمل logout من الـ API
            await api.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.log('API logout failed, continuing with local logout');
        }

        // امسح الـ state
        logout();

        // امسح الـ cookies
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // روح على صفحة Login
        navigate('/login');

        // ريفريش الصفحة علشان تتأكد إن كل حاجة اتمسحت
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const handleClearSession = () => {
        // امسح كل الـ cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // امسح localStorage
        localStorage.clear();

        // امسح sessionStorage
        sessionStorage.clear();

        // امسح الـ Zustand store
        logout();

        alert('تم مسح كل الـ Session! هيتم تحديث الصفحة...');

        // ريفريش
        window.location.href = '/login';
    };

    const handleResetAuthStore = () => {
        logout();
        alert('تم إعادة تعيين Auth Store!');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <SimpleCard className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <SimpleCardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8" />
                            <div>
                                <h1 className="text-2xl font-bold">🛠️ صفحة أدوات المطورين</h1>
                                <p className="text-sm opacity-90 mt-1">
                                    أدوات مساعدة للاختبار والتطوير - استخدمها بحذر!
                                </p>
                            </div>
                        </div>
                    </SimpleCardContent>
                </SimpleCard>

                {/* User Info */}
                {user && (
                    <SimpleCard>
                        <SimpleCardHeader>
                            <SimpleCardTitle>معلومات المستخدم الحالي</SimpleCardTitle>
                        </SimpleCardHeader>
                        <SimpleCardContent>
                            <div className="space-y-2 text-sm">
                                <p><strong>الاسم:</strong> {user.name}</p>
                                <p><strong>الإيميل:</strong> {user.email}</p>
                                <p><strong>Role ID:</strong> {user.roleId || user.role}</p>
                                <p><strong>Type:</strong> {user.type || 'N/A'}</p>
                                {user.customerId && <p><strong>Customer ID:</strong> {user.customerId}</p>}
                                {user.technicianId && <p><strong>Technician ID:</strong> {user.technicianId}</p>}
                            </div>
                        </SimpleCardContent>
                    </SimpleCard>
                )}

                {/* Quick Actions */}
                <SimpleCard>
                    <SimpleCardHeader>
                        <SimpleCardTitle>إجراءات سريعة</SimpleCardTitle>
                    </SimpleCardHeader>
                    <SimpleCardContent className="space-y-4">
                        {/* Quick Logout */}
                        <div className="border-b pb-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <LogOut className="w-5 h-5 text-blue-600" />
                                تسجيل خروج سريع
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                تسجيل خروج سريع ومسح الـ session والتوجيه لصفحة Login
                            </p>
                            <SimpleButton
                                onClick={handleQuickLogout}
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                تسجيل خروج الآن
                            </SimpleButton>
                        </div>

                        {/* Clear Session */}
                        <div className="border-b pb-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-600" />
                                مسح كل الـ Session
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                مسح كل الـ cookies و localStorage و sessionStorage (Nuclear Option!)
                            </p>
                            <SimpleButton
                                onClick={handleClearSession}
                                variant="destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                مسح كل حاجة
                            </SimpleButton>
                        </div>

                        {/* Reset Store */}
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-orange-600" />
                                إعادة تعيين Auth Store
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                إعادة تعيين الـ Zustand Auth Store فقط (مش هيمسح الـ cookies)
                            </p>
                            <SimpleButton
                                onClick={handleResetAuthStore}
                                variant="outline"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                إعادة تعيين Store
                            </SimpleButton>
                        </div>
                    </SimpleCardContent>
                </SimpleCard>

                {/* Console Commands */}
                <SimpleCard>
                    <SimpleCardHeader>
                        <SimpleCardTitle>أوامر Console</SimpleCardTitle>
                    </SimpleCardHeader>
                    <SimpleCardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            افتح Console (F12) واكتب أي من الأوامر دي:
                        </p>
                        <div className="space-y-3 font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg">
                            <div>
                                <p className="text-gray-400 mb-1">// تسجيل خروج سريع والتوجيه لـ Login</p>
                                <p>window.location.href = '/debug'</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">// مسح كل الـ cookies</p>
                                <p>document.cookie.split(";").forEach(c =&gt; document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">// مسح localStorage</p>
                                <p>localStorage.clear();</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">// روح على Login مباشرة</p>
                                <p>window.location.href = '/login'</p>
                            </div>
                        </div>
                    </SimpleCardContent>
                </SimpleCard>

                {/* Test Accounts */}
                <SimpleCard>
                    <SimpleCardHeader>
                        <SimpleCardTitle>حسابات الاختبار</SimpleCardTitle>
                    </SimpleCardHeader>
                    <SimpleCardContent>
                        <div className="space-y-4">
                            <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                                <p className="font-semibold text-red-900">👨‍💼 Admin</p>
                                <p className="text-sm text-red-800 mt-1">admin@fixzone.com / admin123</p>
                            </div>
                            <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                                <p className="font-semibold text-blue-900">👤 Customer</p>
                                <p className="text-sm text-blue-800 mt-1">customer@test.com / user1234</p>
                            </div>
                            <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
                                <p className="font-semibold text-green-900">🔧 Technician</p>
                                <p className="text-sm text-green-800 mt-1">tech1@fixzone.com / tech1234</p>
                            </div>
                        </div>
                    </SimpleCardContent>
                </SimpleCard>

                {/* Back Button */}
                <div className="text-center">
                    <SimpleButton
                        onClick={() => navigate('/')}
                        variant="outline"
                    >
                        رجوع للصفحة الرئيسية
                    </SimpleButton>
                </div>
            </div>
        </div>
    );
}
