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

// Pages and Components
import EnhancedLoginPage from './pages/EnhancedLoginPage';
import DashboardPage from './pages/DashboardPage'; // Using the new DashboardPage

// Customer Pages
import { CustomersPage, NewCustomerPage } from './pages/customers';
import CustomerDetailsPage from './pages/customers/CustomerDetailsPage';
import EditCustomerPage from './pages/customers/EditCustomerPage';

// Company Pages
import { CompaniesPage, NewCompanyPage } from './pages/companies';
import CompanyDetailsPage from './pages/companies/CompanyDetailsPage';
import EditCompanyPage from './pages/companies/EditCompanyPage';

// Repair Pages
import { RepairsPage } from './pages/repairs';
import NewRepairPage from './pages/repairs/NewRepairPage';
import NewRepairPageEnhanced from './pages/repairs/NewRepairPageEnhanced';
import RepairDetailsPage from './pages/repairs/RepairDetailsPage';
import RepairTrackingPage from './pages/repairs/RepairTrackingPage';
import PublicRepairTrackingPage from './pages/repairs/PublicRepairTrackingPage';
import PublicRepairReportsPage from './pages/repairs/PublicRepairReportsPage';
import RepairPrintPage from './pages/repairs/RepairPrintPage';
import RepairQRPrintPage from './pages/repairs/RepairQRPrintPage';
import { SettingsProvider } from './context/SettingsContext';
import SettingsDashboard from './pages/settings/SettingsDashboard';
import UsersPage from './pages/users/UsersPage';
import UsersPageEnhanced from './pages/users/UsersPageEnhanced';
import UserDetailsPage from './pages/users/UserDetailsPage';
import EditUserPage from './pages/users/EditUserPage';
import NewUserPage from './pages/users/NewUserPage';

// Layout Demo Page
import LayoutDemo from './pages/LayoutDemo';
import NotificationDemoPage from './pages/NotificationDemoPage';
import InventoryPage from './pages/inventory/InventoryPage';
import InventoryPageEnhanced from './pages/inventory/InventoryPageEnhanced';
import NewInventoryItemPage from './pages/inventory/NewInventoryItemPage';
import EditInventoryItemPage from './pages/inventory/EditInventoryItemPage';
import InventoryItemDetailsPage from './pages/inventory/InventoryItemDetailsPage';
import InventoryTransferPage from './pages/inventory/InventoryTransferPage';
import InventoryReportsPage from './pages/inventory/InventoryReportsPage';
import WarehouseManagementPage from './pages/inventory/WarehouseManagementPage';
import StockMovementPage from './pages/inventory/StockMovementPage';
import StockAlertsPage from './pages/inventory/StockAlertsPage';
import StockCountPage from './pages/inventory/StockCountPage';
import StockTransferPage from './pages/inventory/StockTransferPage';
import BarcodeScannerPage from './pages/inventory/BarcodeScannerPage';
import ImportExportPage from './pages/inventory/ImportExportPage';
import AnalyticsPage from './pages/inventory/AnalyticsPage';

// Reports Pages
import FinancialReportsPage from './pages/reports/FinancialReportsPage';
import DailyReportsPage from './pages/reports/DailyReportsPage';
import TechnicianReportsPage from './pages/reports/TechnicianReportsPage';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import JobsListPage from './pages/technician/JobsListPage';
import JobDetailsPage from './pages/technician/JobDetailsPage';
import NewInspectionReportPage from './pages/technician/NewInspectionReportPage';
import TasksPage from './pages/technician/TasksPage';

// Integration Pages
import WorkflowDashboardPage from './pages/integration/WorkflowDashboardPage';

import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailsPageOld from './pages/invoices/InvoiceDetailsPage';
import CreateInvoicePage from './pages/invoices/CreateInvoicePage';
import EditInvoicePage from './pages/invoices/EditInvoicePage';
// Temporarily commented out missing pages:
// import DeliveryPage from './pages/Delivery/DeliveryPage';
import { PaymentsPage, PaymentDetailsPage, CreatePaymentPage, EditPaymentPage, PaymentReportsPage, OverduePaymentsPage } from './pages/payments';
import VendorsPage from './pages/vendors/VendorsPage';
import VendorDetailsPage from './pages/vendors/VendorDetailsPage';
import PurchaseOrdersPage from './pages/PurchaseOrders/PurchaseOrdersPage';
import ServicesCatalogPage from './pages/services/ServicesCatalog';
import ServiceForm from './pages/services/ServiceForm';
import ServiceDetails from './pages/services/ServiceDetails';
import RolesPermissionsPage from './pages/admin/RolesPermissionsPage';

// Expenses Pages
import { ExpensesPage } from './pages/expenses';

// Financial Module Pages (v2 - new architecture)
import FinancialDashboardPage from './pages/financial/FinancialDashboardPage';
import { ExpensesListPage, ExpenseCreatePage, ExpenseEditPage, ExpenseDetailsPage } from './pages/financial/expenses';
import { PaymentsListPage, PaymentCreatePage } from './pages/financial/payments';
import { InvoicesListPage, InvoiceDetailsPage, InvoiceCreatePage } from './pages/financial/invoices';

