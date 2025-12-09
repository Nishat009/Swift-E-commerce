'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    showPassword: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, you would authenticate with NextAuth here
      console.log('Login successful:', formData);
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ form: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-950">
      {/* Left Panel - Premium Content */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between lg:items-start p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=1200&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SwiftCart</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Welcome back to your store
              </h1>
              <p className="text-lg text-gray-300">
                Sign in to access your account, manage orders, and track deliveries with ease.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Track Your Orders</h3>
                  <p className="text-gray-400">Monitor your purchases in real-time with live updates</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Secure & Safe</h3>
                  <p className="text-gray-400">Your information is protected with industry-leading encryption</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Personalized Experience</h3>
                  <p className="text-gray-400">Get exclusive deals and recommendations tailored for you</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-400">
          <p>© 2025 SwiftCart. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">SwiftCart</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in</h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-12">
            <h2 className="text-5xl font-serif font-bold text-gray-900 dark:text-white mb-2">Welcome Back!</h2>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username or email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder=""
                required
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-gray-400 transition text-base rounded"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={formData.showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder=""
                  required
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-gray-400 transition text-base rounded pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                >
                  {formData.showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center pt-4">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 text-gray-600 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-3 block text-base text-gray-900 dark:text-gray-300 cursor-pointer">
                Remember me
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-auto px-8 py-3 bg-amber-700 hover:bg-amber-800 text-white font-medium text-base rounded-sm transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-gray-300 dark:border-gray-700">
            <p className="text-base text-gray-700 dark:text-gray-300 mb-6">Lost your password?</p>
          </div>

          <div className="mt-8 pt-4">
            <h3 className="text-2xl font-serif text-gray-900 dark:text-white mb-6">Already have an account?</h3>
            <Link 
              href="/auth/register"
              className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium text-base rounded-sm transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

