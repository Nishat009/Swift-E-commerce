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
  const { roles: liveRoles, credentials, loading: demoLoading } = useDemoAccess();
  // While the API wakes up, show both demo buttons (disabled) instead of hiding them
  const roles: DemoRole[] = demoLoading ? ['admin', 'customer'] : liveRoles;
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

  const inputClass = 'h-11 w-full rounded-md border border-line bg-transparent px-3.5 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none';

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#17110f] p-12 text-[#f8f1e8] lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="relative font-serif text-xl uppercase tracking-[0.28em] text-white">
          SwiftCart
        </Link>
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#c9a96b]">Admin panel</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight">Run the whole store from one place.</h1>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-[#e8dccb]">
                <span className="flex size-9 items-center justify-center rounded-full border border-white/15">
                  <Icon className="h-4 w-4 text-[#c9a96b]" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-[#a89b8a]">© {new Date().getFullYear()} SwiftCart</p>
      </aside>

      <main className="flex items-center justify-center bg-paper px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>

          <div>
            <div className="mb-4 text-[#8b6f47] dark:text-[#c9a96b]">
              <ShieldCheck className="size-5" strokeWidth={1.5} />
            </div>
            <h2 className="font-sans text-3xl font-medium tracking-tight text-ink">Admin sign in</h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Manage products, orders, customers and campaigns.</p>
          </div>

          {roles.length > 0 && (
            <section className="space-y-3 rounded-lg border border-line bg-surface-muted p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">One-click demo access</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {roles.includes('admin') && (
                  <button
                    type="button"
                    onClick={() => signInDemo('admin')}
                    disabled={demoLoading || busy !== null}
                    className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-xs font-semibold uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" /> {busy === 'admin' ? 'Signing in…' : demoLoading ? 'Connecting…' : 'Login as Admin'}
                  </button>
                )}
                {roles.includes('customer') && (
                  <button
                    type="button"
                    onClick={() => signInDemo('customer')}
                    disabled={demoLoading || busy !== null}
                    className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/25 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserIcon className="h-4 w-4" /> {busy === 'customer' ? 'Signing in…' : demoLoading ? 'Connecting…' : 'Login as Customer'}
                  </button>
                )}
              </div>
              {demoLoading && <p className="text-[11px] text-stone-500">Waking the demo server, this can take up to a minute…</p>}
              {adminCredential && (
                <div className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-xs">
                  <div className="min-w-0 text-stone-600 dark:text-stone-300">
                    <p className="truncate"><span className="font-medium">Email:</span> <span>{adminCredential.email}</span></p>
                    <p><span className="font-medium">Password:</span> <span>{adminCredential.password}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEmail(adminCredential.email); setPassword(adminCredential.password); }}
                    className="shrink-0 cursor-pointer rounded-full border border-ink/25 px-3 py-1.5 text-[11px] font-medium text-ink transition-colors hover:border-ink"
                  >
                    Fill form
                  </button>
                </div>
              )}
            </section>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-medium text-stone-600 dark:text-stone-300">Email</label>
              <input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-medium text-stone-600 dark:text-stone-300">Password</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy !== null}
              className="h-12 w-full cursor-pointer rounded-full bg-ink text-xs font-semibold uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'form' ? 'Signing in…' : 'Sign in to admin panel'}
            </button>
          </form>

          <p className="text-center text-xs text-stone-500">
            Shopping instead?{' '}
            <Link href="/auth/login" className="font-medium text-ink underline underline-offset-4">Customer login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
