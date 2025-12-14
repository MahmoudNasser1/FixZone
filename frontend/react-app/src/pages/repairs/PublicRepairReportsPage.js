import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FileCheck,
  X,
  FileText,
  Calendar,
  User,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Loading } from '../../components/ui/Loading';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

const PublicRepairReportsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackingToken = searchParams.get('trackingToken');
  const repairId = searchParams.get('repairId');
  
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [repairData, setRepairData] = useState(null);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch repair data
  useEffect(() => {
    const fetchRepairData = async () => {
      if (!trackingToken && !repairId) return;

      try {
        const params = new URLSearchParams();
        if (repairId) {
          params.append('id', repairId);
        } else if (trackingToken) {
          const isNumeric = /^\d+$/.test(trackingToken);
          if (isNumeric) {
            params.append('id', trackingToken);
          } else {
            params.append('trackingToken', trackingToken);
          }
        }

        const response = await fetch(`${API_BASE_URL}/repairsSimple/tracking?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setRepairData(data);
        }
      } catch (error) {
        console.error('Error fetching repair data:', error);
      }
    };

    fetchRepairData();
  }, [trackingToken, repairId]);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      const id = repairId || repairData?.id;
      if (!id) {
        setReportsLoading(false);
        setReports([]);
        return;
      }

      try {
        setReportsLoading(true);
        const response = await fetch(`${API_BASE_URL}/inspectionreports/repair/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          // Handle different response formats
          const reportsList = data.data || data.reports || (Array.isArray(data) ? data : []);
          setReports(Array.isArray(reportsList) ? reportsList : []);
        } else if (response.status === 404) {
          // No reports found - this is normal
          setReports([]);
        } else {
          // Other error
          console.warn('Error fetching reports:', response.status);
          setReports([]);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    };

      fetchReports();
  }, [repairId, repairData?.id]);

  const handleBack = () => {
    // Use browser back to go to previous page (tracking page)
    navigate(-1);
  };

  // Force light mode for this page
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
    
    return () => {
      // Don't restore theme on unmount - let user's preference persist
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 space-x-reverse flex-1 min-w-0">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                aria-label="رجوع"
              >
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">تقارير الفحص</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  {repairData?.customerName ? `تقارير فحص لطلب ${repairData.customerName}` : 'عرض تقارير الفحص'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse flex-shrink-0">
              <img 
                src="/Fav.png" 
                alt="FixZone Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Repair Info Card */}
        {repairData && (
          <SimpleCard className="mb-4 sm:mb-6 md:mb-8">
            <SimpleCardContent className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {repairData.customerName && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted rounded-full flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1">العميل</h4>
                      <p className="text-sm sm:text-base text-muted-foreground break-words">{repairData.customerName}</p>
                    </div>
                  </div>
                )}
                {repairData.deviceModel && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted rounded-full flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1">الموديل</h4>
                      <p className="text-sm sm:text-base text-muted-foreground break-words">{repairData.deviceModel}</p>
                    </div>
                  </div>
                )}
                {repairData.createdAt && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted rounded-full flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1">تاريخ الاستلام</h4>
                      <p className="text-sm sm:text-base text-muted-foreground break-words">{formatDate(repairData.createdAt)}</p>
                    </div>
                  </div>
                )}
                {repairData.branchName && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted rounded-full flex-shrink-0">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1">الفرع</h4>
                      <p className="text-sm sm:text-base text-muted-foreground break-words">{repairData.branchName}</p>
                    </div>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}

        {/* Reports Content */}
        <SimpleCard>
          <SimpleCardHeader className="p-4 sm:p-5 md:p-6 pb-4 border-b">
            <SimpleCardTitle className="text-lg sm:text-xl mb-0 flex items-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full ml-3 sm:ml-4">
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-foreground flex-shrink-0" />
              </div>
              <span className="font-semibold text-foreground">تقارير الفحص</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="p-4 sm:p-5 md:p-6">
            {reportsLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loading size="lg" text="جاري تحميل التقارير..." />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-1 sm:mb-2">لا توجد تقارير</h3>
                <p className="text-sm sm:text-base text-muted-foreground px-4">لا توجد تقارير فحص مرتبطة بهذا الطلب</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {reports.map((report, index) => (
                  <SimpleCard key={report.id || index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <SimpleCardHeader className="p-4 sm:p-5 md:p-6 pb-4 border-b">
                      <SimpleCardTitle className="text-lg sm:text-xl mb-0 flex items-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full ml-3 sm:ml-4">
                          <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-foreground flex-shrink-0" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {report.inspectionTypeName || report.typeName || report.name || `تقرير فحص #${index + 1}`}
                        </span>
                      </SimpleCardTitle>
                    </SimpleCardHeader>
                    <SimpleCardContent className="p-4 sm:p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            تاريخ التقرير: {formatDate(report.reportDate)}
                          </p>
                          {report.technicianName && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              الفني: <span className="font-medium text-foreground">{report.technicianName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {report.summary && (
                        <div className="mb-4">
                          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">الملخص</h4>
                          <p className="text-sm sm:text-base text-muted-foreground bg-muted/30 p-3 sm:p-4 rounded-lg break-words leading-relaxed">{report.summary}</p>
                        </div>
                      )}

                      {report.result && (
                        <div className="mb-4">
                          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">النتيجة</h4>
                          <p className="text-sm sm:text-base text-muted-foreground bg-muted/30 p-3 sm:p-4 rounded-lg break-words leading-relaxed">{report.result}</p>
                        </div>
                      )}

                      {report.recommendations && (
                        <div className="mb-4">
                          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">التوصيات</h4>
                          <p className="text-sm sm:text-base text-muted-foreground bg-muted/30 p-3 sm:p-4 rounded-lg break-words leading-relaxed">{report.recommendations}</p>
                        </div>
                      )}

                      {report.notes && (
                        <div className="mb-4">
                          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">ملاحظات</h4>
                          <p className="text-sm sm:text-base text-muted-foreground bg-muted/30 p-3 sm:p-4 rounded-lg break-words leading-relaxed">{report.notes}</p>
                        </div>
                      )}

                      {report.branchName && (
                        <div className="text-xs sm:text-sm text-muted-foreground pt-2 border-t">
                          <span className="font-medium">الفرع:</span> {report.branchName}
                        </div>
                      )}
                    </SimpleCardContent>
                  </SimpleCard>
                ))}
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default PublicRepairReportsPage;

