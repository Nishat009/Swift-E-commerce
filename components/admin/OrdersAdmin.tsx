'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types';
import { Download, ShoppingBag } from 'lucide-react';
import OrderDetailModal from './OrderDetailModal';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { useAuditTrail } from './AuditTrailModal';
import { downloadCsv } from './adminUtils';
import { AdminButton, AdminEmpty, FilterTabs, Pill, SearchField, StatusPill, table } from './AdminUI';

interface Props {
  /** Order to open as soon as the list loads (from a notification or the wallet statement). */
  focusOrderId?: string | null;
  onFocusHandled?: () => void;
}

// Return requests waiting on staff (an offer the customer has not answered yet waits on them)
const RETURN_NEEDS_STAFF = ['Requested', 'Accepted', 'Declined'];
const RETURN_LABELS: Record<string, string> = { Requested: 'Return requested', Proposed: 'Refund offered', Accepted: 'Offer accepted: pay refund', Declined: 'Offer declined' };
const STATUS_FILTERS = ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

type Filter = 'all' | 'refunds' | 'returns' | (typeof STATUS_FILTERS)[number];

/** Every customer order, with status and return/refund filters and the order detail dialog. */
export default function OrdersAdmin({ focusOrderId, onFocusHandled }: Props) {
  const toast = useToast();
  const { open: fetchAuditTrail, modal: auditTrailModal } = useAuditTrail();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
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

  const needsRefund = (o: Order) => o.paymentStatus === 'Refund Needed';
  const needsReturnAction = (o: Order) => RETURN_NEEDS_STAFF.includes(o.returnRequest?.status || '');
  const refundsNeededCount = allOrders.filter(needsRefund).length;
  const returnRequestsCount = allOrders.filter(needsReturnAction).length;

  const q = orderSearch.trim().toLowerCase();
  const filteredOrders = allOrders.filter(
    (o) =>
      (filter === 'all' ||
        (filter === 'refunds' && needsRefund(o)) ||
        (filter === 'returns' && needsReturnAction(o)) ||
        o.orderStatus === filter) &&
      (!q ||
        String(o.id).toLowerCase().includes(q) ||
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.user as any)?.name?.toLowerCase().includes(q) ||
        (o.user as any)?.email?.toLowerCase().includes(q))
  );

  const filterOptions: { value: Filter; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: allOrders.length },
    ...(returnRequestsCount > 0 ? [{ value: 'returns' as Filter, label: 'Return requests', count: returnRequestsCount }] : []),
    ...(refundsNeededCount > 0 ? [{ value: 'refunds' as Filter, label: 'Needs refund', count: refundsNeededCount }] : []),
    ...STATUS_FILTERS.map((s) => ({ value: s as Filter, label: s, count: allOrders.filter((o) => o.orderStatus === s).length })).filter((o) => o.count > 0),
  ];

  const exportCsv = () => {
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Order', 'Date', 'Customer', 'Email', 'Payment method', 'Status', 'Payment', 'Total (USD)'],
      ...filteredOrders.map((o) => [
        o.orderNumber || o.id,
        new Date(o.createdAt).toISOString().slice(0, 10),
        (o.user as any)?.name || '',
        (o.user as any)?.email || '',
        o.paymentMethod,
        o.orderStatus,
        o.paymentStatus || 'Pending',
        o.total.toFixed(2),
      ]),
    ]);
  };

  return (
    <>
      {loading ? <SectionLoading /> : (
        <div className="space-y-4">
          {(returnRequestsCount > 0 || refundsNeededCount > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              {returnRequestsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter(filter === 'returns' ? 'all' : 'returns')}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors cursor-pointer ${filter === 'returns' ? 'border-amber-400 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-400/10' : 'border-amber-200 bg-amber-50/60 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'}`}
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-xs font-semibold text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">{returnRequestsCount}</span>
                  <span className="text-amber-900 dark:text-amber-200">
                    <strong className="font-semibold">{returnRequestsCount === 1 ? 'Return request needs' : 'Return requests need'} a reply.</strong>{' '}
                    <span className="text-amber-800/80 dark:text-amber-300/80">Send a refund offer, pay an accepted one, or reject it. {filter === 'returns' ? 'Click to show all orders.' : 'Click to filter.'}</span>
                  </span>
                </button>
              )}
              {refundsNeededCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter(filter === 'refunds' ? 'all' : 'refunds')}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors cursor-pointer ${filter === 'refunds' ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-400/10' : 'border-red-200 bg-red-50/60 hover:bg-red-50 dark:border-red-900/40 dark:bg-red-950/20'}`}
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-red-200/70 text-xs font-semibold text-red-900 dark:bg-red-400/20 dark:text-red-200">{refundsNeededCount}</span>
                  <span className="text-red-900 dark:text-red-200">
                    <strong className="font-semibold">Cancelled or returned {refundsNeededCount === 1 ? 'order needs' : 'orders need'} a refund.</strong>{' '}
                    <span className="text-red-800/80 dark:text-red-300/80">
                      Open the order and record the refund.{!canOverrideStatus && ' Only a super admin can record refunds (the shared demo admin cannot).'}
                    </span>
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <FilterTabs options={filterOptions} value={filter} onChange={setFilter} className="xl:max-w-[60%]" />
            <div className="flex items-center gap-2">
              <SearchField value={orderSearch} onChange={setOrderSearch} placeholder="Search by order, customer or email" className="w-full xl:w-72" />
              <AdminButton onClick={exportCsv} disabled={filteredOrders.length === 0} title="Download the orders shown as a CSV file">
                <Download className="size-4" /> <span className="hidden sm:inline">Export</span>
              </AdminButton>
            </div>
          </div>

          <div className={`${table.wrap} max-h-[640px] overflow-y-auto`}>
            <table className={table.table}>
              <thead className={`${table.thead} sticky top-0 z-10`}>
                <tr>
                  <th className={table.th}>Order</th>
                  <th className={table.th}>Customer</th>
                  <th className={table.th}>Method</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}>Payment</th>
                  <th className={`${table.th} text-right`}>Total</th>
                  <th className={table.th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className={table.tbody}>
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <AdminEmpty icon={ShoppingBag} title="No orders found" description={q || filter !== 'all' ? 'Try a different search or filter.' : 'New orders will appear here.'} />
                    </td>
                  </tr>
                )}
                {filteredOrders.map((o) => (
                  <tr key={o.id} className={table.tr}>
                    <td className={table.td}>
                      <button onClick={() => setSelectedOrder(o)} className="block text-left font-mono text-xs font-medium text-stone-900 hover:text-[#8b6f47] hover:underline dark:text-stone-100 dark:hover:text-[#c9a96b] cursor-pointer" title="View order details">
                        {o.orderNumber || o.id}
                      </button>
                      <span className="text-[11px] text-stone-400">{new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </td>
                    <td className={table.td}>
                      <span className="block font-medium text-stone-800 dark:text-stone-200">{(o.user as any)?.name || 'Deleted user'}</span>
                      <span className="block text-xs text-stone-400">{(o.user as any)?.email}</span>
                    </td>
                    <td className={`${table.td} text-xs uppercase text-stone-500`}>{o.paymentMethod}</td>
                    <td className={table.td}>
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill status={o.orderStatus} />
                        {RETURN_LABELS[o.returnRequest?.status || ''] && (
                          <Pill tone={o.returnRequest?.status === 'Proposed' ? 'info' : 'warning'}>{RETURN_LABELS[o.returnRequest?.status || '']}</Pill>
                        )}
                      </div>
                    </td>
                    <td className={table.td}><StatusPill kind="payment" status={o.paymentStatus} /></td>
                    <td className={`${table.td} text-right font-medium tabular-nums text-stone-900 dark:text-white`}>${o.total.toFixed(2)}</td>
                    <td className={`${table.td} text-right`}>
                      <AdminButton size="sm" variant={needsReturnAction(o) ? 'primary' : 'secondary'} onClick={() => setSelectedOrder(o)}>
                        {needsReturnAction(o) ? 'Review return' : 'Manage'}
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-500">Showing {filteredOrders.length} of {allOrders.length} orders</p>
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
