/**
 * ⚡ مكون العمليات المجمعة للمدفوعات
 * 
 * يتيح للمستخدم إجراء عمليات مجمعة على المدفوعات
 * مثل: حذف متعدد، تصدير متعدد، تحديث حالة متعدد
 */

import React, { useState } from 'react';
import { Trash2, Download, Edit, Send, AlertCircle } from 'lucide-react';

const BulkOperations = ({ 
  selectedPayments = [], 
  onBulkDelete, 
  onBulkExport, 
  onBulkUpdate, 
  onBulkSendReminders,
  onClearSelection 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [operation, setOperation] = useState('');

  // إجراء عملية مجمعة
  const handleBulkOperation = async (operationType) => {
    if (selectedPayments.length === 0) {
      alert('يرجى اختيار مدفوعات أولاً');
      return;
    }

    setOperation(operationType);
    setShowConfirmDialog(true);
  };

  // تأكيد العملية
  const confirmOperation = async () => {
    setIsLoading(true);
    
    try {
      switch (operation) {
        case 'delete':
          await onBulkDelete(selectedPayments);
          break;
        case 'export':
          await onBulkExport(selectedPayments);
          break;
        case 'update':
          await onBulkUpdate(selectedPayments);
          break;
        case 'reminders':
          await onBulkSendReminders(selectedPayments);
          break;
        default:
          break;
      }
      
      onClearSelection();
    } catch (error) {
      console.error('خطأ في العملية المجمعة:', error);
      alert('حدث خطأ في العملية المجمعة');
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // إلغاء العملية
  const cancelOperation = () => {
    setShowConfirmDialog(false);
    setOperation('');
  };

  // الحصول على نص العملية
  const getOperationText = (operationType) => {
    switch (operationType) {
      case 'delete':
        return 'حذف المدفوعات المحددة';
      case 'export':
        return 'تصدير المدفوعات المحددة';
      case 'update':
        return 'تحديث المدفوعات المحددة';
      case 'reminders':
        return 'إرسال تذكيرات للمدفوعات المحددة';
      default:
        return 'العملية المجمعة';
    }
  };

  // إذا لم يتم اختيار أي مدفوعات
  if (selectedPayments.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <span className="text-blue-800 font-medium">
            تم اختيار {selectedPayments.length} مدفوعة
          </span>
        </div>
        
        <button
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          إلغاء الاختيار
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* حذف متعدد */}
        <button
          onClick={() => handleBulkOperation('delete')}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4 w-4" />
          <span>حذف المحدد</span>
        </button>

        {/* تصدير متعدد */}
        <button
          onClick={() => handleBulkOperation('export')}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          <span>تصدير المحدد</span>
        </button>

        {/* تحديث متعدد */}
        <button
          onClick={() => handleBulkOperation('update')}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Edit className="h-4 w-4" />
          <span>تحديث المحدد</span>
        </button>

        {/* إرسال تذكيرات متعدد */}
        <button
          onClick={() => handleBulkOperation('reminders')}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          <span>إرسال تذكيرات</span>
        </button>
      </div>

      {/* نافذة التأكيد */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              تأكيد العملية المجمعة
            </h3>
            
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من {getOperationText(operation)}؟
              <br />
              <span className="text-sm text-gray-500">
                سيتم تطبيق العملية على {selectedPayments.length} مدفوعة
              </span>
            </p>

            <div className="flex space-x-3">
              <button
                onClick={confirmOperation}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {isLoading ? 'جاري التنفيذ...' : 'تأكيد'}
              </button>
              
              <button
                onClick={cancelOperation}
                disabled={isLoading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperations;


