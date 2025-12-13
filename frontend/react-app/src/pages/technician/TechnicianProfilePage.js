import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import PageTransition from '../../components/ui/PageTransition';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import {
  getTechnicianById,
  getTechnicianStats,
  getTechnicianPerformance,
  getTechnicianSkills
} from '../../services/technicianService';
import { getTechDashboard } from '../../services/technicianService';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Award,
    Clock,
    Star,
    Shield,
    Briefcase,
    ArrowRight,
    TrendingUp,
    CheckCircle,
    Wrench,
    Target,
    Calendar,
    Timer,
    RefreshCw,
    Edit,
    Settings,
    Trophy,
    Zap
} from 'lucide-react';

/**
 * 👨‍🔧 Technician Profile Page - Enhanced with Real Data
 * 
 * صفحة الملف الشخصي للفني مع بيانات حقيقية من API
 * المميزات:
 * - البيانات الشخصية من API
 * - المهارات من API
 * - إحصائيات الأداء الحقيقية
 * - الإنجازات
 */

export default function TechnicianProfilePage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [loading, setLoading] = useState(true);
    const [technicianData, setTechnicianData] = useState(null);
    const [stats, setStats] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [skills, setSkills] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        loadProfileData();
    }, [user?.id]);

    const loadProfileData = async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            // جلب بيانات الفني
            const [techRes, statsRes, perfRes, skillsRes, dashRes] = await Promise.allSettled([
                getTechnicianById(user.id),
                getTechnicianStats(user.id),
                getTechnicianPerformance(user.id, { period: 'month' }),
                getTechnicianSkills(user.id),
                getTechDashboard()
            ]);

            if (techRes.status === 'fulfilled' && techRes.value?.success) {
                setTechnicianData(techRes.value.data);
            }

            if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
                setStats(statsRes.value.data);
            }

            if (perfRes.status === 'fulfilled' && perfRes.value?.success) {
                setPerformance(perfRes.value.data);
            }

            if (skillsRes.status === 'fulfilled' && skillsRes.value?.success) {
                setSkills(skillsRes.value.data || []);
            }

            if (dashRes.status === 'fulfilled' && dashRes.value?.success) {
                setDashboardData(dashRes.value.data);
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
            notifications.error('خطأ', { message: 'فشل تحميل بيانات الملف الشخصي' });
        } finally {
            setLoading(false);
        }
    };

    // حساب الإحصائيات
    const getCompletedCount = () => {
        if (stats?.completedRepairs) return stats.completedRepairs;
        if (dashboardData?.byStatus) {
            const completed = dashboardData.byStatus.find(s => s.status === 'completed');
            return completed?.count || 0;
        }
        return 0;
    };

    const getInProgressCount = () => {
        if (dashboardData?.byStatus) {
            const inProgress = dashboardData.byStatus.find(s => s.status === 'in_progress');
            return inProgress?.count || 0;
        }
        return 0;
    };

    const getRating = () => {
        if (performance?.averageRating) return performance.averageRating;
        if (stats?.averageRating) return stats.averageRating;
        return 4.5; // Default
    };

    const getOnTimeRate = () => {
        if (performance?.onTimeRate) return performance.onTimeRate;
        if (stats?.onTimeRate) return stats.onTimeRate;
        return 0;
    };

    const getTotalWorkHours = () => {
        if (dashboardData?.dailyTime) {
            return `${dashboardData.dailyTime.hours || 0}:${(dashboardData.dailyTime.minutes || 0).toString().padStart(2, '0')}`;
        }
        return '0:00';
    };

    // Achievements based on stats
    const getAchievements = () => {
        const achievements = [];
        const completed = getCompletedCount();
        
        if (completed >= 10) achievements.push({ icon: Trophy, label: 'فني نشط', color: 'text-amber-500' });
        if (completed >= 50) achievements.push({ icon: Zap, label: 'فني ماهر', color: 'text-blue-500' });
        if (completed >= 100) achievements.push({ icon: Star, label: 'فني محترف', color: 'text-violet-500' });
        if (getOnTimeRate() >= 90) achievements.push({ icon: Target, label: 'دقيق في المواعيد', color: 'text-emerald-500' });
        if (getRating() >= 4.5) achievements.push({ icon: Award, label: 'تقييم ممتاز', color: 'text-yellow-500' });
        
        return achievements;
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20">
                <TechnicianHeader user={user} notificationCount={3} />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                        </div>
                        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    const achievements = getAchievements();
    const rating = getRating();
    const completedCount = getCompletedCount();
    const onTimeRate = getOnTimeRate();

    return (
        <PageTransition className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 pb-24 md:pb-8">
            <TechnicianHeader user={user} notificationCount={3} />

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/technician/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <ArrowRight className="w-5 h-5" />
                        <span className="font-medium">العودة</span>
                    </button>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800 overflow-hidden mb-6">
                    {/* Banner */}
                    <div className="h-32 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 relative">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/2" />
                        </div>
                        
                        {/* Edit Button */}
                        <button
                            onClick={() => navigate('/technician/settings')}
                            className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="px-6 pb-6 -mt-16 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            {/* Avatar */}
                            <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-900">
                                <span className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                                    {user?.name?.charAt(0) || 'T'}
                                </span>
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {user?.name || 'فني'}
                                    </h1>
                                    <Shield className="w-5 h-5 text-teal-500" fill="currentColor" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400">
                                    {technicianData?.specialization || 'فني صيانة'}
                                </p>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
                                <Star className="w-6 h-6 text-amber-500" fill="currentColor" />
                                <span className="text-xl font-bold text-slate-900 dark:text-white">{rating.toFixed(1)}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">/ 5</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">مهمة مكتملة</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{getInProgressCount()}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">قيد العمل</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                <Timer className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{getTotalWorkHours()}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">ساعات اليوم</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">معلومات الاتصال</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400" dir="ltr">
                                    {technicianData?.phone || user?.phone || 'غير مسجل'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {technicianData?.address || 'غير مسجل'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {technicianData?.shift || '09:00 ص - 05:00 م'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Skills & Performance */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Skills */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">المهارات والتخصصات</h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.length > 0 ? (
                                    skills.map((skill, index) => (
                                        <span
                                            key={skill.id || index}
                                            className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg text-sm font-medium"
                                        >
                                            {skill.name || skill.skillName || skill}
                                        </span>
                                    ))
                                ) : (
                                    // Default skills if none found
                                    ['إصلاح الأجهزة', 'صيانة الهواتف', 'استبدال الشاشات', 'فحص الأعطال'].map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Performance */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">الأداء الشهري</h3>
                            
                            {/* On-time Rate */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">نسبة الإنجاز في الوقت</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{onTimeRate}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(onTimeRate, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Customer Satisfaction */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">رضا العملاء</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{(rating / 5 * 100).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(rating / 5 * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Achievements */}
                        {achievements.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">الإنجازات</h3>
                                <div className="flex flex-wrap gap-3">
                                    {achievements.map((achievement, index) => {
                                        const AchIcon = achievement.icon;
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                            >
                                                <AchIcon className={`w-5 h-5 ${achievement.color}`} />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {achievement.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Refresh Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={loadProfileData}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        تحديث البيانات
                    </button>
                </div>
            </div>

            {/* Bottom Navigation - Mobile Only */}
            <TechnicianBottomNav />
        </PageTransition>
    );
}
