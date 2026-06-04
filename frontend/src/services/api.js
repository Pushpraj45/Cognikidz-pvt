import axios from 'axios';

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'development' ? '' : 'http://localhost:8004'),
  timeout: parseInt(process.env.REACT_APP_TIMEOUT) || 30000,
  withCredentials: process.env.REACT_APP_WITH_CREDENTIALS === 'true',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Enhanced request interceptor with better logging
api.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Enhanced logging for debugging
    console.log('🌐 API Request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasAuth: !!config.headers.Authorization,
      authPreview: config.headers.Authorization
        ? `Bearer ${config.headers.Authorization.split(' ')[1]?.substring(0, 20)}...`
        : 'None',
    });

    return config;
  },
  error => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with detailed error handling
api.interceptors.response.use(
  response => {
    console.log('✅ API Success:', {
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      status: response.status,
      dataType: typeof response.data,
      hasData: !!response.data,
    });

    return response;
  },
  error => {
    // Enhanced error logging
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.log('🔒 API: Unauthorized - redirecting to login');
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user');

      // Redirect to login only if not already on auth pages
      const currentPath = window.location.pathname;
      if (
        !currentPath.includes('/login') &&
        !currentPath.includes('/signup') &&
        !currentPath.includes('/forgot-password') &&
        !currentPath.includes('/reset-password')
      ) {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 500) {
      console.log('🔥 API: Server error');

      // Log specific Google OAuth errors
      if (
        error.config?.url?.includes('/auth/google') ||
        error.response?.data?.message?.includes('google')
      ) {
        console.error('🔍 Google OAuth Error Details:', {
          endpoint: error.config?.url,
          errorMessage: error.response?.data?.message,
          errorType: error.response?.data?.errorType,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (error.response?.status === 403) {
      console.log('🚫 API: Forbidden - insufficient permissions');
    }

    if (error.response?.status === 429) {
      console.log('⏰ API: Rate limited - too many requests');
    }

    if (!error.response) {
      console.log('📡 API: Network error - no response received');
      console.error('Network Error Details:', {
        code: error.code,
        message: error.message,
        isTimeout: error.code === 'ECONNABORTED',
        isNetworkError: error.code === 'ERR_NETWORK',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
