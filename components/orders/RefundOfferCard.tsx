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
    <div className="rounded-lg border border-line bg-surface-muted p-5 text-xs">
      <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400 mb-1">Refund offer</p>
      <p className="text-3xl font-serif font-medium tabular-nums text-ink">{money(p.amount)}</p>
      <div className="mt-2 space-y-0.5 text-stone-600 dark:text-stone-400">
        <div className="flex justify-between max-w-xs"><span>Product price</span><span>{money(p.productAmount)}</span></div>
        {p.deduction > 0 && <div className="flex justify-between max-w-xs text-red-600 dark:text-red-400"><span>Handling charge</span><span>-{money(p.deduction)}</span></div>}
      </div>
      {p.deduction > 0 && p.remarks && <p className="mt-2 text-stone-600 dark:text-stone-400">{p.remarks}</p>}
      <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">Delivery charges are not refundable.</p>

      {declining && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Tell us why (optional)"
          className="mt-3 w-full rounded-md border border-line bg-transparent p-3 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none"
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {declining ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setDeclining(false)} disabled={!!saving} >Back</Button>
            <Button size="sm" onClick={() => answer(false)} loading={saving === 'decline'} className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500">Decline offer</Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => answer(true)} loading={saving === 'accept'} disabled={!!saving} >Accept {money(p.amount)}</Button>
            <Button size="sm" variant="outline" onClick={() => setDeclining(true)} disabled={!!saving} >Decline</Button>
          </>
        )}
      </div>
    </div>
  );
}
