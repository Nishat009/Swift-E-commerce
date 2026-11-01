'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountLayout from '@/components/layout/AccountLayout';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import { Order } from '@/types';
import { OrderSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Button from '@/components/ui/Button';
import ReturnRequestModal from '@/components/orders/ReturnRequestModal';
import RefundStatus from '@/components/orders/RefundStatus';
import RefundOfferCard from '@/components/orders/RefundOfferCard';
import StatusPill, { ORDER_STATUS_TONE, PillTone } from '@/components/orders/StatusPill';
import { refreshNotifications } from '@/utils/notifications';
import { Package, FileText, Trash2, CreditCard, RotateCcw } from 'lucide-react';

const RETURN_BADGES: Record<string, { label: string; tone: PillTone }> = {
  Requested: { label: 'Return requested', tone: 'warning' },
  Proposed: { label: 'Refund offer: action needed', tone: 'accent' },
  Accepted: { label: 'Refund on its way', tone: 'success' },
  Declined: { label: 'Offer declined', tone: 'warning' },
  Approved: { label: 'Return approved', tone: 'success' },
  Rejected: { label: 'Return declined', tone: 'danger' },
};

// useSearchParams needs a Suspense boundary in the App Router
export default function OrdersHistoryPage() {
  return (
    <Suspense fallback={<AccountLayout activeTabName="/orders"><OrderSkeleton /></AccountLayout>}>
      <OrdersHistoryContent />
    </Suspense>
  );
}

function OrdersHistoryContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const toast = useToast();
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  
  // Modals / Cancel states
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  
  // Selected Order for Timeline
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Links from notifications / checkout (?order=<id>) open that order's details,
  // also when the user is already on this page
  const searchParams = useSearchParams();
  const focusOrderId = searchParams.get('order');
  useEffect(() => {
    if (!focusOrderId || loading) return;
    if (orders.some((o) => o.id === focusOrderId)) {
      setExpandedOrderId(focusOrderId);
      requestAnimationFrame(() => {
        document.getElementById(`order-${focusOrderId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    window.history.replaceState({}, '', '/orders');
  }, [focusOrderId, loading, orders]);

  const handlePayNow = async (order: Order) => {
    setPayingOrderId(order.id);
    try {
      const res = await apiClient.post(`/payments/orders/${order.id}/initiate`);
      const url = res.data?.data?.redirectUrl;
      if (res.data?.success && url) {
        window.location.href = url;
        return;
      }
      toast.error(res.data?.message || 'Could not start the payment.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start the payment.');
    }
    setPayingOrderId(null);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await apiClient.get('/orders');
      if (response.data?.success) {
        setOrders(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setLoadError(true);
      toast.error('Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Result of an online payment (the server already verified it with the gateway)
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search);
      const result = q.get('payment');
      if (result === 'success') toast.success('Payment received. Thank you!');
      else if (result === 'failed') toast.error('Payment was not completed. You can retry with "Pay now".');
      if (result && !q.get('order')) window.history.replaceState({}, '', '/orders');
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setIsCancelling(true);
    try {
      const response = await apiClient.put(`/orders/${cancellingOrderId}/cancel`);
      if (response.data?.success) {
        toast.success('Order cancelled successfully.');
        // Use the server's answer so a paid order shows "Refund pending" straight away
        const updated = response.data.data;
        setOrders(orders.map((o) => (o.id === cancellingOrderId || (o as any)._id === cancellingOrderId
          ? { ...o, orderStatus: updated?.orderStatus || 'Cancelled', paymentStatus: updated?.paymentStatus || o.paymentStatus, refund: updated?.refund }
          : o)));
        refreshNotifications();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
      setCancellingOrderId(null);
    }
  };

  const escapeHtml = (value: unknown) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

  // Open a printable invoice built from the real order data (use "Save as PDF" in the print dialog)
  const handleDownloadInvoice = (order: Order) => {
    const number = order.orderNumber || order.id.slice(-8).toUpperCase();
    const money = (n: number | undefined) => '$' + Number(n || 0).toFixed(2);
    const discount = Math.max(0, Number(((order.subtotal || 0) + (order.shipping || 0) + (order.tax || 0) - order.total).toFixed(2)));
    const addr = order.shippingAddress;
    const rows = (order.products || [])
      .map((item) => {
        const variant = (item as any).variant?.name || (item as any).variant?.sku || '';
        return '<tr><td>' + escapeHtml(item.product?.title || 'Item no longer available') +
          (variant ? '<br><small>' + escapeHtml(variant) + '</small>' : '') +
          '</td><td class="r">' + item.quantity + '</td><td class="r">' + money(item.price) +
          '</td><td class="r">' + money(item.quantity * item.price) + '</td></tr>';
      })
      .join('');
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>Invoice ' + escapeHtml(number) + '</title><style>' +
      'body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:40px;font-size:13px}h1{font-size:24px;margin:0}' +
      '.top{display:flex;justify-content:space-between;border-bottom:2px solid #8b6f47;padding-bottom:16px;margin-bottom:24px}' +
      'table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}' +
      '.r{text-align:right}.tot{margin-left:auto;width:260px;margin-top:16px}.tot div{display:flex;justify-content:space-between;padding:3px 0}' +
      '.grand{font-weight:bold;font-size:15px;border-top:2px solid #222;margin-top:6px;padding-top:6px!important}small{color:#666}' +
      '</style></head><body><div class="top"><div><h1>SwiftCart</h1><div>Invoice</div></div><div class="r"><div><b>Order #' + escapeHtml(number) +
      '</b></div><div>Date: ' + escapeHtml(new Date(order.createdAt).toLocaleDateString()) +
      '</div><div>Status: ' + escapeHtml(order.orderStatus || 'Pending') +
      '</div></div></div><div><b>Ship to</b><br>' +
      (addr ? escapeHtml(addr.street) + '<br>' + escapeHtml(addr.city) + ', ' + escapeHtml(addr.state) + ' ' + escapeHtml(addr.zipCode) + '<br>' + escapeHtml(addr.country) : 'N/A') +
      '</div>' + (order.deliveryZone ? '<div style="margin-top:12px"><b>Delivery</b>: ' + escapeHtml(zoneLabels[order.deliveryZone] || '') + '</div>' : '') +
      '<div style="margin-top:12px"><b>Payment</b>: ' + escapeHtml(String(order.paymentMethod || '').toUpperCase()) +
      ' (' + escapeHtml(order.paymentStatus || 'Pending') + ')</div>' +
      (order.paymentStatus === 'Refunded' && order.refund?.at ? '<div style="margin-top:6px"><b>Refunded</b>: ' + money(order.refund.amount) + ' on ' + escapeHtml(new Date(order.refund.at).toLocaleDateString()) + '</div>' : '') +
      '<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="tot"><div><span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>' +
      (discount > 0 ? '<div><span>Discount' + (order.coupon ? ' (' + escapeHtml(order.coupon) + ')' : '') + '</span><span>-' + money(discount) + '</span></div>' : '') +
      '<div><span>Tax</span><span>' + money(order.tax) + '</span></div><div><span>' + (order.deliveryZone ? 'Delivery (' + escapeHtml(zoneLabels[order.deliveryZone] || '') + ')' : 'Shipping') + '</span><span>' + money(order.shipping) + '</span></div>' +
      '<div class="grand"><span>Total</span><span>' + money(order.total) + '</span></div></div>' +
      '<p style="margin-top:40px;color:#666">Thank you for shopping with SwiftCart.</p></body></html>';

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      toast.error('Please allow pop-ups to view your invoice.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const paymentTones: Record<string, PillTone> = {
    Paid: 'success',
    Failed: 'danger',
    Pending: 'warning',
    'Refund Needed': 'warning',
    Refunded: 'neutral',
  };
  const methodLabels: Record<string, string> = { cod: 'Cash on Delivery', bkash: 'bKash', card: 'Card' };
  const zoneLabels: Record<string, string> = { inside_dhaka: 'Inside Dhaka', outside_dhaka: 'Outside Dhaka' };

  const textLink = 'text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink';
  const eyebrow = 'text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400';

  return (
    <AccountLayout activeTabName="/orders">
      <div>

        {/* Title */}
        <div className="border-b border-line pb-5">
          <h2 className="text-2xl font-serif font-medium tracking-tight text-ink">
            Order History
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
            Check the status of your orders, trace shipment timelines, or print invoices.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div>
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        ) : loadError ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">We could not load your orders right now.</p>
            <Button onClick={fetchOrders} variant="outline">Try again</Button>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="You have not placed any orders yet. Explore our products and place your first order!"
            actionText="Browse Products"
            actionLink="/products"
          />
        ) : (
          <div className="divide-y divide-line">
            {orders.map((order) => {
              const status = order.orderStatus || 'Pending';
              const isExpanded = expandedOrderId === order.id;
              const formattedDate = new Date(order.createdAt).toLocaleDateString();
              const itemsCount = order.products ? order.products.reduce((acc, p) => acc + p.quantity, 0) : 0;
              const paymentStatus = order.paymentStatus || 'Pending';
              const needsPayment =
                (order.paymentMethod === 'bkash' || order.paymentMethod === 'card') &&
                paymentStatus !== 'Paid' &&
                !['Cancelled', 'Returned'].includes(status);
              const isCancellable = ['Pending', 'Processing', 'Confirmed'].includes(status); // same rule as the server
              const returnDeadline = order.returnDeadline ? new Date(order.returnDeadline) : null;
              const returnStatus = order.returnRequest?.status || '';
              const canRequestReturn = status === 'Delivered' && !returnStatus && !!returnDeadline && returnDeadline > new Date();

              // Timeline milestones (backend enum: Pending, Processing, Confirmed, Packed, Shipped, Delivered, Cancelled, Returned)
              // Every open status has its own step, so the bar always matches the real status
              const steps = ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
              const stepIndexByStatus: Record<string, number> = { Pending: 0, Processing: 1, Confirmed: 2, Packed: 3, Shipped: 4, Delivered: 5 };
              const currentStepIndex = stepIndexByStatus[status] ?? 0;
              const orderDiscount = Math.max(0, Number(((order.subtotal || 0) + (order.shipping || 0) + (order.tax || 0) - order.total).toFixed(2)));
              const thumbs = (order.products || []).slice(0, 3);

              return (
                <div key={order.id} id={`order-${order.id}`} className="scroll-mt-28 py-7">
                  {/* Summary */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="flex gap-4 min-w-0">
                      <div className="flex -space-x-3 shrink-0">
                        {thumbs.length === 0 ? (
                          <div className="w-14 aspect-[3/4] rounded-sm bg-surface-muted border border-line" />
                        ) : (
                          thumbs.map((item, i) => (
                            <div key={i} className="w-14 aspect-[3/4] rounded-sm overflow-hidden bg-surface-muted border-2 border-paper">
                              {(item.product?.thumbnail || item.product?.image) && (
                                <img src={item.product?.thumbnail || item.product?.image} alt={item.product?.title || ''} className="object-cover w-full h-full" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-ink tabular-nums">
                          Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <StatusPill tone={ORDER_STATUS_TONE[status] || 'neutral'}>{status}</StatusPill>
                          <StatusPill tone={paymentTones[paymentStatus] || 'warning'}>
                            {paymentStatus === 'Paid' ? 'Paid' : paymentStatus === 'Failed' ? 'Payment failed' : paymentStatus === 'Refund Needed' ? 'Refund pending' : paymentStatus === 'Refunded' ? 'Refunded' : 'Payment pending'}
                          </StatusPill>
                          {RETURN_BADGES[returnStatus] && (
                            <StatusPill tone={RETURN_BADGES[returnStatus].tone}>{RETURN_BADGES[returnStatus].label}</StatusPill>
                          )}
                        </div>
                        <p className="mt-2.5 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                          Placed {formattedDate} &middot; {itemsCount} item{itemsCount > 1 ? 's' : ''} &middot; {methodLabels[order.paymentMethod] || order.paymentMethod}
                        </p>
                        <p className="mt-1 text-sm tabular-nums font-medium text-ink">Total ${order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 md:justify-end md:max-w-md">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        {isExpanded ? 'Hide Details' : 'Track Order'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(order)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Invoice
                      </Button>
                      {needsPayment && (
                        <Button
                          size="sm"
                          onClick={() => handlePayNow(order)}
                          disabled={payingOrderId === order.id}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {payingOrderId === order.id ? 'Redirecting...' : 'Pay now'}
                        </Button>
                      )}
                      {canRequestReturn && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReturningOrder(order)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Return / refund
                        </Button>
                      )}
                      {isCancellable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancellingOrderId(order.id)}
                          className="border-red-300 text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-white dark:border-red-900 dark:text-red-400 dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancel order
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Tracker & Products Details */}
                  {isExpanded && (
                    <div className="mt-7 pt-7 space-y-7 border-t border-line animate-slide-down">
                      {/* Closed orders: say so clearly, with the refund state for paid orders */}
                      {(status === 'Cancelled' || status === 'Returned') && (
                        <div className="rounded-lg border border-line bg-surface-muted p-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                          <p className="font-medium text-ink mb-1">Order {status.toLowerCase()}</p>
                          <p>
                            {status === 'Cancelled' ? 'This order was cancelled and will not be delivered.' : 'This order was returned and its items are back with us.'}
                            {(paymentStatus === 'Pending' || paymentStatus === 'Failed') && ' Nothing was charged, so there is nothing to refund.'}
                          </p>
                        </div>
                      )}

                      {/* Return window for delivered orders */}
                      {status === 'Delivered' && !returnStatus && returnDeadline && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4 text-sm text-stone-600 dark:text-stone-300">
                          {canRequestReturn ? (
                            <>
                              <span>Not quite right? You can request a return or refund until <strong className="font-medium text-ink">{returnDeadline.toLocaleDateString()}</strong>.</span>
                              <button onClick={() => setReturningOrder(order)} className={`${textLink} cursor-pointer`}>Start a return</button>
                            </>
                          ) : (
                            <span>The return window for this order ended on {returnDeadline.toLocaleDateString()}. Need help? <a href="/contact" className={textLink}>Contact us</a>.</span>
                          )}
                        </div>
                      )}

                      <RefundOfferCard
                        order={order}
                        onUpdated={(updated) => setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, returnRequest: updated.returnRequest } : o)))}
                      />
                      <RefundStatus order={order} />

                      {/* Live Tracking Timeline */}
                      {status !== 'Cancelled' && status !== 'Returned' && (
                        <div className="max-w-xl mx-auto w-full">
                          <h5 className={`${eyebrow} text-center mb-6`}>Delivery Progress</h5>
                          <div className="flex items-start justify-between relative">
                            {/* Connector Bar */}
                            <div className="absolute left-3 right-3 top-3 h-px bg-line z-0" />
                            <div
                              className="absolute left-3 top-3 h-px bg-ink z-0 transition-all duration-500"
                              style={{ width: `calc((100% - 1.5rem) * ${Math.max(0, currentStepIndex) / (steps.length - 1)})` }}
                            />

                            {steps.map((step, idx) => {
                              const isCompleted = idx <= currentStepIndex;
                              const isActive = idx === currentStepIndex;

                              return (
                                <div key={step} className="flex flex-col items-center z-10 relative w-6">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] tabular-nums transition-colors ${
                                      isCompleted
                                        ? 'bg-ink border-ink text-paper'
                                        : 'bg-paper border-line text-stone-400'
                                    } ${isActive ? 'ring-4 ring-ink/10' : ''}`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <span className={`text-[11px] mt-2.5 ${isCompleted ? 'text-ink font-medium' : 'text-stone-400'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products List */}
                      <div>
                        <h5 className={`${eyebrow} border-b border-line pb-3`}>
                          Items In This Shipment
                        </h5>
                        <div className="divide-y divide-line">
                          {order.products?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-4 gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="relative w-14 aspect-[3/4] shrink-0 bg-surface-muted rounded-sm overflow-hidden">
                                  {(item.product?.thumbnail || item.product?.image) && (
                                    <img src={item.product?.thumbnail || item.product?.image} alt={item.product?.title || ''} className="object-cover w-full h-full" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h6 className="text-sm font-medium text-ink">
                                    {item.product?.title || 'Item no longer available'}
                                  </h6>
                                  {((item as any).variant?.name || (item as any).variant?.sku) && (
                                    <p className="text-xs text-stone-500 dark:text-stone-400">{(item as any).variant?.name || (item as any).variant?.sku}</p>
                                  )}
                                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-medium tabular-nums text-ink">
                                ${(item.quantity * item.price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Address / Cost Breakdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                        <div>
                          <h6 className={`${eyebrow} mb-3`}>Shipping Destination</h6>
                          {order.shippingAddress ? (
                            <p>
                              {order.shippingAddress.street}<br />
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                              {order.shippingAddress.country}
                            </p>
                          ) : (
                            <p>No address info.</p>
                          )}
                        </div>
                        <div className="space-y-2 tabular-nums">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="text-ink">${(order.subtotal || 0).toFixed(2)}</span>
                          </div>
                          {orderDiscount > 0 && (
                            <div className="flex justify-between text-green-700 dark:text-green-400">
                              <span>Discount{order.coupon ? ' (' + order.coupon + ')' : ''}</span>
                              <span>-${orderDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Tax</span>
                            <span className="text-ink">${(order.tax || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping fee{order.deliveryZone ? ` (${zoneLabels[order.deliveryZone]})` : ''}</span>
                            <span className="text-ink">${(order.shipping || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-3 border-t border-line font-medium text-ink">
                            <span>Grand Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancellingOrderId !== null}
        onClose={() => setCancellingOrderId(null)}
        onConfirm={handleCancelOrder}
        title="Cancel this order?"
        message="The items go back on sale and, if you already paid online, your payment is refunded. A cancelled order can't be restored."
        confirmText="Yes, cancel order"
        cancelText="Keep order"
        variant="danger"
        isLoading={isCancelling}
      />

      {returningOrder && (
        <ReturnRequestModal
          order={returningOrder}
          onClose={() => setReturningOrder(null)}
          onSubmitted={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, returnRequest: updated.returnRequest } : o)));
            setExpandedOrderId(updated.id);
            setReturningOrder(null);
          }}
        />
      )}
    </AccountLayout>
  );
}
