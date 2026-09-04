import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { IUser } from '@nexlab/shared';

interface AuthState {
  user: IUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<{ success: boolean }>;
  setUser: (user: IUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const userData = response.data.user;
          if (userData && !userData._id && userData.id) {
            userData._id = userData.id;
          }
          set({ user: userData });
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
          const response = await api.post('/auth/register', { name, email, password });
          const userData = response.data.user;
          if (userData && !userData._id && userData.id) {
            userData._id = userData.id;
          }
          set({ user: userData });
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
        set({ user: null });
      },

      checkAuth: async () => {
        try {
          const response = await api.get('/auth/me');
          console.log('🔍 Auth check response:', response.data);
          
          let userData = response.data.user;
          if (userData && !userData._id && userData.id) {
            userData._id = userData.id;
          }
          
          set({ 
            user: userData, 
            isLoading: false 
          });
          return { success: true };
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, isLoading: false });
          return { success: false };
        }
      },

      setUser: (user) => {
        if (user && !user._id && user.id) {
          user._id = user.id;
        }
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user 
      }),
    }
  )
);

// Listen for global 401 events to auto-logout
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().setUser(null);
  });
}