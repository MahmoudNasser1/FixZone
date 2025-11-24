import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode

const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (loginIdentifier, password) => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
          const AUTH_URL = API_URL.replace('/api', '') + '/api/auth';
          // Configure axios to send credentials (cookies) with every request
          axios.defaults.withCredentials = true;

          const response = await axios.post(`${AUTH_URL}/login`, {
            loginIdentifier,
            password,
          });

          // The backend now sends user info directly, not a token.
          const userData = response.data;
          
          // Ensure roleId is set for frontend (check both role and roleId)
          if (!userData.roleId && userData.role) {
            userData.roleId = userData.role;
          } else if (!userData.role && userData.roleId) {
            userData.role = userData.roleId;
          }

          set({ isAuthenticated: true, user: userData, token: null }); // Token is in httpOnly cookie
        } catch (error) {
          console.error('Login failed:', error.response ? error.response.data : error.message);
          // Optionally, you can throw the error to be caught in the component
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },

      // Restore session using /auth/me
      restoreSession: async () => {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
        const AUTH_URL = API_URL.replace('/api', '') + '/api/auth';
        try {
          axios.defaults.withCredentials = true;
          const response = await axios.get(`${AUTH_URL}/me`);
          const userData = response.data;
          
          // Ensure roleId is set for frontend (check both role and roleId)
          if (!userData.roleId && userData.role) {
            userData.roleId = userData.role;
          } else if (!userData.role && userData.roleId) {
            userData.role = userData.roleId;
          }
          
          set({ isAuthenticated: true, user: userData, token: null });
          return true;
        } catch (_e) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }
      },

      logout: async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
          const AUTH_URL = API_URL.replace('/api', '') + '/api/auth';
          axios.defaults.withCredentials = true;
          await axios.post(`${AUTH_URL}/logout`);
        } catch (_e) {}
        set({ isAuthenticated: false, user: null, token: null });
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);

// Add an interceptor to include the token in all future requests
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default useAuthStore;
