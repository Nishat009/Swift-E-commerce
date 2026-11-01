'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Moon, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useThemeStore, useApplyTheme } from '@/stores/themeStore';
import { AdminSidebar, AdminTopbar, AdminCommandMenu } from './AdminLayout';
import type { AdminTab } from './adminNav';

/**
 * The admin sidebar and top bar around a standalone admin page (product create/edit/detail), so leaving the
 * /admin tabs does not drop you into the shop layout. Sidebar links go back to the matching /admin tab.
 * Wrap it in <AdminOnly>: this component does not check the role itself.
 */
export default function AdminFrame({
  active,
  title,
  description,
  backHref,
  backLabel = 'Back',
  actions,
  children,
}: {
  active: AdminTab;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  useApplyTheme(theme);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const goTo = (tab: AdminTab) => router.push(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`);
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      router.push('/auth/login');
    } catch {
      toast.error('Failed to log out.');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commandActions = useMemo(() => [
    { id: 'action-theme', label: 'Toggle dark mode', hint: 'Action', icon: Moon, run: toggleTheme },
    { id: 'action-store', label: 'View storefront', hint: 'Action', icon: Store, run: () => router.push('/shop') },
    { id: 'action-logout', label: 'Log out', hint: 'Action', icon: LogOut, run: handleLogout },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [toggleTheme]);

  return (
    <div className="admin-shell min-h-screen bg-[#f6f5f3] text-stone-900 dark:bg-[#0b0a09] dark:text-stone-100">
      <AdminSidebar
        active={active}
        onSelect={goTo}
        user={{ name: user?.name, email: user?.email }}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="lg:pl-64">
        <AdminTopbar
          active={active}
          onOpenMenu={() => setMobileNavOpen(true)}
          onOpenSearch={() => setCommandOpen(true)}
          onRefresh={() => router.refresh()}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {backHref && (
            <Link href={backHref} className="mb-3 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
              <ArrowLeft className="size-4" /> {backLabel}
            </Link>
          )}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">{title}</h1>
              {description && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
      <AdminCommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} onSelect={goTo} extraActions={commandActions} />
    </div>
  );
}
