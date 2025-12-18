import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import { ROLE_ADMIN, ROLE_TECHNICIAN, ROLE_CUSTOMER, isCustomerRole, isTechnicianRole } from './constants/roles';

// Core App Utilities
import { ThemeProvider } from './components/ThemeProvider';
import { NotificationProvider } from './components/notifications/NotificationSystem';
import SystemNotifications from './components/notifications/SystemNotifications';
import './App.css';

// Layout and Route Protection
import MainLayout from './components/layout/MainLayout';
import CustomerLayout from './components/customer/CustomerLayout';
import { SettingsProvider } from './context/SettingsContext';

// Pages and Components
import EnhancedLoginPage from './pages/EnhancedLoginPage';
import DashboardPage from './pages/DashboardPage'; // Using the new DashboardPage

// Customer Pages - Lazy Loaded (CustomersPage is large - 1550 lines)
const CustomersPage = React.lazy(() => import('./pages/customers').then(m => ({ default: m.CustomersPage })));
const NewCustomerPage = React.lazy(() => import('./pages/customers').then(m => ({ default: m.NewCustomerPage })));
const CustomerDetailsPage = React.lazy(() => import('./pages/customers/CustomerDetailsPage'));
const EditCustomerPage = React.lazy(() => import('./pages/customers/EditCustomerPage'));

// Company Pages - Lazy Loaded
const CompaniesPage = React.lazy(() => import('./pages/companies').then(m => ({ default: m.CompaniesPage })));
const NewCompanyPage = React.lazy(() => import('./pages/companies').then(m => ({ default: m.NewCompanyPage })));
const CompanyDetailsPage = React.lazy(() => import('./pages/companies/CompanyDetailsPage'));
const EditCompanyPage = React.lazy(() => import('./pages/companies/EditCompanyPage'));

// Repair Pages - Lazy Loaded (large files)
const RepairsPage = React.lazy(() => import('./pages/repairs').then(m => ({ default: m.RepairsPage })));
const NewRepairPage = React.lazy(() => import('./pages/repairs/NewRepairPage'));
const NewRepairPageEnhanced = React.lazy(() => import('./pages/repairs/NewRepairPageEnhanced'));
const RepairDetailsPage = React.lazy(() => import('./pages/repairs/RepairDetailsPage')); // 5600 lines - huge file!
const RepairTrackingPage = React.lazy(() => import('./pages/repairs/RepairTrackingPage'));
const PublicRepairTrackingPage = React.lazy(() => import('./pages/repairs/PublicRepairTrackingPage'));
const PublicRepairReportsPage = React.lazy(() => import('./pages/repairs/PublicRepairReportsPage'));
const RepairPrintPage = React.lazy(() => import('./pages/repairs/RepairPrintPage'));
const RepairQRPrintPage = React.lazy(() => import('./pages/repairs/RepairQRPrintPage'));

// Settings and Users - Lazy Loaded
const SettingsDashboard = React.lazy(() => import('./pages/settings/SettingsDashboard')); // Large file - 2210 lines
const UsersPage = React.lazy(() => import('./pages/users/UsersPage'));
const UsersPageEnhanced = React.lazy(() => import('./pages/users/UsersPageEnhanced'));
const UserDetailsPage = React.lazy(() => import('./pages/users/UserDetailsPage'));
const EditUserPage = React.lazy(() => import('./pages/users/EditUserPage'));
const NewUserPage = React.lazy(() => import('./pages/users/NewUserPage'));

