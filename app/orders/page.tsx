'use client';

import React, { useState, useEffect } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import { Order } from '@/types';
import { OrderSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Button from '@/components/ui/Button';
import {
  Package,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Clock,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  CreditCard
} from 'lucide-react';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const toast = useToast();
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  
  // Modals / Cancel states
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Selected Order for Timeline
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Result of an online payment (the server already verified it with the gateway)
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search);
      const result = q.get('payment');
      if (result === 'success') toast.success('Payment received. Thank you!');
      else if (result === 'failed') toast.error('Payment was not completed. You can retry with "Pay now".');
      if (result) window.history.replaceState({}, '', '/orders');
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setIsCancelling(true);
    try {
      const response = await apiClient.put(`/orders/${cancellingOrderId}/cancel`);
      if (response.data?.success) {
        toast.success('Order cancelled successfully.');
        setOrders(orders.map((o) => (o.id === cancellingOrderId || (o as any)._id === cancellingOrderId ? { ...o, orderStatus: 'Cancelled' } : o)));
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
      '</div><div style="margin-top:12px"><b>Payment</b>: ' + escapeHtml(String(order.paymentMethod || '').toUpperCase()) +
      ' (' + escapeHtml(order.paymentStatus || 'Pending') + ')</div>' +
      '<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="tot"><div><span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>' +
      (discount > 0 ? '<div><span>Discount' + (order.coupon ? ' (' + escapeHtml(order.coupon) + ')' : '') + '</span><span>-' + money(discount) + '</span></div>' : '') +
      '<div><span>Tax</span><span>' + money(order.tax) + '</span></div><div><span>Shipping</span><span>' + money(order.shipping) + '</span></div>' +
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

  const paymentStyles: Record<string, string> = {
    Paid: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400',
    Failed: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400',
    Pending: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400',
  };
  const methodLabels: Record<string, string> = { cod: 'Cash on Delivery', bkash: 'bKash', card: 'Card' };

  const statusStyles = {
    Confirmed: 'bg-indigo-150 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400',
    Packed: 'bg-cyan-150 border-cyan-200 text-cyan-700 dark:bg-cyan-950/20 dark:border-cyan-900/30 dark:text-cyan-400',
    Returned: 'bg-orange-150 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-400',
    Delivered: 'bg-green-150 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400',
    Shipped: 'bg-blue-150 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400',
    Processing: 'bg-purple-150 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-400',
    Cancelled: 'bg-red-150 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400',
    Pending: 'bg-yellow-150 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <AccountLayout activeTabName="/orders">
      <div className="space-y-6">
        
        {/* Title */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider">
            Order History
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Check the status of your orders, trace shipment timelines, or print invoices.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        ) : loadError ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-text-muted">We could not load your orders right now.</p>
            <Button onClick={fetchOrders} variant="outline" className="rounded-full text-xs font-bold px-6">Try again</Button>
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
          <div className="space-y-6">
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
              const isCancellable = ['Pending', 'Processing', 'Confirmed', 'Packed'].includes(status);

              // Timeline milestones (backend enum: Pending, Processing, Confirmed, Packed, Shipped, Delivered, Cancelled, Returned)
              const steps = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];
              const stepIndexByStatus: Record<string, number> = { Pending: 0, Processing: 1, Confirmed: 1, Packed: 2, Shipped: 3, Delivered: 4 };
              const currentStepIndex = stepIndexByStatus[status] ?? 0;
              const orderDiscount = Math.max(0, Number(((order.subtotal || 0) + (order.shipping || 0) + (order.tax || 0) - order.total).toFixed(2)));

              return (
                <div
                  key={order.id}
                  className="border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] bg-white dark:bg-gray-900 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
                >
                  {/* Summary Bar */}
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-gray-850/30 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                          Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
                          {status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${paymentStyles[paymentStatus] || paymentStyles.Pending}`}>
                          {paymentStatus === 'Paid' ? 'Paid' : paymentStatus === 'Failed' ? 'Payment failed' : 'Payment pending'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Placed on {formattedDate}</span>
                        </div>
                        <span>•</span>
                        <span>{itemsCount} item{itemsCount > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="font-bold text-gray-900 dark:text-white">Total: ${order.total.toFixed(2)}</span>
                        <span>•</span>
                        <span>{methodLabels[order.paymentMethod] || order.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="rounded-full text-[10px] font-black px-4 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-850"
                      >
                        {isExpanded ? 'Hide Details' : 'Track Order'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(order)}
                        className="rounded-full text-[10px] font-black px-4 flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-850"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Invoice
                      </Button>
                      {needsPayment && (
                        <Button
                          size="sm"
                          onClick={() => handlePayNow(order)}
                          disabled={payingOrderId === order.id}
                          className="bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full text-[10px] font-black px-4 flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {payingOrderId === order.id ? 'Redirecting...' : 'Pay now'}
                        </Button>
                      )}
                      {isCancellable && (
                        <Button
                          size="sm"
                          onClick={() => setCancellingOrderId(order.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 rounded-full text-[10px] font-black px-4 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Tracker & Products Details */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 border-t border-gray-100 dark:border-gray-800 animate-slide-down">
                      {/* Live Tracking Timeline */}
                      {status !== 'Cancelled' && status !== 'Returned' && (
                        <div className="space-y-4 max-w-xl mx-auto py-2">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-6">Delivery Progress</h5>
                          <div className="flex items-center justify-between relative">
                            {/* Connector Bar */}
                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-gray-800 z-0" />
                            <div
                              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] z-0 transition-all duration-500"
                              style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                            />

                            {steps.map((step, idx) => {
                              const isCompleted = idx <= currentStepIndex;
                              const isActive = idx === currentStepIndex;
                              
                              return (
                                <div key={step} className="flex flex-col items-center z-10 relative">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                                      isCompleted
                                        ? 'bg-[#8b6f47] border-[#8b6f47] text-white'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                                    } ${isActive ? 'ring-4 ring-[#8b6f47]/20 scale-115' : ''}`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <span className={`text-[9px] font-black uppercase tracking-wider mt-2.5 ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products List */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-text-muted border-b pb-1">
                          Items In This Shipment
                        </h5>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {order.products?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border">
                                  {(item.product?.thumbnail || item.product?.image) && (
                                    <img src={item.product?.thumbnail || item.product?.image} alt={item.product?.title || ''} className="object-cover w-full h-full" />
                                  )}
                                </div>
                                <div>
                                  <h6 className="text-xs font-bold text-gray-950 dark:text-white">
                                    {item.product?.title || 'Item no longer available'}
                                  </h6>
                                  {((item as any).variant?.name || (item as any).variant?.sku) && (
                                    <p className="text-[10px] text-text-muted">{(item as any).variant?.name || (item as any).variant?.sku}</p>
                                  )}
                                  <p className="text-[10px] text-text-muted mt-0.5">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-gray-950 dark:text-white">
                                ${(item.quantity * item.price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Address / Cost Breakdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-[11px] leading-relaxed text-text-muted">
                        <div>
                          <h6 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Shipping Destination</h6>
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
                        <div className="bg-gray-50/50 dark:bg-gray-850/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50 space-y-1.5">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">${(order.subtotal || 0).toFixed(2)}</span>
                          </div>
                          {orderDiscount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>Discount{order.coupon ? ' (' + order.coupon + ')' : ''}:</span>
                              <span className="font-semibold">-${orderDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">${(order.tax || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping fee:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">${(order.shipping || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-gray-250/20 font-bold text-gray-950 dark:text-white text-xs">
                            <span>Grand Total:</span>
                            <span className="text-[#8b6f47] dark:text-[#c9a96b]">${order.total.toFixed(2)}</span>
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
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This will release reserved stock back to the store and trigger a refund. This action is irreversible."
        confirmText="Cancel Order"
        variant="danger"
        isLoading={isCancelling}
      />
    </AccountLayout>
  );
}
