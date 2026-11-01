'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Loading from '@/components/ui/Loading';
import HeroImageAdmin from '@/components/ui/HeroImageAdmin';
import OverviewAdmin from '@/components/admin/OverviewAdmin';
import OrdersAdmin from '@/components/admin/OrdersAdmin';
import UsersAdmin from '@/components/admin/UsersAdmin';
import NewsletterAdmin from '@/components/admin/NewsletterAdmin';
import ReviewsAdmin from '@/components/admin/ReviewsAdmin';
import CampaignsAdmin from '@/components/admin/CampaignsAdmin';
import CurrenciesAdmin from '@/components/admin/CurrenciesAdmin';
import CouponsAdmin from '@/components/admin/CouponsAdmin';
import CategoriesAdmin from '@/components/admin/CategoriesAdmin';
import ActivityLogsAdmin from '@/components/admin/ActivityLogsAdmin';
import WalletAdmin from '@/components/admin/WalletAdmin';
import MonitoringAdmin from '@/components/admin/MonitoringAdmin';
import ReportsAdmin from '@/components/admin/ReportsAdmin';
import ContactMessages, { useContactUnread } from '@/components/admin/ContactMessages';
import ChatMessages from '@/components/admin/ChatMessages';
import ReturnsAdmin from '@/components/admin/ReturnsAdmin';
import PaymentSettingsAdmin from '@/components/admin/PaymentSettingsAdmin';
import { AdminSidebar, AdminTopbar, AdminCommandMenu } from '@/components/admin/AdminLayout';
import { ADMIN_NAV_ITEMS, AdminTab, isAdminTab } from '@/components/admin/adminNav';
import { adminCard, AdminButton } from '@/components/admin/AdminUI';
import { useThemeStore, useApplyTheme } from '@/stores/themeStore';
import ProductTable from '@/components/product/ProductTable';
import Button from '@/components/ui/Button';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import AIProductDescriptionGen from '@/features/ai/product-ai/AIProductDescriptionGen';
import AIImageEnhancer from '@/features/ai/product-ai/AIImageEnhancer';
import AIReviewAnalyzer from '@/features/ai/product-ai/AIReviewAnalyzer';
import AISalesAdvisor from '@/features/ai/product-ai/AISalesAdvisor';
import { ShieldAlert, Store, LogOut, Moon, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';

// Each tab is its own component in components/admin/ that loads its own data; the sections and their
// grouping live in components/admin/adminNav.ts.

// useSearchParams (notification deep links) needs a Suspense boundary in the App Router
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleAdminLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      router.push('/auth/login');
    } catch (err) {
      toast.error('Failed to log out.');
    }
  };

  // Navigation states (the open tab is kept in the URL, so a reload stays on it)
  const [adminTab, setAdminTab] = useState<AdminTab>(() => {
    const tab = searchParams.get('tab');
    return searchParams.get('order') ? 'orders' : isAdminTab(tab) ? tab : 'overview';
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [contactUnread, setContactUnread] = useContactUnread(!authLoading && user?.role === 'admin');
  // Bumping the key remounts the open tab, which reloads its data
  const [refreshKey, setRefreshKey] = useState(0);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const refreshTab = () => setRefreshKey((key) => key + 1);
  // The admin panel has no shop navbar, so it applies the saved theme itself
  const { theme, toggleTheme } = useThemeStore();
  useApplyTheme(theme);

  const selectTab = useCallback((tab: AdminTab) => {
    setAdminTab(tab);
    setMobileNavOpen(false);
    router.replace(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`, { scroll: false });
    window.scrollTo({ top: 0 });
  }, [router]);

  // Verify Admin role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard'); // Redirect non-admins
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Deep links: /admin?tab=orders&order=<id> opens that tab (and order). Re-read when a notification
  // link is clicked while the admin page is already open.
  const linkTab = searchParams.get('tab');
  const linkOrder = searchParams.get('order');
  useEffect(() => {
    if (linkOrder) {
      if (adminTab === 'orders') refreshTab(); // already here: reload so a brand-new order shows up
      else setAdminTab('orders');
      setFocusOrderId(linkOrder);
      router.replace('/admin?tab=orders', { scroll: false });
      return;
    }
    if (isAdminTab(linkTab) && linkTab !== adminTab) setAdminTab(linkTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkTab, linkOrder]);

  // Ctrl/⌘+K opens the jump menu
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
    { id: 'action-refresh', label: 'Reload this section', hint: 'Action', icon: RefreshCw, run: refreshTab },
    { id: 'action-theme', label: 'Toggle dark mode', hint: 'Action', icon: Moon, run: toggleTheme },
    { id: 'action-store', label: 'View storefront', hint: 'Action', icon: Store, run: () => router.push('/shop') },
    { id: 'action-logout', label: 'Log out', hint: 'Action', icon: LogOut, run: handleAdminLogout },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [toggleTheme]);

  if (authLoading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f6f5f3] dark:bg-[#0b0a09] flex items-center justify-center p-6">
        <div className={`${adminCard} p-8 text-center max-w-sm`}>
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Access restricted</h2>
          <p className="text-sm text-stone-500 mt-2">
            This area is for store administrators. Sign in with an admin account to continue.
          </p>
          <Button onClick={() => router.push('/shop')} className="mt-6 w-full">Return to the shop</Button>
        </div>
      </div>
    );
  }

  const current = ADMIN_NAV_ITEMS.find((item) => item.id === adminTab) ?? ADMIN_NAV_ITEMS[0];

  const content = (
    <>
      {adminTab === 'hero' && <HeroImageAdmin />}
      {adminTab === 'ai_suite' && (
        <div className="space-y-6">
          <AISalesAdvisor />
          <AIProductDescriptionGen />
          <AIImageEnhancer />
          <AIReviewAnalyzer />
        </div>
      )}

      {adminTab === 'overview' && <OverviewAdmin onNavigate={selectTab} />}
      {adminTab === 'products' && <ProductTable />}
      {adminTab === 'orders' && <OrdersAdmin focusOrderId={focusOrderId} onFocusHandled={() => setFocusOrderId(null)} />}
      {adminTab === 'returns' && <ReturnsAdmin />}
      {adminTab === 'payments' && <PaymentSettingsAdmin />}
      {adminTab === 'users' && <UsersAdmin />}
      {adminTab === 'newsletter' && <NewsletterAdmin />}
      {adminTab === 'reviews' && <ReviewsAdmin />}
      {adminTab === 'campaigns' && <CampaignsAdmin />}
      {adminTab === 'currencies' && <CurrenciesAdmin />}
      {/* Language management is hidden for now: add a "languages" tab to adminNav.ts and render <LanguagesAdmin /> */}
      {adminTab === 'categories' && <CategoriesAdmin />}
      {adminTab === 'coupons' && <CouponsAdmin />}
      {adminTab === 'logs' && <ActivityLogsAdmin />}
      {adminTab === 'accounts' && <WalletAdmin onOpenOrder={(id) => router.push(`/admin?tab=orders&order=${id}`)} />}
      {adminTab === 'monitoring' && <MonitoringAdmin />}
      {adminTab === 'reports' && <ReportsAdmin />}
      {adminTab === 'messages' && (
        <div className="space-y-10">
          <ContactMessages onUnreadChange={setContactUnread} />
          <ChatMessages />
        </div>
      )}

      {adminTab === 'security' && (
        <div className="max-w-2xl">
          <TwoFactorSetup enabled={Boolean(user?.twoFactorEnabled)} onChanged={refreshUser} />
        </div>
      )}
    </>
  );

  return (
    <div className="admin-shell min-h-screen bg-[#f6f5f3] text-stone-900 dark:bg-[#0b0a09] dark:text-stone-100">
      <AdminSidebar
        active={adminTab}
        onSelect={selectTab}
        badges={{ messages: contactUnread }}
        user={{ name: user.name, email: user.email }}
        onLogout={handleAdminLogout}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="lg:pl-64">
        <AdminTopbar
          active={adminTab}
          onOpenMenu={() => setMobileNavOpen(true)}
          onOpenSearch={() => setCommandOpen(true)}
          onRefresh={refreshTab}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">{current.label}</h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{current.description}</p>
            </div>
            {adminTab === 'overview' && (
              <Link href="/dashboard/products/create">
                <AdminButton variant="primary"><Plus className="size-4" /> Add product</AdminButton>
              </Link>
            )}
          </div>

          <React.Fragment key={refreshKey}>
            {current.bare ? content : <div className={`${adminCard} p-4 sm:p-6`}>{content}</div>}
          </React.Fragment>
        </main>
      </div>

      <AdminCommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} onSelect={selectTab} extraActions={commandActions} />
    </div>
  );
}
