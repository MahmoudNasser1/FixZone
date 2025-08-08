import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import SimpleBadge from './SimpleBadge';
import { 
  TrendingUp, TrendingDown, Clock, CheckCircle, 
  XCircle, AlertTriangle, Star, Activity 
} from 'lucide-react';

const CustomerStatsCard = ({ customerId, customerName }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customerId) {
      fetchCustomerStats();
    }
  }, [customerId]);

  const fetchCustomerStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCustomerStats(customerId);
      setStats(data);
    } catch (err) {
      console.error('Error fetching customer stats:', err);
      setError('فشل في جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500 text-sm">
          <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
          {error || 'لا توجد إحصائيات'}
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (status.isVip) return 'text-purple-600';
    if (status.isActive) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (status) => {
    if (status.isVip) return <Star className="w-3 h-3" />;
    if (status.isActive) return <Activity className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRiskText = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'عالي المخاطر';
      case 'medium': return 'متوسط المخاطر';
      default: return 'منخفض المخاطر';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`flex items-center ${getStatusColor(stats.customerStatus)}`}>
            {getStatusIcon(stats.customerStatus)}
            <span className="text-xs font-medium mr-1">
              {stats.customerStatus.isVip ? 'VIP' : 
               stats.customerStatus.isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>
        </div>
        <SimpleBadge 
          className={`text-xs ${getRiskColor(stats.customerStatus.riskLevel)}`}
          size="sm"
        >
          {getRiskText(stats.customerStatus.riskLevel)}
        </SimpleBadge>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{stats.totalRepairs}</div>
          <div className="text-xs text-gray-600">إجمالي الطلبات</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {stats.totalPaid.toFixed(0)} ج.م
          </div>
          <div className="text-xs text-gray-600">إجمالي المدفوعات</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center text-green-600">
            <CheckCircle className="w-3 h-3 ml-1" />
            <span className="text-sm font-medium">{stats.completedRepairs}</span>
          </div>
          <div className="text-xs text-gray-600">مكتمل</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-yellow-600">
            <Clock className="w-3 h-3 ml-1" />
            <span className="text-sm font-medium">{stats.pendingRepairs}</span>
          </div>
          <div className="text-xs text-gray-600">معلق</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-blue-600">
            <Activity className="w-3 h-3 ml-1" />
            <span className="text-sm font-medium">{stats.inProgressRepairs}</span>
          </div>
          <div className="text-xs text-gray-600">قيد التنفيذ</div>
        </div>
      </div>

      {/* Satisfaction Rate */}
      {stats.totalRepairs > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>معدل الإنجاز</span>
            <span>{stats.satisfactionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                stats.satisfactionRate >= 80 ? 'bg-green-500' :
                stats.satisfactionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${stats.satisfactionRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Last Activity */}
      {stats.lastRepairDate && (
        <div className="text-xs text-gray-600 text-center">
          آخر طلب: {new Date(stats.lastRepairDate).toLocaleDateString('ar-EG')}
        </div>
      )}
    </div>
  );
};

export default CustomerStatsCard;
