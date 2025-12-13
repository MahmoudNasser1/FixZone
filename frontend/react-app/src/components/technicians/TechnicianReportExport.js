import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import technicianReportService from '../../services/technicianReportService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../ui/SimpleButton';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';

/**
 * Component لتصدير تقارير الفنيين
 * @param {object} props
 * @param {number} props.technicianId - معرف الفني (اختياري - لجميع الفنيين)
 * @param {string} props.reportType - نوع التقرير: 'performance' | 'wages' | 'skills' | 'schedule' | 'all'
 * @param {object} props.filters - الفلاتر: { startDate, endDate }
 */
const TechnicianReportExport = ({ technicianId = null, reportType = 'performance', filters = {} }) => {
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: filters.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: filters.endDate || new Date().toISOString().split('T')[0]
  });
  const notifications = useNotifications();

  const handleExport = async () => {
    try {
      setLoading(true);
      const exportFilters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      let result;
      switch (reportType) {
        case 'performance':
          result = await technicianReportService.exportPerformanceReport(technicianId, exportFormat, exportFilters);
          break;
        case 'wages':
          if (!technicianId) {
            notifications.error('يجب تحديد فني لتصدير تقرير الأجور');
            return;
          }
          result = await technicianReportService.exportWagesReport(technicianId, exportFormat, exportFilters);
          break;
        case 'skills':
          if (!technicianId) {
            notifications.error('يجب تحديد فني لتصدير تقرير المهارات');
            return;
          }
          result = await technicianReportService.exportSkillsReport(technicianId, exportFormat);
          break;
        case 'schedule':
          if (!technicianId) {
            notifications.error('يجب تحديد فني لتصدير تقرير الجدولة');
            return;
          }
          result = await technicianReportService.exportScheduleReport(technicianId, exportFormat, exportFilters);
          break;
        case 'all':
          result = await technicianReportService.exportAllTechniciansReport(exportFormat, exportFilters);
          break;
        default:
          notifications.error('نوع التقرير غير صحيح');
          return;
      }

      if (result.success) {
        notifications.success(`تم تصدير التقرير بنجاح بصيغة ${exportFormat === 'pdf' ? 'PDF' : 'Excel'}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      notifications.error('فشل في تصدير التقرير: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const getReportTitle = () => {
    const titles = {
      performance: 'تقرير الأداء',
      wages: 'تقرير الأجور',
      skills: 'تقرير المهارات',
      schedule: 'تقرير الجدولة',
      all: 'تقرير شامل - جميع الفنيين'
    };
    return titles[reportType] || 'تقرير';
  };

  const needsDateRange = reportType !== 'skills';

  return (
    <SimpleCard>
      <SimpleCardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {getReportTitle()}
            </h3>
          </div>

          {needsDateRange && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">صيغة التصدير:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  exportFormat === 'pdf'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => setExportFormat('excel')}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  exportFormat === 'excel'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>

          <SimpleButton
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {loading ? 'جاري التصدير...' : 'تصدير التقرير'}
          </SimpleButton>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default TechnicianReportExport;

