import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { DataTable } from '../../components/ui/DataTable';
// Note: We will implement server-side pagination controls locally instead of client-side DataTablePagination
import invoicesService from '../../services/invoicesService';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Plus } from 'lucide-react';

// تعريف أعمدة جدول الفواتير (سيتم حقن عمود الاختيار لاحقًا)
const baseInvoiceColumns = [
  {
    accessorKey: "id",
    header: "رقم الفاتورة",
    cell: ({ row }) => `#${row.getValue("id")}`,
  },
  {
    accessorKey: "customerName",
    header: "العميل",
  },
  {
    accessorKey: "total",
    header: "الإجمالي",
    cell: ({ row }) => Number(row.getValue("total") ?? 0).toFixed(2),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const statusColors = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        paid: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700',
      };
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
          {status === 'draft' ? 'مسودة' : status === 'sent' ? 'مرسلة' : status === 'paid' ? 'مدفوعة' : status === 'overdue' ? 'متأخرة' : status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "إجراءات",
    cell: ({ row }) => (
      <Link to={`/invoices/${row.getValue("id")}`}>
        <SimpleButton variant="outline" size="sm">فتح</SimpleButton>
      </Link>
    ),
  },
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notifications = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Initialize from URL params
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialLimit = Number(searchParams.get('limit')) || 10;
  const initialSearch = searchParams.get('search') || '';
  const initialSortBy = (['createdAt','totalAmount','status','customerName'].includes(searchParams.get('sortBy'))
    ? searchParams.get('sortBy')
    : 'createdAt');
  const initialSortOrder = (['ASC','DESC'].includes((searchParams.get('sortOrder')||'').toUpperCase())
    ? (searchParams.get('sortOrder')||'DESC').toUpperCase()
    : 'DESC');

  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    repairRequestId: '',
    totalAmount: 0,
    currency: 'EGP'
  });
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // master list for local fallback filter
  const [repairs, setRepairs] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [serverFiltered, setServerFiltered] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // اختيار متعدد + عمليات مجمعة
  const [selectedIds, setSelectedIds] = useState([]);
  const [performingBulk, setPerformingBulk] = useState(false);

  // بناء الأعمدة بإضافة عمود اختيار في البداية
  const invoicesColumns = React.useMemo(() => {
    return [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={invoices.length > 0 && selectedIds.length === invoices.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(invoices.map(inv => inv.id));
              } else {
                setSelectedIds([]);
              }
            }}
          />
        ),
        cell: ({ row }) => {
          const id = row.getValue('id');
          const checked = selectedIds.includes(id);
          return (
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
              }}
            />
          );
        },
      },
      ...baseInvoiceColumns,
    ];
  }, [invoices, selectedIds]);

  // Debounce search input to limit API calls
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reflect state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    setSearchParams(params, { replace: true });
  }, [page, limit, debouncedSearch, sortBy, sortOrder, setSearchParams]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await invoicesService.listInvoices({
          page,
          limit,
          search: debouncedSearch,
          sortBy,
          sortOrder,
        });
        const fetchedInvoices = Array.isArray(response)
          ? response
          : (response?.data?.invoices || response?.invoices || []);
        const pagination = response?.data?.pagination || response?.pagination || null;
        const statsData = response?.data?.stats || response?.stats || null;
        const invoicesWithCustomers = (fetchedInvoices || []).map((invoice) => ({
          ...invoice,
          customerName: invoice.customerName || `عميل #${invoice.customerId || 'غير محدد'}`,
          total: invoice.totalAmount ?? invoice.calculatedTotal ?? 0
        }));
        if (!mounted) return;
        setInvoices(invoicesWithCustomers);
        if (pagination) {
          setTotalItems(Number(pagination.totalItems) || 0);
        } else {
          // Fallback: infer total from current list length if pagination missing
          setTotalItems(Array.isArray(invoicesWithCustomers) ? invoicesWithCustomers.length : 0);
        }

  async function handleBulk(action) {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      const ok = window.confirm(`سيتم حذف ${selectedIds.length} فاتورة. هل أنت متأكد؟`);
      if (!ok) return;
    }
    try {
      setPerformingBulk(true);
      // حاول استخدام مسار العمليات المجمعة
      try {
        await invoicesService.bulkAction(action, selectedIds);
      } catch (e) {
        // في حال عدم دعم المسار، نفّذ فرديًا
        for (const id of selectedIds) {
          if (action === 'send') await invoicesService.sendInvoice(id);
          else if (action === 'mark-paid') await invoicesService.markAsPaid(id);
          else if (action === 'delete') await invoicesService.deleteInvoice(id);
        }
      }
      notifications.success('تم تنفيذ العملية بنجاح');
      // أعد التحميل
      const response = await invoicesService.listInvoices({ page, limit, search: debouncedSearch, sortBy, sortOrder });
      const fetchedInvoices = Array.isArray(response) ? response : (response?.data?.invoices || response?.invoices || []);
      const invoicesWithCustomers = (fetchedInvoices || []).map((invoice) => ({
        ...invoice,
        customerName: invoice.customerName || `عميل #${invoice.customerId || 'غير محدد'}`,
        total: invoice.totalAmount ?? invoice.calculatedTotal ?? 0
      }));
      setInvoices(invoicesWithCustomers);
      const pagination = response?.data?.pagination || response?.pagination || null;
      if (pagination) setTotalItems(Number(pagination.totalItems) || 0);
      setSelectedIds([]);
    } catch (e) {
      console.error('Bulk action error:', e);
      notifications.error('فشل تنفيذ العملية المجمعة');
    } finally {
      setPerformingBulk(false);
    }
  }
        setStats(statsData);
        // نظّف الاختيارات عند تبدل الصفحة/البيانات
        setSelectedIds([]);
      } catch (e) {
        console.error(e);
        setError(e?.message || 'حدث خطأ في جلب الفواتير');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [page, limit, debouncedSearch, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'الفواتير', href: '/invoices' },
            ]} />
            <h1 className="text-2xl font-bold text-gray-900">الفواتير</h1>
            <p className="text-sm text-gray-500">قائمة الفواتير</p>
          </div>
          <div className="flex items-center gap-2">
            <SimpleButton onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              فاتورة جديدة
            </SimpleButton>
            {/* أزرار العمليات المجمعة */}
            <div className="flex items-center gap-2">
              <SimpleButton
                variant="outline"
                disabled={selectedIds.length === 0 || performingBulk}
                onClick={() => handleBulk('send')}
              >
                إرسال المحدد
              </SimpleButton>
              <SimpleButton
                variant="outline"
                disabled={selectedIds.length === 0 || performingBulk}
                onClick={() => handleBulk('mark-paid')}
              >
                تعيين كمدفوعة
              </SimpleButton>
              <SimpleButton
                variant="destructive"
                disabled={selectedIds.length === 0 || performingBulk}
                onClick={() => handleBulk('delete')}
              >
                حذف المحدد
              </SimpleButton>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
          </SimpleCardContent>
        </SimpleCard>
      ) : error ? (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <SimpleCard>
          <SimpleCardHeader>
            <div className="flex items-center justify-between gap-3">
              <SimpleCardTitle>قائمة الفواتير</SimpleCardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  className="border rounded px-2 py-1 text-sm w-40 md:w-64"
                />
                <select
                  value={sortBy}
                  onChange={(e) => { setPage(1); setSortBy(e.target.value); }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="createdAt">تاريخ الإنشاء</option>
                  <option value="totalAmount">قيمة الفاتورة</option>
                  <option value="status">الحالة</option>
                  <option value="customerName">العميل</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => { setPage(1); setSortOrder(e.target.value); }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="DESC">تنازلي</option>
                  <option value="ASC">تصاعدي</option>
                </select>
                <div className="h-5 w-px bg-gray-300 mx-1" />
                <span>عدد السجلات: {totalItems}</span>
                <select
                  value={limit}
                  onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-3 text-center">
                <div className="p-2 rounded border bg-gray-50">
                  <div className="text-xs text-gray-500">الإجمالي</div>
                  <div className="text-base font-semibold text-gray-900">{stats.total ?? 0}</div>
                </div>
                <div className="p-2 rounded border bg-yellow-50">
                  <div className="text-xs text-yellow-700">مسودة</div>
                  <div className="text-base font-semibold text-yellow-900">{stats.draft ?? 0}</div>
                </div>
                <div className="p-2 rounded border bg-blue-50">
                  <div className="text-xs text-blue-700">مُرسلة</div>
                  <div className="text-base font-semibold text-blue-900">{stats.sent ?? 0}</div>
                </div>
                <div className="p-2 rounded border bg-green-50">
                  <div className="text-xs text-green-700">مدفوعة</div>
                  <div className="text-base font-semibold text-green-900">{stats.paid ?? 0}</div>
                </div>
                <div className="p-2 rounded border bg-red-50">
                  <div className="text-xs text-red-700">متأخرة</div>
                  <div className="text-base font-semibold text-red-900">{stats.overdue ?? 0}</div>
                </div>
                <div className="p-2 rounded border bg-purple-50">
                  <div className="text-xs text-purple-700">إجمالي مستحق</div>
                  <div className="text-base font-semibold text-purple-900">{Number(stats.totalOutstanding ?? 0).toFixed(2)}</div>
                </div>
              </div>
            )}
          </SimpleCardHeader>
          <SimpleCardContent>
            <DataTable columns={invoicesColumns} data={invoices || []}>
              {() => (
                <>
                  {/* Server-side pagination controls */}
                  <div className="flex items-center justify-between px-2 mt-2">
                    <div className="text-sm text-gray-600">
                      صفحة {page} من {Math.max(1, Math.ceil((totalItems || 0) / (limit || 1)))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="border rounded px-3 py-1 text-sm disabled:opacity-50"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                      >السابق</button>
                      <button
                        className="border rounded px-3 py-1 text-sm disabled:opacity-50"
                        disabled={page >= Math.ceil((totalItems || 0) / (limit || 1))}
                        onClick={() => setPage(p => p + 1)}
                      >التالي</button>
                    </div>
                  </div>
                </>
              )}
            </DataTable>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إنشاء فاتورة جديدة</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">العميل</label>
                  <SimpleButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddCustomer(true)}
                  >
                    <Plus className="w-3 h-3 ml-1" />
                    عميل جديد
                  </SimpleButton>
                </div>
                
                {/* Customer Search */}
                <input 
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  placeholder="ابحث عن عميل بالاسم أو الهاتف..."
                />
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{searching ? 'جاري البحث…' : `نتائج: ${(customers || []).length}`}</span>
                  {serverFiltered && (
                    <button type="button" className="text-blue-600 hover:underline"
                      onClick={() => { setCustomerSearch(''); setServerFiltered(false); }}>
                      إعادة ضبط البحث
                    </button>
                  )}
                  <button type="button" className="text-blue-600 hover:underline"
                    onClick={() => { setCustomerSearch(''); loadCustomersAndRepairs(); }}>
                    عرض الكل
                  </button>
                </div>
                
                {/* Customer Selection via search results */}
                {createForm.customerId ? (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-green-50 border-green-200 text-green-800">
                    <div className="text-sm">
                      العميل المحدد: {
                        (customers.find(c => String(c.id) === String(createForm.customerId))?.name) || 'غير معروف'
                      } - {
                        (customers.find(c => String(c.id) === String(createForm.customerId))?.phone) || ''
                      }
                    </div>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setCreateForm(prev => ({ ...prev, customerId: '' }))}
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md max-h-60 overflow-auto divide-y">
                    {customers && customers.length > 0 ? (
                      (serverFiltered ? customers : customers.filter(customer =>
                        !customerSearch ||
                        customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        customer.phone?.includes(customerSearch) ||
                        customer.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        customer.address?.toLowerCase().includes(customerSearch.toLowerCase())
                      ))
                        .map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            className="w-full text-right px-3 py-2 hover:bg-gray-50"
                            onClick={() => setCreateForm(prev => ({ ...prev, customerId: customer.id }))}
                          >
                            <div className="text-sm font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.phone || customer.email || ''}</div>
                          </button>
                        ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {customerSearch?.trim()?.length ? 'لا توجد نتائج مطابقة' : 'ابدأ بالكتابة للبحث عن عميل...'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طلب الإصلاح (اختياري)</label>
                <select 
                  value={createForm.repairRequestId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, repairRequestId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">بدون طلب إصلاح</option>
                  {repairs.map(repair => (
                    <option key={repair.id} value={repair.id}>
                      {repair.requestNumber} - {repair.deviceType}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الإجمالي</label>
                <input 
                  type="number"
                  value={createForm.totalAmount}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <SimpleButton 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ customerId: '', repairRequestId: '', totalAmount: 0, currency: 'EGP' });
                }}
              >
                إلغاء
              </SimpleButton>
              <SimpleButton 
                onClick={handleCreateInvoice}
                disabled={creating}
              >
                {creating ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة عميل جديد</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <input 
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم العميل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input 
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="01xxxxxxxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
                <input 
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان (اختياري)</label>
                <textarea 
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="عنوان العميل"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <SimpleButton 
                variant="outline" 
                onClick={() => {
                  setShowAddCustomer(false);
                  setNewCustomer({ name: '', phone: '', email: '', address: '' });
                }}
              >
                إلغاء
              </SimpleButton>
              <SimpleButton 
                onClick={handleAddCustomer}
                disabled={savingCustomer || !newCustomer.name || !newCustomer.phone}
              >
                {savingCustomer ? 'جاري الإضافة...' : 'إضافة العميل'}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleCreateInvoice() {

    try {
      setCreating(true);
      const invoiceData = {
        totalAmount: createForm.totalAmount,
        amountPaid: 0,
        status: 'draft',
        repairRequestId: createForm.repairRequestId || null,
        customerId: createForm.customerId || null,
        currency: createForm.currency,
        taxAmount: 0
      };

      const newInvoice = await invoicesService.createInvoice(invoiceData);

      notifications.success('تم إنشاء الفاتورة بنجاح');
      setShowCreateModal(false);
      setCreateForm({ customerId: '', repairRequestId: '', totalAmount: 0, currency: 'EGP' });
      
      // Navigate to the new invoice
      const created = newInvoice?.data || newInvoice;
      navigate(`/invoices/${created.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      // إذا كانت الفاتورة موجودة مسبقًا لنفس طلب الصيانة (409)
      const isDuplicate = typeof error?.message === 'string' && error.message.includes('409');
      if (isDuplicate && createForm.repairRequestId) {
        try {
          const res = await apiService.request(`/invoices?repairRequestId=${createForm.repairRequestId}`);
          const list = Array.isArray(res) ? res : (res?.data?.invoices || res?.invoices || []);
          const existing = list && list[0];
          if (existing?.id) {
            notifications.warn('هناك فاتورة موجودة لهذا الطلب. تم فتحها.');
            setShowCreateModal(false);
            navigate(`/invoices/${existing.id}`);
            return;
          }
        } catch (_) {}
      }
      notifications.error('فشل في إنشاء الفاتورة');
    } finally {
      setCreating(false);
    }
  }

  // Load customers and repairs when modal opens
  useEffect(() => {
    if (showCreateModal) {
      loadCustomersAndRepairs();
    }
  }, [showCreateModal]);

  // Debounced server-side search for customers (prefer /customers?q=, then fallback to /customers/search, then local)
  useEffect(() => {
    if (!showCreateModal) return; // only when modal open
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      const q = (customerSearch || '').trim();
      try {
        setSearching(true);
        if (q.length > 0) {
          // Prefer backend route that we know exists
          let alt = await apiService.getCustomers({ q, page: 1, pageSize: 20 }).catch(() => null);
          let list = Array.isArray(alt) ? alt : (alt?.data || alt?.items || alt?.rows || []);
          console.debug('[Invoice Search] /customers?q= returned:', Array.isArray(list) ? list.length : 'invalid');
          // Fallback to /customers/search if needed
          if (!Array.isArray(list) || list.length === 0) {
            const res = await apiService.searchCustomers(q, 1, 20).catch(() => null);
            list = Array.isArray(res) ? res : (res?.data || res?.items || []);
            console.debug('[Invoice Search] /customers/search?q= returned:', Array.isArray(list) ? list.length : 'invalid');
          }
          // Local fallback filtering
          if (!Array.isArray(list) || list.length === 0) {
            const ql = q.toLowerCase();
            list = (allCustomers || []).filter(c =>
              (c?.name || '').toLowerCase().includes(ql)
              || (c?.phone || '').includes(q)
              || (c?.email || '').toLowerCase().includes(ql)
              || (c?.address || '').toLowerCase().includes(ql)
            );
            console.debug('[Invoice Search] local filter returned:', list.length);
          }
          setCustomers(Array.isArray(list) ? list : []);
          setServerFiltered(true);
        } else {
          // no search text -> reload base list
          const base = await apiService.getCustomers();
          const list = Array.isArray(base) ? base : (base?.data?.customers || base?.data || base?.items || base?.rows || []);
          setCustomers(Array.isArray(list) ? list : []);
          setAllCustomers(Array.isArray(list) ? list : []);
          setServerFiltered(false);
          console.debug('[Invoice Search] base list loaded:', Array.isArray(list) ? list.length : 'invalid');
        }
      } catch (e) {
        // keep silent on search errors to avoid UX noise
        console.warn('[Invoice Search] error during search', e);
      }
      finally {
        setSearching(false);
      }
    }, 300); // debounce
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [customerSearch, showCreateModal]);

  async function loadCustomersAndRepairs() {
    try {
      const [customersData, repairsData] = await Promise.all([
        apiService.getCustomers(),
        apiService.getRepairRequests()
      ]);
      const customersList = Array.isArray(customersData)
        ? customersData
        : (customersData?.data?.customers || customersData?.items || customersData?.rows || []);
      const repairsList = Array.isArray(repairsData)
        ? repairsData
        : (repairsData?.data?.repairs || repairsData?.repairs || repairsData?.items || []);
      setCustomers(customersList);
      setAllCustomers(customersList);
      setRepairs(repairsList);
    } catch (error) {
      console.error('Error loading customers and repairs:', error);
    }
  }

  async function handleAddCustomer() {
    if (!newCustomer.name || !newCustomer.phone) {
      notifications.error('الاسم ورقم الهاتف مطلوبان');
      return;
    }

    try {
      setSavingCustomer(true);
      const createdCustomer = await apiService.createCustomer(newCustomer);
      notifications.success('تم إضافة العميل بنجاح');
      
      // بعد الإنشاء، أعد تحميل العملاء للحصول على الاسم/الهاتف
      try {
        const refreshed = await apiService.getCustomers();
        const list = Array.isArray(refreshed) ? refreshed : (refreshed?.data?.customers || refreshed?.items || []);
        setCustomers(list);
      } catch {}
      // ضمن ظهور العميل حتى لو فشل التحديث
      if (createdCustomer?.id) {
        setCustomers(prev => {
          const exists = (prev || []).some(c => c.id === createdCustomer.id);
          return exists ? prev : [...(prev || []), createdCustomer];
        });
      }
      setCreateForm(prev => ({ ...prev, customerId: createdCustomer?.id }));
      
      // Close modal and reset form
      setShowAddCustomer(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
    } catch (error) {
      console.error('Error adding customer:', error);
      notifications.error('فشل في إضافة العميل');
    } finally {
      setSavingCustomer(false);
    }
  }
}
