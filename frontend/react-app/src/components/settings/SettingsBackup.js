// frontend/react-app/src/components/settings/SettingsBackup.js
import React, { useEffect, useState } from 'react';
import { useSettingsBackup } from '../../hooks/useSettingsBackup';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import LoadingSpinner from '../ui/LoadingSpinner';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Calendar, 
  User,
  AlertCircle 
} from 'lucide-react';
import { 
  Modal as ModalWrapper,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter
} from '../ui/Modal';

/**
 * Settings Backup Component
 * Manages settings backups
 */
export const SettingsBackup = () => {
  const {
    backups,
    loading,
    error,
    loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup
  } = useSettingsBackup();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreOptions, setRestoreOptions] = useState({
    overwriteExisting: true,
    skipSystemSettings: true
  });

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      alert('يرجى إدخال اسم النسخة الاحتياطية');
      return;
    }

    try {
      await createBackup(backupName, backupDescription);
      setIsCreateModalOpen(false);
      setBackupName('');
      setBackupDescription('');
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    try {
      await restoreBackup(selectedBackup.id, restoreOptions);
      setIsRestoreModalOpen(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      try {
        await deleteBackup(id);
      } catch (error) {
        console.error('Failed to delete backup:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">النسخ الاحتياطية</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة النسخ الاحتياطية للإعدادات</p>
        </div>
        <SimpleButton onClick={() => setIsCreateModalOpen(true)}>
          <Save className="h-4 w-4 mr-2" />
          إنشاء نسخة احتياطية
        </SimpleButton>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Backups List */}
      {!loading && backups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {backups.map((backup) => (
            <SimpleCard key={backup.id}>
              <SimpleCardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <SimpleCardTitle className="text-base">{backup.name}</SimpleCardTitle>
                    {backup.description && (
                      <p className="text-sm text-gray-500 mt-1">{backup.description}</p>
                    )}
                  </div>
                </div>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(backup.createdAt).toLocaleString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{backup.createdByName || 'غير معروف'}</span>
                  </div>
                  {backup.settings && Array.isArray(backup.settings) && (
                    <div className="text-xs text-gray-500">
                      {backup.settings.length} إعداد
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <SimpleButton
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBackup(backup);
                      setIsRestoreModalOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    استعادة
                  </SimpleButton>
                  <SimpleButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(backup.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </SimpleButton>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && backups.length === 0 && (
        <SimpleCard>
          <SimpleCardContent className="text-center py-12">
            <Save className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">لا توجد نسخ احتياطية</p>
            <SimpleButton onClick={() => setIsCreateModalOpen(true)}>
              إنشاء أول نسخة احتياطية
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Create Backup Modal */}
      <ModalWrapper isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>إنشاء نسخة احتياطية</ModalTitle>
            <ModalDescription>
              سيتم حفظ جميع الإعدادات الحالية في نسخة احتياطية
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم النسخة الاحتياطية *</label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="مثال: Backup قبل التحديث"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الوصف (اختياري)</label>
              <Textarea
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="وصف النسخة الاحتياطية..."
                rows={3}
              />
            </div>
          </div>
          <ModalFooter>
            <SimpleButton variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              إلغاء
            </SimpleButton>
            <SimpleButton onClick={handleCreateBackup}>
              <Save className="h-4 w-4 mr-2" />
              إنشاء
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </ModalWrapper>

      {/* Restore Backup Modal */}
      <ModalWrapper isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>استعادة نسخة احتياطية</ModalTitle>
            <ModalDescription>
              {selectedBackup && `استعادة: ${selectedBackup.name}`}
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.overwriteExisting}
                  onChange={(e) =>
                    setRestoreOptions({ ...restoreOptions, overwriteExisting: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">الكتابة فوق الإعدادات الموجودة</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.skipSystemSettings}
                  onChange={(e) =>
                    setRestoreOptions({ ...restoreOptions, skipSystemSettings: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">تخطي إعدادات النظام</span>
              </label>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ تحذير: سيتم استبدال الإعدادات الحالية بالإعدادات من النسخة الاحتياطية
              </p>
            </div>
          </div>
          <ModalFooter>
            <SimpleButton variant="outline" onClick={() => setIsRestoreModalOpen(false)}>
              إلغاء
            </SimpleButton>
            <SimpleButton onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
              <Upload className="h-4 w-4 mr-2" />
              استعادة
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </ModalWrapper>
    </div>
  );
};

