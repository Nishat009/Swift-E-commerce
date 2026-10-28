'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ShoppingBag, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import DemoLoginButtons from '@/components/auth/DemoLoginButtons';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import { safeRedirectPath } from '@/lib/safeRedirect';
import { requiredError } from '@/lib/formValidation';

// The backend only returns dev codes when ALLOW_DEV_AUTH_CODES is on outside production;
// a production build never shows them either way.
const SHOW_DEV_CODES = process.env.NODE_ENV !== 'production';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '';
  const { user, loading: authLoading, login, verify2FA, requestOTP, verifyOTP } = useAuth();
  const toast = useToast();

  // Arriving from the landing page's customer demo login links: stay here so the demo logins are visible
  const isDemoEntry = searchParams?.get('demo') === '1';

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && !isDemoEntry) {
      const safePath = safeRedirectPath(redirectUrl);
      if (safePath) {
        router.push(safePath);
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router, redirectUrl, isDemoEntry]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    showPassword: false,
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Custom auth modes & states
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [verificationStep, setVerificationStep] = useState<'login' | '2fa'>('login');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorUserId, setTwoFactorUserId] = useState('');
  const [testOtpNotice, setTestOtpNotice] = useState('');

  // Forgot / reset password modal: null when closed, otherwise what it opens with.
  // Arriving from the emailed reset link opens it on the new-password step.
  const [forgotModal, setForgotModal] = useState<{ email: string; token: string } | null>(() => {
    const resetToken = searchParams?.get('resetToken') || '';
    return resetToken ? { email: '', token: resetToken } : null;
  });

  // Enterprise account lock simulation state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('Account is temporarily locked. Please try again later.');
      return;
    }

    setErrors({});
    setLoading(true);

    const fieldErrors: Record<string, string> = {
      email: requiredError(formData.email, 'Email'),
      password: requiredError(formData.password, 'Password'),
    };
    const newErrors = Object.fromEntries(Object.entries(fieldErrors).filter(([, message]) => message));

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await login(formData.email, formData.password, formData.rememberMe, redirectUrl);
      if (res && res.require2FA) {
        setTwoFactorUserId(res.userId || '');
        setVerificationStep('2fa');
        toast.info('Two-Factor Authentication code required.');
      } else {
        toast.success('Logged in successfully!');
      }
      setFailedAttempts(0);
    } catch (error: any) {
      console.error('Login error:', error);
      // The server is the source of truth for lockouts (429 + retryAfter seconds)
      const serverLocked = error.status === 429;
      const nextFailCount = serverLocked ? 3 : failedAttempts + 1;
      setFailedAttempts(nextFailCount);

      if (nextFailCount >= 3) {
        const seconds = serverLocked && error.retryAfter ? error.retryAfter : 30;
        setIsLocked(true);
        setCooldown(seconds);
        toast.error(serverLocked ? error.message : `Too many failed attempts. Login is locked for ${seconds} seconds.`);

        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              setIsLocked(false);
              setFailedAttempts(0);
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(`Invalid email or password. Attempt ${nextFailCount}/3 before lockout.`);
      }

      setErrors({ form: error.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      toast.error('Verification code is required');
      return;
    }
    setLoading(true);
    try {
      await verify2FA(twoFactorUserId, twoFactorCode, formData.rememberMe, redirectUrl);
      toast.success('Authenticated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required to request OTP' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await requestOTP(formData.email);
      setOtpSent(true);
      toast.success('If an eligible account exists, a login code has been emailed to you.');
      if (SHOW_DEV_CODES && res && res.testOtp) {
        setTestOtpNotice(`[Dev mode] Login code: ${res.testOtp}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error('OTP code is required');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOTP(formData.email, otpCode, formData.rememberMe, redirectUrl);
      if (res && res.require2FA) {
        setTwoFactorUserId(res.userId || '');
        setVerificationStep('2fa');
        toast.info('Two-Factor Authentication code required.');
      } else {
        toast.success('Logged in successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8" 
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)'
      }}
    >
      {/* Outer Card Container */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#151513] rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-100 dark:border-gray-800/60 min-h-[620px]">
        
        {/* Left Side: Premium Ocean Theme Image Panel */}
        <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full flex flex-col justify-between p-8 sm:p-12 text-white overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80")'
          }}
        >
          {/* Overlay to create deep oceanic marble/emerald contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-teal-950/40 via-teal-900/60 to-slate-950/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/70 via-transparent to-transparent" />
          
          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-black tracking-widest text-sm uppercase">SwiftCart</span>
          </div>

          {/* Heading Text Content */}
          <div className="relative z-10 mt-24 md:mt-auto space-y-4">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-black leading-[1.1] tracking-tight uppercase">
              WELCOME<br />BACK TO<br />SWIFTCART
            </h1>
            <p className="text-xs sm:text-sm text-gray-200/90 max-w-sm leading-relaxed font-light">
              Log in to track your orders, manage your wishlist, and pick up where you left off.
            </p>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
              Fashion and home, all in one place.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Form Panel */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-[#121210]">
          <div className="max-w-md w-full mx-auto space-y-8">
            
            {verificationStep === '2fa' ? (
              /* Two-Factor Authentication Verification View */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#8b6f47]/20">
                    <ShieldCheck className="w-8 h-8 text-[#8b6f47] dark:text-[#c9a96b]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    2FA Verification
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    Please enter the 6-digit code generated by your authenticator app, or a recovery code to log in.
                  </p>
                </div>

                <form onSubmit={handle2FAVerify} className="space-y-5">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-300 uppercase tracking-wide">
                      Verification Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="000000 or Recovery Code"
                        required
                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-sm font-bold text-center tracking-widest rounded-xl animate-fade-in"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 mt-4 uppercase tracking-wider"
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationStep('login');
                      setTwoFactorCode('');
                    }}
                    className="w-full py-2.5 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold text-xs rounded-xl transition text-center border border-gray-200 dark:border-gray-850"
                  >
                    Back to Login
                  </button>
                </form>
              </div>
            ) : (
              /* Regular Login View (Password or OTP) */
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    WELCOME BACK !
                  </h2>
                  {isLocked ? (
                    <div className="mt-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold animate-pulse">
                      ⛔ Access Temporarily Suspended. Cooldown: {cooldown}s
                    </div>
                  ) : (
                    <p className="text-xs text-gray-455 mt-2">
                      Welcome back! Choose your preferred login method.
                    </p>
                  )}
                  {isDemoEntry && user && (
                    <p className="mt-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-gray-600 dark:text-gray-300">
                      You&apos;re signed in as <span className="font-bold">{user.email}</span>. Sign in below to switch accounts, or{' '}
                      <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-emerald-700 font-bold hover:underline dark:text-emerald-500">
                        continue to your account
                      </Link>.
                    </p>
                  )}
                </div>

                {/* Login Method Tabs */}
                <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-950 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-850">
                  <button
                    onClick={() => {
                      setLoginMode('password');
                      setErrors({});
                    }}
                    disabled={isLocked}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      loginMode === 'password'
                        ? 'bg-[#0a3d4a] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Password
                  </button>
                  <button
                    onClick={() => {
                      setLoginMode('otp');
                      setErrors({});
                    }}
                    disabled={isLocked}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      loginMode === 'otp'
                        ? 'bg-[#0a3d4a] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Email OTP
                  </button>
                </div>

                {loginMode === 'password' ? (
                  /* Password Login Form */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled={isLocked}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter your email"
                          required
                          className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl disabled:opacity-50"
                        />
                      </div>
                      {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={formData.showPassword ? "text" : "password"}
                          disabled={isLocked}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl pr-10 disabled:opacity-50"
                        />
                        <button 
                          type="button"
                          disabled={isLocked}
                          onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                          className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                        >
                          {formData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-[10px] text-red-500 font-bold">{errors.password}</p>}
                    </div>

                    {/* Extra Row: Remember me / Forgot password */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isLocked}
                          checked={formData.rememberMe}
                          onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500/30 dark:bg-gray-900 dark:border-gray-800 disabled:opacity-50"
                        />
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotModal({ email: formData.email || '', token: '' })}
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline dark:text-emerald-500"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit / Sign in */}
                    <button 
                      type="submit" 
                      disabled={loading || isLocked}
                      className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                  </form>
                ) : (
                  /* OTP Login Form */
                  <form onSubmit={handleOTPVerify} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled={otpSent || loading}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter your email"
                          required
                          className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl disabled:opacity-50"
                        />
                      </div>
                      {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email}</p>}
                    </div>

                    {otpSent ? (
                      /* Render OTP validation code inputs */
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                            Enter 6-Digit OTP
                          </label>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-center tracking-widest text-sm font-bold rounded-xl"
                          />
                        </div>

                        {testOtpNotice && (
                          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold leading-normal">
                            💡 {testOtpNotice}
                          </div>
                        )}

                        <button 
                          type="submit" 
                          disabled={loading}
                          className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 uppercase tracking-wider"
                        >
                          {loading ? 'Verifying OTP...' : 'Verify OTP & Login'}
                        </button>

                        <div className="flex justify-between text-[11px] pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode('');
                              setTestOtpNotice('');
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold"
                          >
                            Change Email
                          </button>
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline dark:text-emerald-500"
                          >
                            Resend OTP
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Request OTP button */
                      <button 
                        type="button" 
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 mt-2 uppercase tracking-wider"
                      >
                        {loading ? 'Sending OTP...' : 'Request OTP'}
                      </button>
                    )}
                  </form>
                )}

                {/* Google Sign-in */}
                <div className="space-y-4">
                  <GoogleSignIn redirectUrl={redirectUrl} rememberMe={formData.rememberMe} disabled={loading || isLocked} />
                  <DemoLoginButtons disabled={loading} />

                  {/* Bottom text */}
                  <div className="text-center pt-2">
                    <span className="text-[11px] text-gray-550">
                      Don&apos;t have an account?{' '}
                      <Link href="/auth/register" className="text-emerald-700 hover:text-emerald-800 font-black hover:underline dark:text-emerald-500">
                        Sign up
                      </Link>
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* FORGOT & RESET PASSWORD MODAL */}
      {forgotModal && (
        <ForgotPasswordModal
          initialEmail={forgotModal.email}
          initialToken={forgotModal.token}
          onClose={() => setForgotModal(null)}
          onPasswordReset={(email, password) => setFormData((prev) => ({ ...prev, email, password }))}
        />
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">Loading login...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
