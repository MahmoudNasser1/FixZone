import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // user is not authenticated, redirect to login page
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default ProtectedRoute;
