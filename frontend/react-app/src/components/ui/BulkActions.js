import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Trash2, 
  Edit, 
  Download, 
  Send, 
  Printer, 
  UserCheck,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

const BulkActions = ({ 
  selectedItems = [], 
  totalItems = 0,
  onSelectAll,
  onClearSelection,
  actions = [],
  className = '' 
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalItems;

  // أيقونات الإجراءات
  const actionIcons = {
    delete: Trash2,
    edit: Edit,
    download: Download,
    export: Download,
    send: Send,
    print: Printer,
    assign: UserCheck,
    approve: Check,
    reject: X,
    archive: Trash2
  };

  // ألوان الإجراءات
  const actionColors = {
    delete: 'text-red-600 hover:text-red-800 hover:bg-red-50',
    edit: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    download: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    export: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    send: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    print: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
    assign: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50',
    approve: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    reject: 'text-red-600 hover:text-red-800 hover:bg-red-50',
    archive: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  const handleAction = (action) => {
    if (action.requiresConfirmation) {
      setShowConfirmDialog(action);
    } else {
      action.handler(selectedItems);
      setIsActionsOpen(false);
    }
  };

  const confirmAction = () => {
    if (showConfirmDialog) {
      showConfirmDialog.handler(selectedItems);
      setShowConfirmDialog(null);
      setIsActionsOpen(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      {/* شريط الإجراءات المجمعة */}
      <div className={`
        fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-lg shadow-lg px-4 py-3 min-w-80
        animate-in slide-in-from-bottom-4 duration-300
        ${className}
      `}>
        <div className="flex items-center justify-between gap-4">
          {/* معلومات التحديد */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isPartiallySelected;
                }}
                onChange={handleSelectAll}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {selectedCount} محدد
              </span>
              {totalItems > 0 && (
                <span className="text-gray-500 dark:text-gray-400 mr-1">
                  من {totalItems}
                </span>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2">
            {/* إجراءات سريعة (أول 3 إجراءات) */}
            {actions.slice(0, 3).map((action) => {
              const ActionIcon = actionIcons[action.type] || Edit;
              const colorClass = actionColors[action.type] || 'text-gray-600 hover:text-gray-800 hover:bg-gray-50';
              
              return (
                <button
                  key={action.key}
                  onClick={() => handleAction(action)}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
                    transition-colors duration-200 ${colorClass}
                  `}
                  title={action.label}
                >
                  <ActionIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              );
            })}

            {/* قائمة الإجراءات الإضافية */}
            {actions.length > 3 && (
              <div className="relative">
                <button
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  المزيد
                  <ChevronDown className={`w-4 h-4 transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isActionsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsActionsOpen(false)}
                    />
                    <div className="absolute bottom-full mb-2 left-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      {actions.slice(3).map((action) => {
                        const ActionIcon = actionIcons[action.type] || Edit;
                        const colorClass = actionColors[action.type] || 'text-gray-600 hover:text-gray-800 hover:bg-gray-50';
                        
                        return (
                          <button
                            key={action.key}
                            onClick={() => handleAction(action)}
                            className={`
                              flex items-center gap-3 w-full px-4 py-3 text-sm text-right
                              transition-colors duration-200 ${colorClass}
                              first:rounded-t-lg last:rounded-b-lg
                            `}
                          >
                            <ActionIcon className="w-4 h-4" />
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* زر إلغاء التحديد */}
            <button
              onClick={onClearSelection}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">إلغاء</span>
            </button>
          </div>
        </div>
      </div>

      {/* نافذة التأكيد */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                تأكيد الإجراء
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {showConfirmDialog.confirmMessage || 
                `هل أنت متأكد من تنفيذ "${showConfirmDialog.label}" على ${selectedCount} عنصر؟`}
            </p>
            
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmAction}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                  ${showConfirmDialog.type === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >
                {showConfirmDialog.confirmLabel || 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;
