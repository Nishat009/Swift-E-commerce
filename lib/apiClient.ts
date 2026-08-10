import axios from 'axios';

let accessToken: string | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending/receiving HTTP-Only cookies (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    let token = accessToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken');
    }
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto refresh access token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle Network / Connection Offline Errors gracefully with standard fallback responses
    if (!error.response || error.code === 'ERR_NETWORK') {
      const url = originalRequest.url || '';
      if (url.includes('/currencies')) {
        return {
          data: {
            success: true,
            data: [
              { code: 'USD', symbol: '$', rate: 1.0 },
              { code: 'EUR', symbol: '€', rate: 0.92 },
              { code: 'GBP', symbol: '£', rate: 0.78 },
              { code: 'BDT', symbol: '৳', rate: 118.0 }
            ]
          }
        };
      }
      if (url.includes('/languages')) {
        return {
          data: {
            success: true,
            data: [
              { code: 'en', name: 'English', flag: '🇬🇧', isDefault: true, isActive: true },
              { code: 'bn', name: 'Bengali', flag: '🇧🇩', isDefault: false, isActive: true }
            ]
          }
        };
      }
      if (url.includes('/categories')) {
        return {
          data: {
            success: true,
            data: ['Fashion', 'Electronics', 'Footwear', 'Accessories', 'Luxury', 'Home']
          }
        };
      }
      if (url.includes('/notifications/unread-count')) {
        return { data: { success: true, data: { count: 0 } } };
      }
      if (url.includes('/notifications')) {
        return { data: { success: true, data: [] } };
      }
      return Promise.reject(error);
    }
    
    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid refreshing on login/register/logout failures or loops
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/logout')
      ) {
        return Promise.reject(error);
      }

      // Check if we have any cached credentials (if not, it's a guest user -> do not refresh)
      let hasCredentials = false;
      if (typeof window !== 'undefined') {
        hasCredentials = !!(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
      }
      
      if (!hasCredentials) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let rToken = null;
        if (typeof window !== 'undefined') {
          rToken = localStorage.getItem('refreshToken');
        }

        // Call refresh endpoint to get new access token (pass refreshToken in body as fallback)
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken: rToken },
          { withCredentials: true }
        );

        const newAccessToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken;
        
        setAccessToken(newAccessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
        }
        
        isRefreshing = false;
        onRefreshed(newAccessToken);

        // Retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          console.warn('Session expired. Please log in again.');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
