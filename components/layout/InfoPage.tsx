'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Info, Mail, HelpCircle, Truck, FileText, ShieldCheck } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { cn } from '@/lib/utils';

export const INFO_LINKS = [
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/shipping-returns', label: 'Shipping & Returns', icon: Truck },
  { href: '/terms', label: 'Terms & Conditions', icon: FileText },
  { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
];

interface InfoPageProps {
  title: string;
  eyebrow?: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}

export default function InfoPage({ title, eyebrow, intro, updated, children }: InfoPageProps) {
  const pathname = usePathname();

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: title }]} className="mb-8" />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <aside className="lg:w-64 flex-shrink-0">
            <nav
              aria-label="Information pages"
              className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-24"
            >
              <p className="hidden lg:block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 px-4">
                Help &amp; Info
              </p>
              {INFO_LINKS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 whitespace-nowrap py-2.5 px-4 rounded-xl text-xs font-bold border transition-all duration-300',
                      active
                        ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm'
                        : 'text-gray-500 border-transparent hover:text-[#8b6f47] dark:hover:text-[#c9a96b] hover:bg-white/60 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <motion.main
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 min-w-0"
          >
            <header className="mb-8">
              {eyebrow && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f47] dark:text-[#c9a96b] mb-2">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">{title}</h1>
              {intro && <p className="mt-3 text-sm text-text-muted max-w-2xl leading-relaxed">{intro}</p>}
              {updated && (
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Last updated {updated}</p>
              )}
            </header>
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

/** Card wrapper for a block of info-page content. */
export function InfoCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px] p-6 sm:p-8 shadow-sm',
        className
      )}
    >
      {title && <h2 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-3">{title}</h2>}
      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
