import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import useAuthStore from '../stores/authStore';

// Mock the auth store
vi.mock('../stores/authStore');

// A simple component to render on the protected route
const ProtectedComponent = () => <div>Protected Content</div>;
// A simple component for the login page
const LoginComponent = () => <div>Login Page</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the protected component if user is authenticated', () => {
    // Mock the store to return an authenticated state
    useAuthStore.mockReturnValue({ isAuthenticated: true, user: { role: 'admin' } });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should redirect to the login page if user is not authenticated', () => {
    // Mock the store to return a non-authenticated state
    useAuthStore.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  it('should allow access if user has one of the required roles', () => {
    useAuthStore.mockReturnValue({ isAuthenticated: true, user: { role: 'editor' } });

    render(
      <MemoryRouter initialEntries={['/protected-with-roles']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route 
            path="/protected-with-roles" 
            element={
              <ProtectedRoute roles={['admin', 'editor']}>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect if user does not have the required role', () => {
    useAuthStore.mockReturnValue({ isAuthenticated: true, user: { role: 'viewer' } });

    render(
      <MemoryRouter initialEntries={['/protected-with-roles']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route 
            path="/protected-with-roles" 
            element={
              <ProtectedRoute roles={['admin', 'editor']}>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Assuming it redirects to /login or a generic unauthorized page. Let's assume /login for now.
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

