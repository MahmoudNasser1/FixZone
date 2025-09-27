import React, { useState } from 'react';
import SimpleButton from '../ui/SimpleButton';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import { useNotifications } from '../notifications/NotificationSystem';
import { 
  Trash2, Download, Send, Edit, CheckCircle, 
  AlertTriangle, X, FileText, Mail
} from 'lucide-react';

const BulkOperations = ({ 
  selectedItems = [], 
  onClearSelection, 
  onBulkDelete,
  onBulkExport,
  onBulkSendReminder,
  onBulkUpdateStatus,
  itemType = 'payments' // payments, invoices, etc.
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      addNotification('يرجى اختيار عناصر أولاً', 'warning');
      return;
    }

    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const executeBulkAction = async () => {
    try {
      setLoading(true);
      
      switch (confirmAction?.type) {
        case 'delete':
          await onBulkDelete(selectedItems);
          addNotification(`تم حذف ${selectedItems.length} عنصر بنجاح`, 'success');
          break;
          
        case 'export':
          await onBulkExport(selectedItems, confirmAction.format);
          addNotification(`تم تصدير ${selectedItems.length} عنصر بنجاح`, 'success');
          break;
          
        case 'send_reminder':
          await onBulkSendReminder(selectedItems);
          addNotification(`تم إرسال التذكير لـ ${selectedItems.length} عنصر`, 'success');
          break;
          
        case 'update_status':
          await onBulkUpdateStatus(selectedItems, confirmAction.status);
          addNotification(`تم تحديث حالة ${selectedItems.length} عنصر`, 'success');
          break;
          
        default:
          break;
      }
      
      onClearSelection();
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Bulk operation error:', error);
      addNotification('فشل في تنفيذ العملية المجمعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type) => {
    const icons = {
      delete: Trash2,
      export: Download,
      send_reminder: Send,
      update_status: Edit
    };
    const Icon = icons[type] || CheckCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getActionColor = (type) => {
    const colors = {
      delete: 'bg-red-600 hover:bg-red-700',
      export: 'bg-green-600 hover:bg-green-700',
      send_reminder: 'bg-blue-600 hover:bg-blue-700',
      update_status: 'bg-yellow-600 hover:bg-yellow-700'
    };
    return colors[type] || 'bg-gray-600 hover:bg-gray-700';
  };

  const getItemTypeLabel = () => {
    const labels = {
      payments: 'مدفوعة',
      invoices: 'فاتورة',
      customers: 'عميل',
      repairs: 'طلب إصلاح'
    };
    return labels[itemType] || 'عنصر';
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <SimpleCard className="bg-blue-50 border-blue-200 sticky bottom-4 z-10 shadow-lg">
        <SimpleCardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm font-medium text-blue-700">
                تم اختيار {selectedItems.length} {getItemTypeLabel()}
              </span>
              <SimpleButton
                size="sm"
                variant="outline"
                onClick={onClearSelection}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <X className="w-4 h-4 ml-1" />
                إلغاء الاختيار
              </SimpleButton>
            </div>

            <div className="flex space-x-2 space-x-reverse">
              {/* Export Options */}
              <div className="relative inline-block">
                <SimpleButton
                  size="sm"
                  onClick={() => handleBulkAction({ type: 'export', format: 'pdf' })}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 ml-1" />
                  تصدير PDF
                </SimpleButton>
              </div>

              <SimpleButton
                size="sm"
                onClick={() => handleBulkAction({ type: 'export', format: 'excel' })}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4 ml-1" />
                تصدير Excel
              </SimpleButton>

              {/* Send Reminder (for payments/invoices) */}
              {(itemType === 'payments' || itemType === 'invoices') && (
                <SimpleButton
                  size="sm"
                  onClick={() => handleBulkAction({ type: 'send_reminder' })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 ml-1" />
                  إرسال تذكير
                </SimpleButton>
              )}

              {/* Status Update */}
              <div className="relative inline-block">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAction({ type: 'update_status', status: e.target.value });
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">تحديث الحالة</option>
                  {itemType === 'payments' && (
                    <>
                      <option value="pending">في الانتظار</option>
                      <option value="completed">مكتملة</option>
                      <option value="cancelled">ملغية</option>
                    </>
                  )}
                  {itemType === 'invoices' && (
                    <>
                      <option value="draft">مسودة</option>
                      <option value="sent">مرسلة</option>
                      <option value="paid">مدفوعة</option>
                      <option value="overdue">متأخرة</option>
                    </>
                  )}
                </select>
              </div>

              {/* Delete */}
              <SimpleButton
                size="sm"
                onClick={() => handleBulkAction({ type: 'delete' })}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className={`p-2 rounded-full ${
                confirmAction?.type === 'delete' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {confirmAction?.type === 'delete' ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  getActionIcon(confirmAction?.type)
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                تأكيد العملية
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              {confirmAction?.type === 'delete' && 
                `هل أنت متأكد من حذف ${selectedItems.length} ${getItemTypeLabel()}؟ هذا الإجراء لا يمكن التراجع عنه.`
              }
              {confirmAction?.type === 'export' && 
                `سيتم تصدير ${selectedItems.length} ${getItemTypeLabel()} بصيغة ${confirmAction.format.toUpperCase()}.`
              }
              {confirmAction?.type === 'send_reminder' && 
                `سيتم إرسال تذكير لـ ${selectedItems.length} ${getItemTypeLabel()}.`
              }
              {confirmAction?.type === 'update_status' && 
                `سيتم تحديث حالة ${selectedItems.length} ${getItemTypeLabel()} إلى "${confirmAction.status}".`
              }
            </p>

            <div className="flex space-x-3 space-x-reverse">
              <SimpleButton
                onClick={executeBulkAction}
                disabled={loading}
                className={`${getActionColor(confirmAction?.type)} ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                ) : (
                  getActionIcon(confirmAction?.type)
                )}
                <span className="ml-2">
                  {confirmAction?.type === 'delete' && 'حذف'}
                  {confirmAction?.type === 'export' && 'تصدير'}
                  {confirmAction?.type === 'send_reminder' && 'إرسال'}
                  {confirmAction?.type === 'update_status' && 'تحديث'}
                </span>
              </SimpleButton>
              
              <SimpleButton
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                disabled={loading}
              >
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkOperations;


