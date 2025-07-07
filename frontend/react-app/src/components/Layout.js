import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-muted/40 rtl:mr-64 ltr:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
