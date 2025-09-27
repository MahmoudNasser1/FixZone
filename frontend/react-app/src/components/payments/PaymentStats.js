import React from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import paymentService from '../../services/paymentService';

const PaymentStats = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <SimpleCard key={index}>
            <SimpleCardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatAmount = (amount) => {
    return paymentService.formatAmount(amount);
  };

  const statsData = [
    {
      title: 'إجمالي المدفوعات',
      value: formatAmount(stats.totalAmount || 0),
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'عدد المدفوعات',
      value: stats.totalPayments || 0,
      icon: '📊',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'متوسط المدفوعات',
      value: formatAmount(stats.averageAmount || 0),
      icon: '📈',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'المدفوعات النقدية',
      value: formatAmount(stats.cashAmount || 0),
      icon: '💵',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'المدفوعات المتأخرة',
      value: stats.overduePayments || 0,
      icon: '⚠️',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const paymentMethodsData = [
    {
      method: 'نقدي',
      count: stats.cashPayments || 0,
      amount: stats.cashAmount || 0,
      icon: '💵',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      method: 'بطاقة ائتمان',
      count: stats.cardPayments || 0,
      amount: stats.cardAmount || 0,
      icon: '💳',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      method: 'تحويل بنكي',
      count: stats.bankTransferPayments || 0,
      amount: stats.bankTransferAmount || 0,
      icon: '🏦',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      method: 'شيك',
      count: stats.checkPayments || 0,
      amount: stats.checkAmount || 0,
      icon: '📄',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      method: 'أخرى',
      count: stats.otherPayments || 0,
      amount: stats.otherAmount || 0,
      icon: '📝',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <SimpleCard key={index}>
            <SimpleCardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="mr-3 rtl:mr-0 rtl:ml-3">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-lg font-semibold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        ))}
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              توزيع المدفوعات حسب الطريقة
            </h3>
            <div className="space-y-3">
              {paymentMethodsData.map((method, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${method.bgColor}`} style={{borderLeftColor: method.color.replace('text-', '')}}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <span className="text-xl">{method.icon}</span>
                      <div>
                        <span className="font-medium text-gray-900">{method.method}</span>
                        <p className="text-sm text-gray-600">
                          {method.count} دفعة
                        </p>
                      </div>
                    </div>
                    <div className="text-left rtl:text-right">
                      <p className={`font-semibold ${method.color}`}>
                        {formatAmount(method.amount)}
                      </p>
                      {method.count > 0 && (
                        <p className="text-sm text-gray-500">
                          متوسط: {formatAmount(method.amount / method.count)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              إحصائيات إضافية
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">أكبر مدفوعة:</span>
                <span className="text-blue-900 font-semibold">
                  {formatAmount(stats.maxPayment || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">أصغر مدفوعة:</span>
                <span className="text-green-900 font-semibold">
                  {formatAmount(stats.minPayment || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">معدل التحصيل:</span>
                <span className="text-purple-900 font-semibold">
                  {stats.collectionRate ? `${stats.collectionRate}%` : 'غير محدد'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-700 font-medium">المدفوعات اليوم:</span>
                <span className="text-orange-900 font-semibold">
                  {stats.todayPayments || 0}
                </span>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default PaymentStats;

