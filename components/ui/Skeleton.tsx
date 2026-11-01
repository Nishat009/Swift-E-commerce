'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'stat';
}

export default function Skeleton({ variant = 'rectangular', className, ...props }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-stone-200 dark:bg-stone-800 rounded-sm';

  const variantClasses = {
    text: 'h-4 w-full rounded-sm',
    circular: 'rounded-full',
    rectangular: 'w-full h-32 rounded-sm',
    card: 'w-full h-80 rounded-sm',
    stat: 'w-full h-24 rounded-sm',
  };

  return (
    <div
      className={cn(baseClass, variantClasses[variant], className)}
      {...props}
    />
  );
}

// Complex Skeletons
export function ProductSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton variant="rectangular" className="aspect-[3/4] h-auto" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-3/4 h-5" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="border-b border-line py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div className="flex gap-4 flex-1 w-full">
        <Skeleton variant="rectangular" className="w-16 h-auto aspect-[3/4]" />
        <div className="space-y-3 flex-1">
          <Skeleton variant="text" className="w-32 h-5" />
          <div className="flex gap-4">
            <Skeleton variant="text" className="w-24 h-4" />
            <Skeleton variant="text" className="w-16 h-4" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 w-full sm:w-auto">
        <Skeleton variant="rectangular" className="h-9 w-24 rounded-full" />
        <Skeleton variant="rectangular" className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-line rounded-lg p-6 space-y-2">
          <Skeleton variant="text" className="w-20 h-4" />
          <Skeleton variant="text" className="w-12 h-8" />
        </div>
      ))}
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton variant="circular" className="w-20 h-20" />
        <div className="space-y-2">
          <Skeleton variant="text" className="w-36 h-6" />
          <Skeleton variant="text" className="w-48 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" className="w-20 h-4" />
            <Skeleton variant="rectangular" className="h-11 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 bg-stone-200 dark:bg-stone-800 rounded-sm w-full" />
      ))}
    </div>
  );
}
