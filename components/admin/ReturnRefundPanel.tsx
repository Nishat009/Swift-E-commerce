'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { RotateCcw, Wallet } from 'lucide-react';
import { errMsg } from './adminUtils';
import { AdminButton, Pill } from './AdminUI';

interface Quote {
  productAmount: number;
  shippingExcluded: number;
  daysAfterDelivery: number;
  late: boolean;
  fullRefundDays: number;
  lateFeePercent: number;
  suggestedDeduction: number;
  walletBalance: number;
}

interface Props {
  order: any;
  /** Super admin: may pay out the accepted refund (the server checks this again) */
  canConfirm: boolean;
  onUpdated: (updated: any) => void;
}

const money = (n: number | undefined) =>
  `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OPEN = ['Requested', 'Proposed', 'Accepted', 'Declined'];
const BADGES: Record<string, { label: string; tone: 'warning' | 'info' | 'success' | 'danger' }> = {
  Requested: { label: 'Waiting for your review', tone: 'warning' },
  Proposed: { label: 'Offer sent, waiting for the customer', tone: 'info' },
  Accepted: { label: 'Customer accepted, confirm to pay', tone: 'success' },
  Declined: { label: 'Customer declined the offer', tone: 'danger' },
  Approved: { label: 'Approved', tone: 'success' },
  Rejected: { label: 'Rejected', tone: 'danger' },
};
const labelClass = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const fieldClass = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';

/** The customer's return request inside the admin order view: review -> refund offer -> confirm & pay */
export default function ReturnRefundPanel({ order, canConfirm, onUpdated }: Props) {
  const toast = useToast();
  const rr = order.returnRequest;
  const status: string = rr?.status || '';
  // Mongoose fills an empty proposal with its defaults, so an offer exists only once it has an amount
  const proposal = rr?.proposal?.amount !== undefined && rr?.proposal?.amount !== null ? rr.proposal : null;
  const paid = order.paymentStatus === 'Paid';
  const isOpen = OPEN.includes(status);
  const canOffer = paid && order.orderStatus === 'Delivered' && ['Requested', 'Declined', 'Proposed'].includes(status);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [deduction, setDeduction] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(status !== 'Proposed');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'propose' | 'confirm' | 'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!isOpen || !paid) return;
    let cancelled = false;
    apiClient.get(`/orders/${order.id}/refund-quote`)
      .then((res) => {
        if (cancelled) return;
        const q: Quote = res.data?.data;
        setQuote(q);
        // Start from the previous offer when revising it, else from the policy suggestion
        setDeduction(String(proposal?.deduction ?? q.suggestedDeduction ?? 0));
        setRemarks(proposal?.remarks || (q.late ? `Returned ${q.daysAfterDelivery} days after delivery (full refund only within ${q.fullRefundDays} days).` : ''));
      })
      .catch(() => { /* the panel still works without the preview; the server checks again */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, status]);

  if (!status) return null;

  const deductionValue = Number(deduction || 0);
  const refundPreview = quote ? Math.max(0, Math.round((quote.productAmount - deductionValue) * 100) / 100) : 0;
  const offerProblem = !quote
    ? 'Loading the refund breakdown...'
    : !Number.isFinite(deductionValue) || deductionValue < 0
      ? 'The charge cannot be negative.'
      : !quote.late && deductionValue > 0
        ? `Asked within ${quote.fullRefundDays} days of delivery: refund the full product price, no charge.`
        : quote.late && deductionValue <= 0
          ? `Asked ${quote.daysAfterDelivery} days after delivery: a handling charge applies.`
          : deductionValue >= quote.productAmount
            ? 'The charge must be less than the product price.'
            : deductionValue > 0 && remarks.trim().length < 5
              ? 'Explain the charge in the remarks (the customer sees it).'
              : '';

  const send = async (decision: 'propose' | 'confirm' | 'approve' | 'reject') => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { decision, response: message.trim() };
      if (decision === 'propose') Object.assign(body, { deduction: deductionValue, remarks: remarks.trim() });
      const res = await apiClient.put(`/orders/${order.id}/return-request`, body);
      onUpdated(res.data?.data || {});
      setEditing(false);
      setMessage('');
      toast.success({
        propose: 'Refund offer sent. The customer can accept or decline it from My Orders.',
        confirm: 'Refund paid from the store wallet. The order is Returned and the items are back in stock.',
        approve: 'Return approved. The items are back in stock.',
        reject: 'Return rejected. The customer was notified.',
      }[decision]);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to update the return.'));
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const badge = BADGES[status];

  return (
    <div className={`mb-4 rounded-lg border p-4 text-sm ${isOpen ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10' : 'border-line bg-stone-50 dark:bg-white/[0.03]'}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
          <RotateCcw className="size-4 text-stone-400" /> Return &amp; refund
        </span>
        {badge && <Pill tone={badge.tone} dot>{badge.label}</Pill>}
      </div>
      <p className="text-stone-700 dark:text-stone-300">
        <span className="font-medium text-stone-900 dark:text-stone-100">{rr.reason}</span>
        {rr.requestedAt && <span className="text-xs text-stone-500 dark:text-stone-400"> &middot; asked {new Date(rr.requestedAt).toLocaleString()}</span>}
      </p>
      {rr.details && <p className="mt-1 whitespace-pre-line text-stone-600 dark:text-stone-400">&ldquo;{rr.details}&rdquo;</p>}

      {/* Current offer */}
      {proposal && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-line bg-surface p-3">
          <div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400">Product price</span><span className="tabular-nums text-stone-800 dark:text-stone-200">{money(proposal.productAmount)}</span></div>
          {proposal.deduction > 0 && (
            <div className="flex justify-between text-red-600 dark:text-red-400"><span>Handling charge</span><span className="tabular-nums">-{money(proposal.deduction)}</span></div>
          )}
          <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-stone-900 dark:text-white"><span>Refund offered</span><span className="tabular-nums">{money(proposal.amount)}</span></div>
          <p className="text-xs text-stone-500 dark:text-stone-400">Delivery charge {money(proposal.shippingExcluded)} is not refunded.{proposal.proposedByName && ` Offered by ${proposal.proposedByName}`}{proposal.proposedAt && ` on ${new Date(proposal.proposedAt).toLocaleString()}`}.</p>
          {proposal.remarks && <p className="text-stone-600 dark:text-stone-400"><span className="font-medium text-stone-800 dark:text-stone-200">Remarks:</span> {proposal.remarks}</p>}
          {status === 'Declined' && (
            <p className="text-red-600 dark:text-red-400">Customer declined{proposal.customerNote ? `: “${proposal.customerNote}”` : '.'} Send a new offer or reject the return.</p>
          )}
        </div>
      )}

      {/* Make or revise an offer */}
      {canOffer && (status === 'Proposed' && !editing ? (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-[#8b6f47] hover:underline dark:text-[#c9a96b] cursor-pointer">Change the offer</button>
        </div>
      ) : (
        <div className="mt-3 space-y-3 rounded-lg border border-line bg-surface p-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{proposal ? 'New refund offer' : 'Refund offer'}</p>
          {quote ? (
            <>
              <div className={`rounded-md px-3 py-2 text-xs ${quote.late ? 'bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200'}`}>
                Asked <strong className="font-semibold">{quote.daysAfterDelivery} {quote.daysAfterDelivery === 1 ? 'day' : 'days'}</strong> after delivery.{' '}
                {quote.late
                  ? `More than ${quote.fullRefundDays} days: keep a handling charge (suggested ${quote.lateFeePercent}%) and explain it.`
                  : `Within ${quote.fullRefundDays} days: refund the full product price.`}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={labelClass}>Product price</span>
                  <span className="block py-2 font-medium tabular-nums text-stone-900 dark:text-stone-100">{money(quote.productAmount)}</span>
                </div>
                <div>
                  <label htmlFor="refund-deduction" className={labelClass}>Handling charge ($)</label>
                  <input
                    id="refund-deduction"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deduction}
                    disabled={!quote.late}
                    onChange={(e) => setDeduction(e.target.value)}
                    className={`${fieldClass} h-9 py-0 tabular-nums disabled:cursor-not-allowed disabled:opacity-60`}
                  />
                </div>
              </div>
              {quote.late && (
                <div>
                  <label htmlFor="refund-remarks" className={labelClass}>Remarks: why the charge (shown to the customer)</label>
                  <textarea id="refund-remarks" rows={2} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={fieldClass} />
                </div>
              )}
              <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 dark:bg-white/[0.04]">
                <span className="text-stone-600 dark:text-stone-300">Refund to customer <span className="text-xs text-stone-400">(delivery {money(quote.shippingExcluded)} not refunded)</span></span>
                <span className="font-semibold tabular-nums text-stone-900 dark:text-white">{money(refundPreview)}</span>
              </div>
            </>
          ) : (
            <p className="text-stone-400">Loading the refund breakdown...</p>
          )}
        </div>
      ))}

      {/* Actions */}
      {isOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={2}
            aria-label="Message to the customer"
            placeholder={paid ? 'Message to the customer (optional with an offer, required to reject, e.g. pickup details)' : 'Message to the customer (required to reject)'}
            className={fieldClass}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <AdminButton variant="danger" onClick={() => setConfirm('reject')} disabled={message.trim().length < 5 || saving}>
              Reject return
            </AdminButton>
            {!paid && (
              <AdminButton variant="primary" onClick={() => setConfirm('approve')} disabled={order.orderStatus !== 'Delivered' || saving}>
                Approve return
              </AdminButton>
            )}
            {canOffer && (status !== 'Proposed' || editing) && (
              <AdminButton variant="primary" onClick={() => setConfirm('propose')} disabled={!!offerProblem || saving}>
                {proposal ? 'Send new offer' : 'Send refund offer'}
              </AdminButton>
            )}
            {status === 'Accepted' && (
              <AdminButton variant="primary" onClick={() => setConfirm('confirm')} disabled={!canConfirm || saving}>
                <Wallet className="size-4" /> Confirm &amp; pay {money(proposal?.amount)}
              </AdminButton>
            )}
          </div>
          {canOffer && (status !== 'Proposed' || editing) && offerProblem && quote && <p className="text-right text-xs text-red-600 dark:text-red-400">{offerProblem}</p>}
          {status === 'Accepted' && (
            <p className="text-right text-xs text-stone-500 dark:text-stone-400">
              {quote && <>Store wallet balance: <strong className="font-semibold tabular-nums text-stone-700 dark:text-stone-200">{money(quote.walletBalance)}</strong>. </>}
              {canConfirm ? 'Confirming takes the refund out of the store wallet and marks the order Returned.' : 'Only a super admin can pay out refunds.'}
            </p>
          )}
          {!paid && <p className="text-xs text-stone-500 dark:text-stone-400">Nothing was paid for this order, so approving only marks it Returned and restocks the items.</p>}
        </div>
      )}

      {!isOpen && (
        <p className="mt-2 text-stone-500 dark:text-stone-400">
          {status} {rr.decidedAt && `on ${new Date(rr.decidedAt).toLocaleString()}`}{rr.decidedByName && ` by ${rr.decidedByName}`}
          {rr.response && <span className="mt-1 block text-stone-600 dark:text-stone-300">Reply: &ldquo;{rr.response}&rdquo;</span>}
        </p>
      )}

      <ConfirmationModal
        isOpen={confirm === 'propose'}
        onClose={() => setConfirm(null)}
        onConfirm={() => send('propose')}
        title="Send this refund offer?"
        message={`The customer is offered ${money(refundPreview)}${deductionValue > 0 ? ` (product price ${money(quote?.productAmount)} less a ${money(deductionValue)} charge)` : ''}. They get an email and a notification, and can accept or decline it.`}
        confirmText="Yes, send offer"
        cancelText="Go back"
        variant="primary"
        isLoading={saving}
      />
      <ConfirmationModal
        isOpen={confirm === 'confirm'}
        onClose={() => setConfirm(null)}
        onConfirm={() => send('confirm')}
        title="Pay this refund?"
        message={`${money(proposal?.amount)} is taken out of the store wallet now. Order ${order.orderNumber || order.id} becomes Returned and its items go back in stock. This cannot be undone.`}
        confirmText="Yes, pay refund"
        cancelText="Go back"
        variant="warning"
        isLoading={saving}
      />
      <ConfirmationModal
        isOpen={confirm === 'approve'}
        onClose={() => setConfirm(null)}
        onConfirm={() => send('approve')}
        title="Approve this return?"
        message={`Order ${order.orderNumber || order.id} becomes Returned and its items go back in stock. The customer gets an email and a notification.`}
        confirmText="Yes, approve"
        cancelText="Go back"
        variant="primary"
        isLoading={saving}
      />
      <ConfirmationModal
        isOpen={confirm === 'reject'}
        onClose={() => setConfirm(null)}
        onConfirm={() => send('reject')}
        title="Reject this return?"
        message="The order stays delivered. The customer gets your message by email and in their notifications."
        confirmText="Yes, reject"
        cancelText="Go back"
        variant="danger"
        isLoading={saving}
      />
    </div>
  );
}
