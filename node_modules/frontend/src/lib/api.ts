import axios from 'axios';

// Get the correct API URL
const API_URL = import.meta.env.VITE_API_URL || '/api';
console.log('📡 API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Always add withCredentials
    config.withCredentials = true;
    
    // Try to get token from cookie for Authorization header
    const cookies = document.cookie.split(';');
    let token = '';
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'token') {
        token = value;
        break;
      }
    }
    
    // If token exists, add to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added token to Authorization header');
    }
    
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    console.log('🍪 Cookie header:', document.cookie);
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
    console.log(`✅ ${res.config.method?.toUpperCase()} ${res.config.url} - ${res.status}`);
    return res;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

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