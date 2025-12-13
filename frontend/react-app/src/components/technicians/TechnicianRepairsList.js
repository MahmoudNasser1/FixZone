import React, { useState, useEffect } from 'react';
import { Wrench, Clock, User } from 'lucide-react';
import { useNotifications } from '../notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import SimpleBadge from '../ui/SimpleBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

const TechnicianRepairsList = ({ technicianId }) => {
  const notifications = useNotifications();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, assigned, in_progress, completed

  useEffect(() => {
    if (technicianId) {
      loadRepairs();
    }
  }, [technicianId, filter]);

  const loadRepairs = async () => {
    try {
      setLoading(true);
      const params = filter === 'active' ? { active: true } : (filter !== 'all' ? { status: filter } : {});
      const response = await technicianService.getTechnicianRepairs(technicianId, params);
      if (response.success && response.data) {
        setRepairs(response.data);
      }
    } catch (error) {
      console.error('Error loading repairs:', error);
      notifications.error('خطأ في تحميل الإصلاحات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      assigned: { label: 'معين', color: 'blue' },
      in_progress: { label: 'قيد التنفيذ', color: 'yellow' },
      completed: { label: 'مكتمل', color: 'green' },
      cancelled: { label: 'ملغي', color: 'red' }
    };
    return statuses[status] || statuses.assigned;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الإصلاحات</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">الكل</option>
          <option value="active">نشطة</option>
          <option value="assigned">معينة</option>
          <option value="in_progress">قيد التنفيذ</option>
          <option value="completed">مكتملة</option>
        </select>
      </div>

      {repairs.length === 0 ? (
        <SimpleCard>
          <SimpleCardContent className="p-8 text-center">
            <Wrench className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">لا توجد إصلاحات</p>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <div className="space-y-3">
          {repairs.map((repair) => (
            <SimpleCard key={repair.id}>
              <SimpleCardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{repair.requestNumber || `#${repair.repairId}`}</h4>
                      <SimpleBadge color={getStatusBadge(repair.status).color}>
                        {getStatusBadge(repair.status).label}
                      </SimpleBadge>
                      {repair.role === 'primary' && (
                        <SimpleBadge color="purple" variant="outline">رئيسي</SimpleBadge>
                      )}
                    </div>
                    {repair.customerName && (
                      <p className="text-sm text-gray-600 mb-1">العميل: {repair.customerName}</p>
                    )}
                    {repair.deviceType && (
                      <p className="text-sm text-gray-600 mb-1">نوع الجهاز: {repair.deviceType}</p>
                    )}
                    {repair.assignedAt && (
                      <p className="text-xs text-gray-500">
                        تم التعيين: {new Date(repair.assignedAt).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianRepairsList;


