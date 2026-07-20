'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search, User, Moon, Sun, Menu, X, Bell, Gift, Trophy, Megaphone, Check, Eye } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useThemeStore } from '@/stores/themeStore';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
      // Silently fail — notifications are non-critical
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'campaign_purchase': return '🎟️';
      case 'draw_result': return '🎲';
      case 'winner_announcement': return '🏆';
      case 'campaign_update': return '🔥';
      default: return '✨';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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
  const [isFocused, setIsFocused] = useState(false);

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
          setSuggestions(res.data.data.products || []);
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
    setIsFocused(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/campaigns', label: 'Lucky Draw' },
    { href: '/dressing-room', label: 'Dressing Room' },
  ];

  if (user && user.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin Panel' });
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-40 border-b border-border-theme/50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl shadow-lg'
            : 'bg-background/60 backdrop-blur-md'
        }`}
        style={{
          backgroundImage: `linear-gradient(135deg, var(--primary) 0%, transparent 40%), linear-gradient(225deg, var(--accent) 0%, transparent 30%)`,
          backgroundSize: '100% 100%',
          backgroundBlendMode: 'soft-light',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <ShoppingCart className="w-8 h-8 text-[#8b6f47]" />
              </motion.div>
              <span className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                SwiftCart
              </span>
            </Link>

            {/* Desktop Search */}
            <div className="hidden md:block flex-1 max-w-lg mx-8 relative">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2 pl-10 border border-border-theme rounded-xl bg-background text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 text-xs font-medium"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </form>

              {/* Suggestions Panel */}
              <AnimatePresence>
                {isFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800 rounded-2xl shadow-xl z-50 p-4 text-left space-y-4"
                  >
                    {/* Recent Searches */}
                    {searchQuery.trim() === '' && recentSearches.length > 0 && (
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-wider text-text-muted mb-2">Recent Searches</span>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => executeSearch(q)}
                              className="px-3 py-1 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition border border-gray-100 dark:border-gray-800 cursor-pointer"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Searches */}
                    {searchQuery.trim() === '' && (
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-wider text-text-muted mb-2">Popular Searches</span>
                        <div className="flex flex-wrap gap-2">
                          {['Hoodie', 'Jacket', 'Shoes', 'Watch', 'Premium Bag'].map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => executeSearch(q)}
                              className="px-3 py-1 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition border border-gray-100 dark:border-gray-800 cursor-pointer"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Products Suggestions */}
                    {searchQuery.trim() !== '' && suggestions.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-text-muted">Product Suggestions</span>
                        <div className="divide-y divide-gray-50 dark:divide-gray-850">
                          {suggestions.map((p) => (
                            <Link
                              key={p.id}
                              href={`/product/${p.id}`}
                              onClick={() => { setIsFocused(false); setSearchQuery(''); }}
                              className="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl px-2 transition"
                            >
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border bg-gray-100">
                                <img src={p.thumbnail} alt={p.title} className="object-cover w-full h-full" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.title}</h5>
                                <p className="text-[10px] text-text-muted mt-0.5">${p.price}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Suggestions found */}
                    {searchQuery.trim() !== '' && suggestions.length === 0 && (
                      <p className="text-[10px] text-text-muted py-2 text-center">No suggestions for "{searchQuery}"</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    className={`relative px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 ${
                      pathname === link.href
                        ? 'text-primary bg-cream'
                        : 'text-text-muted hover:bg-background'
                    }`}
                  >
                    {link.label}
                    {pathname === link.href && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-cream rounded-md -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-sm text-text-muted hover:bg-background transition-colors"
                aria-label="Toggle theme"
              >
                <motion.div
                  animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                  transition={{ duration: 0.5 }}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-sm text-text-muted hover:bg-background/50 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 bg-[#c17a5f] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen) fetchNotifications(); }}
                  className="relative p-2 rounded-sm text-text-muted hover:bg-background/50 transition-colors border-0"
                  aria-label="Open notifications"
                >
                  <Bell className="w-5 h-5" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white dark:border-gray-900 shadow-sm"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />

                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800 rounded-2xl shadow-xl z-50 p-4 overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-b pb-2 mb-3 dark:border-gray-800">
                          <span className="font-serif font-bold text-sm text-gray-800 dark:text-gray-250">Notifications</span>
                          {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-[9px] text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline flex items-center gap-1">
                              <Check className="w-3 h-3" /> Mark all read
                            </button>
                          )}
                          {unreadCount === 0 && notifications.length > 0 && (
                            <span className="text-[9px] text-gray-400 font-bold">All caught up</span>
                          )}
                        </div>

                        <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin text-left">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-[10px] text-gray-400 font-bold">No notifications yet</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Purchase campaign items to start earning tickets!</p>
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <Link
                                key={n.id}
                                href={n.relatedCampaign ? `/campaigns/${n.relatedCampaign.id}` : '/campaigns'}
                                onClick={() => setIsNotifOpen(false)}
                                className={`flex gap-2.5 p-2.5 rounded-xl border transition-colors block ${
                                  !n.isRead
                                    ? 'bg-yellow-500/5 dark:bg-yellow-950/20 border-yellow-300/10'
                                    : 'bg-gray-50/50 dark:bg-gray-950/40 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                              >
                                <span className="text-sm flex-shrink-0">{getNotifIcon(n.type)}</span>
                                <div className="text-left flex-1 min-w-0">
                                  <span className="block text-[10px] font-bold text-gray-800 dark:text-gray-250 leading-tight">{n.title}</span>
                                  <span className="block text-[9px] text-gray-400 mt-0.5 whitespace-normal break-words line-clamp-2">{n.message}</span>
                                  <span className={`block text-[8px] font-bold mt-1 ${!n.isRead ? 'text-[#8b6f47] dark:text-[#c9a96b]' : 'text-gray-400'}`}>
                                    {getTimeAgo(n.createdAt)}
                                    {!n.isRead && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                                  </span>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>

                        <div className="text-center border-t pt-2 mt-3.5 dark:border-gray-800">
                          <Link href="/campaigns" onClick={() => setIsNotifOpen(false)} className="text-[10px] font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline">
                            Browse All Active Draws
                          </Link>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link
                  href={user ? '/dashboard' : '/auth/login'}
                  className="p-2 rounded-sm text-text-muted hover:bg-background transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-sm text-foreground"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden overflow-hidden border-t border-border-theme/50"
              >
                <div className="py-4">
                  <motion.form
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSearchSubmit}
                    className="mb-4"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full px-4 py-2 pl-10 border border-border-theme rounded-sm bg-background text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </motion.form>
                  <div className="flex flex-col space-y-2">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.href}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block px-3 py-2 rounded-sm text-base font-medium transition-colors ${
                            pathname === link.href
                              ? 'text-primary bg-cream'
                              : 'text-foreground hover:bg-background'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-between pt-2"
                    >
                      <button
                        onClick={toggleTheme}
                        className="px-3 py-2 rounded-sm text-foreground hover:bg-background flex items-center space-x-2 transition-colors"
                      >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        <span>Toggle Theme</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsCartOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="relative px-3 py-2 rounded-sm text-foreground hover:bg-background flex items-center space-x-2 transition-colors"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {totalItems > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {totalItems > 9 ? '9+' : totalItems}
                          </span>
                        )}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
