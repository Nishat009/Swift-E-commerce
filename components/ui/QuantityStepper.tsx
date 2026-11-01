'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuantityStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const sizes = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-xs sm:text-sm',
    lg: 'h-12 text-sm sm:text-base',
  };

  const buttonSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-9 h-9',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-between border border-line rounded-full bg-transparent p-1 select-none',
        sizes[size],
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min || disabled}
        className={cn(
          'flex items-center justify-center rounded-full text-ink hover:bg-stone-100 dark:hover:bg-white/10 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer',
          buttonSizes[size]
        )}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="px-3 text-sm font-medium tabular-nums text-ink min-w-[28px] text-center" aria-live="polite">
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max || disabled}
        className={cn(
          'flex items-center justify-center rounded-full text-ink hover:bg-stone-100 dark:hover:bg-white/10 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer',
          buttonSizes[size]
        )}
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
