import React from 'react';
import { cn } from '@/lib/utils';

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export const PILL_TONES: Record<PillTone, string> = {
  neutral: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  accent: 'bg-[#8b6f47]/10 text-[#6b5435] dark:bg-[#c9a96b]/15 dark:text-[#c9a96b]',
};

export const ORDER_STATUS_TONE: Record<string, PillTone> = {
  Pending: 'warning',
  Processing: 'neutral',
  Confirmed: 'neutral',
  Packed: 'neutral',
  Shipped: 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
  Returned: 'warning',
};

export default function StatusPill({ tone = 'neutral', className, children }: { tone?: PillTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap', PILL_TONES[tone], className)}>
      {children}
    </span>
  );
}
