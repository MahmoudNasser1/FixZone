import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTechJobs } from '../../services/technicianService';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import JobCard from '../../components/technician/JobCard';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';

import { CardSkeleton } from '../../components/ui/Skeletons';
import PageTransition from '../../components/ui/PageTransition';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';

/**
 * 📋 Jobs List Page
 * 
 * صفحة عرض جميع المهام للفني مع إمكانيات:
 * - البحث (اسم العميل، رقم الجهاز)
 * - الفلترة (الحالة، الأولوية)
 * - الترتيب (الأحدث، الأقدم، الأولوية)
 */

export default function JobsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [filterStatus, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await getTechJobs({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        sort: sortBy
      });

      if (response.success) {
        setJobs(response.data || []);
      } else {
        throw new Error(response.error || 'فشل تحميل قائمة المهام');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      notifications.error('خطأ', { 
        message: error.message || 'فشل تحميل قائمة المهام. يرجى المحاولة مرة أخرى.',
        duration: 5000
      });
      setJobs([]); // تعيين قائمة فارغة عند الفشل
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering for search (until backend supports it)
  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.customerName?.toLowerCase().includes(query) ||
      job.deviceType?.toLowerCase().includes(query) ||
      job.id?.toString().includes(query)
    );
  });

  const tabs = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'في الانتظار' },
    { id: 'in_progress', label: 'قيد العمل' },
    { id: 'completed', label: 'مكتملة' },
  ];

  return (
    <PageTransition className="min-h-screen bg-background pb-20 md:pb-0">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">قائمة المهام</h1>
            <p className="text-muted-foreground mt-1">إدارة ومتابعة جميع طلبات الإصلاح الموكلة إليك</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>ترتيب</span>
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute left-0 mt-2 w-48 bg-popover rounded-lg shadow-xl border border-border py-2 z-20">
                    <button
                      onClick={() => {
                        setSortBy('date_desc');
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${sortBy === 'date_desc' ? 'bg-muted font-medium' : ''}`}
                    >
                      الأحدث أولاً
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('date_asc');
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${sortBy === 'date_asc' ? 'bg-muted font-medium' : ''}`}
                    >
                      الأقدم أولاً
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('priority');
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${sortBy === 'priority' ? 'bg-muted font-medium' : ''}`}
                    >
                      حسب الأولوية
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
                showFilterPanel
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>فلترة متقدمة</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-lg w-full md:w-auto overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilterStatus(tab.id);
                    setSearchParams({ status: tab.id });
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterStatus === tab.id
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث برقم المهمة، اسم العميل، أو الجهاز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="بحث في المهام"
                className="w-full pr-10 pl-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {showFilterPanel && (
          <div className="mb-6 bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">فلترة متقدمة</h3>
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
                className="text-sm text-primary hover:text-primary/80"
              >
                مسح الكل
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">نوع الجهاز</label>
                <input
                  type="text"
                  placeholder="بحث بنوع الجهاز..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">من تاريخ</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {loading ? (
          <div className="py-12">
            <CardSkeleton count={6} />
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => navigate(`/technician/jobs/${job.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">لا توجد مهام مطابقة</h3>
            <p className="text-muted-foreground mb-4">جرب تغيير الفلاتر أو كلمات البحث</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                  setShowFilterPanel(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                مسح الفلاتر
              </button>
              <button
                onClick={() => navigate('/technician/tasks')}
                className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                إضافة مهمة جديدة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <TechnicianBottomNav />
    </PageTransition>
  );
}
