'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { safeRedirectPath } from '@/lib/safeRedirect';
import { requiredError, newPasswordError, passwordMatchError } from '@/lib/formValidation';
import { useToast } from '@/context/ToastContext';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/ui/Button';
import GoogleSignIn from '@/components/auth/GoogleSignIn';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '';
  const { user, loading: authLoading, register } = useAuth();
  const toast = useToast();
  
  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const safePath = safeRedirectPath(redirectUrl);
      if (safePath) {
        router.push(safePath);
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router, redirectUrl]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    agreeTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-stone-200', width: '0%', score: 0 };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%', score };
    if (score === 2) return { label: 'Medium', color: 'bg-stone-400', width: '50%', score };
    if (score === 3) return { label: 'Strong', color: 'bg-stone-600 dark:bg-stone-300', width: '75%', score };
    return { label: 'Excellent', color: 'bg-ink', width: '100%', score };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    const fieldErrors: Record<string, string> = {
      name: requiredError(formData.name, 'Name'),
      email: requiredError(formData.email, 'Email'),
      password: newPasswordError(formData.password),
      confirmPassword: passwordMatchError(formData.password, formData.confirmPassword),
      agreeTerms: formData.agreeTerms ? '' : 'You must agree to the Terms & Conditions',
    };
    const newErrors = Object.fromEntries(Object.entries(fieldErrors).filter(([, message]) => message));

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password, redirectUrl);
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'An error occurred during registration. Please try again.');
      setErrors({ form: error.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'h-11 w-full rounded-md border border-line bg-transparent px-3.5 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-stone-300';
  const errorClass = 'text-xs text-red-600 dark:text-red-400';
  const eyeClass = 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-ink';

  return (
    <AuthShell
      image="/hero-atelier-portrait.webp"
      imageAlt="Model in an atelier"
      eyebrow="Create an account"
      quote="Your next favourite piece is a few clicks away."
    >
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Create account</h1>
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            Join us today! Please enter your details to register.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Full name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              required
              className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Email</label>
            <input
              type="email"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className={`${inputClass} pr-11 ${errors.password ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                aria-label={formData.showPassword ? 'Hide password' : 'Show password'}
                className={eyeClass}
              >
                {formData.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Password strength</span>
                  <span className="font-medium text-ink">{strength.label}</span>
                </div>
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                  <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                </div>
              </div>
            )}
            {errors.password && <p className={errorClass}>{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Confirm password</label>
            <div className="relative">
              <input
                type={formData.showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                className={`${inputClass} pr-11 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                aria-label={formData.showConfirmPassword ? 'Hide password' : 'Show password'}
                className={eyeClass}
              >
                {formData.showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={formData.agreeTerms}
              onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
              className="mt-0.5 size-4 cursor-pointer rounded-sm border-line accent-[#171513] dark:accent-[#f5f1eb]"
            />
            <label htmlFor="agreeTerms" className="cursor-pointer text-xs text-stone-600 dark:text-stone-400">
              I agree to the <Link href="/terms" target="_blank" className="font-medium text-ink underline underline-offset-4">Terms &amp; Conditions</Link> of this store.
            </label>
          </div>
          {errors.agreeTerms && <p className={errorClass}>{errors.agreeTerms}</p>}

          <Button type="submit" size="lg" disabled={loading} className="mt-2 h-12 w-full">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-stone-500">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleSignIn mode="signup" redirectUrl={redirectUrl} rememberMe={true} disabled={loading || !formData.agreeTerms} />
          {!formData.agreeTerms && <p className="text-center text-xs text-stone-500">Accept the Terms &amp; Conditions above to continue with Google.</p>}

          <p className="pt-2 text-center text-sm text-stone-600 dark:text-stone-400">
            Already have an account?{' '}
            <Link
              href={redirectUrl ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/login'}
              className="font-medium text-ink underline underline-offset-4"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-xs text-stone-500">Loading registration...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
