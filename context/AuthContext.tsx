'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeRedirectPath } from '@/lib/safeRedirect';
import apiClient, { setAccessToken, getAccessToken } from '@/lib/apiClient';
import { User } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { isAxiosError } from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean, redirectUrl?: string) => Promise<{ require2FA?: boolean; userId?: string } | void>;
  loginWithGoogle: (credential: string, rememberMe?: boolean, redirectUrl?: string) => Promise<{ require2FA?: boolean; userId?: string } | void>;
  demoLogin: (role: 'customer' | 'admin') => Promise<void>;
  register: (name: string, email: string, password: string, redirectUrl?: string) => Promise<void>;
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
    country?: string,
    currentPassword?: string
  ) => Promise<void>;
  clearError: () => void;
  verify2FA: (userId: string, code: string, rememberMe?: boolean, redirectUrl?: string) => Promise<void>;
  requestOTP: (email: string) => Promise<{ testOtp?: string } | void>;
  verifyOTP: (email: string, otp: string, rememberMe?: boolean, redirectUrl?: string) => Promise<{ require2FA?: boolean; userId?: string } | void>;
  requestPasswordReset: (email: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<{ testOtp?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<string>;
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
        const isRemembered = localStorage.getItem('rememberMe') === 'true';
        const isSessionActive = sessionStorage.getItem('session_active') === 'true';

        // Never signed in on this browser: stay a guest without calling the API
        if (!storedToken && !isRemembered && !isSessionActive) {
          setAccessToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (storedToken && (isRemembered || isSessionActive)) {
          setAccessToken(storedToken);
        } else {
          // A new tab, or a new browser session without "remember me": don't trust the stored
          // access token. The refresh cookie decides: it is still there for another tab of the
          // same browser session, and gone after the browser was closed.
          localStorage.removeItem('accessToken');
          setAccessToken(null);
        }
        await checkSession();
      } else {
        await checkSession();
      }
    };

    initSession();

    const onExpired = () => {
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener('auth:session-expired', onExpired);
    return () => window.removeEventListener('auth:session-expired', onExpired);
  }, []);

  const checkSession = async () => {
    try {
      // No access token yet: try the httpOnly refresh cookie before asking for the profile
      if (!getAccessToken()) {
        const refreshed = await apiClient.post('/auth/refresh');
        const token = refreshed.data?.data?.accessToken;
        if (!token) throw new Error('No session');
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
      }
      sessionStorage.setItem('session_active', 'true');
      // Trigger profile retrieval which will hit token-refresh interceptor if access token is not set
      const response = await apiClient.get('/auth/profile');
      if (response.data?.success) {
        setUser(response.data.data.user);
        // Automatically load cart on success
        useCartStore.getState().loadCart();
      }
    } catch (err) {
      // Only a rejected session signs the user out; a rate limit or network blip must not
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403 || status === undefined && !isAxiosError(err)) {
        console.log('No active session.');
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        setUser(null);
      } else {
        console.warn('Could not check the session right now:', status ?? 'network error');
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role?: string, redirectUrl?: string) => {
    const safePath = safeRedirectPath(redirectUrl);
    if (safePath) {
      router.push(safePath);
      return;
    }
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const login = async (email: string, password: string, rememberMe?: boolean, redirectUrl?: string) => {
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
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          sessionStorage.setItem('session_active', 'true');
        }

        // Automatically sync & load cart
        await useCartStore.getState().syncGuestCart();
        await useCartStore.getState().loadCart();
        
        redirectUser(loggedInUser.role, redirectUrl);
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      // Keep the HTTP status so the page can tell a lockout (429) from a wrong password (401)
      throw Object.assign(new Error(msg), {
        status: err.response?.status,
        retryAfter: Number(err.response?.data?.errors?.retryAfter) || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  // One-click demo account sign-in (only works when the backend enables it)
  const demoLogin = async (role: 'customer' | 'admin') => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/demo-login', { role });
      const { user: loggedInUser, accessToken } = response.data.data;
      setAccessToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      sessionStorage.setItem('session_active', 'true');
      setUser(loggedInUser);
      await useCartStore.getState().syncGuestCart();
      await useCartStore.getState().loadCart();
      router.push(loggedInUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const message = (isAxiosError(err) && err.response?.data?.message) ||
        (err instanceof Error ? err.message : 'Demo sign-in failed. Please try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, rememberMe = false, redirectUrl?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/google', { credential, rememberMe });
      if (!response.data?.success) throw new Error(response.data?.message || 'Google sign-in failed.');
      if (response.data.data.require2FA) {
        return { require2FA: true, userId: response.data.data.userId as string };
      }
      const { user: loggedInUser, accessToken } = response.data.data;
      setAccessToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.removeItem('refreshToken');
      if (rememberMe) localStorage.setItem('rememberMe', 'true');
      else localStorage.removeItem('rememberMe');
      sessionStorage.setItem('session_active', 'true');
      setUser(loggedInUser);
      await useCartStore.getState().syncGuestCart();
      await useCartStore.getState().loadCart();
      redirectUser(loggedInUser.role, redirectUrl);
    } catch (err: unknown) {
      const message = (isAxiosError(err) && err.response?.data?.message) ||
        (err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, redirectUrl?: string) => {
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
          localStorage.setItem('rememberMe', 'true');
          sessionStorage.setItem('session_active', 'true');
        }

        // Automatically load cart on success
        await useCartStore.getState().syncGuestCart();
        await useCartStore.getState().loadCart();
        redirectUser(registeredUser.role, redirectUrl);
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      // Show the field-level reason ("Please provide a valid email") instead of just "Validation error"
      const fieldErrors = err.response?.data?.errors;
      const detail = fieldErrors && typeof fieldErrors === 'object' && !fieldErrors.stack ? Object.values(fieldErrors).join(' ') : '';
      const msg = detail || err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    window.google?.accounts.id.disableAutoSelect();
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } catch (err) {
      console.warn('Logout request failed or backend unreachable, clearing local session:', err);
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
      useWishlistStore.getState().reset();
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
    country?: string,
    currentPassword?: string
  ) => {
    setError(null);
    try {
      const payload: any = { name, email, phone, address, city, state, zipCode, country };
      if (password) {
        payload.password = password;
      }
      if (currentPassword) {
        payload.currentPassword = currentPassword;
      }
      const response = await apiClient.put('/auth/profile', payload);
      if (response.data?.success) {
        // After a password change the server signs out other sessions and sends this one a new token
        const freshToken = response.data.data.accessToken;
        if (freshToken) {
          setAccessToken(freshToken);
          if (typeof window !== 'undefined') localStorage.setItem('accessToken', freshToken);
        }
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const verify2FA = async (userId: string, code: string, rememberMe?: boolean, redirectUrl?: string) => {
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
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          sessionStorage.setItem('session_active', 'true');
        }

        await useCartStore.getState().syncGuestCart();
        await useCartStore.getState().loadCart();
        redirectUser(loggedInUser.role, redirectUrl);
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
          testOtp: (response.data.data?.developmentCode || response.data.data?.testOtp) as string | undefined
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

  const verifyOTP = async (email: string, otp: string, rememberMe?: boolean, redirectUrl?: string) => {
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
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          sessionStorage.setItem('session_active', 'true');
        }

        await useCartStore.getState().syncGuestCart();
        await useCartStore.getState().loadCart();
        redirectUser(loggedInUser.role, redirectUrl);
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

  const requestPasswordReset = async (email: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data?.message || 'Password reset instructions sent to your email.';
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to request password reset.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return { testOtp: response.data?.data?.resetToken as string | undefined };
  };

  const resetPassword = async (_email: string, token: string, newPassword: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/reset-password', { token, newPassword });
      return response.data?.message || 'Password reset successfully.';
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password.';
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
        loginWithGoogle,
        demoLogin,
        register,
        logout,
        updateProfile,
        clearError,
        verify2FA,
        requestOTP,
        verifyOTP,
        requestPasswordReset,
        forgotPassword,
        resetPassword,
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
