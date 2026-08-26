'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Search,
  User,
  Moon,
  Sun,
  Menu,
  X,
  Heart,
  ChevronDown,
  Truck,
  RotateCcw,
  Leaf,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogOut,
  Shield,
  LayoutDashboard
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useThemeStore } from '@/stores/themeStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useState, useEffect, useCallback } from 'react';
import CartDrawer from '@/components/ui/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { Product } from '@/types';
import { debounce } from '@/utils/debounce';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'campaign_purchase' | 'draw_result' | 'campaign_update' | 'winner_announcement' | 'system';
  relatedCampaign?: { id: string; title: string; prizeName: string; status: string };
  isRead: boolean;
  createdAt: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { theme, toggleTheme } = useThemeStore();
  const { code: activeCurrencyCode, setCurrency, availableCurrencies, loadCurrencies } = useCurrencyStore();
  const { code: activeLanguageCode, setLanguage, availableLanguages, loadLanguages } = useLanguageStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!availableCurrencies || availableCurrencies.length <= 1) {
      loadCurrencies();
    }
    if (!availableLanguages || availableLanguages.length <= 1) {
      loadLanguages();
    }
  }, [availableCurrencies, availableLanguages, loadCurrencies, loadLanguages]);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        apiClient.get('/notifications?limit=10'),
        apiClient.get('/notifications/unread-count'),
      ]);
      if (notifRes.data?.success) setNotifications(notifRes.data.data);
      if (countRes.data?.success) setUnreadCount(countRes.data.data.count);
    } catch {
      // Silently fail
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await apiClient.get(`/products?search=${encodeURIComponent(query)}&limit=5`);
        if (res.data?.success) {
          setSuggestions(res.data.products || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchSuggestions(val);
  };

  const executeSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query.trim(), ...recentSearches.filter((q) => q !== query.trim())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Primary Navigation Links
  const navLinks = [
    { href: '/products', label: 'SHOP' },
    { href: '#', label: 'COLLECTIONS', hasMegaMenu: true },
    { href: '/campaigns', label: 'LUCKY DRAW' },
    { href: '/dressing-room', label: 'DRESSING ROOM' },
  ];

  if (user && user.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'ADMIN PANEL', hasMegaMenu: false });
  }

  return (
    <>
      {/* 1. Top Announcement Bar (Dark Luxury Theme) */}
      <div className="bg-[#1c2e24] dark:bg-gray-950 text-white text-[11px] py-2 px-4 border-b border-emerald-950/60 dark:border-gray-800 select-none">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between font-medium">
          <div className="hidden md:flex items-center space-x-6 mx-auto">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free shipping over $50</span>
            </span>
            <span className="text-emerald-700">•</span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>30-Day Hassle-Free Returns</span>
            </span>
            <span className="text-emerald-700">•</span>
            <span className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>Eco-Friendly Materials</span>
            </span>
            <span className="text-emerald-700">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>2-Year Warranty</span>
            </span>
          </div>
          <div className="md:hidden mx-auto flex items-center gap-1.5 text-center">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Free shipping on orders over $50 • 30-Day Returns</span>
          </div>
        </div>
      </div>

      {/* 2. Main Header Navbar (Two-Row Layout with full Dark Mode & Zero Clipping) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        className={`sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 transition-shadow duration-300 ${
          isScrolled ? 'shadow-md backdrop-blur-md bg-white/95 dark:bg-gray-950/95' : ''
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ROW 1: Search (Left) | Logo (Middle/Center) | Icons & Selectors (Right) */}
          <div className="flex items-center justify-between py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800/80 gap-4 min-h-[68px]">
            
            {/* Row 1 Left: Search Field (Desktop) / Mobile Toggle */}
            <div className="flex items-center space-x-3 w-1/3 justify-start">
              {/* Mobile Menu Trigger */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-1.5 text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Search Bar Input */}
              <div className="hidden sm:block relative w-48 md:w-72">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                      placeholder="Search products..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-xs font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#8b6f47] dark:focus:ring-[#c9a96b] border border-transparent dark:border-gray-800 transition"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </form>

                {/* Suggestions Popover */}
                <AnimatePresence>
                  {isFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 p-4 space-y-3 text-left"
                    >
                      {searchQuery.trim() === '' && recentSearches.length > 0 && (
                        <div>
                          <span className="block text-[9px] font-black uppercase tracking-wider text-text-muted dark:text-gray-400 mb-1.5">Recent Searches</span>
                          <div className="flex flex-wrap gap-1.5">
                            {recentSearches.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => executeSearch(q)}
                                className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQuery.trim() === '' && (
                        <div>
                          <span className="block text-[9px] font-black uppercase tracking-wider text-text-muted dark:text-gray-400 mb-1.5">Popular Searches</span>
                          <div className="flex flex-wrap gap-1.5">
                            {['Hoodie', 'Jacket', 'Shoes', 'Watch', 'Sofa'].map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => executeSearch(q)}
                                className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQuery.trim() !== '' && suggestions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-text-muted dark:text-gray-400">Matching Products</span>
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {suggestions.map((p) => (
                              <Link
                                key={p.id}
                                href={`/product/${p.id}`}
                                onClick={() => { setIsFocused(false); setSearchQuery(''); }}
                                className="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-2 transition"
                              >
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                  <img src={p.thumbnail} alt={p.title} className="object-cover w-full h-full" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.title}</h5>
                                  <p className="text-[10px] text-[#8b6f47] dark:text-[#c9a96b] font-bold font-mono">${p.price}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQuery.trim() !== '' && suggestions.length === 0 && (
                        <p className="text-[10px] text-text-muted dark:text-gray-400 py-2 text-center">No matching products for "{searchQuery}"</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Row 1 Middle / Center: SWIFTCART Logo */}
            <div className="w-1/3 text-center my-auto">
              <Link href="/" className="inline-block group py-1">
                <span className="text-2xl sm:text-3xl font-serif font-extrabold tracking-widest text-[#8b6f47] dark:text-[#c9a96b] group-hover:opacity-90 transition-opacity uppercase inline-block leading-none">
                  SWIFTCART
                </span>
              </Link>
            </div>

            {/* Row 1 Right: Icons & Currency / Language Selectors */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3 w-1/3">
              
              {/* User Account / Profile Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-1.5 text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition-colors cursor-pointer flex items-center gap-1"
                  title={user ? user.name : 'Account'}
                >
                  <User className="w-5 h-5" />
                  {user?.role === 'admin' && (
                    <span className="hidden sm:inline-block bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-[100] text-left"
                    >
                      {user ? (
                        <div className="space-y-1">
                          {/* User Header */}
                          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {user.name}
                              </p>
                              {user.role === 'admin' && (
                                <span className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user.email}</p>
                          </div>

                          {/* Admin Portal Link */}
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                              <Shield className="w-4 h-4" /> Admin Console
                            </Link>
                          )}

                          {/* Customer Dashboard Link */}
                          <Link
                            href="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-zinc-500" /> Account Dashboard
                          </Link>

                          {/* Wishlist Link */}
                          <Link
                            href="/wishlist"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Heart className="w-4 h-4 text-zinc-500" /> My Wishlist
                          </Link>

                          {/* Logout Button */}
                          <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                              onClick={async () => {
                                setIsUserMenuOpen(false);
                                await logout();
                                router.push('/auth/login');
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer text-left"
                            >
                              <LogOut className="w-4 h-4" /> Log Out
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 p-1">
                          <Link
                            href="/auth/login"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block w-full text-center bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs py-2 rounded-xl hover:opacity-90 transition-opacity"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/auth/register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block w-full text-center border border-zinc-200 dark:border-zinc-700 font-bold text-xs py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors text-zinc-800 dark:text-zinc-200"
                          >
                            Create Account
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist Heart Icon */}
              <Link
                href="/wishlist"
                className={`p-1.5 transition-colors ${
                  pathname === '/wishlist' ? 'text-[#8b6f47] dark:text-[#c9a96b]' : 'text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]'
                }`}
                title="My Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Shopping Cart Drawer Icon */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition-colors cursor-pointer"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {mounted && totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-[#8b6f47] dark:bg-[#c9a96b] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition-colors cursor-pointer"
                title="Toggle Dark/Light Mode"
              >
                {mounted && theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Currency Selector Switcher */}
              {mounted && (
                <div className="relative group">
                  <select
                    value={activeCurrencyCode}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-[10px] sm:text-[11px] font-bold text-gray-800 dark:text-gray-200 py-1 pl-2.5 pr-6 rounded-full border border-gray-200 dark:border-gray-800 cursor-pointer focus:outline-none transition-colors"
                  >
                    {availableCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        {curr.code} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-y-[-30%]" />
                </div>
              )}

            </div>
          </div>

          {/* ROW 2: All Navigation Menus (Centered with Relative Anchor for Mega Menu) */}
          <div className="hidden lg:flex items-center justify-center space-x-8 py-3 relative">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              if (link.hasMegaMenu) {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setIsMegaMenuOpen(true)}
                    onMouseLeave={() => setIsMegaMenuOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                      className={`flex items-center gap-1 text-xs font-black tracking-widest transition-colors py-1 uppercase cursor-pointer ${
                        isMegaMenuOpen
                          ? 'text-gray-900 dark:text-white border-b-2 border-[#8b6f47] dark:border-[#c9a96b]'
                          : 'text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180 text-[#8b6f47] dark:text-[#c9a96b]' : ''}`} />
                    </button>

                    {/* Rich Mega Menu Popover Drawer Anchored Under Navbar */}
                    <AnimatePresence>
                      {isMegaMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="fixed left-0 right-0 top-[112px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="max-w-[1440px] mx-auto p-8 grid grid-cols-12 gap-8 text-left">
                            
                            {/* Product & Solutions Links */}
                            <div className="col-span-3 space-y-4">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Product
                              </span>
                              <ul className="space-y-2.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                                <li><Link href="/products?category=Fashion" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Features & Clothing</Link></li>
                                <li><Link href="/dressing-room" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#8b6f47] dark:text-[#c9a96b]" /> 3D Dressing Room</Link></li>
                                <li><Link href="/campaigns" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Integrations & Draws</Link></li>
                                <li><Link href="/products?category=Footwear" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Use Cases & Footwear</Link></li>
                              </ul>

                              <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
                                Solutions
                              </span>
                              <ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                                <li><Link href="/products?tag=New" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">For Startups</Link></li>
                                <li><Link href="/products?tag=Bestseller" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">For Scaleups</Link></li>
                                <li><Link href="/products?category=Luxury" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">For Enterprises</Link></li>
                                <li><Link href="/products?category=Accessories" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Remote Teams & Accessories</Link></li>
                              </ul>
                            </div>

                            {/* Resources Column */}
                            <div className="col-span-3 space-y-4">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Resources
                              </span>
                              <ul className="space-y-2.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                                <li><Link href="/products" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Blog & Catalog</Link></li>
                                <li><Link href="/products" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Video Showcase</Link></li>
                                <li><Link href="/products" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Podcast</Link></li>
                                <li><Link href="/products" className="hover:text-[#8b6f47] dark:hover:text-[#c9a96b] transition">Newsletter</Link></li>
                              </ul>
                            </div>

                            {/* Right Side Clean Featured Photo Card */}
                            <div className="col-span-6">
                              <Link
                                href="/products?category=Fashion"
                                onClick={() => setIsMegaMenuOpen(false)}
                                className="group relative block w-full h-[320px] rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800"
                              >
                                <img
                                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=600&fit=crop"
                                  alt="Relaxed Cotton Shirt"
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-8 text-white">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Featured Collection</span>
                                  <h3 className="text-2xl font-serif font-bold text-white mt-1 group-hover:text-amber-200 transition">
                                    Relaxed Cotton Shirt
                                  </h3>
                                  <p className="text-xs text-gray-200 mt-1 flex items-center gap-1">
                                    Explore Luxury New Arrivals <ArrowRight className="w-3.5 h-3.5" />
                                  </p>
                                </div>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-black tracking-widest transition-colors py-1 uppercase ${
                    isActive
                      ? 'text-[#8b6f47] dark:text-[#c9a96b] border-b-2 border-[#8b6f47] dark:border-[#c9a96b]'
                      : 'text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-6 px-6 space-y-4 overflow-hidden"
            >
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-black tracking-widest uppercase text-gray-900 dark:text-white py-1 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Cart Drawer component */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
