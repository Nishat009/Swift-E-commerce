'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export type DemoRole = 'customer' | 'admin';
export type DemoCredential = { role: DemoRole; email: string; password: string };

// The hosted API can take up to a minute to wake from sleep, longer than apiClient's default timeout
const DEMO_STATUS_TIMEOUT_MS = 60000;

// Which demo accounts the backend allows, plus their shared credentials when DEMO_PASSWORD is set.
// `loading` stays true while the API is still waking up, so callers can show the buttons as "connecting"
// instead of hiding them.
export function useDemoAccess() {
  const [access, setAccess] = useState<{ roles: DemoRole[]; credentials: DemoCredential[]; loading: boolean }>({ roles: [], credentials: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    const load = (attempt: number) => {
      apiClient.get('/auth/demo-login', { timeout: DEMO_STATUS_TIMEOUT_MS })
        .then((res) => {
          if (cancelled) return;
          const data = res.data?.data;
          setAccess({
            roles: Array.isArray(data?.roles) ? data.roles : [],
            credentials: Array.isArray(data?.credentials) ? data.credentials : [],
            loading: false,
          });
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 2) load(attempt + 1);
          else setAccess({ roles: [], credentials: [], loading: false });
        });
    };
    load(1);
    return () => { cancelled = true; };
  }, []);

  return access;
}

// "Guest login" / "Admin login" one-click buttons. Hidden once the backend says demo login is off.
export default function DemoLoginButtons({ disabled = false }: { disabled?: boolean }) {
  const { demoLogin } = useAuth();
  const toast = useToast();
  const { roles, credentials, loading } = useDemoAccess();
  const [busy, setBusy] = useState<DemoRole | null>(null);

  if (!loading && !roles.length) return null;

  // While the API wakes up, show both buttons (disabled) so visitors can see demo access exists
  const shown: DemoRole[] = loading ? ['customer', 'admin'] : roles;

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
  const label = (role: DemoRole, text: string) => (busy === role ? 'Signing in…' : loading ? 'Connecting…' : text);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Quick demo access</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex gap-2">
        {shown.includes('customer') && (
          <button
            type="button"
            onClick={() => signIn('customer')}
            disabled={disabled || loading || busy !== null}
            className={`${base} border-ink/25 bg-transparent text-ink hover:border-ink`}
          >
            <UserIcon className="w-3.5 h-3.5" /> {label('customer', 'Customer demo')}
          </button>
        )}
        {shown.includes('admin') && (
          <button
            type="button"
            onClick={() => signIn('admin')}
            disabled={disabled || loading || busy !== null}
            className={`${base} border-ink bg-ink text-paper hover:bg-ink/85`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> {label('admin', 'Admin demo')}
          </button>
        )}
      </div>
      {loading && <p className="text-center text-[11px] text-stone-500">Waking the demo server, this can take up to a minute…</p>}
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
