import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const QuickStatsCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'blue',
  format = 'number',
  suffix = '',
  loading = false 
}) => {
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return Math.round(change * 10) / 10; // Round to 1 decimal place
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        text: 'text-blue-900',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        text: 'text-green-900',
        border: 'border-green-200'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        text: 'text-yellow-900',
        border: 'border-yellow-200'
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        text: 'text-red-900',
        border: 'border-red-200'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        text: 'text-purple-900',
        border: 'border-purple-200'
      },
      gray: {
        bg: 'bg-gray-50',
        icon: 'text-gray-600',
        text: 'text-gray-900',
        border: 'border-gray-200'
      }
    };
    
    return colorMap[color] || colorMap.blue;
  };

  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0
      }).format(val);
    } else if (format === 'percentage') {
      return `${val}%`;
    } else if (format === 'number') {
      return new Intl.NumberFormat('ar-SA').format(val);
    }
    return val;
  };

  const change = calculateChange();
  const colors = getColorClasses(color);

  if (loading) {
    return (
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-6 animate-pulse`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-8 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="h-12 w-12 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.text} opacity-70`}>
            {title}
          </p>
          <div className="flex items-baseline space-x-2 space-x-reverse mt-2">
            <p className={`text-2xl font-bold ${colors.text}`}>
              {formatValue(value)}{suffix}
            </p>
            
            {change !== null && (
              <div className="flex items-center">
                {change > 0 ? (
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 ml-1" />
                    <span className="text-sm font-medium">+{change}%</span>
                  </div>
                ) : change < 0 ? (
                  <div className="flex items-center text-red-600">
                    <TrendingDown className="w-4 h-4 ml-1" />
                    <span className="text-sm font-medium">{change}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <Minus className="w-4 h-4 ml-1" />
                    <span className="text-sm font-medium">0%</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {change !== null && (
            <p className="text-xs text-gray-600 mt-1">
              مقارنة بالفترة السابقة
            </p>
          )}
        </div>
        
        <div className={`${colors.bg} p-3 rounded-lg border-2 ${colors.border}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;
