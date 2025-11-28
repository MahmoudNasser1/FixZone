// frontend/react-app/src/components/settings/SettingsHistory.js
import React, { useEffect } from 'react';
import { useSettingsHistory } from '../../hooks/useSettingsHistory';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { History, RotateCcw, Calendar, User } from 'lucide-react';

/**
 * Settings History Component
 * Displays history of changes for a setting
 */
export const SettingsHistory = ({ settingKey, onRollback }) => {
  const { history, loading, error, loadHistory, rollback } = useSettingsHistory(settingKey);

  useEffect(() => {
    if (settingKey) {
      loadHistory(settingKey);
    }
  }, [settingKey, loadHistory]);

  const handleRollback = async (historyId) => {
    if (window.confirm('هل أنت متأكد من التراجع عن هذا التغيير؟')) {
      try {
        await rollback(settingKey, historyId);
        if (onRollback) {
          onRollback();
        }
      } catch (error) {
        console.error('Rollback failed:', error);
      }
    }
  };

  if (!settingKey) {
    return (
      <SimpleCard>
        <SimpleCardContent className="text-center py-8">
          <p className="text-gray-500">اختر إعداداً لعرض تاريخه</p>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  return (
    <SimpleCard>
      <SimpleCardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-500" />
          <SimpleCardTitle>تاريخ التغييرات</SimpleCardTitle>
        </div>
      </SimpleCardHeader>
      <SimpleCardContent>
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">لا يوجد تاريخ لهذا الإعداد</p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {item.changedByName || 'مستخدم غير معروف'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                  <SimpleButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleRollback(item.id)}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    تراجع
                  </SimpleButton>
                </div>

                {item.changeReason && (
                  <p className="text-sm text-gray-600 mb-2">{item.changeReason}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">القيمة القديمة:</p>
                    <p className="text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                      {item.oldValue !== null ? String(item.oldValue).substring(0, 100) : '(فارغ)'}
                      {item.oldValue && String(item.oldValue).length > 100 && '...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">القيمة الجديدة:</p>
                    <p className="text-sm bg-green-50 p-2 rounded border border-green-200 break-all">
                      {String(item.newValue).substring(0, 100)}
                      {String(item.newValue).length > 100 && '...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SimpleCardContent>
    </SimpleCard>
  );
};

