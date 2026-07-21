'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/ui/Loading';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

interface AccountLayoutProps {
  children: React.ReactNode;
  activeTabName?: string;
}

export default function AccountLayout({ children, activeTabName }: AccountLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <Loading />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/orders', icon: Package },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
    { name: 'Addresses', path: '/addresses', icon: MapPin },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  const currentActivePath = activeTabName ? activeTabName : pathname;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 border-b pb-5 border-gray-150/50 dark:border-gray-800">
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wide">
                My Account
              </h1>
              <p className="text-xs text-text-muted mt-1.5">
                Manage your orders, profile details, and account preferences
              </p>
            </div>
            
            {/* Mobile Sidebar Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800 text-gray-700 dark:text-gray-300 shadow-sm"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Navigation (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150/40 dark:border-gray-800/80 shadow-sm p-5 sticky top-24 space-y-6">
              
              {/* User Identity Info */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#8b6f47] to-[#c9a96b] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate font-serif">
                    {user.name}
                  </h4>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentActivePath === item.path || currentActivePath?.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-300 flex items-center justify-between group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#8b6f47]/10 to-[#c9a96b]/10 text-[#8b6f47] dark:text-[#c9a96b]'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#8b6f47] dark:text-[#c9a96b]' : 'text-gray-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all ${isActive ? 'opacity-100 text-[#8b6f47] dark:text-[#c9a96b] translate-x-0.5' : 'text-gray-400'}`} />
                    </Link>
                  );
                })}

                {/* Logout Button */}
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full text-left px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-300 flex items-center justify-between group text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4 text-red-500 transition-transform group-hover:scale-110" />
                    <span>Logout</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Mobile Navigation Drawer/Menu (Toggled) */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end" onClick={() => setIsMobileMenuOpen(false)}>
              <div
                className="w-72 max-w-xs h-full bg-white dark:bg-gray-900 p-6 shadow-2xl flex flex-col justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  {/* Close and Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-gray-800">
                    <h3 className="font-serif font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Navigation</h3>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentActivePath === item.path || currentActivePath?.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-3.5 ${
                            isActive
                              ? 'bg-gradient-to-r from-[#8b6f47]/10 to-[#c9a96b]/10 text-[#8b6f47] dark:text-[#c9a96b]'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#8b6f47] dark:text-[#c9a96b]' : 'text-gray-400'}`} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-3.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Logout</span>
                    </button>
                  </nav>
                </div>

                {/* Mobile Drawer Bottom User Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-150 dark:border-gray-800">
                  <div className="relative w-10 h-10 bg-gradient-to-br from-[#8b6f47] to-[#c9a96b] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate font-serif">
                      {user.name}
                    </h4>
                    <p className="text-[9px] text-text-muted truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Side Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-150/40 dark:border-gray-800/80 shadow-xs p-6 sm:p-8">
              {children}
            </div>
          </div>

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
