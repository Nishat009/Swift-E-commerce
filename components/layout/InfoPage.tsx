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
    <div className="bg-paper min-h-screen">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: title }]} className="mb-10" />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-20">
          <aside className="lg:w-56 flex-shrink-0">
            <nav
              aria-label="Information pages"
              className="no-scrollbar flex lg:flex-col gap-x-6 gap-y-1 overflow-x-auto lg:overflow-visible border-b border-line lg:border-b-0 lg:sticky lg:top-28"
            >
              <p className="hidden lg:block text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400 mb-3">
                Help &amp; Info
              </p>
              {INFO_LINKS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'whitespace-nowrap py-3 lg:py-1.5 text-sm transition-colors -mb-px lg:mb-0 border-b lg:border-b-0',
                      active
                        ? 'text-ink font-medium border-ink'
                        : 'text-stone-500 dark:text-stone-400 border-transparent hover:text-ink'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <motion.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 min-w-0 max-w-3xl"
          >
            <header className="mb-10 border-b border-line pb-8">
              {eyebrow && (
                <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400 mb-3">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-ink">{title}</h1>
              {intro && <p className="mt-4 text-base text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">{intro}</p>}
              {updated && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">Last updated {updated}</p>
              )}
            </header>
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

/** Content block for an info page: hairline-separated, no box. */
export function InfoCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('border-b border-line py-8 first:pt-0 last:border-b-0', className)}>
      {title && <h2 className="text-2xl font-serif font-medium tracking-tight text-ink mb-4">{title}</h2>}
      <div className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
