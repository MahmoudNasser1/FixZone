import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import MainLayout from '../layout/MainLayout';

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the main layout which in turn renders the child route
  return <MainLayout />;
};

export default ProtectedRoute;
