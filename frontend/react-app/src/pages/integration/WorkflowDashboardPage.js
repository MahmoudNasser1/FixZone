import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const WorkflowDashboardPage = () => {
  const [workflowStats, setWorkflowStats] = useState(null);
  const [activeRepairs, setActiveRepairs] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkflowStats = async () => {
    try {
      // Mock data for demonstration - replace with actual API calls
      const mockStats = {
        totalRepairs: 45,
        pendingRepairs: 8,
        inProgressRepairs: 12,
        completedRepairs: 20,
        invoicedRepairs: 5,
        averageRepairTime: 2.5,
        totalRevenue: 125000,
        pendingPayments: 15000
      };
      setWorkflowStats(mockStats);
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
    }
  };

  const fetchActiveRepairs = async () => {
    try {
      // Mock data for demonstration
      const mockRepairs = [
        {
          id: 1,
          customerName: 'أحمد محمد',
          deviceType: 'هاتف ذكي',
          status: 'in_progress',
          technician: 'سارة أحمد',
          estimatedCost: 500,
          startDate: '2024-01-15'
        },
        {
          id: 2,
          customerName: 'فاطمة علي',
          deviceType: 'لابتوب',
          status: 'completed',
          technician: 'محمد حسن',
          estimatedCost: 800,
          startDate: '2024-01-14'
        },
        {
          id: 3,
          customerName: 'عبدالله سالم',
          deviceType: 'تابلت',
          status: 'pending',
          technician: null,
          estimatedCost: 300,
          startDate: '2024-01-16'
        }
      ];
      setActiveRepairs(mockRepairs);
    } catch (error) {
      console.error('Error fetching active repairs:', error);
    }
  };

  const fetchPendingActions = async () => {
    try {
      // Mock data for demonstration
      const mockActions = [
        {
          id: 1,
          type: 'complete_repair',
          repairId: 1,
          description: 'إكمال إصلاح هاتف أحمد محمد',
          priority: 'high',
          estimatedTime: '30 دقيقة'
        },
        {
          id: 2,
          type: 'create_invoice',
          repairId: 2,
          description: 'إنشاء فاتورة لإصلاح لابتوب فاطمة',
          priority: 'medium',
          estimatedTime: '15 دقيقة'
        },
        {
          id: 3,
          type: 'process_payment',
          repairId: 3,
          description: 'معالجة دفع فاتورة رقم #1234',
          priority: 'low',
          estimatedTime: '10 دقيقة'
        }
      ];
      setPendingActions(mockActions);
    } catch (error) {
      console.error('Error fetching pending actions:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWorkflowStats(),
        fetchActiveRepairs(),
        fetchPendingActions()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invoiced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'معلق';
      case 'in_progress':
        return 'قيد الإصلاح';
      case 'completed':
        return 'مكتمل';
      case 'invoiced':
        return 'فاتورة';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
              لوحة التحكم المتكاملة
            </h1>
            <p className="text-gray-600 mt-1">مراقبة سير العمل المتكامل لجميع العمليات</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {workflowStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ArrowPathIcon className="h-8 w-8 text-blue-600" />
              <div className="mr-3">
                <div className="text-sm font-medium text-gray-800">إجمالي الطلبات</div>
                <div className="text-2xl font-bold text-gray-900">{workflowStats.totalRepairs}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="mr-3">
                <div className="text-sm font-medium text-gray-800">قيد الإصلاح</div>
                <div className="text-2xl font-bold text-gray-900">{workflowStats.inProgressRepairs}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="mr-3">
                <div className="text-sm font-medium text-gray-800">مكتمل</div>
                <div className="text-2xl font-bold text-gray-900">{workflowStats.completedRepairs}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              <div className="mr-3">
                <div className="text-sm font-medium text-gray-800">إجمالي الإيرادات</div>
                <div className="text-2xl font-bold text-gray-900">
                  {workflowStats.totalRevenue?.toLocaleString('ar-SA')} ر.س
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          تقدم سير العمل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-800 font-bold">{workflowStats?.pendingRepairs || 0}</span>
            </div>
            <div className="text-sm text-gray-600">معلق</div>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-800 font-bold">{workflowStats?.inProgressRepairs || 0}</span>
            </div>
            <div className="text-sm text-gray-600">قيد الإصلاح</div>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <span className="text-green-800 font-bold">{workflowStats?.completedRepairs || 0}</span>
            </div>
            <div className="text-sm text-gray-600">مكتمل</div>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-800 font-bold">{workflowStats?.invoicedRepairs || 0}</span>
            </div>
            <div className="text-sm text-gray-600">فاتورة</div>
          </div>
          <div className="text-center">
            <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <span className="text-emerald-800 font-bold">0</span>
            </div>
            <div className="text-sm text-gray-600">مسلم</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Repairs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            الطلبات النشطة
          </h3>
          <div className="space-y-3">
            {activeRepairs.map((repair) => (
              <div key={repair.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{repair.customerName}</div>
                    <div className="text-sm text-gray-600">{repair.deviceType}</div>
                  </div>
                  <div className="text-left">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(repair.status)}`}>
                      {getStatusText(repair.status)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {repair.estimatedCost} ر.س
                    </div>
                  </div>
                </div>
                {repair.technician && (
                  <div className="mt-2 text-sm text-gray-600">
                    الفني: {repair.technician}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            الإجراءات المعلقة
          </h3>
          <div className="space-y-3">
            {pendingActions.map((action) => (
              <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{action.description}</div>
                    <div className="text-sm text-gray-600">{action.estimatedTime}</div>
                  </div>
                  <div className="text-left">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                      {action.priority === 'high' ? 'عاجل' : action.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    تنفيذ الإجراء
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">حالة التكامل</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-green-900">نظام الإصلاحات</div>
              <div className="text-sm text-green-700">متصل ومتوفر</div>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-green-900">نظام المخزون</div>
              <div className="text-sm text-green-700">متصل ومتوفر</div>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-green-900">النظام المالي</div>
              <div className="text-sm text-green-700">متصل ومتوفر</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDashboardPage;
