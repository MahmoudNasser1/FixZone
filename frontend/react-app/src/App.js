import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

// Core App Utilities
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/Toaster';
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

// Layout Demo Page
import LayoutDemo from './pages/LayoutDemo';

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
          path="/*" // All other routes are handled here
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/*" element={<MainLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="repairs" element={<RepairsPage />} />
                <Route path="repairs/new" element={<NewRepairPage />} />
                  
                  {/* Customer Routes */}
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="customers/new" element={<NewCustomerPage />} />
                  <Route path="customers/:id" element={<CustomerDetailsPage />} />
                  <Route path="customers/:id/edit" element={<EditCustomerPage />} />
                  
                  {/* Company Routes */}
                  <Route path="companies" element={<CompaniesPage />} />
                  <Route path="companies/new" element={<NewCompanyPage />} />
                  
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  
                  {/* Demo Route */}
                  <Route path="demo" element={<LayoutDemo />} />
                  
                  <Route path="*" element={<Navigate to="/" replace />} /> {/* Fallback for unknown protected routes */}
                </Route>
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
