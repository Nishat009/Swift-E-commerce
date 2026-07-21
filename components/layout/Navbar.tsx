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
  Bell,
  Check,
  Heart,
  ChevronDown,
  Truck,
  RotateCcw,
  Leaf,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useThemeStore } from '@/stores/themeStore';
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
  const { user } = useAuth();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { theme, toggleTheme } = useThemeStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
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
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

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
    setIsSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Primary Navigation Links (Uppercase KOALA UI style)
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
      <div className="bg-[#1c2e24] text-white text-[11px] py-2 px-4 border-b border-emerald-950/60 select-none">
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

      {/* 2. Main Header Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        className={`sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 transition-shadow duration-300 ${
          isScrolled ? 'shadow-md backdrop-blur-md bg-white/95 dark:bg-gray-950/95' : ''
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Left Column: Navigation Links (KOALA UI Layout) */}
            <div className="hidden lg:flex items-center space-x-6">
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
                        className={`flex items-center gap-1 text-xs font-black tracking-widest transition-colors py-6 uppercase cursor-pointer ${
                          isMegaMenuOpen
                            ? 'text-gray-900 dark:text-white border-b-2 border-[#8b6f47]'
                            : 'text-gray-800 dark:text-gray-200 hover:text-[#8b6f47]'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180 text-[#8b6f47]' : ''}`} />
                      </button>

                      {/* Rich Mega Menu Popover Drawer */}
                      <AnimatePresence>
                        {isMegaMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="fixed left-0 right-0 top-[112px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-hidden"
                          >
                            <div className="max-w-[1440px] mx-auto p-8 grid grid-cols-12 gap-8">
                              
                              {/* Product & Solutions Links */}
                              <div className="col-span-3 space-y-4">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-text-muted">
                                  Product
                                </span>
                                <ul className="space-y-2.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                                  <li><Link href="/products?category=Fashion" className="hover:text-[#8b6f47] transition">Features & Clothing</Link></li>
                                  <li><Link href="/dressing-room" className="hover:text-[#8b6f47] transition flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#8b6f47]" /> 3D Dressing Room</Link></li>
                                  <li><Link href="/campaigns" className="hover:text-[#8b6f47] transition">Integrations & Draws</Link></li>
                                  <li><Link href="/products?category=Footwear" className="hover:text-[#8b6f47] transition">Use Cases & Footwear</Link></li>
                                </ul>

                                <span className="block text-[10px] font-black uppercase tracking-widest text-text-muted pt-4 border-t border-gray-100 dark:border-gray-800">
                                  Solutions
                                </span>
                                <ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                                  <li><Link href="/products?tag=New" className="hover:text-[#8b6f47] transition">For Startups</Link></li>
                                  <li><Link href="/products?tag=Bestseller" className="hover:text-[#8b6f47] transition">For Scaleups</Link></li>
                                  <li><Link href="/products?category=Luxury" className="hover:text-[#8b6f47] transition">For Enterprises</Link></li>
                                  <li><Link href="/products?category=Accessories" className="hover:text-[#8b6f47] transition">Remote Teams & Accessories</Link></li>
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Marketing Teams</Link></li>
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Sales & CRM Catalog</Link></li>
                                </ul>
                              </div>

                              {/* Resources Column */}
                              <div className="col-span-3 space-y-4">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-text-muted">
                                  Resources
                                </span>
                                <ul className="space-y-2.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Blog & Catalog</Link></li>
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Video Showcase</Link></li>
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Podcast</Link></li>
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Webinar Series</Link></li>
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Newsletter</Link></li>
                                  <li><Link href="/products" className="hover:text-[#8b6f47] transition">Social Media Post Highlights</Link></li>
                                </ul>
                              </div>

                              {/* Right Side Featured Photo Card */}
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
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 text-white">
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
                    className={`text-xs font-black tracking-widest transition-colors py-6 uppercase ${
                      isActive
                        ? 'text-primary'
                        : 'text-foreground hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Center Column: Centered Brand Logo (KOALA UI Style) */}
            <div className="flex-1 lg:flex-initial text-center lg:text-center">
              <Link href="/" className="inline-block group">
                <span className="text-2xl sm:text-3xl font-serif font-extrabold tracking-widest text-primary group-hover:opacity-90 transition-opacity uppercase">
                  SWIFTCART
                </span>
              </Link>
            </div>

            {/* Right Column: Inline Search Field + Action Icons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Inline Search Field with Image & List Suggestions */}
              <div className="hidden sm:block relative w-44 md:w-64">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                      placeholder="Search products..."
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-100 dark:bg-gray-850 rounded-full text-xs font-medium text-foreground placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary border border-transparent dark:border-gray-800 transition"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </form>

                {/* Suggestions Dropdown Popover */}
                <AnimatePresence>
                  {isFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 p-3.5 space-y-3 text-left"
                    >
                      {searchQuery.trim() === '' && recentSearches.length > 0 && (
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-wider text-text-muted mb-1.5">Recent Searches</span>
                          <div className="flex flex-wrap gap-1.5">
                            {recentSearches.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => executeSearch(q)}
                                className="px-2.5 py-0.5 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQuery.trim() === '' && (
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-wider text-text-muted mb-1.5">Popular Searches</span>
                          <div className="flex flex-wrap gap-1.5">
                            {['Hoodie', 'Jacket', 'Shoes', 'Watch', 'Sofa'].map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => executeSearch(q)}
                                className="px-2.5 py-0.5 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQuery.trim() !== '' && suggestions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="block text-[8px] font-black uppercase tracking-wider text-text-muted">Matching Products</span>
                          <div className="divide-y divide-gray-100 dark:divide-gray-850">
                            {suggestions.map((p) => (
                              <Link
                                key={p.id}
                                href={`/product/${p.id}`}
                                onClick={() => { setIsFocused(false); setSearchQuery(''); }}
                                className="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl px-2 transition"
                              >
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                                  <img src={p.thumbnail} alt={p.title} className="object-cover w-full h-full" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.title}</h5>
                                  <p className="text-[10px] text-[#8b6f47] font-bold font-mono">${p.price}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQuery.trim() !== '' && suggestions.length === 0 && (
                        <p className="text-[10px] text-text-muted py-2 text-center">No matching products for "{searchQuery}"</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Account / Profile */}
              <Link
                href={user ? '/dashboard' : '/auth/login'}
                className="p-1.5 text-gray-800 dark:text-gray-200 hover:text-primary transition-colors"
                title={user ? user.name : 'Account'}
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Wishlist Heart Icon */}
              <Link
                href="/wishlist"
                className={`p-1.5 transition-colors ${
                  pathname === '/wishlist' ? 'text-[#8b6f47]' : 'text-gray-800 dark:text-gray-200 hover:text-[#8b6f47]'
                }`}
                title="My Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Shopping Cart Drawer Icon */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] transition-colors cursor-pointer"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {mounted && totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-[#8b6f47] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs"
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
                className="p-1.5 text-gray-800 dark:text-gray-200 hover:text-[#8b6f47] transition-colors cursor-pointer"
                title="Toggle Dark/Light Mode"
              >
                {mounted && theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Mobile Menu Trigger */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-1.5 text-gray-800 dark:text-gray-200"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Floating Search Bar Popover */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-4 px-4 overflow-hidden"
            >
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search products, categories, brands..."
                    className="w-full px-5 py-3 pl-11 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40 shadow-xs"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </form>

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="mt-3 bg-white dark:bg-gray-950 rounded-2xl p-3 border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-850">
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition"
                      >
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                          <img src={p.thumbnail} alt={p.title} className="object-cover w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.title}</h5>
                          <p className="text-[10px] text-[#8b6f47] font-bold">${p.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    className="text-sm font-black tracking-widest uppercase text-gray-900 dark:text-white py-1 hover:text-[#8b6f47]"
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
