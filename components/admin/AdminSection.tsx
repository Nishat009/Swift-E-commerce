'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { errMsg } from './adminUtils';

/** Spinner shown while an admin section loads its data. */
export function SectionLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
      <RefreshCw className="w-8 h-8 animate-spin text-[#8b6f47]" />
      <span className="text-sm font-semibold">Gathering backend registers...</span>
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
