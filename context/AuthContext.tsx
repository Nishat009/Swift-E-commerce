'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient, { setAccessToken } from '@/lib/apiClient';
import { User } from '@/types';
import { useCartStore } from '@/stores/cartStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ require2FA?: boolean; userId?: string } | void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    name: string,
    email: string,
    phone: string,
    password?: string,
    address?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string
  ) => Promise<void>;
  clearError: () => void;
  verify2FA: (userId: string, code: string, rememberMe?: boolean) => Promise<void>;
  requestOTP: (email: string) => Promise<{ testOtp?: string } | void>;
  verifyOTP: (email: string, otp: string, rememberMe?: boolean) => Promise<{ require2FA?: boolean; userId?: string } | void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initSession = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
          setAccessToken(storedToken);
        }

        const isRemembered = localStorage.getItem('rememberMe') === 'true';
        const isSessionActive = sessionStorage.getItem('session_active') === 'true';

        if (!isRemembered && !isSessionActive) {
          // No active tab session and rememberMe is false -> force logout to clear cookies
          try {
            await apiClient.post('/auth/logout');
          } catch (err) {
            console.error('Auto-logout error:', err);
          } finally {
            setAccessToken(null);
            setUser(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            useCartStore.setState({ items: [] });
            setLoading(false);
          }
        } else {
          // Session is active or user checked "Remember Me"
          // Mark session active in this tab
          sessionStorage.setItem('session_active', 'true');
          await checkSession();
        }
      } else {
        await checkSession();
      }
    };

    initSession();
  }, []);

  const checkSession = async () => {
    try {
      // Trigger profile retrieval which will hit token-refresh interceptor if access token is not set
      const response = await apiClient.get('/auth/profile');
      if (response.data?.success) {
        setUser(response.data.data.user);
        // Automatically load cart on success
        useCartStore.getState().loadCart();
      }
    } catch (err) {
      console.log('No active session.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', { email, password, rememberMe: !!rememberMe });
      if (response.data?.success) {
        if (response.data.data?.require2FA) {
          return {
            require2FA: true,
            userId: response.data.data.userId
          };
        }

        const { user: loggedInUser, accessToken, refreshToken } = response.data.data;
        setAccessToken(accessToken);
        setUser(loggedInUser);

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }

        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          sessionStorage.setItem('session_active', 'true');
        }

        // Automatically load cart on success
        await useCartStore.getState().syncGuestCart();
        await useCartStore.getState().loadCart();
        // Redirect admin users to admin panel, customers to dashboard
        if (loggedInUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      if (response.data?.success) {
        const { user: registeredUser, accessToken, refreshToken } = response.data.data;
        setAccessToken(accessToken);
        setUser(registeredUser);

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('rememberMe', 'true');
          sessionStorage.setItem('session_active', 'true');
        }

        // Automatically load cart on success
        useCartStore.getState().loadCart();
        router.push('/dashboard');
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('session_active');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      // Clear local cart storage
      useCartStore.setState({ items: [] });
      setLoading(false);
      router.push('/auth/login');
    }
  };

  const updateProfile = async (
    name: string,
    email: string,
    phone: string,
    password?: string,
    address?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = { name, email, phone, address, city, state, zipCode, country };
      if (password) {
        payload.password = password;
      }
      const response = await apiClient.put('/auth/profile', payload);
      if (response.data?.success) {
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (userId: string, code: string, rememberMe?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/verify-2fa', { userId, code, rememberMe: !!rememberMe });
      if (response.data?.success) {
        const { user: loggedInUser, accessToken, refreshToken } = response.data.data;
        setAccessToken(accessToken);
        setUser(loggedInUser);

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }

        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          sessionStorage.setItem('session_active', 'true');
        }

        useCartStore.getState().loadCart();
        if (loggedInUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(response.data?.message || 'Verification failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Verification failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/request-otp', { email });
      if (response.data?.success) {
        return {
          testOtp: response.data.data?.testOtp
        };
      } else {
        throw new Error(response.data?.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to request OTP.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string, rememberMe?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp, rememberMe: !!rememberMe });
      if (response.data?.success) {
        if (response.data.data?.require2FA) {
          return {
            require2FA: true,
            userId: response.data.data.userId
          };
        }

        const { user: loggedInUser, accessToken, refreshToken } = response.data.data;
        setAccessToken(accessToken);
        setUser(loggedInUser);

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }

        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          sessionStorage.setItem('session_active', 'true');
        }

        useCartStore.getState().loadCart();
        if (loggedInUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(response.data?.message || 'OTP verification failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
        verify2FA,
        requestOTP,
        verifyOTP,
        refreshUser: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
