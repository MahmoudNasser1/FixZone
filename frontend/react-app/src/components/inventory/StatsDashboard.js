import React from 'react';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  X,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

/**
 * StatsDashboard Component
 * Displays inventory statistics in a beautiful dashboard format
 */
const StatsDashboard = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي الأصناف',
      value: stats?.overview?.totalItems || 0,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: stats?.itemsChange || 0,
      changeType: stats?.itemsChange >= 0 ? 'up' : 'down'
    },
    {
      title: 'قيمة المخزون',
      value: `${(stats?.overview?.totalCostValue || 0).toLocaleString()} ج.م`,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: stats?.valueChange || 0,
      changeType: stats?.valueChange >= 0 ? 'up' : 'down'
    },
    {
      title: 'أصناف منخفضة',
      value: stats?.alerts?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      change: stats?.lowStockChange || 0,
      changeType: stats?.lowStockChange >= 0 ? 'up' : 'down'
    },
    {
      title: 'أصناف نفدت',
      value: stats?.alerts?.outOfStockItems || 0,
      icon: X,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      change: stats?.outOfStockChange || 0,
      changeType: stats?.outOfStockChange >= 0 ? 'up' : 'down'
    }
  ];

  const getChangeIcon = (type) => {
    switch (type) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 ${stat.bgColor}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.change !== 0 && (
                    <div className={`ml-2 flex items-center ${getChangeColor(stat.changeType)}`}>
                      {getChangeIcon(stat.changeType)}
                      <span className="text-xs font-medium ml-1">
                        {Math.abs(stat.change)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
            
            {/* Progress bar for low stock items */}
            {stat.title === 'أصناف منخفضة' && stats?.overview?.totalItems > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>نسبة المخزون المنخفض</span>
                  <span>{((stats?.alerts?.lowStockItems / stats?.overview?.totalItems) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats?.alerts?.lowStockItems / stats?.overview?.totalItems) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsDashboard;
