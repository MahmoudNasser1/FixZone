import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PageTransition from '../ui/PageTransition';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';

const MainLayout = ({
  showBreadcrumb = true,
  breadcrumbItems = null,
  pageTitle = null,
  pageActions = null
}) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const roleId = user?.roleId || user?.role;
  const isCustomer = isCustomerRole(Number(roleId)) || user?.type === 'customer';
  // Only hide sidebar for /customer/* routes (customer portal), not /customers/* (admin customer management)
  const isCustomerRoute = location.pathname.startsWith('/customer/') || location.pathname === '/customer';

  // Hide Sidebar for customer portal routes only, not admin customer management
  const showSidebar = !isCustomer && !isCustomerRoute;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop and Mobile Drawer */}
      {showSidebar && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto h-full">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

// مكون مبسط للصفحات العادية
export const SimpleLayout = ({ children, title, actions }) => {
  return (
    <MainLayout
      pageTitle={title}
      pageActions={actions}
      showBreadcrumb={true}
    >
      {children}
    </MainLayout>
  );
};

// مكون للصفحات بدون breadcrumb
export const CleanLayout = ({ children }) => {
  return (
    <MainLayout showBreadcrumb={false}>
      {children}
    </MainLayout>
  );
};

export default MainLayout;
