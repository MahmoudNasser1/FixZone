import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  X,
  FileText,
  Calendar,
  User,
  MapPin,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  Info,
  AlertCircle
} from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

const PublicRepairReportsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackingToken = searchParams.get('trackingToken');
  const repairId = searchParams.get('repairId');

  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [repairData, setRepairData] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'تاريخ غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch Repair Data & Reports
  useEffect(() => {
    const fetchRepairData = async () => {
      try {
        let data;

        // 1. Fetch Repair Data
        if (trackingToken) {
          const response = await fetch(`${API_BASE_URL}/repairsSimple/tracking?trackingToken=${encodeURIComponent(trackingToken)}`);
          if (!response.ok) throw new Error('Failed to fetch repair data');
          // The backend returns the object directly for this endpoint
          data = await response.json();
        } else if (repairId) {
          const response = await fetch(`${API_BASE_URL}/repairsSimple/${repairId}`);
          if (!response.ok) throw new Error('Failed to fetch repair data');
          const json = await response.json();
          data = json.data;
        } else {
          setReportsLoading(false);
          return;
        }

        if (data) {
          setRepairData(data);

          // Set attachments if they exist in the response
          if (data.attachments) {
            setAttachments(data.attachments);
          } else if (data.id) {
            // Fallback: try to fetch attachments specifically if not in main object
            try {
              const attResponse = await fetch(`${API_BASE_URL}/repairsSimple/${data.id}/attachments`);
              if (attResponse.ok) {
                const attData = await attResponse.json();
                setAttachments(attData.data || []);
              }
            } catch (e) {
              console.error('Error fetching separate attachments:', e);
            }
          }

          // 2. Fetch Inspection Reports
          try {
            const reportsResponse = await fetch(`${API_BASE_URL}/inspectionreports/repair/${data.id}`);
            if (reportsResponse.ok) {
              const reportsData = await reportsResponse.json();
              setReports(reportsData.data || []);
            }
          } catch (e) {
            console.error('Error fetching reports:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setReportsLoading(false);
        setAttachmentsLoading(false);
      }
    };

    fetchRepairData();
  }, [trackingToken, repairId]);

  // Lightbox Handlers
  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (attachments.length) {
      setSelectedImageIndex((prev) => (prev + 1) % attachments.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (attachments.length) {
      setSelectedImageIndex((prev) => (prev - 1 + attachments.length) % attachments.length);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage(e);
      if (e.key === 'ArrowLeft') prevImage(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, attachments]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background text-right" dir="rtl">
      {/* Premium Header */}
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-30 backdrop-blur-md bg-card/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all"
                aria-label="رجوع"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">التقارير وصور الجهاز</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-md">
                    {repairData?.customerName ? `عرض التفاصيل الخاصة بـ: ${repairData.customerName}` : 'تفاصيل الفحص والاختبار'}
                  </p>
                  <SimpleBadge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/20 bg-primary/5 text-primary">رسمي</SimpleBadge>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <img
                src="/Fav.png"
                alt="FixZone Logo"
                className="h-10 w-auto opacity-80 brightness-90 dark:brightness-110"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Repair Context Card */}
        {repairData && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-info/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <SimpleCard className="relative border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
              <SimpleCardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'العميل المستفيد', value: repairData.customerName, icon: User, color: 'text-primary' },
                    { label: 'العنصر الخاضع للفحص', value: repairData.deviceModel, icon: ClipboardList, color: 'text-info' },
                    { label: 'تاريخ التسجيل', value: formatDate(repairData.createdAt), icon: Calendar, color: 'text-success' },
                    { label: 'الموقع / الفرع', value: repairData.branchName, icon: MapPin, color: 'text-warning' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <item.icon className={cn("w-4 h-4", item.color)} />
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground break-words">{item.value || 'غير متوفر'}</p>
                    </div>
                  ))}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {/* Attachments Gallery Section */}
        {attachments.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">صور الجهاز والمرفقات</h2>
              <SimpleBadge variant="outline" className="font-bold bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                {attachments.length} صور
              </SimpleBadge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-border/50 hover:shadow-xl transition-all duration-300"
                  onClick={() => openLightbox(idx)}
                >
                  <img
                    src={att.url}
                    alt={att.title || `صورة ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <p className="text-white text-xs font-medium line-clamp-2">{att.title || 'عرض الصورة'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Reports Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg text-success">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">التقارير المعتمدة</h2>
            </div>
            {reports.length > 0 && (
              <SimpleBadge variant="success" className="font-bold">{reports.length} تقارير</SimpleBadge>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {reportsLoading ? (
              <div className="py-20 flex flex-col items-center">
                <LoadingSpinner message="جاري استرجاع تقارير الفحص..." />
              </div>
            ) : reports.length === 0 ? (
              <SimpleCard className="border-dashed border-2 bg-transparent">
                <SimpleCardContent className="py-20 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">لا توجد تقارير منشورة</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                    لم نتمكن من العثور على أي تقارير فحص فني نهائية مرتبطة برقم التتبع هذا حالياً.
                  </p>
                </SimpleCardContent>
              </SimpleCard>
            ) : (
              <div className="space-y-6">
                {reports.map((report, index) => (
                  <SimpleCard key={report.id || index} className="border-none shadow-md overflow-hidden bg-card/60 hover:bg-card transition-all group">
                    <SimpleCardHeader className="bg-muted/30 border-b border-border/50 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <SimpleCardTitle className="text-lg font-bold">
                              {report.inspectionTypeName || report.typeName || report.name || "تقرير فحص فني"}
                            </SimpleCardTitle>
                            <div className="flex items-center gap-3 mt-1 underline-offset-4">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {formatDate(report.reportDate)}
                              </span>
                              {report.technicianName && (
                                <>
                                  <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    بإشراف الفني: {report.technicianName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <SimpleBadge variant="outline" className="hidden sm:flex items-center gap-1 text-[10px] bg-card">
                          <Info className="w-3 h-3" />
                          معتمد رقم {report.id}
                        </SimpleBadge>
                      </div>
                    </SimpleCardHeader>
                    <SimpleCardContent className="p-6 sm:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Summary & Result */}
                        <div className="space-y-6">
                          {report.summary && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                ملخص الحالة الفنية
                              </h4>
                              <div className="p-4 rounded-2xl bg-muted/40 text-sm leading-relaxed text-foreground/80 border border-border/10">
                                {report.summary}
                              </div>
                            </div>
                          )}
                          {report.result && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-success" />
                                النتيجة النهائية للفحص
                              </h4>
                              <div className="p-4 rounded-2xl bg-success/5 text-sm leading-relaxed text-foreground/90 border border-success/10 font-medium">
                                {report.result}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recommendations & Notes */}
                        <div className="space-y-6">
                          {report.recommendations && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Info className="w-4 h-4 text-info" />
                                التوصيات الفنية المقترحة
                              </h4>
                              <div className="p-4 rounded-2xl bg-info/5 text-sm leading-relaxed text-foreground/80 border border-info/10 italic">
                                "{report.recommendations}"
                              </div>
                            </div>
                          )}
                          {report.notes && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-warning" />
                                ملاحظات فنية إضافية
                              </h4>
                              <div className="p-4 rounded-2xl bg-muted/20 text-sm leading-relaxed text-muted-foreground border border-border/5">
                                {report.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {report.branchName && (
                        <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            صادر عن فرع: {report.branchName}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileCheck className="w-3 h-3 text-success" />
                            تم الفحص والتحقق بنجاح
                          </span>
                        </div>
                      )}
                    </SimpleCardContent>
                  </SimpleCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && attachments && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 text-white bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium opacity-80">
                {selectedImageIndex + 1} / {attachments.length}
              </span>
              <h3 className="text-lg font-bold">
                {attachments[selectedImageIndex]?.title || 'معرض الصور'}
              </h3>
            </div>
            <button
              onClick={closeLightbox}
              className="p-3 rounded-full bg-white/10 hover:bg-red-500/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden">
            <button
              onClick={prevImage}
              className="absolute left-4 p-4 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all hover:scale-110 z-10"
            >
              <div className="rotate-180">➜</div>
            </button>
            <img
              src={attachments[selectedImageIndex]?.url}
              alt={attachments[selectedImageIndex]?.title || 'Full view'}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={nextImage}
              className="absolute right-4 p-4 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all hover:scale-110 z-10"
            >
              <div>➜</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicRepairReportsPage;

