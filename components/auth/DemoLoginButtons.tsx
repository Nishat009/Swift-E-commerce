'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export type DemoRole = 'customer' | 'admin';
export type DemoCredential = { role: DemoRole; email: string; password: string };

// Which demo accounts the backend allows, plus their shared credentials when DEMO_PASSWORD is set
export function useDemoAccess() {
  const [access, setAccess] = useState<{ roles: DemoRole[]; credentials: DemoCredential[] }>({ roles: [], credentials: [] });

  useEffect(() => {
    apiClient.get('/auth/demo-login')
      .then((res) => {
        const data = res.data?.data;
        setAccess({
          roles: Array.isArray(data?.roles) ? data.roles : [],
          credentials: Array.isArray(data?.credentials) ? data.credentials : [],
        });
      })
      .catch(() => setAccess({ roles: [], credentials: [] }));
  }, []);

  return access;
}

// "Guest login" / "Admin login" one-click buttons. Hidden unless the backend has demo login enabled.
export default function DemoLoginButtons({ disabled = false }: { disabled?: boolean }) {
  const { demoLogin } = useAuth();
  const toast = useToast();
  const { roles, credentials } = useDemoAccess();
  const [busy, setBusy] = useState<DemoRole | null>(null);

  if (!roles.length) return null;

  const signIn = async (role: DemoRole) => {
    setBusy(role);
    try {
      await demoLogin(role);
      toast.success(role === 'admin' ? 'Signed in as the demo admin.' : 'Signed in as a guest shopper.');
    } catch (err: any) {
      toast.error(err?.message || 'Demo sign-in failed.');
    } finally {
      setBusy(null);
    }
  };

  const base = 'flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Quick demo access</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex gap-2">
        {roles.includes('customer') && (
          <button
            type="button"
            onClick={() => signIn('customer')}
            disabled={disabled || busy !== null}
            className={`${base} border-ink/25 bg-transparent text-ink hover:border-ink`}
          >
            <UserIcon className="w-3.5 h-3.5" /> {busy === 'customer' ? 'Signing in…' : 'Guest login'}
          </button>
        )}
        {roles.includes('admin') && (
          <button
            type="button"
            onClick={() => signIn('admin')}
            disabled={disabled || busy !== null}
            className={`${base} border-ink bg-ink text-paper hover:bg-ink/85`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> {busy === 'admin' ? 'Signing in…' : 'Admin login'}
          </button>
        )}
      </div>
      {credentials.length > 0 && (
        <ul className="space-y-0.5 text-center text-[11px] text-stone-500">
          {credentials.map((c) => (
            <li key={c.role}>
              {c.role === 'admin' ? 'Admin' : 'Customer'}: <span className="text-ink">{c.email}</span> / <span className="text-ink">{c.password}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
