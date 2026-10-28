'use client';

import React, { Suspense, useEffect, useState } from 'react';
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
import NotificationBell from '@/components/layout/NotificationBell';
import { useThemeStore, useApplyTheme } from '@/stores/themeStore';
import ProductTable from '@/components/product/ProductTable';
import Button from '@/components/ui/Button';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import AIProductDescriptionGen from '@/features/ai/product-ai/AIProductDescriptionGen';
import AIImageEnhancer from '@/features/ai/product-ai/AIImageEnhancer';
import AIReviewAnalyzer from '@/features/ai/product-ai/AIReviewAnalyzer';
import AISalesAdvisor from '@/features/ai/product-ai/AISalesAdvisor';
import {
  ShieldAlert,
  BarChart3,
  Shirt,
  ShoppingBag,
  Users,
  Mail,
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Star,
  Gift,
  ShieldCheck,
  LogOut,
  Store,
  Wallet,
  RotateCcw,
  CreditCard,
  Moon,
  Sun,
} from 'lucide-react';
import Link from 'next/link';

// Each tab is its own component in components/admin/ that loads its own data.
type AdminTab = 'overview' | 'hero' | 'ai_suite' | 'products' | 'orders' | 'returns' | 'payments' | 'users' | 'newsletter' | 'reviews' | 'campaigns' | 'monitoring' | 'reports' | 'logs' | 'security' | 'currencies' | 'coupons' | 'categories' | 'messages' | 'accounts';

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

  const handleAdminLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      router.push('/auth/login');
    } catch (err) {
      toast.error('Failed to log out.');
    }
  };

  // Navigation states
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [contactUnread, setContactUnread] = useContactUnread(!authLoading && user?.role === 'admin');
  // Bumping the key remounts the open tab, which reloads its data ("Refresh Dashboard")
  const [refreshKey, setRefreshKey] = useState(0);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const refreshTab = () => setRefreshKey((key) => key + 1);
  // The admin panel has no shop navbar, so it applies the saved theme itself
  const { theme, toggleTheme } = useThemeStore();
  useApplyTheme(theme);

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
  const searchParams = useSearchParams();
  const linkTab = searchParams.get('tab');
  const linkOrder = searchParams.get('order');
  useEffect(() => {
    if (!linkTab && !linkOrder) return;
    const tab = linkOrder ? 'orders' : linkTab;
    if (tab === adminTab && tab === 'orders') refreshTab(); // already here: reload so a brand-new order shows up
    else if (tab) setAdminTab(tab as AdminTab);
    if (linkOrder) setFocusOrderId(linkOrder);
    router.replace('/admin', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkTab, linkOrder]);

  if (authLoading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 p-8 rounded-3xl text-center max-w-sm shadow-xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-gray-800">403 Access Forbidden</h2>
          <p className="text-sm text-gray-400 mt-2">
            You do not possess the required administrator credentials to access this dashboard.
          </p>
          <Button onClick={() => router.push('/shop')} className="mt-6 w-full">Return home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-gray-950 flex flex-col">

      {/* Studio Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-50/10 via-cream/30 to-[#8b6f47]/5 py-6 border-b border-gray-250/50 dark:border-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 font-medium mb-1">
              <Link href="/profile" className="hover:text-gray-650 dark:hover:text-gray-200">Profile</Link>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-red-500 font-bold">Admin Console</span>
            </div>
            <h1 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-[#f5f1eb] tracking-tight">
              Management Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Store overview, catalog modifications, orders updates, client accounts, and subscriptions control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-2xl py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Store className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b]" />
              <span>View Storefront</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-2xl p-2 transition shadow-xs"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <NotificationBell className="relative bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-2xl p-2 transition shadow-xs [&>svg]:w-4 [&>svg]:h-4" />


            <div className="hidden sm:flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-2 px-4 shadow-sm items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold">Role Authority</span>
                <span className="text-xs font-black text-gray-800 dark:text-gray-250">Master Admin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col lg:flex-row gap-8">

        {/* SIDEBAR NAVIGATION TAB SWITCHER */}
        <div className="lg:w-1/4 flex flex-col gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'hero', label: 'Hero Images', icon: Shirt },
            { id: 'ai_suite', label: 'AI Commerce Suite', icon: Sparkles },
            { id: 'products', label: 'Products Catalog', icon: Shirt },
            { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
            { id: 'returns', label: 'Cancellations & Returns', icon: RotateCcw },
            { id: 'payments', label: 'Payment Settings', icon: CreditCard },
            { id: 'accounts', label: 'Accounts & Wallet', icon: Wallet },
            { id: 'categories', label: 'Categories', icon: Shirt },
            { id: 'coupons', label: 'Coupons', icon: Gift },
            { id: 'users', label: 'User Accounts', icon: Users },
            { id: 'reviews', label: 'Product Reviews', icon: Star },
            { id: 'newsletter', label: 'Newsletter Subs', icon: Mail },
            { id: 'campaigns', label: 'Manage Campaigns', icon: Gift },
            { id: 'monitoring', label: 'System Monitoring', icon: TrendingUp },
            { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
            { id: 'logs', label: 'System Logs', icon: ShieldAlert },
            { id: 'security', label: 'Security & 2FA', icon: ShieldCheck },
            { id: 'currencies', label: 'Manage Currencies', icon: RefreshCw },
            // Language management hidden for now
            // { id: 'languages', label: 'Manage Languages', icon: Globe },
            { id: 'messages', label: 'Messages', icon: Mail }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAdminTab(item.id as any)}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all duration-300 ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm scale-[1.01]'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-250 hover:bg-gray-55 dark:hover:bg-gray-800/50 border-transparent hover:translate-x-1'
                }`}
              >
                <span className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4" /> {item.label}
                  {item.id === 'messages' && contactUnread > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{contactUnread}</span>
                  )}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`} />
              </button>
            );
          })}

          <hr className="my-2 border-gray-200 dark:border-gray-800" />
          <Button onClick={refreshTab} variant="outline" className="w-full text-xs font-bold flex items-center justify-center gap-2 py-2.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
          </Button>

          <Link href="/shop" className="w-full">
            <Button variant="outline" className="w-full text-xs font-bold flex items-center justify-center gap-2 py-2.5 mt-1">
              <Store className="w-3.5 h-3.5" /> Return to Storefront
            </Button>
          </Link>

          <button
            onClick={handleAdminLogout}
            className="w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-red-600 dark:text-red-400 bg-red-50/70 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/80 transition-colors cursor-pointer mt-1 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out as Admin
          </button>
        </div>

        {/* WORKSPACE DETAILED VIEWS */}
        <div className="lg:w-3/4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
          <React.Fragment key={refreshKey}>
            {/* AI COMMERCE SUITE VIEW */}
            {adminTab === 'hero' && <HeroImageAdmin />}
            {adminTab === 'ai_suite' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                      Commerce Insights & Asset Tools
                    </h2>
                    <p className="text-xs text-gray-500">
                      Create product copy and image presets, and review live store analytics.
                    </p>
                  </div>
                </div>

                <AISalesAdvisor />
                <AIProductDescriptionGen />
                <AIImageEnhancer />
                <AIReviewAnalyzer />
              </div>
            )}

            {adminTab === 'overview' && <OverviewAdmin />}
            {adminTab === 'products' && <ProductTable />}
            {adminTab === 'orders' && <OrdersAdmin focusOrderId={focusOrderId} onFocusHandled={() => setFocusOrderId(null)} />}
            {adminTab === 'returns' && <ReturnsAdmin />}
            {adminTab === 'payments' && <PaymentSettingsAdmin />}
            {adminTab === 'users' && <UsersAdmin />}
            {adminTab === 'newsletter' && <NewsletterAdmin />}
            {adminTab === 'reviews' && <ReviewsAdmin />}
            {adminTab === 'campaigns' && <CampaignsAdmin />}
            {adminTab === 'currencies' && <CurrenciesAdmin />}
            {/* Language management is hidden for now: add a "languages" tab above and render <LanguagesAdmin /> */}
            {adminTab === 'categories' && <CategoriesAdmin />}
            {adminTab === 'coupons' && <CouponsAdmin />}
            {adminTab === 'logs' && <ActivityLogsAdmin />}
            {adminTab === 'accounts' && <WalletAdmin onOpenOrder={(id) => router.push(`/admin?tab=orders&order=${id}`)} />}
            {adminTab === 'monitoring' && <MonitoringAdmin />}
            {adminTab === 'reports' && <ReportsAdmin />}
            {adminTab === 'messages' && (
              <div className="space-y-8">
                <ContactMessages onUnreadChange={setContactUnread} />
                <ChatMessages />
              </div>
            )}

            {/* SECURITY & 2FA VIEW */}
            {adminTab === 'security' && (
              <div className="space-y-6 text-left animate-fade-in">
                <div className="flex items-center mb-6 border-b pb-3.5 dark:border-gray-800">
                  <ShieldCheck className="w-6 h-6 text-[#8b6f47] dark:text-[#c9a96b] mr-2" />
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Security & 2FA Setup</h2>
                </div>

                <div className="max-w-2xl">
                  <TwoFactorSetup enabled={Boolean(user?.twoFactorEnabled)} onChanged={refreshUser} />
                </div>
              </div>
            )}
          </React.Fragment>
        </div>

      </main>
    </div>
  );
}
