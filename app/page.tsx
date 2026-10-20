'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Box,
  CreditCard,
  Gift,
  Globe,
  Menu,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Shirt,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useDemoAccess } from '@/components/auth/DemoLoginButtons';

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#showcase', label: 'Showcase' },
  { href: '#tech', label: 'Tech stack' },
  { href: '#demo', label: 'Demo access' },
];

const FEATURES = [
  { icon: Shirt, title: '3D dressing room', text: 'Customers put catalog pieces or their own garment photos on a 3D mannequin before they buy.' },
  { icon: Search, title: 'Smart catalog', text: 'Search with suggestions, filters by size, colour and price, product comparison and wishlists.' },
  { icon: MessageCircle, title: 'Shopping assistant', text: 'A chat stylist that builds outfits from the catalog by occasion, season and budget.' },
  { icon: CreditCard, title: 'Three ways to pay', text: 'Stripe card payments, bKash and cash on delivery, with totals always calculated on the server.' },
  { icon: PackageCheck, title: 'Orders & returns', text: 'Order tracking, cancellations, return requests, refunds and email notifications.' },
  { icon: Gift, title: 'Lucky-draw campaigns', text: 'Sell campaign tickets, run fair draws and announce winners to boost engagement.' },
  { icon: ShieldCheck, title: 'Secure accounts', text: 'Email + password, Google Sign-In, email OTP, two-factor authentication and login lockout.' },
  { icon: BarChart3, title: 'Powerful admin panel', text: 'Sales dashboard, products, stock, coupons, customers, wallet, reports and audit logs.' },
  { icon: Globe, title: 'Multi-currency', text: 'Prices stored in USD and shown in the shopper’s currency, including BDT for bKash.' },
];

const SHOWCASE = [
  {
    image: '/landing/storefront.jpg',
    eyebrow: 'Storefront',
    title: 'An editorial shop that sells.',
    text: 'A cinematic homepage, category tiles, new-in and bestseller rails, product pages with reviews and size guides, and a cart drawer that keeps shoppers moving.',
    points: ['Responsive on phone, tablet and desktop', 'Light and dark themes', 'Product comparison and wishlists'],
  },
  {
    image: '/landing/dressing-room.jpg',
    eyebrow: 'Virtual try-on',
    title: 'See it on before you buy it.',
    text: 'The Three.js dressing room layers dresses, tops, jackets and trousers on a mannequin. Shoppers rotate, zoom and add the whole look to the cart in one click.',
    points: ['Works with catalog items or uploaded photos', 'Mix layers into full outfits', 'Add the outfit straight to the cart'],
  },
  {
    image: '/landing/admin.jpg',
    eyebrow: 'Admin panel',
    title: 'Run the store from one dashboard.',
    text: 'Revenue and order stats, low-stock alerts, product and category management, order processing, refunds, coupons, campaigns, newsletters and customer messages.',
    points: ['Role-based access with a super-admin level', 'Store wallet and payment records', 'Full activity and audit logs'],
  },
];

const STACK = [
  { group: 'Frontend', items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Zustand', 'Three.js', 'Framer Motion'] },
  { group: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'JWT auth', 'express-validator'] },
  { group: 'Integrations', items: ['Stripe', 'bKash', 'Google Sign-In', 'Cloudinary', 'Nodemailer'] },
];

