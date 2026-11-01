'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Dropdown from '@/components/ui/Dropdown';
import { X, History, Mail, Loader2 } from 'lucide-react';
import { errMsg } from './adminUtils';
import EmailCustomerModal from './EmailCustomerModal';
import ReturnRefundPanel from './ReturnRefundPanel';
import { AdminButton, StatusPill, table } from './AdminUI';

export const ORDER_STATUSES = ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed'];
const ZONE_LABELS: Record<string, string> = { inside_dhaka: 'Inside Dhaka', outside_dhaka: 'Outside Dhaka' };
// Moves regular staff may make (same table as the server's orderLifecycle TRANSITIONS)
const STAFF_NEXT: Record<string, string[]> = {
  Pending: ['Processing', 'Confirmed', 'Cancelled'],
  Processing: ['Confirmed', 'Packed', 'Shipped', 'Cancelled'],
  Confirmed: ['Processing', 'Packed', 'Shipped', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Returned'],
  Delivered: ['Returned'],
  Cancelled: [],
  Returned: [],
};
const CLOSED_STATUSES = ['Cancelled', 'Returned'];

const labelClass = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const inputClass = 'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const boxLabel = 'mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400';
// Gives the shared Dropdown's trigger the admin input look (its className only reaches the wrapper)
const dropdownSkin = '[&>button]:h-9 [&>button]:py-0 [&>button]:rounded-lg [&>button]:border-line [&>button]:bg-surface [&>button:focus]:border-[#8b6f47]/60 [&>button:focus]:ring-[#8b6f47]/20 [&>button[aria-expanded=true]]:border-[#8b6f47]/60 [&>button[aria-expanded=true]]:ring-[#8b6f47]/20';

interface Props {
  order: any;
  onClose: () => void;
  onUpdated: (order: any) => void;
  onViewAudit?: (orderId: string) => void;
  /** Super admin: may set any status and issue refunds (the server checks this again) */
  canOverrideStatus?: boolean;
}

export default function OrderDetailModal({ order, onClose, onUpdated, onViewAudit, canOverrideStatus = false }: Props) {
  const toast = useToast();
  const [status, setStatus] = useState<string>(order.orderStatus || 'Pending');
  const [payment, setPayment] = useState<string>(order.paymentStatus || 'Pending');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'status' | 'refund' | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(Number(order.total || 0).toFixed(2));
  const [refundReference, setRefundReference] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const addr = order.shippingAddress || order.address;
  const isClosed = CLOSED_STATUSES.includes(order.orderStatus);
  const customerId = order.user?.id || order.user?._id;
  const statusDirty = status !== order.orderStatus;
  const paymentDirty = payment !== order.paymentStatus;
  // Super admins can pick any status; everyone else only sees the moves the server allows
  const statusChoices = canOverrideStatus ? ORDER_STATUSES : [order.orderStatus, ...(STAFF_NEXT[order.orderStatus] || [])];
  const paymentChoices = PAYMENT_STATUSES.includes(order.paymentStatus) ? PAYMENT_STATUSES : [order.paymentStatus, ...PAYMENT_STATUSES];
  const canRefund = order.paymentStatus === 'Refund Needed' && isClosed;
  const busy = saving && confirm === null;

  // the status endpoints return the order without populated user/products, so keep those
  const merge = (updated: any) => onUpdated({ ...order, ...updated, user: order.user, products: order.products });

  const updateStatus = async () => {
    setSaving(true);
    try {
      const url = canOverrideStatus ? `/orders/${order.id}/override-status` : `/orders/${order.id}/status`;
      const res = await apiClient.put(url, { status });
      merge(res.data?.data || { orderStatus: status });
      setStatus(res.data?.data?.orderStatus || status);
      toast.success(`Order status is now "${status}". The customer was notified.`);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to update the order status.'));
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const savePayment = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/orders/${order.id}/status`, { paymentStatus: payment });
      merge(res.data?.data || { paymentStatus: payment });
      toast.success('Payment status updated.');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to update the payment status.'));
    } finally {
      setSaving(false);
    }
  };

  const refundValue = Number(refundAmount);
  const refundAmountValid = Number.isFinite(refundValue) && refundValue > 0 && refundValue <= Number(order.total);

  const refund = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post(`/orders/${order.id}/refund`, {
        amount: refundValue,
        reference: refundReference.trim() || undefined,
        note: refundNote.trim() || undefined,
      });
      merge(res.data?.data || { paymentStatus: 'Refunded' });
      setPayment('Refunded');
      toast.success('Refund recorded. The customer was notified by email and in the app.');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to record the refund.'));
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/[0.06] dark:hover:text-stone-200 cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="order-detail-title" className="text-base font-semibold text-stone-900 dark:text-white">
              Order <span className="font-mono">{order.orderNumber || order.id}</span>
            </h3>
            <StatusPill status={order.orderStatus} />
            <StatusPill kind="payment" status={order.paymentStatus} />
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Placed {new Date(order.createdAt).toLocaleString()}
            {order.deliveredAt && <> &middot; Delivered {new Date(order.deliveredAt).toLocaleDateString()}</>}
          </p>
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-stone-50/60 p-3 dark:bg-white/[0.03]">
            <span className={boxLabel}>Customer</span>
            <span className="block font-medium text-stone-900 dark:text-stone-100">{order.user?.name || 'Deleted user'}</span>
            <span className="block text-stone-500 dark:text-stone-400">{order.user?.email}</span>
            {customerId && order.user?.email && (
              <AdminButton size="sm" onClick={() => setEmailOpen(true)} className="mt-2.5">
                <Mail className="size-3.5" /> Email customer
              </AdminButton>
            )}
          </div>
          <div className="rounded-lg border border-line bg-stone-50/60 p-3 dark:bg-white/[0.03]">
            <span className={boxLabel}>Ship to</span>
            {addr ? (
              <span className="block text-stone-700 dark:text-stone-300">
                {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
              </span>
            ) : (
              <span className="text-stone-400">No address on record</span>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <div className="overflow-x-auto">
            <table className={table.table}>
              <thead className={table.thead}>
                <tr>
                  <th className={`${table.th} px-3`}>Item</th>
                  <th className={`${table.th} px-3 text-right`}>Qty</th>
                  <th className={`${table.th} px-3 text-right`}>Price</th>
                  <th className={`${table.th} px-3 text-right`}>Line total</th>
                </tr>
              </thead>
              <tbody className={table.tbody}>
                {(order.products || []).map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {item.product?.thumbnail && <img src={item.product.thumbnail} alt="" className="size-9 shrink-0 rounded-md bg-stone-100 object-cover dark:bg-white/5" />}
                        <div className="min-w-0">
                          <span className="block font-medium text-stone-900 dark:text-stone-100">{item.product?.title || 'Removed product'}</span>
                          {item.variant?.name && <span className="block text-xs text-stone-400">{item.variant.name}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-stone-700 dark:text-stone-300">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-stone-700 dark:text-stone-300">${Number(item.price).toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums text-stone-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="space-y-1.5 border-t border-line bg-stone-50 px-3 py-3 text-sm dark:bg-white/[0.03]">
            <div className="flex justify-between text-stone-600 dark:text-stone-300"><dt>Subtotal</dt><dd className="tabular-nums">${Number(order.subtotal || 0).toFixed(2)}</dd></div>
            {order.coupon && <div className="flex justify-between text-stone-600 dark:text-stone-300"><dt>Coupon</dt><dd className="font-mono text-xs">{order.coupon}</dd></div>}
            <div className="flex justify-between text-stone-600 dark:text-stone-300"><dt>Shipping{order.deliveryZone ? ` (${ZONE_LABELS[order.deliveryZone]})` : ''}</dt><dd className="tabular-nums">${Number(order.shipping || 0).toFixed(2)}</dd></div>
            <div className="flex justify-between text-stone-600 dark:text-stone-300"><dt>Tax</dt><dd className="tabular-nums">${Number(order.tax || 0).toFixed(2)}</dd></div>
            <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-stone-900 dark:text-white"><dt>Total</dt><dd className="tabular-nums">${Number(order.total).toFixed(2)}</dd></div>
            <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400"><dt>Payment method</dt><dd className="uppercase">{order.paymentMethod}</dd></div>
            {order.deliveryZone && <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400"><dt>Delivery zone</dt><dd className="font-medium">{ZONE_LABELS[order.deliveryZone]}</dd></div>}
          </dl>
        </div>

        <div className="mt-4">
          {/* Customer's return request and refund offer */}
          <ReturnRefundPanel
            order={order}
            canConfirm={canOverrideStatus}
            onUpdated={(updated) => {
              merge(updated);
              if (updated.orderStatus) setStatus(updated.orderStatus);
              if (updated.paymentStatus) setPayment(updated.paymentStatus);
            }}
          />
        </div>

        {/* Order status */}
        <div className="mb-4 rounded-lg border border-line p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="order-status-select" className="text-sm font-semibold text-stone-900 dark:text-stone-100">Update status</label>
            <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              Current <StatusPill status={order.orderStatus} />
              {canOverrideStatus && <span>· Super admin: any status</span>}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Dropdown
              id="order-status-select"
              value={status}
              disabled={isClosed}
              onChange={setStatus}
              options={statusChoices.map((s) => ({ value: s, label: s, hint: s === order.orderStatus ? 'Current status' : undefined }))}
              className={`flex-1 ${dropdownSkin}`}
            />
            <AdminButton variant="primary" onClick={() => setConfirm('status')} disabled={!statusDirty || isClosed || busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Update status
            </AdminButton>
          </div>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            {isClosed
              ? `A ${order.orderStatus} order is final: its stock was already released. Ask the customer to place a new order.`
              : 'Cancelling or returning an order puts its items back in stock. The customer gets a notification for every change, and every change is logged.'}
          </p>
        </div>

        {/* Payment status + refund */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Payment status</span>
            <div className="flex gap-2">
              <Dropdown
                aria-label="Payment status"
                value={payment}
                onChange={setPayment}
                options={paymentChoices.map((s) => ({ value: s, label: s }))}
                className={`flex-1 ${dropdownSkin}`}
              />
              <AdminButton onClick={savePayment} disabled={!paymentDirty || busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Save
              </AdminButton>
            </div>
          </div>
          {order.paymentStatus === 'Refunded' && order.refund && (
            <div className="rounded-lg border border-line bg-stone-50 p-3 text-sm text-stone-600 dark:bg-white/[0.03] dark:text-stone-300">
              <strong className="block font-semibold tabular-nums text-stone-900 dark:text-white">Refunded ${Number(order.refund.amount || 0).toFixed(2)}</strong>
              <span className="text-xs">{order.refund.at && new Date(order.refund.at).toLocaleString()}{order.refund.byName ? ` by ${order.refund.byName}` : ''}</span>
              {order.refund.reference && <span className="block text-xs text-stone-500 dark:text-stone-400">Ref: <span className="font-mono">{order.refund.reference}</span></span>}
              {order.refund.note && <span className="block text-xs text-stone-500 dark:text-stone-400">{order.refund.note}</span>}
            </div>
          )}
        </div>

        {canRefund && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20">
            <p className="text-sm text-red-900 dark:text-red-200">
              <strong className="font-semibold">Refund needed:</strong> this order is {order.orderStatus.toLowerCase()} and was paid by {String(order.paymentMethod).toUpperCase()}.
              Send the money back (Stripe / bKash dashboard or cash), then record it here. The amount is taken out of the store wallet.
              {!canOverrideStatus && ' Only a super admin can record refunds, and the shared demo admin is never a super admin. Sign in with your own admin account to do it.'}
            </p>
            {canOverrideStatus && (
              <div className="mt-3 grid items-end gap-2 sm:grid-cols-3">
                <div>
                  <label htmlFor="refund-amount" className={labelClass}>Amount ($)</label>
                  <input
                    id="refund-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={Number(order.total)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label htmlFor="refund-reference" className={labelClass}>Reference</label>
                  <input
                    id="refund-reference"
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. bKash TrxID"
                    className={inputClass}
                  />
                </div>
                <AdminButton variant="primary" onClick={() => setConfirm('refund')} disabled={!refundAmountValid}>
                  Record refund
                </AdminButton>
                <input
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  maxLength={300}
                  aria-label="Note for the customer"
                  placeholder="Note for the customer (optional, e.g. shipping fee not refunded)"
                  className={`${inputClass} sm:col-span-3`}
                />
                {!refundAmountValid && (
                  <p className="text-xs text-red-600 dark:text-red-400 sm:col-span-3">Enter an amount between $0.01 and ${Number(order.total).toFixed(2)}.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          {onViewAudit ? (
            <AdminButton variant="ghost" onClick={() => onViewAudit(order.id)}>
              <History className="size-4" /> Change history
            </AdminButton>
          ) : <span />}
          <AdminButton onClick={onClose}>Close</AdminButton>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirm === 'status'}
        onClose={() => setConfirm(null)}
        onConfirm={updateStatus}
        title="Change order status?"
        message={
          <>
            Move order {order.orderNumber || order.id} from <strong>{order.orderStatus}</strong> to <strong>{status}</strong>?
            {CLOSED_STATUSES.includes(status) && ' Its items go back in stock, and this cannot be undone.'}
            {CLOSED_STATUSES.includes(status) && ['Paid', 'Refund Needed'].includes(order.paymentStatus) && ' The payment will be flagged for a refund.'}
            {' '}The customer will be notified.
          </>
        }
        confirmText="Yes, update status"
        cancelText="Go back"
        variant={CLOSED_STATUSES.includes(status) ? 'danger' : 'primary'}
        isLoading={saving}
      />
      <ConfirmationModal
        isOpen={confirm === 'refund'}
        onClose={() => setConfirm(null)}
        onConfirm={refund}
        title="Mark this order as refunded?"
        message={`Record a refund of $${refundAmountValid ? refundValue.toFixed(2) : Number(order.total).toFixed(2)}${refundAmountValid && refundValue < Number(order.total) ? ` (of $${Number(order.total).toFixed(2)})` : ''} for order ${order.orderNumber || order.id}. It is taken out of the store wallet. Make sure the money has actually been sent back (card / bKash dashboard or cash). The customer will be notified.`}
        confirmText="Yes, record refund"
        cancelText="Go back"
        variant="warning"
        isLoading={saving}
      />
      {emailOpen && customerId && (
        <EmailCustomerModal
          customer={{ id: String(customerId), name: order.user?.name || 'Customer', email: order.user?.email || '' }}
          order={order}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </div>
  );
}