// Layout Demo Page - Lazy Loaded
const LayoutDemo = React.lazy(() => import('./pages/LayoutDemo'));
const NotificationDemoPage = React.lazy(() => import('./pages/NotificationDemoPage'));
// Inventory Pages - Lazy Loaded (heavy with ExcelJS imports)
const InventoryPage = React.lazy(() => import('./pages/inventory/InventoryPage'));
const InventoryPageEnhanced = React.lazy(() => import('./pages/inventory/InventoryPageEnhanced'));
const NewInventoryItemPage = React.lazy(() => import('./pages/inventory/NewInventoryItemPage'));
const EditInventoryItemPage = React.lazy(() => import('./pages/inventory/EditInventoryItemPage'));
const InventoryItemDetailsPage = React.lazy(() => import('./pages/inventory/InventoryItemDetailsPage'));
const InventoryTransferPage = React.lazy(() => import('./pages/inventory/InventoryTransferPage'));
const InventoryReportsPage = React.lazy(() => import('./pages/inventory/InventoryReportsPage'));
const WarehouseManagementPage = React.lazy(() => import('./pages/inventory/WarehouseManagementPage'));
const StockMovementPage = React.lazy(() => import('./pages/inventory/StockMovementPage'));
const StockAlertsPage = React.lazy(() => import('./pages/inventory/StockAlertsPage'));
const StockCountPage = React.lazy(() => import('./pages/inventory/StockCountPage'));
const StockTransferPage = React.lazy(() => import('./pages/inventory/StockTransferPage'));
const BarcodeScannerPage = React.lazy(() => import('./pages/inventory/BarcodeScannerPage'));
const ImportExportPage = React.lazy(() => import('./pages/inventory/ImportExportPage')); // Has ExcelJS
const AnalyticsPage = React.lazy(() => import('./pages/inventory/AnalyticsPage')); // Has Recharts

// Reports Pages - Lazy Loaded (heavy with chart libraries)
const FinancialReportsPage = React.lazy(() => import('./pages/reports/FinancialReportsPage'));
const DailyReportsPage = React.lazy(() => import('./pages/reports/DailyReportsPage'));
const TechnicianReportsPage = React.lazy(() => import('./pages/reports/TechnicianReportsPage'));
const TechnicianDashboard = React.lazy(() => import('./pages/technician/TechnicianDashboard'));
const JobsListPage = React.lazy(() => import('./pages/technician/JobsListPage'));
const JobDetailsPage = React.lazy(() => import('./pages/technician/JobDetailsPage'));
const NewInspectionReportPage = React.lazy(() => import('./pages/technician/NewInspectionReportPage'));
const TasksPage = React.lazy(() => import('./pages/technician/TasksPage'));

// Integration Pages - Lazy Loaded
const WorkflowDashboardPage = React.lazy(() => import('./pages/integration/WorkflowDashboardPage'));

// Invoices - Lazy Loaded
const InvoicesPage = React.lazy(() => import('./pages/invoices/InvoicesPage'));
const InvoiceDetailsPageOld = React.lazy(() => import('./pages/invoices/InvoiceDetailsPage'));
const CreateInvoicePage = React.lazy(() => import('./pages/invoices/CreateInvoicePage')); // Large file
const EditInvoicePage = React.lazy(() => import('./pages/invoices/EditInvoicePage'));

// Payments - Lazy Loaded (has chart imports)
const PaymentsPage = React.lazy(() => import('./pages/payments').then(m => ({ default: m.PaymentsPage })));
const PaymentDetailsPage = React.lazy(() => import('./pages/payments').then(m => ({ default: m.PaymentDetailsPage })));
const CreatePaymentPage = React.lazy(() => import('./pages/payments').then(m => ({ default: m.CreatePaymentPage })));
const EditPaymentPage = React.lazy(() => import('./pages/payments').then(m => ({ default: m.EditPaymentPage })));
const PaymentReportsPage = React.lazy(() => import('./pages/payments').then(m => ({ default: m.PaymentReportsPage })));
const OverduePaymentsPage = React.lazy(() => import('./pages/payments').then(m => ({ default: m.OverduePaymentsPage })));

// Vendors & Services - Lazy Loaded
const VendorsPage = React.lazy(() => import('./pages/vendors/VendorsPage'));
const VendorDetailsPage = React.lazy(() => import('./pages/vendors/VendorDetailsPage'));
const PurchaseOrdersPage = React.lazy(() => import('./pages/PurchaseOrders/PurchaseOrdersPage'));
const ServicesCatalogPage = React.lazy(() => import('./pages/services/ServicesCatalog'));
const ServiceForm = React.lazy(() => import('./pages/services/ServiceForm'));
const ServiceDetails = React.lazy(() => import('./pages/services/ServiceDetails'));
const RolesPermissionsPage = React.lazy(() => import('./pages/admin/RolesPermissionsPage'));

