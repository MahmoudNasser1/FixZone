import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
import inventoryService from '../../services/inventoryService';
import repairService from '../../services/repairService';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import RepairTimeline from '../../components/ui/RepairTimeline';
import StatusFlow from '../../components/ui/StatusFlow';
import AttachmentManager from '../../components/ui/AttachmentManager';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { useSettings } from '../../context/SettingsContext';
import useAuthStore from '../../stores/authStore';
import {
  ArrowRight, User, Phone, Mail, Settings, Edit, Save, X,
  Wrench, Clock, CheckCircle, Play, XCircle, AlertTriangle,
  FileText, Paperclip, MessageSquare, Plus, Printer, QrCode,
  UserPlus, Users, UserX, Trash2, Eye, ShoppingCart, Package, DollarSign, RefreshCw, Copy, Check, Building2
} from 'lucide-react';
import SendButton from '../../components/messaging/SendButton';
import MessageLogViewer from '../../components/messaging/MessageLogViewer';
import { getDefaultApiBaseUrl, getFrontendBaseUrl } from '../../lib/apiConfig';
import { formatNumber, formatCurrency } from '../../utils/numberFormat';
import InspectionComponentsList from '../../components/reports/InspectionComponentsList';
import technicianService from '../../services/technicianService';

const API_BASE_URL = getDefaultApiBaseUrl();

const RepairDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { formatMoney } = useSettings();
  const user = useAuthStore((state) => state.user);
  const [repair, setRepair] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('status'); // status | timeline | attachments | invoices | notes | payments | activity | reports
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTechId, setAssignTechId] = useState('');
  const [assignRole, setAssignRole] = useState('primary');
  const [techOptions, setTechOptions] = useState([]);
  const [techLoading, setTechLoading] = useState(false);
  const [assignedTechnicians, setAssignedTechnicians] = useState([]);
  const [assignedTechsLoading, setAssignedTechsLoading] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [inspectionTypesLoading, setInspectionTypesLoading] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    inspectionTypeId: '',
    technicianId: '',
    reportDate: new Date().toISOString().slice(0, 10),
    summary: '',
    result: '',
    recommendations: '',
    notes: '',
  });
  const [inspectionSaving, setInspectionSaving] = useState(false);
  const [inspectionError, setInspectionError] = useState('');
  const [inspectionReports, setInspectionReports] = useState([]);
  const [inspectionReportsLoading, setInspectionReportsLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState(null);

  // Parts used state for this repair
  const [partsUsed, setPartsUsed] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsError, setPartsError] = useState('');

  // Services state for this repair
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState('');

  // Device specifications editing state
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [deviceSpecs, setDeviceSpecs] = useState({});

  // Repair details editing state
  const [editingDetails, setEditingDetails] = useState(false);
  const [repairDetails, setRepairDetails] = useState({
    estimatedCost: 0,
    estimatedCostMin: null,
    estimatedCostMax: null,
    actualCost: null,
    priority: 'MEDIUM',
    expectedDeliveryDate: null,
    notes: ''
  });
  const [trackingLinkCopied, setTrackingLinkCopied] = useState(false);

  // Activity log state with filtering
  const [activityFilter, setActivityFilter] = useState('all'); // all | system | technician | customer
  const [activitySort, setActivitySort] = useState('desc'); // asc | desc

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    notes: ''
  });
  // Add Service modal state
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);

  // Edit accessories state
  const [editingAccessories, setEditingAccessories] = useState(false);
  const [accessoriesForm, setAccessoriesForm] = useState([]);
  const [accessoryOptions, setAccessoryOptions] = useState([]);
  const [addSvcLoading, setAddSvcLoading] = useState(false);
  const [addSvcError, setAddSvcError] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [svcForm, setSvcForm] = useState({ serviceId: '', price: '', technicianId: '', notes: '', invoiceId: '' });
  const [isManualService, setIsManualService] = useState(false);
  const [manualServiceForm, setManualServiceForm] = useState({ name: '', unitPrice: '', quantity: 1 });
  // Map of inventory items for display: id -> { name, sku }
  const [itemsMap, setItemsMap] = useState({});
  const [itemsMapLoading, setItemsMapLoading] = useState(false);

  // Sorting & Pagination state for Parts Used
  const [partsSortBy, setPartsSortBy] = useState('name'); // name | quantity | invoiced
  const [partsSortDir, setPartsSortDir] = useState('asc'); // asc | desc
  const [partsPage, setPartsPage] = useState(1);
  const [partsPageSize, setPartsPageSize] = useState(10);

  // Sorting & Pagination state for Services
  const [svcSortBy, setSvcSortBy] = useState('name'); // name | price | invoiced
  const [svcSortDir, setSvcSortDir] = useState('asc');
  const [svcPage, setSvcPage] = useState(1);
  const [svcPageSize, setSvcPageSize] = useState(10);

  // Issue Part modal state
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [issueForm, setIssueForm] = useState({ warehouseId: '', inventoryItemId: '', quantity: 1, invoiceId: '', unitSellingPrice: '' });
  const [currentUserId, setCurrentUserId] = useState(1);
  const [availableQty, setAvailableQty] = useState(null);
  const [minLevel, setMinLevel] = useState(null);
  const [isLowStock, setIsLowStock] = useState(null);
  const [selectedItemInfo, setSelectedItemInfo] = useState(null); // For displaying item details

  // WhatsApp message template from settings
  const [repairReceivedMessageTemplate, setRepairReceivedMessageTemplate] = useState(null);

  // Load WhatsApp message template from settings
  useEffect(() => {
    const loadMessageTemplate = async () => {
      try {
        const item = await apiService.getSystemSetting('messaging_settings');
        if (item && item.value) {
          const parsed = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
          if (parsed.whatsapp && parsed.whatsapp.repairReceivedMessage) {
            setRepairReceivedMessageTemplate(parsed.whatsapp.repairReceivedMessage);
          }
        }
      } catch (error) {
        // Silently handle 404 (setting doesn't exist yet) - this is expected
        if (error.message && error.message.includes('not found')) {
          // Setting doesn't exist, use default template - no need to log
        } else {
          console.error('Error loading messaging settings:', error);
        }
        // Use default template if settings not found
        setRepairReceivedMessageTemplate(`جهازك وصل Fix Zone يا فندم



ده ملخص الطلب :

• رقم الطلب: {repairNumber}

• الجهاز: {deviceInfo}

• المشكلة: {problem}{oldInvoiceNumber}

تقدر تشوف التحديثات أول بأول من هنا:

{trackingUrl}

فريق الفنيين هيبدأ الفحص خلال الساعات القادمة.`);
      }
    };
    loadMessageTemplate();
  }, []);

  // 🔧 Fix #1: Enhanced handleIssueChange to update selected item info
  const handleIssueChange = (e) => {
    const { name, value } = e.target;

    // Special handling for unitSellingPrice to allow manual editing
    if (name === 'unitSellingPrice') {
      // Allow empty value or numeric value
      setIssueForm((f) => ({ ...f, [name]: value === '' ? '' : value }));
      return;
    }

    setIssueForm((f) => ({ ...f, [name]: value }));

    // Update selected item info when item changes
    if (name === 'inventoryItemId' && value) {
      const selectedItem = items.find(item => item.id === Number(value));
      setSelectedItemInfo(selectedItem || null);
      // Auto-fill selling price only if field is empty (not manually edited)
      setIssueForm((f) => {
        const currentPrice = f.unitSellingPrice;
        // Only auto-fill if price is empty or not set
        if ((!currentPrice || currentPrice === '') && selectedItem && selectedItem.sellingPrice) {
          return { ...f, unitSellingPrice: selectedItem.sellingPrice };
        }
        return f; // Keep current price if manually set
      });
    } else if (name === 'warehouseId' && !value) {
      // Reset when warehouse changes
      setSelectedItemInfo(null);
    }
  };

  const loadItemsMap = async () => {
    try {
      setItemsMapLoading(true);
      console.log('Loading items map...');
      const res = await inventoryService.listItems();
      console.log('Items response:', res);
      // Handle the new inventory-enhanced API response format
      let list = [];
      if (res && res.success && res.data && res.data.items) {
        list = res.data.items;
      } else if (Array.isArray(res)) {
        list = res;
      } else if (res && res.items) {
        list = res.items;
      } else if (res && res.data && Array.isArray(res.data)) {
        list = res.data;
      }
      console.log('Processed items list:', list);
      const map = {};
      for (const it of list) {
        if (it && (it.id != null)) map[it.id] = { name: it.name || '', sku: it.sku || '' };
      }
      console.log('Items map:', map);
      setItemsMap(map);
    } catch (e) {
      console.error('Error loading items map:', e);
    } finally {
      setItemsMapLoading(false);
    }
  };

  // 🔧 Fix #2 & #3: Enhanced handleIssueSubmit with approval, low stock warnings, and profit display
  const handleIssueSubmit = async () => {
    try {
      setIssueError('');
      if (!issueForm.warehouseId || !issueForm.inventoryItemId || !issueForm.quantity) {
        setIssueError('يرجى اختيار المخزن والعنصر وتحديد الكمية');
        return;
      }
      const quantity = Number(issueForm.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) {
        setIssueError('الكمية يجب أن تكون رقمًا أكبر من الصفر');
        return;
      }

      // Check available quantity before submitting
      if (availableQty !== null && quantity > availableQty) {
        setIssueError(`الكمية المطلوبة (${quantity}) أكبر من المخزون المتاح (${availableQty})`);
        return;
      }

      setIssueLoading(true);
      // 🔧 Fix #3: Get enhanced response from /api/inventory/issue
      const issuePayload = {
        repairRequestId: Number(id),
        inventoryItemId: Number(issueForm.inventoryItemId),
        warehouseId: Number(issueForm.warehouseId),
        quantity,
        userId: Number(currentUserId || user?.id || 1),
        invoiceId: issueForm.invoiceId ? Number(issueForm.invoiceId) : null,
      };

      // Add custom selling price if provided
      if (issueForm.unitSellingPrice && issueForm.unitSellingPrice.trim() !== '') {
        const customPrice = Number(issueForm.unitSellingPrice);
        if (!Number.isNaN(customPrice) && customPrice > 0) {
          issuePayload.unitSellingPrice = customPrice;
        }
      }

      console.log('Issuing part with data:', issuePayload);

      const response = await inventoryService.issuePart(issuePayload);

      // Handle response data
      const responseData = response?.data || response;

      // Approval logic removed - always show success
      notifications.success(responseData?.message || 'تم صرف القطعة وتحديث المخزون بنجاح');

      // 🔧 Fix #2: Display low stock warning from response
      if (responseData?.lowStockWarning?.warning) {
        notifications.warning(
          `⚠️ ${responseData.lowStockWarning.message || 'تنبيه: المخزون منخفض لهذا العنصر'}`
        );
      }

      // Pricing information removed - no profit notifications

      // 🔧 Fix #2: Display additional low stock warning from response
      if (responseData?.stockLevel?.isLowStock) {
        notifications.warning(
          `⚠️ تنبيه: المخزون منخفض لهذا العنصر في هذا المخزن (المتبقي: ${responseData.stockLevel.quantity || 0})`
        );
      }

      setIssueOpen(false);
      setIssueForm({ warehouseId: '', inventoryItemId: '', quantity: 1, invoiceId: '', unitSellingPrice: '' });
      setAvailableQty(null);
      setMinLevel(null);
      setIsLowStock(null);

      // refresh details if needed
      try {
        await fetchRepairDetails();
        await loadPartsUsed();
      } catch (_) { }
    } catch (e) {
      console.error('Error issuing part:', e);
      console.error('Error details:', e?.response?.data || e?.data || e);

      // Extract error message from response
      let errorMessage = 'تعذر تنفيذ عملية الصرف';
      if (e?.response?.data) {
        const errorData = e.response.data;
        errorMessage = errorData.details || errorData.message || errorMessage;
        if (errorData.errorCode) {
          errorMessage += ` (${errorData.errorCode})`;
        }
      } else if (e?.data) {
        errorMessage = e.data.details || e.data.message || errorMessage;
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setIssueError(errorMessage);
      notifications.error(errorMessage);
    } finally {
      setIssueLoading(false);
    }
  };

  // تحميل خيارات المتعلقات من المتغيرات
  // Function to get Arabic label for accessory value
  const getAccessoryLabel = (value) => {
    if (typeof value === 'string') {
      // Check if it's already in Arabic (contains Arabic characters)
      if (/[\u0600-\u06FF]/.test(value)) {
        return value; // Already Arabic
      }

      // Map English values to Arabic labels
      const valueToLabel = {
        'CHARGER': 'شاحن الجهاز',
        'USB_CABLE': 'كابل USB',
        'EARPHONES': 'سماعات',
        'CASE': 'حافظة',
        'SCREEN_PROTECTOR': 'حامي الشاشة',
        'STYLUS': 'قلم رقمي',
        'MOUSE': 'ماوس',
        'KEYBOARD': 'لوحة مفاتيح',
        'MEMORY_CARD': 'بطاقة ذاكرة',
        'POWER_BANK': 'بطارية خارجية'
      };

      return valueToLabel[value] || value; // Return Arabic label or original value if not found
    }
    return value;
  };

  const loadAccessoryOptions = async () => {
    try {
      const response = await apiService.getVariables({ category: 'ACCESSORY', active: true });
      if (response.ok) {
        const accessories = await response.json();
        setAccessoryOptions(Array.isArray(accessories) ? accessories : []);
      } else {
        // بيانات تجريبية في حالة عدم توفر البيانات
        setAccessoryOptions([
          { id: 1, label: 'شاحن', value: 'CHARGER' },
          { id: 2, label: 'كابل باور', value: 'POWER_CABLE' },
          { id: 3, label: 'شنطة', value: 'BAG' },
          { id: 4, label: 'بطارية خارجية', value: 'POWER_BANK' }
        ]);
      }
    } catch (error) {
      console.warn('Failed to load accessory options:', error);
      // بيانات تجريبية في حالة الخطأ
      setAccessoryOptions([
        { id: 1, label: 'شاحن', value: 'CHARGER' },
        { id: 2, label: 'كابل باور', value: 'POWER_CABLE' },
        { id: 3, label: 'شنطة', value: 'BAG' },
        { id: 4, label: 'بطارية خارجية', value: 'POWER_BANK' }
      ]);
    }
  };

  useEffect(() => {
    fetchRepairDetails();
    // load parts used initially
    loadPartsUsed();
    // load services initially
    loadServices();
    // load items lookup for nicer rendering of parts used
    loadItemsMap();
    // load payments initially
    loadPayments();
    // load accessory options initially
    loadAccessoryOptions();
  }, [id]);

  useEffect(() => {
    // تحديث الفواتير عند فتح تبويب الفواتير (دائماً للتأكد من البيانات المحدثة)
    if (activeTab === 'invoices' && !invoicesLoading) {
      loadInvoices();
    }
    // تحميل المدفوعات عند فتح تبويب المدفوعات
    if (activeTab === 'payments' && payments.length === 0 && !paymentsLoading) {
      loadPayments();
    }
    // تحميل التقارير عند فتح تبويب التقارير
    if (activeTab === 'reports' && !inspectionReportsLoading) {
      loadInspectionReports();
    }
  }, [activeTab]);

  // Load inspection reports
  const loadInspectionReports = async () => {
    try {
      setInspectionReportsLoading(true);
      const response = await fetch(`${API_BASE_URL}/inspectionreports/repair/${id}`);

      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        let reportsList = [];
        if (data.success && data.data) {
          reportsList = Array.isArray(data.data) ? data.data : [];
        } else if (data.data) {
          reportsList = Array.isArray(data.data) ? data.data : [];
        } else if (data.reports) {
          reportsList = Array.isArray(data.reports) ? data.reports : [];
        } else if (Array.isArray(data)) {
          reportsList = data;
        }

        setInspectionReports(reportsList);
        console.log('[InspectionReports] Loaded reports:', reportsList);
        console.log('[InspectionReports] Number of reports:', reportsList.length);
      } else {
        // Get error details
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: response.statusText };
        }
        console.error('[InspectionReports] Failed to load reports:', response.status, errorData);
        setInspectionReports([]);
        // Show error notification only if it's not a 404 (no reports is normal)
        if (response.status !== 404) {
          notifications.error(`تعذر تحميل التقارير: ${errorData.error || errorData.details || 'خطأ غير معروف'}`);
        }
      }
    } catch (error) {
      console.error('[InspectionReports] Error loading reports:', error);
      setInspectionReports([]);
      notifications.error(`خطأ في تحميل التقارير: ${error.message || 'خطأ في الاتصال'}`);
    } finally {
      setInspectionReportsLoading(false);
    }
  };

  // Handle delete report with optimistic update
  const handleDeleteReport = async (reportId) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا التقرير؟');
    if (!confirmed) return;

    // Optimistic update - remove from UI immediately
    const reportToDelete = inspectionReports.find(r => r.id === reportId);
    setInspectionReports(prev => prev.filter(r => r.id !== reportId));

    try {
      const response = await fetch(`${API_BASE_URL}/inspectionreports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        notifications.success('تم', { message: 'تم حذف التقرير بنجاح' });
        // Reload to ensure consistency
        await loadInspectionReports();
        await fetchRepairDetails();
      } else {
        // Revert optimistic update on error
        if (reportToDelete) {
          setInspectionReports(prev => [...prev, reportToDelete].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          ));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل حذف التقرير');
      }
    } catch (error) {
      console.error('[InspectionReports] Error deleting report:', error);
      // Revert optimistic update on error
      if (reportToDelete) {
        setInspectionReports(prev => [...prev, reportToDelete].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
      }
      notifications.error('خطأ', { message: error.message || 'تعذر حذف التقرير' });
    }
  };

  // Handle edit report - open modal with report data
  const handleEditReport = (report) => {
    setEditingReport(report);
    setInspectionForm({
      inspectionTypeId: String(report.inspectionTypeId || ''),
      technicianId: String(report.technicianId || ''),
      reportDate: report.reportDate ? report.reportDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      summary: report.summary || '',
      result: report.result || '',
      recommendations: report.recommendations || '',
      notes: report.notes || '',
    });
    setInspectionError('');
    setInspectionOpen(true);
  };

  // 🔧 Fix #5: Enhanced loadPartsUsed to handle all data fields properly
  const loadPartsUsed = async () => {
    try {
      setPartsLoading(true);
      setPartsError('');
      console.log('Loading parts used for repair request:', id);
      const response = await apiService.request(`/partsused?repairRequestId=${id}`);
      console.log('Parts used response:', response);

      // Handle different response formats
      let partsData = [];
      if (Array.isArray(response)) {
        partsData = response;
      } else if (response && Array.isArray(response.data)) {
        partsData = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        partsData = response.data;
      }

      // Ensure all numeric fields are properly parsed
      const processedParts = partsData.map(part => ({
        ...part,
        quantity: Number(part.quantity || 0),
        unitPurchasePrice: part.unitPurchasePrice != null ? Number(part.unitPurchasePrice) : null,
        unitSellingPrice: part.unitSellingPrice != null ? Number(part.unitSellingPrice) : null,
        totalCost: part.totalCost != null ? Number(part.totalCost) : null,
        totalPrice: part.totalPrice != null ? Number(part.totalPrice) : null,
        profit: part.profit != null ? Number(part.profit) : null,
        profitMargin: part.profitMargin != null ? (typeof part.profitMargin === 'string' ? part.profitMargin : `${Number(part.profitMargin).toFixed(2)}%`) : null
      }));

      setPartsUsed(processedParts);
    } catch (e) {
      console.error('Error loading parts used:', e);
      setPartsError('تعذر تحميل الأجزاء المصروفة');
      setPartsUsed([]);
    } finally {
      setPartsLoading(false);
    }
  };

  // Derived lists with sorting & pagination for Parts Used
  const getSortedPagedParts = () => {
    // التأكد من أن partsUsed مصفوفة
    if (!Array.isArray(partsUsed)) {
      return { total: 0, items: [] };
    }

    const withMeta = partsUsed.map(pu => ({
      ...pu,
      _name: itemsMap[pu.inventoryItemId]?.name || '',
      _invoiced: !!pu.invoiceItemId,
      _quantity: Number(pu.quantity || 0)
    }));
    const sorted = withMeta.sort((a, b) => {
      const dir = partsSortDir === 'asc' ? 1 : -1;
      if (partsSortBy === 'quantity') return (a._quantity - b._quantity) * dir;
      if (partsSortBy === 'invoiced') return ((a._invoiced === b._invoiced) ? 0 : a._invoiced ? -1 : 1) * dir;
      // name default
      return (a._name.localeCompare(b._name, 'ar')) * dir;
    });
    const start = (partsPage - 1) * partsPageSize;
    return {
      total: sorted.length,
      items: sorted.slice(start, start + partsPageSize)
    };
  };

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      setServicesError('');
      console.log('Loading services for repair request:', id);

      // Load services from RepairRequestService
      const data = await repairService.getRepairRequestServices(id);
      console.log('Services response:', data);

      // التأكد من أن الاستجابة صحيحة
      let servicesData = [];
      if (Array.isArray(data)) {
        servicesData = data;
      } else if (data && Array.isArray(data.data)) {
        servicesData = data.data;
      } else if (data && data.services && Array.isArray(data.services)) {
        servicesData = data.services;
      }

      // تصفية RepairRequestService التي لها serviceId = null (الخدمات اليدوية)
      // سنربطها مع الخدمات اليدوية من InvoiceItem لاحقاً
      const manualServicesRRS = servicesData.filter(s => s.serviceId === null);
      servicesData = servicesData.filter(s => s.serviceId !== null);

      // Load manual services from invoice items
      try {
        // Silent loading - only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Loading manual services from invoices for repair:', id);
        }
        const invoicesData = await apiService.request(`/invoices?repairRequestId=${id}&limit=50`);
        if (process.env.NODE_ENV === 'development') {
          console.log('📄 Invoices data response:', invoicesData);
        }

        // Use normalizeInvoicesResponse to handle different response formats
        const invoicesArray = normalizeInvoicesResponse(invoicesData);
        if (process.env.NODE_ENV === 'development') {
          console.log('📋 Normalized invoices array:', invoicesArray);
          console.log('📋 Number of invoices found:', invoicesArray.length);
        }

        // Get manual services from all invoices (itemType='service' without serviceId)
        for (const invoice of invoicesArray) {
          try {
            const invoiceId = invoice.id || invoice.invoiceId;
            if (!invoiceId) {
              console.warn('⚠️ Invoice without ID:', invoice);
              continue;
            }

            // Silent loading - remove console logs in production
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔍 Loading items for invoice ${invoiceId}...`);
            }
            const itemsData = await apiService.getInvoiceItems(invoiceId);
            if (process.env.NODE_ENV === 'development') {
              console.log(`📦 Invoice ${invoiceId} items response:`, itemsData);
            }

            const items = Array.isArray(itemsData.data) ? itemsData.data : (Array.isArray(itemsData) ? itemsData : []);
            if (process.env.NODE_ENV === 'development') {
              console.log(`📦 Invoice ${invoiceId} items array:`, items);
            }

            // Filter manual services (itemType='service' without serviceId)
            const manualServices = items.filter(item => {
              const isService = item.itemType === 'service' || item.type === 'service';
              const hasNoServiceId = !item.serviceId || item.serviceId === null;
              const hasDescription = item.description && item.description.trim();

              // Only log in development
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 Item ${item.id}: isService=${isService}, hasNoServiceId=${hasNoServiceId}, hasDescription=${!!hasDescription}`, item);
              }

              return isService && hasNoServiceId && hasDescription;
            });

            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Found ${manualServices.length} manual services in invoice ${invoiceId}:`, manualServices);
            }

            // Convert manual services to RepairRequestService format
            for (const manualService of manualServices) {
              // البحث عن RepairRequestService مرتبط بهذا invoiceItemId
              const linkedRRS = manualServicesRRS.find(s =>
                (s.invoiceItemId && s.invoiceItemId === manualService.id) ||
                (s.notes && s.notes.includes(`invoiceItemId:${manualService.id}`))
              );

              // Check if this manual service is already in servicesData (by invoice item ID)
              const exists = servicesData.some(s =>
                s.invoiceItemId === manualService.id
              );

              if (!exists) {
                // تنظيف الملاحظات لإزالة رابط invoiceItemId من العرض
                let cleanNotes = linkedRRS?.notes || null;
                if (cleanNotes && cleanNotes.includes('[invoiceItemId:')) {
                  cleanNotes = cleanNotes.replace(/\s*\[invoiceItemId:\d+\]\s*/g, '').trim();
                  if (cleanNotes === '') cleanNotes = null;
                }

                const manualServiceData = {
                  id: `manual-${manualService.id}`, // Use a unique ID
                  repairRequestId: Number(id),
                  serviceId: null,
                  serviceName: manualService.description,
                  description: manualService.description, // Add description for matching
                  technicianId: linkedRRS ? (linkedRRS.technicianId || null) : null,
                  technicianName: linkedRRS ? (linkedRRS.technicianName || null) : null,
                  price: linkedRRS ? (linkedRRS.price || Number(manualService.unitPrice || 0)) : Number(manualService.unitPrice || 0),
                  finalPrice: Number(manualService.totalPrice || manualService.unitPrice || 0),
                  notes: cleanNotes,
                  invoiceItemId: manualService.id,
                  linkedInvoiceId: invoiceId,
                  createdAt: manualService.createdAt,
                  updatedAt: manualService.updatedAt,
                  isManual: true, // Flag to identify manual services
                  rrsId: linkedRRS ? linkedRRS.id : null // Store RepairRequestService ID for updates
                };

                console.log('➕ Adding manual service to services list:', manualServiceData);
                servicesData.push(manualServiceData);
              } else {
                console.log('⏭️ Manual service already exists, skipping:', manualService.description);
              }
            }
          } catch (itemErr) {
            console.error(`❌ Error loading invoice items for invoice ${invoice.id}:`, itemErr);
          }
        }

        console.log(`✅ Total services after loading manual services: ${servicesData.length}`);
      } catch (invoiceErr) {
        console.error('❌ Error loading invoices for manual services:', invoiceErr);
      }

      console.log('📊 Final services data to set:', servicesData);
      console.log('📊 Services breakdown:', {
        fromRepairRequestService: servicesData.filter(s => !s.isManual).length,
        manualServices: servicesData.filter(s => s.isManual).length,
        total: servicesData.length
      });

      // Log technician information for debugging
      servicesData.forEach((service, index) => {
        console.log(`🔍 Service ${index + 1}:`, {
          id: service.id,
          serviceName: service.serviceName,
          technicianId: service.technicianId,
          technicianName: service.technicianName,
          isManual: service.isManual
        });
      });

      setServices(servicesData);
    } catch (e) {
      console.error('Error loading services:', e);
      setServicesError('تعذر تحميل خدمات الإصلاح');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      setPaymentsError('');
      // محاولة تحميل المدفوعات من API
      try {
        const res = await apiService.request(`/payments?repairRequestId=${id}`);
        setPayments(Array.isArray(res) ? res : (res.data || []));
      } catch {
        // بيانات تجريبية في حالة عدم توفر API
        setPayments([
          {
            id: 1,
            amount: 150.00,
            method: 'cash',
            reference: 'CASH-001',
            notes: 'دفعة مقدمة',
            createdAt: '2024-12-07T11:00:00Z',
            createdBy: 'موظف الاستقبال'
          },
          {
            id: 2,
            amount: 300.00,
            method: 'card',
            reference: 'CARD-002',
            notes: 'باقي المبلغ',
            createdAt: '2024-12-08T15:30:00Z',
            createdBy: 'موظف الاستقبال'
          }
        ]);
      }
    } catch (e) {
      setPaymentsError('تعذر تحميل المدفوعات');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    try {
      const amount = parseFloat(paymentForm.amount);
      if (!amount || amount <= 0) {
        notifications.error('يرجى إدخال مبلغ صحيح');
        return;
      }

      // First, we need to get the invoice for this repair request
      // Get fresh invoices from the API directly to avoid state timing issues
      const freshInvoicesData = await apiService.request(`/invoices?repairRequestId=${id}&limit=50`);

      // Handle different response formats
      let freshInvoices = [];
      if (Array.isArray(freshInvoicesData)) {
        freshInvoices = freshInvoicesData;
      } else if (freshInvoicesData?.data && Array.isArray(freshInvoicesData.data)) {
        freshInvoices = freshInvoicesData.data;
      } else if (freshInvoicesData?.success && freshInvoicesData?.data?.invoices && Array.isArray(freshInvoicesData.data.invoices)) {
        freshInvoices = freshInvoicesData.data.invoices;
      } else if (freshInvoicesData?.invoices && Array.isArray(freshInvoicesData.invoices)) {
        freshInvoices = freshInvoicesData.invoices;
      }

      if (!Array.isArray(freshInvoices)) {
        throw new Error('Invalid invoices response format');
      }

      const invoice = freshInvoices.find(inv => invoiceBelongsToRepair(inv, id));
      if (!invoice) {
        notifications.error('لا توجد فاتورة لهذا الطلب. يرجى إنشاء فاتورة أولاً');
        return;
      }

      const newPayment = {
        invoiceId: invoice.id,
        amount,
        paymentMethod: paymentForm.method,
        referenceNumber: paymentForm.reference || `${paymentForm.method.toUpperCase()}-${Date.now()}`,
        notes: paymentForm.notes,
        createdBy: user?.id || 2, // Use current user ID, fallback to 2 if not available
        currency: 'EGP',
        paymentDate: new Date().toISOString().split('T')[0]
      };

      try {
        console.log('Creating payment with data:', newPayment);
        const created = await apiService.request('/payments', {
          method: 'POST',
          body: JSON.stringify(newPayment)
        });
        console.log('Payment created:', created);
        setPayments(prev => [...prev, created]);
      } catch (e) {
        console.error('Error creating payment:', e);
        // إضافة محلية في حالة عدم توفر API
        const created = {
          ...newPayment,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          createdBy: 'المستخدم الحالي'
        };
        setPayments(prev => [...prev, created]);
      }

      notifications.success('تم إضافة الدفعة بنجاح');
      setAddingPayment(false);
      setPaymentForm({ amount: '', method: 'cash', reference: '', notes: '' });
    } catch (e) {
      notifications.error('تعذر إضافة الدفعة');
    }
  };

  const handleUpdateDeviceSpecs = async () => {
    try {
      const updatedSpecs = {
        ...repair,
        deviceSpecs: deviceSpecs
      };

      try {
        console.log('Updating device specs with data:', deviceSpecs);
        await apiService.updateRepairRequest(id, { deviceSpecs });
        setRepair(prev => ({ ...prev, deviceSpecs }));
      } catch (e) {
        console.error('Error updating device specs:', e);
        // تحديث محلي في حالة عدم توفر API
        setRepair(prev => ({ ...prev, deviceSpecs }));
      }

      notifications.success('تم تحديث مواصفات الجهاز بنجاح');
      setEditingSpecs(false);
    } catch (e) {
      notifications.error('تعذر تحديث مواصفات الجهاز');
    }
  };

  const handleUpdateRepairDetails = async () => {
    try {
      console.log('Updating repair details with data:', repairDetails);

      // Convert priority from Arabic/display value to backend format
      // Backend validation accepts both uppercase and lowercase, but backend normalizes to lowercase
      const priorityMap = {
        'منخفضة': 'LOW',
        'متوسطة': 'MEDIUM',
        'عالية': 'HIGH',
        'عاجلة': 'URGENT',
        'low': 'LOW',
        'normal': 'MEDIUM', // 'normal' maps to 'MEDIUM' in validation
        'medium': 'MEDIUM',
        'high': 'HIGH',
        'urgent': 'URGENT',
        'LOW': 'LOW',
        'MEDIUM': 'MEDIUM',
        'NORMAL': 'MEDIUM',
        'HIGH': 'HIGH',
        'URGENT': 'URGENT'
      };

      const normalizedPriority = priorityMap[repairDetails.priority] || repairDetails.priority || 'MEDIUM';

      // Calculate estimatedCost from range if both values exist (for validation - backend expects a number)
      // This is only for validation purposes - we use the range for display
      let calculatedEstimatedCost = 0;
      if (repairDetails.estimatedCostMin !== null && repairDetails.estimatedCostMax !== null) {
        calculatedEstimatedCost = (repairDetails.estimatedCostMin + repairDetails.estimatedCostMax) / 2;
      } else if (repairDetails.estimatedCost !== null && repairDetails.estimatedCost !== undefined) {
        calculatedEstimatedCost = parseFloat(repairDetails.estimatedCost) || 0;
      }

      // Send update request
      await apiService.updateRepairRequest(id, {
        estimatedCost: calculatedEstimatedCost, // Send calculated value for validation (backend still requires it)
        estimatedCostMin: repairDetails.estimatedCostMin,
        estimatedCostMax: repairDetails.estimatedCostMax,
        actualCost: repairDetails.actualCost !== null && repairDetails.actualCost !== undefined ? parseFloat(repairDetails.actualCost) : null,
        priority: normalizedPriority,
        expectedDeliveryDate: repairDetails.expectedDeliveryDate,
        notes: repairDetails.notes
      });

      // تحديث محلي
      // Update customFields with the range
      let updatedCustomFields = {};
      try {
        updatedCustomFields = typeof repair.customFields === 'string'
          ? JSON.parse(repair.customFields)
          : (repair.customFields || {});
      } catch (e) {
        updatedCustomFields = {};
      }

      if (repairDetails.estimatedCostMin !== undefined) {
        updatedCustomFields.estimatedCostMin = repairDetails.estimatedCostMin;
      }
      if (repairDetails.estimatedCostMax !== undefined) {
        updatedCustomFields.estimatedCostMax = repairDetails.estimatedCostMax;
      }

      setRepair(prev => ({
        ...prev,
        actualCost: repairDetails.actualCost,
        priority: repairDetails.priority,
        expectedDeliveryDate: repairDetails.expectedDeliveryDate,
        notes: repairDetails.notes,
        customFields: updatedCustomFields
      }));

      notifications.success('تم تحديث تفاصيل الطلب بنجاح');
      setEditingDetails(false);

      // Refresh repair data to ensure we have the latest from the server
      await fetchRepairDetails();
    } catch (e) {
      console.error('Error updating repair details:', e);
      notifications.error('تعذر تحديث تفاصيل الطلب');
    }
  };

  // Derived lists with sorting & pagination for Services
  const getSortedPagedServices = () => {
    const withMeta = (services || []).map(s => ({
      ...s,
      _name: s.serviceName || s.description || `خدمة #${s.serviceId || 'يدوية'}`,
      _price: Number(s.finalPrice || s.price || 0),
      _invoiced: !!s.invoiceItemId || s.isManual // Manual services are always invoiced
    }));
    const sorted = withMeta.sort((a, b) => {
      const dir = svcSortDir === 'asc' ? 1 : -1;
      if (svcSortBy === 'price') return (a._price - b._price) * dir;
      if (svcSortBy === 'invoiced') return ((a._invoiced === b._invoiced) ? 0 : a._invoiced ? -1 : 1) * dir;
      return (a._name.localeCompare(b._name, 'ar')) * dir;
    });
    const start = (svcPage - 1) * svcPageSize;
    return {
      total: sorted.length,
      items: sorted.slice(start, start + svcPageSize)
    };
  };

  // تحميل الفنيين وأنواع الفحص عند فتح حوار تقرير الفحص مباشرة
  useEffect(() => {
    const loadTechs = async () => {
      try {
        setTechLoading(true);
        const res = await apiService.listTechnicians();
        console.log('Technicians response (inspection):', res);
        const items = Array.isArray(res) ? res : (res.data || res.items || []);
        setTechOptions(items);
      } catch (e) {
        console.error('Error loading technicians (inspection):', e);
        notifications.error('تعذر تحميل قائمة الفنيين');
      } finally {
        setTechLoading(false);
      }
    };

    const loadInspectionTypes = async () => {
      try {
        setInspectionTypesLoading(true);
        const response = await fetch(`${API_BASE_URL}/inspectiontypes`);
        if (response.ok) {
          const data = await response.json();
          const types = Array.isArray(data) ? data : (data.data || []);
          // Backend already filters by deletedAt and isActive, so we just use all returned types
          setInspectionTypes(types);
        } else {
          console.error('Error fetching inspection types:', response.statusText);
          setInspectionTypes([]);
        }
      } catch (e) {
        console.error('Error loading inspection types:', e);
        setInspectionTypes([]);
      } finally {
        setInspectionTypesLoading(false);
      }
    };

    if (inspectionOpen) {
      if (techOptions.length === 0) {
        loadTechs();
      }
      if (inspectionTypes.length === 0) {
        loadInspectionTypes();
      }
    }
  }, [inspectionOpen, techOptions.length, inspectionTypes.length, notifications]);

  // تحميل قائمة الفنيين عند فتح حوار الإسناد
  useEffect(() => {
    const loadTechs = async () => {
      try {
        setTechLoading(true);
        const res = await apiService.listTechnicians();
        console.log('Technicians response (assign):', res);
        const items = Array.isArray(res) ? res : (res.data || res.items || []);
        console.log('Technicians items:', items);
        setTechOptions(items);
      } catch (e) {
        console.error('Error loading technicians (assign):', e);
        notifications.error('تعذر تحميل قائمة الفنيين');
      } finally {
        setTechLoading(false);
      }
    };
    if (assignOpen && techOptions.length === 0) {
      loadTechs();
    }
  }, [assignOpen]);

  // تحميل قائمة الفنيين عند فتح وضع التعديل للخدمة
  useEffect(() => {
    const loadTechs = async () => {
      try {
        if (techOptions.length === 0) {
          setTechLoading(true);
          const res = await apiService.listTechnicians();
          console.log('Technicians response (edit service):', res);
          const items = Array.isArray(res) ? res : (res.data || res.items || []);
          setTechOptions(items);
        }
      } catch (e) {
        console.error('Error loading technicians (edit service):', e);
        notifications.error('تعذر تحميل قائمة الفنيين');
      } finally {
        setTechLoading(false);
      }
    };
    if (editingService && techOptions.length === 0) {
      loadTechs();
    }
  }, [editingService]);

  // Load user id and lists when opening issue modal
  useEffect(() => {
    const loadIssueData = async () => {
      try {
        setIssueError('');
        console.log('Loading issue data...');
        const [whResponse, itResponse] = await Promise.all([
          inventoryService.listWarehouses().catch(() => null),
          inventoryService.listItems().catch(() => null),
        ]);
        console.log('Warehouses response:', whResponse);
        console.log('Items response:', itResponse);

        // معالجة بيانات المخازن
        let warehousesData = [];
        if (whResponse) {
          // Handle new API response format (direct JSON)
          if (Array.isArray(whResponse)) {
            warehousesData = whResponse;
          } else if (whResponse && Array.isArray(whResponse.data)) {
            warehousesData = whResponse.data;
          } else if (whResponse && whResponse.warehouses && Array.isArray(whResponse.warehouses)) {
            warehousesData = whResponse.warehouses;
          } else if (whResponse && whResponse.ok) {
            // Handle old API response format
            const wh = await whResponse.json();
            if (Array.isArray(wh)) {
              warehousesData = wh;
            } else if (wh && Array.isArray(wh.data)) {
              warehousesData = wh.data;
            } else if (wh && wh.warehouses && Array.isArray(wh.warehouses)) {
              warehousesData = wh.warehouses;
            }
          }
        }
        setWarehouses(warehousesData);

        // معالجة بيانات العناصر
        let itemsData = [];
        if (itResponse) {
          // Handle new API response format (direct JSON)
          if (itResponse && itResponse.success && itResponse.data && itResponse.data.items) {
            itemsData = itResponse.data.items;
          } else if (Array.isArray(itResponse)) {
            itemsData = itResponse;
          } else if (itResponse && Array.isArray(itResponse.data)) {
            itemsData = itResponse.data;
          } else if (itResponse && itResponse.items && Array.isArray(itResponse.items)) {
            itemsData = itResponse.items;
          } else if (itResponse && itResponse.ok) {
            // Handle old API response format
            const it = await itResponse.json();
            if (Array.isArray(it)) {
              itemsData = it;
            } else if (it && Array.isArray(it.data)) {
              itemsData = it.data;
            } else if (it && it.items && Array.isArray(it.items)) {
              itemsData = it.items;
            }
          }
        }
        setItems(itemsData);

        console.log('Processed warehouses:', warehousesData);
        console.log('Processed items:', itemsData);
        try {
          const me = await apiService.authMe();
          if (me && (me.id || me.userId)) setCurrentUserId(Number(me.id || me.userId));
        } catch { }
        // احضر الفواتير إن لم تكن محملة لاستخدامها في الربط الاختياري
        try {
          if (invoices.length === 0 && !invoicesLoading) {
            await loadInvoices();
          }
        } catch { }
      } catch (e) {
        setIssueError('تعذر تحميل بيانات الصرف');
      }
    };
    if (issueOpen) loadIssueData();
  }, [issueOpen]);

  // Load data when opening Add Service modal
  useEffect(() => {
    const loadAddServiceData = async () => {
      try {
        setAddSvcError('');
        console.log('Loading add service data...');

        // تحميل قائمة الخدمات المتاحة
        const svcResponse = await repairService.getAvailableServices();
        console.log('Available services response:', svcResponse);

        // Handle new API response format (direct JSON)
        let servicesList = [];
        if (svcResponse) {
          // Handle response format from /api/services endpoint
          // Format: { items: [...], total: ..., limit: ..., offset: ..., ... }
          if (svcResponse.items && Array.isArray(svcResponse.items)) {
            // New format: { items: [...], total: ..., ... }
            servicesList = svcResponse.items;
          } else if (svcResponse.data && Array.isArray(svcResponse.data)) {
            // Alternative format: { data: [...] }
            servicesList = svcResponse.data;
          } else if (Array.isArray(svcResponse)) {
            // Direct array format
            servicesList = svcResponse;
          } else if (svcResponse.ok && typeof svcResponse.json === 'function') {
            // Handle old API response format (Response object)
            const svcData = await svcResponse.json();
            console.log('Services data:', svcData);
            if (svcData.items && Array.isArray(svcData.items)) {
              servicesList = svcData.items;
            } else if (Array.isArray(svcData)) {
              servicesList = svcData;
            }
          }
        }

        // Filter only active and non-deleted services
        servicesList = servicesList.filter(s => {
          // Check if service is active (default to true if not specified)
          const isActive = s.isActive !== false && s.isActive !== 0 && s.isActive !== '0';
          // Check if service is not deleted
          const notDeleted = !s.deletedAt;
          return isActive && notDeleted;
        });

        setAvailableServices(servicesList);
        console.log('Available services set:', servicesList.length, 'services', servicesList);

        // تحميل الفنيين إن لم يكونوا محملين مسبقًا
        if (techOptions.length === 0) {
          try {
            setTechLoading(true);
            const techResponse = await apiService.listTechnicians();
            console.log('Technicians response:', techResponse);

            // Handle new API response format (direct JSON)
            let techList = [];
            if (Array.isArray(techResponse)) {
              techList = techResponse;
            } else if (techResponse && techResponse.ok) {
              // Handle old API response format
              const techData = await techResponse.json();
              techList = Array.isArray(techData) ? techData : (techData.items || []);
            } else if (techResponse?.success && techResponse?.data) {
              // Handle { success: true, data: [...] } format
              techList = Array.isArray(techResponse.data) ? techResponse.data : [];
            }
            setTechOptions(techList);
            console.log('Tech options set:', techList.length);
          } catch (e) {
            console.error('Error loading technicians:', e);
            setTechOptions([]);
          } finally {
            setTechLoading(false);
          }
        }

        // تحميل الفواتير للربط الاختياري
        if (invoices.length === 0 && !invoicesLoading) {
          await loadInvoices();
        }
      } catch (e) {
        console.error('Error loading add service data:', e);
        setAddSvcError('تعذر تحميل بيانات إضافة الخدمة');
      }
    };
    if (addServiceOpen) loadAddServiceData();
  }, [addServiceOpen]);

  const handleAddServiceChange = (e) => {
    const { name, value } = e.target;
    setSvcForm((f) => ({ ...f, [name]: value }));
  };

  const handleManualServiceChange = (e) => {
    const { name, value } = e.target;
    setManualServiceForm((f) => ({ ...f, [name]: value }));
  };

  const normalizeInvoicesResponse = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload?.success && Array.isArray(payload.data?.invoices)) {
      return payload.data.invoices;
    }
    if (payload?.data && Array.isArray(payload.data)) {
      return payload.data;
    }
    if (payload?.invoices && Array.isArray(payload.invoices)) {
      return payload.invoices;
    }
    return [];
  };

  // Helper function to check if invoice belongs to repair request
  // Handles both repairId and repairRequestId fields from API
  const invoiceBelongsToRepair = (invoice, repairId) => {
    const invoiceRepairId = invoice.repairId || invoice.repairRequestId;
    return Number(invoiceRepairId) === Number(repairId);
  };

  const getInvoiceStatusLabel = (status) => {
    const statusMap = {
      'draft': 'مسودة',
      'sent': 'مرسلة',
      'paid': 'مدفوعة',
      'unpaid': 'غير مدفوعة',
      'partial': 'مدفوعة جزئياً',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة'
    };
    return statusMap[status] || status || 'غير محدد';
  };

  const getInvoiceStatusBadge = (status) => {
    const statusConfig = {
      'draft': { variant: 'outline', className: 'bg-gray-100 text-gray-800' },
      'sent': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'paid': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'unpaid': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'partial': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      'overdue': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'cancelled': { variant: 'outline', className: 'bg-gray-100 text-gray-800' }
    };
    const config = statusConfig[status] || { variant: 'outline', className: 'bg-gray-100 text-gray-800' };
    return config;
  };

  const ensureInvoiceForRepair = async (preferredInvoiceId) => {
    if (preferredInvoiceId) {
      return Number(preferredInvoiceId);
    }

    const existing = invoices.find(inv => invoiceBelongsToRepair(inv, id));
    if (existing?.id) {
      return existing.id;
    }

    try {
      const response = await apiService.request(`/invoices?repairRequestId=${id}&limit=50`);
      const fetched = normalizeInvoicesResponse(response);
      const match = fetched.find(inv => invoiceBelongsToRepair(inv, id));
      if (match?.id) {
        return match.id;
      }
    } catch (e) {
      console.error('Error resolving invoice for manual service:', e);
    }

    try {
      const created = await apiService.createInvoiceFromRepair(id, {
        totalAmount: 0,
        amountPaid: 0,
        status: 'draft',
        currency: 'EGP',
        taxAmount: 0
      });
      return created?.data?.id || created?.id || created?.invoiceId || null;
    } catch (creationError) {
      console.error('Error creating invoice for manual service:', creationError);
      throw creationError;
    }
  };

  const handleAddManualService = async () => {
    try {
      setAddSvcError('');
      if (!isManualService) return;
      if (!svcForm.technicianId) {
        setAddSvcError('يرجى اختيار الفني قبل إضافة الخدمة اليدوية');
        return;
      }

      const { name, unitPrice, quantity } = manualServiceForm;
      if (!name?.trim()) {
        setAddSvcError('اسم الخدمة اليدوية مطلوب');
        return;
      }
      if (!unitPrice || Number(unitPrice) <= 0) {
        setAddSvcError('السعر يجب أن يكون رقمًا أكبر من صفر');
        return;
      }
      if (!quantity || Number(quantity) <= 0) {
        setAddSvcError('الكمية يجب أن تكون رقمًا أكبر من صفر');
        return;
      }

      setAddSvcLoading(true);
      const targetInvoiceId = await ensureInvoiceForRepair(svcForm.invoiceId);
      if (!targetInvoiceId) {
        throw new Error('لم يتم إنشاء فاتورة لهذا الطلب');
      }

      const description = `${manualServiceForm.name.trim()}${svcForm.notes ? ` - ${svcForm.notes}` : ''}`.trim();
      const qty = Number(manualServiceForm.quantity);
      const price = Number(manualServiceForm.unitPrice);

      // إضافة InvoiceItem
      const invoiceItemResponse = await apiService.addInvoiceItem(targetInvoiceId, {
        itemType: 'service',
        description,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price
      });

      const invoiceItemId = invoiceItemResponse?.data?.id || invoiceItemResponse?.id;

      // إنشاء RepairRequestService للخدمة اليدوية لحفظ technicianId
      if (invoiceItemId && svcForm.technicianId) {
        try {
          const notesWithLink = `${svcForm.notes || ''} [invoiceItemId:${invoiceItemId}]`.trim();

          await repairService.addRepairRequestService({
            repairRequestId: Number(id),
            serviceId: null, // null للخدمات اليدوية
            technicianId: Number(svcForm.technicianId),
            price: price,
            notes: notesWithLink
          });
        } catch (rrsError) {
          console.error('Error creating RepairRequestService for manual service:', rrsError);
          // نستمر حتى لو فشل إنشاء RepairRequestService
        }
      }

      notifications.success('تمت إضافة الخدمة اليدوية إلى الفاتورة');

      // Wait a bit to ensure the invoice is updated in the database
      await new Promise(resolve => setTimeout(resolve, 500));

      await loadInvoices(); // تحديث الفواتير لعرض البنود الجديدة
      await loadServices(); // تحديث الخدمات لعرض الخدمة اليدوية

      setAddServiceOpen(false);
      setManualServiceForm({ name: '', unitPrice: '', quantity: 1 });
      setIsManualService(false);
      setSvcForm({ serviceId: '', price: '', technicianId: '', notes: '', invoiceId: '' });
    } catch (error) {
      console.error('Error adding manual service:', error);
      setAddSvcError(error?.message || 'تعذر إضافة الخدمة اليدوية');
    } finally {
      setAddSvcLoading(false);
    }
  };

  const handleAddServiceSubmit = async () => {
    try {
      setAddSvcError('');
      if (isManualService) {
        await handleAddManualService();
        return;
      }
      const { serviceId, price, technicianId, notes, invoiceId } = svcForm;
      if (!serviceId || !technicianId || !price) {
        setAddSvcError('يرجى اختيار الخدمة والفني وتحديد السعر');
        return;
      }
      setAddSvcLoading(true);
      console.log('Adding service with data:', { serviceId, price, technicianId, notes, invoiceId });

      // إنشاء خدمة طلب الإصلاح أولاً للحصول على ID
      const serviceResponse = await repairService.addRepairRequestService({
        repairRequestId: Number(id),
        serviceId: Number(serviceId),
        technicianId: Number(technicianId),
        price: Number(price),
        notes: notes || ''
      });
      const repairRequestServiceId = serviceResponse.id || serviceResponse.data?.id;
      console.log('✅ Service created with ID:', repairRequestServiceId);

      // ربط الخدمة بالفاتورة (تلقائياً أو يدوياً)
      try {
        // Auto-select the invoice for this repair request if not manually selected
        let targetInvoiceId = invoiceId ? Number(invoiceId) : null;

        if (!targetInvoiceId) {
          // Get fresh invoices and auto-select the one for this repair
          try {
            const freshInvoicesData = await apiService.request(`/invoices?repairRequestId=${id}&limit=50`);
            const freshInvoices = Array.isArray(freshInvoicesData.data) ? freshInvoicesData.data : (Array.isArray(freshInvoicesData) ? freshInvoicesData : []);
            const repairInvoice = freshInvoices.find(inv => invoiceBelongsToRepair(inv, id));
            targetInvoiceId = repairInvoice?.id || repairInvoice?.invoiceId;
          } catch (invoiceErr) {
            console.log('Error fetching invoices:', invoiceErr);
          }
        }

        // If still no invoice, create one automatically
        let isNewInvoice = false;
        if (!targetInvoiceId) {
          try {
            console.log('No invoice found, creating one automatically...');
            const createInvoiceResponse = await apiService.request('/invoices', {
              method: 'POST',
              body: JSON.stringify({
                repairRequestId: parseInt(id),
                status: 'draft',
                currency: 'EGP',
                totalAmount: 0
              })
            });
            targetInvoiceId = createInvoiceResponse.id || createInvoiceResponse.invoiceId || createInvoiceResponse.data?.id;
            isNewInvoice = true;
            console.log('✅ Created invoice automatically:', targetInvoiceId);
          } catch (createErr) {
            console.error('Error creating invoice:', createErr);
          }
        }

        if (targetInvoiceId) {
          // Get service name for description
          const selectedService = availableServices.find(s => s.id === Number(serviceId));
          const serviceName = selectedService?.name || selectedService?.serviceName || 'خدمة غير محددة';

          // Add service to invoice
          // IMPORTANT: If we just created the invoice (isNewInvoice = true), the backend
          // automatically adds all existing RepairRequestServices to the invoice.
          // Since we added the service to RepairRequestService above (lines 1491-1497),
          // it is already included in the new invoice.
          // We should ONLY manually add to invoice if we are using an EXISTING invoice.
          if (!isNewInvoice) {
            try {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/f156c2bc-9f08-4c5c-8680-c47fa95669dd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'RepairDetailsPage.js:1545', message: 'auto-adding service to invoice on create', data: { targetInvoiceId, serviceId: Number(serviceId), description: `${serviceName}${notes ? ` - ${notes}` : ''}`.trim() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,D' }) }).catch(() => { });
              // #endregion
              await apiService.addInvoiceItem(targetInvoiceId, {
                serviceId: Number(serviceId),
                repairRequestServiceId: repairRequestServiceId, // Link to RepairRequestService
                quantity: 1,
                unitPrice: Number(price) || 0,
                totalPrice: Number(price) || 0,
                description: `${serviceName}${notes ? ` - ${notes}` : ''}`.trim(),
                itemType: 'service'
              });
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/f156c2bc-9f08-4c5c-8680-c47fa95669dd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'RepairDetailsPage.js:1555', message: 'auto-add service to invoice completed', data: { targetInvoiceId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,D' }) }).catch(() => { });
              // #endregion

              console.log('✅ Service automatically linked to invoice:', targetInvoiceId);
            } catch (itemErr) {
              console.error('Error adding service to invoice:', itemErr);
              // Don't fail the whole operation if invoice linking fails
            }
          } else {
            console.log('ℹ️ Skipped manual invoice item addition because invoice is new and backend auto-populated it');
          }
        }
      } catch (e) {
        console.log('Service added but not linked to invoice:', e.message);
        // Don't fail the whole operation if invoice linking fails
      }
      notifications.success('تمت إضافة الخدمة بنجاح');
      setAddServiceOpen(false);
      setSvcForm({ serviceId: '', price: '', technicianId: '', notes: '', invoiceId: '' });
      await loadServices();
      await loadInvoices(); // تحديث الفواتير لعرض البنود الجديدة
    } catch (e) {
      setAddSvcError(e?.message || 'تعذر إضافة الخدمة');
      notifications.error('تعذر إضافة الخدمة');
    } finally {
      setAddSvcLoading(false);
    }
  };

  // 🔧 Fix #1: Lookup available quantity when both item and warehouse selected
  useEffect(() => {
    const { warehouseId, inventoryItemId } = issueForm || {};
    const fetchAvailable = async () => {
      try {
        setAvailableQty(null);
        setMinLevel(null);
        setIsLowStock(null);
        if (!warehouseId || !inventoryItemId) return;

        // Fix: inventoryService.listStockLevels returns data directly, not Response
        const levelsData = await inventoryService.listStockLevels({ warehouseId, inventoryItemId });
        let list = [];

        // Handle different response formats
        if (Array.isArray(levelsData)) {
          list = levelsData;
        } else if (levelsData && Array.isArray(levelsData.items)) {
          list = levelsData.items;
        } else if (levelsData && Array.isArray(levelsData.data)) {
          list = levelsData.data;
        } else if (levelsData && levelsData.items) {
          list = Array.isArray(levelsData.items) ? levelsData.items : [];
        }

        // 🔧 Fix: Filter to ensure we get the correct warehouse and item combination
        // Even if backend filters, double-check on frontend to avoid mismatches
        const row = list.find(level =>
          Number(level.warehouseId) === Number(warehouseId) &&
          Number(level.inventoryItemId) === Number(inventoryItemId)
        ) || (list && list[0] ? list[0] : null);
        if (row) {
          const qty = row.quantity != null ? Number(row.quantity) : 0;
          setAvailableQty(Number.isFinite(qty) ? qty : 0);

          const ml = row.minLevel != null ? Number(row.minLevel) : null;
          setMinLevel(Number.isFinite(ml) && ml >= 0 ? ml : null);

          const isLow = Boolean(row.isLowStock) || (qty <= (ml || 0));
          setIsLowStock(isLow);
        } else {
          // No stock level found - set to 0
          setAvailableQty(0);
          setMinLevel(null);
          setIsLowStock(false);
        }
      } catch (err) {
        console.error('Error fetching available stock:', err);
        setAvailableQty(null);
        setMinLevel(null);
        setIsLowStock(null);
      }
    };
    fetchAvailable();
  }, [issueForm.warehouseId, issueForm.inventoryItemId]);

  // Reset form when modal opens
  useEffect(() => {
    if (issueOpen) {
      // Reset form to initial state when opening modal
      setIssueForm({ warehouseId: '', inventoryItemId: '', quantity: 1, invoiceId: '', unitSellingPrice: '' });
      setSelectedItemInfo(null);
      setAvailableQty(null);
      setMinLevel(null);
      setIsLowStock(null);
      setIssueError('');
    }
  }, [issueOpen]);

  const fetchRepairDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching repair details for ID:', id);
      // محاولة الجلب من API أولاً
      try {
        const response = await apiService.getRepairRequest(id);
        // Extract data from response if it's wrapped in { success: true, data: {...} }
        const rep = response?.data || response;
        console.log('Repair response:', response);
        console.log('Repair data (extracted):', rep);
        console.log('🔍 Repair customFields:', rep?.customFields);
        console.log('🔍 Repair customFields type:', typeof rep?.customFields);
        console.log('🔍 Repair accessories:', rep?.accessories);
        console.log('🔍 Repair deviceSpecs:', rep?.deviceSpecs);
        console.log('🔍 Repair trackingToken:', rep?.trackingToken);
        console.log('🔍 Repair createdAt:', rep?.createdAt);
        console.log('🔍 Repair problem data:', {
          reportedProblem: rep?.reportedProblem,
          problemDescription: rep?.problemDescription,
          hasReportedProblem: !!rep?.reportedProblem,
          hasProblemDescription: !!rep?.problemDescription,
          reportedProblemType: typeof rep?.reportedProblem,
          problemDescriptionType: typeof rep?.problemDescription,
          reportedProblemValue: rep?.reportedProblem ? `${String(rep.reportedProblem).substring(0, 50)}...` : 'NULL/EMPTY',
          problemDescriptionValue: rep?.problemDescription ? `${String(rep.problemDescription).substring(0, 50)}...` : 'NULL/EMPTY'
        });
        if (rep) {
          setRepair(rep);

          // تحديد مواصفات الجهاز من البيانات المحملة
          setDeviceSpecs(rep.deviceSpecs || {
            cpu: rep.cpu || '',
            gpu: rep.gpu || '',
            ram: rep.ram || '',
            storage: rep.storage || '',
            screenSize: rep.screenSize || '',
            os: rep.os || ''
          });

          // تحديد تفاصيل طلب الإصلاح من البيانات المحملة
          // Load actual cost from invoice if exists
          let actualCostFromInvoice = rep.actualCost || null;
          // Will be updated when invoices load

          // Extract estimated cost range from customFields
          let customFields = {};
          try {
            if (rep.customFields) {
              if (typeof rep.customFields === 'string') {
                customFields = JSON.parse(rep.customFields);
              } else if (typeof rep.customFields === 'object') {
                customFields = rep.customFields;
              }
            }
            console.log('🔍 Loaded customFields from repair:', customFields);
            console.log('🔍 Estimated cost range:', {
              min: customFields.estimatedCostMin,
              max: customFields.estimatedCostMax,
              hasMin: customFields.estimatedCostMin !== undefined && customFields.estimatedCostMin !== null,
              hasMax: customFields.estimatedCostMax !== undefined && customFields.estimatedCostMax !== null
            });
          } catch (e) {
            console.error('Error parsing customFields:', e);
            customFields = {};
          }

          setRepairDetails({
            estimatedCost: rep.estimatedCost || 0,
            estimatedCostMin: customFields.estimatedCostMin !== undefined ? customFields.estimatedCostMin : null,
            estimatedCostMax: customFields.estimatedCostMax !== undefined ? customFields.estimatedCostMax : null,
            actualCost: actualCostFromInvoice,
            priority: rep.priority || 'MEDIUM',
            expectedDeliveryDate: rep.expectedDeliveryDate || null,
            notes: rep.notes || ''
          });

          // ملاحظات/سجل
          try {
            const logs = await apiService.getRepairLogs(id);
            setNotes(Array.isArray(logs) ? logs : (logs.items || []));
          } catch { }

          // المرفقات
          try {
            const atts = await apiService.listAttachments(id);
            setAttachments(Array.isArray(atts) ? atts : (atts.items || []));
          } catch { }

          // تحميل الفنيين المعينين من TechnicianRepairs
          loadAssignedTechnicians();

          // بيانات العميل - استخدم البيانات المتاحة في الطلب مباشرة
          if (rep?.customerName) {
            setCustomer({
              id: rep.customerId,
              name: rep.customerName,
              phone: rep.customerPhone,
              email: rep.customerEmail
            });
          }

          setNewStatus(rep?.status || 'pending');
        } else {
          throw new Error('Failed to fetch repair details');
        }
      } catch (fetchErr) {
        // fallback: بيانات تجريبية
        setRepair({
          id: id,
          requestNumber: 'REP-20241207-001',
          deviceType: 'لابتوب',
          deviceBrand: 'Dell',
          deviceModel: 'Inspiron 15 3000',
          problemDescription: 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل.',
          status: 'in-progress',
          priority: 'HIGH',
          estimatedCost: 450.00,
          actualCost: null,
          technicianNotes: 'تم فحص الجهاز، المشكلة في كارت الشاشة',
          customerNotes: 'الجهاز توقف فجأة أثناء العمل',
          createdAt: '2024-12-07T10:30:00Z',
          updatedAt: '2024-12-07T14:15:00Z',
          expectedDeliveryDate: '2024-12-10T16:00:00Z',
          customerId: 1,
          customerName: 'أحمد محمد علي',
          customerPhone: '+966501234567'
        });
        setCustomer({
          id: 1,
          name: 'أحمد محمد علي',
          phone: '+966501234567',
          email: 'ahmed.ali@email.com',
          address: 'الرياض، حي النرجس'
        });
        setNotes([
          { id: 1, content: 'تم استلام الجهاز وفحصه أولياً', author: 'فني الاستقبال', createdAt: '2024-12-07T10:30:00Z', type: 'system' },
          { id: 2, content: 'تم تشخيص المشكلة - كارت الشاشة يحتاج استبدال', author: 'أحمد الفني', createdAt: '2024-12-07T14:15:00Z', type: 'technician' },
          { id: 3, content: 'العميل يطلب تحديث حالة الإصلاح', author: 'أحمد محمد علي', createdAt: '2024-12-08T09:00:00Z', type: 'customer' },
          { id: 4, content: 'تم طلب قطعة الغيار من المورد', author: 'النظام', createdAt: '2024-12-08T11:30:00Z', type: 'system' }
        ]);
        setAttachments([
          { id: 1, name: 'صورة الجهاز قبل الإصلاح.jpg', type: 'image', size: '2.5 MB', uploadedAt: '2024-12-07T10:30:00Z', uploadedBy: 'فني الاستقبال' }
        ]);
        setNewStatus('in-progress');
      }
    } catch (err) {
      console.error('Error fetching repair details:', err);
      setError('حدث خطأ في تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true);
      setInvoicesError(null);

      console.log('Loading invoices for repair request:', id);
      console.log('API call params:', { repairRequestId: id, limit: 50 });

      // Use the new invoices service with repair request filter
      const data = await apiService.request(`/invoices?repairRequestId=${id}&limit=50`);
      console.log('Invoices response:', data);
      const invoicesArray = normalizeInvoicesResponse(data);
      console.log('Invoices array:', invoicesArray);
      console.log('Invoices array length:', invoicesArray.length);
      setInvoices(invoicesArray);

      // Update actual cost from invoice totalAmount if exists
      if (invoicesArray && invoicesArray.length > 0) {
        const latestInvoice = invoicesArray[0]; // Get latest invoice
        if (latestInvoice.totalAmount) {
          const invoiceTotal = parseFloat(latestInvoice.totalAmount) || 0;
          setRepairDetails(prev => ({
            ...prev,
            actualCost: invoiceTotal
          }));
          // Also update repair state
          setRepair(prev => prev ? { ...prev, actualCost: invoiceTotal } : null);
        }
      }
    } catch (e) {
      console.error('Error loading invoices:', e);
      console.error('Error details:', e.message, e.stack);
      setInvoicesError('تعذر تحميل الفواتير');
      setInvoices([]); // Set empty array on error
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setInvoicesLoading(true);
      const payload = {
        totalAmount: repair?.estimatedCost || 0,
        amountPaid: 0,
        status: 'draft',
        repairRequestId: Number(id),
        currency: 'EGP',
        taxAmount: 0,
        notes: `فاتورة لطلب الإصلاح ${repair?.requestNumber || id}`
      };

      console.log('Creating invoice with payload:', payload);
      // Use the new invoices service
      const responseData = await apiService.createInvoiceFromRepair(id, payload);
      console.log('Invoice creation response:', responseData);

      if (responseData.success) {
        notifications.success('تم إنشاء الفاتورة بنجاح مع ربط تلقائي للقطع والخدمات');
        await loadInvoices();
        await loadPartsUsed(); // Refresh to show updated invoice status
        await loadServices();
      } else {
        throw new Error(responseData.message || 'فشل في إنشاء الفاتورة');
      }
    } catch (e) {
      console.error('Error creating invoice:', e);
      // إذا كان السبب تكرارًا (409) نفتح الفاتورة الموجودة لهذا الطلب
      const isDuplicate = typeof e?.message === 'string' && e.message.includes('409');
      if (isDuplicate) {
        try {
          // Load existing invoices to find the duplicate
          await loadInvoices();
          const existingInvoice = invoices.find(inv => invoiceBelongsToRepair(inv, id));
          if (existingInvoice?.id) {
            notifications.warning('هناك فاتورة موجودة لهذا الطلب. يرجى فتح الفاتورة الموجودة من قائمة الفواتير أدناه.');
            return;
          }
        } catch (_) { }
        notifications.warning('هناك فاتورة موجودة لهذا الطلب. يرجى إنشاء فاتورة جديدة أو فتح الفاتورة الموجودة.');
        return;
      }
      notifications.error(`فشل إنشاء الفاتورة: ${e.message || 'خطأ غير معروف'}`);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadAssignedTechnicians = async () => {
    if (!id) return;
    try {
      setAssignedTechsLoading(true);
      // Use API to get technicians assigned to this repair
      const response = await apiService.request(`/repairs/${id}/technicians`);

      if (response.success && response.data) {
        setAssignedTechnicians(response.data);
      }
    } catch (error) {
      console.error('Error loading assigned technicians:', error);
    } finally {
      setAssignedTechsLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!assignTechId) return;
    try {
      const techId = Number(assignTechId);
      const repairId = Number(id);
      console.log('Assigning technician:', techId, 'to repair request:', repairId, 'with role:', assignRole);

      // Use new API
      const response = await technicianService.assignRepair(techId, repairId, assignRole);
      console.log('Assign repair response:', response);

      if (response && response.success) {
        notifications.success('تم إسناد الفني بنجاح');
        setAssignOpen(false);
        setAssignTechId('');
        setAssignRole('primary');

        // Reload assigned technicians
        loadAssignedTechnicians();

        // Update repair locally
        const tech = techOptions.find(t => Number(t.id) === techId);
        setRepair(prev => prev ? { ...prev, technicianId: techId, technicianName: tech?.name || `مستخدم #${techId}` } : prev);
      } else {
        throw new Error(response?.error || 'فشل في إسناد الفني');
      }
    } catch (e) {
      console.error('Error assigning technician:', e);
      notifications.error(e.message || 'تعذر إسناد الفني');
    }
  };

  const handleUnassignTechnician = async (technicianId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء تعيين هذا الفني؟')) {
      return;
    }

    try {
      const techId = Number(technicianId);
      const repairId = Number(id);
      await technicianService.unassignRepair(techId, repairId);
      notifications.success('تم إلغاء تعيين الفني بنجاح');
      loadAssignedTechnicians();
    } catch (error) {
      console.error('Error unassigning technician:', error);
      notifications.error('فشل في إلغاء تعيين الفني');
    }
  };

  const handleUpdateService = async (serviceId, serviceData) => {
    try {
      // التحقق إذا كانت الخدمة يدوية (ID يبدأ بـ "manual-")
      const isManual = String(serviceId).startsWith('manual-');

      if (isManual) {
        // للخدمات اليدوية: نحتاج تحديث InvoiceItem وإنشاء/تحديث RepairRequestService لحفظ technicianId
        const invoiceItemId = String(serviceId).replace('manual-', '');
        const service = services.find(s => s.id === serviceId);

        if (!service || !service.linkedInvoiceId) {
          throw new Error('لا يمكن تحديث الخدمة اليدوية: معلومات الفاتورة غير موجودة');
        }

        // تحديث InvoiceItem للوصف والسعر
        const updateData = {
          description: serviceData.notes
            ? `${service.serviceName || service.description} - ${serviceData.notes}`.trim()
            : service.serviceName || service.description,
          unitPrice: serviceData.price || service.price,
          totalPrice: serviceData.price || service.price
        };

        await apiService.updateInvoiceItem(service.linkedInvoiceId, invoiceItemId, updateData);

        // إنشاء أو تحديث RepairRequestService للخدمة اليدوية لحفظ technicianId
        // نحفظ invoiceItemId في notes للربط
        try {
          const notesWithLink = `${serviceData.notes || ''} [invoiceItemId:${invoiceItemId}]`.trim();

          // استخدام rrsId إذا كان موجوداً (من service object)
          if (service.rrsId) {
            // تحديث RepairRequestService الموجود
            await apiService.updateRepairRequestService(service.rrsId, {
              repairRequestId: parseInt(id),
              serviceId: null, // null للخدمات اليدوية
              technicianId: serviceData.technicianId !== undefined ? serviceData.technicianId : service.technicianId,
              price: serviceData.price !== undefined ? serviceData.price : service.price,
              notes: notesWithLink
            });
          } else {
            // البحث عن RepairRequestService موجود أولاً
            const existingServices = await repairService.getRepairRequestServices(id);
            const existingServicesArray = Array.isArray(existingServices) ? existingServices : [];

            const existingService = existingServicesArray.find(s =>
              s.serviceId === null &&
              s.notes &&
              s.notes.includes(`invoiceItemId:${invoiceItemId}`)
            );

            if (existingService && existingService.id) {
              // تحديث RepairRequestService الموجود
              await apiService.updateRepairRequestService(existingService.id, {
                repairRequestId: parseInt(id),
                serviceId: null,
                technicianId: serviceData.technicianId !== undefined ? serviceData.technicianId : existingService.technicianId,
                price: serviceData.price !== undefined ? serviceData.price : existingService.price,
                notes: notesWithLink
              });
            } else {
              // إنشاء RepairRequestService جديد للخدمة اليدوية
              await repairService.addRepairRequestService({
                repairRequestId: parseInt(id),
                serviceId: null, // null للخدمات اليدوية
                technicianId: serviceData.technicianId || null,
                price: serviceData.price || service.price,
                notes: notesWithLink
              });
            }
          }
        } catch (rrsError) {
          console.error('Error creating/updating RepairRequestService for manual service:', rrsError);
          // نستمر حتى لو فشل إنشاء RepairRequestService
        }

        notifications.success('تم تحديث الخدمة اليدوية بنجاح');
      } else {
        // للخدمات العادية من القائمة
        await apiService.updateRepairRequestService(serviceId, {
          repairRequestId: parseInt(id),
          ...serviceData
        });
        notifications.success('تم تحديث الخدمة بنجاح');
      }

      setEditingService(null);
      await loadServices();
    } catch (e) {
      console.error('Error updating service:', e);
      notifications.error('تعذر تحديث الخدمة: ' + (e.message || 'خطأ غير معروف'));
    }
  };

  const handleDeleteService = async (serviceId) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الخدمة؟');
    if (!confirmed) return;
    try {
      // Find the service object to check if it's a manual service
      const service = services.find(s => s.id === serviceId);

      if (service && service.isManual) {
        // For manual services, check if we have rrsId or invoiceItemId
        if (service.rrsId) {
          // If there's a RepairRequestService ID, delete it (this will also delete the invoice item)
          await apiService.deleteRepairRequestService(service.rrsId);
        } else if (service.invoiceItemId && service.linkedInvoiceId) {
          // If no rrsId but we have invoiceItemId, delete the invoice item directly
          await apiService.removeInvoiceItem(service.linkedInvoiceId, service.invoiceItemId);
        } else {
          throw new Error('لا يمكن حذف الخدمة: لا توجد معلومات كافية');
        }
      } else {
        // For regular services, use the serviceId directly
        // Check if serviceId is a number (regular service) or a string starting with "manual-" (manual service)
        if (typeof serviceId === 'string' && serviceId.startsWith('manual-')) {
          // Extract the invoiceItemId from the manual service ID
          const invoiceItemId = parseInt(serviceId.replace('manual-', ''));
          // Find the service to get linkedInvoiceId
          const manualService = services.find(s => s.id === serviceId);
          if (manualService && manualService.linkedInvoiceId) {
            await apiService.removeInvoiceItem(manualService.linkedInvoiceId, invoiceItemId);
          } else {
            throw new Error('لا يمكن حذف الخدمة: لا توجد معلومات الفاتورة');
          }
        } else {
          // Regular service - use the ID as is
          await apiService.deleteRepairRequestService(serviceId);
        }
      }

      notifications.success('تم حذف الخدمة بنجاح');
      setDeletingService(null);
      await loadServices();
      await loadInvoices(); // Refresh invoices to update totals
    } catch (e) {
      console.error('Error deleting service:', e);
      notifications.error(`تعذر حذف الخدمة: ${e.message || 'خطأ غير معروف'}`);
    }
  };

  const handleDeletePart = async (partId) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه القطعة؟ سيتم حذفها من الفاتورة أيضاً إذا كانت موجودة.');
    if (!confirmed) return;
    try {
      await apiService.request(`/partsused/${partId}`, { method: 'DELETE' });
      notifications.success('تم حذف القطعة بنجاح');
      await loadPartsUsed();
      await loadInvoices();
    } catch (e) {
      console.error('Error deleting part:', e);
      notifications.error('تعذر حذف القطعة');
    }
  };

  const handlePrint = (type) => {
    console.log('Printing repair request:', id, 'with type:', type);
    if (!id) {
      console.error('Repair ID is missing');
      return;
    }
    // فتح صفحات الطباعة من الـ Backend مباشرةً لتفادي مشاكل CORS/Assets
    const base = `${API_BASE_URL}/repairs`;
    let url = `${base}/${id}/print/receipt`;
    if (type === 'receipt') url = `${base}/${id}/print/receipt`;
    if (type === 'sticker') url = `${base}/${id}/print/sticker`;
    if (type === 'qr') url = `${base}/${id}/print/receipt`;
    if (type === 'inspection') url = `${base}/${id}/print/inspection`;
    if (type === 'delivery') url = `${base}/${id}/print/delivery`;
    if (type === 'invoice') url = `${base}/${id}/print/invoice`;
    console.log('Opening print URL:', url);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      console.error('Failed to open print window. Please check popup blocker settings.');
      alert('فشل فتح نافذة الطباعة. يرجى التحقق من إعدادات منع النوافذ المنبثقة.');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('سيتم حذف طلب الإصلاح نهائيًا. هل أنت متأكد؟');
    if (!confirmed) return;
    try {
      console.log('Deleting repair request:', id);
      await apiService.deleteRepairRequest(id);
      notifications.success('تم حذف الطلب بنجاح');
      navigate('/repairs');
    } catch (e) {
      console.error('Error deleting repair request:', e);
      notifications.error('تعذر حذف الطلب');
    }
  };

  // 🔧 Fix #6: Enhanced handleStatusUpdate with invoice auto-creation notification
  const handleStatusUpdate = async () => {
    try {
      console.log('Updating repair status to:', newStatus, 'for repair request:', id);
      // تحديث عبر API ثم تحديث الواجهة
      const response = await apiService.updateRepairStatus(id, newStatus);
      console.log('Status update response:', response);

      setRepair(prev => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : prev));
      setEditingStatus(false);

      // 🔧 Fix #6: Display invoice auto-creation notification if invoice was created
      if (response && response.invoiceCreated) {
        notifications.success(
          response.invoiceMessage || `تم تحديث الحالة وإنشاء فاتورة تلقائياً رقم #${response.invoiceId}`,
          { title: 'نجاح', duration: 5000 }
        );
        // Refresh invoices list to show new invoice
        try {
          await loadInvoices();
        } catch (_) { }
      } else {
        notifications.success('تم تحديث الحالة بنجاح', { title: 'نجاح', duration: 2500 });
      }

      // Refresh repair details to get updated data
      try {
        await fetchRepairDetails();
      } catch (_) { }
    } catch (err) {
      console.error('Error updating repair status:', err);
      setError('حدث خطأ في تحديث حالة الطلب');
      notifications.error('حدث خطأ في تحديث حالة الطلب');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: newNote,
      author: user?.name || user?.username || 'المستخدم الحالي',
      createdAt: new Date().toISOString(),
      type: 'note'
    };

    // تحديث تفاؤلي
    setNotes(prev => [...prev, optimistic]);
    setNewNote('');
    setAddingNote(false);

    try {
      console.log('Adding note with content:', optimistic.content, 'to repair request:', id);
      // تمرير userId من user object (من auth store)
      const currentUserId = user?.id || user?.userId || 1;
      console.log('Using userId:', currentUserId, 'from user:', user);
      const res = await apiService.addRepairNote(id, optimistic.content, currentUserId);
      console.log('Note added response:', res);

      // إعادة تحميل الملاحظات من API للحصول على الأسماء الصحيحة
      try {
        const logs = await apiService.getRepairLogs(id);
        const updatedNotes = Array.isArray(logs) ? logs : (logs.items || []);
        setNotes(updatedNotes);
      } catch (reloadErr) {
        console.error('Error reloading notes:', reloadErr);
        // في حالة فشل إعادة التحميل، استخدم البيانات من الـ response
        const saved = {
          id: res?.id ?? optimistic.id,
          content: optimistic.content,
          author: user?.name || user?.username || (res?.userId ? `مستخدم #${res.userId}` : optimistic.author),
          createdAt: res?.createdAt || optimistic.createdAt,
          type: res?.action || 'note',
        };
        setNotes(prev => prev.map(n => (n.id === optimistic.id ? saved : n)));
      }

      notifications.success('تم حفظ الملاحظة بنجاح');
    } catch (e) {
      console.error('Error adding note:', e);
      // تراجع عند الفشل
      setNotes(prev => prev.filter(n => n.id !== optimistic.id));
      notifications.error('تعذر حفظ الملاحظة');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in-progress': { text: 'قيد الإصلاح', color: 'bg-blue-100 text-blue-800', icon: Play },
      'waiting-parts': { text: 'بانتظار قطع غيار', color: 'bg-orange-100 text-orange-800', icon: ShoppingCart },
      'ready-for-pickup': { text: 'جاهز للاستلام', color: 'bg-green-100 text-green-800', icon: Package },
      'on-hold': { text: 'معلق', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
      completed: { text: 'مكتمل', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { text: 'ملغي', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      LOW: { text: 'منخفضة', color: 'bg-gray-100 text-gray-800' },
      MEDIUM: { text: 'متوسطة', color: 'bg-yellow-100 text-yellow-800' },
      HIGH: { text: 'عالية', color: 'bg-red-100 text-red-800' },
      URGENT: { text: 'عاجلة', color: 'bg-red-200 text-red-900' }
    };
    return priorityMap[priority] || priorityMap.MEDIUM;
  };

  // دالة تصفية الأنشطة
  const getFilteredSortedNotes = () => {
    let filtered = [...notes]; // نسخ المصفوفة لتجنب التعديل المباشر

    // تصفية حسب النوع
    if (activityFilter !== 'all') {
      filtered = filtered.filter(note => {
        const noteType = note.type || 'note'; // قيمة افتراضية إذا لم يكن هناك نوع
        if (activityFilter === 'system') return noteType === 'system';
        if (activityFilter === 'technician') return noteType === 'technician';
        if (activityFilter === 'customer') return noteType === 'customer';
        return false; // إرجاع false بدلاً من true للفلترة الصحيحة
      });
    }

    // ترتيب حسب التاريخ
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return activitySort === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  // دالة حساب إجمالي المدفوعات
  const getTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  // دالة الحصول على لون طريقة الدفع
  const getPaymentMethodColor = (method) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      check: 'bg-orange-100 text-orange-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  // دالة الحصول على نص طريقة الدفع
  const getPaymentMethodText = (method) => {
    const texts = {
      cash: 'نقدي',
      card: 'بطاقة ائتمان',
      bank_transfer: 'تحويل بنكي',
      check: 'شيك'
    };
    return texts[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="p-8">
        <p className="text-gray-600">الطلب غير موجود</p>
        <Link to="/repairs" className="mt-4 inline-block">
          <SimpleButton variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لقائمة الطلبات
          </SimpleButton>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(repair.status);
  const priorityInfo = getPriorityInfo(repair.priority);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="w-full lg:max-w-2xl">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Link to="/repairs">
              <SimpleButton variant="ghost" size="sm" className="p-1 h-8 w-8">
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate max-w-[200px] xs:max-w-none">
              تفاصيل الطلب: {repair.requestNumber}
            </h1>
            <div className="flex items-center gap-2">
              <SimpleBadge className={statusInfo.color}>
                <StatusIcon className="w-3 h-3 ml-1" />
                {statusInfo.text}
              </SimpleBadge>
              <SimpleBadge className={priorityInfo.color}>
                {priorityInfo.text}
              </SimpleBadge>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            تاريخ الإنشاء: {repair.createdAt ? (() => {
              try {
                const date = new Date(repair.createdAt);
                return isNaN(date.getTime()) ? 'غير محدد' : date.toLocaleDateString('en-GB');
              } catch (e) {
                return 'غير محدد';
              }
            })() : 'غير محدد'}
          </p>
          {/* Tracking Link */}
          {repair.trackingToken || repair.id ? (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 shrink-0">رابط التتبع:</span>
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 w-full sm:max-w-md overflow-hidden">
                <span className="text-xs sm:text-sm text-blue-600 font-mono truncate flex-1">
                  {getFrontendBaseUrl()}/track?trackingToken={repair.trackingToken || repair.id}
                </span>
                <SimpleButton
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const trackingUrl = `${getFrontendBaseUrl()}/track?trackingToken=${repair.trackingToken || repair.id}`;
                    try {
                      await navigator.clipboard.writeText(trackingUrl);
                      setTrackingLinkCopied(true);
                      notifications.success('تم نسخ رابط التتبع');
                      setTimeout(() => setTrackingLinkCopied(false), 2000);
                    } catch (err) {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = trackingUrl;
                      textArea.style.position = 'fixed';
                      textArea.style.opacity = '0';
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        setTrackingLinkCopied(true);
                        notifications.success('تم نسخ رابط التتبع');
                        setTimeout(() => setTrackingLinkCopied(false), 2000);
                      } catch (fallbackErr) {
                        notifications.error('فشل نسخ الرابط');
                      }
                      document.body.removeChild(textArea);
                    }
                  }}
                  className="p-1 h-auto shrink-0"
                  title="نسخ رابط التتبع"
                >
                  {trackingLinkCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </SimpleButton>
              </div>
            </div>
          ) : null}
        </div>

        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
            <SimpleButton
              size="sm"
              variant="outline"
              onClick={() => setEditingStatus(!editingStatus)}
              className="rounded-lg"
              title="تحديث الحالة"
            >
              <Edit className="w-4 h-4 ml-0 sm:ml-2" />
              <span className="hidden sm:inline">تحديث الحالة</span>
            </SimpleButton>
            <SimpleButton size="sm" onClick={() => setAssignOpen(true)} className="rounded-lg" title="إسناد فني">
              <UserPlus className="w-4 h-4 ml-0 sm:ml-2" />
              <span className="hidden sm:inline">إسناد فني</span>
            </SimpleButton>
            <SimpleButton size="sm" variant="outline" onClick={() => handlePrint('receipt')} className="rounded-lg" title="طباعة إيصال">
              <Printer className="w-4 h-4 ml-0 sm:ml-2" />
              <span className="hidden sm:inline">طباعة إيصال</span>
            </SimpleButton>
            <SimpleButton size="sm" variant="outline" onClick={() => handlePrint('sticker')} className="rounded-lg" title="طباعة استيكر">
              <QrCode className="w-4 h-4 ml-0 sm:ml-2" />
              <span className="hidden sm:inline">طباعة استيكر</span>
            </SimpleButton>
            <SimpleButton size="sm" variant="ghost" onClick={handleDelete} className="rounded-lg text-red-600" title="حذف">
              <Trash2 className="w-4 h-4 ml-0 sm:ml-2" />
              <span className="hidden sm:inline">حذف</span>
            </SimpleButton>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-6 space-x-reverse min-w-max px-1" aria-label="Tabs">
          {[
            { key: 'status', label: 'الحالة والتفاصيل', icon: Wrench },
            { key: 'timeline', label: 'المخطط الزمني', icon: Clock },
            { key: 'attachments', label: 'المرفقات', icon: Paperclip },
            { key: 'reports', label: 'تقارير الفحص', icon: FileText },
            { key: 'invoices', label: 'الفواتير', icon: FileText },
            { key: 'payments', label: 'المدفوعات', icon: Settings },
            { key: 'activity', label: 'سجل الأنشطة', icon: MessageSquare },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <Icon className="w-4 h-4 ml-2" />{t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* حوار إضافة خدمة - تصميم جديد */}
      {addServiceOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto transform transition-all overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">إضافة خدمة جديدة</h3>
                <p className="text-blue-100 text-sm mt-1">أضف خدمة من القائمة أو أدخل خدمة مخصصة</p>
              </div>
              <button
                onClick={() => setAddServiceOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {addSvcError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {addSvcError}
                </div>
              )}

              {/* Service Type Toggle */}
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-200 flex items-center relative">
                <div className="flex-1 flex items-center justify-between px-4 py-2">
                  <span className={`text-sm font-medium transition-colors ${!isManualService ? 'text-blue-700' : 'text-gray-500'}`}>
                    من القائمة - اختر خدمة محفوظة
                  </span>
                  <Wrench className={`w-4 h-4 ${!isManualService ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isManualService}
                      onChange={() => {
                        setIsManualService(!isManualService);
                        setAddSvcError('');
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex-1 flex items-center justify-between px-4 py-2 flex-row-reverse">
                  <span className={`text-sm font-medium transition-colors ${isManualService ? 'text-blue-700' : 'text-gray-500'}`}>
                    يدوي
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {!isManualService ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">اختر الخدمة <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        name="serviceId"
                        value={svcForm.serviceId}
                        onChange={(e) => {
                          const sel = e.target.value;
                          const svc = availableServices.find(s => String(s.id) === String(sel) || String(s.serviceId) === String(sel));
                          setSvcForm(f => ({ ...f, serviceId: sel, price: svc ? (svc.basePrice || svc.price || svc.unitPrice || '') : f.price }));
                        }}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-shadow"
                        disabled={availableServices.length === 0}
                      >
                        <option value="">-- اختر الخدمة --</option>
                        {availableServices.map(s => (
                          <option key={s.id || s.serviceId} value={s.id || s.serviceId}>
                            {s.serviceName || s.name || `خدمة #${s.id || s.serviceId}`}
                          </option>
                        ))}
                      </select>
                      <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الخدمة <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={manualServiceForm.name}
                      onChange={handleManualServiceChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="أدخل اسم الخدمة..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الفني المسؤول <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        name="technicianId"
                        value={svcForm.technicianId}
                        onChange={handleAddServiceChange}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-shadow"
                      >
                        <option value="">-- اختر الفنى --</option>
                        {techOptions.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name || t.fullName || `${t.firstName} ${t.lastName}` || `فني #${t.id}`}
                          </option>
                        ))}
                      </select>
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">السعر (جنيه) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="number"
                        name={isManualService ? "unitPrice" : "price"}
                        value={isManualService ? manualServiceForm.unitPrice : svcForm.price}
                        onChange={isManualService ? handleManualServiceChange : handleAddServiceChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-left ltr"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">ج.م</span>
                    </div>
                  </div>
                </div>

                {isManualService && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الكمية</label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={manualServiceForm.quantity}
                      onChange={handleManualServiceChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظات إضافية</label>
                  <textarea
                    name="notes"
                    value={svcForm.notes}
                    onChange={handleAddServiceChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                    rows={3}
                    placeholder="أي تفاصيل أو ملاحظات خاصة بالخدمة..."
                  />
                </div>

                {/* Invoice Link Section */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                    <FileText className="w-4 h-4" />
                    ربط بفاتورة (اختياري)
                  </label>
                  <select
                    name="invoiceId"
                    value={svcForm.invoiceId}
                    onChange={handleAddServiceChange}
                    className="w-full px-4 py-2.5 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">بدون ربط - سيتم الربط تلقائياً بالفاتورة الأولى</option>
                    {invoices.map((inv) => (
                      <option key={inv.id || inv.invoiceId} value={inv.id || inv.invoiceId}>
                        {inv.title || `فاتورة #${inv.id || inv.invoiceId}`} — {formatMoney(inv.totalAmount || inv.amount || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setAddServiceOpen(false)}
                className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-red-500">* حقول مطلوبة</span>
                <button
                  onClick={handleAddServiceSubmit}
                  disabled={
                    addSvcLoading ||
                    (isManualService
                      ? !manualServiceForm.name?.trim() ||
                      Number(manualServiceForm.unitPrice) <= 0 ||
                      Number(manualServiceForm.quantity) <= 0
                      : !svcForm.serviceId || !svcForm.technicianId || !svcForm.price)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {addSvcLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      إضافة الخدمة
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'timeline' && (
            <>
              <RepairTimeline repair={repair} compact={false} />
            </>
          )}

          {activeTab === 'status' && (
            <>
              <StatusFlow currentStatus={repair.status} compact={false} />

              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="flex items-center">
                    <Wrench className="w-5 h-5 ml-2" />
                    تفاصيل الجهاز والمشكلة
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجهاز</label>
                        <p className="text-gray-900">{repair.deviceType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الماركة والموديل</label>
                        <p className="text-gray-900">{repair.deviceBrand} {repair.deviceModel}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة المقدرة</label>
                        {(() => {
                          // Try to get min/max from customFields
                          let customFields = {};
                          try {
                            if (repair.customFields) {
                              customFields = typeof repair.customFields === 'string'
                                ? JSON.parse(repair.customFields)
                                : (repair.customFields || {});
                            }
                          } catch (e) {
                            customFields = {};
                          }

                          const minCost = customFields?.estimatedCostMin;
                          const maxCost = customFields?.estimatedCostMax;

                          if (minCost !== undefined && maxCost !== undefined && minCost !== null && maxCost !== null) {
                            return (
                              <p className="text-gray-900 font-semibold">
                                من {formatNumber(minCost)} إلى {formatNumber(maxCost)} ج.م
                              </p>
                            );
                          } else {
                            return <p className="text-gray-900 font-semibold">لم يتم تحديدها بعد</p>;
                          }
                        })()}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة الفعلية</label>
                        <p className="text-gray-900">{repair.actualCost != null ? formatMoney(repair.actualCost) : 'لم يتم تحديدها بعد'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">موعد التسليم المتوقع</label>
                        <p className="text-gray-900">{repair.expectedDeliveryDate ? new Date(repair.expectedDeliveryDate).toLocaleDateString('en-GB') : 'لم يتم تحديده بعد'}</p>
                      </div>
                    </div>

                    {/* نموذج تعديل تفاصيل طلب الإصلاح */}
                    <div className="mt-4">
                      <SimpleButton size="sm" variant="outline" onClick={() => setEditingDetails(true)}>
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل التفاصيل
                      </SimpleButton>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">وصف المشكلة</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900">{repair.problemDescription || repair.reportedProblem || '—'}</p>
                    </div>
                  </div>
                  {repair.technicianNotes && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الفني</label>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-blue-900">{repair.technicianNotes}</p>
                      </div>
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>

              {/* خدمات الإصلاح (Services) */}
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <Settings className="w-5 h-5 ml-2" />
                      خدمات الإصلاح
                    </SimpleCardTitle>
                    <SimpleButton size="sm" variant="outline" onClick={() => setAddServiceOpen(true)}>
                      <Plus className="w-4 h-4 ml-1" /> إضافة خدمة
                    </SimpleButton>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {/* أدوات التحكم: فرز وترقيم لخدمات الإصلاح */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <label>ترتيب حسب:</label>
                      <select
                        value={svcSortBy}
                        onChange={(e) => { setSvcSortBy(e.target.value); setSvcPage(1); }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="name">الاسم</option>
                        <option value="price">السعر</option>
                        <option value="invoiced">حالة الفوترة</option>
                      </select>
                      <select
                        value={svcSortDir}
                        onChange={(e) => { setSvcSortDir(e.target.value); setSvcPage(1); }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="asc">تصاعدي</option>
                        <option value="desc">تنازلي</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        className="px-2 py-1 border rounded disabled:opacity-50"
                        disabled={svcPage <= 1}
                        onClick={() => setSvcPage(p => Math.max(1, p - 1))}
                      >السابق</button>
                      <span className="px-2">صفحة {svcPage}</span>
                      <button
                        className="px-2 py-1 border rounded"
                        onClick={() => setSvcPage(p => p + 1)}
                      >التالي</button>
                      <select
                        value={svcPageSize}
                        onChange={(e) => { setSvcPageSize(Number(e.target.value)); setSvcPage(1); }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                  {partsLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ) : partsError ? (
                    <div className="text-red-600 text-sm">{partsError}</div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <div className="text-gray-600 text-lg font-medium">لا توجد خدمات مسجلة</div>
                      <div className="text-gray-500 text-sm mt-2">لم يتم تسجيل أي خدمات إصلاح لهذا الطلب بعد</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getSortedPagedServices().items.map((service) => {
                        // Use same logic as getSortedPagedServices: manual services are always invoiced
                        const invoiced = !!service.invoiceItemId || service.isManual;
                        const isEditing = editingService?.id === service.id;
                        return (
                          <div key={service.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-400 hover:from-purple-100 hover:to-pink-100 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editingService.price || service.price || ''}
                                        onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">الفني</label>
                                      <select
                                        value={editingService.technicianId !== undefined ? editingService.technicianId : (service.technicianId || '')}
                                        onChange={(e) => setEditingService({ ...editingService, technicianId: e.target.value || null })}
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                                      >
                                        <option value="">اختر الفني...</option>
                                        {techOptions.map((tech) => (
                                          <option key={tech.id} value={tech.id}>
                                            {tech.name || `مستخدم #${tech.id}`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                                      <textarea
                                        value={editingService.notes || service.notes || ''}
                                        onChange={(e) => setEditingService({ ...editingService, notes: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-purple-600" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-gray-900 text-lg">
                                          {service.serviceName || service.description || `خدمة إصلاح #${service.serviceId || 'يدوية'}`}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {service.isManual ? (
                                            <span className="text-purple-600">خدمة يدوية</span>
                                          ) : (
                                            <>كود الخدمة: {service.serviceId || 'غير محدد'}</>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-600">السعر:</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(service.finalPrice || service.price || 0)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-gray-600">الفني:</span>
                                        <span className="font-medium text-gray-900">
                                          {service.technicianName || (service.technicianId ? `مستخدم #${service.technicianId}` : 'غير محدد')}
                                        </span>
                                      </div>
                                    </div>

                                    {service.notes && (
                                      <div className="bg-white/70 rounded-lg p-3 mt-2">
                                        <div className="text-xs text-gray-500 mb-1">ملاحظات:</div>
                                        <div className="text-sm text-gray-700">{service.notes}</div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                <SimpleBadge className={invoiced ? 'bg-green-100 text-green-800 border border-green-200 px-3 py-1' : 'bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1'}>
                                  {invoiced ? '✓ تم الاضافة' : '⏳ غير تم الاضافة'}
                                </SimpleBadge>
                                <div className="flex gap-2">
                                  {editingService?.id === service.id ? (
                                    <>
                                      <SimpleButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          handleUpdateService(service.id, {
                                            serviceId: editingService.serviceId || service.serviceId,
                                            technicianId: editingService.technicianId !== undefined ? editingService.technicianId : service.technicianId,
                                            price: editingService.price || service.price,
                                            notes: editingService.notes !== undefined ? editingService.notes : service.notes
                                          });
                                        }}
                                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                      >
                                        <Save className="w-4 h-4 ml-1" />
                                        حفظ
                                      </SimpleButton>
                                      <SimpleButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingService(null)}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-700"
                                      >
                                        <X className="w-4 h-4 ml-1" />
                                        إلغاء
                                      </SimpleButton>
                                    </>
                                  ) : (
                                    <>
                                      <SimpleButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingService(service)}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                      >
                                        <Edit className="w-4 h-4 ml-1" />
                                        تعديل
                                      </SimpleButton>
                                      <SimpleButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteService(service.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                      >
                                        <Trash2 className="w-4 h-4 ml-1" />
                                        حذف
                                      </SimpleButton>
                                    </>
                                  )}
                                </div>
                                {!invoiced && (
                                  <SimpleButton
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        // First check the invoices state (already loaded and normalized)
                                        let targetInvoice = invoices.find(inv => invoiceBelongsToRepair(inv, id));
                                        let targetInvoiceId = targetInvoice?.id || targetInvoice?.invoiceId;

                                        // If not found in state, fetch fresh from API (same logic as ensureInvoiceForRepair)
                                        if (!targetInvoiceId) {
                                          try {
                                            const freshInvoicesData = await apiService.request(`/invoices?repairRequestId=${id}&limit=50`);
                                            const freshInvoices = normalizeInvoicesResponse(freshInvoicesData);

                                            console.log('Debug - Fresh invoices:', freshInvoices);
                                            console.log('Debug - Looking for repairRequestId:', parseInt(id));

                                            targetInvoice = freshInvoices.find(inv => invoiceBelongsToRepair(inv, id));
                                            targetInvoiceId = targetInvoice?.id || targetInvoice?.invoiceId;

                                            // Update invoices state if we found one
                                            if (targetInvoiceId && invoices.length === 0) {
                                              setInvoices(freshInvoices);
                                            }
                                          } catch (fetchErr) {
                                            console.error('Error fetching invoices:', fetchErr);
                                          }
                                        }

                                        if (!targetInvoiceId) {
                                          notifications.warning('لا توجد فواتير لهذا الطلب. يرجى إنشاء فاتورة أولاً');
                                          return;
                                        }
                                        console.log('Adding service to invoice:', {
                                          targetInvoiceId,
                                          service,
                                          serviceKeys: Object.keys(service),
                                          payload: {
                                            serviceId: service.serviceId || service.id,
                                            quantity: 1,
                                            unitPrice: Number(service.price || 0),
                                            description: service.notes || service.serviceName || '',
                                            itemType: 'service'
                                          }
                                        });
                                        // إضافة عنصر فاتورة للخدمة
                                        const addData = await apiService.addInvoiceItem(targetInvoiceId, {
                                          serviceId: service.serviceId || service.id || null,
                                          quantity: 1,
                                          unitPrice: Number(service.price || 0),
                                          description: `${service.serviceName || 'خدمة إصلاح'} - ${service.notes || ''}`.trim(),
                                          itemType: 'service'
                                        });

                                        if (addData.success) {
                                          notifications.success('تم إضافة الخدمة إلى الفاتورة');
                                          await loadServices();
                                          await loadInvoices();
                                        } else if (addData.duplicate) {
                                          notifications.warning('هذه الخدمة موجودة بالفعل في الفاتورة');
                                          await loadServices(); // Refresh to update button state
                                        } else {
                                          throw new Error(addData.error || 'Failed to add service to invoice');
                                        }
                                      } catch (e) {
                                        console.error('Error adding service to invoice:', e);
                                        notifications.error(`تعذر إضافة الخدمة إلى الفاتورة: ${e.message}`);
                                      }
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                  >
                                    <Plus className="w-4 h-4" />
                                    إضافة للفاتورة
                                  </SimpleButton>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* ترقيم صفحات مبسط بناءً على العدد الكلي */}
                  <div className="flex justify-end items-center gap-2 mt-3 text-sm text-gray-600">
                    <span>إجمالي العناصر: {getSortedPagedServices().total}</span>
                  </div>
                </SimpleCardContent>
              </SimpleCard>


              {/* أزرار العمليات المباشرة (واتساب وإشعار) */}
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <Wrench className="w-5 h-5 ml-2" />
                      القطع المصروفة
                    </SimpleCardTitle>
                    <SimpleButton size="sm" variant="outline" onClick={() => setIssueOpen(true)}>
                      <Plus className="w-4 h-4 ml-1" /> صرف قطعة
                    </SimpleButton>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {/* أدوات التحكم: فرز وترقيم للقطع المصروفة */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <label>ترتيب حسب:</label>
                      <select
                        value={partsSortBy}
                        onChange={(e) => { setPartsSortBy(e.target.value); setPartsPage(1); }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="name">الاسم</option>
                        <option value="quantity">الكمية</option>
                        <option value="invoiced">حالة الفوترة</option>
                      </select>
                      <select
                        value={partsSortDir}
                        onChange={(e) => { setPartsSortDir(e.target.value); setPartsPage(1); }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="asc">تصاعدي</option>
                        <option value="desc">تنازلي</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        className="px-2 py-1 border rounded disabled:opacity-50"
                        disabled={partsPage <= 1}
                        onClick={() => setPartsPage(p => Math.max(1, p - 1))}
                      >السابق</button>
                      <span className="px-2">صفحة {partsPage}</span>
                      <button
                        className="px-2 py-1 border rounded"
                        onClick={() => setPartsPage(p => p + 1)}
                      >التالي</button>
                      <select
                        value={partsPageSize}
                        onChange={(e) => { setPartsPageSize(Number(e.target.value)); setPartsPage(1); }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                  {partsLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ) : partsError ? (
                    <div className="text-red-600 text-sm">{partsError}</div>
                  ) : partsUsed.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <div className="text-gray-600 text-lg font-medium">لا توجد قطع غيار مصروفة</div>
                      <div className="text-gray-500 text-sm mt-2">لم يتم صرف أي قطع غيار لهذا الطلب بعد</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getSortedPagedParts().items.map((pu) => {
                        const itemMeta = itemsMap[pu.inventoryItemId] || {};
                        const invoiced = !!pu.invoiceItemId;
                        return (
                          <div key={pu.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Wrench className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-lg">
                                      {itemMeta.name || `قطعة غيار #${pu.inventoryItemId}`}
                                    </div>
                                    {itemMeta.sku && (
                                      <div className="text-sm text-gray-500 font-mono">
                                        كود القطعة: {itemMeta.sku}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600">الكمية:</span>
                                    <span className="font-medium text-gray-900">{pu.quantity}</span>
                                  </div>
                                  {/* Display selling price only */}
                                  {pu.unitSellingPrice !== null && pu.unitSellingPrice !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                      <span className="text-gray-600">سعر البيع:</span>
                                      <span className="font-medium text-gray-900">{formatMoney(pu.unitSellingPrice)}</span>
                                    </div>
                                  )}
                                  {/* Display total price */}
                                  {pu.totalPrice !== null && pu.totalPrice !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      <span className="text-gray-600">السعر الإجمالي:</span>
                                      <span className="font-medium text-gray-900">{formatMoney(pu.totalPrice)}</span>
                                    </div>
                                  )}
                                  {/* Status badge */}
                                  {pu.status && (
                                    <div className="flex items-center gap-2">
                                      <SimpleBadge className={
                                        pu.status === 'used' ? 'bg-green-100 text-green-800' :
                                          pu.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                            pu.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                                              pu.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                      }>
                                        {pu.status === 'used' ? '✓ مستخدم' :
                                          pu.status === 'approved' ? '✓ معتمد' :
                                            pu.status === 'requested' ? '⏳ قيد الانتظار' :
                                              pu.status === 'cancelled' ? '✗ ملغي' :
                                                pu.status}
                                      </SimpleBadge>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                <SimpleBadge className={invoiced ? 'bg-green-100 text-green-800 border border-green-200 px-3 py-1' : 'bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1'}>
                                  {invoiced ? '✓ تم الاضافة' : '⏳ غير تم الاضافة'}
                                </SimpleBadge>

                                <div className="flex gap-2">
                                  {!invoiced && (
                                    <SimpleButton
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                      onClick={async () => {
                                        try {
                                          // تأكد من وجود فاتورة واحدة على الأقل
                                          if (invoices.length === 0) {
                                            await loadInvoices();
                                          }

                                          // Wait a moment for state to update, then get fresh invoices
                                          await new Promise(resolve => setTimeout(resolve, 100));

                                          // Get fresh invoices from the API directly to avoid state timing issues
                                          const freshInvoicesData = await apiService.request(`/invoices?repairRequestId=${id}&limit=50`);

                                          // Handle different response formats
                                          let freshInvoices = [];
                                          if (Array.isArray(freshInvoicesData)) {
                                            freshInvoices = freshInvoicesData;
                                          } else if (freshInvoicesData?.data && Array.isArray(freshInvoicesData.data)) {
                                            freshInvoices = freshInvoicesData.data;
                                          } else if (freshInvoicesData?.success && freshInvoicesData?.data?.invoices && Array.isArray(freshInvoicesData.data.invoices)) {
                                            freshInvoices = freshInvoicesData.data.invoices;
                                          } else if (freshInvoicesData?.invoices && Array.isArray(freshInvoicesData.invoices)) {
                                            freshInvoices = freshInvoicesData.invoices;
                                          }

                                          console.log('Debug - Fresh invoices (parts):', freshInvoices);
                                          if (!Array.isArray(freshInvoices)) {
                                            throw new Error('Invalid invoices response format');
                                          }

                                          const targetInvoice = freshInvoices.find(inv => invoiceBelongsToRepair(inv, id));
                                          const targetInvoiceId = targetInvoice?.id || targetInvoice?.invoiceId;
                                          if (!targetInvoiceId) {
                                            notifications.warning('لا توجد فواتير لهذا الطلب. يرجى إنشاء فاتورة أولاً');
                                            return;
                                          }
                                          // إضافة عنصر فاتورة للقطعة المصروفة
                                          const addData = await apiService.addInvoiceItem(targetInvoiceId, {
                                            inventoryItemId: pu.inventoryItemId || null,
                                            quantity: Number(pu.quantity || 1),
                                            partsUsedId: pu.id || null,
                                            itemType: 'part'
                                          });

                                          if (addData.success) {
                                            notifications.success('تم إضافة القطعة إلى الفاتورة');
                                            await loadPartsUsed();
                                            await loadServices();
                                            await loadInvoices();
                                          } else if (addData.duplicate) {
                                            notifications.warning('هذه القطعة موجودة بالفعل في الفاتورة');
                                            await loadPartsUsed(); // Refresh to update button state
                                          } else {
                                            throw new Error(addData.error || 'Failed to add part to invoice');
                                          }
                                        } catch (e) {
                                          console.error('Error adding part to invoice:', e);
                                          notifications.error(`تعذر إضافة القطعة إلى الفاتورة: ${e.message}`);
                                        }
                                      }}
                                    >
                                      <Plus className="w-4 h-4" />
                                      إضافة للفاتورة
                                    </SimpleButton>
                                  )}

                                  <SimpleButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePrint('invoice')}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                  >
                                    <Printer className="w-4 h-4" />
                                    طباعة
                                  </SimpleButton>
                                  <SimpleButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeletePart(pu.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    حذف
                                  </SimpleButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* ترقيم صفحات مبسط بناءً على العدد الكلي */}
                  <div className="flex justify-end items-center gap-2 mt-3 text-sm text-gray-600">
                    <span>إجمالي العناصر: {getSortedPagedParts().total}</span>
                  </div>
                </SimpleCardContent>
              </SimpleCard>

            </>
          )}

          {activeTab === 'attachments' && (
            <>
              <AttachmentManager
                attachments={attachments}
                onUpload={async (file) => {
                  try {
                    const uploadId = notifications.loading(`جاري رفع الملف "${file.name}"...`, { title: 'رفع الملف' });
                    let created;
                    try {
                      created = await apiService.uploadAttachment(id, file, { title: file.name.replace(/\.[^/.]+$/, '') });
                    } catch (e) {
                      created = {
                        id: Date.now(),
                        name: file.name,
                        title: file.name.replace(/\.[^/.]+$/, ''),
                        description: '',
                        type: file.type,
                        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
                        fileSize: file.size,
                        uploadedAt: new Date().toISOString(),
                        uploadedBy: 'المستخدم الحالي',
                        url: URL.createObjectURL(file)
                      };
                    }
                    setAttachments(prev => [...prev, created]);
                    notifications.removeNotification(uploadId);
                    notifications.success(`تم رفع الملف "${file.name}" بنجاح`, { title: 'تم الرفع', duration: 3000 });
                  } catch (error) {
                    notifications.error('فشل في رفع الملف', { title: 'خطأ في الرفع' });
                  }
                }}
                onDelete={(id) => {
                  const attachment = attachments.find(att => att.id === id);
                  apiService.deleteAttachment?.(repair?.id || id, id).catch(() => { });
                  setAttachments(prev => prev.filter(att => att.id !== id));
                  notifications.success(`تم حذف الملف "${attachment?.title || attachment?.name}" بنجاح`, { title: 'تم الحذف', duration: 3000 });
                }}
                onView={(attachment) => {
                  if (attachment.url) {
                    window.open(attachment.url, '_blank');
                  } else {
                    alert('رابط الملف غير متوفر');
                  }
                }}
                onDownload={(attachment) => {
                  if (attachment.url) {
                    const link = document.createElement('a');
                    link.href = attachment.url;
                    link.download = attachment.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    alert('رابط التحميل غير متوفر');
                  }
                }}
                onEdit={(id, updates) => {
                  setAttachments(prev => prev.map(att =>
                    att.id === id ? { ...att, ...updates } : att
                  ));
                  notifications.success('تم تحديث بيانات الملف بنجاح', { title: 'تم التحديث', duration: 3000 });
                }}
                allowUpload={true}
                allowDelete={true}
                allowEdit={true}
                maxFileSize={10}
                allowedTypes={['image/*', 'application/pdf', '.doc', '.docx', 'video/*', 'audio/*']}
              />
            </>
          )}

          {activeTab === 'reports' && (
            <>
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <FileText className="w-5 h-5 ml-2" />
                      تقارير الفحص
                    </SimpleCardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <SimpleButton size="sm" variant="outline" onClick={loadInspectionReports} disabled={inspectionReportsLoading}>
                        <RefreshCw className={`w-4 h-4 ml-1 ${inspectionReportsLoading ? 'animate-spin' : ''}`} />
                        تحديث
                      </SimpleButton>
                      <SimpleButton size="sm" onClick={() => {
                        setEditingReport(null);
                        setInspectionForm({
                          inspectionTypeId: '',
                          technicianId: '',
                          reportDate: new Date().toISOString().slice(0, 10),
                          summary: '',
                          result: '',
                          recommendations: '',
                          notes: '',
                        });
                        setInspectionError('');
                        setInspectionOpen(true);
                      }}>
                        <Plus className="w-4 h-4 ml-1" />
                        إنشاء تقرير جديد
                      </SimpleButton>
                    </div>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {inspectionReportsLoading ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ) : inspectionReports.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <div className="text-gray-600 text-lg font-medium">لا توجد تقارير فحص</div>
                      <div className="text-gray-500 text-sm mt-2">لم يتم إنشاء أي تقارير فحص لهذا الطلب بعد</div>
                      <SimpleButton
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setEditingReport(null);
                          setInspectionForm({
                            inspectionTypeId: '',
                            technicianId: '',
                            reportDate: new Date().toISOString().slice(0, 10),
                            summary: '',
                            result: '',
                            recommendations: '',
                            notes: '',
                          });
                          setInspectionError('');
                          setInspectionOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إنشاء أول تقرير
                      </SimpleButton>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inspectionReports.map((report) => (
                        <div key={report.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-l-4 border-blue-400 hover:from-blue-100 hover:to-indigo-100 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-lg">
                                    {report.inspectionTypeName || 'تقرير فحص'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {report.reportDate ? new Date(report.reportDate).toLocaleDateString('ar-SA', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    }) : 'تاريخ غير محدد'}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                {report.technicianName && (
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">الفني:</span>
                                    <span className="font-medium text-gray-900">{report.technicianName}</span>
                                  </div>
                                )}
                                {report.branchName && (
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">الفرع:</span>
                                    <span className="font-medium text-gray-900">{report.branchName}</span>
                                  </div>
                                )}
                              </div>

                              {report.summary && (
                                <div className="bg-white/70 rounded-lg p-3 mt-2 mb-2">
                                  <div className="text-xs text-gray-500 mb-1 font-medium">الملخص:</div>
                                  <div className="text-sm text-gray-700">{report.summary}</div>
                                </div>
                              )}

                              {report.result && (
                                <div className="bg-white/70 rounded-lg p-3 mt-2 mb-2">
                                  <div className="text-xs text-gray-500 mb-1 font-medium">النتيجة والتشخيص:</div>
                                  <div className="text-sm text-gray-700">{report.result}</div>
                                </div>
                              )}

                              {report.recommendations && (
                                <div className="bg-white/70 rounded-lg p-3 mt-2 mb-2">
                                  <div className="text-xs text-gray-500 mb-1 font-medium">التوصيات:</div>
                                  <div className="text-sm text-gray-700">{report.recommendations}</div>
                                </div>
                              )}

                              {report.notes && (
                                <div className="bg-white/70 rounded-lg p-3 mt-2">
                                  <div className="text-xs text-gray-500 mb-1 font-medium">ملاحظات إضافية:</div>
                                  <div className="text-sm text-gray-700">{report.notes}</div>
                                </div>
                              )}

                              {/* Inspection Components */}
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                {report.inspectionTypeName === 'فحص نهائي' && (
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800 mb-2">
                                      يمكنك تحميل قائمة المكونات الافتراضية للفحص النهائي
                                    </p>
                                    <SimpleButton
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          // تحويل deviceType إلى lowercase لمطابقة deviceCategory في القوالب
                                          const deviceType = repair?.deviceType?.toLowerCase() || 'all';
                                          console.log('[RepairDetails] Device type:', deviceType);

                                          // تحويل LAPTOP -> laptop, PHONE -> phone, إلخ
                                          const deviceCategory = deviceType === 'laptop' ? 'laptop' :
                                            deviceType === 'phone' || deviceType === 'smartphone' ? 'phone' :
                                              deviceType === 'tablet' ? 'tablet' : 'all';
                                          console.log('[RepairDetails] Loading components for deviceCategory:', deviceCategory);

                                          const response = await apiService.loadFinalInspectionComponents(report.id, deviceCategory);
                                          console.log('[RepairDetails] Load components response:', response);

                                          notifications.success('تم', { message: response?.message || 'تم تحميل قائمة المكونات الافتراضية' });
                                          // إعادة تحميل المكونات
                                          await loadInspectionReports();
                                        } catch (error) {
                                          console.error('Error loading templates:', error);
                                          const errorMessage = error?.response?.data?.error || error?.message || 'فشل تحميل القوالب';
                                          notifications.error('خطأ', { message: errorMessage });
                                        }
                                      }}
                                    >
                                      <Plus className="w-4 h-4 ml-1" />
                                      تحميل قائمة المكونات الافتراضية
                                    </SimpleButton>
                                  </div>
                                )}
                                <InspectionComponentsList
                                  reportId={report.id}
                                  onComponentUpdate={() => {
                                    // Refresh reports if needed
                                    loadInspectionReports();
                                  }}
                                />
                              </div>

                              <div className="text-xs text-gray-500 mt-3">
                                {report.createdAt && (
                                  <span>
                                    تم الإنشاء: {new Date(report.createdAt).toLocaleString('ar-SA')}
                                  </span>
                                )}
                                {report.updatedAt && report.updatedAt !== report.createdAt && (
                                  <span className="mr-2">
                                    | آخر تحديث: {new Date(report.updatedAt).toLocaleString('ar-SA')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 mr-4">
                              <div className="flex gap-2">
                                <SimpleButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditReport(report)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                >
                                  <Edit className="w-4 h-4 ml-1" />
                                  تعديل
                                </SimpleButton>
                                <SimpleButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                >
                                  <Trash2 className="w-4 h-4 ml-1" />
                                  حذف
                                </SimpleButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>
            </>
          )}

          {activeTab === 'invoices' && (
            <>
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <FileText className="w-5 h-5 ml-2" />
                      فواتير الطلب
                    </SimpleCardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <SimpleButton size="sm" variant="outline" onClick={loadInvoices} disabled={invoicesLoading}>
                        <RefreshCw className={`w-4 h-4 ml-1 ${invoicesLoading ? 'animate-spin' : ''}`} />
                        تحديث
                      </SimpleButton>
                      <SimpleButton size="sm" onClick={handleCreateInvoice} disabled={invoicesLoading}>
                        <Plus className="w-4 h-4 ml-1" /> إنشاء فاتورة
                      </SimpleButton>
                    </div>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {invoicesLoading && (
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  )}
                  {invoicesError && (
                    <div className="text-red-600">{invoicesError}</div>
                  )}
                  {!invoicesLoading && !invoicesError && (
                    <div className="divide-y divide-gray-200">
                      {invoices.length === 0 ? (
                        <p className="text-gray-600">لا توجد فواتير بعد</p>
                      ) : (
                        invoices.map(inv => {
                          const statusBadge = getInvoiceStatusBadge(inv.status);
                          return (
                            <div key={inv.id || inv.invoiceId} className="py-3 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{inv.title || `فاتورة #${inv.id || inv.invoiceId}`}</p>
                                  <SimpleBadge className={statusBadge.className}>
                                    {getInvoiceStatusLabel(inv.status)}
                                  </SimpleBadge>
                                </div>
                                <p className="text-sm text-gray-600">المبلغ: {formatMoney(inv.totalAmount || inv.amount || 0, inv.currency || 'EGP')}</p>
                                {inv.amountPaid !== undefined && inv.amountPaid !== null && (
                                  <p className="text-xs text-gray-500">
                                    المدفوع: {formatMoney(inv.amountPaid || 0, inv.currency || 'EGP')} |
                                    المتبقي: {formatMoney((parseFloat(inv.totalAmount || inv.amount || 0) - parseFloat(inv.amountPaid || 0)), inv.currency || 'EGP')}
                                  </p>
                                )}
                                {inv.createdAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    التاريخ: {new Date(inv.createdAt).toLocaleDateString('en-GB', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                )}
                                {inv.paymentMethod && (
                                  <p className="text-xs text-gray-500">
                                    طريقة الدفع: {getPaymentMethodText(inv.paymentMethod)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Link to={`/invoices/${inv.id || inv.invoiceId}`}>
                                  <SimpleButton size="sm" variant="outline">
                                    <Eye className="w-4 h-4 ml-1" />
                                    عرض
                                  </SimpleButton>
                                </Link>
                                <SimpleButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrint('invoice')}
                                >
                                  <Printer className="w-4 h-4 ml-1" />
                                  طباعة فاتورة
                                </SimpleButton>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <Settings className="w-5 h-5 ml-2" />
                      المدفوعات والتحصيلات
                    </SimpleCardTitle>
                    <SimpleButton size="sm" onClick={() => setAddingPayment(true)}>
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة دفعة
                    </SimpleButton>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {/* ملخص المدفوعات */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatMoney(getTotalPayments())}</div>
                      <div className="text-sm text-gray-600">إجمالي المدفوع</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatMoney(repair?.actualCost || 0)}</div>
                      <div className="text-sm text-gray-600">التكلفة الفعلية</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${(repair?.actualCost || 0) - getTotalPayments() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney((repair?.actualCost || 0) - getTotalPayments())}
                      </div>
                      <div className="text-sm text-gray-600">المتبقي</div>
                    </div>
                  </div>

                  {/* نموذج إضافة دفعة */}


                  {/* قائمة المدفوعات */}
                  {paymentsLoading ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ) : paymentsError ? (
                    <div className="text-red-600">{paymentsError}</div>
                  ) : payments.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">لا توجد مدفوعات بعد</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {payments.map((payment, index) => (
                        <div key={payment.id || `payment-${index}`} className="py-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatMoney(payment.amount)}
                              </div>
                              <SimpleBadge className={getPaymentMethodColor(payment.method)}>
                                {getPaymentMethodText(payment.method)}
                              </SimpleBadge>
                              {payment.reference && (
                                <span className="text-sm text-gray-500 en-text">#{payment.reference}</span>
                              )}
                            </div>
                            {payment.paymentDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                التاريخ: {new Date(payment.paymentDate).toLocaleDateString('en-GB', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            )}
                            {payment.notes && (
                              <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              <span>{new Date(payment.createdAt).toLocaleString('ar-SA')}</span>
                              <span className="mr-2 text-gray-400">
                                | {new Date(payment.createdAt).toLocaleDateString('en-GB')} {new Date(payment.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="mx-2">•</span>
                              {payment.createdBy}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>
            </>
          )}

          {activeTab === 'activity' && (
            <>
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 ml-2" />
                      سجل الأنشطة والملاحظات
                    </SimpleCardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <select
                        value={activityFilter}
                        onChange={(e) => setActivityFilter(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="all">جميع الأنشطة</option>
                        <option value="system">أنشطة النظام</option>
                        <option value="technician">ملاحظات الفنيين</option>
                        <option value="customer">ملاحظات العملاء</option>
                      </select>
                      <select
                        value={activitySort}
                        onChange={(e) => setActivitySort(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="desc">الأحدث أولاً</option>
                        <option value="asc">الأقدم أولاً</option>
                      </select>
                      <SimpleButton size="sm" onClick={() => setAddingNote(true)}>
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة ملاحظة
                      </SimpleButton>
                    </div>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {/* نموذج إضافة ملاحظة */}

                  {/* قائمة الأنشطة المفلترة */}
                  <div className="space-y-4">
                    {getFilteredSortedNotes().length === 0 ? (
                      <p className="text-gray-600 text-center py-8">لا توجد أنشطة تطابق المرشح المحدد</p>
                    ) : (
                      getFilteredSortedNotes().map((note) => {
                        const getActivityIcon = (type) => {
                          switch (type) {
                            case 'system': return <Settings className="w-4 h-4 text-blue-600" />;
                            case 'technician': return <Wrench className="w-4 h-4 text-green-600" />;
                            case 'customer': return <User className="w-4 h-4 text-purple-600" />;
                            default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
                          }
                        };

                        const getActivityBgColor = (type) => {
                          switch (type) {
                            case 'system': return 'bg-blue-50 border-blue-200';
                            case 'technician': return 'bg-green-50 border-green-200';
                            case 'customer': return 'bg-purple-50 border-purple-200';
                            default: return 'bg-gray-50 border-gray-200';
                          }
                        };

                        return (
                          <div key={note.id} className={`p-4 rounded-lg border ${getActivityBgColor(note.type)}`}>
                            <div className="flex space-x-3 space-x-reverse">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                                  {getActivityIcon(note.type)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <p className="text-sm font-medium text-gray-900">{note.author}</p>
                                    <SimpleBadge className={`text-xs ${note.type === 'system' ? 'bg-blue-100 text-blue-800' :
                                      note.type === 'technician' ? 'bg-green-100 text-green-800' :
                                        note.type === 'customer' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                      }`}>
                                      {note.type === 'system' ? 'نظام' :
                                        note.type === 'technician' ? 'فني' :
                                          note.type === 'customer' ? 'عميل' : 'ملاحظة'}
                                    </SimpleBadge>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    <span>{new Date(note.createdAt).toLocaleString('ar-SA')}</span>
                                    <span className="mr-2 text-gray-400">
                                      | {new Date(note.createdAt).toLocaleDateString('en-GB')} {new Date(note.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </>
          )}
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* الفريق المسؤول */}
          <SimpleCard>
            <SimpleCardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4 bg-gray-50/50">
              <SimpleCardTitle className="flex items-center text-purple-700">
                <Users className="w-5 h-5 ml-2" />
                الفريق المسؤول
              </SimpleCardTitle>
              <SimpleButton size="sm" variant="outline" onClick={() => setAssignOpen(true)} className="rounded-lg border-purple-200 hover:bg-purple-50 text-purple-700">
                <UserPlus className="w-4 h-4 ml-1" />
                إسناد فني
              </SimpleButton>
            </SimpleCardHeader>
            <SimpleCardContent className="p-4">
              {assignedTechnicians.length > 0 ? (
                <div className="space-y-3">
                  {assignedTechnicians.map((tech) => (
                    <div key={tech.id || tech.technicianId} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(tech.technicianName || tech.name || 'U')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900 truncate max-w-[100px]">{tech.technicianName || tech.name || `مستخدم #${tech.technicianId || tech.id}`}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${tech.role === 'primary' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {tech.role === 'primary' ? 'فني رئيسي' : 'فني مساعد'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignTechnician(tech.technicianId || tech.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="إلغاء الإسناد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <UserX className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 italic">لم يتم إسناد فنيين</p>
                  <button onClick={() => setAssignOpen(true)} className="mt-2 text-purple-600 hover:text-purple-700 font-bold text-[10px] flex items-center justify-center mx-auto gap-1">
                    <Plus className="w-3 h-3" />
                    إسناد الآن
                  </button>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>

          {/* إرسال إشعار للعميل */}
          {customer && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 ml-2" />
                  إرسال إشعار للعميل
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-2">
                  <SendButton
                    entityType="repair"
                    entityId={repair.id}
                    customerId={repair.customerId}
                    recipient={customer.phone}
                    template="repairReceivedMessage"
                    variables={{}}
                    onSuccess={() => notifications.success('تم إرسال إشعار الإصلاح بنجاح!')}
                    onError={(err) => notifications.error(`فشل إرسال إشعار الإصلاح: ${err.message}`)}
                    showChannelSelector={true}
                    defaultChannels={['whatsapp']}
                    variant="default"
                    size="sm"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    يمكنك اختيار إرسال الإشعار عبر واتساب أو البريد الإلكتروني أو كليهما
                  </p>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* معلومات العميل (محدث) */}
          {
            customer && (
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="flex items-center">
                    <User className="w-5 h-5 ml-2" />
                    معلومات العميل
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الاسم</label>
                      <p className="text-gray-900">{customer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الهاتف</label>
                      <p className="text-gray-900 en-text">{customer.phone}</p>
                    </div>
                    {customer.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                        <p className="text-gray-900 en-text">{customer.email}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <Link to={`/customers/${customer.id}`}>
                      <SimpleButton variant="outline" size="sm" className="w-full">
                        <User className="w-4 h-4 ml-1" />
                        عرض ملف العميل
                      </SimpleButton>
                    </Link>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            )
          }

          {/* مواصفات الجهاز المحسنة */}
          {
            repair && (
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <Wrench className="w-5 h-5 ml-2" />
                      مواصفات الجهاز
                    </SimpleCardTitle>
                    <SimpleButton size="sm" variant="outline" onClick={() => setEditingSpecs(!editingSpecs)}>
                      <Edit className="w-4 h-4 ml-1" />
                      {editingSpecs ? 'إلغاء' : 'تعديل'}
                    </SimpleButton>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {/* المعلومات الأساسية */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">نوع الجهاز</label>
                      <p className="text-gray-900">{repair.deviceType || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الماركة والموديل</label>
                      <p className="text-gray-900">{repair.deviceBrand} {repair.deviceModel}</p>
                    </div>
                    {repair.serialNumber && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">الرقم التسلسلي</label>
                        <p className="text-gray-900 en-text">{repair.serialNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* المواصفات التفصيلية */}
                  <div className="space-y-3">
                    {[
                      { key: 'cpu', label: 'المعالج (CPU)', value: deviceSpecs.cpu },
                      { key: 'gpu', label: 'كرت الشاشة (GPU)', value: deviceSpecs.gpu },
                      { key: 'ram', label: 'الذاكرة (RAM)', value: deviceSpecs.ram },
                      { key: 'storage', label: 'التخزين (Storage)', value: deviceSpecs.storage },
                      { key: 'screenSize', label: 'حجم الشاشة', value: deviceSpecs.screenSize },
                      { key: 'os', label: 'نظام التشغيل', value: deviceSpecs.os }
                    ].filter(spec => spec.value && spec.value.trim()).map((spec) => (
                      <div key={spec.key} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-700 font-medium">{spec.label}</span>
                        <span className="text-gray-900 en-text">{spec.value}</span>
                      </div>
                    ))}
                    {Object.values(deviceSpecs).every(v => !v || !v.trim()) && (
                      <p className="text-gray-500 text-sm text-center py-4">لم يتم إدخال مواصفات تفصيلية بعد</p>
                    )}
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            )
          }

          {/* المتعلقات المستلمة */}
          {
            repair && (
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <Paperclip className="w-5 h-5 ml-2" />
                      المتعلقات المستلمة
                    </SimpleCardTitle>
                    <SimpleButton size="sm" variant="outline" onClick={() => {
                      setEditingAccessories(!editingAccessories);
                      if (!editingAccessories) {
                        // Convert accessories data to proper form format
                        const accessoriesData = repair.accessories || [];
                        const formattedAccessories = accessoriesData
                          .filter(item => item != null)
                          .map((item, index) => {
                            if (typeof item === 'string') {
                              // It's already a string (manual entry)
                              return { id: index, value: item, label: item };
                            } else if (typeof item === 'number') {
                              // It's an ID, find the corresponding option
                              const option = accessoryOptions.find(opt => opt.id === item);
                              if (option) {
                                return { id: option.id, value: option.value, label: option.label };
                              } else {
                                // If option not found, treat as manual entry
                                return { id: index, value: `Item ${item}`, label: getAccessoryLabel(`Item ${item}`) };
                              }
                            } else if (typeof item === 'object' && item.label) {
                              // It's already an object with label
                              return item;
                            } else {
                              // Fallback
                              return { id: index, value: String(item), label: getAccessoryLabel(String(item)) };
                            }
                          });
                        setAccessoriesForm(formattedAccessories);
                      }
                    }}>
                      <Edit className="w-4 h-4 ml-1" />
                      {editingAccessories ? 'إلغاء' : 'تعديل'}
                    </SimpleButton>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  {editingAccessories ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {accessoryOptions.map((option) => (
                          <label key={option.id} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={accessoriesForm.some(a => a.id === option.id || a.label === option.label)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAccessoriesForm(prev => [...prev, { id: option.id, label: option.label, value: option.value }]);
                                } else {
                                  setAccessoriesForm(prev => prev.filter(a => a.id !== option.id && a.label !== option.label));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse pt-3 border-t">
                        <SimpleButton size="sm" onClick={async () => {
                          try {
                            // إرسال المتعلقات المحدثة للخادم
                            const updatedRepair = await apiService.updateRepairRequest(repair.id, {
                              accessories: accessoriesForm.filter(a => a != null).map(a => a.label || a.value || a.name || a)
                            });

                            // تحديث البيانات محلياً
                            setRepair(prev => ({ ...prev, accessories: accessoriesForm }));
                            setEditingAccessories(false);
                            notifications.success('تم تحديث المتعلقات المستلمة');
                          } catch (error) {
                            console.error('Error updating accessories:', error);
                            notifications.error('حدث خطأ في تحديث المتعلقات');
                          }
                        }}>
                          <Save className="w-4 h-4 ml-1" />
                          حفظ التغييرات
                        </SimpleButton>
                        <SimpleButton size="sm" variant="ghost" onClick={() => {
                          setEditingAccessories(false);
                          // Convert accessories data to proper form format
                          const accessoriesData = repair.accessories || [];
                          const formattedAccessories = accessoriesData
                            .filter(item => item != null)
                            .map((item, index) => {
                              if (typeof item === 'string') {
                                // It's already a string (manual entry)
                                return { id: index, value: item, label: item };
                              } else if (typeof item === 'number') {
                                // It's an ID, find the corresponding option
                                const option = accessoryOptions.find(opt => opt.id === item);
                                if (option) {
                                  return { id: option.id, value: option.value, label: option.label };
                                } else {
                                  // If option not found, treat as manual entry
                                  return { id: index, value: `Item ${item}`, label: `Item ${item}` };
                                }
                              } else if (typeof item === 'object' && item.label) {
                                // It's already an object with label
                                return item;
                              } else {
                                // Fallback
                                return { id: index, value: String(item), label: getAccessoryLabel(String(item)) };
                              }
                            });
                          setAccessoriesForm(formattedAccessories);
                        }}>
                          <X className="w-4 h-4 ml-1" />
                          إلغاء
                        </SimpleButton>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {Array.isArray(repair.accessories) && repair.accessories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {repair.accessories.filter(a => a != null).map((a, index) => (
                            <span key={a?.id || index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              {getAccessoryLabel(typeof a === 'string' ? a : (a?.label || a?.name || a?.value || 'Unknown'))}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">لا توجد متعلقات مستلمة</div>
                      )}
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>
            )
          }
        </div >
      </div >

      {/* حوار إسناد فني */}
      {/* حوار إسناد فني - تصميم جديد */}
      {
        assignOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto transform transition-all overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="bg-purple-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إسناد فني للطلب</h3>
                    <p className="text-purple-100 text-xs">تعيين المسؤول عن عملية الإصلاح</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAssignOpen(false);
                    setAssignTechId('');
                    setAssignRole('primary');
                  }}
                  className="hover:bg-white/10 p-2 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اختر الفني المتاح</label>
                    <div className="relative">
                      {techLoading ? (
                        <div className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                          <span className="text-sm text-gray-500">جاري التحميل...</span>
                        </div>
                      ) : (
                        <select
                          value={assignTechId}
                          onChange={(e) => setAssignTechId(e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none transition-shadow"
                        >
                          <option value="">اختر الفني من القائمة...</option>
                          {techOptions.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name || `مستخدم #${u.id}`} {u.phone ? `(${u.phone})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {assignTechId && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-bold text-purple-900 mb-3">دور الفني في هذا الطلب</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAssignRole('primary')}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${assignRole === 'primary'
                            ? 'bg-white border-purple-500 text-purple-700 shadow-sm'
                            : 'bg-white/50 border-transparent text-gray-500 hover:bg-white'
                            }`}
                        >
                          <span className="font-bold">فني رئيسي</span>
                          <span className="text-[10px] opacity-70">المسؤول عن التشخيص</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignRole('assistant')}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${assignRole === 'assistant'
                            ? 'bg-white border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white/50 border-transparent text-gray-500 hover:bg-white'
                            }`}
                        >
                          <span className="font-bold">فني مساعد</span>
                          <span className="text-[10px] opacity-70">يقدم الدعم والقطع</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <SimpleButton
                    variant="ghost"
                    onClick={() => {
                      setAssignOpen(false);
                      setAssignTechId('');
                      setAssignRole('primary');
                    }}
                    className="flex-1 rounded-xl py-3"
                  >
                    إلغاء
                  </SimpleButton>
                  <SimpleButton
                    onClick={handleAssignTechnician}
                    disabled={!assignTechId}
                    className="flex-1 rounded-xl py-3 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none"
                  >
                    تأكيد الإسناد
                  </SimpleButton>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* حوار تقرير الفحص */}
      {
        inspectionOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 my-auto transform transition-all flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingReport ? 'تعديل تقرير الفحص' : 'تقرير فحص جديد'}
                      </h3>
                      <p className="text-sm text-gray-500">طلب #{id} - {repair?.customerName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setInspectionOpen(false);
                      // Reset form and error when closing
                      setInspectionForm({
                        inspectionTypeId: '',
                        technicianId: '',
                        reportDate: new Date().toISOString().slice(0, 10),
                        summary: '',
                        result: '',
                        recommendations: '',
                        notes: '',
                      });
                      setInspectionError('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Error Message */}
                {inspectionError && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{inspectionError}</span>
                  </div>
                )}

                {/* معلومات أساسية */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">المعلومات الأساسية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">نوع الفحص</label>
                      <select
                        value={inspectionForm.inspectionTypeId}
                        onChange={(e) => setInspectionForm(f => ({ ...f, inspectionTypeId: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={inspectionTypesLoading}
                      >
                        <option value="">{inspectionTypesLoading ? 'جاري التحميل...' : 'اختر النوع...'}</option>
                        {inspectionTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} {type.description ? `- ${type.description}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الفني المسؤول
                        {!inspectionForm.technicianId && (
                          <span className="text-xs text-gray-500 mr-1">(سيتم تعيين الفني الحالي تلقائياً)</span>
                        )}
                      </label>
                      <select
                        value={inspectionForm.technicianId}
                        onChange={(e) => setInspectionForm(f => ({ ...f, technicianId: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={techLoading}
                      >
                        <option value="">
                          {techLoading ? 'جاري التحميل...' : (assignTechId || repair?.technicianId ? 'استخدام الفني المحدد' : 'اختر الفني...')}
                        </option>
                        {techOptions.map((u) => (
                          <option key={u.id} value={u.id}>{u.name || `مستخدم #${u.id}`}</option>
                        ))}
                      </select>
                      {techLoading && <p className="text-sm text-gray-500 mt-1">جاري تحميل الفنيين...</p>}
                      {!techLoading && !inspectionForm.technicianId && (assignTechId || repair?.technicianId) && (
                        <p className="text-xs text-gray-500 mt-1">
                          سيتم استخدام: {techOptions.find(t => t.id === (assignTechId || repair?.technicianId))?.name || 'الفني المحدد'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التقرير</label>
                      <input
                        type="date"
                        value={inspectionForm.reportDate}
                        onChange={(e) => setInspectionForm(f => ({ ...f, reportDate: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* زر تحميل المكونات الجاهزة للفحص النهائي */}
                {inspectionForm.inspectionTypeId &&
                  inspectionTypes.find(t => t.id === Number(inspectionForm.inspectionTypeId))?.name === 'فحص نهائي' && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-blue-900 mb-1">قائمة المكونات الجاهزة</h5>
                          <p className="text-xs text-blue-700 mb-3">
                            بعد حفظ التقرير، يمكنك تحميل قائمة المكونات الافتراضية (الكاميرا، WiFi، الشاشة، إلخ)
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  )}

                {/* تفاصيل التقرير */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">تفاصيل التقرير</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ملخص الفحص
                        <span className="text-xs text-gray-500 font-normal mr-1">(اختياري)</span>
                      </label>
                      <textarea
                        value={inspectionForm.summary}
                        onChange={(e) => {
                          setInspectionForm(f => ({ ...f, summary: e.target.value }));
                          setInspectionError(''); // Clear error when user types
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={4}
                        placeholder="وصف مختصر لنتائج الفحص..."
                        maxLength={2000}
                      />
                      <p className="text-xs text-gray-500 mt-1">{inspectionForm.summary.length}/2000</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        النتيجة والتشخيص
                        <span className="text-xs text-gray-500 font-normal mr-1">(اختياري)</span>
                      </label>
                      <textarea
                        value={inspectionForm.result}
                        onChange={(e) => {
                          setInspectionForm(f => ({ ...f, result: e.target.value }));
                          setInspectionError(''); // Clear error when user types
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={4}
                        placeholder="التشخيص النهائي والمشاكل المكتشفة..."
                        maxLength={2000}
                      />
                      <p className="text-xs text-gray-500 mt-1">{inspectionForm.result.length}/2000</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التوصيات
                        <span className="text-xs text-gray-500 font-normal mr-1">(اختياري)</span>
                      </label>
                      <textarea
                        value={inspectionForm.recommendations}
                        onChange={(e) => {
                          setInspectionForm(f => ({ ...f, recommendations: e.target.value }));
                          setInspectionError(''); // Clear error when user types
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={4}
                        placeholder="الخطوات المقترحة للإصلاح..."
                        maxLength={2000}
                      />
                      <p className="text-xs text-gray-500 mt-1">{inspectionForm.recommendations.length}/2000</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ملاحظات إضافية
                        <span className="text-xs text-gray-500 font-normal mr-1">(اختياري)</span>
                      </label>
                      <textarea
                        value={inspectionForm.notes}
                        onChange={(e) => {
                          setInspectionForm(f => ({ ...f, notes: e.target.value }));
                          setInspectionError(''); // Clear error when user types
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={4}
                        placeholder="أي ملاحظات أخرى..."
                        maxLength={2000}
                      />
                      <p className="text-xs text-gray-500 mt-1">{inspectionForm.notes.length}/2000</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                <div className="flex items-center justify-end gap-3">
                  <SimpleButton
                    variant="ghost"
                    onClick={() => {
                      setInspectionOpen(false);
                      // Reset form and error when closing
                      setInspectionForm({
                        inspectionTypeId: '',
                        technicianId: '',
                        reportDate: new Date().toISOString().slice(0, 10),
                        summary: '',
                        result: '',
                        recommendations: '',
                        notes: '',
                      });
                      setInspectionError('');
                    }}
                    disabled={inspectionSaving}
                  >
                    إلغاء
                  </SimpleButton>
                  <SimpleButton
                    onClick={async () => {
                      // Reset error
                      setInspectionError('');

                      // Validation
                      if (!inspectionForm.inspectionTypeId) {
                        setInspectionError('يرجى اختيار نوع الفحص');
                        notifications.error('يرجى اختيار نوع الفحص');
                        return;
                      }
                      if (!inspectionForm.reportDate) {
                        setInspectionError('يرجى تحديد تاريخ التقرير');
                        notifications.error('يرجى تحديد تاريخ التقرير');
                        return;
                      }

                      // Check if at least one field is filled (summary, result, recommendations, or notes)
                      if (!inspectionForm.summary && !inspectionForm.result && !inspectionForm.recommendations && !inspectionForm.notes) {
                        setInspectionError('يرجى ملء حقل واحد على الأقل من (الملخص، النتيجة، التوصيات، أو الملاحظات)');
                        notifications.warning('يرجى ملء حقل واحد على الأقل من تفاصيل التقرير');
                        return;
                      }

                      try {
                        setInspectionSaving(true);
                        // Convert reportDate to ISO 8601 format if it's in YYYY-MM-DD format
                        let reportDateISO = inspectionForm.reportDate;
                        if (reportDateISO && reportDateISO.length === 10) {
                          // If it's YYYY-MM-DD, convert to ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
                          reportDateISO = new Date(reportDateISO + 'T00:00:00.000Z').toISOString();
                        }

                        const payload = {
                          repairRequestId: Number(id),
                          inspectionTypeId: inspectionForm.inspectionTypeId ? Number(inspectionForm.inspectionTypeId) : null,
                          technicianId: inspectionForm.technicianId || assignTechId || techOptions[0]?.id || user?.id ? Number(inspectionForm.technicianId || assignTechId || techOptions[0]?.id || user?.id) : null,
                          reportDate: reportDateISO,
                          summary: inspectionForm.summary || null,
                          result: inspectionForm.result || null,
                          recommendations: inspectionForm.recommendations || null,
                          notes: inspectionForm.notes || null,
                          branchId: repair?.branchId || null,
                        };

                        if (editingReport) {
                          // Optimistic update - update in UI immediately
                          const updatedReport = {
                            ...editingReport,
                            ...payload,
                            inspectionTypeName: inspectionTypes.find(t => t.id === Number(payload.inspectionTypeId))?.name || editingReport.inspectionTypeName,
                            updatedAt: new Date().toISOString()
                          };
                          setInspectionReports(prev => prev.map(r => r.id === editingReport.id ? updatedReport : r));

                          // Update existing report
                          console.log('[InspectionReport] Updating report with payload:', payload);
                          await apiService.request(`/inspectionreports/${editingReport.id}`, {
                            method: 'PUT',
                            body: JSON.stringify(payload)
                          });
                          console.log('[InspectionReport] Report updated successfully');

                          setInspectionOpen(false);
                          setEditingReport(null);

                          // إعادة تعيين النموذج
                          setInspectionForm({
                            inspectionTypeId: '',
                            technicianId: '',
                            reportDate: new Date().toISOString().slice(0, 10),
                            summary: '',
                            result: '',
                            recommendations: '',
                            notes: '',
                          });
                          setInspectionError('');

                          // إعادة تحميل البيانات
                          await fetchRepairDetails();
                          await loadInspectionReports();

                          notifications.success('تم', { message: 'تم تحديث تقرير الفحص بنجاح' });
                        } else {
                          // Create new report
                          console.log('[InspectionReport] Creating report with payload:', payload);
                          const response = await apiService.createInspectionReport(payload);
                          console.log('[InspectionReport] Report created successfully:', response);

                          // حفظ ID التقرير الجديد
                          const createdReportId = response?.id || response?.data?.id;
                          const selectedType = inspectionTypes.find(t => t.id === Number(inspectionForm.inspectionTypeId));

                          setInspectionOpen(false);
                          setEditingReport(null);

                          // إعادة تعيين النموذج
                          setInspectionForm({
                            inspectionTypeId: '',
                            technicianId: '',
                            reportDate: new Date().toISOString().slice(0, 10),
                            summary: '',
                            result: '',
                            recommendations: '',
                            notes: '',
                          });
                          setInspectionError('');

                          // إعادة تحميل البيانات
                          await fetchRepairDetails();
                          // Always reload reports after creating/updating to get fresh data with all joins
                          await loadInspectionReports();

                          // إذا كان نوع الفحص "فحص نهائي"، عرض خيار تحميل القوالب
                          if (selectedType?.name === 'فحص نهائي' && createdReportId) {
                            // عرض رسالة مع خيار تحميل القوالب
                            setTimeout(() => {
                              if (window.confirm('تم حفظ تقرير الفحص النهائي بنجاح!\n\nهل تريد تحميل قائمة المكونات الافتراضية الآن؟')) {
                                (async () => {
                                  try {
                                    // تحويل deviceType إلى lowercase لمطابقة deviceCategory في القوالب
                                    const deviceType = repair?.deviceType?.toLowerCase() || 'all';
                                    console.log('[RepairDetails] Device type:', deviceType);

                                    const deviceCategory = deviceType === 'laptop' ? 'laptop' :
                                      deviceType === 'phone' || deviceType === 'smartphone' ? 'phone' :
                                        deviceType === 'tablet' ? 'tablet' : 'all';
                                    console.log('[RepairDetails] Loading components for deviceCategory:', deviceCategory);

                                    const response = await apiService.loadFinalInspectionComponents(createdReportId, deviceCategory);
                                    console.log('[RepairDetails] Load components response:', response);

                                    notifications.success('تم', { message: response?.message || 'تم تحميل قائمة المكونات الافتراضية بنجاح' });
                                    await loadInspectionReports();
                                  } catch (error) {
                                    console.error('Error loading templates:', error);
                                    const errorMessage = error?.response?.data?.error || error?.message || 'فشل تحميل القوالب';
                                    notifications.error('خطأ', { message: errorMessage });
                                  }
                                })();
                              }
                            }, 500);
                          } else {
                            notifications.success('تم', { message: 'تم حفظ تقرير الفحص بنجاح' });
                          }
                        }

                        // إعطاء وقت للـ WebSocket notification للوصول
                        setTimeout(() => {
                          console.log('[InspectionReport] Report should be visible now via WebSocket');
                        }, 1000);
                      } catch (e) {
                        console.error('[InspectionReport] Error creating report:', e);
                        const errorMessage = e?.message || e?.error || 'تعذر حفظ تقرير الفحص';
                        setInspectionError(errorMessage);
                        notifications.error(errorMessage);
                      } finally {
                        setInspectionSaving(false);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!inspectionForm.inspectionTypeId || !inspectionForm.reportDate || inspectionSaving}
                  >
                    {inspectionSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 ml-2" />
                        حفظ التقرير
                      </>
                    )}
                  </SimpleButton>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* حوار صرف قطعة - تصميم جديد */}
      {
        issueOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto transform transition-all overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">صرف قطعة غيار</h3>
                  <p className="text-blue-100 text-sm mt-1">اختر القطعة والمخزن لإضافتها للطلب</p>
                </div>
                <button
                  onClick={() => setIssueOpen(false)}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {issueError && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {issueError}
                  </div>
                )}
                {Array.isArray(warehouses) && warehouses.length === 0 && (
                  <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                    لا توجد مخازن متاحة. يرجى إنشاء مخزن من إعدادات المخزون أولاً.
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">المخزن <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        name="warehouseId"
                        value={issueForm.warehouseId}
                        onChange={handleIssueChange}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-shadow"
                      >
                        <option value="">-- اختر المخزن --</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>{wh.name || `مخزن #${wh.id}`}</option>
                        ))}
                      </select>
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">العنصر <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        name="inventoryItemId"
                        value={issueForm.inventoryItemId}
                        onChange={handleIssueChange}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-shadow"
                      >
                        <option value="">-- اختر العنصر --</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>{it.name || it.itemName || `عنصر #${it.id}`}</option>
                        ))}
                      </select>
                      <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">الكمية <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="1"
                        max={availableQty !== null ? availableQty : undefined}
                        name="quantity"
                        value={issueForm.quantity}
                        onChange={handleIssueChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow ${availableQty !== null && Number(issueForm.quantity) > Number(availableQty)
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                          }`}
                      />
                    </div>

                    {/* Stock Info Box */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex flex-col justify-center">
                      {availableQty !== null ? (
                        <>
                          <span className="text-xs text-gray-500 mb-1">المخزون المتاح</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${availableQty === 0 ? 'text-red-600' : availableQty <= (minLevel || 0) ? 'text-amber-600' : 'text-green-600'}`}>
                              {availableQty}
                            </span>
                            <span className="text-xs text-gray-400">قطعة</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 text-center">اختر مخزن وعنصر لعرض المخزون</span>
                      )}
                    </div>
                  </div>

                  {/* Custom Selling Price Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      سعر البيع (اختياري)
                      {selectedItemInfo?.sellingPrice && (
                        <span className="text-xs text-gray-500 font-normal mr-2">
                          (السعر الافتراضي: {formatMoney(selectedItemInfo.sellingPrice)})
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="unitSellingPrice"
                        value={issueForm.unitSellingPrice}
                        onChange={handleIssueChange}
                        placeholder={selectedItemInfo?.sellingPrice ? formatMoney(selectedItemInfo.sellingPrice) : "اتركه فارغاً لاستخدام السعر الافتراضي"}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      />
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لاستخدام السعر الافتراضي من بيانات القطعة</p>
                  </div>

                  {/* Warnings */}
                  {availableQty !== null && Number(issueForm.quantity) > Number(availableQty) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      الكمية المطلوبة أكبر من المخزون المتاح!
                    </div>
                  )}

                  {isLowStock && availableQty !== null && (
                    <div className={`p-3 rounded-lg border flex items-start gap-2 text-sm ${availableQty === 0
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                      <AlertTriangle className="w-4 h-4 mt-0.5" />
                      <div>
                        {availableQty === 0
                          ? 'المخزون منتهٍ تماماً!'
                          : `المخزون منخفض! (الحد الأدنى: ${minLevel || 0})`}
                      </div>
                    </div>
                  )}

                  {/* Invoice Link Section */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                      <FileText className="w-4 h-4" />
                      ربط بفاتورة (اختياري)
                    </label>
                    <select
                      name="invoiceId"
                      value={issueForm.invoiceId}
                      onChange={handleIssueChange}
                      className="w-full px-4 py-2.5 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">بدون ربط - سيتم الربط تلقائياً بالفاتورة الأولى</option>
                      {invoices.map((inv) => (
                        <option key={inv.id || inv.invoiceId} value={inv.id || inv.invoiceId}>
                          {inv.title || `فاتورة #${inv.id || inv.invoiceId}`} — {formatMoney(inv.totalAmount || inv.amount || 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setIssueOpen(false)}
                  className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={issueLoading}
                >
                  إلغاء
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-500">* حقول مطلوبة</span>
                  <button
                    onClick={handleIssueSubmit}
                    disabled={issueLoading || (availableQty !== null && Number(issueForm.quantity) > Number(availableQty))}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {issueLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري الصرف...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        صرف القطعة
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Message Log */}
      {
        repair && (
          <div className="mt-6">
            <MessageLogViewer
              entityType="repair"
              entityId={repair.id}
              customerId={repair.customerId}
              limit={5}
            />
          </div>
        )
      }

      {/* --- Modals --- */}

      {/* Update Status Modal */}
      {
        editingStatus && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto transform transition-all overflow-hidden border border-gray-100">
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center">
                  <RefreshCw className="w-5 h-5 ml-2" />
                  تحديث حالة الطلب
                </h3>
                <button onClick={() => setEditingStatus(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الجديدة</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="in-progress">قيد الإصلاح</option>
                    <option value="waiting-parts">بانتظار قطع غيار</option>
                    <option value="ready-for-pickup">جاهز للاستلام</option>
                    <option value="on-hold">معلق</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
                  <SimpleButton variant="ghost" onClick={() => setEditingStatus(false)}>إلغاء</SimpleButton>
                  <SimpleButton onClick={handleStatusUpdate}>حفظ التغييرات</SimpleButton>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Add Payment Modal */}
      {
        addingPayment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto transform transition-all overflow-hidden border border-gray-100">
              <div className="bg-green-600 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center">
                  <DollarSign className="w-5 h-5 ml-2" />
                  إضافة دفعة مالية
                </h3>
                <button onClick={() => setAddingPayment(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">نقدي</option>
                      <option value="card">بطاقة ائتمان</option>
                      <option value="bank_transfer">تحويل بنكي</option>
                      <option value="check">شيك</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم المرجع</label>
                    <input
                      type="text"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                      placeholder="رقم العملية أو المرجع"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="ملاحظات إضافية حول الدفعة"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <SimpleButton variant="ghost" onClick={() => setAddingPayment(false)}>إلغاء</SimpleButton>
                  <SimpleButton onClick={handleAddPayment} disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0}>
                    حفظ الدفعة
                  </SimpleButton>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Add Note Modal */}
      {
        addingNote && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto transform transition-all overflow-hidden border border-gray-100">
              <div className="bg-amber-600 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center">
                  <MessageSquare className="w-5 h-5 ml-2" />
                  إضافة ملاحظة فنية
                </h3>
                <button onClick={() => setAddingNote(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="اكتب ملاحظتك هنا..."
                  className="w-full p-4 border border-gray-300 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-amber-500 resize-none mb-4 shadow-inner"
                  rows={4}
                />
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <SimpleButton variant="ghost" onClick={() => { setAddingNote(false); setNewNote(''); }}>إلغاء</SimpleButton>
                  <SimpleButton onClick={handleAddNote} disabled={!newNote.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">
                    حفظ الملاحظة
                  </SimpleButton>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Repair Details Modal */}
      {
        editingDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto transform transition-all overflow-hidden border border-gray-100">
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center">
                  <Edit className="w-5 h-5 ml-2" />
                  تعديل تفاصيل الطلب
                </h3>
                <button onClick={() => setEditingDetails(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة المقدرة (من)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={repairDetails.estimatedCostMin !== null && repairDetails.estimatedCostMin !== undefined ? repairDetails.estimatedCostMin : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRepairDetails(prev => ({
                          ...prev,
                          estimatedCostMin: value === '' ? null : (isNaN(parseFloat(value)) ? null : parseFloat(value))
                        }));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة المقدرة (إلى)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={repairDetails.estimatedCostMax !== null && repairDetails.estimatedCostMax !== undefined ? repairDetails.estimatedCostMax : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRepairDetails(prev => ({
                          ...prev,
                          estimatedCostMax: value === '' ? null : (isNaN(parseFloat(value)) ? null : parseFloat(value))
                        }));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة الفعلية</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={repairDetails.actualCost || ''}
                      onChange={(e) => setRepairDetails(prev => ({ ...prev, actualCost: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                    <select
                      value={repairDetails.priority}
                      onChange={(e) => setRepairDetails(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">منخفضة</option>
                      <option value="MEDIUM">متوسطة</option>
                      <option value="HIGH">عالية</option>
                      <option value="URGENT">عاجلة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">موعد التسليم المتوقع</label>
                    <input
                      type="datetime-local"
                      value={repairDetails.expectedDeliveryDate ? new Date(repairDetails.expectedDeliveryDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setRepairDetails(prev => ({ ...prev, expectedDeliveryDate: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                  <textarea
                    value={repairDetails.notes}
                    onChange={(e) => setRepairDetails(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t flex items-center justify-end gap-3">
                <SimpleButton variant="ghost" onClick={() => setEditingDetails(false)}>إلغاء</SimpleButton>
                <SimpleButton onClick={handleUpdateRepairDetails}>حفظ التغييرات</SimpleButton>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Device Specs Modal */}
      {
        editingSpecs && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto transform transition-all overflow-hidden border border-gray-100">
              <div className="bg-purple-600 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center">
                  <Wrench className="w-5 h-5 ml-2" />
                  تعديل مواصفات الجهاز
                </h3>
                <button onClick={() => setEditingSpecs(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المعالج (CPU)</label>
                    <input
                      type="text"
                      value={deviceSpecs.cpu || ''}
                      onChange={(e) => setDeviceSpecs(prev => ({ ...prev, cpu: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: Intel Core i7-10750H"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">كرت الشاشة (GPU)</label>
                    <input
                      type="text"
                      value={deviceSpecs.gpu || ''}
                      onChange={(e) => setDeviceSpecs(prev => ({ ...prev, gpu: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: NVIDIA GTX 1650"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الذاكرة (RAM)</label>
                    <input
                      type="text"
                      value={deviceSpecs.ram || ''}
                      onChange={(e) => setDeviceSpecs(prev => ({ ...prev, ram: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: 16GB DDR4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التخزين (Storage)</label>
                    <input
                      type="text"
                      value={deviceSpecs.storage || ''}
                      onChange={(e) => setDeviceSpecs(prev => ({ ...prev, storage: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: 512GB SSD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حجم الشاشة</label>
                    <input
                      type="text"
                      value={deviceSpecs.screenSize || ''}
                      onChange={(e) => setDeviceSpecs(prev => ({ ...prev, screenSize: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: 15.6 بوصة"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نظام التشغيل</label>
                    <input
                      type="text"
                      value={deviceSpecs.os || ''}
                      onChange={(e) => setDeviceSpecs(prev => ({ ...prev, os: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: Windows 11"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
                  <SimpleButton variant="ghost" onClick={() => {
                    setEditingSpecs(false);
                    setDeviceSpecs(repair.deviceSpecs || {});
                  }}>إلغاء</SimpleButton>
                  <SimpleButton onClick={handleUpdateDeviceSpecs} className="bg-purple-600 hover:bg-purple-700 text-white">
                    حفظ التغييرات
                  </SimpleButton>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default RepairDetailsPage;
