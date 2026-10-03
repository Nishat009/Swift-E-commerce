'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type DemoRole = 'customer' | 'admin';

// "Guest login" / "Admin login" one-click buttons. Hidden unless the backend has demo login enabled.
export default function DemoLoginButtons({ disabled = false }: { disabled?: boolean }) {
  const { demoLogin } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState<DemoRole[]>([]);
  const [busy, setBusy] = useState<DemoRole | null>(null);

  useEffect(() => {
    apiClient.get('/auth/demo-login')
      .then((res) => setRoles(Array.isArray(res.data?.data?.roles) ? res.data.data.roles : []))
      .catch(() => setRoles([]));
  }, []);

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

  const base = 'flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition flex items-center justify-center gap-1.5 disabled:opacity-50';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Quick demo access</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="flex gap-2">
        {roles.includes('customer') && (
          <button
            type="button"
            onClick={() => signIn('customer')}
            disabled={disabled || busy !== null}
            className={`${base} border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-[#0a3d4a] bg-white dark:bg-gray-950`}
          >
            <UserIcon className="w-3.5 h-3.5" /> {busy === 'customer' ? 'Signing in…' : 'Guest login'}
          </button>
        )}
        {roles.includes('admin') && (
          <button
            type="button"
            onClick={() => signIn('admin')}
            disabled={disabled || busy !== null}
            className={`${base} border-[#0a3d4a] bg-[#0a3d4a] hover:bg-[#072a33] text-white`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> {busy === 'admin' ? 'Signing in…' : 'Admin login'}
          </button>
        )}
      </div>
    </div>
  );
}
