import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Placeholder components for routing
const Repairs = () => <h1 className="text-2xl font-bold">Repair Tickets</h1>;
const Customers = () => <h1 className="text-2xl font-bold">Customers (CRM)</h1>;
const Inventory = () => <h1 className="text-2xl font-bold">Inventory</h1>;
const Settings = () => <h1 className="text-2xl font-bold">Settings</h1>;

function App() {
  return (
    
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </ThemeProvider>
    
  );
}

export default App;
