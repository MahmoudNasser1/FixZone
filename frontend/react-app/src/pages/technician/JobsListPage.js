import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTechJobs } from '../../services/technicianService';
import { JobCard, statusMap } from '../../components/technician';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import {
  Search,
  Filter,
  X,
  ArrowRight,
  Package,
  RefreshCw
} from 'lucide-react';

/**
 * JobsListPage
 * صفحة قائمة الأجهزة مع Filters و Search
 */

// Status filter options
const statusFilters = [
  { value: '', label: 'الكل', count: 0 },
  { value: 'PENDING', label: 'قيد الانتظار', count: 0 },
  { value: 'UNDER_DIAGNOSIS', label: 'جاري الفحص', count: 0 },
  { value: 'UNDER_REPAIR', label: 'قيد الإصلاح', count: 0 },
  { value: 'WAITING_PARTS', label: 'بانتظار قطع غيار', count: 0 },
  { value: 'WAITING_CUSTOMER', label: 'بانتظار العميل', count: 0 },
  { value: 'READY', label: 'جاهز للتسليم', count: 0 },
  { value: 'COMPLETED', label: 'مكتمل', count: 0 },
];

export default function JobsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  
  // Filters state
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // التحقق من أن المستخدم فني
    const roleId = user?.roleId || user?.role;
    const isTechnician = user && (roleId === 3 || roleId === '3');

    if (!user || !isTechnician) {
      notifications.error('خطأ', { message: 'يجب تسجيل الدخول كفني للوصول لهذه الصفحة' });
      navigate('/login');
      return;
    }

    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // تطبيق الفلاتر عند تغيير selectedStatus أو searchTerm
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, searchTerm, jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await getTechJobs();
      
      if (response.success) {
        setJobs(response.data || []);
      } else {
        notifications.error('خطأ', { message: 'فشل تحميل الأجهزة' });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      notifications.error('خطأ', { message: 'فشل تحميل الأجهزة' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => {
        return (
          (job.customerName && job.customerName.toLowerCase().includes(term)) ||
          (job.deviceBrand && job.deviceBrand.toLowerCase().includes(term)) ||
          (job.deviceModel && job.deviceModel.toLowerCase().includes(term)) ||
          (job.requestNumber && job.requestNumber.toString().includes(term)) ||
          (job.reportedProblem && job.reportedProblem.toLowerCase().includes(term))
        );
      });
    }

    setFilteredJobs(filtered);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setSearchTerm('');
    setSearchParams({});
  };

  const handleRefresh = () => {
    loadJobs();
  };

  // Count jobs by status
  const getStatusCount = (status) => {
    if (!status) return jobs.length;
    return jobs.filter(job => job.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tech/dashboard')}
              >
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
              <div>
                <h1 className="text-xl font-bold text-gray-900">قائمة الأجهزة</h1>
                <p className="text-sm text-gray-600">
                  {filteredJobs.length} من {jobs.length} جهاز
                </p>
              </div>
            </div>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </SimpleButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <SimpleCard className="mb-6">
          <SimpleCardContent className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="ابحث عن جهاز، عميل، موديل..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pr-10"
                  />
                </div>
                <SimpleButton
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  فلتر
                </SimpleButton>
                {(selectedStatus || searchTerm) && (
                  <SimpleButton
                    variant="ghost"
                    onClick={clearFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    مسح
                  </SimpleButton>
                )}
              </div>

              {/* Status Filters */}
              {showFilters && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">الحالة:</p>
                  <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                      <SimpleButton
                        key={filter.value}
                        variant={selectedStatus === filter.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusFilter(filter.value)}
                      >
                        {filter.label}
                        <span className="mr-2 text-xs opacity-70">
                          ({getStatusCount(filter.value)})
                        </span>
                      </SimpleButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <SimpleCard>
            <SimpleCardContent className="py-12">
              <div className="text-center text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">
                  {searchTerm || selectedStatus ? 'لا توجد نتائج' : 'لا توجد أجهزة'}
                </p>
                <p className="text-sm mt-2">
                  {searchTerm || selectedStatus 
                    ? 'جرب تغيير معايير البحث'
                    : 'سيظهر هنا الأجهزة المسلمة لك'}
                </p>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


