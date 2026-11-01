'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'classic';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8b6f47]/50 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.08em] whitespace-nowrap cursor-pointer select-none';

  const variants = {
    primary: 'bg-ink text-paper hover:bg-ink/85 shadow-xs',
    secondary: 'bg-[#8b6f47] text-white hover:bg-[#6b5435] shadow-xs',
    outline: 'border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper bg-transparent',
    ghost: 'text-ink hover:bg-ink/5',
    classic: 'bg-[#8b6f47] text-white hover:bg-[#6b5435] shadow-xs',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[11px]',
    md: 'px-6 py-2.5 text-xs',
    lg: 'px-8 py-3.5 text-[13px]',
  };

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