// Expenses - Lazy Loaded
const ExpensesPage = React.lazy(() => import('./pages/expenses').then(m => ({ default: m.ExpensesPage })));

// Financial Module Pages (v2) - Lazy Loaded (heavy with chart libraries)
const FinancialDashboardPage = React.lazy(() => import('./pages/financial/FinancialDashboardPage'));
const ExpensesListPage = React.lazy(() => import('./pages/financial/expenses').then(m => ({ default: m.ExpensesListPage })));
const ExpenseCreatePage = React.lazy(() => import('./pages/financial/expenses').then(m => ({ default: m.ExpenseCreatePage })));
const ExpenseEditPage = React.lazy(() => import('./pages/financial/expenses').then(m => ({ default: m.ExpenseEditPage })));
const ExpenseDetailsPage = React.lazy(() => import('./pages/financial/expenses').then(m => ({ default: m.ExpenseDetailsPage })));
const PaymentsListPage = React.lazy(() => import('./pages/financial/payments').then(m => ({ default: m.PaymentsListPage })));
const PaymentCreatePageFinancial = React.lazy(() => import('./pages/financial/payments').then(m => ({ default: m.PaymentCreatePage })));
const InvoicesListPage = React.lazy(() => import('./pages/financial/invoices').then(m => ({ default: m.InvoicesListPage })));
const InvoiceDetailsPageFinancial = React.lazy(() => import('./pages/financial/invoices').then(m => ({ default: m.InvoiceDetailsPage })));
const InvoiceCreatePageFinancial = React.lazy(() => import('./pages/financial/invoices').then(m => ({ default: m.InvoiceCreatePage })));

// Quotations - Lazy Loaded
const QuotationsPage = React.lazy(() => import('./pages/quotations').then(m => ({ default: m.QuotationsPage })));

// Messaging - Lazy Loaded
const MessagingCenterPage = React.lazy(() => import('./pages/messaging/MessagingCenterPage'));
const MessagingReportsPage = React.lazy(() => import('./pages/messaging/MessagingReportsPage'));

// Technician Portal Pages - Lazy Loaded
const TechnicianProfilePage = React.lazy(() => import('./pages/technician/TechnicianProfilePage'));
const TechnicianSettingsPage = React.lazy(() => import('./pages/technician/TechnicianSettingsPage'));

// Technicians Management Pages (Admin) - Lazy Loaded
const TechniciansPage = React.lazy(() => import('./pages/technicians/TechniciansPage'));
const TechnicianDetailsPage = React.lazy(() => import('./pages/technicians/TechnicianDetailsPage'));
const TechnicianForm = React.lazy(() => import('./pages/technicians/TechnicianForm'));
const TechnicianAnalyticsPage = React.lazy(() => import('./pages/technicians/TechnicianAnalyticsPage')); // Has chart libraries

// Debug Page - Lazy Loaded
const DebugPage = React.lazy(() => import('./pages/DebugPage'));

// ============================================
// Lazy Loaded Components for Performance
// ============================================

// Customer Portal Pages - Lazy Loaded
const CustomerLoginPage = React.lazy(() => import('./pages/customer/CustomerLoginPage'));
const CustomerDashboard = React.lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerRepairsPage = React.lazy(() => import('./pages/customer/CustomerRepairsPage'));
const CustomerInvoicesPage = React.lazy(() => import('./pages/customer/CustomerInvoicesPage'));
const CustomerDevicesPage = React.lazy(() => import('./pages/customer/CustomerDevicesPage'));
const CustomerProfilePage = React.lazy(() => import('./pages/customer/CustomerProfilePage'));
const CustomerRepairDetailsPage = React.lazy(() => import('./pages/customer/CustomerRepairDetailsPage'));
const CustomerInvoiceDetailsPage = React.lazy(() => import('./pages/customer/CustomerInvoiceDetailsPage'));
const CustomerSettingsPage = React.lazy(() => import('./pages/customer/CustomerSettingsPage'));
const CustomerNotificationsPage = React.lazy(() => import('./pages/customer/CustomerNotificationsPage'));
const CustomerHelpPage = React.lazy(() => import('./pages/customer/CustomerHelpPage'));

