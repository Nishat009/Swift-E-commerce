'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search, User, Moon, Sun, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useThemeStore } from '@/stores/themeStore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CartDrawer from '@/components/ui/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { theme, toggleTheme } = useThemeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const [isCartOpen, setIsCartOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-40 border-b border-[#e8e0d6] shadow-sm transition-all duration-300 ${
          isScrolled
            ? 'bg-white/98 backdrop-blur-md shadow-md'
            : 'bg-white'
        }`}
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
              <span className="text-xl font-serif font-bold text-[#2c2c2c] group-hover:text-[#8b6f47] transition-colors">
                SwiftCart
              </span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
              <motion.div
                className="relative w-full"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 border border-[#e8e0d6] rounded-sm bg-[#faf9f6] text-[#2c2c2c] placeholder-[#9c9c9c] focus:outline-none focus:ring-2 focus:ring-[#8b6f47] transition-all duration-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </motion.div>
            </form>

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
                        ? 'text-[#8b6f47] bg-[#f5f1eb]'
                        : 'text-[#6b6b6b] hover:bg-[#faf9f6]'
                    }`}
                  >
                    {link.label}
                    {pathname === link.href && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-md -z-10"
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
                className="p-2 rounded-sm text-[#6b6b6b] hover:bg-[#faf9f6] transition-colors"
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
                className="relative p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link
                  href="/auth/login"
                  className="p-2 rounded-sm text-[#6b6b6b] hover:bg-[#faf9f6] transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300"
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
                className="md:hidden overflow-hidden border-t border-gray-200 dark:border-gray-800"
              >
                <div className="py-4">
                  <motion.form
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSearch}
                    className="mb-4"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                            pathname === link.href
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'text-gray-700 dark:text-gray-300'
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
                        className="px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 flex items-center space-x-2"
                      >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        <span>Toggle Theme</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsCartOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="relative px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 flex items-center space-x-2"
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
