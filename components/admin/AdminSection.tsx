'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { errMsg } from './adminUtils';

/** Skeleton shown while an admin section loads its data. */
export function SectionLoading() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading">
      <div className="flex items-center justify-between gap-4">
        <div className="h-9 w-64 max-w-full rounded-lg bg-stone-200/70 dark:bg-white/[0.06]" />
        <div className="h-9 w-28 rounded-lg bg-stone-200/70 dark:bg-white/[0.06]" />
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="h-10 bg-stone-100 dark:bg-white/[0.03]" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-line px-4 py-3.5">
            <div className="h-3 w-1/4 rounded bg-stone-200/70 dark:bg-white/[0.06]" />
            <div className="h-3 w-1/5 rounded bg-stone-200/50 dark:bg-white/[0.04]" />
            <div className="h-3 w-1/6 rounded bg-stone-200/50 dark:bg-white/[0.04]" />
            <div className="ml-auto h-6 w-16 rounded-md bg-stone-200/60 dark:bg-white/[0.05]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/** Runs a section's loader once when it mounts; returns true while it is loading. */
export function useSectionLoad(load: () => Promise<void>) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    load()
      .catch((err) => toast.error(errMsg(err, 'Failed to load this section from the server.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return loading;
}
