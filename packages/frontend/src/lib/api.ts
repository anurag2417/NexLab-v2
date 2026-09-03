import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
//console.log('📡 API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 
    'Content-Type': 'application/json',
  },
});

// Request interceptor - ALWAYS add token from store
api.interceptors.request.use(
  (config) => {
    // Get token from store
    const token = useAuthStore.getState().token;
    
    //console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    //console.log('🔑 Token in store:', token ? 'Yes' : 'No');
    
    // ALWAYS add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      //console.log('✅ Added token to Authorization header');
    } else {
      console.warn('⚠️ No token found in store');
    }
    
    config.withCredentials = true;
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (res) => {
    //console.log(`✅ ${res.config.method?.toUpperCase()} ${res.config.url} - ${res.status}`);
    return res;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Only logout on 401 from non-auth endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isLoginPage = window.location.pathname === '/login';
    const isRegisterPage = window.location.pathname === '/register';
    
    if (error.response?.status === 401 && !isAuthEndpoint && !isLoginPage && !isRegisterPage) {
      console.warn('🔑 401 Unauthorized - Logging out...');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    
    return Promise.reject(error);
  }
);

export default api;