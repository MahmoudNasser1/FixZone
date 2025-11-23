import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

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
import RepairPrintPage from './pages/repairs/RepairPrintPage';
import RepairQRPrintPage from './pages/repairs/RepairQRPrintPage';
import { SettingsProvider } from './context/SettingsContext';
import SystemSettingsPage from './pages/settings/SystemSettingsPage';
import UsersPage from './pages/users/UsersPage';
import UsersPageEnhanced from './pages/users/UsersPageEnhanced';
import UserDetailsPage from './pages/users/UserDetailsPage';
import EditUserPage from './pages/users/EditUserPage';

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

// Integration Pages
import WorkflowDashboardPage from './pages/integration/WorkflowDashboardPage';

import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailsPage from './pages/invoices/InvoiceDetailsPage';
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

// Quotations Pages
import { QuotationsPage } from './pages/quotations';

// Customer Portal Pages
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';

// Technician Portal Pages
import { TechnicianDashboard, JobsListPage, JobDetailsPage } from './pages/technician';

// Debug Page
import DebugPage from './pages/DebugPage';

// Placeholder components removed; using real pages instead

// This component protects routes that require authentication.
// Also redirects customers away from admin pages
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is customer
  const roleId = user?.roleId || user?.role;
  const isCustomer = roleId === 8 || roleId === '8' || user?.type === 'customer';
  const isTechnician = roleId === 3 || roleId === '3';

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
  const isCustomer = user && (user.type === 'customer' || user.roleId === 8 || user.role === 8);
  return isAuthenticated && isCustomer ? children : <Navigate to="/customer/login" replace />;
};

// Technician route wrapper - checks if user is technician
const TechnicianRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const roleId = user?.roleId || user?.role;
  const isTechnician = user && (roleId === 3 || roleId === '3');

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
  const isCustomer = user && (user.type === 'customer' || roleId === 8 || roleId === '8');

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is customer - redirect to customer dashboard
  const isCustomer = roleId === 8 || user?.type === 'customer';
  if (isCustomer) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // Check if user is admin
  const isAdmin = roleId === 1 || roleId === '1' || user?.role === 1 || user?.role === 'admin';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  // Restore session from httpOnly cookie on app load
  useEffect(() => {
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
                  <Routes>
                    <Route path="dashboard" element={<CustomerDashboard />} />
                    <Route path="repairs" element={<div>Customer Repairs Page (Coming Soon)</div>} />
                    <Route path="repairs/:id" element={<div>Customer Repair Details (Coming Soon)</div>} />
                    <Route path="invoices" element={<div>Customer Invoices Page (Coming Soon)</div>} />
                    <Route path="invoices/:id" element={<div>Customer Invoice Details (Coming Soon)</div>} />
                    <Route path="devices" element={<div>Customer Devices Page (Coming Soon)</div>} />
                    <Route path="*" element={<Navigate to="/customer/dashboard" replace />} />
                  </Routes>
                </CustomerRoute>
              }
            />

            {/* Technician Portal Routes */}
            <Route
              path="/tech/*"
              element={
                <TechnicianRoute>
                  <Routes>
                    <Route path="dashboard" element={<TechnicianDashboard />} />
                    <Route path="jobs" element={<JobsListPage />} />
                    <Route path="jobs/:id" element={<JobDetailsPage />} />
                    <Route path="profile" element={<div>Technician Profile (Coming Soon)</div>} />
                    <Route path="*" element={<Navigate to="/tech/dashboard" replace />} />
                  </Routes>
                </TechnicianRoute>
              }
            />

            {/* Staff/Admin Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    {/* Public routes outside layout */}
                    <Route path="track" element={<PublicRepairTrackingPage />} />

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
                      <Route path="invoices/:id" element={<InvoiceDetailsPage />} />
                      {/* Payments */}
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="payments/new" element={<CreatePaymentPage />} />
                      <Route path="payments/:id" element={<PaymentDetailsPage />} />
                      <Route path="payments/:id/edit" element={<EditPaymentPage />} />
                      <Route path="payments/reports" element={<PaymentReportsPage />} />
                      <Route path="payments/overdue" element={<OverduePaymentsPage />} />

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

                      <Route path="settings" element={<SystemSettingsPage />} />
                      <Route path="users" element={<UsersPageEnhanced />} />
                      <Route path="users-old" element={<UsersPage />} />
                      <Route path="users/:id" element={<UserDetailsPage />} />
                      <Route path="users/:id/edit" element={<EditUserPage />} />
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
