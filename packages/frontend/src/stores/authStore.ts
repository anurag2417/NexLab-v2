import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { IUser } from '@nexlab/shared';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<{ success: boolean }>;
  setUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (email, password) => {
        try {
          //console.log('🔐 Attempting login...');
          const response = await api.post('/auth/login', { email, password });
          //console.log('📥 Login response:', response.data);
          
          const { token, user } = response.data;
          
          //console.log('🔑 Token from response:', token ? 'Found' : 'Not found');
          
          set({ 
            user: user,
            token: token
          });
          
          //console.log('✅ User set in store:', user);
          //console.log('✅ Token set in store:', token ? 'Yes' : 'No');
          
          return { success: true };
        } catch (error: any) {
          console.error('Login error:', error);
          return { 
            success: false, 
            message: error.response?.data?.message || 'Login failed' 
          };
        }
      },

      register: async (name, email, password) => {
        try {
          //console.log('🔐 Attempting registration...');
          const response = await api.post('/auth/register', { name, email, password });
          //console.log('📥 Register response:', response.data);
          
          const { token, user } = response.data;
          
          //console.log('🔑 Token from response:', token ? 'Found' : 'Not found');
          
          set({ 
            user: user,
            token: token
          });
          
          //console.log('✅ User set in store:', user);
          //console.log('✅ Token set in store:', token ? 'Yes' : 'No');
          
          return { success: true };
        } catch (error: any) {
          console.error('Registration error:', error);
          return { 
            success: false, 
            message: error.response?.data?.message || 'Registration failed' 
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ user: null, token: null });
      },

      checkAuth: async () => {
        try {
          // Get token from store
          const token = get().token;
          //console.log('🔍 Checking auth - token in store:', token ? 'Found' : 'Not found');
          
          if (!token) {
            console.warn('⚠️ No token found in store');
            set({ isLoading: false });
            return { success: false };
          }
          
          const response = await api.get('/auth/me');
          //console.log('🔍 Auth check response:', response.data);
          
          let userData = response.data.user;
          if (userData && !userData._id && userData.id) {
            userData._id = userData.id;
          }
          
          set({ 
            user: userData,
            isLoading: false 
          });
          return { success: true };
        } catch (error: any) {
          console.error('Auth check error:', error);
          if (error.response?.status === 401) {
            set({ user: null, token: null, isLoading: false });
          } else {
            set({ isLoading: false });
          }
          return { success: false };
        }
      },

      setUser: (user) => {
        if (user && !user._id && user.id) {
          user._id = user.id;
        }
        set({ user });
      },

      setToken: (token) => {
        set({ token });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token
      }),
    }
  )
);

// Listen for global 401 events to auto-logout
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setToken(null);
  });
}