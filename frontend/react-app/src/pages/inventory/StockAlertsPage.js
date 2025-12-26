import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { Input } from '../../components/ui/Input';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  Settings,
  RefreshCw,
  Package,
  ArrowRight,
  Plus,
  Save,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Inbox
} from 'lucide-react';

const StockAlertsPage = () => {
  const notifications = useNotifications();

  const notify = useCallback((type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    } else if (notifications?.[type]) {
      notifications[type](message);
    }
  }, [notifications]);

  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState([]);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [alertsRes, settingsRes, suggestionsRes] = await Promise.all([
        inventoryService.getStockAlertsLow(),
        inventoryService.getStockAlertSettings(),
        inventoryService.getReorderSuggestions()
      ]);

      // Handle both {success, data} and direct array responses
      setAlerts(alertsRes?.data?.alerts || alertsRes?.alerts || (Array.isArray(alertsRes) ? alertsRes : []));
      setSettings(settingsRes?.data?.settings || settingsRes?.settings || (Array.isArray(settingsRes) ? settingsRes : []));
      setReorderSuggestions(suggestionsRes?.data?.suggestions || suggestionsRes?.suggestions || (Array.isArray(suggestionsRes) ? suggestionsRes : []));
    } catch (error) {
      console.error('Error loading stock alerts data:', error);
      notify('error', 'خطأ في تحميل بيانات التنبيهات');

      // Mock data for demonstration if backend fails
      if (process.env.NODE_ENV === 'development') {
        setAlerts([
          { id: 1, name: 'شاشة LCD 15.6 بوصة', category: 'شاشات', quantity: 0, minimumStockLevel: 5, alertLevel: 'out_of_stock', stockDeficit: -5 },
          { id: 2, name: 'بطارية لابتوب HP', category: 'بطاريات', quantity: 2, minimumStockLevel: 10, alertLevel: 'low_stock', stockDeficit: -8 },
          { id: 3, name: 'لوحة مفاتيح Dell', category: 'إكسسوارات', quantity: 3, minimumStockLevel: 8, alertLevel: 'low_stock', stockDeficit: -5 }
        ]);
        setReorderSuggestions([
          { id: 1, name: 'شاشة LCD 15.6 بوصة', quantity: 0, reorderPoint: 5, suggestedQuantity: 10, estimatedCost: 1500 },
          { id: 2, name: 'بطارية لابتوب HP', quantity: 2, reorderPoint: 10, suggestedQuantity: 15, estimatedCost: 1200 }
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateSetting = async (itemId, type, value) => {
    const updatedSettings = settings.map(s =>
      s.id === itemId ? { ...s, [type]: parseInt(value) || 0 } : s
    );
    setSettings(updatedSettings);
  };

  const saveSettings = async (itemId) => {
    try {
      setIsUpdating(true);
      const setting = settings.find(s => s.id === itemId);
      await inventoryService.updateStockAlertSettings(itemId, {
        minimumStockLevel: setting.minimumStockLevel,
        maximumStockLevel: setting.maximumStockLevel,
        reorderPoint: setting.reorderPoint,
        reorderQuantity: setting.reorderQuantity
      });
      notify('success', 'تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      notify('error', 'خطأ في حفظ الإعدادات');
    } finally {
      setIsUpdating(false);
    }
  };

  const getAlertStatusInfo = (alertLevel) => {
    switch (alertLevel) {
      case 'out_of_stock':
        return {
          icon: AlertCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          label: 'نفد المخزون',
          variant: 'destructive'
        };
      case 'low_stock':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          label: 'مخزون منخفض',
          variant: 'warning'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          label: 'طبيعي',
          variant: 'success'
        };
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="جاري تحميل التنبيهات..." />;
  }

  const outOfStockCount = alerts.filter(a => a.alertLevel === 'out_of_stock').length;
  const lowStockCount = alerts.filter(a => a.alertLevel === 'low_stock').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            تنبيهات المخزون
          </h1>
          <p className="text-muted-foreground mt-1">مراقبة مستويات المخزون وإدارة نقاط إعادة الطلب</p>
        </div>
        <SimpleButton variant="outline" onClick={loadData} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث البيانات
        </SimpleButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <SimpleCard className="border-destructive/20 bg-destructive/5">
          <SimpleCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-xl">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive/80">اصناف نفدت</p>
                <p className="text-3xl font-bold text-destructive">{outOfStockCount}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard className="border-yellow-500/20 bg-yellow-500/5">
          <SimpleCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-500/80">مخزون منخفض</p>
                <p className="text-3xl font-bold text-yellow-500">{lowStockCount}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard className="border-primary/20 bg-primary/5">
          <SimpleCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary/80">اقتراحات الطلب</p>
                <p className="text-3xl font-bold text-primary">{reorderSuggestions.length}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Main Content with Tabs */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden text-foreground">
        <div className="flex flex-wrap border-b border-border bg-muted/30">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${activeTab === 'alerts'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <Bell className="w-4 h-4" />
            التنبيهات النشطة
            {alerts.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full mr-1">
                {alerts.length}
              </span>
            )}
            {activeTab === 'alerts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${activeTab === 'suggestions'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <ShoppingCart className="w-4 h-4" />
            اقتراحات إعادة الطلب
            {reorderSuggestions.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full mr-1">
                {reorderSuggestions.length}
              </span>
            )}
            {activeTab === 'suggestions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${activeTab === 'settings'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <Settings className="w-4 h-4" />
            إعدادات التنبيهات
            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>

        <div className="p-0 sm:p-6">
          {/* Active Alerts List */}
          {activeTab === 'alerts' && (
            <div className="space-y-4 p-4 sm:p-0">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/10 rounded-xl border-2 border-dashed border-border text-foreground overflow-hidden">
                  <div className="p-4 bg-green-500/10 rounded-full mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold">المخزون سليم!</h3>
                  <p className="text-muted-foreground max-w-xs mt-2">لا توجد تنبيهات لنقص المخزون في الوقت الحالي.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {alerts.map((alert) => {
                    const info = getAlertStatusInfo(alert.alertLevel);
                    const StatusIcon = info.icon;
                    return (
                      <div
                        key={alert.id}
                        className={`group relative p-5 rounded-xl border ${info.borderColor} ${info.bgColor} transition-all hover:shadow-md cursor-default text-foreground`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${info.bgColor} ${info.color} border ${info.borderColor}`}>
                              <StatusIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg mb-1 leading-tight group-hover:text-primary transition-colors">
                                {alert.name}
                              </h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                                <Package className="w-3.5 h-3.5" />
                                {alert.category || 'غير مصنف'}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                <SimpleBadge variant={info.variant} className="text-xs">
                                  {info.label}
                                </SimpleBadge>
                                {alert.stockDeficit < 0 && (
                                  <SimpleBadge variant="outline" className="text-xs border-destructive/20 text-destructive bg-destructive/5">
                                    نقص: {Math.abs(alert.stockDeficit)} وحدة
                                  </SimpleBadge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left bg-card/50 p-3 rounded-lg border border-border/50">
                            <span className="block text-2xl font-black">{alert.quantity}</span>
                            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold">المخزون الحالي</span>
                            <div className="mt-1 h-1 w-full bg-border rounded-full overflow-hidden">
                              <div
                                className={`h-full ${alert.quantity === 0 ? 'w-0' : 'bg-primary'}`}
                                style={{ width: `${Math.min((alert.quantity / alert.minimumStockLevel) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="block text-[10px] text-muted-foreground mt-1 text-right">الحد: {alert.minimumStockLevel}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reorder Suggestions Table */}
          {activeTab === 'suggestions' && (
            <div className="overflow-x-auto">
              {reorderSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/10 rounded-xl border-2 border-dashed border-border m-4 sm:m-0 text-foreground overflow-hidden">
                  <div className="p-4 bg-muted/20 rounded-full mb-4">
                    <Inbox className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">لا اقتراحات</h3>
                  <p className="text-muted-foreground max-w-xs mt-2">لا توجد اقتراحات لإعادة طلب أصناف حالياً.</p>
                </div>
              ) : (
                <table className="w-full text-right text-foreground">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الصنف</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">الكمية الحالية</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">نقطة إعادة الطلب</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">الكمية المقترحة</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground">التكلفة المتوقعة</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-left">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reorderSuggestions.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              <Package className="w-5 h-5" />
                            </div>
                            <span className="font-medium group-hover:text-primary transition-colors">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${item.quantity === 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
                            }`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-muted-foreground">{item.reorderPoint}</td>
                        <td className="px-6 py-4 text-center">
                          <SimpleBadge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                            {item.suggestedQuantity}
                          </SimpleBadge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold">{(item.estimatedCost || 0).toLocaleString('ar-SA')}</span>
                          <span className="text-xs text-muted-foreground mr-1">جنية</span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <SimpleButton size="sm" className="shadow-sm">
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء طلب شراء
                          </SimpleButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Alert Settings Table */}
          {activeTab === 'settings' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-foreground">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الصنف</th>
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">الحد الأدنى</th>
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">الحد الأقصى</th>
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">نقطة إعادة الطلب</th>
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">كمية الطلب</th>
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-left">حفظ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {settings.map((setting) => (
                    <tr key={setting.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            <Settings className="w-5 h-5" />
                          </div>
                          <span className="font-medium">{setting.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Input
                          type="number"
                          value={setting.minimumStockLevel}
                          onChange={(e) => handleUpdateSetting(setting.id, 'minimumStockLevel', e.target.value)}
                          className="w-20 mx-auto text-center h-9"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Input
                          type="number"
                          value={setting.maximumStockLevel}
                          onChange={(e) => handleUpdateSetting(setting.id, 'maximumStockLevel', e.target.value)}
                          className="w-20 mx-auto text-center h-9"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Input
                          type="number"
                          value={setting.reorderPoint}
                          onChange={(e) => handleUpdateSetting(setting.id, 'reorderPoint', e.target.value)}
                          className="w-20 mx-auto text-center h-9"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Input
                          type="number"
                          value={setting.reorderQuantity}
                          onChange={(e) => handleUpdateSetting(setting.id, 'reorderQuantity', e.target.value)}
                          className="w-20 mx-auto text-center h-9"
                        />
                      </td>
                      <td className="px-6 py-4 text-left">
                        <SimpleButton
                          size="sm"
                          variant="ghost"
                          onClick={() => saveSettings(setting.id)}
                          className="text-primary hover:bg-primary/10 h-9 w-9 p-0"
                          title="حفظ التغييرات"
                        >
                          <Save className="w-5 h-5" />
                        </SimpleButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAlertsPage;
