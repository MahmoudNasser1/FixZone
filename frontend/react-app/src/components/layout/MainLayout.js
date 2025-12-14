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
    <div className="flex h-screen bg-background text-foreground">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        {/* منطقة المحتوى الرئيسية */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* المحتوى */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-6">
            <div className="max-w-7xl mx-auto">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
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
