'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types';
import { refreshNotifications } from '@/utils/notifications';

const money = (n?: number) => `$${Number(n || 0).toFixed(2)}`;

/** The refund our team offered for a return; the customer accepts or declines it */
export default function RefundOfferCard({ order, onUpdated }: { order: Order; onUpdated: (order: Order) => void }) {
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState<'accept' | 'decline' | null>(null);
  const p = order.returnRequest?.proposal;
  if (order.returnRequest?.status !== 'Proposed' || !p) return null;

  const answer = async (accept: boolean) => {
    setSaving(accept ? 'accept' : 'decline');
    try {
      const res = await apiClient.post(`/orders/${order.id}/return-request/respond`, { accept, note: note.trim() || undefined });
      onUpdated(res.data?.data);
      refreshNotifications();
      toast.success(accept ? 'Offer accepted. We will send your refund shortly.' : 'Offer declined. Our team will get back to you.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not send your answer. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[#8b6f47]/30 bg-[#8b6f47]/5 p-4 text-xs">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b] mb-1">Refund offer</p>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{money(p.amount)}</p>
      <div className="mt-2 space-y-0.5 text-gray-600 dark:text-gray-400">
        <div className="flex justify-between max-w-xs"><span>Product price</span><span>{money(p.productAmount)}</span></div>
        {p.deduction > 0 && <div className="flex justify-between max-w-xs text-red-600 dark:text-red-400"><span>Handling charge</span><span>-{money(p.deduction)}</span></div>}
      </div>
      {p.deduction > 0 && p.remarks && <p className="mt-2 text-gray-600 dark:text-gray-400">{p.remarks}</p>}
      <p className="mt-2 text-[11px] text-gray-400">Delivery charges are not refundable.</p>

      {declining && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Tell us why (optional)"
          className="mt-3 w-full text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40"
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {declining ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setDeclining(false)} disabled={!!saving} className="rounded-full text-[11px] font-bold px-4">Back</Button>
            <Button size="sm" onClick={() => answer(false)} loading={saving === 'decline'} className="rounded-full text-[11px] font-bold px-4 bg-red-600 hover:bg-red-700 text-white border-0">Decline offer</Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => answer(true)} loading={saving === 'accept'} disabled={!!saving} className="rounded-full text-[11px] font-bold px-5 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0">Accept {money(p.amount)}</Button>
            <Button size="sm" variant="outline" onClick={() => setDeclining(true)} disabled={!!saving} className="rounded-full text-[11px] font-bold px-4">Decline</Button>
          </>
        )}
      </div>
    </div>
  );
}
