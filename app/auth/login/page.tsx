'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/ui/Button';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import DemoLoginButtons from '@/components/auth/DemoLoginButtons';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import { safeRedirectPath } from '@/lib/safeRedirect';
import { requiredError } from '@/lib/formValidation';
import { useLoginLockout } from '@/hooks/useLoginLockout';
import { useResetTokenModal } from '@/hooks/useResetTokenModal';

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

  const { forgotModal, openForgotModal, closeForgotModal } = useResetTokenModal();
  const { isLocked, cooldown, recordFailure, resetFailures } = useLoginLockout();

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
      resetFailures();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(recordFailure(error));
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

  const inputClass = 'h-11 w-full rounded-md border border-line bg-transparent px-3.5 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none disabled:opacity-50';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-stone-300';
  const errorClass = 'text-xs text-red-600 dark:text-red-400';
  const linkClass = 'cursor-pointer text-xs text-stone-600 underline underline-offset-4 hover:text-ink dark:text-stone-400';
  const tabClass = (active: boolean) =>
    `flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-b py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
      active ? 'border-ink text-ink' : 'border-transparent text-stone-500 hover:text-ink'
    }`;

  return (
    <AuthShell
      image="/images/dress-room/camel-wool-trench-model.jpg"
      imageAlt="Model wearing a camel wool trench coat"
      eyebrow="Welcome back"
      quote="Pick up where you left off."
    >
      {verificationStep === '2fa' ? (
        <div className="space-y-8">
          <div>
            <ShieldCheck className="mb-4 size-5 text-[#8b6f47] dark:text-[#c9a96b]" strokeWidth={1.5} />
            <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Two-factor verification</h1>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
              Enter the 6-digit code from your authenticator app, or a recovery code, to sign in.
            </p>
          </div>

          <form onSubmit={handle2FAVerify} className="space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Verification code</label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="000000 or Recovery Code"
                required
                className={`${inputClass} text-center tracking-widest`}
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="h-12 w-full">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setVerificationStep('login');
                setTwoFactorCode('');
              }}
              className={`${linkClass} block w-full text-center`}
            >
              Back to Login
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Sign in</h1>
            {isLocked ? (
              <div role="alert" className="mt-4 rounded-md border border-red-500/40 px-3.5 py-3 text-sm text-red-600 dark:text-red-400">
                Access temporarily suspended. Cooldown: {cooldown}s
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                Welcome back! Choose your preferred login method.
              </p>
            )}
            {isDemoEntry && user && (
              <p className="mt-4 rounded-md border border-line bg-surface-muted px-3.5 py-3 text-xs text-stone-600 dark:text-stone-300">
                You&apos;re signed in as <span className="font-medium text-ink">{user.email}</span>. Sign in below to switch accounts, or{' '}
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="font-medium text-ink underline underline-offset-4">
                  continue to your account
                </Link>.
              </p>
            )}
          </div>

          <div className="flex border-b border-line">
            <button
              type="button"
              onClick={() => {
                setLoginMode('password');
                setErrors({});
              }}
              disabled={isLocked}
              className={tabClass(loginMode === 'password')}
            >
              <Lock className="size-3.5" />
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('otp');
                setErrors({});
              }}
              disabled={isLocked}
              className={tabClass(loginMode === 'otp')}
            >
              <Smartphone className="size-3.5" />
              Email OTP
            </button>
          </div>

          {loginMode === 'password' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  disabled={isLocked}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={formData.showPassword ? 'text' : 'password'}
                    disabled={isLocked}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className={`${inputClass} pr-11 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                    aria-label={formData.showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-ink disabled:opacity-50"
                  >
                    {formData.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className={errorClass}>{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="size-4 rounded-sm border-line accent-[#171513] disabled:opacity-50 dark:accent-[#f5f1eb]"
                  />
                  <span className="text-xs text-stone-600 dark:text-stone-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => openForgotModal(formData.email || '')}
                  className={linkClass}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" size="lg" disabled={loading || isLocked} className="h-12 w-full">
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPVerify} className="space-y-5">
              <div className="space-y-1.5">
                <label className={labelClass}>Email address</label>
                <input
                  type="email"
                  disabled={otpSent || loading}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>

              {otpSent ? (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Enter 6-digit OTP</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className={`${inputClass} text-center tracking-widest`}
                    />
                  </div>

                  {testOtpNotice && (
                    <div className="rounded-md border border-line bg-surface-muted px-3.5 py-3 text-xs text-stone-600 dark:text-stone-300">
                      {testOtpNotice}
                    </div>
                  )}

                  <Button type="submit" size="lg" disabled={loading} className="h-12 w-full">
                    {loading ? 'Verifying OTP...' : 'Verify OTP & Login'}
                  </Button>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setTestOtpNotice('');
                      }}
                      className={linkClass}
                    >
                      Change email
                    </button>
                    <button type="button" onClick={handleSendOTP} className={linkClass}>
                      Resend OTP
                    </button>
                  </div>
                </div>
              ) : (
                <Button type="button" size="lg" onClick={handleSendOTP} disabled={loading} className="h-12 w-full">
                  {loading ? 'Sending OTP...' : 'Request OTP'}
                </Button>
              )}
            </form>
          )}

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-stone-500">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <GoogleSignIn redirectUrl={redirectUrl} rememberMe={formData.rememberMe} disabled={loading || isLocked} />
            <DemoLoginButtons disabled={loading} />

            <p className="pt-2 text-center text-sm text-stone-600 dark:text-stone-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-medium text-ink underline underline-offset-4">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      )}

      {forgotModal && (
        <ForgotPasswordModal
          initialEmail={forgotModal.email}
          initialToken={forgotModal.token}
          onClose={closeForgotModal}
          onPasswordReset={(email, password) => setFormData((prev) => ({ ...prev, email, password }))}
        />
      )}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-xs text-stone-500">Loading login...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
