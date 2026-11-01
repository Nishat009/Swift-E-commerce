'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/ui/Loading';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AccountLayoutProps {
  children: React.ReactNode;
  activeTabName?: string;
}

export default function AccountLayout({ children, activeTabName }: AccountLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // A deliberate logout must not remember this page for whoever signs in next
  const loggingOut = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(loggingOut.current ? '/auth/login' : `/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return <Loading />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Orders', path: '/orders' },
    { name: 'Wishlist', path: '/wishlist' },
    // Saved addresses hidden for admin accounts for now
    ...(user?.role === 'admin' ? [] : [{ name: 'Addresses', path: '/addresses' }]),
    { name: 'Profile', path: '/profile' },
    { name: 'Settings', path: '/settings' },
  ];

  if (user?.role === 'admin') {
    menuItems.unshift({ name: 'Admin Console', path: '/admin' });
  }

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    loggingOut.current = true;
    await logout();
  };

  const currentActivePath = activeTabName ? activeTabName : pathname;
  const isItemActive = (path: string) => currentActivePath === path || currentActivePath?.startsWith(path);

  return (
    <div className="min-h-screen bg-paper py-8 sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <header className="mb-8 lg:mb-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400 mb-3 truncate">
            {user.name}
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-ink">My Account</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 max-w-2xl">
            Manage your orders, profile details, and account preferences.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[13rem_minmax(0,1fr)] gap-x-16 gap-y-8">
          {/* Navigation: horizontal tab row on mobile, text list on desktop */}
          <aside>
            <nav
              aria-label="Account"
              className="no-scrollbar flex lg:flex-col gap-x-6 overflow-x-auto lg:overflow-visible border-b border-line lg:border-b-0 lg:sticky lg:top-28"
            >
              {menuItems.map((item) => {
                const active = isItemActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'whitespace-nowrap text-sm transition-colors py-3 -mb-px border-b lg:mb-0 lg:py-2 lg:border-b-0 lg:border-l lg:pl-4 lg:-ml-px',
                      active
                        ? 'text-ink font-medium border-ink'
                        : 'text-stone-500 dark:text-stone-400 border-transparent hover:text-ink'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="whitespace-nowrap text-left text-sm py-3 -mb-px border-b border-transparent lg:mb-0 lg:py-2 lg:border-b-0 lg:border-l lg:pl-4 lg:-ml-px text-stone-500 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                Log out
              </button>
            </nav>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {/* Unified Logout Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of your account? You will need to log back in to access your orders and profile."
        confirmText="Sign Out"
        variant="danger"
      />
    </div>
  );
}
