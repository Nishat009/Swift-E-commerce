'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types';
import Input from '@/components/ui/Input';
import { Search } from 'lucide-react';
import OrderDetailModal from './OrderDetailModal';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { useAuditTrail } from './AuditTrailModal';

interface Props {
  /** Order to open as soon as the list loads (from a notification or the wallet statement). */
  focusOrderId?: string | null;
  onFocusHandled?: () => void;
}

/** Every customer order, with return/refund filters and the order detail dialog. */
export default function OrdersAdmin({ focusOrderId, onFocusHandled }: Props) {
  const toast = useToast();
  const { open: fetchAuditTrail, modal: auditTrailModal } = useAuditTrail();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [refundOnly, setRefundOnly] = useState(false);
  const [returnsOnly, setReturnsOnly] = useState(false);
  const [canOverrideStatus, setCanOverrideStatus] = useState(false); // super admin (the server decides)

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/orders/admin/all?limit=500');
    if (res.data?.success) {
      setAllOrders(res.data.data);
      setCanOverrideStatus(Boolean(res.data.canOverrideStatus));
    }
  });

  useEffect(() => {
    if (!focusOrderId) return;
    apiClient
      .get(`/orders/${focusOrderId}`)
      .then((res) => { if (res.data?.success) setSelectedOrder(res.data.data); })
      .catch(() => toast.error('That order could not be found.'))
      .finally(() => onFocusHandled?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusOrderId]);

  const refundsNeededCount = allOrders.filter((o) => o.paymentStatus === 'Refund Needed').length;
  // Return requests waiting on staff (an offer the customer has not answered yet waits on them)
  const RETURN_NEEDS_STAFF = ['Requested', 'Accepted', 'Declined'];
  const RETURN_LABELS: Record<string, string> = { Requested: 'Return requested', Proposed: 'Refund offered', Accepted: 'Offer accepted: pay refund', Declined: 'Offer declined' };
  const returnRequestsCount = allOrders.filter((o) => RETURN_NEEDS_STAFF.includes(o.returnRequest?.status || '')).length;
  const filteredOrders = allOrders.filter(
    (o) =>
      (!refundOnly || o.paymentStatus === 'Refund Needed') &&
      (!returnsOnly || RETURN_NEEDS_STAFF.includes(o.returnRequest?.status || '')) &&
      (String(o.id).includes(orderSearch) ||
      (o.orderNumber || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.user as any)?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.user as any)?.email?.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  return (
    <>
      {loading ? <SectionLoading /> : (
        <div className="space-y-4">
          <div className="border-b pb-3.5 mb-4">
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Placed Customer Orders</h2>
          </div>

          {returnRequestsCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-300">
              <span><strong>{returnRequestsCount}</strong> {returnRequestsCount === 1 ? 'customer is' : 'customers are'} waiting on a return or refund. Open the order to send a refund offer, pay an accepted one, or reject it.</span>
              <button onClick={() => { setReturnsOnly(!returnsOnly); setRefundOnly(false); }} className="font-bold underline">{returnsOnly ? 'Show all orders' : 'Show only return requests'}</button>
            </div>
          )}

          {refundsNeededCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40 px-4 py-2.5 text-xs text-orange-800 dark:text-orange-300">
              <span>
                <strong>{refundsNeededCount}</strong> cancelled or returned {refundsNeededCount === 1 ? 'order needs' : 'orders need'} a refund. Open the order and record the refund.
                {!canOverrideStatus && ' Only a super admin can record refunds (the shared demo admin cannot).'}
              </span>
              <button onClick={() => { setRefundOnly(!refundOnly); setReturnsOnly(false); }} className="font-bold underline">{refundOnly ? 'Show all orders' : 'Show only refunds needed'}</button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search orders by customer name, email, or order ID..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full text-sm pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">No orders found.</td></tr>
                )}
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <button onClick={() => setSelectedOrder(o)} className="font-mono text-[10px] font-bold text-[#8b6f47] hover:underline text-left" title="View order details">
                        {o.orderNumber || o.id}
                      </button>
                      <span className="block text-[9px] text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3">
                      <span className="block font-bold text-gray-800 dark:text-gray-200">{(o.user as any)?.name || 'Deleted user'}</span>
                      <span className="block text-[10px] text-gray-400">{(o.user as any)?.email}</span>
                    </td>
                    <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">${o.total.toFixed(0)}</td>
                    <td className="p-3 uppercase font-bold text-gray-550 text-[10px]">{o.paymentMethod}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                        o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {o.orderStatus}
                      </span>
                      {RETURN_LABELS[o.returnRequest?.status || ''] && (
                        <span className={`block mt-1 w-fit px-2 py-0.5 rounded-full text-[9px] font-bold ${o.returnRequest?.status === 'Proposed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>{RETURN_LABELS[o.returnRequest?.status || '']}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        o.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                        o.paymentStatus === 'Failed' || o.paymentStatus === 'Refund Needed' ? 'bg-red-100 text-red-700' :
                        o.paymentStatus === 'Refunded' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {o.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-[10px] font-bold border border-[#8b6f47]/40 text-[#8b6f47] rounded-lg px-3 py-1.5 hover:bg-[#8b6f47]/10"
                      >
                        {RETURN_NEEDS_STAFF.includes(o.returnRequest?.status || '') ? 'Review return' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          canOverrideStatus={canOverrideStatus}
          onClose={() => setSelectedOrder(null)}
          onUpdated={(updated) => {
            setSelectedOrder(updated);
            setAllOrders((prev) => prev.map((o) => (o.id === updated.id
              ? { ...o, orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus, refund: updated.refund, returnRequest: updated.returnRequest, deliveredAt: updated.deliveredAt }
              : o)));
          }}
          onViewAudit={(id) => fetchAuditTrail('Order', id)}
        />
      )}

      {auditTrailModal}
    </>
  );
}
