'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    showPassword: false,
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
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
      await login(formData.email, formData.password);
      toast.success('Logged in successfully!');
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
                  Welcome back! Please enter your details.
                </p>
              )}
            </div>

            {/* Form */}
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
                {errors.email && <p className="text-[10px] text-red-505 font-bold">{errors.email}</p>}
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
                {errors.password && <p className="text-[10px] text-red-505 font-bold">{errors.password}</p>}
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
                <Link href="#" onClick={(e) => { e.preventDefault(); toast.info('Password reset is simulated for demo.'); }} className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline dark:text-emerald-500">
                  Forgot password
                </Link>
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
                <span className="text-[11px] text-gray-500">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-emerald-700 hover:text-emerald-800 font-black hover:underline dark:text-emerald-500">
                    Sign up
                  </Link>
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
