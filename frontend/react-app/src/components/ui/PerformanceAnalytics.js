import React from 'react';
import { 
  TrendingUp, TrendingDown, Target, Clock, 
  DollarSign, Star, AlertTriangle, CheckCircle 
} from 'lucide-react';
import SimpleBadge from './SimpleBadge';

const PerformanceAnalytics = ({ 
  stats, 
  customerName = 'العميل',
  showTrends = true,
  compact = false 
}) => {
  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-20"></div>
      </div>
    );
  }

  const calculateSatisfactionLevel = (rate) => {
    if (rate >= 4.5) return { level: 'ممتاز', color: 'bg-green-100 text-green-800', icon: Star };
    if (rate >= 4.0) return { level: 'جيد جداً', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
    if (rate >= 3.5) return { level: 'جيد', color: 'bg-yellow-100 text-yellow-800', icon: Target };
    if (rate >= 3.0) return { level: 'مقبول', color: 'bg-orange-100 text-orange-800', icon: Clock };
    return { level: 'يحتاج تحسين', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
  };

  const calculateCompletionRate = () => {
    if (stats.totalRepairs === 0) return 0;
    return Math.round((stats.completedRepairs / stats.totalRepairs) * 100);
  };

  const getCustomerRisk = () => {
    const completionRate = calculateCompletionRate();
    const avgCost = stats.averageRepairCost || 0;
    const totalPaid = stats.totalPaid || 0;
    
    // حساب مستوى المخاطر بناءً على عدة عوامل
    let riskScore = 0;
    
    // معدل الإنجاز المنخفض يزيد المخاطر
    if (completionRate < 50) riskScore += 3;
    else if (completionRate < 70) riskScore += 1;
    
    // التكلفة العالية مع عدم الدفع
    if (avgCost > 1000 && totalPaid < avgCost * 0.5) riskScore += 2;
    
    // عدد الطلبات الملغية
    if (stats.cancelledRepairs > stats.totalRepairs * 0.3) riskScore += 2;
    
    if (riskScore >= 4) return { level: 'عالي', color: 'bg-red-100 text-red-800' };
    if (riskScore >= 2) return { level: 'متوسط', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'منخفض', color: 'bg-green-100 text-green-800' };
  };

  const satisfactionInfo = calculateSatisfactionLevel(stats.satisfactionRate || 0);
  const completionRate = calculateCompletionRate();
  const riskInfo = getCustomerRisk();
  const SatisfactionIcon = satisfactionInfo.icon;

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">تحليل الأداء</h4>
          <SimpleBadge className={riskInfo.color} size="sm">
            مخاطر {riskInfo.level}
          </SimpleBadge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{completionRate}%</div>
            <div className="text-gray-600">معدل الإنجاز</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {stats.satisfactionRate ? stats.satisfactionRate.toFixed(1) : 'N/A'}
            </div>
            <div className="text-gray-600">التقييم</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">تحليل أداء {customerName}</h3>
          <p className="text-sm text-gray-600">تقييم شامل لأداء العميل والمخاطر</p>
        </div>
        <SimpleBadge className={riskInfo.color}>
          مستوى المخاطر: {riskInfo.level}
        </SimpleBadge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Completion Rate */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{completionRate}%</div>
          <div className="text-sm text-blue-700">معدل الإنجاز</div>
        </div>

        {/* Satisfaction Rate */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <SatisfactionIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">
            {stats.satisfactionRate ? stats.satisfactionRate.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-green-700">تقييم الرضا</div>
        </div>

        {/* Average Cost */}
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {stats.averageRepairCost ? Math.round(stats.averageRepairCost) : 0}
          </div>
          <div className="text-sm text-purple-700">متوسط التكلفة</div>
        </div>

        {/* Response Time */}
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {stats.averageResponseTime || 'N/A'}
          </div>
          <div className="text-sm text-orange-700">وقت الاستجابة</div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Indicators */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">مؤشرات الأداء</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">معدل الإنجاز</span>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 rounded-full h-2 ml-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{completionRate}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">مستوى الرضا</span>
              <SimpleBadge className={satisfactionInfo.color} size="sm">
                {satisfactionInfo.level}
              </SimpleBadge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">إجمالي الطلبات</span>
              <span className="text-sm font-medium">{stats.totalRepairs}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">الطلبات الملغية</span>
              <span className="text-sm font-medium text-red-600">{stats.cancelledRepairs || 0}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">الملخص المالي</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">إجمالي المدفوعات</span>
              <span className="text-sm font-medium text-green-600">
                {new Intl.NumberFormat('ar-SA', {
                  style: 'currency',
                  currency: 'SAR'
                }).format(stats.totalPaid || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">متوسط التكلفة</span>
              <span className="text-sm font-medium">
                {new Intl.NumberFormat('ar-SA', {
                  style: 'currency',
                  currency: 'SAR'
                }).format(stats.averageRepairCost || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">حالة العميل</span>
              <SimpleBadge 
                className={stats.customerStatus === 'VIP' ? 'bg-gold-100 text-gold-800' : 
                          stats.customerStatus === 'active' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'} 
                size="sm"
              >
                {stats.customerStatus === 'VIP' ? 'VIP' : 
                 stats.customerStatus === 'active' ? 'نشط' : 'عادي'}
              </SimpleBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Trends (if enabled) */}
      {showTrends && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">الاتجاهات</h4>
          <div className="flex items-center space-x-4 space-x-reverse text-sm">
            <div className="flex items-center text-green-600">
              <TrendingUp className="w-4 h-4 ml-1" />
              <span>تحسن في معدل الإنجاز</span>
            </div>
            <div className="flex items-center text-blue-600">
              <Target className="w-4 h-4 ml-1" />
              <span>استقرار في التقييمات</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
