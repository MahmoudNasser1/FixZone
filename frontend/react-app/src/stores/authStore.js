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
          const API_URL = 'http://localhost:3000/api/auth';
          // Configure axios to send credentials (cookies) with every request
          axios.defaults.withCredentials = true;

          const response = await axios.post(`${API_URL}/login`, {
            loginIdentifier,
            password,
          });

          // The backend now sends user info directly, not a token.
          const userData = response.data;

          set({ isAuthenticated: true, user: userData, token: null }); // Token is in httpOnly cookie
        } catch (error) {
          console.error('Login failed:', error.response ? error.response.data : error.message);
          // Optionally, you can throw the error to be caught in the component
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
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
