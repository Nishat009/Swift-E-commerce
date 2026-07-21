import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'gold' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function Badge({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-bold tracking-wider uppercase rounded-full border shadow-2xs transition-colors';

  const variants = {
    primary: 'bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] border-[#8b6f47]/20',
    gold: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    warning: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    outline: 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  };

  const sizes = {
    sm: 'text-[8px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3.5 py-1.5 gap-2',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
