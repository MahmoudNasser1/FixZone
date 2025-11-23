import React, { useState } from 'react';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
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
    Briefcase
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
        <div className="min-h-screen bg-gray-50">
            <TechnicianHeader user={user} notificationCount={3} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end gap-6">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                                    <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                                        {user?.name?.charAt(0) || 'T'}
                                    </div>
                                </div>
                                <div className="mb-1">
                                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {user?.name}
                                        <Shield className="w-5 h-5 text-blue-500" fill="currentColor" />
                                    </h1>
                                    <p className="text-gray-600">{technicianData.specialization}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                                <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                                <span className="font-bold text-gray-900">{technicianData.rating}</span>
                                <span className="text-sm text-gray-500">/ 5.0</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">الخبرة</p>
                                    <p className="font-medium text-gray-900">{technicianData.experience}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">مهام مكتملة</p>
                                    <p className="font-medium text-gray-900">{technicianData.completedJobs}+</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">الشيفت</p>
                                    <p className="font-medium text-gray-900">{technicianData.shift}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Contact Info */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
                        <h3 className="font-bold text-gray-900 mb-4">معلومات الاتصال</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">+20 123 456 7890</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">القاهرة، المعادي</span>
                            </div>
                        </div>
                    </div>

                    {/* Skills & Certifications */}
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">المهارات والتخصصات</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {technicianData.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <h3 className="font-bold text-gray-900 mb-4">الأداء الشهري</h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">نسبة إنجاز المهام في الوقت المحدد</span>
                                <span className="font-bold text-green-600">94%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '94%' }}></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
