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
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,

      login: async (email, password) => {
        try {
          const res = await api.post('/auth/login', { email, password });
          set({ user: res.data.user });
          return { success: true };
        } catch (e: any) {
          return { success: false, message: e.response?.data?.message || 'Login failed' };
        }
      },

      register: async (name, email, password) => {
        try {
          const res = await api.post('/auth/register', { name, email, password });
          set({ user: res.data.user });
          return { success: true };
        } catch (e: any) {
          return { success: false, message: e.response?.data?.message || 'Registration failed' };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (e) { /* ignore */ }
        set({ user: null });
      },

      checkAuth: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.user, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user, never token!
    }
  )
);

// Handle global 401 events
window.addEventListener('auth:unauthorized', () => {
  useAuthStore.setState({ user: null });
});