// Public Pages - Lazy Loaded
// TrackRepairPage تم حذفها - تم استخدام PublicRepairTrackingPage بدلاً منها

// Loading Fallback Component for Customer Portal
const CustomerLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 border-4 border-muted border-t-brand-blue rounded-full animate-spin" />
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
);

// Loading Fallback Component for Main App Routes
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 border-4 border-muted border-t-brand-blue rounded-full animate-spin" />
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
);

// Placeholder components removed; using real pages instead

// This component protects routes that require authentication.
// Also redirects customers away from admin pages
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is customer (Role 8)
  const roleId = user?.roleId || user?.role;
  const numericRoleId = Number(roleId);
  const isCustomer = isCustomerRole(numericRoleId) || user?.type === 'customer';
  const isTechnician = isTechnicianRole(numericRoleId);

  // If user is customer, redirect them to customer dashboard
  // Customers should ONLY access /customer/* routes
  if (isCustomer) {
    const currentPath = window.location.pathname;
    // Allow access to customer routes
    if (currentPath.startsWith('/customer/')) {
      return children;
    }
    // Allow access to public routes (track, print)
    if (currentPath.startsWith('/track') || currentPath.includes('/print')) {
      return children;
    }
    // Redirect all other routes to customer dashboard
    return <Navigate to="/customer/dashboard" replace />;
  }

  // If user is technician, redirect them to technician dashboard
  // Technicians should ONLY access /tech/* routes
  if (isTechnician) {
    const currentPath = window.location.pathname;
    // Allow access to technician routes
    if (currentPath.startsWith('/tech/')) {
      return children;
    }
    // Allow access to public routes (track, print)
    if (currentPath.startsWith('/track') || currentPath.includes('/print')) {
      return children;
    }
    // Redirect all other routes to technician dashboard
    return <Navigate to="/tech/dashboard" replace />;
  }

  return children;
};

// This component handles routes that should only be accessible to unauthenticated users.
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// Customer route wrapper - checks if user is customer
const CustomerRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const roleId = user?.roleId || user?.role;
  const numericRoleId = Number(roleId);
  const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));
  return isAuthenticated && isCustomer ? children : <Navigate to="/customer/login" replace />;
};

// Technician route wrapper - checks if user is technician
const TechnicianRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const roleId = user?.roleId || user?.role;
  const numericRoleId = Number(roleId);
  const isTechnician = user && numericRoleId === ROLE_TECHNICIAN;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isTechnician) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public customer route - redirect to unified login
const PublicCustomerRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const roleId = user?.roleId || user?.role;
  const numericRoleId = Number(roleId);
  const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

  // If logged in, redirect based on role
  if (isAuthenticated) {
    if (isCustomer) {
      return <Navigate to="/customer/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // If not logged in, redirect to unified login page
  return <Navigate to="/login" replace />;
};

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const roleId = user?.roleId || user?.role;
  const numericRoleId = Number(roleId);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is customer - redirect to customer dashboard
  const isCustomer = isCustomerRole(numericRoleId) || user?.type === 'customer';
  if (isCustomer) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // Check if user is admin
  const isAdmin = numericRoleId === ROLE_ADMIN || roleId === '1' || user?.role === ROLE_ADMIN || user?.role === 'admin';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  // Restore session from httpOnly cookie on app load
  // Skip for public pages (like /track) that don't need authentication
  useEffect(() => {
    const currentPath = window.location.pathname;
    // Don't restore session on public tracking page
    if (currentPath.startsWith('/track')) {
      return;
    }
    restoreSession();
  }, [restoreSession]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NotificationProvider position="top-right" maxNotifications={5}>
        <SystemNotifications />
        <SettingsProvider>
          <Routes>
            {/* Staff/Admin Login */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <EnhancedLoginPage />
                </PublicRoute>
              }
            />

            {/* Debug Page - للمطورين */}
            <Route path="/debug" element={<Suspense fallback={<LoadingFallback />}><DebugPage /></Suspense>} />

            {/* Customer Portal Routes - Login redirects to unified login */}
            <Route
              path="/customer/login"
              element={<Navigate to="/login" replace />}
            />
            <Route
              path="/customer/*"
              element={
                <CustomerRoute>
                  <CustomerLayout>
                    <Suspense fallback={<CustomerLoadingFallback />}>
                      <Routes>
                        <Route path="dashboard" element={<CustomerDashboard />} />
                        <Route path="repairs" element={<CustomerRepairsPage />} />
                        <Route path="repairs/:id" element={<CustomerRepairDetailsPage />} />
                        <Route path="invoices" element={<CustomerInvoicesPage />} />
                        <Route path="invoices/:id" element={<CustomerInvoiceDetailsPage />} />
                        <Route path="devices" element={<CustomerDevicesPage />} />
                        <Route path="profile" element={<CustomerProfilePage />} />
                        <Route path="settings" element={<CustomerSettingsPage />} />
                        <Route path="notifications" element={<CustomerNotificationsPage />} />
                        <Route path="help" element={<CustomerHelpPage />} />
                        <Route path="*" element={<Navigate to="/customer/dashboard" replace />} />
                      </Routes>
                    </Suspense>
                  </CustomerLayout>
                </CustomerRoute>
              }
            />

            {/* Technician Portal Routes */}
            <Route path="/technician" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><TechnicianDashboard /></Suspense></TechnicianRoute>} />
            <Route path="/technician/dashboard" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><TechnicianDashboard /></Suspense></TechnicianRoute>} />
            <Route path="/technician/jobs" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><JobsListPage /></Suspense></TechnicianRoute>} />
            <Route path="/technician/jobs/:id" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><JobDetailsPage /></Suspense></TechnicianRoute>} />
            <Route path="/technician/jobs/:id/report/new" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><NewInspectionReportPage /></Suspense></TechnicianRoute>} />
            <Route path="/technician/jobs/:id/report/edit/:reportId" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><NewInspectionReportPage /></Suspense></TechnicianRoute>} />
            <Route path="/technician/tasks" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><TasksPage /></Suspense></TechnicianRoute>} />
            <Route path="/technician/profile" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><TechnicianProfilePage /></Suspense></TechnicianRoute>} />
            <Route path="/technician/settings" element={<TechnicianRoute><Suspense fallback={<LoadingFallback />}><TechnicianSettingsPage /></Suspense></TechnicianRoute>} />
            <Route path="/tech/*" element={<Navigate to="/technician/dashboard" replace />} /> {/* Redirect old /tech routes */}

            {/* Public Routes - لا تحتاج تسجيل دخول */}
            {/* صفحة التتبع الرئيسية - PublicRepairTrackingPage (الأكثر اكتمالاً) */}
            <Route path="/track" element={<Suspense fallback={<LoadingFallback />}><PublicRepairTrackingPage /></Suspense>} />
            <Route path="/track/:id" element={<Suspense fallback={<LoadingFallback />}><PublicRepairTrackingPage /></Suspense>} />
            <Route path="/track/reports" element={<Suspense fallback={<LoadingFallback />}><PublicRepairReportsPage /></Suspense>} />

            {/* Staff/Admin Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Routes>

                    {/* Print routes outside layout to produce clean print pages */}
                    <Route path="repairs/:id/print" element={<Suspense fallback={<LoadingFallback />}><RepairPrintPage /></Suspense>} />
                    <Route path="repairs/:id/print-qr" element={<Suspense fallback={<LoadingFallback />}><RepairQRPrintPage /></Suspense>} />

                    {/* App routes under main layout */}
                    <Route path="/*" element={<MainLayout />}>
                      <Route index element={<Suspense fallback={<LoadingFallback />}><WorkflowDashboardPage /></Suspense>} />
                      <Route path="dashboard" element={<DashboardPage />} />

                      {/* Repairs */}
                      <Route path="repairs" element={<Suspense fallback={<LoadingFallback />}><RepairsPage /></Suspense>} />
                      <Route path="repairs/new" element={<Suspense fallback={<LoadingFallback />}><NewRepairPageEnhanced /></Suspense>} />
                      <Route path="repairs/new-old" element={<Suspense fallback={<LoadingFallback />}><NewRepairPage /></Suspense>} />
                      <Route path="repairs/tracking" element={<Suspense fallback={<LoadingFallback />}><RepairTrackingPage /></Suspense>} />
                      <Route path="repairs/:id" element={<Suspense fallback={<LoadingFallback />}><RepairDetailsPage /></Suspense>} />

                      {/* Services Catalog */}
                      <Route path="services" element={<Suspense fallback={<LoadingFallback />}><ServicesCatalogPage /></Suspense>} />
                      <Route path="services/new" element={<Suspense fallback={<LoadingFallback />}><ServiceForm /></Suspense>} />
                      <Route path="services/:id" element={<Suspense fallback={<LoadingFallback />}><ServiceDetails /></Suspense>} />
                      <Route path="services/:id/edit" element={<Suspense fallback={<LoadingFallback />}><ServiceForm /></Suspense>} />

                      {/* Expenses */}
                      <Route path="expenses" element={<Suspense fallback={<LoadingFallback />}><ExpensesPage /></Suspense>} />

                      {/* Quotations */}
                      <Route path="quotations" element={<Suspense fallback={<LoadingFallback />}><QuotationsPage /></Suspense>} />
                      
                      {/* Messaging Center */}
                      <Route path="messaging" element={<Suspense fallback={<LoadingFallback />}><MessagingCenterPage /></Suspense>} />
                      <Route path="messaging/reports" element={<Suspense fallback={<LoadingFallback />}><MessagingReportsPage /></Suspense>} />

                      {/* Customers */}
                      <Route path="customers" element={<Suspense fallback={<LoadingFallback />}><CustomersPage /></Suspense>} />
                      <Route path="customers/new" element={<Suspense fallback={<LoadingFallback />}><NewCustomerPage /></Suspense>} />
                      <Route path="customers/:id" element={<Suspense fallback={<LoadingFallback />}><CustomerDetailsPage /></Suspense>} />
                      <Route path="customers/:id/edit" element={<Suspense fallback={<LoadingFallback />}><EditCustomerPage /></Suspense>} />

                      {/* Companies */}
                      <Route path="companies" element={<Suspense fallback={<LoadingFallback />}><CompaniesPage /></Suspense>} />
                      <Route path="companies/new" element={<Suspense fallback={<LoadingFallback />}><NewCompanyPage /></Suspense>} />
                      <Route path="companies/:id" element={<Suspense fallback={<LoadingFallback />}><CompanyDetailsPage /></Suspense>} />
                      <Route path="companies/:id/edit" element={<Suspense fallback={<LoadingFallback />}><EditCompanyPage /></Suspense>} />

                      {/* Inventory, Settings, Payments */}
                      <Route path="inventory" element={<Suspense fallback={<LoadingFallback />}><InventoryPageEnhanced /></Suspense>} />
                      <Route path="inventory/new" element={<Suspense fallback={<LoadingFallback />}><NewInventoryItemPage /></Suspense>} />
                      <Route path="inventory/parts" element={<Navigate to="/inventory" replace />} />
                      <Route path="inventory/transfer" element={<Suspense fallback={<LoadingFallback />}><InventoryTransferPage /></Suspense>} />
                      <Route path="inventory/reports" element={<Suspense fallback={<LoadingFallback />}><InventoryReportsPage /></Suspense>} />
                      <Route path="inventory/warehouses" element={<Suspense fallback={<LoadingFallback />}><WarehouseManagementPage /></Suspense>} />
                      <Route path="inventory/stock-movements" element={<Suspense fallback={<LoadingFallback />}><StockMovementPage /></Suspense>} />
                      <Route path="inventory/stock-alerts" element={<Suspense fallback={<LoadingFallback />}><StockAlertsPage /></Suspense>} />
                      <Route path="inventory/:id/edit" element={<Suspense fallback={<LoadingFallback />}><EditInventoryItemPage /></Suspense>} />
                      <Route path="inventory/:id" element={<Suspense fallback={<LoadingFallback />}><InventoryItemDetailsPage /></Suspense>} />
                      <Route path="inventory-old" element={<Suspense fallback={<LoadingFallback />}><InventoryPage /></Suspense>} />
                      <Route path="stock-count" element={<Suspense fallback={<LoadingFallback />}><StockCountPage /></Suspense>} />
                      <Route path="stock-transfer" element={<Suspense fallback={<LoadingFallback />}><StockTransferPage /></Suspense>} />
                      <Route path="barcode-scanner" element={<Suspense fallback={<LoadingFallback />}><BarcodeScannerPage /></Suspense>} />
                      <Route path="import-export" element={<Suspense fallback={<LoadingFallback />}><ImportExportPage /></Suspense>} />
                      <Route path="analytics" element={<Suspense fallback={<LoadingFallback />}><AnalyticsPage /></Suspense>} />
                      <Route path="inventory/analytics" element={<Suspense fallback={<LoadingFallback />}><AnalyticsPage /></Suspense>} />
                      {/* Invoices */}
                      <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><InvoicesPage /></Suspense>} />
                      <Route path="invoices/new" element={<Suspense fallback={<LoadingFallback />}><CreateInvoicePage /></Suspense>} />
                      <Route path="invoices/create" element={<Suspense fallback={<LoadingFallback />}><CreateInvoicePage /></Suspense>} />
                      <Route path="invoices/:id/edit" element={<Suspense fallback={<LoadingFallback />}><EditInvoicePage /></Suspense>} />
                      <Route path="invoices/:id" element={<Suspense fallback={<LoadingFallback />}><InvoiceDetailsPageOld /></Suspense>} />
                      {/* Payments */}
                      <Route path="payments" element={<Suspense fallback={<LoadingFallback />}><PaymentsPage /></Suspense>} />
                      <Route path="payments/new" element={<Suspense fallback={<LoadingFallback />}><CreatePaymentPage /></Suspense>} />
                      <Route path="payments/:id" element={<Suspense fallback={<LoadingFallback />}><PaymentDetailsPage /></Suspense>} />
                      <Route path="payments/:id/edit" element={<Suspense fallback={<LoadingFallback />}><EditPaymentPage /></Suspense>} />
                      <Route path="payments/reports" element={<Suspense fallback={<LoadingFallback />}><PaymentReportsPage /></Suspense>} />
                      <Route path="payments/overdue" element={<Suspense fallback={<LoadingFallback />}><OverduePaymentsPage /></Suspense>} />

                      {/* Financial Module (v2 - new architecture) */}
                      <Route path="financial" element={<Suspense fallback={<LoadingFallback />}><FinancialDashboardPage /></Suspense>} />
                      <Route path="financial/dashboard" element={<Suspense fallback={<LoadingFallback />}><FinancialDashboardPage /></Suspense>} />
                      <Route path="financial/expenses" element={<Suspense fallback={<LoadingFallback />}><ExpensesListPage /></Suspense>} />
                      <Route path="financial/expenses/create" element={<Suspense fallback={<LoadingFallback />}><ExpenseCreatePage /></Suspense>} />
                      <Route path="financial/expenses/:id" element={<Suspense fallback={<LoadingFallback />}><ExpenseDetailsPage /></Suspense>} />
                      <Route path="financial/expenses/:id/edit" element={<Suspense fallback={<LoadingFallback />}><ExpenseEditPage /></Suspense>} />
                      <Route path="financial/payments" element={<Suspense fallback={<LoadingFallback />}><PaymentsListPage /></Suspense>} />
                      <Route path="financial/payments/create" element={<Suspense fallback={<LoadingFallback />}><PaymentCreatePageFinancial /></Suspense>} />
                      <Route path="financial/invoices" element={<Suspense fallback={<LoadingFallback />}><InvoicesListPage /></Suspense>} />
                      <Route path="financial/invoices/create" element={<Suspense fallback={<LoadingFallback />}><InvoiceCreatePageFinancial /></Suspense>} />
                      <Route path="financial/invoices/:id" element={<Suspense fallback={<LoadingFallback />}><InvoiceDetailsPageFinancial /></Suspense>} />

                      {/* Reports */}
                      <Route path="reports/financial" element={<Suspense fallback={<LoadingFallback />}><FinancialReportsPage /></Suspense>} />
                      <Route path="reports/daily" element={<Suspense fallback={<LoadingFallback />}><DailyReportsPage /></Suspense>} />
                      <Route path="reports/technician" element={<Suspense fallback={<LoadingFallback />}><TechnicianReportsPage /></Suspense>} />

                      {/* Integration */}
                      <Route path="integration/workflow" element={<Suspense fallback={<LoadingFallback />}><WorkflowDashboardPage /></Suspense>} />

                      {/* Delivery - Temporarily disabled */}
                      {/* <Route path="delivery" element={<DeliveryPage />} /> */}

                      {/* Vendors & Purchase Orders */}
                      <Route path="vendors" element={<Suspense fallback={<LoadingFallback />}><VendorsPage /></Suspense>} />
                      <Route path="vendors/:id" element={<Suspense fallback={<LoadingFallback />}><VendorDetailsPage /></Suspense>} />
                      <Route path="purchase-orders" element={<Suspense fallback={<LoadingFallback />}><PurchaseOrdersPage /></Suspense>} />

                      <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><SettingsDashboard /></Suspense>} />
                      <Route path="users" element={<Suspense fallback={<LoadingFallback />}><UsersPageEnhanced /></Suspense>} />
                      <Route path="users-old" element={<Suspense fallback={<LoadingFallback />}><UsersPage /></Suspense>} />
                      <Route path="users/new" element={<Suspense fallback={<LoadingFallback />}><NewUserPage /></Suspense>} />
                      <Route path="users/:id" element={<Suspense fallback={<LoadingFallback />}><UserDetailsPage /></Suspense>} />
                      <Route path="users/:id/edit" element={<Suspense fallback={<LoadingFallback />}><EditUserPage /></Suspense>} />
                      {/* Technicians Management Routes */}
                      <Route path="technicians" element={<Suspense fallback={<LoadingFallback />}><TechniciansPage /></Suspense>} />
                      <Route path="technicians/new" element={<Suspense fallback={<LoadingFallback />}><TechnicianForm /></Suspense>} />
                      <Route path="technicians/:id" element={<Suspense fallback={<LoadingFallback />}><TechnicianDetailsPage /></Suspense>} />
                      <Route path="technicians/:id/edit" element={<Suspense fallback={<LoadingFallback />}><TechnicianForm /></Suspense>} />
                      <Route path="technicians/:id/analytics" element={<Suspense fallback={<LoadingFallback />}><TechnicianAnalyticsPage /></Suspense>} />
                      {/* Admin / Roles & Permissions */}
                      <Route
                        path="admin/roles"
                        element={
                          <AdminRoute>
                            <Suspense fallback={<LoadingFallback />}>
                              <RolesPermissionsPage />
                            </Suspense>
                          </AdminRoute>
                        }
                      />

                      {/* Demo */}
                      <Route path="demo" element={<Suspense fallback={<LoadingFallback />}><LayoutDemo /></Suspense>} />
                      <Route path="notifications-demo" element={<Suspense fallback={<LoadingFallback />}><NotificationDemoPage /></Suspense>} />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
        </SettingsProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
