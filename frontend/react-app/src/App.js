import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

// Core App Utilities
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/Toaster';
import { NotificationProvider } from './components/notifications/NotificationSystem';
import SystemNotifications from './components/notifications/SystemNotifications';
import './App.css';

// Layout and Route Protection
import MainLayout from './components/layout/MainLayout';

// Pages and Components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; // Using the new DashboardPage
import PaymentsPage from './pages/payments/PaymentsPage';

// Customer Pages
import { CustomersPage, NewCustomerPage } from './pages/customers';
import CustomerDetailsPage from './pages/customers/CustomerDetailsPage';
import EditCustomerPage from './pages/customers/EditCustomerPage';

// Company Pages
import { CompaniesPage, NewCompanyPage } from './pages/companies';

// Repair Pages
import { RepairsPage } from './pages/repairs';
import NewRepairPage from './pages/repairs/NewRepairPage';
import RepairDetailsPage from './pages/repairs/RepairDetailsPage';
import RepairPrintPage from './pages/repairs/RepairPrintPage';
import RepairQRPrintPage from './pages/repairs/RepairQRPrintPage';
import { SettingsProvider } from './context/SettingsContext';
import SystemSettingsPage from './pages/settings/SystemSettingsPage';

// Layout Demo Page
import LayoutDemo from './pages/LayoutDemo';
import NotificationDemoPage from './pages/NotificationDemoPage';

// Placeholder components for routing
const Repairs = () => <h1 className="text-2xl font-bold">Repair Tickets</h1>;
const Inventory = () => <h1 className="text-2xl font-bold">Inventory</h1>;
const Settings = () => <h1 className="text-2xl font-bold">Settings</h1>;

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
                    {/* Print routes outside layout to produce clean print pages */}
                    <Route path="repairs/:id/print" element={<RepairPrintPage />} />
                    <Route path="repairs/:id/print-qr" element={<RepairQRPrintPage />} />

                    {/* App routes under main layout */}
                    <Route path="/*" element={<MainLayout />}>
                      <Route index element={<DashboardPage />} />

                      {/* Repairs */}
                      <Route path="repairs" element={<RepairsPage />} />
                      <Route path="repairs/new" element={<NewRepairPage />} />
                      <Route path="repairs/:id" element={<RepairDetailsPage />} />

                      {/* Customers */}
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="customers/new" element={<NewCustomerPage />} />
                      <Route path="customers/:id" element={<CustomerDetailsPage />} />
                      <Route path="customers/:id/edit" element={<EditCustomerPage />} />

                      {/* Companies */}
                      <Route path="companies" element={<CompaniesPage />} />
                      <Route path="companies/new" element={<NewCompanyPage />} />

                      {/* Inventory, Settings, Payments */}
                      <Route path="inventory" element={<Inventory />} />
                      <Route path="settings" element={<SystemSettingsPage />} />
                      <Route path="payments" element={<PaymentsPage />} />

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
