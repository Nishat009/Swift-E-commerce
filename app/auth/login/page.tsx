'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ShoppingBag, ShieldCheck, Smartphone, Camera, X, User as UserIcon, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '';
  const { user, loading: authLoading, login, verify2FA, requestOTP, verifyOTP, forgotPassword, resetPassword } = useAuth();
  const toast = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//') && !redirectUrl.includes('/auth/')) {
        router.push(redirectUrl);
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router, redirectUrl]);

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setFormData((prev) => ({
      ...prev,
      email: quickEmail,
      password: quickPass,
    }));
    setErrors({});
    setLoading(true);
    try {
      const res = await login(quickEmail, quickPass, true, redirectUrl);
      if (res && res.require2FA) {
        setTwoFactorUserId(res.userId || '');
        setVerificationStep('2fa');
        toast.info('Two-Factor Authentication code required.');
      } else {
        toast.success(`Logged in as ${quickEmail.includes('admin') ? 'Administrator' : 'Test User'}!`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };
  
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

  // Forgot / Reset Password Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset' | 'success'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotTestNotice, setForgotTestNotice] = useState('');


  // QR Code Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = async () => {
    setScannerLoading(true);
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      // Wait minor tick for video element to render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Webcam access error:', err);
      toast.error('Failed to access device camera. Using simulated scanner instead.');
    } finally {
      setScannerLoading(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  };

  const handleSimulateScan = (mockCode: string) => {
    setTwoFactorCode(mockCode);
    toast.success('Successfully scanned code!');
    stopWebcam();
  };

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

    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';

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
      const nextFailCount = failedAttempts + 1;
      setFailedAttempts(nextFailCount);

      if (nextFailCount >= 3) {
        setIsLocked(true);
        setCooldown(30);
        toast.error('Too many failed attempts. Login is locked for 30 seconds.');
        
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
      toast.success('OTP sent successfully!');
      if (res && res.testOtp) {
        setTestOtpNotice(`[Test Mode] Your OTP code is: ${res.testOtp}`);
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

  // Forgot & Reset Password Handlers
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    setForgotTestNotice('');
    try {
      const res = await forgotPassword(forgotEmail);
      toast.success('Reset code sent to your email!');
      if (res && res.testOtp) {
        setForgotTestNotice(`[Test Mode] Reset code: ${res.testOtp}`);
      }
      setForgotStep('reset');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request password reset');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      toast.error('Please enter the 6-digit reset code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail, forgotOtp, newPassword);
      toast.success('Password reset successfully!');
      setForgotStep('success');
      setFormData((prev) => ({ ...prev, email: forgotEmail, password: newPassword }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. Check the code.');
    } finally {
      setForgotLoading(false);
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
              YOUR NEXT<br />ADVENTURE<br />AWAITS!
            </h1>
            <p className="text-xs sm:text-sm text-gray-200/90 max-w-sm leading-relaxed font-light">
              Log in to unlock exclusive deals, plan your dream escapes, and pick up where you left off. Whether it's mountains, beaches, or city lights.
            </p>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
              Your journey starts here.
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
                        className="w-full pl-4 pr-12 py-3 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-sm font-bold text-center tracking-widest rounded-xl animate-fade-in"
                      />
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-gray-105 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        title="Scan QR Code / Recovery Code"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
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
                        onClick={() => {
                          setForgotEmail(formData.email || '');
                          setForgotStep('request');
                          setForgotOtp('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                          setForgotTestNotice('');
                          setShowForgotModal(true);
                        }}
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

                {/* One-Click Demo Logins for Admin & Test User */}
                <div className="pt-2 border-t border-gray-150 dark:border-gray-800 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                    Quick Demo One-Click Logins
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@email.com', '12345678')}
                      disabled={loading || isLocked}
                      className="py-2.5 px-3 bg-[#8b6f47]/10 hover:bg-[#8b6f47]/20 border border-[#8b6f47]/30 text-[#8b6f47] dark:text-[#c9a96b] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('user@email.com', '12345678')}
                      disabled={loading || isLocked}
                      className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Test User Login</span>
                    </button>
                  </div>
                </div>

                {/* Google Sign-in Simulation */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      toast.info('Google Sign-In is simulated. Log in using admin@email.com or create an account.');
                    }}
                    className="w-full py-2.5 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#ea4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.87 3C6.27 7.77 8.87 5.04 12 5.04z" />
                      <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58l3.76 2.91c2.2-2.03 3.49-5.02 3.49-8.64z" />
                      <path fill="#fbbc05" d="M5.37 14.5c-.24-.72-.37-1.49-.37-2.3s.13-1.58.37-2.3L1.5 6.9C.54 8.82 0 10.97 0 13.2s.54 4.38 1.5 6.3l3.87-3z" />
                      <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.51 1.18-4.2 1.18-3.13 0-5.73-2.73-6.63-5.46L1.5 15.9C3.39 19.75 7.35 23 12 23z" />
                    </svg>
                    Sign in with Google
                  </button>

                  {/* Bottom text */}
                  <div className="text-center pt-2">
                    <span className="text-[11px] text-gray-550">
                      Don't have an account?{' '}
                      <Link 
                        href={redirectUrl ? `/auth/register?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/register'} 
                        className="text-emerald-700 hover:text-emerald-800 font-black hover:underline dark:text-emerald-500"
                      >
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
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151513] border border-gray-200 dark:border-gray-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 relative">
            <button 
              onClick={() => setShowForgotModal(false)} 
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-850 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>

            {forgotStep === 'request' && (
              <form onSubmit={handleRequestForgotOtp} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-600">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Reset Password</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the email address associated with your account and we will issue a secure 6-digit verification code.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 uppercase tracking-wider"
                >
                  {forgotLoading ? 'Sending Reset Code...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-600">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Enter Code & New Password</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Check your email (or notice below) for the 6-digit code sent to <span className="font-bold text-gray-700 dark:text-gray-300">{forgotEmail}</span>.
                  </p>
                </div>

                {forgotTestNotice && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                    💡 {forgotTestNotice}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-center tracking-widest text-sm font-bold rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 uppercase tracking-wider mt-2"
                >
                  {forgotLoading ? 'Updating Password...' : 'Save & Update Password'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold"
                  >
                    ← Back to email input
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'success' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Password Updated!</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your password has been successfully updated. You can now log in with your new credentials.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md uppercase tracking-wider"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CAMERA QR SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121210] border border-gray-200 dark:border-gray-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-6 relative">
            
            <style>{`
              @keyframes scan-laser {
                0% { top: 5%; }
                50% { top: 95%; }
                100% { top: 5%; }
              }
            `}</style>
            
            <button onClick={stopWebcam} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 text-center">
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">Camera Scanner</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Position the QR or recovery code in front of the lens.</p>
            </div>

            {/* Viewfinder camera section */}
            <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-black rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden flex items-center justify-center">
              {scannerLoading ? (
                <div className="text-white text-xs animate-pulse font-mono">Initializing camera module...</div>
              ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              )}

              {/* Scanning red laser line */}
              <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] top-0" style={{ animation: 'scan-laser 2.5s ease-in-out infinite' }} />

              {/* Viewfinder corner brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-500" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-500" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-500" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-500" />
            </div>

            {/* Simulation Helpers */}
            <div className="space-y-2 text-left">
              <span className="block text-[9px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest text-center">Simulated Auto-Scan Outputs</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateScan('123456')}
                  className="py-2 px-3 text-xs bg-gray-55 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border dark:border-gray-800 rounded-xl font-bold transition text-gray-800 dark:text-gray-200"
                >
                  Scan Code "123456"
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('RC-DEMO-CODE')}
                  className="py-2 px-3 text-xs bg-gray-55 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border dark:border-gray-800 rounded-xl font-bold transition text-gray-800 dark:text-gray-200"
                >
                  Scan Recovery Code
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={stopWebcam}
              className="w-full py-2.5 bg-gray-55 dark:bg-gray-900 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Cancel Scan
            </button>
          </div>
        </div>
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
