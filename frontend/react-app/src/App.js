import React from 'react';
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
import LoginPage from './pages/LoginPage';
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

// Layout Demo Page
import LayoutDemo from './pages/LayoutDemo';
import NotificationDemoPage from './pages/NotificationDemoPage';
import InventoryPage from './pages/inventory/InventoryPage';
import InventoryPageEnhanced from './pages/inventory/InventoryPageEnhanced';
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
// import { VendorsPage } from './pages/vendors';
// import { PurchaseOrdersPage } from './pages/PurchaseOrders';
import ServicesCatalogPage from './pages/services/ServicesCatalog';
import ServiceForm from './pages/services/ServiceForm';
import ServiceDetails from './pages/services/ServiceDetails';
import RolesPermissionsPage from './pages/admin/RolesPermissionsPage';

// Placeholder components removed; using real pages instead

// This component protects routes that require authentication.
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// This component handles routes that should only be accessible to unauthenticated users.
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user && (user.roleId === 1 || user.role === 'admin');
  return isAdmin ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NotificationProvider position="top-right" maxNotifications={5}>
        <SystemNotifications />
        <SettingsProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

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
                      <Route index element={<DashboardPage />} />

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
                      <Route path="inventory-old" element={<InventoryPage />} />
                      <Route path="inventory/transfer" element={<InventoryTransferPage />} />
                      <Route path="inventory/reports" element={<InventoryReportsPage />} />
                      <Route path="inventory/warehouses" element={<WarehouseManagementPage />} />
                      <Route path="inventory/stock-movements" element={<StockMovementPage />} />
                      <Route path="inventory/stock-alerts" element={<StockAlertsPage />} />
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
                      
                      {/* Vendors & Purchase Orders - Temporarily disabled */}
                      {/* <Route path="vendors" element={<VendorsPage />} /> */}
                      {/* <Route path="purchase-orders" element={<PurchaseOrdersPage />} /> */}
                      
                      <Route path="settings" element={<SystemSettingsPage />} />
                       <Route path="users" element={<UsersPageEnhanced />} />
                       <Route path="users-old" element={<UsersPage />} />
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