// Quotations Pages
import { QuotationsPage } from './pages/quotations';

// Messaging Pages
import MessagingCenterPage from './pages/messaging/MessagingCenterPage';
import MessagingReportsPage from './pages/messaging/MessagingReportsPage';

// Customer Portal Layout
import CustomerLayout from './components/customer/CustomerLayout';

// Technician Portal Pages
import TechnicianProfilePage from './pages/technician/TechnicianProfilePage';
import TechnicianSettingsPage from './pages/technician/TechnicianSettingsPage';

// Technicians Management Pages (Admin)
import TechniciansPage from './pages/technicians/TechniciansPage';
import TechnicianDetailsPage from './pages/technicians/TechnicianDetailsPage';
import TechnicianForm from './pages/technicians/TechnicianForm';
import TechnicianAnalyticsPage from './pages/technicians/TechnicianAnalyticsPage';

// Debug Page
import DebugPage from './pages/DebugPage';

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
const TrackRepairPage = React.lazy(() => import('./pages/public/TrackRepairPage'));

// Loading Fallback Component for Customer Portal
const CustomerLoadingFallback = () => (
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
            <Route path="/debug" element={<DebugPage />} />

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
            <Route path="/technician" element={<TechnicianRoute><TechnicianDashboard /></TechnicianRoute>} />
            <Route path="/technician/dashboard" element={<TechnicianRoute><TechnicianDashboard /></TechnicianRoute>} />
            <Route path="/technician/jobs" element={<TechnicianRoute><JobsListPage /></TechnicianRoute>} />
            <Route path="/technician/jobs/:id" element={<TechnicianRoute><JobDetailsPage /></TechnicianRoute>} />
            <Route path="/technician/jobs/:id/report/new" element={<TechnicianRoute><NewInspectionReportPage /></TechnicianRoute>} />
            <Route path="/technician/jobs/:id/report/edit/:reportId" element={<TechnicianRoute><NewInspectionReportPage /></TechnicianRoute>} />
            <Route path="/technician/tasks" element={<TechnicianRoute><TasksPage /></TechnicianRoute>} />
            <Route path="/technician/profile" element={<TechnicianRoute><TechnicianProfilePage /></TechnicianRoute>} />
            <Route path="/technician/settings" element={<TechnicianRoute><TechnicianSettingsPage /></TechnicianRoute>} />
            <Route path="/tech/*" element={<Navigate to="/technician/dashboard" replace />} /> {/* Redirect old /tech routes */}

            {/* Public Routes - لا تحتاج تسجيل دخول */}
            <Route path="/track" element={<Suspense fallback={<CustomerLoadingFallback />}><TrackRepairPage /></Suspense>} />
            <Route path="/track/:id" element={<Suspense fallback={<CustomerLoadingFallback />}><TrackRepairPage /></Suspense>} />
            <Route path="/track/reports" element={<PublicRepairReportsPage />} />

            {/* Staff/Admin Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Routes>

                    {/* Print routes outside layout to produce clean print pages */}
                    <Route path="repairs/:id/print" element={<RepairPrintPage />} />
                    <Route path="repairs/:id/print-qr" element={<RepairQRPrintPage />} />

                    {/* App routes under main layout */}
                    <Route path="/*" element={<MainLayout />}>
                      <Route index element={<WorkflowDashboardPage />} />
                      <Route path="dashboard" element={<DashboardPage />} />

                      {/* Repairs */}
                      <Route path="repairs" element={<RepairsPage />} />
                      <Route path="repairs/new" element={<NewRepairPageEnhanced />} />
                      <Route path="repairs/new-old" element={<NewRepairPage />} />
                      <Route path="repairs/tracking" element={<RepairTrackingPage />} />
                      <Route path="repairs/:id" element={<RepairDetailsPage />} />

                      {/* Services Catalog */}
                      <Route path="services" element={<ServicesCatalogPage />} />
                      <Route path="services/new" element={<ServiceForm />} />
                      <Route path="services/:id" element={<ServiceDetails />} />
                      <Route path="services/:id/edit" element={<ServiceForm />} />

                      {/* Expenses */}
                      <Route path="expenses" element={<ExpensesPage />} />

                      {/* Quotations */}
                      <Route path="quotations" element={<QuotationsPage />} />
                      
                      {/* Messaging Center */}
                      <Route path="messaging" element={<MessagingCenterPage />} />
                      <Route path="messaging/reports" element={<MessagingReportsPage />} />

                      {/* Customers */}
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="customers/new" element={<NewCustomerPage />} />
                      <Route path="customers/:id" element={<CustomerDetailsPage />} />
                      <Route path="customers/:id/edit" element={<EditCustomerPage />} />

                      {/* Companies */}
                      <Route path="companies" element={<CompaniesPage />} />
                      <Route path="companies/new" element={<NewCompanyPage />} />
                      <Route path="companies/:id" element={<CompanyDetailsPage />} />
                      <Route path="companies/:id/edit" element={<EditCompanyPage />} />

                      {/* Inventory, Settings, Payments */}
                      <Route path="inventory" element={<InventoryPageEnhanced />} />
                      <Route path="inventory/new" element={<NewInventoryItemPage />} />
                      <Route path="inventory/parts" element={<Navigate to="/inventory" replace />} />
                      <Route path="inventory/transfer" element={<InventoryTransferPage />} />
                      <Route path="inventory/reports" element={<InventoryReportsPage />} />
                      <Route path="inventory/warehouses" element={<WarehouseManagementPage />} />
                      <Route path="inventory/stock-movements" element={<StockMovementPage />} />
                      <Route path="inventory/stock-alerts" element={<StockAlertsPage />} />
                      <Route path="inventory/:id/edit" element={<EditInventoryItemPage />} />
                      <Route path="inventory/:id" element={<InventoryItemDetailsPage />} />
                      <Route path="inventory-old" element={<InventoryPage />} />
                      <Route path="stock-count" element={<StockCountPage />} />
                      <Route path="stock-transfer" element={<StockTransferPage />} />
                      <Route path="barcode-scanner" element={<BarcodeScannerPage />} />
                      <Route path="import-export" element={<ImportExportPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="inventory/analytics" element={<AnalyticsPage />} />
                      {/* Invoices */}
                      <Route path="invoices" element={<InvoicesPage />} />
                      <Route path="invoices/new" element={<CreateInvoicePage />} />
                      <Route path="invoices/create" element={<CreateInvoicePage />} />
                      <Route path="invoices/:id/edit" element={<EditInvoicePage />} />
                      <Route path="invoices/:id" element={<InvoiceDetailsPageOld />} />
                      {/* Payments */}
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="payments/new" element={<CreatePaymentPage />} />
                      <Route path="payments/:id" element={<PaymentDetailsPage />} />
                      <Route path="payments/:id/edit" element={<EditPaymentPage />} />
                      <Route path="payments/reports" element={<PaymentReportsPage />} />
                      <Route path="payments/overdue" element={<OverduePaymentsPage />} />

                      {/* Financial Module (v2 - new architecture) */}
                      <Route path="financial" element={<FinancialDashboardPage />} />
                      <Route path="financial/dashboard" element={<FinancialDashboardPage />} />
                      <Route path="financial/expenses" element={<ExpensesListPage />} />
                      <Route path="financial/expenses/create" element={<ExpenseCreatePage />} />
                      <Route path="financial/expenses/:id" element={<ExpenseDetailsPage />} />
                      <Route path="financial/expenses/:id/edit" element={<ExpenseEditPage />} />
                      <Route path="financial/payments" element={<PaymentsListPage />} />
                      <Route path="financial/payments/create" element={<PaymentCreatePage />} />
                      <Route path="financial/invoices" element={<InvoicesListPage />} />
                      <Route path="financial/invoices/create" element={<InvoiceCreatePage />} />
                      <Route path="financial/invoices/:id" element={<InvoiceDetailsPage />} />

                      {/* Reports */}
                      <Route path="reports/financial" element={<FinancialReportsPage />} />
                      <Route path="reports/daily" element={<DailyReportsPage />} />
                      <Route path="reports/technician" element={<TechnicianReportsPage />} />

                      {/* Integration */}
                      <Route path="integration/workflow" element={<WorkflowDashboardPage />} />

                      {/* Delivery - Temporarily disabled */}
                      {/* <Route path="delivery" element={<DeliveryPage />} /> */}

                      {/* Vendors & Purchase Orders */}
                      <Route path="vendors" element={<VendorsPage />} />
                      <Route path="vendors/:id" element={<VendorDetailsPage />} />
                      <Route path="purchase-orders" element={<PurchaseOrdersPage />} />

                      <Route path="settings" element={<SettingsDashboard />} />
                      <Route path="users" element={<UsersPageEnhanced />} />
                      <Route path="users-old" element={<UsersPage />} />
                      <Route path="users/new" element={<NewUserPage />} />
                      <Route path="users/:id" element={<UserDetailsPage />} />
                      <Route path="users/:id/edit" element={<EditUserPage />} />
                      {/* Technicians Management Routes */}
                      <Route path="technicians" element={<TechniciansPage />} />
                      <Route path="technicians/new" element={<TechnicianForm />} />
                      <Route path="technicians/:id" element={<TechnicianDetailsPage />} />
                      <Route path="technicians/:id/edit" element={<TechnicianForm />} />
                      <Route path="technicians/:id/analytics" element={<TechnicianAnalyticsPage />} />
                      {/* Admin / Roles & Permissions */}
                      <Route
                        path="admin/roles"
                        element={
                          <AdminRoute>
                            <RolesPermissionsPage />
                          </AdminRoute>
                        }
                      />

                      {/* Demo */}
                      <Route path="demo" element={<LayoutDemo />} />
                      <Route path="notifications-demo" element={<NotificationDemoPage />} />

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
