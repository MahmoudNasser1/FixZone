// frontend/react-app/src/pages/messaging/MessagingCenterPage.js
// صفحة مركز الرسائل والمتابعة

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import MessageStatusBadge from '../../components/messaging/MessageStatusBadge';
import MessageLogViewer from '../../components/messaging/MessageLogViewer';
import messagingService from '../../services/messagingService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import {
  MessageSquare, Mail, Search, Filter, RefreshCw,
  Eye, RotateCw, Calendar, TrendingUp, AlertCircle,
  CheckCircle, XCircle, FileText, Download, Send, BarChart3
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';

const MessagingCenterPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [retrying, setRetrying] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    entityType: '',
    entityId: '',
    customerId: '',
    channel: '',
    status: '',
    recipient: '',
    dateFrom: '',
    dateTo: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  });

  // Load data
  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters, pagination.offset]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await messagingService.getMessageLogs(filters, {
        limit: pagination.limit,
        offset: pagination.offset
      });

      setLogs(result.logs || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        hasMore: result.hasMore || false
      }));
    } catch (error) {
      console.error('Error loading message logs:', error);
      notifications.error('فشل في تحميل السجل', {
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await messagingService.getStats({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleRetry = async (logId) => {
    try {
      setRetrying(logId);
      await messagingService.retryMessage(logId);

      notifications.success('تم إعادة المحاولة', {
        message: 'سيتم إرسال الرسالة مرة أخرى'
      });

      await loadLogs();
      await loadStats();
    } catch (error) {
      console.error('Error retrying message:', error);
      notifications.error('فشلت إعادة المحاولة', {
        message: error.message
      });
    } finally {
      setRetrying(null);
    }
  };

  const handleViewEntity = (log) => {
    if (log.entityType === 'invoice') {
      navigate(`/invoices/${log.entityId}`);
    } else if (log.entityType === 'repair') {
      navigate(`/repairs/${log.entityId}`);
    } else if (log.entityType === 'quotation') {
      navigate(`/quotations/${log.entityId}`);
    } else if (log.entityType === 'payment') {
      navigate(`/payments/${log.entityId}`);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'غير محدد';
    try {
      return new Date(date).toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'whatsapp':
        return MessageSquare;
      case 'email':
        return Mail;
      default:
        return FileText;
    }
  };

  const getChannelLabel = (channel) => {
    switch (channel) {
      case 'whatsapp':
        return 'واتساب';
      case 'email':
        return 'بريد إلكتروني';
      case 'sms':
        return 'رسالة نصية';
      default:
        return channel;
    }
  };

  const getEntityLabel = (entityType) => {
    switch (entityType) {
      case 'invoice':
        return 'فاتورة';
      case 'repair':
        return 'طلب إصلاح';
      case 'quotation':
        return 'عرض سعر';
      case 'payment':
        return 'دفعة';
      default:
        return entityType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مركز الرسائل والمتابعة</h1>
          <p className="text-gray-600 mt-1">إدارة ومتابعة جميع المراسلات المرسلة للعملاء</p>
        </div>
        <div className="flex gap-2">
          <SimpleButton
            variant="default"
            onClick={() => navigate('/messaging/reports')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            التقارير والإحصائيات
          </SimpleButton>
          <SimpleButton
            variant="outline"
            onClick={() => {
              loadLogs();
              loadStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </SimpleButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.total || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مرسلة بنجاح</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.sent || 0}
                </p>
                {stats.total > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {((stats.sent / stats.total) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">فاشلة</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.failed || 0}
                </p>
                {stats.total > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {((stats.failed / stats.total) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معدل النجاح</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.successRate?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Filters */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center">
            <Filter className="w-5 h-5 ml-2" />
            الفلترة والبحث
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع الكيان
              </label>
              <Select
                value={filters.entityType}
                onValueChange={(value) => handleFilterChange('entityType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">الكل</SelectItem>
                  <SelectItem value="invoice">فاتورة</SelectItem>
                  <SelectItem value="repair">طلب إصلاح</SelectItem>
                  <SelectItem value="quotation">عرض سعر</SelectItem>
                  <SelectItem value="payment">دفعة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                القناة
              </label>
              <Select
                value={filters.channel}
                onValueChange={(value) => handleFilterChange('channel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">الكل</SelectItem>
                  <SelectItem value="whatsapp">واتساب</SelectItem>
                  <SelectItem value="email">بريد إلكتروني</SelectItem>
                  <SelectItem value="sms">رسالة نصية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">الكل</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="sent">تم الإرسال</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="failed">فشل الإرسال</SelectItem>
                  <SelectItem value="read">تم القراءة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث (مستلم)
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="رقم الهاتف أو البريد..."
                  value={filters.recipient}
                  onChange={(e) => handleFilterChange('recipient', e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                من تاريخ
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                إلى تاريخ
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الكيان
              </label>
              <Input
                type="number"
                placeholder="رقم الفاتورة/الطلب..."
                value={filters.entityId}
                onChange={(e) => handleFilterChange('entityId', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <SimpleButton
                variant="outline"
                onClick={() => {
                  setFilters({
                    entityType: '',
                    entityId: '',
                    customerId: '',
                    channel: '',
                    status: '',
                    recipient: '',
                    dateFrom: '',
                    dateTo: ''
                  });
                  setPagination(prev => ({ ...prev, offset: 0 }));
                }}
                className="w-full"
              >
                <XCircle className="w-4 h-4 ml-2" />
                مسح الفلاتر
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Message Logs */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              سجل المراسلات
              {pagination.total > 0 && (
                <SimpleBadge variant="secondary" className="mr-2">
                  {pagination.total} رسالة
                </SimpleBadge>
              )}
            </div>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {loading && logs.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">جاري تحميل السجل...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد رسائل مسجلة</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {logs.map((log) => {
                  const ChannelIcon = getChannelIcon(log.channel);

                  return (
                    <div
                      key={log.id}
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-card"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <ChannelIcon className="w-5 h-5 text-gray-600" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {getChannelLabel(log.channel)}
                                </span>
                                <MessageStatusBadge status={log.status} />
                                <SimpleBadge variant="secondary" size="sm">
                                  {getEntityLabel(log.entityType)} #{log.entityId}
                                </SimpleBadge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                إلى: {log.recipient}
                              </p>
                            </div>
                          </div>

                          {log.message && (
                            <div className="mt-2 p-3 bg-muted/50 rounded text-sm text-foreground">
                              {log.message.length > 200
                                ? `${log.message.substring(0, 200)}...`
                                : log.message}
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                            {log.sentAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>أرسل: {formatDate(log.sentAt)}</span>
                              </div>
                            )}
                            {log.deliveredAt && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span>سلم: {formatDate(log.deliveredAt)}</span>
                              </div>
                            )}
                            {log.readAt && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Eye className="w-3 h-3" />
                                <span>قرأ: {formatDate(log.readAt)}</span>
                              </div>
                            )}
                            {log.retryCount > 0 && (
                              <div className="flex items-center gap-1">
                                <RotateCw className="w-3 h-3" />
                                <span>محاولات: {log.retryCount}</span>
                              </div>
                            )}
                          </div>

                          {log.errorMessage && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{log.errorMessage}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mr-4">
                          {log.status === 'failed' && (
                            <SimpleButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(log.id)}
                              disabled={retrying === log.id}
                              title="إعادة المحاولة"
                            >
                              <RotateCw className={`w-4 h-4 ${retrying === log.id ? 'animate-spin' : ''}`} />
                            </SimpleButton>
                          )}
                          <SimpleButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEntity(log)}
                            title="عرض الكيان"
                          >
                            <Eye className="w-4 h-4" />
                          </SimpleButton>
                          <SimpleButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            title="عرض التفاصيل"
                          >
                            <FileText className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    عرض {pagination.offset + 1} إلى {Math.min(pagination.offset + pagination.limit, pagination.total)} من {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                      disabled={pagination.offset === 0}
                    >
                      السابق
                    </SimpleButton>
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                      disabled={!pagination.hasMore}
                    >
                      التالي
                    </SimpleButton>
                  </div>
                </div>
              )}
            </>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* Message Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">تفاصيل الرسالة</h2>
                <SimpleButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                >
                  <XCircle className="w-5 h-5" />
                </SimpleButton>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">القناة</label>
                    <p className="text-gray-900">{getChannelLabel(selectedLog.channel)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">الحالة</label>
                    <div className="mt-1">
                      <MessageStatusBadge status={selectedLog.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">المستلم</label>
                    <p className="text-gray-900">{selectedLog.recipient}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">الكيان</label>
                    <p className="text-gray-900">
                      {getEntityLabel(selectedLog.entityType)} #{selectedLog.entityId}
                    </p>
                  </div>
                  {selectedLog.sentAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">وقت الإرسال</label>
                      <p className="text-gray-900">{formatDate(selectedLog.sentAt)}</p>
                    </div>
                  )}
                  {selectedLog.deliveredAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">وقت التسليم</label>
                      <p className="text-gray-900">{formatDate(selectedLog.deliveredAt)}</p>
                    </div>
                  )}
                </div>

                {selectedLog.message && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">الرسالة</label>
                    <div className="mt-1 p-3 bg-muted/50 rounded text-sm text-foreground whitespace-pre-wrap">
                      {selectedLog.message}
                    </div>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">رسالة الخطأ</label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">بيانات إضافية</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <SimpleButton
                  variant="outline"
                  onClick={() => handleViewEntity(selectedLog)}
                >
                  <Eye className="w-4 h-4 ml-2" />
                  عرض الكيان
                </SimpleButton>
                {selectedLog.status === 'failed' && (
                  <SimpleButton
                    onClick={() => {
                      handleRetry(selectedLog.id);
                      setSelectedLog(null);
                    }}
                    disabled={retrying === selectedLog.id}
                  >
                    <RotateCw className={`w-4 h-4 ml-2 ${retrying === selectedLog.id ? 'animate-spin' : ''}`} />
                    إعادة المحاولة
                  </SimpleButton>
                )}
                <SimpleButton
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                >
                  إغلاق
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingCenterPage;

