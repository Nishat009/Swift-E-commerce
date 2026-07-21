'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'stat';
}

export default function Skeleton({ variant = 'rectangular', className, ...props }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200 dark:bg-gray-800 rounded';

  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'w-full h-32 rounded-2xl',
    card: 'w-full h-80 rounded-[32px]',
    stat: 'w-full h-24 rounded-2xl',
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
    <div className="overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[32px] p-5 h-80 sm:h-96 flex flex-col justify-end space-y-4">
      <Skeleton variant="rectangular" className="flex-1 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/3 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton variant="text" className="w-3/4 h-5 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton variant="text" className="w-1/2 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <Skeleton variant="rectangular" className="h-10 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-pulse">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3">
          <Skeleton variant="text" className="w-32 h-6" />
          <Skeleton variant="text" className="w-20 h-5 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="text" className="w-16 h-4" />
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
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-20 h-4" />
            <Skeleton variant="text" className="w-12 h-8" />
          </div>
          <Skeleton variant="circular" className="w-12 h-12" />
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
            <Skeleton variant="rectangular" className="h-10 rounded-xl" />
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
        <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl w-full" />
      ))}
    </div>
  );
}
