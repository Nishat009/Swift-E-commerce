'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { X, ShieldAlert, Mail, RotateCcw } from 'lucide-react';
import { errMsg } from './adminUtils';
import EmailCustomerModal from './EmailCustomerModal';

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
  const [confirm, setConfirm] = useState<'status' | 'refund' | 'approve' | 'reject' | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [returnResponse, setReturnResponse] = useState('');
  const [refundAmount, setRefundAmount] = useState(Number(order.total || 0).toFixed(2));
  const [refundReference, setRefundReference] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const addr = order.shippingAddress || order.address;
  const isClosed = CLOSED_STATUSES.includes(order.orderStatus);
  const returnRequest = order.returnRequest?.status ? order.returnRequest : null;
  const customerId = order.user?.id || order.user?._id;
  const statusDirty = status !== order.orderStatus;
  const paymentDirty = payment !== order.paymentStatus;
  // Super admins can pick any status; everyone else only sees the moves the server allows
  const statusChoices = canOverrideStatus ? ORDER_STATUSES : [order.orderStatus, ...(STAFF_NEXT[order.orderStatus] || [])];
  const paymentChoices = PAYMENT_STATUSES.includes(order.paymentStatus) ? PAYMENT_STATUSES : [order.paymentStatus, ...PAYMENT_STATUSES];
  const canRefund = order.paymentStatus === 'Refund Needed' && isClosed;

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

  const decideReturn = async (decision: 'approve' | 'reject') => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/orders/${order.id}/return-request`, { decision, response: returnResponse.trim() });
      const updated = res.data?.data || {};
      merge(updated);
      if (updated.orderStatus) setStatus(updated.orderStatus);
      if (updated.paymentStatus) setPayment(updated.paymentStatus);
      toast.success(decision === 'approve' ? 'Return approved. The items are back in stock and the customer was notified.' : 'Return rejected. The customer was notified.');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to update the return request.'));
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl overflow-y-auto max-h-[90vh] shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Order {order.orderNumber || order.id}</h3>
        <p className="text-xs text-gray-400 mb-4 border-b pb-3">
          Placed {new Date(order.createdAt).toLocaleString()}
          {order.deliveredAt && <> &middot; Delivered {new Date(order.deliveredAt).toLocaleDateString()}</>}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-xs mb-5">
          <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Customer</span>
            <span className="block font-bold text-gray-800 dark:text-gray-200">{order.user?.name || 'Deleted user'}</span>
            <span className="block text-gray-500">{order.user?.email}</span>
            {customerId && order.user?.email && (
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8b6f47] border border-[#8b6f47]/40 rounded-lg px-2.5 py-1 hover:bg-[#8b6f47]/10"
              >
                <Mail className="w-3.5 h-3.5" /> Email customer
              </button>
            )}
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ship to</span>
            {addr ? (
              <span className="block text-gray-700 dark:text-gray-300">
                {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
              </span>
            ) : (
              <span className="text-gray-400">No address on record</span>
            )}
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden mb-5">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-2.5">Item</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Price</th>
                <th className="p-2.5 text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(order.products || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      {item.product?.thumbnail && <img src={item.product.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" />}
                      <div>
                        <span className="block font-bold text-gray-800 dark:text-gray-200">{item.product?.title || 'Removed product'}</span>
                        {item.variant?.name && <span className="block text-[10px] text-gray-400">{item.variant.name}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5 text-right">{item.quantity}</td>
                  <td className="p-2.5 text-right">${Number(item.price).toFixed(2)}</td>
                  <td className="p-2.5 text-right font-bold">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 bg-gray-50 dark:bg-gray-950 text-xs space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.subtotal || 0).toFixed(2)}</span></div>
            {order.coupon && <div className="flex justify-between"><span>Coupon</span><span className="font-mono">{order.coupon}</span></div>}
            <div className="flex justify-between"><span>Shipping{order.deliveryZone ? ` (${ZONE_LABELS[order.deliveryZone]})` : ''}</span><span>${Number(order.shipping || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${Number(order.tax || 0).toFixed(2)}</span></div>
            <div className="flex justify-between font-extrabold text-sm text-[#8b6f47] pt-1 border-t"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Payment method</span><span className="uppercase">{order.paymentMethod}</span></div>
            {order.deliveryZone && <div className="flex justify-between text-gray-500"><span>Delivery zone</span><span className="font-bold">{ZONE_LABELS[order.deliveryZone]}</span></div>}
          </div>
        </div>

        {/* Customer's return / refund request */}
        {returnRequest && (
          <div className={`rounded-2xl border p-4 mb-4 text-xs ${
            returnRequest.status === 'Requested'
              ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40'
              : 'border-gray-200 bg-gray-50 dark:bg-gray-950 dark:border-gray-800'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Return request
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                returnRequest.status === 'Requested' ? 'bg-amber-100 text-amber-800' : returnRequest.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {returnRequest.status === 'Requested' ? 'Waiting for a decision' : returnRequest.status}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300"><strong>{returnRequest.reason}</strong>{returnRequest.requestedAt && <span className="text-gray-400"> &middot; {new Date(returnRequest.requestedAt).toLocaleString()}</span>}</p>
            {returnRequest.details && <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-line">&ldquo;{returnRequest.details}&rdquo;</p>}

            {returnRequest.status === 'Requested' ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={returnResponse}
                  onChange={(e) => setReturnResponse(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder="Message to the customer (required to reject, e.g. pickup details or why it cannot be returned)"
                  className="w-full text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2"
                />
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button onClick={() => setConfirm('reject')} disabled={returnResponse.trim().length < 5} variant="outline" className="text-xs py-2 px-4 font-bold rounded-xl border-red-200 text-red-600">
                    Reject
                  </Button>
                  <Button onClick={() => setConfirm('approve')} disabled={order.orderStatus !== 'Delivered'} className="text-xs py-2 px-4 font-bold rounded-xl bg-green-600 text-white">
                    Approve return
                  </Button>
                </div>
                <p className="text-[10px] text-gray-500">
                  Approving marks the order Returned and puts the items back in stock.
                  {order.paymentStatus === 'Paid' && ` The payment of $${Number(order.total).toFixed(2)} is then flagged for a refund.`}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-gray-500">
                {returnRequest.status} {returnRequest.decidedAt && `on ${new Date(returnRequest.decidedAt).toLocaleString()}`}{returnRequest.decidedByName && ` by ${returnRequest.decidedByName}`}
                {returnRequest.response && <span className="block mt-1 text-gray-600 dark:text-gray-400">Reply: &ldquo;{returnRequest.response}&rdquo;</span>}
              </p>
            )}
          </div>
        )}

        {/* Order status */}
        <div className="rounded-2xl border border-[#8b6f47]/30 bg-[#8b6f47]/5 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="order-status-select" className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Update status</label>
            <span className="text-[10px] text-gray-500">Current: <strong>{order.orderStatus}</strong>{canOverrideStatus && ' | Super admin: any status'}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              id="order-status-select"
              value={status}
              disabled={isClosed}
              onChange={(e) => setStatus(e.target.value)}
              className="flex-1 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5 disabled:opacity-60"
            >
              {statusChoices.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={() => setConfirm('status')} loading={saving && confirm === null} disabled={!statusDirty || isClosed} className="text-sm py-2 px-5 font-bold rounded-xl bg-[#8b6f47] text-white">
              Update status
            </Button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isClosed
              ? `A ${order.orderStatus} order is final: its stock was already released. Ask the customer to place a new order.`
              : 'Cancelling or returning an order puts its items back in stock. The customer gets a notification for every change, and every change is logged.'}
          </p>
        </div>

        {/* Payment status + refund */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment status</label>
            <div className="flex gap-2">
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className="flex-1 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5">
                {paymentChoices.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button onClick={savePayment} loading={saving && confirm === null} disabled={!paymentDirty} variant="outline" className="text-xs py-2 px-3 font-bold rounded-xl">
                Save
              </Button>
            </div>
          </div>
          {order.paymentStatus === 'Refunded' && order.refund && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-3 text-xs text-gray-600 dark:text-gray-300">
              <strong className="block text-gray-800 dark:text-gray-100">Refunded ${Number(order.refund.amount || 0).toFixed(2)}</strong>
              {order.refund.at && new Date(order.refund.at).toLocaleString()}{order.refund.byName ? ` by ${order.refund.byName}` : ''}
              {order.refund.reference && <span className="block text-gray-500">Ref: <span className="font-mono">{order.refund.reference}</span></span>}
              {order.refund.note && <span className="block text-gray-500">{order.refund.note}</span>}
            </div>
          )}
        </div>

        {canRefund && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40 p-4 mb-4">
            <p className="text-xs text-orange-800 dark:text-orange-300 mb-3">
              <strong>Refund needed:</strong> this order is {order.orderStatus.toLowerCase()} and was paid by {String(order.paymentMethod).toUpperCase()}.
              Send the money back (Stripe / bKash dashboard or cash), then record it here.
              {!canOverrideStatus && ' Only a super admin can record refunds, and the shared demo admin is never a super admin. Sign in with your own admin account to do it.'}
            </p>
            {canOverrideStatus && (
              <div className="grid sm:grid-cols-3 gap-2 items-end">
                <div>
                  <label htmlFor="refund-amount" className="block text-[10px] font-bold text-orange-900/70 dark:text-orange-300/80 uppercase mb-1">Amount ($)</label>
                  <input
                    id="refund-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={Number(order.total)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full text-sm border border-orange-200 dark:border-orange-900/50 bg-white dark:bg-gray-900 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label htmlFor="refund-reference" className="block text-[10px] font-bold text-orange-900/70 dark:text-orange-300/80 uppercase mb-1">Reference</label>
                  <input
                    id="refund-reference"
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. bKash TrxID"
                    className="w-full text-sm border border-orange-200 dark:border-orange-900/50 bg-white dark:bg-gray-900 rounded-lg p-2"
                  />
                </div>
                <Button onClick={() => setConfirm('refund')} disabled={!refundAmountValid} className="text-sm py-2 px-5 font-bold rounded-xl bg-orange-600 text-white">
                  Record refund
                </Button>
                <input
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  maxLength={300}
                  placeholder="Note for the customer (optional, e.g. shipping fee not refunded)"
                  className="sm:col-span-3 w-full text-xs border border-orange-200 dark:border-orange-900/50 bg-white dark:bg-gray-900 rounded-lg p-2"
                />
                {!refundAmountValid && (
                  <p className="sm:col-span-3 text-[10px] text-red-600">Enter an amount between $0.01 and ${Number(order.total).toFixed(2)}.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {onViewAudit ? (
            <button onClick={() => onViewAudit(order.id)} className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Change history
            </button>
          ) : <span />}
          <Button onClick={onClose} variant="outline" className="text-sm py-2 px-5 font-bold rounded-xl">Close</Button>
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
        message={`Record a refund of $${refundAmountValid ? refundValue.toFixed(2) : Number(order.total).toFixed(2)}${refundAmountValid && refundValue < Number(order.total) ? ` (of $${Number(order.total).toFixed(2)})` : ''} for order ${order.orderNumber || order.id}. Make sure the money has actually been sent back (card / bKash dashboard or cash). The customer will be notified.`}
        confirmText="Yes, record refund"
        cancelText="Go back"
        variant="warning"
        isLoading={saving}
      />
      <ConfirmationModal
        isOpen={confirm === 'approve'}
        onClose={() => setConfirm(null)}
        onConfirm={() => decideReturn('approve')}
        title="Approve this return?"
        message={`Order ${order.orderNumber || order.id} becomes Returned and its items go back in stock.${order.paymentStatus === 'Paid' ? ' The payment will be flagged for a refund.' : ''} The customer gets an email and a notification.`}
        confirmText="Yes, approve"
        cancelText="Go back"
        variant="primary"
        isLoading={saving}
      />
      <ConfirmationModal
        isOpen={confirm === 'reject'}
        onClose={() => setConfirm(null)}
        onConfirm={() => decideReturn('reject')}
        title="Reject this return?"
        message="The order stays delivered. The customer gets your message by email and in their notifications."
        confirmText="Yes, reject"
        cancelText="Go back"
        variant="danger"
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
