'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUp, ShieldCheck, User as UserIcon } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cachedGet, peekCached } from '@/lib/cachedGet';

const linkClass = 'text-sm text-stone-600 transition-colors hover:text-ink dark:text-stone-400';
const headingClass = 'mb-5 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-ink';

const HELP_LINKS = [
  { href: '/orders', label: 'Track an order' },
  { href: '/shipping-returns', label: 'Shipping & returns' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact us' },
];

const ABOUT_LINKS = [
  { href: '/about', label: 'Our story' },
  { href: '/dressing-room', label: '3D dressing room' },
  { href: '/campaigns', label: 'Lucky draws' },
];

const ACCOUNT_LINKS = [
  { href: '/auth/login', label: 'Sign in' },
  { href: '/auth/register', label: 'Create account' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/profile', label: 'Profile' },
];

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    const last = peekCached('/categories');
    if (Array.isArray(last?.data)) setCategories(last.data.slice(0, 6));
    cachedGet('/categories')
      .then((body) => {
        if (Array.isArray(body?.data)) setCategories(body.data.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubmittingNewsletter(true);
    setNewsletterStatus(null);
    try {
      const res = await apiClient.post('/newsletter/subscribe', { email: newsletterEmail });
      if (res.data?.success) {
        setNewsletterStatus({ ok: true, text: res.data.message || 'Subscribed successfully!' });
        setNewsletterEmail('');
      }
    } catch (err: any) {
      setNewsletterStatus({ ok: false, text: err.response?.data?.message || 'Failed to subscribe to newsletter.' });
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <footer className="mt-auto border-t border-line bg-surface-muted">
      {/* Newsletter band */}
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-end lg:px-10">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-stone-500">Newsletter</p>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">First to know</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-500">
              New arrivals, private sales and stories from the atelier. Unsubscribe anytime.
            </p>
          </div>
          <div>
            <form onSubmit={handleNewsletterSubscribe} className="flex items-center gap-3 border-b border-ink/50 pb-2 focus-within:border-ink">
              <input
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                aria-label="Email address"
                className="h-10 flex-1 bg-transparent text-sm text-ink placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submittingNewsletter}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
              >
                Subscribe <ArrowRight className="size-3.5" />
              </button>
            </form>
            {newsletterStatus && (
              <p className={'mt-3 text-xs ' + (newsletterStatus.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')} role="status">
                {newsletterStatus.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-12 px-4 py-16 sm:px-6 md:grid-cols-5 lg:px-10">
        <div className="col-span-2">
          <Link href="/shop" className="font-serif text-xl font-semibold uppercase tracking-[0.28em] text-ink">
            SwiftCart
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-500">
            Considered fashion, made to be worn for years. Try every piece on in 3D before it ships.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/auth/login?demo=1" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/25 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink">
              <UserIcon className="size-3.5" /> Login
            </Link>
            <Link href="/admin/login" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink/85">
              <ShieldCheck className="size-3.5" /> Admin Login
            </Link>
          </div>
        </div>

        <div>
          <h3 className={headingClass}>Shop</h3>
          <ul className="space-y-3">
            <li><Link href="/products" className={linkClass}>All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={'/products?category=' + encodeURIComponent(c.slug)} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={headingClass}>Help</h3>
          <ul className="space-y-3">
            {HELP_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={headingClass}>SwiftCart</h3>
          <ul className="space-y-3">
            {ABOUT_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
          <h3 className={`${headingClass} mt-8`}>Account</h3>
          <ul className="space-y-3">
            {ACCOUNT_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>© {new Date().getFullYear()} SwiftCart. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Legal">
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/admin/login" className="hover:text-ink">Admin Login</Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 hover:text-ink cursor-pointer"
            >
              Back to top <ArrowUp className="size-3" />
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
