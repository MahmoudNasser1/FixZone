// frontend/react-app/src/components/settings/SettingsImportExport.js
import React, { useState } from 'react';
import { useSettingsImportExport } from '../../hooks/useSettingsImportExport';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Settings Import/Export Component
 * Handles import and export of settings
 */
export const SettingsImportExport = () => {
  const {
    loading,
    error,
    exportSettings,
    getTemplate,
    importSettings,
    validateFile
  } = useSettingsImportExport();

  const [selectedFile, setSelectedFile] = useState(null);
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    skipSystemSettings: true
  });
  const [validationResult, setValidationResult] = useState(null);

  const handleExport = async () => {
    try {
      await exportSettings('json');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleGetTemplate = async () => {
    try {
      await getTemplate();
    } catch (error) {
      console.error('Get template failed:', error);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);

    // Validate file
    try {
      const result = await validateFile(file);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ valid: false, error: error.message });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('يرجى اختيار ملف للاستيراد');
      return;
    }

    if (validationResult && !validationResult.valid) {
      alert('الملف غير صالح للاستيراد. يرجى التحقق من الأخطاء.');
      return;
    }

    try {
      await importSettings(selectedFile, importOptions);
      setSelectedFile(null);
      setValidationResult(null);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-gray-500" />
            <SimpleCardTitle>تصدير الإعدادات</SimpleCardTitle>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              قم بتصدير جميع الإعدادات إلى ملف JSON للنسخ الاحتياطي أو النقل
            </p>
            <div className="flex gap-2">
              <SimpleButton onClick={handleExport} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                تصدير الإعدادات
              </SimpleButton>
              <SimpleButton variant="outline" onClick={handleGetTemplate} disabled={loading}>
                <FileText className="h-4 w-4 mr-2" />
                تحميل قالب
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Import Section */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-gray-500" />
            <SimpleCardTitle>استيراد الإعدادات</SimpleCardTitle>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              قم باستيراد الإعدادات من ملف JSON
            </p>

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium mb-2">اختر ملف JSON</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div
                className={`p-4 rounded-lg border ${
                  validationResult.valid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        validationResult.valid ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {validationResult.valid
                        ? 'الملف صالح للاستيراد'
                        : 'الملف غير صالح'}
                    </p>
                    {validationResult.errors && validationResult.errors > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationResult.errors} خطأ
                      </p>
                    )}
                    {validationResult.error && (
                      <p className="text-xs text-red-600 mt-1">{validationResult.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Import Options */}
            {selectedFile && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">خيارات الاستيراد:</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.overwriteExisting}
                    onChange={(e) =>
                      setImportOptions({ ...importOptions, overwriteExisting: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm">الكتابة فوق الإعدادات الموجودة</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.skipSystemSettings}
                    onChange={(e) =>
                      setImportOptions({ ...importOptions, skipSystemSettings: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm">تخطي إعدادات النظام</span>
                </label>
              </div>
            )}

            {/* Import Button */}
            <SimpleButton
              onClick={handleImport}
              disabled={loading || !selectedFile || (validationResult && !validationResult.valid)}
              className="w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  استيراد الإعدادات
                </>
              )}
            </SimpleButton>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

