// frontend/react-app/src/components/settings/UnifiedBackup.js
import React, { useEffect, useState } from 'react';
import { useSettingsBackup } from '../../hooks/useSettingsBackup';
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
  RefreshCw,
  Settings,
  Clock,
  CheckCircle2
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
 * Unified Backup Component
 * Combines Settings Backup and Database Backup in one interface
 */
export const UnifiedBackup = () => {
  const notifications = useNotifications();
  const [activeSubTab, setActiveSubTab] = useState('database'); // 'database' or 'settings'
  
  // Settings Backup
  const {
    backups: settingsBackups,
    loading: settingsLoading,
    error: settingsError,
    loadBackups: loadSettingsBackups,
    createBackup: createSettingsBackup,
    restoreBackup: restoreSettingsBackup,
    deleteBackup: deleteSettingsBackup
  } = useSettingsBackup();

  // Database Backup
  const [dbBackups, setDbBackups] = useState([]);
  const [dbStatistics, setDbStatistics] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreOptions, setRestoreOptions] = useState({
    overwriteExisting: true,
    skipSystemSettings: true
  });

  // Auto Backup Settings (Simplified)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupTime, setAutoBackupTime] = useState('02:00');
  const [autoBackupType, setAutoBackupType] = useState('daily'); // 'daily' or 'weekly'
  const [autoBackupDay, setAutoBackupDay] = useState(0); // 0 = Sunday
  const [keepDays, setKeepDays] = useState(30);
  const [autoBackupLoading, setAutoBackupLoading] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'database') {
      loadDatabaseBackups();
      loadDatabaseStatistics();
      loadAutoBackupSettings();
    } else {
      loadSettingsBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]);

  // Database Backup Functions
  const loadDatabaseBackups = async () => {
    try {
      setDbLoading(true);
      setDbError(null);
      const response = await api.listDatabaseBackups();
      if (response.success) {
        // Ensure data is an array (handle both array and object with backups property)
        let backupsData = response.data;
        if (backupsData && !Array.isArray(backupsData)) {
          // If data is an object with backups property, use that
          if (backupsData.backups && Array.isArray(backupsData.backups)) {
            backupsData = backupsData.backups;
          } else {
            // If it's not an array and doesn't have backups property, make it an empty array
            backupsData = [];
          }
        }
        setDbBackups(Array.isArray(backupsData) ? backupsData : []);
      } else {
        throw new Error(response.message || 'Failed to load backups');
      }
    } catch (err) {
      setDbError(err.message);
      notifications.error('خطأ', { message: `فشل تحميل النسخ الاحتياطية: ${err.message}` });
    } finally {
      setDbLoading(false);
    }
  };

  const loadDatabaseStatistics = async () => {
    try {
      const response = await api.getDatabaseBackupStatistics();
      if (response.success) {
        setDbStatistics(response.data);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const loadAutoBackupSettings = async () => {
    try {
      setAutoBackupLoading(true);
      const response = await api.getAutoBackupSettings();
      if (response.success && response.data) {
        setAutoBackupEnabled(response.data.dailyEnabled || response.data.weeklyEnabled || false);
        setAutoBackupTime(response.data.dailyTime || response.data.weeklyTime || '02:00');
        setAutoBackupType(response.data.weeklyEnabled ? 'weekly' : 'daily');
        setAutoBackupDay(response.data.weeklyDay || 0);
        setKeepDays(response.data.daysToKeep || 30);
      }
    } catch (err) {
      console.error('Failed to load auto backup settings:', err);
    } finally {
      setAutoBackupLoading(false);
    }
  };

  const handleSaveAutoBackup = async () => {
    try {
      setAutoBackupLoading(true);
      const settings = {
        dailyEnabled: autoBackupType === 'daily' && autoBackupEnabled,
        dailyTime: autoBackupType === 'daily' ? autoBackupTime : '02:00',
        weeklyEnabled: autoBackupType === 'weekly' && autoBackupEnabled,
        weeklyDay: autoBackupType === 'weekly' ? autoBackupDay : 0,
        weeklyTime: autoBackupType === 'weekly' ? autoBackupTime : '01:00',
        daysToKeep: keepDays
      };

      const response = await api.updateAutoBackupSettings(settings);
      if (response.success) {
        notifications.success('نجح', { message: 'تم حفظ إعدادات النسخ التلقائي' });
        await loadAutoBackupSettings();
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (err) {
      notifications.error('خطأ', { message: `فشل حفظ الإعدادات: ${err.message}` });
    } finally {
      setAutoBackupLoading(false);
    }
  };

  const handleCreateDatabaseBackup = async () => {
    if (!backupName.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال اسم النسخة الاحتياطية' });
      return;
    }

    try {
      setDbLoading(true);
      const response = await api.createDatabaseBackup(backupName, backupDescription);
      if (response.success) {
        notifications.success('نجح', { message: 'تم إنشاء النسخة الاحتياطية بنجاح' });
        setIsCreateModalOpen(false);
        setBackupName('');
        setBackupDescription('');
        await loadDatabaseBackups();
        await loadDatabaseStatistics();
      } else {
        throw new Error(response.message || 'Failed to create backup');
      }
    } catch (err) {
      notifications.error('خطأ', { message: `فشل إنشاء النسخة: ${err.message}` });
    } finally {
      setDbLoading(false);
    }
  };

  const handleCreateSettingsBackup = async () => {
    if (!backupName.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال اسم النسخة الاحتياطية' });
      return;
    }

    try {
      await createSettingsBackup(backupName, backupDescription);
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
      if (activeSubTab === 'database') {
        setDbLoading(true);
        const response = await api.restoreDatabaseBackup(selectedBackup.id, restoreOptions);
        if (response.success) {
          notifications.success('نجح', { message: 'تم استعادة النسخة الاحتياطية بنجاح' });
          setIsRestoreModalOpen(false);
          setSelectedBackup(null);
          await loadDatabaseBackups();
        } else {
          throw new Error(response.message || 'Failed to restore backup');
        }
      } else {
        await restoreSettingsBackup(selectedBackup.id, restoreOptions);
        setIsRestoreModalOpen(false);
        setSelectedBackup(null);
      }
    } catch (err) {
      notifications.error('خطأ', { message: `فشل استعادة النسخة: ${err.message}` });
    } finally {
      setDbLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Validate ID
    if (!id && id !== 0) {
      notifications.error('خطأ', { message: 'معرف النسخة الاحتياطية غير صحيح' });
      return;
    }

    if (!window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      return;
    }

    try {
      if (activeSubTab === 'database') {
        setDbLoading(true);
        // Convert ID to string if needed (API expects string)
        const backupId = String(id);
        const response = await api.deleteDatabaseBackup(backupId);
        if (response.success) {
          notifications.success('نجح', { message: 'تم حذف النسخة الاحتياطية بنجاح' });
          await loadDatabaseBackups();
          await loadDatabaseStatistics();
        } else {
          throw new Error(response.message || 'Failed to delete backup');
        }
      } else {
        await deleteSettingsBackup(id);
      }
    } catch (err) {
      notifications.error('خطأ', { message: `فشل حذف النسخة: ${err.message}` });
    } finally {
      setDbLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Ensure currentBackups is always an array
  const getCurrentBackups = () => {
    const backups = activeSubTab === 'database' ? dbBackups : settingsBackups;
    if (!backups) return [];
    if (Array.isArray(backups)) return backups;
    // If it's an object with backups property, use that
    if (backups.backups && Array.isArray(backups.backups)) return backups.backups;
    // Otherwise, return empty array
    return [];
  };
  
  const currentBackups = getCurrentBackups();
  const currentLoading = activeSubTab === 'database' ? dbLoading : settingsLoading;
  const currentError = activeSubTab === 'database' ? dbError : settingsError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-6 w-6" />
            النسخ الاحتياطي
          </h2>
          <p className="text-sm text-gray-500 mt-1">إدارة النسخ الاحتياطية للإعدادات وقاعدة البيانات</p>
        </div>
        <SimpleButton 
          onClick={() => setIsCreateModalOpen(true)} 
          disabled={currentLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          إنشاء نسخة احتياطية
        </SimpleButton>
      </div>

      {/* Sub Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveSubTab('database')}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${activeSubTab === 'database'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Database className="h-4 w-4 inline mr-2" />
            قاعدة البيانات
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${activeSubTab === 'settings'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            الإعدادات
          </button>
        </nav>
      </div>

      {/* Database Statistics (only for database tab) */}
      {activeSubTab === 'database' && dbStatistics && (
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
                <p className="text-2xl font-bold">{dbStatistics.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الحجم الإجمالي</p>
                <p className="text-2xl font-bold">{dbStatistics.totalSizeMB || 0} MB</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">أقدم نسخة</p>
                <p className="text-sm font-medium">
                  {dbStatistics.oldest ? formatDate(dbStatistics.oldest) : 'لا يوجد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">أحدث نسخة</p>
                <p className="text-sm font-medium">
                  {dbStatistics.newest ? formatDate(dbStatistics.newest) : 'لا يوجد'}
                </p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Auto Backup Settings (Simplified - only for database tab) */}
      {activeSubTab === 'database' && (
        <SimpleCard>
          <SimpleCardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <SimpleCardTitle>النسخ التلقائي</SimpleCardTitle>
            </div>
          </SimpleCardHeader>
          <SimpleCardContent>
            {autoBackupLoading && <LoadingSpinner />}
            <div className="space-y-4">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                      className="h-5 w-5 text-green-600"
                    />
                    <span className="font-medium">تفعيل النسخ التلقائي</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">إنشاء نسخ احتياطية تلقائية بشكل دوري</p>
                </div>
                {autoBackupEnabled && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
              </div>

              {/* Settings (only shown when enabled) */}
              {autoBackupEnabled && (
                <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">نوع النسخ</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="backupType"
                          value="daily"
                          checked={autoBackupType === 'daily'}
                          onChange={(e) => setAutoBackupType(e.target.value)}
                          className="h-4 w-4"
                        />
                        <span>يومي</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="backupType"
                          value="weekly"
                          checked={autoBackupType === 'weekly'}
                          onChange={(e) => setAutoBackupType(e.target.value)}
                          className="h-4 w-4"
                        />
                        <span>أسبوعي</span>
                      </label>
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2">الوقت</label>
                    <Input
                      type="time"
                      value={autoBackupTime}
                      onChange={(e) => setAutoBackupTime(e.target.value)}
                      className="w-40"
                    />
                  </div>

                  {/* Day (only for weekly) */}
                  {autoBackupType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">اليوم</label>
                      <select
                        value={autoBackupDay}
                        onChange={(e) => setAutoBackupDay(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="0">الأحد</option>
                        <option value="1">الاثنين</option>
                        <option value="2">الثلاثاء</option>
                        <option value="3">الأربعاء</option>
                        <option value="4">الخميس</option>
                        <option value="5">الجمعة</option>
                        <option value="6">السبت</option>
                      </select>
                    </div>
                  )}

                  {/* Keep Days */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      الاحتفاظ بالنسخ لمدة (أيام)
                    </label>
                    <Input
                      type="number"
                      value={keepDays}
                      onChange={(e) => setKeepDays(Math.max(1, parseInt(e.target.value) || 30))}
                      min="1"
                      className="w-32"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <SimpleButton onClick={handleSaveAutoBackup} disabled={autoBackupLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      حفظ الإعدادات
                    </SimpleButton>
                  </div>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Backups List */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>
            {activeSubTab === 'database' ? 'نسخ قاعدة البيانات' : 'نسخ الإعدادات'}
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {currentLoading && <LoadingSpinner />}
          {currentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600">{currentError}</p>
              </div>
            </div>
          )}
          {!currentLoading && currentBackups && currentBackups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد نسخ احتياطية</p>
            </div>
          )}
          {!currentLoading && currentBackups && Array.isArray(currentBackups) && currentBackups.length > 0 && (
            <div className="space-y-3">
              {currentBackups.map((backup, index) => {
                // Ensure backup is an object, not an array or other type
                if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('Invalid backup object at index', index, backup);
                  }
                  return null;
                }
                // Additional check: if backup has a 'backups' property, it's likely the wrong structure
                if (backup.backups && Array.isArray(backup.backups)) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('Backup object has nested backups array at index', index, backup);
                  }
                  return null;
                }
                return (
                <div
                  key={backup.id || backup.filename || `backup-${index}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-gray-400" />
                      <h3 className="font-medium">
                        {backup.name || backup.description || (backup.id ? `نسخة #${backup.id}` : 'نسخة غير معروفة')}
                      </h3>
                    </div>
                    {backup.description && (
                      <p className="text-sm text-gray-500 mt-1">{backup.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(backup.createdAt)}
                      </span>
                      {backup.size && (
                        <span>{formatSize(backup.size)}</span>
                      )}
                      {backup.createdBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {backup.createdBy}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setIsRestoreModalOpen(true);
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      استعادة
                    </SimpleButton>
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Try multiple ways to get the backup ID
                        const backupId = backup.id || 
                                        backup.filename || 
                                        backup.metadata?.id ||
                                        (backup.metadata && backup.metadata.id) ||
                                        (typeof backup === 'string' ? backup : null);
                        
                        if (backupId !== undefined && backupId !== null && backupId !== '') {
                          handleDelete(backupId);
                        } else {
                          // Log backup object for debugging (but only in development)
                          if (process.env.NODE_ENV === 'development') {
                            console.error('Backup object structure:', {
                              id: backup?.id,
                              filename: backup?.filename,
                              name: backup?.name,
                              fullObject: backup
                            });
                          }
                          notifications.error('خطأ', { message: 'معرف النسخة الاحتياطية غير موجود' });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      حذف
                    </SimpleButton>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* Create Backup Modal */}
      <ModalWrapper 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="إنشاء نسخة احتياطية"
        description={activeSubTab === 'database' 
          ? 'إنشاء نسخة احتياطية كاملة لقاعدة البيانات (سيتم تنظيف اسم الملف تلقائياً)'
          : 'إنشاء نسخة احتياطية للإعدادات الحالية'
        }
        size="md"
      >
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم النسخة الاحتياطية *</label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="مثال: backup_before_update"
              />
              {activeSubTab === 'database' && (
                <p className="text-xs text-gray-500 mt-1">
                  ملاحظة: سيتم استبدال المسافات والأحرف الخاصة بشرطة سفلية (_)
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الوصف (اختياري)</label>
              <Textarea
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="وصف مختصر للنسخة الاحتياطية"
                rows={3}
              />
            </div>
          </div>
          <ModalFooter>
            <SimpleButton variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              إلغاء
            </SimpleButton>
            <SimpleButton
              onClick={activeSubTab === 'database' ? handleCreateDatabaseBackup : handleCreateSettingsBackup}
              disabled={currentLoading || !backupName.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              إنشاء
            </SimpleButton>
          </ModalFooter>
      </ModalWrapper>

      {/* Restore Backup Modal */}
      <ModalWrapper 
        isOpen={isRestoreModalOpen} 
        onClose={() => setIsRestoreModalOpen(false)}
        title="استعادة نسخة احتياطية"
        description={selectedBackup ? `هل أنت متأكد من استعادة النسخة: ${selectedBackup.name || selectedBackup.description || `#${selectedBackup.id}`}؟` : ''}
        size="md"
      >
          {activeSubTab === 'database' && (
            <div className="space-y-4 p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.dropDatabase}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, dropDatabase: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">حذف قاعدة البيانات الحالية قبل الاستعادة</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.createDatabase}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, createDatabase: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">إنشاء قاعدة البيانات إذا لم تكن موجودة</span>
              </label>
            </div>
          )}
          {activeSubTab === 'settings' && (
            <div className="space-y-4 p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.overwriteExisting}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, overwriteExisting: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">الكتابة فوق الإعدادات الموجودة</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.skipSystemSettings}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, skipSystemSettings: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">تخطي إعدادات النظام</span>
              </label>
            </div>
          )}
          <ModalFooter>
            <SimpleButton variant="outline" onClick={() => setIsRestoreModalOpen(false)}>
              إلغاء
            </SimpleButton>
            <SimpleButton
              onClick={handleRestore}
              disabled={currentLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              استعادة
            </SimpleButton>
          </ModalFooter>
      </ModalWrapper>
    </div>
  );
};

