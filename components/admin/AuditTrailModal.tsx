'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { History, X } from 'lucide-react';
import { AdminEmpty } from './AdminUI';

/** Before/after history of admin changes to one record (an order, a campaign...). */
export default function AuditTrailModal({ trail, onClose }: { trail: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" aria-labelledby="audit-trail-title" className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/[0.06] dark:hover:text-stone-200 cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <h3 id="audit-trail-title" className="pr-8 text-base font-semibold text-stone-900 dark:text-white">Change history</h3>
        <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">Every admin change to this record, with the values before and after.</p>

        <div className="mt-5">
          {trail.length === 0 ? (
            <div className="rounded-lg border border-line">
              <AdminEmpty icon={History} title="No changes recorded yet" description="Admin edits to this record will show up here." />
            </div>
          ) : (
            <ol className="space-y-3">
              {trail.map((entry, idx) => (
                <li key={idx} className="rounded-lg border border-line p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-stone-500 dark:text-stone-400">
                    <span>
                      <span className="font-medium text-stone-700 dark:text-stone-300">{entry.changedBy?.name || 'Administrator'}</span>
                      {entry.changedBy?.email && <> ({entry.changedBy.email})</>}
                    </span>
                    <span className="tabular-nums">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1.5 font-medium text-stone-900 dark:text-stone-100">{entry.changeSummary}</p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="mb-1 block text-xs font-medium text-red-700 dark:text-red-300">Before</span>
                      <pre className="max-h-36 overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-stone-50 p-2 font-mono text-[11px] leading-relaxed text-stone-700 dark:bg-white/[0.03] dark:text-stone-300">
                        {JSON.stringify(entry.previousState, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-medium text-emerald-700 dark:text-emerald-300">After</span>
                      <pre className="max-h-36 overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-stone-50 p-2 font-mono text-[11px] leading-relaxed text-stone-700 dark:bg-white/[0.03] dark:text-stone-300">
                        {JSON.stringify(entry.newState, null, 2)}
                      </pre>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

/** Loads a record's audit trail on demand; render `modal` once in the section that uses it. */
export function useAuditTrail() {
  const toast = useToast();
  const [trail, setTrail] = useState<any[] | null>(null);

  const open = async (entityType: string, entityId: string) => {
    try {
      const res = await apiClient.get(`/enterprise/audit/${entityType}/${entityId}`);
      if (res.data?.success) setTrail(res.data.data || []);
    } catch {
      toast.error('Failed to load audit trail history.');
    }
  };

  const modal = trail ? <AuditTrailModal trail={trail} onClose={() => setTrail(null)} /> : null;
  return { open, modal };
}
