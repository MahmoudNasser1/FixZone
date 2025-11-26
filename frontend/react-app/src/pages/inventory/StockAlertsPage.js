import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

const StockAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState([]);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  const fetchStockAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock-alerts/low`, {
        credentials: 'include'
      });
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      // Mock data for demonstration
      setAlerts([
        {
          id: 1,
          name: 'شاشة LCD 15.6 بوصة',
          category: 'شاشات',
          quantity: 0,
          minimumStockLevel: 5,
          alertLevel: 'out_of_stock',
          stockDeficit: -5
        },
        {
          id: 2,
          name: 'بطارية لابتوب',
          category: 'بطاريات',
          quantity: 2,
          minimumStockLevel: 10,
          alertLevel: 'low_stock',
          stockDeficit: -8
        },
        {
          id: 3,
          name: 'لوحة مفاتيح',
          category: 'إكسسوارات',
          quantity: 3,
          minimumStockLevel: 8,
          alertLevel: 'low_stock',
          stockDeficit: -5
        }
      ]);
    }
  };

  const fetchAlertSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock-alerts/settings`, {
        credentials: 'include'
      });
      const data = await response.json();
      setSettings(data.settings || []);
    } catch (error) {
      console.error('Error fetching alert settings:', error);
    }
  };

  const fetchReorderSuggestions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock-alerts/reorder-suggestions`, {
        credentials: 'include'
      });
      const data = await response.json();
      setReorderSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching reorder suggestions:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStockAlerts(),
        fetchAlertSettings(),
        fetchReorderSuggestions()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const updateAlertSettings = async (itemId, newSettings) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock-alerts/settings/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        fetchAlertSettings();
      }
    } catch (error) {
      console.error('Error updating alert settings:', error);
    }
  };

  const getAlertIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'out_of_stock':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-600" />;
      case 'low_stock':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
      default:
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    }
  };

  const getAlertColor = (alertLevel) => {
    switch (alertLevel) {
      case 'out_of_stock':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'low_stock':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getAlertText = (alertLevel) => {
    switch (alertLevel) {
      case 'out_of_stock':
        return 'نفد المخزون';
      case 'low_stock':
        return 'مخزون منخفض';
      default:
        return 'طبيعي';
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
              <BellIcon className="h-8 w-8 text-blue-600" />
              تنبيهات المخزون
            </h1>
            <p className="text-gray-600 mt-1">مراقبة المخزون وتنبيهات النقص</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
            <div className="mr-3">
              <div className="text-sm font-medium text-red-800">نفد المخزون</div>
              <div className="text-2xl font-bold text-red-900">
                {alerts.filter(alert => alert.alertLevel === 'out_of_stock').length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div className="mr-3">
              <div className="text-sm font-medium text-yellow-800">مخزون منخفض</div>
              <div className="text-2xl font-bold text-yellow-900">
                {alerts.filter(alert => alert.alertLevel === 'low_stock').length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center">
            <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
            <div className="mr-3">
              <div className="text-sm font-medium text-blue-800">اقتراحات إعادة الطلب</div>
              <div className="text-2xl font-bold text-blue-900">
                {reorderSuggestions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              التنبيهات النشطة
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'suggestions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              اقتراحات إعادة الطلب
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              إعدادات التنبيهات
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Active Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد تنبيهات نشطة</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.alertLevel)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getAlertIcon(alert.alertLevel)}
                        <div className="mr-3">
                          <h3 className="font-medium">{alert.name}</h3>
                          <p className="text-sm opacity-75">{alert.category}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">
                          {alert.quantity} / {alert.minimumStockLevel}
                        </div>
                        <div className="text-sm opacity-75">
                          {getAlertText(alert.alertLevel)}
                        </div>
                        {alert.stockDeficit < 0 && (
                          <div className="text-sm opacity-75">
                            نقص: {Math.abs(alert.stockDeficit)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Reorder Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {reorderSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد اقتراحات إعادة طلب</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          اسم القطعة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكمية الحالية
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          نقطة إعادة الطلب
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكمية المقترحة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          التكلفة المقدرة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reorderSuggestions.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.reorderPoint}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.suggestedQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.estimatedCost?.toLocaleString('ar-SA')} جنية
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                              إنشاء طلب شراء
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <p className="text-gray-600">إعدادات تنبيهات المخزون لكل قطعة</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        اسم القطعة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحد الأدنى
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحد الأقصى
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        نقطة إعادة الطلب
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        كمية إعادة الطلب
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settings.map((setting) => (
                      <tr key={setting.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {setting.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="number"
                            defaultValue={setting.minimumStockLevel}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="number"
                            defaultValue={setting.maximumStockLevel}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="number"
                            defaultValue={setting.reorderPoint}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="number"
                            defaultValue={setting.reorderQuantity}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                            حفظ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAlertsPage;

