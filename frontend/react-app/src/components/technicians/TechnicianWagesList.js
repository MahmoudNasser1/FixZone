import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useNotifications } from '../notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleBadge from '../ui/SimpleBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

const TechnicianWagesList = ({ technicianId }) => {
  const notifications = useNotifications();
  const [wages, setWages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (technicianId) {
      loadWages();
    }
  }, [technicianId]);

  const loadWages = async () => {
    try {
      setLoading(true);
      const response = await technicianService.getTechnicianWages(technicianId);
      if (response.success && response.data) {
        setWages(response.data);
      }
    } catch (error) {
      console.error('Error loading wages:', error);
      notifications.error('خطأ في تحميل الأجور');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ج.م';
  };

  const getPaymentStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'معلق', color: 'yellow', icon: Clock },
      paid: { label: 'مدفوع', color: 'green', icon: CheckCircle },
      cancelled: { label: 'ملغي', color: 'red', icon: Clock }
    };
    return statuses[status] || statuses.pending;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">الأجور والرواتب</h3>

      {wages.length === 0 ? (
        <SimpleCard>
          <SimpleCardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">لا توجد سجلات أجور</p>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <div className="space-y-3">
          {wages.map((wage) => {
            const statusInfo = getPaymentStatusBadge(wage.paymentStatus);
            const StatusIcon = statusInfo.icon;
            
            return (
              <SimpleCard key={wage.id}>
                <SimpleCardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(wage.periodStart).toLocaleDateString('ar-EG')} - {new Date(wage.periodEnd).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatAmount(wage.totalEarnings)}
                      </div>
                    </div>
                    <SimpleBadge color={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusInfo.label}
                    </SimpleBadge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">الراتب الأساسي:</span>
                      <span className="font-semibold mr-2">{formatAmount(wage.baseSalary)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">العمولة:</span>
                      <span className="font-semibold mr-2">{formatAmount(wage.commission)}</span>
                    </div>
                    {wage.bonuses > 0 && (
                      <div>
                        <span className="text-gray-600">المكافآت:</span>
                        <span className="font-semibold mr-2 text-green-600">{formatAmount(wage.bonuses)}</span>
                      </div>
                    )}
                    {wage.deductions > 0 && (
                      <div>
                        <span className="text-gray-600">الخصومات:</span>
                        <span className="font-semibold mr-2 text-red-600">{formatAmount(wage.deductions)}</span>
                      </div>
                    )}
                  </div>
                  
                  {wage.paymentDate && (
                    <div className="text-xs text-gray-500 mt-2">
                      تاريخ الدفع: {new Date(wage.paymentDate).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TechnicianWagesList;


