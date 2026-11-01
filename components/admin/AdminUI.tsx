'use client';

import React from 'react';
import { Search, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Building blocks shared by every admin tab, so the whole panel reads as one system. */

export const adminCard = 'rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)]';

/** Table class names: wrap the <table> in `table.wrap`, then use the rest on the matching elements. */
export const table = {
  wrap: 'overflow-x-auto rounded-lg border border-line',
  table: 'w-full text-sm text-left',
  thead: 'bg-stone-50 dark:bg-white/[0.03] text-stone-500 dark:text-stone-400',
  th: 'px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap',
  tbody: 'divide-y divide-line',
  tr: 'hover:bg-stone-50/70 dark:hover:bg-white/[0.02] transition-colors',
  td: 'px-4 py-3 align-middle',
};

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'violet';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700 ring-stone-500/15 dark:bg-white/[0.06] dark:text-stone-300 dark:ring-white/10',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20',
  accent: 'bg-[#8b6f47]/10 text-[#6b5435] ring-[#8b6f47]/20 dark:bg-[#c9a96b]/10 dark:text-[#d9bd85] dark:ring-[#c9a96b]/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
};

export function Pill({ tone = 'neutral', dot = false, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', toneClasses[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {children}
    </span>
  );
}

const ORDER_TONES: Record<string, Tone> = {
  Pending: 'warning',
  Processing: 'info',
  Confirmed: 'info',
  Packed: 'violet',
  Shipped: 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
  Returned: 'neutral',
};

const PAYMENT_TONES: Record<string, Tone> = {
  Paid: 'success',
  Pending: 'warning',
  Failed: 'danger',
  'Refund Needed': 'danger',
  Refunded: 'neutral',
};

/** Order or payment status with a consistent colour per state (always shown with its label). */
export function StatusPill({ status, kind = 'order', className }: { status?: string | null; kind?: 'order' | 'payment'; className?: string }) {
  const label = status || 'Pending';
  const tone = (kind === 'payment' ? PAYMENT_TONES : ORDER_TONES)[label] || 'neutral';
  return <Pill tone={tone} dot className={className}>{label}</Pill>;
}

/** White card with an optional header row (title, description, actions). */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn(adminCard, className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Heading row inside a tab: replaces the old uppercase section titles. */
export function SectionHeader({ title, description, actions, className }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** KPI tile: sentence-case label, a large value and an optional hint underneath. */
export function StatCard({ label, value, hint, icon: Icon, className }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn(adminCard, 'p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-stone-500 dark:text-stone-400">{label}</span>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-white/[0.06] dark:text-stone-300">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-stone-900 dark:text-white">{value}</div>
      {hint && <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">{hint}</div>}
    </div>
  );
}

/** Search input with a leading icon. */
export function SearchField({ value, onChange, placeholder = 'Search...', className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100"
      />
    </label>
  );
}

/** Segmented filter (All / Pending / ...) with optional counts. */
export function FilterTabs<T extends string>({ options, value, onChange, className }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (value: T) => void; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex items-center gap-1 overflow-x-auto rounded-lg bg-stone-100 p-1 dark:bg-white/[0.05]', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              active ? 'bg-surface text-stone-900 shadow-xs dark:bg-white/10 dark:text-white' : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            )}
          >
            {o.label}
            {typeof o.count === 'number' && (
              <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', active ? 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-200' : 'bg-stone-200/70 text-stone-600 dark:bg-white/10 dark:text-stone-400')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Empty list placeholder. */
export function AdminEmpty({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-white/[0.06] dark:text-stone-400">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{title}</p>
      {description && <p className="max-w-sm text-xs text-stone-500 dark:text-stone-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Small admin buttons (the shop Button is uppercase and pill-shaped; admin actions are quieter). */
export function AdminButton({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }) {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 shadow-xs',
    secondary: 'border border-line bg-surface text-stone-700 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-200 dark:hover:bg-white/[0.06] shadow-xs',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/[0.06]',
    danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50',
  };
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-3.5 text-sm' };
  return (
    <button
      type="button"
      {...props}
      className={cn('inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer whitespace-nowrap', variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
}
