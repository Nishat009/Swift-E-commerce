'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { RotateCcw, Wallet } from 'lucide-react';
import { errMsg } from './adminUtils';

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
const BADGES: Record<string, { label: string; className: string }> = {
  Requested: { label: 'Waiting for your review', className: 'bg-amber-100 text-amber-800' },
  Proposed: { label: 'Offer sent, waiting for the customer', className: 'bg-blue-100 text-blue-700' },
  Accepted: { label: 'Customer accepted, confirm to pay', className: 'bg-green-100 text-green-700' },
  Declined: { label: 'Customer declined the offer', className: 'bg-red-100 text-red-700' },
  Approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  Rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};
const fieldClass = 'w-full text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40 focus:border-[#8b6f47]';

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
    <div className={`rounded-2xl border p-4 mb-4 text-xs ${isOpen ? 'border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/40' : 'border-gray-200 bg-gray-50 dark:bg-gray-950 dark:border-gray-800'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Return &amp; refund
        </span>
        {badge && <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${badge.className}`}>{badge.label}</span>}
      </div>
      <p className="text-gray-700 dark:text-gray-300">
        <strong>{rr.reason}</strong>
        {rr.requestedAt && <span className="text-gray-400"> &middot; asked {new Date(rr.requestedAt).toLocaleString()}</span>}
      </p>
      {rr.details && <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-line">&ldquo;{rr.details}&rdquo;</p>}

      {/* Current offer */}
      {proposal && (
        <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Product price</span><span>{money(proposal.productAmount)}</span></div>
          {proposal.deduction > 0 && (
            <div className="flex justify-between text-red-600"><span>Handling charge</span><span>-{money(proposal.deduction)}</span></div>
          )}
          <div className="flex justify-between font-extrabold text-sm text-[#8b6f47] border-t border-gray-100 dark:border-gray-800 pt-1"><span>Refund offered</span><span>{money(proposal.amount)}</span></div>
          <p className="text-[10px] text-gray-400">Delivery charge {money(proposal.shippingExcluded)} is not refunded.{proposal.proposedByName && ` Offered by ${proposal.proposedByName}`}{proposal.proposedAt && ` on ${new Date(proposal.proposedAt).toLocaleString()}`}.</p>
          {proposal.remarks && <p className="text-gray-600 dark:text-gray-400"><span className="font-bold">Remarks:</span> {proposal.remarks}</p>}
          {status === 'Declined' && (
            <p className="text-red-600">Customer declined{proposal.customerNote ? `: “${proposal.customerNote}”` : '.'} Send a new offer or reject the return.</p>
          )}
        </div>
      )}

      {/* Make or revise an offer */}
      {canOffer && (status === 'Proposed' && !editing ? (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => setEditing(true)} className="text-[11px] font-bold text-[#8b6f47] underline">Change the offer</button>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-[#8b6f47]/30 bg-white dark:bg-gray-900 p-3 space-y-2.5">
          <p className="font-black uppercase tracking-wider text-[10px] text-gray-500">{proposal ? 'New refund offer' : 'Refund offer'}</p>
          {quote ? (
            <>
              <div className={`rounded-lg px-2.5 py-1.5 text-[11px] ${quote.late ? 'bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300' : 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'}`}>
                Asked <strong>{quote.daysAfterDelivery} {quote.daysAfterDelivery === 1 ? 'day' : 'days'}</strong> after delivery.{' '}
                {quote.late
                  ? `More than ${quote.fullRefundDays} days: keep a handling charge (suggested ${quote.lateFeePercent}%) and explain it.`
                  : `Within ${quote.fullRefundDays} days: refund the full product price.`}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Product price</span>
                  <span className="block font-bold text-gray-800 dark:text-gray-100 py-2">{money(quote.productAmount)}</span>
                </div>
                <div>
                  <label htmlFor="refund-deduction" className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Handling charge ($)</label>
                  <input
                    id="refund-deduction"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deduction}
                    disabled={!quote.late}
                    onChange={(e) => setDeduction(e.target.value)}
                    className={`${fieldClass} text-sm disabled:opacity-60`}
                  />
                </div>
              </div>
              {quote.late && (
                <div>
                  <label htmlFor="refund-remarks" className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Remarks: why the charge (shown to the customer)</label>
                  <textarea id="refund-remarks" rows={2} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={fieldClass} />
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-[#8b6f47]/5 px-2.5 py-2">
                <span className="text-gray-600 dark:text-gray-300">Refund to customer <span className="text-gray-400">(delivery {money(quote.shippingExcluded)} not refunded)</span></span>
                <span className="text-sm font-extrabold text-[#8b6f47]">{money(refundPreview)}</span>
              </div>
            </>
          ) : (
            <p className="text-gray-400">Loading the refund breakdown...</p>
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
            placeholder={paid ? 'Message to the customer (optional with an offer, required to reject, e.g. pickup details)' : 'Message to the customer (required to reject)'}
            className={fieldClass}
          />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={() => setConfirm('reject')} disabled={message.trim().length < 5 || saving} variant="outline" className="text-xs py-2 px-4 font-bold rounded-xl border-red-200 text-red-600">
              Reject return
            </Button>
            {!paid && (
              <Button onClick={() => setConfirm('approve')} disabled={order.orderStatus !== 'Delivered' || saving} className="text-xs py-2 px-4 font-bold rounded-xl bg-green-600 text-white">
                Approve return
              </Button>
            )}
            {canOffer && (status !== 'Proposed' || editing) && (
              <Button onClick={() => setConfirm('propose')} disabled={!!offerProblem || saving} className="text-xs py-2 px-4 font-bold rounded-xl bg-[#8b6f47] text-white">
                {proposal ? 'Send new offer' : 'Send refund offer'}
              </Button>
            )}
            {status === 'Accepted' && (
              <Button onClick={() => setConfirm('confirm')} disabled={!canConfirm || saving} className="text-xs py-2 px-4 font-bold rounded-xl bg-green-600 text-white flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Confirm &amp; pay {money(proposal?.amount)}
              </Button>
            )}
          </div>
          {canOffer && (status !== 'Proposed' || editing) && offerProblem && quote && <p className="text-[10px] text-red-600 text-right">{offerProblem}</p>}
          {status === 'Accepted' && (
            <p className="text-[10px] text-gray-500 text-right">
              {quote && <>Store wallet balance: <strong>{money(quote.walletBalance)}</strong>. </>}
              {canConfirm ? 'Confirming takes the refund out of the store wallet and marks the order Returned.' : 'Only a super admin can pay out refunds.'}
            </p>
          )}
          {!paid && <p className="text-[10px] text-gray-500">Nothing was paid for this order, so approving only marks it Returned and restocks the items.</p>}
        </div>
      )}

      {!isOpen && (
        <p className="mt-2 text-gray-500">
          {status} {rr.decidedAt && `on ${new Date(rr.decidedAt).toLocaleString()}`}{rr.decidedByName && ` by ${rr.decidedByName}`}
          {rr.response && <span className="block mt-1 text-gray-600 dark:text-gray-400">Reply: &ldquo;{rr.response}&rdquo;</span>}
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
