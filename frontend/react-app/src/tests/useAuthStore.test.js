import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAuthStore from '../stores/authStore';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    });
    // Clear mock history
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  describe('login action', () => {
    it('should set isAuthenticated and user on successful login', async () => {
      const userData = { id: 1, name: 'Test User', role: 'admin' };
      axios.post.mockResolvedValue({ data: userData });
      
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(userData);
      expect(axios.post).toHaveBeenCalledWith('http://localhost:4000/api/auth/login', {
        loginIdentifier: 'test@example.com',
        password: 'password',
      });
    });

    it('should throw an error on failed login', async () => {
      const errorMessage = 'Invalid credentials';
      axios.post.mockRejectedValue({ response: { data: { message: errorMessage } } });
      
      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
  
  describe('logout action', () => {
    it('should reset state on logout', async () => {
      // First, set a logged-in state
      act(() => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: { id: 1, name: 'Test User' },
          token: 'fake-token'
        });
      });

      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(true);

      axios.post.mockResolvedValue({});

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(axios.post).toHaveBeenCalledWith('http://localhost:4000/api/auth/logout');
    });
  });

  describe('restoreSession action', () => {
    it('should restore session if /me endpoint returns user', async () => {
      const userData = { id: 1, name: 'Restored User', role: 'technician' };
      axios.get.mockResolvedValue({ data: userData });

      const { result } = renderHook(() => useAuthStore());
      
      let success;
      await act(async () => {
        success = await result.current.restoreSession();
      });

      expect(success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(userData);
      expect(axios.get).toHaveBeenCalledWith('http://localhost:4000/api/auth/me');
    });

    it('should not restore session if /me endpoint fails', async () => {
      axios.get.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuthStore());
      
      let success;
      await act(async () => {
        success = await result.current.restoreSession();
      });

      expect(success).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});










