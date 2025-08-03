import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumb from './Breadcrumb';

const MainLayout = ({ 
  children, 
  showBreadcrumb = true, 
  breadcrumbItems = null,
  pageTitle = null,
  pageActions = null 
}) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        
        {/* منطقة المحتوى الرئيسية */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* شريط التنقل والعنوان */}
          {(showBreadcrumb || pageTitle || pageActions) && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-2">
                  {showBreadcrumb && (
                    <Breadcrumb items={breadcrumbItems} />
                  )}
                  {pageTitle && (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {pageTitle}
                    </h1>
                  )}
                </div>
                {pageActions && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {pageActions}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* المحتوى */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
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
