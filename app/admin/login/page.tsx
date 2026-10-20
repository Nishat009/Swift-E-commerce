'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Eye, EyeOff, Megaphone, Package, ShieldCheck, ShoppingBag, User as UserIcon, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useDemoAccess, DemoRole } from '@/components/auth/DemoLoginButtons';

const HIGHLIGHTS = [
  { icon: BarChart3, label: 'Live sales dashboard and reports' },
  { icon: Package, label: 'Products, categories, stock and coupons' },
  { icon: ShoppingBag, label: 'Orders, refunds and customer accounts' },
  { icon: Megaphone, label: 'Lucky-draw campaigns and newsletters' },
  { icon: Wallet, label: 'Store wallet, payments and audit logs' },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading, login, demoLogin } = useAuth();
  const { roles, credentials } = useDemoAccess();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'form' | DemoRole | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user, authLoading, router]);

  const adminCredential = credentials.find((c) => c.role === 'admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('form');
    setError('');
    try {
      const res = await login(email.trim(), password, false, '/admin');
      if (res?.require2FA) {
        setError('This account uses two-factor authentication. Sign in from the main login page.');
      }
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed.');
    } finally {
      setBusy(null);
    }
  };

  const signInDemo = async (role: DemoRole) => {
    setBusy(role);
    setError('');
    try {
      await demoLogin(role);
      toast.success(role === 'admin' ? 'Signed in as the demo admin.' : 'Signed in as a guest shopper.');
    } catch (err: any) {
      setError(err?.message || 'Demo sign-in failed.');
    } finally {
      setBusy(null);
    }
  };

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#8b6f47] focus:outline-none focus:ring-1 focus:ring-[#8b6f47]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-white';

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#17110f] p-12 text-[#f8f1e8] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(201,169,107,0.25),transparent_55%)]" aria-hidden="true" />
        <Link href="/" className="relative font-serif text-2xl font-extrabold uppercase tracking-widest text-[#c9a96b]">
          SwiftCart
        </Link>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#c9a96b]">Admin panel</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight">Run the whole store from one place.</h1>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-[#e8dccb]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-4 w-4 text-[#c9a96b]" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-[#a89b8a]">© {new Date().getFullYear()} SwiftCart</p>
      </aside>

      <main className="flex items-center justify-center bg-[#faf9f6] px-4 py-12 dark:bg-gray-950">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>

          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-3xl text-gray-900 dark:text-white">Admin sign in</h2>
            <p className="mt-1 text-sm text-gray-500">Manage products, orders, customers and campaigns.</p>
          </div>

          {roles.length > 0 && (
            <section className="space-y-3 rounded-2xl border border-[#c9a96b]/40 bg-[#c9a96b]/10 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#c9a96b]">One-click demo access</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {roles.includes('admin') && (
                  <button
                    type="button"
                    onClick={() => signInDemo('admin')}
                    disabled={busy !== null}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#8b6f47] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#725a38] disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" /> {busy === 'admin' ? 'Signing in…' : 'Login as Admin'}
                  </button>
                )}
                {roles.includes('customer') && (
                  <button
                    type="button"
                    onClick={() => signInDemo('customer')}
                    disabled={busy !== null}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-xs font-bold uppercase tracking-wider text-gray-800 transition hover:border-[#8b6f47] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <UserIcon className="h-4 w-4" /> {busy === 'customer' ? 'Signing in…' : 'Login as Customer'}
                  </button>
                )}
              </div>
              {adminCredential && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-xs dark:bg-gray-900/70">
                  <div className="min-w-0 text-gray-600 dark:text-gray-300">
                    <p className="truncate"><span className="font-bold">Email:</span> <span className="font-mono">{adminCredential.email}</span></p>
                    <p><span className="font-bold">Password:</span> <span className="font-mono">{adminCredential.password}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEmail(adminCredential.email); setPassword(adminCredential.password); }}
                    className="shrink-0 rounded-lg border border-[#8b6f47]/40 px-2.5 py-1.5 text-[11px] font-bold text-[#8b6f47] hover:bg-[#8b6f47]/10 dark:text-[#c9a96b]"
                  >
                    Fill form
                  </button>
                </div>
              )}
            </section>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-bold text-gray-650 dark:text-gray-300">Email</label>
              <input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-bold text-gray-650 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={busy !== null}
              className="w-full rounded-xl bg-[#17110f] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-black disabled:opacity-50 dark:bg-white dark:text-gray-950"
            >
              {busy === 'form' ? 'Signing in…' : 'Sign in to admin panel'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Shopping instead?{' '}
            <Link href="/auth/login" className="font-bold text-[#8b6f47] hover:underline dark:text-[#c9a96b]">Customer login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
