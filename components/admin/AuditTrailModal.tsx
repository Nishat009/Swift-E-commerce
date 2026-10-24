'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { ShieldAlert, X } from 'lucide-react';

/** Before/after history of admin changes to one record (an order, a campaign...). */
export default function AuditTrailModal({ trail, onClose }: { trail: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl overflow-y-auto max-h-[80vh] shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-600" /> Administrative Audit Trail Logs
        </h3>

        <div className="space-y-4">
          {trail.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              No configuration modifications recorded yet for this entity.
            </div>
          ) : (
            <div className="space-y-3.5">
              {trail.map((entry, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 border-b pb-1 mb-2 dark:border-gray-800">
                    <span className="font-bold">By: {entry.changedBy?.name || 'Administrator'} ({entry.changedBy?.email})</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{entry.changeSummary}</p>

                  {/* Before / After grid representation */}
                  <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t dark:border-gray-800 text-[10px]">
                    <div>
                      <span className="block font-bold text-red-500 uppercase tracking-widest text-[8px] mb-1">Previous Values:</span>
                      <pre className="p-2 bg-red-500/5 rounded border border-red-500/10 font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
                        {JSON.stringify(entry.previousState, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="block font-bold text-green-500 uppercase tracking-widest text-[8px] mb-1">Updated Values:</span>
                      <pre className="p-2 bg-green-500/5 rounded border border-green-500/10 font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
                        {JSON.stringify(entry.newState, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
