import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, User, Users, TrendingUp, Clock, Eye, Edit, Trash2, 
  Search, Filter, CheckCircle, XCircle, Activity, Calendar,
  MoreVertical, UserCheck, UserX, Award, Wrench
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import PageTransition from '../../components/ui/PageTransition';
import { Input } from '../../components/ui/Input';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import TechnicianReportExport from '../../components/technicians/TechnicianReportExport';
import TechnicianFilters from '../../components/technicians/TechnicianFilters';

const TechniciansPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [technicians, setTechnicians] = useState([]);
  const [techniciansData, setTechniciansData] = useState({}); // Store skills and repairs count
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    // Load skills and active repairs for each technician
    if (technicians.length > 0) {
      loadTechniciansData();
    }
  }, [technicians]);

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const response = await technicianService.getAllTechnicians();
      
      if (response.success && response.data) {
        const techs = Array.isArray(response.data) ? response.data : [];
        setTechnicians(techs);
        
        // Calculate stats
        setStats({
          total: techs.length,
          active: techs.filter(t => t.isActive).length,
          inactive: techs.filter(t => !t.isActive).length
        });
      } else {
        // Handle case where response is array directly
        const techs = Array.isArray(response) ? response : [];
        setTechnicians(techs);
        setStats({
          total: techs.length,
          active: techs.filter(t => t.isActive).length,
          inactive: techs.filter(t => !t.isActive).length
        });
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
      notifications.error('خطأ في تحميل الفنيين', { message: error.message || 'حدث خطأ غير متوقع' });
    } finally {
      setLoading(false);
    }
  };

  const loadTechniciansData = async () => {
    const data = {};
    for (const tech of technicians) {
      try {
        const [skillsRes, repairsRes] = await Promise.all([
          technicianService.getTechnicianSkills(tech.id).catch(() => ({ success: false, data: [] })),
          technicianService.getActiveRepairs(tech.id).catch(() => ({ success: false, data: [] }))
        ]);
        
        data[tech.id] = {
          skillsCount: skillsRes.success && skillsRes.data ? skillsRes.data.length : 0,
          activeRepairsCount: repairsRes.success && repairsRes.data ? repairsRes.data.length : 0
        };
      } catch (error) {
        console.error(`Error loading data for technician ${tech.id}:`, error);
        data[tech.id] = { skillsCount: 0, activeRepairsCount: 0 };
      }
    }
    setTechniciansData(data);
  };

  const handleDelete = async (technician) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفني "${technician.name}"؟`)) {
      return;
    }

    try {
      const response = await technicianService.deleteTechnician(technician.id);
      if (response.success) {
        notifications.success('تم حذف الفني بنجاح');
        loadTechnicians();
      } else {
        throw new Error(response.error || 'فشل في حذف الفني');
      }
    } catch (error) {
      console.error('Error deleting technician:', error);
      notifications.error('فشل في حذف الفني', { message: error.message || 'حدث خطأ غير متوقع' });
    }
  };

  const handleToggleStatus = async (technician) => {
    try {
      const newStatus = !technician.isActive;
      const response = await technicianService.updateTechnician(technician.id, {
        isActive: newStatus
      });
      
      if (response.success) {
        notifications.success(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} الفني بنجاح`);
        loadTechnicians();
      } else {
        throw new Error(response.error || 'فشل في تحديث الحالة');
      }
    } catch (error) {
      console.error('Error toggling technician status:', error);
      notifications.error('فشل في تحديث حالة الفني', { message: error.message || 'حدث خطأ غير متوقع' });
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedTechnicians.length === 0) {
      notifications.warning('يرجى اختيار فنيين أولاً');
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`هل أنت متأكد من حذف ${selectedTechnicians.length} فني؟`)) {
        return;
      }
    }

    try {
      const promises = selectedTechnicians.map(id => {
        if (action === 'delete') {
          return technicianService.deleteTechnician(id);
        } else if (action === 'activate') {
          return technicianService.updateTechnician(id, { isActive: true });
        } else if (action === 'deactivate') {
          return technicianService.updateTechnician(id, { isActive: false });
        }
      });

      await Promise.all(promises);
      notifications.success(`تم ${action === 'delete' ? 'حذف' : action === 'activate' ? 'تفعيل' : 'تعطيل'} الفنيين بنجاح`);
      setSelectedTechnicians([]);
      loadTechnicians();
    } catch (error) {
      console.error('Error in bulk action:', error);
      notifications.error('فشل في تنفيذ العملية', { message: error.message || 'حدث خطأ غير متوقع' });
    }
  };

  const handleSelectTechnician = (id) => {
    setSelectedTechnicians(prev => 
      prev.includes(id) 
        ? prev.filter(techId => techId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTechnicians.length === filteredTechnicians.length) {
      setSelectedTechnicians([]);
    } else {
      setSelectedTechnicians(filteredTechnicians.map(t => t.id));
    }
  };

  // Filter technicians
  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = !searchTerm || 
      (tech.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tech.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tech.phone || '').includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && tech.isActive) ||
      (statusFilter === 'inactive' && !tech.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">جاري التحميل...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">إدارة الفنيين</h1>
              <p className="text-muted-foreground mt-1">إدارة الفنيين والمهارات والأداء</p>
            </div>
            <SimpleButton
              onClick={() => navigate('/technicians/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              فني جديد
            </SimpleButton>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SimpleCard>
              <SimpleCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الفنيين</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">فنيين نشطين</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">فنيين معطلين</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                  </div>
                  <UserX className="w-8 h-8 text-red-600" />
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Export Report */}
          <div className="mb-6">
            <TechnicianReportExport reportType="all" />
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <TechnicianFilters
              onFilterChange={(filters) => {
                setStatusFilter(filters.status);
                // يمكن إضافة المزيد من الفلاتر هنا
              }}
              onSearch={(term) => setSearchTerm(term)}
            />
          </div>

          {/* Bulk Actions */}
          {selectedTechnicians.length > 0 && (
            <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
              <span className="text-sm text-foreground">
                تم اختيار {selectedTechnicians.length} فني
              </span>
              <div className="flex gap-2">
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                >
                  تفعيل
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  تعطيل
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  حذف
                </SimpleButton>
              </div>
            </div>
          )}
        </div>

        {/* Technicians List */}
        {filteredTechnicians.length === 0 ? (
          <SimpleCard>
            <SimpleCardContent className="p-12 text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'لا توجد نتائج' 
                  : 'لا توجد فنيين'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <SimpleButton
                  onClick={() => navigate('/technicians/new')}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة فني جديد
                </SimpleButton>
              )}
            </SimpleCardContent>
          </SimpleCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTechnicians.map((technician) => (
              <SimpleCard key={technician.id} className="hover:shadow-md transition-shadow">
                <SimpleCardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTechnicians.includes(technician.id)}
                        onChange={() => handleSelectTechnician(technician.id)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{technician.name}</h3>
                        <p className="text-sm text-muted-foreground">{technician.email}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      technician.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>

                  {technician.phone && (
                    <p className="text-sm text-muted-foreground mb-3">
                      📞 {technician.phone}
                    </p>
                  )}

                  {/* Skills and Repairs Info */}
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    {techniciansData[technician.id] && (
                      <>
                        <div className="flex items-center gap-1 text-blue-600">
                          <Award className="w-4 h-4" />
                          <span>{techniciansData[technician.id].skillsCount || 0} مهارة</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <Wrench className="w-4 h-4" />
                          <span>{techniciansData[technician.id].activeRepairsCount || 0} إصلاح نشط</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/technicians/${technician.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض
                    </SimpleButton>
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/technicians/${technician.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </SimpleButton>
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(technician)}
                      className={technician.isActive ? 'text-yellow-600' : 'text-green-600'}
                    >
                      {technician.isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </SimpleButton>
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(technician)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </SimpleButton>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default TechniciansPage;

