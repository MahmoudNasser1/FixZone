// frontend/react-app/src/components/settings/DatabaseBackup.js
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
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
  AlertCircle,
  Database,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { 
  Modal as ModalWrapper,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter
} from '../ui/Modal';
import { useNotifications } from '../../components/notifications/NotificationSystem';

/**
 * Database Backup Component
 * Manages database backups
 */
export const DatabaseBackup = () => {
  const notifications = useNotifications();
  const [backups, setBackups] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreOptions, setRestoreOptions] = useState({
    dropDatabase: false,
    createDatabase: true
  });

  // Auto backup settings
  const [autoBackupSettings, setAutoBackupSettings] = useState({
    dailyEnabled: false,
    dailyTime: '02:00',
    weeklyEnabled: false,
    weeklyDay: 0,
    weeklyTime: '01:00',
    keepDays: 30
  });
  const [loadingAutoSettings, setLoadingAutoSettings] = useState(false);

  useEffect(() => {
    loadBackups();
    loadStatistics();
    loadAutoBackupSettings();
  }, []);

  const loadAutoBackupSettings = async () => {
    try {
      setLoadingAutoSettings(true);
      const response = await api.getAutoBackupSettings();
      if (response.success && response.data) {
        setAutoBackupSettings({
          dailyEnabled: response.data.dailyEnabled || false,
          dailyTime: response.data.dailyTime || '02:00',
          weeklyEnabled: response.data.weeklyEnabled || false,
          weeklyDay: response.data.weeklyDay || 0,
          weeklyTime: response.data.weeklyTime || '01:00',
          keepDays: response.data.keepDays || 30
        });
      }
    } catch (err) {
      console.error('Failed to load auto backup settings:', err);
    } finally {
      setLoadingAutoSettings(false);
    }
  };

  const handleUpdateAutoBackupSettings = async () => {
    try {
      setLoadingAutoSettings(true);
      const response = await api.updateAutoBackupSettings(autoBackupSettings);
      if (response.success) {
        notifications.success('نجح', { message: 'تم تحديث إعدادات النسخ التلقائي بنجاح' });
        await loadAutoBackupSettings();
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to update settings';
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoadingAutoSettings(false);
    }
  };

  const handleTestBackup = async (type) => {
    try {
      setLoading(true);
      const response = await api.testAutoBackup(type);
      if (response.success) {
        notifications.success('نجح', { message: `تم اختبار النسخ ${type === 'daily' ? 'اليومي' : 'الأسبوعي'} بنجاح` });
        await loadBackups();
        await loadStatistics();
      } else {
        throw new Error(response.message || 'Failed to test backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to test backup';
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listDatabaseBackups();
      if (response.success) {
        setBackups(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load backups');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load backups';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.getDatabaseBackupStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال اسم النسخة الاحتياطية' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.createDatabaseBackup(backupName, backupDescription, {
        compress: true,
        includeData: true,
        includeStructure: true
      });

      if (response.success) {
        notifications.success('نجح', { message: 'تم إنشاء النسخة الاحتياطية بنجاح' });
        setIsCreateModalOpen(false);
        setBackupName('');
        setBackupDescription('');
        await loadBackups();
        await loadStatistics();
      } else {
        throw new Error(response.message || 'Failed to create backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create backup';
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    if (!window.confirm('⚠️ تحذير: سيتم استبدال قاعدة البيانات الحالية بالنسخة الاحتياطية. هل أنت متأكد؟')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.restoreDatabaseBackup(selectedBackup.id, restoreOptions);

      if (response.success) {
        notifications.success('نجح', { message: 'تم استعادة النسخة الاحتياطية بنجاح' });
        setIsRestoreModalOpen(false);
        setSelectedBackup(null);
        await loadBackups();
      } else {
        throw new Error(response.message || 'Failed to restore backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to restore backup';
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.deleteDatabaseBackup(id);

      if (response.success) {
        notifications.success('نجح', { message: 'تم حذف النسخة الاحتياطية بنجاح' });
        await loadBackups();
        await loadStatistics();
      } else {
        throw new Error(response.message || 'Failed to delete backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete backup';
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('هل تريد حذف النسخ الاحتياطية الأقدم من 30 يوم؟')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.cleanupOldDatabaseBackups(30);

      if (response.success) {
        notifications.success('نجح', { message: response.message || 'تم تنظيف النسخ القديمة' });
        await loadBackups();
        await loadStatistics();
      } else {
        throw new Error(response.message || 'Failed to cleanup backups');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to cleanup backups';
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-6 w-6" />
            النسخ الاحتياطي لقاعدة البيانات
          </h2>
          <p className="text-sm text-gray-500 mt-1">إدارة النسخ الاحتياطية لقاعدة البيانات</p>
        </div>
        <div className="flex gap-2">
          <SimpleButton onClick={handleCleanup} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            تنظيف القديمة
          </SimpleButton>
          <SimpleButton onClick={() => setIsCreateModalOpen(true)} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            إنشاء نسخة احتياطية
          </SimpleButton>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <SimpleCard>
          <SimpleCardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              <SimpleCardTitle>الإحصائيات</SimpleCardTitle>
            </div>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">إجمالي النسخ</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الحجم الإجمالي</p>
                <p className="text-2xl font-bold">{statistics.totalSizeMB} MB</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">أقدم نسخة</p>
                <p className="text-sm font-medium">
                  {statistics.oldest ? new Date(statistics.oldest).toLocaleDateString('ar-EG') : 'لا يوجد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">أحدث نسخة</p>
                <p className="text-sm font-medium">
                  {statistics.newest ? new Date(statistics.newest).toLocaleDateString('ar-EG') : 'لا يوجد'}
                </p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Auto Backup Settings */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-gray-500" />
            <SimpleCardTitle>النسخ التلقائي</SimpleCardTitle>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="space-y-6">
            {/* Daily Backup */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">النسخ اليومي</h3>
                  <p className="text-sm text-gray-500">نسخة احتياطية تلقائية كل يوم</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoBackupSettings.dailyEnabled}
                    onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, dailyEnabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">تفعيل</span>
                </label>
              </div>
              {autoBackupSettings.dailyEnabled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">الوقت</label>
                  <Input
                    type="time"
                    value={autoBackupSettings.dailyTime}
                    onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, dailyTime: e.target.value })}
                    className="w-32"
                  />
                </div>
              )}
              {autoBackupSettings.dailyEnabled && (
                <div className="mt-3">
                  <SimpleButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestBackup('daily')}
                    disabled={loading}
                  >
                    اختبار النسخ اليومي
                  </SimpleButton>
                </div>
              )}
            </div>

            {/* Weekly Backup */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">النسخ الأسبوعي</h3>
                  <p className="text-sm text-gray-500">نسخة احتياطية تلقائية كل أسبوع</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoBackupSettings.weeklyEnabled}
                    onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, weeklyEnabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">تفعيل</span>
                </label>
              </div>
              {autoBackupSettings.weeklyEnabled && (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">اليوم</label>
                      <select
                        value={autoBackupSettings.weeklyDay}
                        onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, weeklyDay: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="0">الأحد</option>
                        <option value="1">الإثنين</option>
                        <option value="2">الثلاثاء</option>
                        <option value="3">الأربعاء</option>
                        <option value="4">الخميس</option>
                        <option value="5">الجمعة</option>
                        <option value="6">السبت</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الوقت</label>
                      <Input
                        type="time"
                        value={autoBackupSettings.weeklyTime}
                        onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, weeklyTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <SimpleButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestBackup('weekly')}
                      disabled={loading}
                    >
                      اختبار النسخ الأسبوعي
                    </SimpleButton>
                  </div>
                </>
              )}
            </div>

            {/* Keep Days */}
            <div>
              <label className="block text-sm font-medium mb-1">احتفظ بالنسخ لمدة (يوم)</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={autoBackupSettings.keepDays}
                onChange={(e) => setAutoBackupSettings({ ...autoBackupSettings, keepDays: parseInt(e.target.value) || 30 })}
                className="w-32"
              />
              <p className="text-xs text-gray-500 mt-1">النسخ الأقدم من هذا العدد سيتم حذفها تلقائياً</p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <SimpleButton
                onClick={handleUpdateAutoBackupSettings}
                disabled={loadingAutoSettings}
              >
                {loadingAutoSettings ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    حفظ الإعدادات
                  </>
                )}
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

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
                  {backup.createdBy && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{backup.createdByName || 'نظام'}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    الحجم: {backup.sizeMB} MB
                  </div>
                  <div className="text-xs text-gray-500">
                    النوع: {backup.type === 'full' ? 'كامل' : 'جزئي'}
                  </div>
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
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
            <ModalTitle>إنشاء نسخة احتياطية لقاعدة البيانات</ModalTitle>
            <ModalDescription>
              سيتم حفظ جميع بيانات قاعدة البيانات في نسخة احتياطية
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
            <SimpleButton onClick={handleCreateBackup} disabled={loading}>
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
                  checked={restoreOptions.dropDatabase}
                  onChange={(e) =>
                    setRestoreOptions({ ...restoreOptions, dropDatabase: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">حذف قاعدة البيانات الحالية قبل الاستعادة</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.createDatabase}
                  onChange={(e) =>
                    setRestoreOptions({ ...restoreOptions, createDatabase: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">إنشاء قاعدة البيانات إذا لم تكن موجودة</span>
              </label>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                ⚠️ تحذير: سيتم استبدال قاعدة البيانات الحالية بالنسخة الاحتياطية. هذا الإجراء لا يمكن التراجع عنه!
              </p>
            </div>
          </div>
          <ModalFooter>
            <SimpleButton variant="outline" onClick={() => setIsRestoreModalOpen(false)}>
              إلغاء
            </SimpleButton>
            <SimpleButton onClick={handleRestore} className="bg-red-600 hover:bg-red-700" disabled={loading}>
              <Upload className="h-4 w-4 mr-2" />
              استعادة
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </ModalWrapper>
    </div>
  );
};

