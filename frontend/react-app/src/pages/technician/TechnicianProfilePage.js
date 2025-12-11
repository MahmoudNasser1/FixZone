import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import useAuthStore from '../../stores/authStore';
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
    ArrowRight
} from 'lucide-react';

/**
 * 👨‍🔧 Technician Profile Page
 * 
 * صفحة الملف الشخصي للفني.
 * تعرض:
 * - البيانات الشخصية
 * - المهارات (Skills)
 * - التقييم (Rating)
 * - إحصائيات الأداء
 */

export default function TechnicianProfilePage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    // Mock Data
    const technicianData = {
        ...user,
        specialization: 'Hardware Expert (Apple & Samsung)',
        experience: '5 Years',
        rating: 4.8,
        completedJobs: 1250,
        skills: ['Micro-soldering', 'Screen Replacement', 'Battery Diagnostics', 'Water Damage Repair'],
        shift: '09:00 AM - 05:00 PM'
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <TechnicianHeader user={user} notificationCount={3} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/technician/dashboard')}
                        aria-label="العودة إلى لوحة التحكم"
                        className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <ArrowRight className="w-5 h-5" />
                        <span className="font-medium">العودة للرئيسية</span>
                    </button>
                </div>

                {/* Profile Header Card */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden mb-6">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end gap-6">
                                <div className="w-24 h-24 rounded-2xl bg-card p-1 shadow-lg">
                                    <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center text-3xl font-bold text-primary">
                                        {user?.name?.charAt(0) || 'T'}
                                    </div>
                                </div>
                                <div className="mb-1">
                                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        {user?.name}
                                        <Shield className="w-5 h-5 text-blue-500" fill="currentColor" />
                                    </h1>
                                    <p className="text-muted-foreground">{technicianData.specialization}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                                <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                                <span className="font-bold text-foreground">{technicianData.rating}</span>
                                <span className="text-sm text-muted-foreground">/ 5.0</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">الخبرة</p>
                                    <p className="font-medium text-foreground">{technicianData.experience}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">مهام مكتملة</p>
                                    <p className="font-medium text-foreground">{technicianData.completedJobs}+</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">الشيفت</p>
                                    <p className="font-medium text-foreground">{technicianData.shift}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Contact Info */}
                    <div className="md:col-span-1 bg-card rounded-xl shadow-sm border border-border p-6 h-fit">
                        <h3 className="font-bold text-foreground mb-4">معلومات الاتصال</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">+20 123 456 7890</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">القاهرة، المعادي</span>
                            </div>
                        </div>
                    </div>

                    {/* Skills & Certifications */}
                    <div className="md:col-span-2 bg-card rounded-xl shadow-sm border border-border p-6">
                        <h3 className="font-bold text-foreground mb-4">المهارات والتخصصات</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {technicianData.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <h3 className="font-bold text-foreground mb-4">الأداء الشهري</h3>
                        <div className="bg-muted/50 rounded-xl p-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">نسبة إنجاز المهام في الوقت المحدد</span>
                                <span className="font-bold text-green-600">94%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '94%' }}></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Navigation - Mobile Only */}
            <TechnicianBottomNav />
        </div>
    );
}
