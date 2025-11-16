import React from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';

/**
 * StatsCard Component
 * بطاقة لعرض الإحصائيات بشكل جذاب
 */

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = 'text-indigo-600',
  iconBgColor = 'bg-indigo-50',
  className = '' 
}) {
  return (
    <SimpleCard className={`hover:shadow-md transition-shadow ${className}`}>
      <SimpleCardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
          )}
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
}


