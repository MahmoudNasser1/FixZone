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
  CheckCircle2,
  HardDrive
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
    skipSystemSettings: true,
    dropDatabase: true,
    createDatabase: true
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
        let backupsData = response.data;
        if (backupsData && !Array.isArray(backupsData)) {
          if (backupsData.backups && Array.isArray(backupsData.backups)) {
            backupsData = backupsData.backups;
          } else {
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

  const getCurrentBackups = () => {
    const backups = activeSubTab === 'database' ? dbBackups : settingsBackups;
    if (!backups) return [];
    if (Array.isArray(backups)) return backups;
    if (backups.backups && Array.isArray(backups.backups)) return backups.backups;
    return [];
  };

  const currentBackups = getCurrentBackups();
  const currentLoading = activeSubTab === 'database' ? dbLoading : settingsLoading;
  const currentError = activeSubTab === 'database' ? dbError : settingsError;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background/50 p-6 rounded-2xl border border-border backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">النسخ الاحتياطي</h2>
            <p className="text-sm text-muted-foreground mt-1">إدارة شاملة لنسخ قاعدة البيانات وإعدادات النظام</p>
          </div>
        </div>
        <SimpleButton
          onClick={() => setIsCreateModalOpen(true)}
          disabled={currentLoading}
          className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
        >
          <Save className="h-4 w-4 ml-2" />
          إنشاء نسخة احتياطية
        </SimpleButton>
      </div>

      {/* Sub Tabs */}
      <div className="flex p-1 bg-muted/30 rounded-xl border border-border w-fit mx-auto sm:mx-0">
        <button
          onClick={() => setActiveSubTab('database')}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
            ${activeSubTab === 'database'
              ? 'bg-background text-primary shadow-sm border border-border/50 translate-y-[-1px]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
          `}
        >
          <HardDrive className="w-4 h-4" />
          قاعدة البيانات
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
            ${activeSubTab === 'settings'
              ? 'bg-background text-primary shadow-sm border border-border/50 translate-y-[-1px]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
          `}
        >
          <Settings className="w-4 h-4" />
          الإعدادات
        </button>
      </div>

      {/* Database Statistics */}
      {activeSubTab === 'database' && dbStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">إجمالي النسخ</span>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{dbStatistics.total || 0}</p>
          </div>

          <div className="bg-background border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">الحجم الإجمالي</span>
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground overflow-hidden text-ellipsis" dir="ltr">{dbStatistics.totalSizeMB || 0} MB</p>
          </div>

          <div className="bg-background border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">أقدم نسخة</span>
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground">
              {dbStatistics.oldest ? formatDate(dbStatistics.oldest) : 'لا يوجد'}
            </p>
          </div>

          <div className="bg-background border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">أحدث نسخة</span>
              <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground">
              {dbStatistics.newest ? formatDate(dbStatistics.newest) : 'لا يوجد'}
            </p>
          </div>
        </div>
      )}

      {/* Auto Backup Settings */}
      {activeSubTab === 'database' && (
        <SimpleCard className="overflow-hidden border-border bg-background/50 backdrop-blur-sm shadow-sm">
          <SimpleCardHeader className="border-b border-border bg-muted/20 pb-4">
            <SimpleCardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              النسخ الاحتياطي التلقائي
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="p-6">
            {autoBackupLoading && <LoadingSpinner />}
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-all">
                <div className="space-y-1">
                  <span className="font-bold text-foreground block">تفعيل المجدول الزمني</span>
                  <span className="text-sm text-muted-foreground">تفعيل نظام النسخ الاحتياطي الدوري تلقائياً</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoBackupEnabled}
                    onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                  />
                  <div className={`w-14 h-7 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 transition-all duration-300 ${autoBackupEnabled ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted border border-border'}`}></div>
                  <div className={`absolute top-1 left-1 bg-white border-gray-300 border w-5 h-5 rounded-full transition-all duration-300 ${autoBackupEnabled ? 'translate-x-7 border-white' : 'translate-x-0'}`}></div>
                </label>
              </div>

              {/* Enhanced Settings Area */}
              {autoBackupEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/10 rounded-2xl border border-border/50 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      نوع التكرار
                    </label>
                    <div className="flex gap-4">
                      {['daily', 'weekly'].map((type) => (
                        <label key={type} className={`
                          flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200
                          ${autoBackupType === type
                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                          }
                        `}>
                          <input
                            type="radio"
                            name="backupType"
                            value={type}
                            checked={autoBackupType === type}
                            onChange={(e) => setAutoBackupType(e.target.value)}
                            className="hidden"
                          />
                          <span className="font-medium">{type === 'daily' ? 'يومي' : 'أسبوعي'}</span>
                          {autoBackupType === type && <CheckCircle2 className="w-4 h-4" />}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      وقت التنفيذ
                    </label>
                    <Input
                      type="time"
                      value={autoBackupTime}
                      onChange={(e) => setAutoBackupTime(e.target.value)}
                      className="w-full text-center font-mono text-lg tracking-wider"
                    />
                  </div>

                  {autoBackupType === 'weekly' && (
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        يوم التنفيذ
                      </label>
                      <select
                        value={autoBackupDay}
                        onChange={(e) => setAutoBackupDay(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      الاحتفاظ بالنسخ لمدة (أيام)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={keepDays}
                        onChange={(e) => setKeepDays(Math.max(1, parseInt(e.target.value) || 30))}
                        min="1"
                        className="pl-12"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">يوم</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-border mt-2 flex justify-end">
                    <SimpleButton onClick={handleSaveAutoBackup} disabled={autoBackupLoading} className="w-full md:w-auto min-w-[150px]">
                      <Save className="h-4 w-4 ml-2" />
                      حفظ التغييرات
                    </SimpleButton>
                  </div>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Backups List */}
      <SimpleCard className="overflow-hidden border-border shadow-sm">
        <SimpleCardHeader className="border-b border-border bg-muted/20 pb-4">
          <SimpleCardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            {activeSubTab === 'database' ? 'سجل نسخ قاعدة البيانات' : 'سجل نسخ الإعدادات'}
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent className="p-0">
          {currentLoading && <div className="p-12"><LoadingSpinner /></div>}

          {currentError && (
            <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{currentError}</p>
            </div>
          )}

          {!currentLoading && currentBackups && currentBackups.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Database className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-lg font-medium">لا توجد نسخ احتياطية متاحة</p>
              <p className="text-sm mt-1">قم بإنشاء نسخة احتياطية جديدة للبدء</p>
            </div>
          )}

          {!currentLoading && currentBackups && Array.isArray(currentBackups) && currentBackups.length > 0 && (
            <div className="divide-y divide-border">
              {currentBackups.map((backup, index) => {
                if (!backup || typeof backup !== 'object' || Array.isArray(backup) || (backup.backups && Array.isArray(backup.backups))) return null;
                return (
                  <div
                    key={backup.id || backup.filename || `backup-${index}`}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-muted/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4 mb-4 md:mb-0">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">
                          {backup.name || backup.description || (backup.id ? `نسخة #${backup.id}` : 'نسخة غير معروفة')}
                        </h3>
                        {backup.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{backup.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(backup.createdAt)}
                          </span>
                          {backup.size && (
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                              <HardDrive className="h-3.5 w-3.5" />
                              {formatSize(backup.size)}
                            </span>
                          )}
                          {backup.createdBy && (
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                              <User className="h-3.5 w-3.5" />
                              {backup.createdBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto pl-2">
                      <SimpleButton
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setIsRestoreModalOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 ml-1.5" />
                        استعادة
                      </SimpleButton>
                      <SimpleButton
                        variant="ghost"
                        size="sm"
                        className="flex-1 md:flex-none text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          const backupId = backup.id || backup.filename || backup.metadata?.id || (backup.metadata && backup.metadata.id) || (typeof backup === 'string' ? backup : null);
                          if (backupId !== undefined && backupId !== null && backupId !== '') {
                            handleDelete(backupId);
                          } else {
                            notifications.error('خطأ', { message: 'معرف النسخة الاحتياطية غير موجود' });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 ml-1.5" />
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
        title="إنشاء نسخة احتياطية جديدة"
        description={activeSubTab === 'database'
          ? 'سيتم إنشاء نسخة كاملة لقاعدة البيانات الحالية. يمكنك استخدام هذه النسخة للاستعادة لاحقاً.'
          : 'سيتم حفظ إعدادات النظام الحالية في ملف نسخة احتياطية.'
        }
        size="md"
      >
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">اسم النسخة <span className="text-destructive">*</span></label>
            <Input
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="مثال: backup_v1_before_update"
              className="bg-background"
              autoFocus
            />
            {activeSubTab === 'database' && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                سيتم تحويل المسافات تلقائياً إلى شرطة سفلية (_)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">وصف إضافي (اختياري)</label>
            <Textarea
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              placeholder="اكتب ملاحظاتك حول هذه النسخة..."
              rows={3}
              className="resize-none bg-background"
            />
          </div>
        </div>
        <ModalFooter className="gap-2">
          <SimpleButton variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
            إلغاء
          </SimpleButton>
          <SimpleButton
            onClick={activeSubTab === 'database' ? handleCreateDatabaseBackup : handleCreateSettingsBackup}
            disabled={currentLoading || !backupName.trim()}
            className="px-8"
          >
            {currentLoading ? <LoadingSpinner size="sm" className="ml-2" /> : <Save className="h-4 w-4 ml-2" />}
            تأكيد الإنشاء
          </SimpleButton>
        </ModalFooter>
      </ModalWrapper>

      {/* Restore Backup Modal */}
      <ModalWrapper
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="تأكيد الاستعادة"
        description="عملية الاستعادة قد تؤدي إلى فقدان البيانات الحالية. يرجى توخي الحذر."
        size="md"
      >
        {selectedBackup && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-semibold text-sm mb-2 text-foreground">تفاصيل النسخة المحددة:</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p><span className="font-medium text-foreground">الاسم:</span> {selectedBackup.name || selectedBackup.filename}</p>
              <p><span className="font-medium text-foreground">التاريخ:</span> {formatDate(selectedBackup.createdAt)}</p>
              {selectedBackup.size && <p><span className="font-medium text-foreground">الحجم:</span> {formatSize(selectedBackup.size)}</p>}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-foreground mb-3">خيارات الاستعادة</h4>
          {activeSubTab === 'database' && (
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={restoreOptions.dropDatabase}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, dropDatabase: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <div className="mr-3">
                  <span className="block text-sm font-medium text-foreground">إعادة تهيئة قاعدة البيانات</span>
                  <span className="block text-xs text-muted-foreground">حذف البيانات الحالية قبل الاستعادة (موصى به)</span>
                </div>
              </label>
              <label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={restoreOptions.createDatabase}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, createDatabase: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <div className="mr-3">
                  <span className="block text-sm font-medium text-foreground">إنشاء قاعدة البيانات</span>
                  <span className="block text-xs text-muted-foreground">إنشاء قاعدة البيانات إذا لم تكن موجودة مسبقاً</span>
                </div>
              </label>
            </div>
          )}
          {activeSubTab === 'settings' && (
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={restoreOptions.overwriteExisting}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, overwriteExisting: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <div className="mr-3">
                  <span className="block text-sm font-medium text-foreground">استبدال الكل</span>
                  <span className="block text-xs text-muted-foreground">الكتابة فوق كافة الإعدادات الحالية</span>
                </div>
              </label>
              <label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={restoreOptions.skipSystemSettings}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, skipSystemSettings: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <div className="mr-3">
                  <span className="block text-sm font-medium text-foreground">حماية إعدادات النظام</span>
                  <span className="block text-xs text-muted-foreground">عدم تغيير الإعدادات الحساسة للنظام</span>
                </div>
              </label>
            </div>
          )}
        </div>

        <ModalFooter className="gap-2 mt-6">
          <SimpleButton variant="ghost" onClick={() => setIsRestoreModalOpen(false)}>
            إلغاء الأمر
          </SimpleButton>
          <SimpleButton
            onClick={handleRestore}
            disabled={currentLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-6"
          >
            {currentLoading ? <LoadingSpinner size="sm" className="ml-2 text-white" /> : <RefreshCw className="h-4 w-4 ml-2" />}
            بدء الاستعادة
          </SimpleButton>
        </ModalFooter>
      </ModalWrapper>
    </div>
  );
};
