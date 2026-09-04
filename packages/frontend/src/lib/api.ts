import axios from 'axios';

// Use the full URL for production
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://nexlab-v2.onrender.com/api' : '/api');

console.log('📡 API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ This sends cookies with requests
  headers: { 
    'Content-Type': 'application/json',
  },
});

// Request interceptor - log requests
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    // ✅ Always send with credentials
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