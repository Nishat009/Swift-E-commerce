'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  User,
  Moon,
  Sun,
  Menu,
  X,
  Heart,
  ChevronDown,
  Sparkles,
  ArrowRight,
  LogOut,
  Shield,
  LayoutDashboard,
  Package,
  Ticket,
  Clock,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useThemeStore, useApplyTheme } from '@/stores/themeStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useState, useEffect, useCallback, useRef } from 'react';
import CartDrawer from '@/components/ui/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { cachedGet, peekCached } from '@/lib/cachedGet';
import { Product } from '@/types';
import { debounce } from '@/utils/debounce';
import NotificationBell from '@/components/layout/NotificationBell';

const iconLink = 'relative flex size-10 items-center justify-center rounded-full text-stone-800 transition-colors hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/10 cursor-pointer';
const POPULAR_SEARCHES = ['Blazer', 'Jacket', 'Dress', 'Denim', 'Shoes', 'Bag'];

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!availableCurrencies || availableCurrencies.length <= 1) {
      loadCurrencies();
    }
    if (!availableLanguages || availableLanguages.length <= 1) {
      loadLanguages();
    }
  }, [availableCurrencies, availableLanguages, loadCurrencies, loadLanguages]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [navCategories, setNavCategories] = useState<{ name: string; slug: string; image?: string; featured?: boolean }[]>([]);

  useEffect(() => {
    // Last visit's categories first (instant menu), then the fresh list (shared with the footer)
    const last = peekCached('/categories');
    if (Array.isArray(last?.data)) setNavCategories(last.data);
    cachedGet('/categories')
      .then((body) => {
        if (Array.isArray(body?.data)) setNavCategories(body.data);
      })
      .catch(() => {});
  }, []);

  useApplyTheme(theme);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Esc closes search and the mobile menu; the open drawer locks page scroll
  useEffect(() => {
    if (!isSearchOpen && !isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    if (isMenuOpen) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isSearchOpen, isMenuOpen]);

  useEffect(() => {
    if (isSearchOpen) requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [isSearchOpen]);

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
        const res = await apiClient.get(`/products?search=${encodeURIComponent(query)}&limit=6`);
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
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const navLinks = [
    { href: '/products', label: 'Shop' },
    { href: '/products', label: 'Collections', hasMegaMenu: true },
    { href: '/dressing-room', label: 'Dressing Room' },
    { href: '/campaigns', label: 'Lucky Draw' },
  ];

  const featuredCategory = navCategories.find((c) => c.featured && c.image) || navCategories.find((c) => c.image);

  const accountLinks = user
    ? [
        ...(user.role === 'admin' ? [{ href: '/admin', label: 'Admin panel', icon: Shield }] : []),
        { href: '/dashboard', label: 'Account', icon: LayoutDashboard },
        { href: '/orders', label: 'Orders', icon: Package },
        { href: '/wishlist', label: 'Wishlist', icon: Heart },
        { href: '/campaigns/my-tickets', label: 'Draw tickets', icon: Ticket },
        { href: '/profile', label: 'Profile', icon: User },
      ]
    : [];

  const selectClass =
    'appearance-none bg-transparent pr-4 text-[11px] font-medium text-stone-300 hover:text-white focus:outline-none cursor-pointer';

  return (
    <>
      {/* Utility bar */}
      <div className="bg-stone-950 text-stone-300 text-[11px] tracking-wide select-none">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <span className="hidden w-40 md:block" aria-hidden />
          <p className="flex-1 truncate text-center">
            Free shipping over $100
            <span className="mx-2.5 text-stone-600">·</span>
            30-day returns
            <span className="hidden sm:inline"><span className="mx-2.5 text-stone-600">·</span>Secure checkout</span>
          </p>
          <div className="hidden w-40 items-center justify-end gap-4 md:flex">
            {mounted && (
              <>
                <label className="relative flex items-center">
                  <span className="sr-only">Currency</span>
                  <select value={activeCurrencyCode} onChange={(e) => setCurrency(e.target.value)} className={selectClass}>
                    {availableCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code} className="bg-white text-stone-900">
                        {curr.code} {curr.symbol}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 size-3 text-stone-500" />
                </label>
                {availableLanguages.length > 1 && (
                  <label className="relative flex items-center">
                    <span className="sr-only">Language</span>
                    <select value={activeLanguageCode} onChange={(e) => setLanguage(e.target.value)} className={selectClass}>
                      {availableLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-white text-stone-900">
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 size-3 text-stone-500" />
                  </label>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 border-b transition-[background-color,box-shadow] duration-300 ${
          isScrolled
            ? 'border-line bg-paper/90 shadow-[0_1px_12px_rgba(0,0,0,0.04)] backdrop-blur-md'
            : 'border-line bg-paper'
        }`}
      >
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-10">
          {/* Left: menu (mobile) / primary links (desktop) */}
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setIsMenuOpen(true)} className={`${iconLink} -ml-2 lg:hidden`} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <button type="button" onClick={() => setIsSearchOpen(true)} className={`${iconLink} lg:hidden`} aria-label="Search">
              <Search className="size-5" />
            </button>

            <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
              {navLinks.map((link) => {
                if (link.hasMegaMenu) {
                  return (
                    <div
                      key={link.label}
                      className="flex h-[72px] items-center"
                      onMouseEnter={() => setIsMegaMenuOpen(true)}
                      onMouseLeave={() => setIsMegaMenuOpen(false)}
                      onFocus={() => setIsMegaMenuOpen(true)}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsMegaMenuOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsMegaMenuOpen(false);
                      }}
                    >
                      <button
                        type="button"
                        aria-expanded={isMegaMenuOpen}
                        aria-haspopup="true"
                        onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                        className={`flex items-center gap-1 text-[13px] font-medium tracking-wide transition-colors cursor-pointer ${
                          isMegaMenuOpen ? 'text-ink' : 'text-stone-600 hover:text-ink dark:text-stone-300'
                        }`}
                      >
                        {link.label}
                        <ChevronDown className={`size-3.5 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isMegaMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className="absolute inset-x-0 top-full z-50 border-b border-line bg-paper shadow-[0_24px_48px_-24px_rgba(0,0,0,0.18)]"
                          >
                            <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-10 px-10 py-10">
                              <div className="col-span-7">
                                <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Shop by category</p>
                                {navCategories.length === 0 ? (
                                  <p className="text-sm text-stone-500">Loading categories...</p>
                                ) : (
                                  <ul className="grid grid-cols-3 gap-x-8 gap-y-3">
                                    {navCategories.map((c) => (
                                      <li key={c.slug}>
                                        <Link
                                          href={'/products?category=' + encodeURIComponent(c.slug)}
                                          onClick={() => setIsMegaMenuOpen(false)}
                                          className="text-sm text-stone-700 transition-colors hover:text-ink hover:underline underline-offset-4 dark:text-stone-300"
                                        >
                                          {c.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <div className="mt-8 flex gap-6 border-t border-line pt-6 text-sm">
                                  <Link href="/products" onClick={() => setIsMegaMenuOpen(false)} className="font-medium text-ink hover:underline underline-offset-4">
                                    View all products
                                  </Link>
                                  <Link href="/dressing-room" onClick={() => setIsMegaMenuOpen(false)} className="flex items-center gap-1.5 text-stone-600 hover:text-ink dark:text-stone-300">
                                    <Sparkles className="size-3.5 text-[#8b6f47] dark:text-[#c9a96b]" /> 3D Dressing Room
                                  </Link>
                                </div>
                              </div>

                              <div className="col-span-5">
                                {featuredCategory && (
                                  <Link
                                    href={'/products?category=' + encodeURIComponent(featuredCategory.slug)}
                                    onClick={() => setIsMegaMenuOpen(false)}
                                    className="group relative block aspect-[16/10] overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={featuredCategory.image}
                                      alt={featuredCategory.name}
                                      className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">Featured</p>
                                      <p className="mt-1 font-serif text-2xl">{featuredCategory.name}</p>
                                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium">
                                        Discover <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                                      </p>
                                    </div>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`relative text-[13px] font-medium tracking-wide transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-ink after:transition-all ${
                      isActive ? 'text-ink after:w-full' : 'text-stone-600 hover:text-ink after:w-0 hover:after:w-full dark:text-stone-300'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: wordmark */}
          <Link href="/shop" className="justify-self-center" aria-label="SwiftCart home">
            <span className="font-serif text-xl font-semibold uppercase tracking-[0.28em] text-ink sm:text-2xl">SwiftCart</span>
          </Link>

          {/* Right: actions */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button type="button" onClick={() => setIsSearchOpen(true)} className={`${iconLink} hidden lg:flex`} aria-label="Search" title="Search">
              <Search className="size-[19px]" />
            </button>

            <div className="relative hidden sm:block" onMouseEnter={() => setIsUserMenuOpen(true)} onMouseLeave={() => setIsUserMenuOpen(false)}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={iconLink}
                aria-label={user ? `Account: ${user.name}` : 'Account'}
                aria-expanded={isUserMenuOpen}
              >
                <User className="size-[19px]" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-[100] w-64 pt-2"
                  >
                    <div className="rounded-lg border border-line bg-surface p-2 text-left shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)]">
                      {user ? (
                        <>
                          <div className="px-3 pb-3 pt-2">
                            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                            <p className="truncate text-xs text-stone-500">{user.email}</p>
                          </div>
                          <div className="border-t border-line pt-1.5">
                            {accountLinks.map(({ href, label, icon: Icon }) => (
                              <Link
                                key={href}
                                href={href}
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] text-stone-700 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-300 dark:hover:bg-white/5"
                              >
                                <Icon className="size-4 text-stone-400" /> {label}
                              </Link>
                            ))}
                          </div>
                          <div className="mt-1.5 border-t border-line pt-1.5">
                            <button
                              onClick={async () => {
                                setIsUserMenuOpen(false);
                                await logout();
                                router.push('/auth/login');
                              }}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] text-stone-700 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-300 dark:hover:bg-white/5 cursor-pointer"
                            >
                              <LogOut className="size-4 text-stone-400" /> Sign out
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2 p-2">
                          <p className="pb-1 text-sm text-stone-600 dark:text-stone-400">Sign in to track orders, save favourites and check out faster.</p>
                          <Link
                            href="/auth/login"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block rounded-full bg-ink py-2.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-paper transition-opacity hover:opacity-85"
                          >
                            Sign in
                          </Link>
                          <Link
                            href="/auth/register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block rounded-full border border-line py-2.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink"
                          >
                            Create account
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NotificationBell className={`${iconLink} [&>svg]:size-[19px]`} />

            <Link href="/wishlist" className={`${iconLink} hidden sm:flex ${pathname === '/wishlist' ? 'text-ink' : ''}`} aria-label="Wishlist" title="Wishlist">
              <Heart className={`size-[19px] ${pathname === '/wishlist' ? 'fill-current' : ''}`} />
            </Link>

            <button type="button" onClick={toggleTheme} className={`${iconLink} hidden md:flex`} aria-label="Toggle dark mode" title={mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {mounted && theme === 'dark' ? <Sun className="size-[19px]" /> : <Moon className="size-[19px]" />}
            </button>

            <button type="button" onClick={() => setIsCartOpen(true)} className={`${iconLink} -mr-2 sm:mr-0`} aria-label={`Shopping bag${mounted && totalItems ? `, ${totalItems} items` : ''}`} title="Shopping bag">
              <ShoppingBag className="size-[19px]" />
              <AnimatePresence>
                {mounted && totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-paper"
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

      </header>

      {/* Search panel */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[65] bg-stone-950/30 backdrop-blur-[2px]"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 top-0 z-[70] border-b border-line bg-paper shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)]"
              role="dialog"
              aria-label="Search products"
            >
              <div className="mx-auto max-w-3xl px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-ink/80 pb-3">
                  <Search className="size-5 shrink-0 text-stone-400" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for blazers, denim, dresses..."
                    className="h-10 flex-1 bg-transparent text-lg text-ink placeholder:text-stone-400 focus:outline-none sm:text-xl"
                    aria-label="Search products"
                  />
                  <button type="button" onClick={() => setIsSearchOpen(false)} className={iconLink} aria-label="Close search">
                    <X className="size-5" />
                  </button>
                </form>

                {searchQuery.trim() === '' ? (
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    {recentSearches.length > 0 && (
                      <div>
                        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Recent</p>
                        <ul className="space-y-2">
                          {recentSearches.map((q) => (
                            <li key={q}>
                              <button onClick={() => executeSearch(q)} className="flex items-center gap-2 text-sm text-stone-700 hover:text-ink dark:text-stone-300 cursor-pointer">
                                <Clock className="size-3.5 text-stone-400" /> {q}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Popular</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SEARCHES.map((q) => (
                          <button
                            key={q}
                            onClick={() => executeSearch(q)}
                            className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-stone-700 transition-colors hover:border-ink hover:text-ink dark:text-stone-300 cursor-pointer"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Products</p>
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {suggestions.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/product/${p.id}`}
                            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                            className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-stone-100 dark:hover:bg-white/5"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.thumbnail} alt="" className="h-14 w-11 shrink-0 rounded-sm bg-stone-100 object-cover dark:bg-stone-800" />
                            <div className="min-w-0">
                              <p className="truncate text-sm text-ink">{p.title}</p>
                              <p className="text-xs text-stone-500">${p.price}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => executeSearch(searchQuery)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:underline underline-offset-4 cursor-pointer">
                      See all results for &ldquo;{searchQuery}&rdquo; <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-stone-500">No products match &ldquo;{searchQuery}&rdquo; yet. Press Enter to search the full catalog.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/40" onClick={() => setIsMenuOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-paper shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-line px-5">
                <span className="font-serif text-lg font-semibold uppercase tracking-[0.28em] text-ink">SwiftCart</span>
                <button type="button" onClick={() => setIsMenuOpen(false)} className={`${iconLink} -mr-2`} aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <nav className="space-y-1" aria-label="Mobile">
                  {navLinks.filter((l) => !l.hasMegaMenu).map((link) => (
                    <Link key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)} className="block py-2 font-serif text-2xl text-ink">
                      {link.label}
                    </Link>
                  ))}
                </nav>
                {navCategories.length > 0 && (
                  <div className="mt-8">
                    <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Categories</p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {navCategories.map((c) => (
                        <li key={c.slug}>
                          <Link href={'/products?category=' + encodeURIComponent(c.slug)} onClick={() => setIsMenuOpen(false)} className="text-sm text-stone-700 dark:text-stone-300">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-8 border-t border-line pt-6">
                  {user ? (
                    <ul className="space-y-1">
                      {accountLinks.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                          <Link href={href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2 text-sm text-stone-700 dark:text-stone-300">
                            <Icon className="size-4 text-stone-400" /> {label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={async () => { setIsMenuOpen(false); await logout(); router.push('/auth/login'); }}
                          className="flex items-center gap-3 py-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer"
                        >
                          <LogOut className="size-4 text-stone-400" /> Sign out
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/auth/login" onClick={() => setIsMenuOpen(false)} className="rounded-full bg-ink py-2.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-paper">Sign in</Link>
                      <Link href="/auth/register" onClick={() => setIsMenuOpen(false)} className="rounded-full border border-line py-2.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-ink">Register</Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
                {mounted && (
                  <select
                    value={activeCurrencyCode}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-full border border-line bg-transparent px-3 py-1.5 text-xs text-ink focus:outline-none"
                    aria-label="Currency"
                  >
                    {availableCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code} className="bg-white text-stone-900">{curr.code} {curr.symbol}</option>
                    ))}
                  </select>
                )}
                <button type="button" onClick={toggleTheme} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-ink cursor-pointer">
                  {mounted && theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                  {mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
