import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubmittingNewsletter(true);
    try {
      const res = await apiClient.post('/newsletter/subscribe', { email: newsletterEmail });
      if (res.data?.success) {
        alert(res.data.message || 'Subscribed successfully!');
        setNewsletterEmail('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to subscribe to newsletter.');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <footer className="bg-cream border-t border-border-theme mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">SwiftCart</span>
            </Link>
            <p className="text-sm text-text-muted">
              Your one-stop shop for all your shopping needs. Quality products, fast delivery.
            </p>
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Subscribe to our newsletter</h4>
              <form onSubmit={handleNewsletterSubscribe} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 text-xs border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingNewsletter}
                  className="text-xs bg-[#8b6f47] dark:bg-[#c9a96b] text-white dark:text-gray-950 px-4 py-2 rounded-xl font-bold hover:bg-[#725a38] transition-all disabled:opacity-50"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-text-muted hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=electronics" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/products?category=clothing" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Clothing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-text-muted hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-text-muted hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/login" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border-theme text-center">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} SwiftCart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

