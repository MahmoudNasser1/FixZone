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
import { 
  ArrowRight, User, Phone, Mail, Settings, Edit, Save, X,
  Wrench, Clock, CheckCircle, Play, XCircle, AlertTriangle,
  FileText, Paperclip, MessageSquare, Plus, Printer, QrCode,
  UserPlus, Trash2, Eye
} from 'lucide-react';

const RepairDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { formatMoney } = useSettings();
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
  const [activeTab, setActiveTab] = useState('status'); // status | timeline | attachments | invoices | notes | payments | activity
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTechId, setAssignTechId] = useState('');
  const [techOptions, setTechOptions] = useState([]);
  const [techLoading, setTechLoading] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    inspectionTypeId: '',
    technicianId: '',
    reportDate: new Date().toISOString().slice(0,10),
    summary: '',
    result: '',
    recommendations: '',
    notes: '',
  });
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
    actualCost: null,
    priority: 'MEDIUM',
    expectedDeliveryDate: null,
    notes: ''
  });

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
  
  // Edit accessories state
  const [editingAccessories, setEditingAccessories] = useState(false);
  const [accessoriesForm, setAccessoriesForm] = useState([]);
  const [accessoryOptions, setAccessoryOptions] = useState([]);
  const [addSvcLoading, setAddSvcLoading] = useState(false);
  const [addSvcError, setAddSvcError] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [svcForm, setSvcForm] = useState({ serviceId: '', price: '', technicianId: '', notes: '', invoiceId: '' });
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
  const [issueForm, setIssueForm] = useState({ warehouseId: '', inventoryItemId: '', quantity: 1, invoiceId: '' });
  const [currentUserId, setCurrentUserId] = useState(1);
  const [availableQty, setAvailableQty] = useState(null);
  const [minLevel, setMinLevel] = useState(null);
  const [isLowStock, setIsLowStock] = useState(null);

  const handleIssueChange = (e) => {
    const { name, value } = e.target;
    setIssueForm((f) => ({ ...f, [name]: value }));
  };

  const loadItemsMap = async () => {
    try {
      setItemsMapLoading(true);
      console.log('Loading items map...');
      const res = await inventoryService.listItems();
      console.log('Items response:', res);
      const list = Array.isArray(res) ? res : (res.data?.items || res.items || []);
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
      setIssueLoading(true);
      console.log('Issuing part with data:', {
        repairRequestId: Number(id),
        inventoryItemId: Number(issueForm.inventoryItemId),
        warehouseId: Number(issueForm.warehouseId),
        quantity,
        userId: Number(currentUserId || 1),
        invoiceId: issueForm.invoiceId ? Number(issueForm.invoiceId) : null,
      });
      await inventoryService.issuePart({
        repairRequestId: Number(id),
        inventoryItemId: Number(issueForm.inventoryItemId),
        warehouseId: Number(issueForm.warehouseId),
        quantity,
        userId: Number(currentUserId || 1),
        invoiceId: issueForm.invoiceId ? Number(issueForm.invoiceId) : null,
      });
      notifications.success('تم صرف القطعة وتحديث المخزون بنجاح');
      // بعد الصرف نتأكد من حالة المخزون هل أصبح منخفضًا
      try {
        const levelsAfter = await inventoryService.listStockLevels({ warehouseId: Number(issueForm.warehouseId), inventoryItemId: Number(issueForm.inventoryItemId) });
        const listAfter = Array.isArray(levelsAfter) ? levelsAfter : (levelsAfter.items || []);
        const rowAfter = listAfter && listAfter[0] ? listAfter[0] : null;
        if (rowAfter) {
          const nowQty = Number(rowAfter.quantity || 0);
          const nowMin = Number(rowAfter.minLevel || 0);
          const nowLow = !!rowAfter.isLowStock || nowQty <= nowMin;
          if (nowLow) {
            notifications.warn('تنبيه: المخزون منخفض لهذا العنصر في هذا المخزن بعد عملية الصرف');
          }
        }
      } catch {}
      setIssueOpen(false);
      setIssueForm({ warehouseId: '', inventoryItemId: '', quantity: 1, invoiceId: '' });
      // refresh details if needed
      try {
        await fetchRepairDetails();
        await loadPartsUsed();
      } catch (_) {}
    } catch (e) {
      setIssueError(e?.message || 'تعذر تنفيذ عملية الصرف');
      notifications.error('تعذر تنفيذ عملية الصرف');
    } finally {
      setIssueLoading(false);
    }
  };

  // تحميل خيارات المتعلقات من المتغيرات
  const loadAccessoryOptions = async () => {
    try {
      const response = await apiService.getVariables({ category: 'ACCESSORY', active: true });
      if (response.ok) {
        const accessories = await response.json();
        setAccessoryOptions(Array.isArray(accessories) ? accessories : []);
      } else {
        // بيانات تجريبية في حالة عدم توفر البيانات
        setAccessoryOptions([
          { id: 1, label: 'شاحن الجهاز', value: 'CHARGER' },
          { id: 2, label: 'كابل USB', value: 'USB_CABLE' },
          { id: 3, label: 'سماعات', value: 'EARPHONES' },
          { id: 4, label: 'حافظة', value: 'CASE' },
          { id: 5, label: 'حامي الشاشة', value: 'SCREEN_PROTECTOR' },
          { id: 6, label: 'قلم رقمي', value: 'STYLUS' },
          { id: 7, label: 'ماوس', value: 'MOUSE' },
          { id: 8, label: 'لوحة مفاتيح', value: 'KEYBOARD' },
          { id: 9, label: 'بطاقة ذاكرة', value: 'MEMORY_CARD' },
          { id: 10, label: 'بطارية خارجية', value: 'POWER_BANK' }
        ]);
      }
    } catch (error) {
      console.warn('Failed to load accessory options:', error);
      // بيانات تجريبية في حالة الخطأ
      setAccessoryOptions([
        { id: 1, label: 'شاحن الجهاز', value: 'CHARGER' },
        { id: 2, label: 'كابل USB', value: 'USB_CABLE' },
        { id: 3, label: 'سماعات', value: 'EARPHONES' },
        { id: 4, label: 'حافظة', value: 'CASE' },
        { id: 5, label: 'حامي الشاشة', value: 'SCREEN_PROTECTOR' }
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
    // تحميل كسول للفواتير عند فتح تبويب الفواتير لأول مرة
    if (activeTab === 'invoices' && invoices.length === 0 && !invoicesLoading) {
      loadInvoices();
    }
    // تحميل المدفوعات عند فتح تبويب المدفوعات
    if (activeTab === 'payments' && payments.length === 0 && !paymentsLoading) {
      loadPayments();
    }
  }, [activeTab]);

  const loadPartsUsed = async () => {
    try {
      setPartsLoading(true);
      setPartsError('');
      console.log('Loading parts used for repair request:', id);
      const response = await apiService.request(`/partsused?repairRequestId=${id}`);
      console.log('Parts used response:', response);
      
      if (response.ok) {
        const data = await response.json();
        setPartsUsed(Array.isArray(data) ? data : []);
      } else {
        throw new Error('فشل في تحميل الأجزاء المصروفة');
      }
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
      const response = await repairService.getRepairRequestServices(id);
      console.log('Services response:', response);
      
      // التأكد من أن الاستجابة صحيحة
      let servicesData = [];
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          servicesData = data;
        } else if (data && Array.isArray(data.data)) {
          servicesData = data.data;
        } else if (data && data.services && Array.isArray(data.services)) {
          servicesData = data.services;
        }
      } else {
        throw new Error('Failed to fetch services');
      }
      
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
      const invoice = invoices.find(inv => inv.repairRequestId === parseInt(id));
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
        createdBy: 1, // TODO: Get from auth context
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
      await apiService.updateRepairRequest(id, {
        estimatedCost: repairDetails.estimatedCost,
        actualCost: repairDetails.actualCost,
        priority: repairDetails.priority,
        expectedDeliveryDate: repairDetails.expectedDeliveryDate,
        notes: repairDetails.notes
      });

      // تحديث محلي
      setRepair(prev => ({ 
        ...prev, 
        estimatedCost: repairDetails.estimatedCost,
        actualCost: repairDetails.actualCost,
        priority: repairDetails.priority,
        expectedDeliveryDate: repairDetails.expectedDeliveryDate,
        notes: repairDetails.notes
      }));

      notifications.success('تم تحديث تفاصيل الطلب بنجاح');
      setEditingDetails(false);
    } catch (e) {
      console.error('Error updating repair details:', e);
      notifications.error('تعذر تحديث تفاصيل الطلب');
    }
  };

  // Derived lists with sorting & pagination for Services
  const getSortedPagedServices = () => {
    const withMeta = (services || []).map(s => ({
      ...s,
      _name: s.serviceName || `خدمة #${s.serviceId}`,
      _price: Number(s.price || 0),
      _invoiced: !!s.invoiceItemId
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

  // تحميل الفنيين عند فتح حوار تقرير الفحص مباشرة
  useEffect(() => {
    const loadTechs = async () => {
      try {
        setTechLoading(true);
        const res = await apiService.listTechnicians();
        console.log('Technicians response (inspection):', res);
        const items = Array.isArray(res) ? res : (res.items || []);
        setTechOptions(items);
      } catch (e) {
        console.error('Error loading technicians (inspection):', e);
        notifications.error('تعذر تحميل قائمة الفنيين');
      } finally {
        setTechLoading(false);
      }
    };
    if (inspectionOpen && techOptions.length === 0) {
      loadTechs();
    }
  }, [inspectionOpen]);

  // تحميل قائمة الفنيين عند فتح حوار الإسناد
  useEffect(() => {
    const loadTechs = async () => {
      try {
        setTechLoading(true);
        const res = await apiService.listTechnicians();
        console.log('Technicians response (assign):', res);
        const items = Array.isArray(res) ? res : (res.items || []);
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
        if (whResponse && whResponse.ok) {
          const wh = await whResponse.json();
          if (Array.isArray(wh)) {
            warehousesData = wh;
          } else if (wh && Array.isArray(wh.data)) {
            warehousesData = wh.data;
          } else if (wh && wh.warehouses && Array.isArray(wh.warehouses)) {
            warehousesData = wh.warehouses;
          }
        }
        setWarehouses(warehousesData);
        
        // معالجة بيانات العناصر
        let itemsData = [];
        if (itResponse && itResponse.ok) {
          const it = await itResponse.json();
          if (Array.isArray(it)) {
            itemsData = it;
          } else if (it && Array.isArray(it.data)) {
            itemsData = it.data;
          } else if (it && it.items && Array.isArray(it.items)) {
            itemsData = it.items;
          }
        }
        setItems(itemsData);
        
        console.log('Processed warehouses:', warehousesData);
        console.log('Processed items:', itemsData);
        try {
          const me = await apiService.authMe();
          if (me && (me.id || me.userId)) setCurrentUserId(Number(me.id || me.userId));
        } catch {}
        // احضر الفواتير إن لم تكن محملة لاستخدامها في الربط الاختياري
        try {
          if (invoices.length === 0 && !invoicesLoading) {
            await loadInvoices();
          }
        } catch {}
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
        const svc = await repairService.getAvailableServices().catch(() => []);
        console.log('Available services response:', svc);
        setAvailableServices(Array.isArray(svc) ? svc : (svc.items || []));
        // تحميل الفنيين إن لم يكونوا محملين مسبقًا
        if (techOptions.length === 0) {
          try {
            setTechLoading(true);
            const technicians = await apiService.listTechnicians();
            console.log('Technicians response:', technicians);
            setTechOptions(Array.isArray(technicians) ? technicians : (technicians.items || []));
          } catch (e) {
            console.error('Error loading technicians:', e);
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

  const handleAddServiceSubmit = async () => {
    try {
      setAddSvcError('');
      const { serviceId, price, technicianId, notes, invoiceId } = svcForm;
      if (!serviceId || !technicianId || !price) {
        setAddSvcError('يرجى اختيار الخدمة والفني وتحديد السعر');
        return;
      }
      setAddSvcLoading(true);
      console.log('Adding service with data:', { serviceId, price, technicianId, notes, invoiceId });
      // إنشاء خدمة طلب الإصلاح
      await repairService.addRepairRequestService({
        repairRequestId: Number(id),
        serviceId: Number(serviceId),
        technicianId: Number(technicianId),
        price: Number(price),
        notes: notes || ''
      });
      // ربط اختياري بالفاتورة
      try {
        const invId = invoiceId ? Number(invoiceId) : (invoices[0]?.id || invoices[0]?.invoiceId || null);
        if (invId) {
          await apiService.addInvoiceItem(invId, {
            serviceId: Number(serviceId),
            quantity: 1,
            unitPrice: Number(price),
            description: notes || ''
          });
        }
      } catch {}
      notifications.success('تمت إضافة الخدمة بنجاح');
      setAddServiceOpen(false);
      setSvcForm({ serviceId: '', price: '', technicianId: '', notes: '', invoiceId: '' });
      await loadServices();
    } catch (e) {
      setAddSvcError(e?.message || 'تعذر إضافة الخدمة');
      notifications.error('تعذر إضافة الخدمة');
    } finally {
      setAddSvcLoading(false);
    }
  };

  // Lookup available quantity when both item and warehouse selected
  useEffect(() => {
    const { warehouseId, inventoryItemId } = issueForm || {};
    const fetchAvailable = async () => {
      try {
        setAvailableQty(null);
        setMinLevel(null);
        setIsLowStock(null);
        if (!warehouseId || !inventoryItemId) return;
        const levelsResponse = await inventoryService.listStockLevels({ warehouseId, inventoryItemId });
        let list = [];
        if (levelsResponse && levelsResponse.ok) {
          const levels = await levelsResponse.json();
          list = Array.isArray(levels) ? levels : (levels.items || []);
        }
        const row = list && list[0] ? list[0] : null;
        const qty = row ? Number(row.quantity) : 0;
        setAvailableQty(Number.isFinite(qty) ? qty : 0);
        if (row) {
          const ml = row.minLevel != null ? Number(row.minLevel) : null;
          setMinLevel(Number.isFinite(ml) ? ml : null);
          setIsLowStock(Boolean(row.isLowStock));
        }
      } catch (_) {
        setAvailableQty(null);
        setMinLevel(null);
        setIsLowStock(null);
      }
    };
    fetchAvailable();
  }, [issueForm.warehouseId, issueForm.inventoryItemId]);

  const fetchRepairDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching repair details for ID:', id);
      // محاولة الجلب من API أولاً
      try {
        const response = await apiService.getRepairRequest(id);
        console.log('Repair response:', response);
        if (response.ok) {
          const rep = await response.json();
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
          setRepairDetails({
            estimatedCost: rep.estimatedCost || 0,
            actualCost: rep.actualCost || null,
            priority: rep.priority || 'MEDIUM',
            expectedDeliveryDate: rep.expectedDeliveryDate || null,
            notes: rep.notes || ''
          });
          
          // ملاحظات/سجل
          try {
            const logsResponse = await apiService.getRepairLogs(id);
            if (logsResponse.ok) {
              const logs = await logsResponse.json();
              setNotes(Array.isArray(logs) ? logs : (logs.items || []));
            }
          } catch {}
          
          // المرفقات
          try {
            const attsResponse = await apiService.listAttachments(id);
            if (attsResponse.ok) {
              const atts = await attsResponse.json();
              setAttachments(Array.isArray(atts) ? atts : (atts.items || []));
            }
          } catch {}
          
          // بيانات العميل إن وجدت
          if (rep?.customerId) {
            try {
              const custResponse = await apiService.getCustomer(rep.customerId);
              if (custResponse.ok) {
                const cust = await custResponse.json();
                setCustomer(cust);
              }
            } catch {}
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
      
      // Use the new invoices service with repair request filter
      const response = await apiService.getInvoices({
        repairRequestId: id,
        limit: 50 // Get all invoices for this repair
      });
      
      console.log('Invoices response:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Invoices data:', data);
        setInvoices(data.data?.invoices || data.invoices || data.data || []);
      } else {
        // Fallback to old API if new one fails
        const res = await apiService.listRepairInvoices(id);
        console.log('Fallback invoices response:', res);
        if (res.ok) {
          const fallbackData = await res.json();
          setInvoices(fallbackData.data?.invoices || fallbackData.invoices || fallbackData.data || []);
        } else {
          throw new Error('Failed to load invoices from fallback API');
        }
      }
    } catch (e) {
      console.error('Error loading invoices:', e);
      setInvoicesError('تعذر تحميل الفواتير');
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
      const response = await apiService.createInvoiceFromRepair(id, payload);
      console.log('Invoice creation response:', response);
      
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          notifications.success('تم إنشاء الفاتورة بنجاح مع ربط تلقائي للقطع والخدمات');
          await loadInvoices();
          await loadPartsUsed(); // Refresh to show updated invoice status
          await loadServices();
        } else {
          throw new Error(responseData.message || 'فشل في إنشاء الفاتورة');
        }
      } else {
        throw new Error('فشل في إنشاء الفاتورة');
      }
    } catch (e) {
      console.error('Error creating invoice:', e);
      // إذا كان السبب تكرارًا (409) نفتح الفاتورة الموجودة لهذا الطلب
      const isDuplicate = typeof e?.message === 'string' && e.message.includes('409');
      if (isDuplicate) {
        try {
          const res = await apiService.listRepairInvoices(id);
          const list = Array.isArray(res) ? res : (res?.data?.invoices || res?.invoices || []);
          const existing = list && list[0];
          if (existing?.id) {
            notifications.warn('هناك فاتورة موجودة لهذا الطلب. تم فتحها.');
            window.location.assign(`/invoices/${existing.id}`);
            return;
          }
        } catch (_) {}
      }
      notifications.error(`فشل إنشاء الفاتورة: ${e.message || 'خطأ غير معروف'}`);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!assignTechId) return;
    try {
      console.log('Assigning technician:', assignTechId, 'to repair request:', id);
      await apiService.assignTechnician(id, assignTechId);
      notifications.success('تم إسناد الفني بنجاح');
      setAssignOpen(false);
      setAssignTechId('');
      // حدّث بيانات الطلب محليًا
      const tech = techOptions.find(t => String(t.id) === String(assignTechId));
      setRepair(prev => prev ? { ...prev, technicianId: assignTechId, technicianName: tech?.name || `مستخدم #${assignTechId}` } : prev);
    } catch (e) {
      console.error('Error assigning technician:', e);
      notifications.error('تعذر إسناد الفني');
    }
  };

  const handlePrint = (type) => {
    console.log('Printing repair request:', id, 'with type:', type);
    // فتح صفحات الطباعة من الـ Backend مباشرةً لتفادي مشاكل CORS/Assets
    const base = 'http://localhost:3001/api/repairs';
    let url = `${base}/${id}/print/receipt`;
    if (type === 'qr') url = `${base}/${id}/print/receipt`;
    if (type === 'inspection') url = `${base}/${id}/print/inspection`;
    if (type === 'delivery') url = `${base}/${id}/print/delivery`;
    if (type === 'invoice') url = `${base}/${id}/print/invoice`;
    console.log('Opening print URL:', url);
    window.open(url, '_blank');
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

  const handleStatusUpdate = async () => {
    try {
      console.log('Updating repair status to:', newStatus, 'for repair request:', id);
      // تحديث عبر API ثم تحديث الواجهة
      await apiService.updateRepairStatus(id, newStatus);
      setRepair(prev => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : prev));
      setEditingStatus(false);
      notifications.success('تم تحديث الحالة بنجاح', { title: 'نجاح', duration: 2500 });
    } catch (err) {
      console.error('Error updating repair status:', err);
      setError('حدث خطأ في تحديث حالة الطلب');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: newNote,
      author: 'المستخدم الحالي',
      createdAt: new Date().toISOString(),
      type: 'note'
    };

    // تحديث تفاؤلي
    setNotes(prev => [...prev, optimistic]);
    setNewNote('');
    setAddingNote(false);

    try {
      console.log('Adding note with content:', optimistic.content, 'to repair request:', id);
      const res = await apiService.addRepairNote(id, optimistic.content);
      console.log('Note added response:', res);
      // استبدال الملاحظة المؤقتة بالملاحظة من السيرفر
      const saved = {
        id: res?.id ?? optimistic.id,
        content: optimistic.content,
        author: res?.userId ? `مستخدم #${res.userId}` : optimistic.author,
        createdAt: res?.createdAt || optimistic.createdAt,
        type: res?.action || 'note',
      };
      setNotes(prev => prev.map(n => (n.id === optimistic.id ? saved : n)));
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
      'on-hold': { text: 'معلق', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
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
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Link to="/repairs">
              <SimpleButton variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              تفاصيل الطلب: {repair.requestNumber}
            </h1>
            <SimpleBadge className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 ml-1" />
              {statusInfo.text}
            </SimpleBadge>
            <SimpleBadge className={priorityInfo.color}>
              {priorityInfo.text}
            </SimpleBadge>
          </div>
          <p className="text-gray-600">
            تاريخ الإنشاء: {repair.createdAt ? (() => {
              try {
                const date = new Date(repair.createdAt);
                return isNaN(date.getTime()) ? 'غير محدد' : date.toLocaleDateString('ar-SA');
              } catch (e) {
                return 'غير محدد';
              }
            })() : 'غير محدد'}
          </p>
        </div>
        
        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
            <SimpleButton 
              size="sm"
              variant="outline"
              onClick={() => setEditingStatus(!editingStatus)}
              className="rounded-lg"
            >
              <Edit className="w-4 h-4 ml-2" />
              تحديث الحالة
            </SimpleButton>
            <SimpleButton size="sm" onClick={() => setAssignOpen(true)} className="rounded-lg">
              <UserPlus className="w-4 h-4 ml-2" />
              إسناد فني
            </SimpleButton>
            {repair?.technicianName && (
              <span className="text-sm text-gray-600 px-2 py-1 bg-white border border-gray-200 rounded-lg mr-1">
                الفني: <span className="font-medium">{repair.technicianName}</span>
              </span>
            )}
            <span className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />
            <SimpleButton size="sm" variant="outline" onClick={() => handlePrint('receipt')} className="rounded-lg">
              <Printer className="w-4 h-4 ml-2" />
              طباعة إيصال
            </SimpleButton>
            <SimpleButton size="sm" variant="outline" onClick={() => handlePrint('inspection')} className="rounded-lg">
              <Printer className="w-4 h-4 ml-2" />
              طباعة تقرير فحص
            </SimpleButton>
            <SimpleButton size="sm" variant="outline" onClick={() => setInspectionOpen(true)} className="rounded-lg">
              <Edit className="w-4 h-4 ml-2" />
              إنشاء/تعديل تقرير فحص
            </SimpleButton>
            <SimpleButton size="sm" variant="outline" onClick={() => handlePrint('delivery')} className="rounded-lg">
              <Printer className="w-4 h-4 ml-2" />
              طباعة التسليم
            </SimpleButton>
            <SimpleButton size="sm" variant="outline" onClick={() => handlePrint('qr')} className="rounded-lg">
              <QrCode className="w-4 h-4 ml-2" />
              طباعة QR
            </SimpleButton>
            <SimpleButton size="sm" variant="ghost" onClick={handleDelete} className="rounded-lg text-red-600">
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </SimpleButton>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 space-x-reverse" aria-label="Tabs">
          {[
            { key: 'status', label: 'الحالة والتفاصيل', icon: Wrench },
            { key: 'timeline', label: 'المخطط الزمني', icon: Clock },
            { key: 'attachments', label: 'المرفقات', icon: Paperclip },
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
                className={`${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
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

      {/* حوار إضافة خدمة */}
      {addServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">إضافة خدمة لطلب الإصلاح</h3>
              <button onClick={() => setAddServiceOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {addSvcError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{addSvcError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الخدمة</label>
                <select
                  name="serviceId"
                  value={svcForm.serviceId}
                  onChange={(e) => {
                    const sel = e.target.value;
                    const svc = availableServices.find(s => String(s.id) === String(sel) || String(s.serviceId) === String(sel));
                    setSvcForm(f => ({ ...f, serviceId: sel, price: svc ? (svc.basePrice || svc.price || svc.unitPrice || '') : f.price }));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">اختر الخدمة...</option>
                  {availableServices.map(s => (
                    <option key={s.id || s.serviceId} value={s.id || s.serviceId}>
                      {s.name || s.serviceName || `خدمة #${s.id || s.serviceId}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                  <input type="number" name="price" value={svcForm.price} onChange={handleAddServiceChange} className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفني</label>
                  <select name="technicianId" value={svcForm.technicianId} onChange={handleAddServiceChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                    <option value="">اختر الفني...</option>
                    {techOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.name || t.fullName || `فني #${t.id}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea name="notes" value={svcForm.notes} onChange={handleAddServiceChange} className="w-full p-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الربط بفاتورة (اختياري)</label>
                <select name="invoiceId" value={svcForm.invoiceId} onChange={handleAddServiceChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                  <option value="">بدون ربط</option>
                  {invoices.map((inv) => (
                    <option key={inv.id || inv.invoiceId} value={inv.id || inv.invoiceId}>
                      {inv.title || `فاتورة #${inv.id || inv.invoiceId}`} — {formatMoney(inv.amount || 0)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <SimpleButton variant="ghost" onClick={() => setAddServiceOpen(false)} disabled={addSvcLoading}>إلغاء</SimpleButton>
              <SimpleButton onClick={handleAddServiceSubmit} disabled={addSvcLoading || !svcForm.serviceId || !svcForm.technicianId || !svcForm.price} className="bg-blue-600 hover:bg-blue-700">
                {addSvcLoading ? 'جاري الإضافة...' : 'إضافة'}
              </SimpleButton>
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
                        <p className="text-gray-900 font-semibold">{formatMoney(repair.estimatedCost || 0)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة الفعلية</label>
                        <p className="text-gray-900">{repair.actualCost != null ? formatMoney(repair.actualCost) : 'لم يتم تحديدها بعد'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">موعد التسليم المتوقع</label>
                        <p className="text-gray-900">{repair.expectedDeliveryDate ? new Date(repair.expectedDeliveryDate).toLocaleDateString('ar-SA') : 'لم يتم تحديده بعد'}</p>
                      </div>
                    </div>
                    
                    {/* نموذج تعديل تفاصيل طلب الإصلاح */}
                    {editingDetails ? (
                      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">تعديل تفاصيل الطلب</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة المقدرة</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={repairDetails.estimatedCost}
                              onChange={(e) => setRepairDetails(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                            <select
                              value={repairDetails.priority}
                              onChange={(e) => setRepairDetails(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                          <textarea
                            value={repairDetails.notes}
                            onChange={(e) => setRepairDetails(prev => ({ ...prev, notes: e.target.value }))}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="أي ملاحظات إضافية..."
                          />
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse pt-3 border-t mt-4">
                          <SimpleButton size="sm" onClick={handleUpdateRepairDetails}>
                            <Save className="w-4 h-4 ml-1" />
                            حفظ التغييرات
                          </SimpleButton>
                          <SimpleButton size="sm" variant="ghost" onClick={() => {
                            setEditingDetails(false);
                            setRepairDetails({
                              estimatedCost: repair.estimatedCost || 0,
                              actualCost: repair.actualCost || null,
                              priority: repair.priority || 'MEDIUM',
                              expectedDeliveryDate: repair.expectedDeliveryDate || null,
                              notes: repair.notes || ''
                            });
                          }}>
                            <X className="w-4 h-4 ml-1" />
                            إلغاء
                          </SimpleButton>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <SimpleButton size="sm" variant="outline" onClick={() => setEditingDetails(true)}>
                          <Edit className="w-4 h-4 ml-1" />
                          تعديل التفاصيل
                        </SimpleButton>
                      </div>
                    )}
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

              {/* القطع المصروفة (Parts Used) */}
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
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600">الكمية المستخدمة:</span>
                                    <span className="font-medium text-gray-900">{pu.quantity}</span>
                                  </div>
                                  {itemMeta.sellingPrice && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                      <span className="text-gray-600">السعر:</span>
                                      <span className="font-medium text-gray-900">{itemMeta.sellingPrice} ج.م</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-3">
                                <SimpleBadge className={invoiced ? 'bg-green-100 text-green-800 border border-green-200 px-3 py-1' : 'bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1'}>
                                  {invoiced ? '✓ مفوتر' : '⏳ غير مفوتر'}
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
                                          const targetInvoiceId = (invoices[0]?.id || invoices[0]?.invoiceId);
                                          if (!targetInvoiceId) {
                                            notifications.warn('لا توجد فواتير لهذا الطلب. يرجى إنشاء فاتورة أولاً');
                                            return;
                                          }
                                          // إضافة عنصر فاتورة للقطعة المصروفة
                                          const addResponse = await apiService.addInvoiceItem(targetInvoiceId, {
                                            inventoryItemId: pu.inventoryItemId,
                                            quantity: Number(pu.quantity || 1),
                                            partsUsedId: pu.id
                                          });
                                          
                                          if (addResponse.ok) {
                                            const addData = await addResponse.json();
                                        if (addData.success) {
                                          notifications.success('تم إضافة القطعة إلى الفاتورة');
                                          await loadPartsUsed();
                                          await loadServices();
                                          await loadInvoices();
                                        } else {
                                              throw new Error(addData.error || 'Failed to add part to invoice');
                                            }
                                      } else {
                                        const errorData = await addResponse.json();
                                        if (addResponse.status === 409) {
                                          // Duplicate item error
                                          notifications.warn(errorData.error || 'تم إضافة هذه القطعة مسبقاً');
                                          return;
                                        }
                                        throw new Error(errorData.error || 'Failed to add part to invoice');
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
                  {servicesLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ) : servicesError ? (
                    <div className="text-red-600 text-sm">{servicesError}</div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <div className="text-gray-600 text-lg font-medium">لا توجد خدمات مسجلة</div>
                      <div className="text-gray-500 text-sm mt-2">لم يتم تسجيل أي خدمات إصلاح لهذا الطلب بعد</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getSortedPagedServices().items.map((service) => {
                        const invoiced = !!service.invoiceItemId;
                        return (
                          <div key={service.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-400 hover:from-purple-100 hover:to-pink-100 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-lg">
                                      {service.serviceName || `خدمة إصلاح #${service.serviceId}`}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      كود الخدمة: {service.serviceId || 'غير محدد'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600">السعر:</span>
                                    <span className="font-medium text-gray-900">{Number(service.price || 0).toFixed(2)} ج.م</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-600">الفني:</span>
                                    <span className="font-medium text-gray-900">{service.technicianName || 'غير محدد'}</span>
                                  </div>
                                </div>
                                
                                {service.notes && (
                                  <div className="bg-white/70 rounded-lg p-3 mt-2">
                                    <div className="text-xs text-gray-500 mb-1">ملاحظات:</div>
                                    <div className="text-sm text-gray-700">{service.notes}</div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-3">
                                <SimpleBadge className={invoiced ? 'bg-green-100 text-green-800 border border-green-200 px-3 py-1' : 'bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1'}>
                                  {invoiced ? '✓ مفوتر' : '⏳ غير مفوتر'}
                                </SimpleBadge>
                                {!invoiced && (
                                  <SimpleButton
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        // تأكد من وجود فاتورة واحدة على الأقل
                                        if (invoices.length === 0) {
                                          await loadInvoices();
                                        }
                                        const targetInvoiceId = (invoices[0]?.id || invoices[0]?.invoiceId);
                                        if (!targetInvoiceId) {
                                          notifications.warn('لا توجد فواتير لهذا الطلب. يرجى إنشاء فاتورة أولاً');
                                          return;
                                        }
                                        console.log('Adding service to invoice:', {
                                          targetInvoiceId,
                                          service,
                                          payload: {
                                            serviceId: service.serviceId || service.id,
                                            quantity: 1,
                                            unitPrice: Number(service.price || 0),
                                            description: service.notes || service.serviceName || ''
                                          }
                                        });
                                        // إضافة عنصر فاتورة للخدمة
                                        const addResponse = await apiService.addInvoiceItem(targetInvoiceId, {
                                          serviceId: service.serviceId || service.id,
                                          quantity: 1,
                                          unitPrice: Number(service.price || 0),
                                          description: service.notes || service.serviceName || ''
                                        });
                                        
                                        if (addResponse.ok) {
                                          const addData = await addResponse.json();
                                          if (addData.success) {
                                            notifications.success('تم إضافة الخدمة إلى الفاتورة');
                                            await loadServices();
                                            await loadInvoices();
                                          } else {
                                            throw new Error(addData.error || 'Failed to add service to invoice');
                                          }
                                        } else {
                                          const errorData = await addResponse.json();
                                          if (addResponse.status === 409) {
                                            // Duplicate item error
                                            notifications.warn(errorData.error || 'تم إضافة هذه الخدمة مسبقاً');
                                            return;
                                          }
                                          throw new Error(errorData.error || 'Failed to add service to invoice');
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
                  <div className="flex justify-end items-center gap-2 mt-3 text-sm text-gray-600">
                    <span>إجمالي العناصر: {getSortedPagedServices().total}</span>
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
                  apiService.deleteAttachment?.(repair?.id || id, id).catch(() => {});
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

          {activeTab === 'invoices' && (
            <>
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex items-center justify-between">
                    <SimpleCardTitle className="flex items-center">
                      <FileText className="w-5 h-5 ml-2" />
                      فواتير الطلب
                    </SimpleCardTitle>
                    <SimpleButton size="sm" onClick={handleCreateInvoice} disabled={invoicesLoading}>
                      <Plus className="w-4 h-4 ml-1" /> إنشاء فاتورة
                    </SimpleButton>
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
                        invoices.map(inv => (
                          <div key={inv.id || inv.invoiceId} className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{inv.title || `فاتورة #${inv.id || inv.invoiceId}`}</p>
                              <p className="text-sm text-gray-600">المبلغ: {formatMoney(inv.amount || 0)}</p>
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
                        ))
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
                      <div className="text-2xl font-bold text-blue-600">{formatMoney(repair?.estimatedCost || 0)}</div>
                      <div className="text-sm text-gray-600">التكلفة المقدرة</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${(repair?.estimatedCost || 0) - getTotalPayments() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney((repair?.estimatedCost || 0) - getTotalPayments())}
                      </div>
                      <div className="text-sm text-gray-600">المتبقي</div>
                    </div>
                  </div>

                  {/* نموذج إضافة دفعة */}
                  {addingPayment && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                          <input
                            type="number"
                            step="0.01"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                          <select
                            value={paymentForm.method}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="cash">نقدي</option>
                            <option value="card">بطاقة ائتمان</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                            <option value="check">شيك</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">رقم المرجع</label>
                          <input
                            type="text"
                            value={paymentForm.reference}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="اختياري"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                          <input
                            type="text"
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="ملاحظات إضافية"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <SimpleButton size="sm" onClick={handleAddPayment} disabled={!paymentForm.amount}>
                          <Save className="w-4 h-4 ml-1" />
                          حفظ الدفعة
                        </SimpleButton>
                        <SimpleButton size="sm" variant="ghost" onClick={() => { setAddingPayment(false); setPaymentForm({ amount: '', method: 'cash', reference: '', notes: '' }); }}>
                          <X className="w-4 h-4 ml-1" />
                          إلغاء
                        </SimpleButton>
                      </div>
                    </div>
                  )}

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
                            {payment.notes && (
                              <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(payment.createdAt).toLocaleString('ar-SA')} • {payment.createdBy}
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
                  {addingNote && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="اكتب ملاحظتك هنا..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-3"
                        rows={3}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <SimpleButton size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                          <Save className="w-4 h-4 ml-1" />
                          حفظ
                        </SimpleButton>
                        <SimpleButton size="sm" variant="ghost" onClick={() => { setAddingNote(false); setNewNote(''); }}>
                          <X className="w-4 h-4 ml-1" />
                          إلغاء
                        </SimpleButton>
                      </div>
                    </div>
                  )}

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
                                    <SimpleBadge className={`text-xs ${
                                      note.type === 'system' ? 'bg-blue-100 text-blue-800' :
                                      note.type === 'technician' ? 'bg-green-100 text-green-800' :
                                      note.type === 'customer' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {note.type === 'system' ? 'نظام' :
                                       note.type === 'technician' ? 'فني' :
                                       note.type === 'customer' ? 'عميل' : 'ملاحظة'}
                                    </SimpleBadge>
                                  </div>
                                  <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString('ar-SA')}</p>
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
          {editingStatus && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>تحديث حالة الطلب</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-4">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="in-progress">قيد الإصلاح</option>
                    <option value="on-hold">معلق</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                  <div className="flex space-x-2 space-x-reverse">
                    <SimpleButton size="sm" onClick={async () => {
                      try {
                        await handleStatusUpdate();
                      } catch (_) {}
                    }}>
                      <Save className="w-4 h-4 ml-1" />
                      حفظ
                    </SimpleButton>
                    <SimpleButton size="sm" variant="ghost" onClick={() => setEditingStatus(false)}>
                      <X className="w-4 h-4 ml-1" />
                      إلغاء
                    </SimpleButton>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {customer && (
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
                <div className="mt-4">
                  <Link to={`/customers/${customer.id}`}>
                    <SimpleButton variant="outline" size="sm" className="w-full">
                      <User className="w-4 h-4 ml-1" />
                      عرض ملف العميل
                    </SimpleButton>
                  </Link>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* مواصفات الجهاز المحسنة */}
          {repair && (
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
                {editingSpecs ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المعالج (CPU)</label>
                        <input
                          type="text"
                          value={deviceSpecs.cpu || ''}
                          onChange={(e) => setDeviceSpecs(prev => ({ ...prev, cpu: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="مثال: Intel Core i7-10750H"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">كرت الشاشة (GPU)</label>
                        <input
                          type="text"
                          value={deviceSpecs.gpu || ''}
                          onChange={(e) => setDeviceSpecs(prev => ({ ...prev, gpu: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="مثال: NVIDIA GTX 1650"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الذاكرة (RAM)</label>
                        <input
                          type="text"
                          value={deviceSpecs.ram || ''}
                          onChange={(e) => setDeviceSpecs(prev => ({ ...prev, ram: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="مثال: 16GB DDR4"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التخزين (Storage)</label>
                        <input
                          type="text"
                          value={deviceSpecs.storage || ''}
                          onChange={(e) => setDeviceSpecs(prev => ({ ...prev, storage: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="مثال: 512GB SSD"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">حجم الشاشة</label>
                        <input
                          type="text"
                          value={deviceSpecs.screenSize || ''}
                          onChange={(e) => setDeviceSpecs(prev => ({ ...prev, screenSize: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="مثال: 15.6 بوصة"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">نظام التشغيل</label>
                        <input
                          type="text"
                          value={deviceSpecs.os || ''}
                          onChange={(e) => setDeviceSpecs(prev => ({ ...prev, os: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="مثال: Windows 11"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse pt-3 border-t">
                      <SimpleButton size="sm" onClick={handleUpdateDeviceSpecs}>
                        <Save className="w-4 h-4 ml-1" />
                        حفظ التغييرات
                      </SimpleButton>
                      <SimpleButton size="sm" variant="ghost" onClick={() => {
                        setEditingSpecs(false);
                        setDeviceSpecs(repair.deviceSpecs || {});
                      }}>
                        <X className="w-4 h-4 ml-1" />
                        إلغاء
                      </SimpleButton>
                    </div>
                  </div>
                ) : (
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
                )}
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* المتعلقات المستلمة */}
          {repair && (
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
                      setAccessoriesForm(repair.accessories || []);
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
                      <SimpleButton size="sm" onClick={() => {
                        setRepair(prev => ({ ...prev, accessories: accessoriesForm }));
                        setEditingAccessories(false);
                        notifications.success('تم تحديث المتعلقات المستلمة');
                      }}>
                        <Save className="w-4 h-4 ml-1" />
                        حفظ التغييرات
                      </SimpleButton>
                      <SimpleButton size="sm" variant="ghost" onClick={() => {
                        setEditingAccessories(false);
                        setAccessoriesForm(repair.accessories || []);
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
                        {repair.accessories.map((a) => (
                          <span key={a.id} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{a.label}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">لا توجد متعلقات مستلمة</div>
                    )}
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          )}
        </div>
      </div>

      {/* حوار إسناد فني */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">إسناد فني</h3>
              <button onClick={() => setAssignOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">اختر الفني</label>
              {techLoading ? (
                <div className="text-sm text-gray-500">جاري تحميل قائمة الفنيين...</div>
              ) : (
                <select
                  value={assignTechId}
                  onChange={(e) => setAssignTechId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">اختر الفني...</option>
                  {techOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || `مستخدم #${u.id}`} {u.phone ? `- ${u.phone}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              <SimpleButton variant="ghost" onClick={() => setAssignOpen(false)}>إلغاء</SimpleButton>
              <SimpleButton onClick={handleAssignTechnician} disabled={!assignTechId}>حفظ</SimpleButton>
            </div>
          </div>
        </div>
      )}

      {/* حوار تقرير الفحص */}
      {inspectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">تقرير الفحص</h3>
                    <p className="text-sm text-gray-500">طلب #{id} - {repair?.customerName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInspectionOpen(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* معلومات أساسية */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">المعلومات الأساسية</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع الفحص</label>
                    <select 
                      value={inspectionForm.inspectionTypeId} 
                      onChange={(e)=>setInspectionForm(f=>({...f, inspectionTypeId:e.target.value}))} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر النوع...</option>
                      <option value="1">فحص مبدئي</option>
                      <option value="2">فحص تفصيلي</option>
                      <option value="3">فحص نهائي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الفني المسؤول</label>
                    <select 
                      value={inspectionForm.technicianId} 
                      onChange={(e)=>setInspectionForm(f=>({...f, technicianId:e.target.value}))} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={techLoading}
                    >
                      <option value="">اختر الفني...</option>
                      {techOptions.map((u)=> (
                        <option key={u.id} value={u.id}>{u.name || `مستخدم #${u.id}`}</option>
                      ))}
                    </select>
                    {techLoading && <p className="text-sm text-gray-500 mt-1">جاري تحميل الفنيين...</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التقرير</label>
                    <input 
                      type="date" 
                      value={inspectionForm.reportDate} 
                      onChange={(e)=>setInspectionForm(f=>({...f, reportDate:e.target.value}))} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>

              {/* تفاصيل التقرير */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">تفاصيل التقرير</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملخص الفحص</label>
                    <textarea 
                      value={inspectionForm.summary} 
                      onChange={(e)=>setInspectionForm(f=>({...f, summary:e.target.value}))} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      rows={3}
                      placeholder="وصف مختصر لنتائج الفحص..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">النتيجة والتشخيص</label>
                    <textarea 
                      value={inspectionForm.result} 
                      onChange={(e)=>setInspectionForm(f=>({...f, result:e.target.value}))} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      rows={3}
                      placeholder="التشخيص النهائي والمشاكل المكتشفة..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التوصيات</label>
                    <textarea 
                      value={inspectionForm.recommendations} 
                      onChange={(e)=>setInspectionForm(f=>({...f, recommendations:e.target.value}))} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      rows={3}
                      placeholder="الخطوات المقترحة للإصلاح..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية</label>
                    <textarea 
                      value={inspectionForm.notes} 
                      onChange={(e)=>setInspectionForm(f=>({...f, notes:e.target.value}))} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      rows={3}
                      placeholder="أي ملاحظات أخرى..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <div className="flex items-center justify-end gap-3">
                <SimpleButton variant="ghost" onClick={()=>setInspectionOpen(false)}>
                  إلغاء
                </SimpleButton>
                <SimpleButton 
                  onClick={async ()=>{
                    try {
                      const payload = {
                        repairRequestId: Number(id),
                        inspectionTypeId: Number(inspectionForm.inspectionTypeId),
                        technicianId: Number(inspectionForm.technicianId || assignTechId || techOptions[0]?.id || 1),
                        reportDate: inspectionForm.reportDate,
                        summary: inspectionForm.summary,
                        result: inspectionForm.result,
                        recommendations: inspectionForm.recommendations,
                        notes: inspectionForm.notes,
                        branchId: 1,
                      };
                      await apiService.createInspectionReport(payload);
                      notifications.success('تم حفظ تقرير الفحص بنجاح');
                      setInspectionOpen(false);
                      // إعادة تحميل البيانات
                      fetchRepairDetails();
                    } catch (e) {
                      notifications.error('تعذر حفظ تقرير الفحص');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  حفظ التقرير
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* حوار صرف قطعة */}
      {issueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">صرف قطعة من المخزون</h3>
            </div>
            <div className="p-6 space-y-4">
              {issueError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                  {issueError}
                </div>
              )}
              {Array.isArray(warehouses) && warehouses.length === 0 && (
                <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded">
                  لا توجد مخازن متاحة. يرجى إنشاء مخزن من إعدادات المخزون أولاً.
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
                <select
                  name="warehouseId"
                  value={issueForm.warehouseId}
                  onChange={handleIssueChange}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">اختر المخزن...</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name || `مخزن #${wh.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                <select
                  name="inventoryItemId"
                  value={issueForm.inventoryItemId}
                  onChange={handleIssueChange}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">اختر العنصر...</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.name || it.itemName || `عنصر #${it.id}`}</option>
                  ))}
                </select>
              </div>
              {/* اختيار فاتورة اختياري لربط الصرف مباشرة بالفاتورة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الربط بفاتورة (اختياري)</label>
                <select
                  name="invoiceId"
                  value={issueForm.invoiceId}
                  onChange={handleIssueChange}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">بدون ربط</option>
                  {invoices.map((inv) => (
                    <option key={inv.id || inv.invoiceId} value={inv.id || inv.invoiceId}>
                      {inv.title || `فاتورة #${inv.id || inv.invoiceId}`} — {formatMoney(inv.amount || 0)}
                    </option>
                  ))}
                </select>
                {invoices.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">لا توجد فواتير بعد لهذا الطلب. يمكنك الإنشاء من تبويب "الفواتير".</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={issueForm.quantity}
                  onChange={handleIssueChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {availableQty !== null && (
                  <p className="mt-1 text-xs">
                    <span className="text-gray-500">المتاح بالمخزن المحدد: </span>
                    <span className={Number(issueForm.quantity) > Number(availableQty) ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                      {availableQty}
                    </span>
                  </p>
                )}
                {minLevel !== null && availableQty !== null && (
                  <div className={`mt-2 text-xs p-2 rounded ${availableQty <= minLevel ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    الحد الأدنى: {minLevel} — {availableQty <= minLevel ? 'المخزون منخفض' : 'تنبيه: قد يقترب المخزون من الحد الأدنى'}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <SimpleButton variant="ghost" onClick={() => setIssueOpen(false)} disabled={issueLoading}>إلغاء</SimpleButton>
              <SimpleButton onClick={handleIssueSubmit} disabled={issueLoading || (availableQty !== null && Number(issueForm.quantity) > Number(availableQty))} className="bg-blue-600 hover:bg-blue-700">
                {issueLoading ? 'جاري التنفيذ...' : 'صرف'}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairDetailsPage;
