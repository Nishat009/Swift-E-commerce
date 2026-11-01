'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Order, RETURN_REASONS, FULL_REFUND_DAYS } from '@/types';
import { refreshNotifications } from '@/utils/notifications';

interface Props {
  order: Order;
  onClose: () => void;
  onSubmitted: (order: Order) => void;
}

// Customer form to return a delivered order and ask for a refund (staff approve or reject it)
export default function ReturnRequestModal({ order, onClose, onSubmitted }: Props) {
  const toast = useToast();
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const deadline = order.returnDeadline ? new Date(order.returnDeadline) : null;
  const paid = order.paymentStatus === 'Paid';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setError('Choose a reason for the return.');
    if (reason === 'Other' && details.trim().length < 10) return setError('Please tell us a little more (at least 10 characters).');
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/orders/${order.id}/return-request`, { reason, details: details.trim() });
      toast.success('Return requested. We will review it within 2 business days.');
      refreshNotifications();
      onSubmitted(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not send the return request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Return or refund" size="md">
      <form onSubmit={submit} className="p-5 space-y-5">
        <div className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
          Order <strong className="font-medium text-ink tabular-nums">#{order.orderNumber || order.id.slice(-8).toUpperCase()}</strong>
          {deadline && <> &middot; return window open until <strong>{deadline.toLocaleDateString()}</strong></>}
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-2">Why are you returning it?</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RETURN_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  reason === r
                    ? 'border-ink text-ink'
                    : 'border-line text-stone-600 dark:text-stone-300 hover:border-stone-400'
                }`}
              >
                <input type="radio" name="return-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--ink)]" />
                {r}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="return-details" className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-2">
            Details {reason === 'Other' ? '(required)' : '(optional)'}
          </label>
          <textarea
            id="return-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="E.g. which item, what is wrong, or the size you need instead"
            className="w-full rounded-md border border-line bg-transparent p-3 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none"
          />
        </div>

        <div className="rounded-lg bg-surface-muted p-4 text-xs leading-relaxed text-stone-600 dark:text-stone-400 space-y-1.5">
          <p>Keep the items unused, with their tags and original packaging. Innerwear, swimwear and personalised items cannot be returned.</p>
          <p>
            {paid
              ? `We refund the product price (the delivery charge is not refundable): in full if you ask within ${FULL_REFUND_DAYS} days of delivery, after that less a handling charge. We send you the exact amount to accept before anything is paid.`
              : 'Once approved, we will arrange the refund with you.'}{' '}
            <Link href="/shipping-returns" className="text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink">Returns policy</Link>
          </p>
        </div>

        {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Send return request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