const STATS = [
  { value: '3', label: 'payment methods' },
  { value: '15+', label: 'admin modules' },
  { value: '3D', label: 'virtual try-on' },
  { value: '100%', label: 'responsive' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { credentials } = useDemoAccess();
  const credentialFor = (role: 'admin' | 'customer') => credentials.find((c) => c.role === role);

  return (
    <div className="bg-[#faf9f6] text-[#2c2c2c] dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#17110f]/90 text-[#f8f1e8] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-serif text-xl font-extrabold uppercase tracking-widest text-[#c9a96b]">SwiftCart</Link>
          <nav className="hidden items-center gap-7 text-sm text-[#e8dccb] md:flex" aria-label="Landing">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-white">{n.label}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/admin/login" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold transition-colors hover:border-[#c9a96b] hover:text-[#c9a96b]">
              Admin Panel
            </Link>
            <Link href="/auth/login" className="rounded-full bg-[#c9a96b] px-5 py-2 text-xs font-bold text-[#17110f] transition-colors hover:bg-[#d8bb80]">
              Live Demo
            </Link>
          </div>
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="p-2 md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="space-y-1 border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-[#e8dccb]">{n.label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/admin/login" className="flex-1 rounded-full border border-white/20 py-2.5 text-center text-xs font-bold">Admin Panel</Link>
              <Link href="/auth/login" className="flex-1 rounded-full bg-[#c9a96b] py-2.5 text-center text-xs font-bold text-[#17110f]">Live Demo</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-[#17110f] text-[#f8f1e8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(201,169,107,0.22),transparent_50%),radial-gradient(circle_at_85%_80%,rgba(193,122,95,0.18),transparent_45%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#c9a96b]/40 bg-[#c9a96b]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9a96b]">
              Full-stack fashion e-commerce
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              A complete fashion store, <span className="italic text-[#c9a96b]">ready to launch.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#d9cdbd] sm:text-lg">
              SwiftCart is a modern online clothing shop with a 3D virtual dressing room, a shopping assistant,
              Stripe and bKash payments, and an admin panel that runs the whole business.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/login" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a96b] px-7 py-3.5 text-sm font-bold text-[#17110f] shadow-lg shadow-[#c9a96b]/20 transition-colors hover:bg-[#d8bb80]">
                Live Demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/admin/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold transition-colors hover:border-[#c9a96b] hover:text-[#c9a96b]">
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </Link>
              <Link href="/shop" className="inline-flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-bold text-[#d9cdbd] underline-offset-4 hover:text-white hover:underline">
                Browse the store
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-4 gap-4 border-t border-white/10 pt-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-serif text-2xl text-white sm:text-3xl">{s.value}</dd>
                  <dd className="mt-1 text-[11px] leading-tight text-[#a89b8a]">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#241b17] shadow-2xl shadow-black/50">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c17a5f]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#c9a96b]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#9caf88]" />
              </div>
              <Image src="/landing/storefront.jpg" alt="SwiftCart storefront homepage" width={1440} height={900} priority className="h-auto w-full" />
            </div>
            <div className="absolute -bottom-10 -left-4 hidden w-[42%] overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/60 sm:block lg:-left-10">
              <Image src="/landing/admin.jpg" alt="SwiftCart admin dashboard" width={1440} height={900} className="h-auto w-full" />
            </div>
            <div className="absolute -right-3 -top-6 hidden w-[24%] overflow-hidden rounded-[1.4rem] border-4 border-[#0d0907] shadow-2xl shadow-black/60 sm:block lg:-right-8">
              <Image src="/landing/mobile.jpg" alt="SwiftCart on a phone" width={390} height={844} className="h-auto w-full" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8b6f47] dark:text-[#c9a96b]">Key features</p>
          <h2 className="mt-3 font-serif text-3xl text-gray-900 sm:text-4xl dark:text-white">Everything a fashion brand needs to sell online</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">From the first product view to the refund, every step of the shopping journey is built in.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-[#e8e0d6] bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-[#8b6f47]/5 dark:border-gray-800 dark:bg-gray-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8b6f47]/10 text-[#8b6f47] dark:bg-[#c9a96b]/10 dark:text-[#c9a96b]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="showcase" className="scroll-mt-16 border-y border-[#e8e0d6] bg-[#f3f1ed] py-20 lg:py-28 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:space-y-28 lg:px-8">
          {SHOWCASE.map((s, i) => (
            <div key={s.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={i % 2 ? 'lg:order-2' : ''}>
                <div className="overflow-hidden rounded-2xl border border-[#e8e0d6] bg-white shadow-xl shadow-[#8b6f47]/10 dark:border-gray-800">
                  <Image src={s.image} alt={`${s.eyebrow} screenshot`} width={1440} height={900} className="h-auto w-full" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8b6f47] dark:text-[#c9a96b]">{s.eyebrow}</p>
                <h3 className="mt-3 font-serif text-3xl text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">{s.text}</p>
                <ul className="mt-6 space-y-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96b]" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="tech" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8b6f47] dark:text-[#c9a96b]">Tech stack</p>
          <h2 className="mt-3 font-serif text-3xl text-gray-900 sm:text-4xl dark:text-white">Built on a modern, proven stack</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Clean TypeScript on the front, a tested REST API on the back, and the database schema ready to deploy.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STACK.map((s) => (
            <div key={s.group} className="rounded-2xl border border-[#e8e0d6] bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                <Box className="h-4 w-4 text-[#8b6f47] dark:text-[#c9a96b]" /> {s.group}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <span key={item} className="rounded-full bg-[#f3f1ed] px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="scroll-mt-16 bg-[#17110f] text-[#f8f1e8]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">Try SwiftCart now</h2>
            <p className="mt-4 text-[#d9cdbd]">Explore the shop as a customer, or open the admin panel. One click, no sign-up needed.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            {[
              { role: 'customer' as const, icon: UserIcon, title: 'Customer demo', text: 'Browse, try on, add to cart, check out and track orders.', href: '/auth/login', cta: 'Live Demo' },
              { role: 'admin' as const, icon: ShieldCheck, title: 'Admin demo', text: 'Dashboard, products, orders, campaigns, customers and reports.', href: '/admin/login', cta: 'Open Admin Panel' },
            ].map(({ role, icon: Icon, title, text, href, cta }) => {
              const cred = credentialFor(role);
              return (
                <div key={role} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9a96b]/15 text-[#c9a96b]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-[#d9cdbd]">{text}</p>
                  {cred && (
                    <p className="mt-4 rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-[#e8dccb]">
                      {cred.email}<br />{cred.password}
                    </p>
                  )}
                  <Link href={href} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a96b] px-6 py-3 text-sm font-bold text-[#17110f] transition-colors hover:bg-[#d8bb80]">
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0d0907] text-[#a89b8a]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6 lg:px-8">
          <span className="font-serif font-extrabold uppercase tracking-widest text-[#c9a96b]">SwiftCart</span>
          <nav className="flex flex-wrap items-center justify-center gap-5" aria-label="Footer">
            <Link href="/shop" className="hover:text-white">Shop</Link>
            <Link href="/auth/login" className="hover:text-white">Live Demo</Link>
            <Link href="/admin/login" className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a96b]/40 px-3 py-1.5 text-[#c9a96b] hover:bg-[#c9a96b]/10">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin Panel
            </Link>
          </nav>
          <p>© {new Date().getFullYear()} SwiftCart</p>
        </div>
      </footer>
    </div>
  );
}
